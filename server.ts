import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GeminiInterrogationService } from './src/services/geminiInterrogationService.js';
import { CANONICAL_CASE, INITIAL_KABIR_MALHOTRA, CANONICAL_EVIDENCE } from './src/data/canonicalCaseData.js';
import { SessionStore } from './src/services/sessionStore.js';
import { ContradictionEngine } from './src/engine/contradictionEngine.js';
import { AnimationMapper } from './src/services/animationMapper.js';
import {
  GodotInterrogationTurnResponse,
  GodotMemoryRecord,
  PublicContradictionDTO,
  SafeDiagnosticsDTO,
} from './src/types/godotApiTypes.js';
import { getAuthoritativeGeminiModel } from './src/config/modelConfig.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createServer(skipVite = false) {
  const app = express();
  const PORT = process.env.NODE_ENV === 'production' ? (Number(process.env.PORT) || 8080) : 3000;

  app.use(express.json());

  // Health / Config endpoint
  app.get('/api/health', (req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    res.json({
      status: 'ok',
      hasGeminiKey: hasKey,
      model: getAuthoritativeGeminiModel(),
      modeDefault: hasKey ? 'gemini' : 'mock',
      suspect: 'Kabir Malhotra',
      caseId: CANONICAL_CASE.caseId,
      canonicalGuardsActive: true,
      stage: 'Stage 3 - Godot Bridge + Multi-Turn Contradiction Engine',
    });
  });

  // Session Query Endpoint (Strict Public DTO - No secrets or internal logic exposed)
  app.get('/api/interrogation/session/:sessionId?', (req, res) => {
    const sessionId = req.params.sessionId || req.query.sessionId as string || SessionStore.DEFAULT_SESSION_ID;
    const session = SessionStore.getOrCreateSession(sessionId);

    // Sanitize conversation history: omit internalMonologue
    const safeHistory = session.conversationHistory.map(turn => ({
      turnNumber: turn.turnNumber,
      turnId: turn.turnId,
      speaker: turn.speaker,
      text: turn.text,
      timestamp: turn.timestamp,
      evidencePresented: turn.evidencePresented,
      isContradictionHit: turn.isContradictionHit,
    }));

    // Sanitize contradictions: omit canonicalResolution
    const safeContradictions: PublicContradictionDTO[] = session.contradictions.map(c => ({
      id: c.id,
      type: c.type,
      severity: c.severity,
      claims: c.claims,
      discovered: c.discovered,
      stressImpact: c.stressImpact,
      evidenceId: c.evidenceId,
      discoveredAtTurn: c.discoveredAtTurn,
    }));

    res.json({
      sessionId: session.sessionId,
      suspectId: session.suspectId,
      turnCount: session.turnCount,
      conversationHistory: safeHistory,
      contradictions: safeContradictions,
      evidencePresented: session.evidencePresented,
      playerDiscoveries: session.playerDiscoveries,
      memoriesCreated: session.memoriesCreated,
    });
  });

  // Session Reset Endpoint
  app.post('/api/interrogation/session/reset', (req, res) => {
    const sessionId = req.body.sessionId || SessionStore.DEFAULT_SESSION_ID;
    const session = SessionStore.resetSession(sessionId);
    const safeContradictions: PublicContradictionDTO[] = session.contradictions.map(c => ({
      id: c.id,
      type: c.type,
      severity: c.severity,
      claims: c.claims,
      discovered: c.discovered,
      stressImpact: c.stressImpact,
      evidenceId: c.evidenceId,
      discoveredAtTurn: c.discoveredAtTurn,
    }));
    res.json({
      status: 'reset_successful',
      sessionId: session.sessionId,
      turnCount: session.turnCount,
      contradictions: safeContradictions,
    });
  });

  // Contradiction Graph Inspection Endpoint
  app.get('/api/interrogation/contradictions', (req, res) => {
    const sessionId = req.query.sessionId as string || SessionStore.DEFAULT_SESSION_ID;
    const session = SessionStore.getOrCreateSession(sessionId);
    const safeContradictions: PublicContradictionDTO[] = session.contradictions.map(c => ({
      id: c.id,
      type: c.type,
      severity: c.severity,
      claims: c.claims,
      discovered: c.discovered,
      stressImpact: c.stressImpact,
      evidenceId: c.evidenceId,
      discoveredAtTurn: c.discoveredAtTurn,
    }));
    res.json({
      sessionId: session.sessionId,
      contradictions: safeContradictions,
    });
  });

  // Interrogation Turn Endpoint (Godot 4.x HTTP Bridge & React UI)
  app.post('/api/interrogation/turn', async (req, res) => {
    try {
      const {
        sessionId: reqSessionId,
        suspectId: reqSuspectId,
        playerText,
        suspectState,
        attachedEvidenceId,
        evidenceId,
        recentHistory,
        mode,
      } = req.body;

      if (!playerText || typeof playerText !== 'string') {
        return res.status(400).json({ error: 'playerText is required' });
      }

      // 1. Authoritative Session Retrieval
      const sessionId = reqSessionId || SessionStore.DEFAULT_SESSION_ID;
      const suspectId = reqSuspectId || 'kabir-malhotra';
      const session = SessionStore.getOrCreateSession(sessionId, suspectId);

      // Suspect is authoritative on server; if client passes suspectState with updated memories/stress, synchronize
      const suspect = session.suspect;
      if (suspectState && suspectState.emotionalState && !reqSessionId) {
        suspect.emotionalState = suspectState.emotionalState;
      }

      const activeEvidenceId = attachedEvidenceId || evidenceId;
      const attachedEvidence = activeEvidenceId
        ? CANONICAL_EVIDENCE.find(e => e.id === activeEvidenceId)
        : undefined;

      const forceMock = mode === 'mock' || !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY';

      // 2. Structured Contradiction Engine Evaluation
      const contradictionEval = ContradictionEngine.evaluate(
        playerText,
        session.contradictions,
        activeEvidenceId,
        attachedEvidence
      );

      // 3. Multi-turn Session Memory Context
      const turnHistory = session.conversationHistory.slice(-8).map(t => ({
        speaker: t.speaker,
        text: t.text,
        turnNumber: t.turnNumber,
      }));

      // Combine client provided history if session history is empty
      const effectiveHistory = turnHistory.length > 0
        ? turnHistory
        : (recentHistory || []).slice(-6);

      // 4. Execute Interrogation Turn via Gemini with Contradiction Context
      const serviceResult = await GeminiInterrogationService.executeTurn(
        playerText,
        suspect,
        attachedEvidence,
        effectiveHistory,
        forceMock,
        session.contradictions,
        session.memoriesCreated
      );

      const engineResponse = serviceResult.response;

      // If contradiction engine caught a new contradiction, ensure response reflects it
      let finalContradiction = contradictionEval.contradiction;
      if (contradictionEval.isNewDiscovery && contradictionEval.contradiction) {
        engineResponse.isContradiction = true;
        engineResponse.stressDelta = Math.max(engineResponse.stressDelta, contradictionEval.stressDelta);
      }

      // Synchronize updated emotional state to session suspect
      suspect.emotionalState = engineResponse.newEmotionalState;
      suspect.memories.unshift(engineResponse.memoryCreated);

      // 5. Deterministic Animation Mapping for Godot
      const animationState = AnimationMapper.mapToAnimationState(
        engineResponse.newEmotionalState,
        engineResponse.isContradiction,
        engineResponse.intentDetected,
        engineResponse.isRefusal
      );

      // 6. Deterministic Suggested Action
      const suggestedAction = AnimationMapper.deriveSuggestedAction(
        engineResponse.newEmotionalState.stressIndex,
        engineResponse.isContradiction,
        session.contradictions.filter(c => c.discovered).length,
        session.evidencePresented.length
      );

      // 7. Structured Godot Memory Records
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const newGodotMemories: GodotMemoryRecord[] = [
        {
          id: `mem-${Date.now()}-npc`,
          type: engineResponse.isContradiction ? 'contradiction_exposed' : 'npc_statement',
          summary: engineResponse.memoryCreated.topic,
          turnNumber: session.turnCount + 2,
          timestamp: timeStr,
          significance: engineResponse.memoryCreated.significance,
          associatedClaim: finalContradiction?.claims[0]?.claim,
          contradictionId: finalContradiction?.id,
        },
      ];

      // 8. Record turn in Authoritative Session Store
      SessionStore.recordTurn(
        session,
        playerText,
        engineResponse.spokenDialogue,
        engineResponse.internalMonologue,
        engineResponse.stressDelta,
        engineResponse.isContradiction,
        engineResponse.intentDetected,
        activeEvidenceId,
        engineResponse.concessionUnlocked,
        finalContradiction,
        newGodotMemories,
        serviceResult.rawInformationRevealed || []
      );

      // Map contradiction to strict public DTO (stripping canonicalResolution and internal IDs)
      const publicContradiction: PublicContradictionDTO | null = finalContradiction
        ? {
            id: finalContradiction.id,
            type: finalContradiction.type,
            severity: finalContradiction.severity,
            claims: finalContradiction.claims.map(c => ({
              source: c.source,
              claim: c.claim,
            })),
            discovered: finalContradiction.discovered,
            stressImpact: finalContradiction.stressImpact,
            evidenceId: finalContradiction.evidenceId,
            discoveredAtTurn: finalContradiction.discoveredAtTurn,
          }
        : null;

      // Safe operational diagnostics only (no internal secrets, prompt dumps, or error traces)
      const safeDiagnostics: SafeDiagnosticsDTO = {
        modelUsed: String(serviceResult.diagnostics?.modelUsed || 'gemini-3.8-flash'),
        validationPassed: serviceResult.diagnostics?.validationPassed !== false,
        fallbackActive: serviceResult.modeUsed === 'mock',
        warning: serviceResult.diagnostics?.warning,
      };

      // 9. Formulate Strict Public Response DTO
      // Only Allowed Fields:
      // turnId, sessionId, suspectId, spokenResponse, emotion, informationRevealed,
      // memoryCreated, evidenceReaction, contradiction, suggestedAction, animationState, modeUsed, diagnostics
      const publicResponse: GodotInterrogationTurnResponse = {
        turnId: `turn-${Date.now()}-${session.turnCount}`,
        sessionId: session.sessionId,
        suspectId: session.suspectId,
        spokenResponse: engineResponse.spokenDialogue,
        emotion: {
          state: engineResponse.newEmotionalState.posture.toLowerCase(),
          stress: engineResponse.newEmotionalState.stressIndex,
          composure: engineResponse.newEmotionalState.composure,
          suspicion: engineResponse.newEmotionalState.defensiveness,
        },
        informationRevealed: (serviceResult.rawInformationRevealed || []).map(info => ({
          factId: String(info.factId),
          importance: String(info.importance),
        })),
        memoryCreated: newGodotMemories.map(m => ({
          id: m.id,
          type: m.type,
          summary: m.summary,
          turnNumber: m.turnNumber,
          timestamp: m.timestamp,
          significance: m.significance,
          associatedClaim: m.associatedClaim,
          contradictionId: m.contradictionId,
        })),
        evidenceReaction: attachedEvidence
          ? {
              reaction: engineResponse.newEmotionalState.stressIndex > 70 ? 'fear' : 'defensive',
              evidenceId: attachedEvidence.id,
            }
          : null,
        contradiction: publicContradiction,
        suggestedAction,
        animationState,
        modeUsed: serviceResult.modeUsed,
        diagnostics: safeDiagnostics,
      };

      res.json(publicResponse);
    } catch (err: any) {
      console.error('[server] Error handling /api/interrogation/turn:', err);
      res.status(500).json({
        error: 'Internal interrogation server error',
        message: err?.message || String(err),
      });
    }
  });

  // In production, serve dist. In development, mount Vite middleware unless skipVite.
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else if (!skipVite) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  return { app, PORT };
}

// Start standalone only if executed directly as script
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain && process.env.NODE_ENV !== 'test') {
  createServer().then(({ app, PORT }) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[AI Detective] Server listening on http://0.0.0.0:${PORT}`);
    });
  });
}
