import { GeminiStructuredOutput } from '../types/geminiTypes';
import { NpcCharacter, EvidenceItem, EmotionalState, EmotionalPosture, StressLevel, NpcMemory } from '../types/gameTypes';
import { CANONICAL_CASE } from '../data/canonicalCaseData';

export interface ValidationResult {
  isValid: boolean;
  sanitizedOutput: GeminiStructuredOutput;
  stressDelta: number;
  newEmotionalState: EmotionalState;
  isContradiction: boolean;
  concessionUnlocked?: string;
  violations: string[];
}

export class GeminiResponseValidator {
  private static readonly ALLOWED_EMOTIONS = [
    'neutral', 'calm', 'nervous', 'afraid', 'angry', 'defensive', 'cooperative', 'surprised'
  ];

  private static readonly ALLOWED_EVIDENCE_REACTIONS = [
    'none', 'fear', 'anger', 'surprise', 'defensive', 'cooperative'
  ];

  /**
   * Validates raw Gemini structured output against canonical rules and game constraints
   */
  public static validate(
    raw: unknown,
    npc: NpcCharacter,
    evidenceAttached?: EvidenceItem
  ): ValidationResult {
    const violations: string[] = [];

    // Basic object validation
    if (!raw || typeof raw !== 'object') {
      violations.push('Output is not a valid JSON object');
      return this.fallbackResult(npc, evidenceAttached, violations);
    }

    const candidate = raw as Partial<GeminiStructuredOutput>;

    // 1. Spoken response validation
    if (typeof candidate.spokenResponse !== 'string' || !candidate.spokenResponse.trim()) {
      violations.push('spokenResponse is missing or empty');
    }

    let spokenResponse = candidate.spokenResponse ? candidate.spokenResponse.trim() : '';

    // Strip quotation marks if Gemini wrapped entire response
    if (spokenResponse.startsWith('"') && spokenResponse.endsWith('"') && spokenResponse.length > 2) {
      spokenResponse = spokenResponse.slice(1, -1);
    }

    // 2. Protect canonical truth against hallucinated confessions or facts
    const lowerSpoken = spokenResponse.toLowerCase();

    // Check if NPC falsely confessed when stress is not critical
    if (npc.emotionalState.stressIndex < 80) {
      if (
        (lowerSpoken.includes('i killed') || lowerSpoken.includes('i murdered') || lowerSpoken.includes('i pushed him')) &&
        !evidenceAttached
      ) {
        violations.push('Premature confession: Suspect cannot confess while stress is below critical threshold');
        spokenResponse = '"Detective, your accusations are baseless. I had nothing to do with Rohan\'s death."';
      }
    }

    // Check for hallucinated suspects
    const BANNED_HALLUCINATIONS = ['priya', 'vikas', 'raghav', 'mehta', 'sharma', 'poison', 'knife', 'gun', 'revolver'];
    for (const banned of BANNED_HALLUCINATIONS) {
      if (lowerSpoken.includes(banned)) {
        violations.push(`Hallucinated entity or weapon detected: "${banned}"`);
        // Remove or sanitize statement
        spokenResponse = spokenResponse.replace(new RegExp(`\\b${banned}\\b`, 'gi'), 'someone');
      }
    }

    // 3. Emotion validation
    let primaryEmotion = candidate.emotion?.primary;
    if (!primaryEmotion || !this.ALLOWED_EMOTIONS.includes(primaryEmotion)) {
      violations.push(`Invalid emotion: ${primaryEmotion}`);
      primaryEmotion = npc.emotionalState.stressIndex > 70 ? 'defensive' : 'calm';
    }

    let intensity = typeof candidate.emotion?.intensity === 'number' ? candidate.emotion.intensity : 0.5;
    intensity = Math.max(0.0, Math.min(1.0, intensity));

    // 4. Memory validation
    const shouldStoreMemory = Boolean(candidate.memory?.shouldStore);
    const memoryImportance = ['low', 'medium', 'high'].includes(candidate.memory?.importance || '')
      ? candidate.memory!.importance
      : 'medium';
    const memorySummary = candidate.memory?.summary?.trim() || 'Interrogation exchange regarding timeline and alibi';

    // 5. Evidence reaction validation
    let evidenceReaction = candidate.evidenceReaction?.reaction || 'none';
    if (!this.ALLOWED_EVIDENCE_REACTIONS.includes(evidenceReaction)) {
      evidenceReaction = evidenceAttached ? 'defensive' : 'none';
    }

    let evidenceId = candidate.evidenceReaction?.evidenceId || null;
    if (evidenceAttached && !evidenceId) {
      evidenceId = evidenceAttached.id;
    }

    // 6. Calculate permitted state changes
    const { stressDelta, newEmotionalState, isContradiction, concessionUnlocked } =
      this.calculateStateChanges(npc, candidate, primaryEmotion, intensity, evidenceAttached);

    const sanitizedOutput: GeminiStructuredOutput = {
      spokenResponse,
      emotion: {
        primary: primaryEmotion as any,
        intensity,
      },
      informationRevealed: Array.isArray(candidate.informationRevealed)
        ? candidate.informationRevealed.filter(f => f && typeof f.factId === 'string')
        : [],
      memory: {
        shouldStore: shouldStoreMemory,
        importance: memoryImportance,
        summary: memorySummary,
      },
      evidenceReaction: {
        reaction: evidenceReaction as any,
        evidenceId,
      },
    };

    return {
      isValid: violations.length === 0,
      sanitizedOutput,
      stressDelta,
      newEmotionalState,
      isContradiction,
      concessionUnlocked,
      violations,
    };
  }

  /**
   * Safe fallback if Gemini fails or output is completely malformed
   */
  public static fallbackResult(
    npc: NpcCharacter,
    evidenceAttached?: EvidenceItem,
    violations: string[] = []
  ): ValidationResult {
    let fallbackText = '"Detective, I have already answered your question. You are going in circles."';
    let stressDelta = 2;
    let isContradiction = false;

    if (evidenceAttached) {
      fallbackText = evidenceAttached.reactionDialogue;
      stressDelta = evidenceAttached.impactOnStress;
      isContradiction = true;
    } else if (npc.emotionalState.stressIndex >= 75) {
      fallbackText = '"I have nothing further to state without my counsel present, Officer."';
      stressDelta = 3;
    }

    const currentStress = npc.emotionalState.stressIndex;
    const nextStress = Math.min(96, Math.max(20, currentStress + stressDelta));
    const nextPulse = Math.round(72 + (nextStress / 100) * 68);

    let nextPosture: EmotionalPosture = 'DEFENSIVE';
    let nextPips = 3;
    let nextLevel: StressLevel = 'ELEVATED';

    if (nextStress >= 85) {
      nextPosture = 'CORNERED';
      nextPips = 5;
      nextLevel = 'MAXIMUM';
    } else if (nextStress >= 75) {
      nextPosture = 'TENSE';
      nextPips = 4;
      nextLevel = 'CRITICAL';
    }

    const newEmotionalState: EmotionalState = {
      ...npc.emotionalState,
      stressIndex: nextStress,
      stressLevel: nextLevel,
      pulseBpm: nextPulse,
      posture: nextPosture,
      posturePips: nextPips,
      composure: Math.max(5, npc.emotionalState.composure - 3),
      defensiveness: Math.min(100, npc.emotionalState.defensiveness + 4),
    };

    return {
      isValid: false,
      sanitizedOutput: {
        spokenResponse: fallbackText,
        emotion: { primary: 'defensive', intensity: 0.6 },
        informationRevealed: [],
        memory: { shouldStore: true, importance: 'medium', summary: 'Suspect pushed back defensively.' },
        evidenceReaction: { reaction: evidenceAttached ? 'defensive' : 'none', evidenceId: evidenceAttached?.id || null }
      },
      stressDelta,
      newEmotionalState,
      isContradiction,
      violations,
    };
  }

  /**
   * Computes game state changes without letting Gemini overwrite arbitrary variables
   */
  private static calculateStateChanges(
    npc: NpcCharacter,
    candidate: Partial<GeminiStructuredOutput>,
    emotion: string,
    intensity: number,
    evidenceAttached?: EvidenceItem
  ): {
    stressDelta: number;
    newEmotionalState: EmotionalState;
    isContradiction: boolean;
    concessionUnlocked?: string;
  } {
    let delta = 2; // baseline inquiry fatigue
    let isContradiction = false;
    let concessionUnlocked: string | undefined = undefined;

    if (evidenceAttached) {
      delta = evidenceAttached.impactOnStress;
      isContradiction = true;
      concessionUnlocked = `Confronted with ${evidenceAttached.title}. Suspect under forensic scrutiny.`;
    } else {
      switch (emotion) {
        case 'afraid':
        case 'surprised':
          delta = Math.round(8 * intensity) + 4;
          break;
        case 'defensive':
        case 'angry':
          delta = Math.round(6 * intensity) + 2;
          break;
        case 'nervous':
          delta = Math.round(5 * intensity) + 2;
          break;
        case 'calm':
        case 'neutral':
          delta = -1; // calm demeanor regains slight composure
          break;
        case 'cooperative':
          delta = 1;
          break;
      }

      // Check if facts revealed trigger concessions
      if (candidate.informationRevealed && candidate.informationRevealed.length > 0) {
        for (const info of candidate.informationRevealed) {
          const matchedNode = npc.knowledgeBase.find(n => n.id === info.factId);
          if (matchedNode && matchedNode.isSecret) {
            delta += 6;
            concessionUnlocked = matchedNode.dialogueBranches.concession || `Disclosed details regarding ${matchedNode.topicLabel}`;
            isContradiction = Boolean(matchedNode.dialogueBranches.isContradiction);
          }
        }
      }
    }

    const nextStress = Math.min(96, Math.max(20, npc.emotionalState.stressIndex + delta));
    let nextLevel: StressLevel = 'NORMAL';
    let nextPosture: EmotionalPosture = 'COMPOSED';
    let nextPips = 2;

    if (nextStress >= 85) {
      nextLevel = 'MAXIMUM';
      nextPosture = 'CORNERED';
      nextPips = 5;
    } else if (nextStress >= 75) {
      nextLevel = 'CRITICAL';
      nextPosture = 'TENSE';
      nextPips = 4;
    } else if (nextStress >= 65) {
      nextLevel = 'SURGING';
      nextPosture = 'DEFENSIVE';
      nextPips = 3;
    } else if (nextStress >= 50) {
      nextLevel = 'ELEVATED';
      nextPosture = 'CALCULATING';
      nextPips = 2;
    }

    const nextPulse = Math.round(72 + (nextStress / 100) * 68);
    const nextComposure = Math.max(5, Math.min(100, npc.emotionalState.composure - delta * 0.8));
    const nextDefensiveness = Math.max(10, Math.min(100, npc.emotionalState.defensiveness + delta * 1.1));

    const newEmotionalState: EmotionalState = {
      stressIndex: nextStress,
      stressLevel: nextLevel,
      pulseBpm: nextPulse,
      posture: nextPosture,
      posturePips: nextPips,
      composure: Math.round(nextComposure),
      defensiveness: Math.round(nextDefensiveness),
    };

    return {
      stressDelta: delta,
      newEmotionalState,
      isContradiction,
      concessionUnlocked,
    };
  }
}
