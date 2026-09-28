import { NpcCharacter, PlayerKnowledgeState } from '../types/gameTypes';
import { GodotContradictionRecord, GodotMemoryRecord } from '../types/godotApiTypes';
import { INITIAL_KABIR_MALHOTRA, INITIAL_TRANSCRIPT_KABIR } from '../data/canonicalCaseData';
import { ContradictionEngine } from '../engine/contradictionEngine';

export interface SessionTurnRecord {
  turnNumber: number;
  turnId: string;
  speaker: string;
  text: string;
  timestamp: string;
  internalMonologue?: string;
  evidencePresented?: string;
  isContradictionHit?: boolean;
  emotionalDelta?: number;
  intentDetected?: string;
}

export interface InterrogationSession {
  sessionId: string;
  suspectId: string;
  suspect: NpcCharacter;
  conversationHistory: SessionTurnRecord[];
  contradictions: GodotContradictionRecord[];
  evidencePresented: string[];
  questionsAsked: string[];
  informationAlreadyRevealed: Array<{ factId: string; importance: string; turnNumber: number }>;
  playerDiscoveries: PlayerKnowledgeState;
  memoriesCreated: GodotMemoryRecord[];
  turnCount: number;
  createdAt: string;
  lastUpdated: string;
}

export class SessionStore {
  private static sessions: Map<string, InterrogationSession> = new Map();
  public static readonly DEFAULT_SESSION_ID = 'case-001-session-001';

  /**
   * Retrieves an existing session or initializes a fresh authoritative session
   */
  public static getOrCreateSession(sessionId?: string, suspectId?: string): InterrogationSession {
    const sid = sessionId?.trim() || this.DEFAULT_SESSION_ID;
    const existing = this.sessions.get(sid);
    if (existing) {
      return existing;
    }

    return this.initializeSession(sid, suspectId || 'kabir-malhotra');
  }

  /**
   * Directly get session by ID if it exists
   */
  public static getSession(sessionId: string): InterrogationSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Initializes a fresh session with canonical NPC data and contradiction graph
   */
  public static initializeSession(sessionId: string, suspectId: string = 'kabir-malhotra'): InterrogationSession {
    const suspectClone: NpcCharacter = JSON.parse(JSON.stringify(INITIAL_KABIR_MALHOTRA));
    const now = new Date().toISOString();

    const initialHistory: SessionTurnRecord[] = INITIAL_TRANSCRIPT_KABIR.map(t => ({
      turnNumber: t.turnNumber,
      turnId: t.id,
      speaker: t.speaker,
      text: t.text,
      timestamp: t.timestamp,
      internalMonologue: t.internalMonologue,
      intentDetected: t.intentDetected,
      emotionalDelta: t.emotionalDelta,
    }));

    const session: InterrogationSession = {
      sessionId,
      suspectId,
      suspect: suspectClone,
      conversationHistory: initialHistory,
      contradictions: ContradictionEngine.createInitialContradictions(),
      evidencePresented: [],
      questionsAsked: ['Where were you between 10:15 and 10:45 PM?'],
      informationAlreadyRevealed: [],
      playerDiscoveries: {
        discoveredClueCodes: [],
        unlockedConcessions: [],
        exposedContradictions: [],
        exploredTopics: ['kn-timeline-1030'],
        caseHypothesisScore: 10,
      },
      memoriesCreated: [
        {
          id: 'mem-init-01',
          type: 'npc_statement',
          summary: 'Kabir claimed he was continuously at the 12th floor terrace bar sipping sparkling water.',
          turnNumber: 2,
          timestamp: '23:40:35',
          significance: 'MEDIUM',
          associatedClaim: 'Terrace Bar Alibi',
        },
      ],
      turnCount: initialHistory.length,
      createdAt: now,
      lastUpdated: now,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Resets a session to default initial state
   */
  public static resetSession(sessionId?: string): InterrogationSession {
    const sid = sessionId?.trim() || this.DEFAULT_SESSION_ID;
    return this.initializeSession(sid);
  }

  /**
   * Returns all active sessions
   */
  public static getAllSessions(): InterrogationSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Updates session after an interrogation turn
   */
  public static recordTurn(
    session: InterrogationSession,
    playerText: string,
    spokenResponse: string,
    internalMonologue: string,
    emotionalDelta: number,
    isContradiction: boolean,
    intentDetected: string,
    attachedEvidenceId?: string,
    concessionUnlocked?: string,
    discoveredContradiction?: GodotContradictionRecord | null,
    newMemories: GodotMemoryRecord[] = [],
    newInfo: Array<{ factId: string; importance: string }> = []
  ): void {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // 1. Record Detective turn
    session.turnCount += 1;
    const playerTurnId = `turn-${Date.now()}-${session.turnCount}`;
    session.conversationHistory.push({
      turnNumber: session.turnCount,
      turnId: playerTurnId,
      speaker: 'YOU (DETECTIVE)',
      text: playerText,
      timestamp: timeStr,
      evidencePresented: attachedEvidenceId,
    });
    session.questionsAsked.push(playerText);

    if (attachedEvidenceId && !session.evidencePresented.includes(attachedEvidenceId)) {
      session.evidencePresented.push(attachedEvidenceId);
    }

    // 2. Record NPC turn
    session.turnCount += 1;
    const npcTurnId = `turn-${Date.now()}-${session.turnCount}`;
    session.conversationHistory.push({
      turnNumber: session.turnCount,
      turnId: npcTurnId,
      speaker: session.suspect.name.toUpperCase(),
      text: spokenResponse,
      timestamp: timeStr,
      internalMonologue,
      isContradictionHit: isContradiction,
      emotionalDelta,
      intentDetected,
    });

    // 3. Update contradiction graph
    if (discoveredContradiction && discoveredContradiction.discovered) {
      const idx = session.contradictions.findIndex(c => c.id === discoveredContradiction.id);
      if (idx !== -1) {
        session.contradictions[idx].discovered = true;
        session.contradictions[idx].discoveredAtTurn = session.turnCount;
      }
      if (!session.playerDiscoveries.exposedContradictions.includes(discoveredContradiction.id)) {
        session.playerDiscoveries.exposedContradictions.push(discoveredContradiction.id);
      }
    }

    // 4. Update discoveries and concessions
    if (concessionUnlocked && !session.playerDiscoveries.unlockedConcessions.includes(concessionUnlocked)) {
      session.playerDiscoveries.unlockedConcessions.push(concessionUnlocked);
    }
    if (intentDetected && !session.playerDiscoveries.exploredTopics.includes(intentDetected)) {
      session.playerDiscoveries.exploredTopics.push(intentDetected);
    }

    // 5. Update score
    const scoreDelta = (isContradiction ? 18 : 0) + (concessionUnlocked ? 12 : 2);
    session.playerDiscoveries.caseHypothesisScore = Math.min(100, session.playerDiscoveries.caseHypothesisScore + scoreDelta);

    // 6. Record memories & revealed info
    for (const mem of newMemories) {
      session.memoriesCreated.push(mem);
    }
    for (const info of newInfo) {
      session.informationAlreadyRevealed.push({
        factId: info.factId,
        importance: info.importance,
        turnNumber: session.turnCount,
      });
    }

    session.lastUpdated = new Date().toISOString();
  }
}
