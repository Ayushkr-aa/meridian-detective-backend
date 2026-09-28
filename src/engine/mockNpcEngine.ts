import {
  NpcCharacter,
  NpcKnowledgeNode,
  NpcMemory,
  EngineResponse,
  EmotionalState,
  EmotionalPosture,
  StressLevel,
  EvidenceItem,
} from '../types/gameTypes';

interface IntentEvaluation {
  intentKey: string;
  matchedNode?: NpcKnowledgeNode;
  repetitionCount: number;
  isAggressive: boolean;
  isUnfocused: boolean;
}

export class MockNpcEngine {
  /**
   * Process a player's natural question against canonical NPC knowledge,
   * emotional state, and prior memories without calling any external API.
   */
  public static processQuery(
    rawPrompt: string,
    currentNpc: NpcCharacter,
    evidenceAttached?: EvidenceItem
  ): EngineResponse {
    const prompt = rawPrompt.trim();
    const lowerPrompt = prompt.toLowerCase();

    // 1. Evaluate intent, relevant knowledge node, and repetition
    const evaluation = this.evaluateIntentAndRelevance(lowerPrompt, currentNpc, evidenceAttached);

    // 2. Compute emotional shifts (stress, pulse, posture, composure)
    const { stressDelta, newEmotionalState } = this.calculateEmotionalShift(
      currentNpc.emotionalState,
      evaluation,
      Boolean(evidenceAttached)
    );

    // 3. Generate character-consistent dialogue and internal monologue
    const {
      spokenDialogue,
      internalMonologue,
      isContradiction,
      concessionUnlocked,
      isRefusal,
    } = this.synthesizeDialogue(
      currentNpc,
      evaluation,
      newEmotionalState,
      evidenceAttached
    );

    // 4. Construct persistent NPC episodic memory
    const memoryCreated: NpcMemory = {
      id: `mem-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      topic: evaluation.matchedNode?.topicLabel || evaluation.intentKey,
      playerPrompt: prompt,
      npcResponse: spokenDialogue,
      significance: evidenceAttached
        ? 'CRITICAL'
        : evaluation.matchedNode?.isSecret
        ? 'HIGH'
        : evaluation.isUnfocused
        ? 'LOW'
        : 'MEDIUM',
      emotionalImpact: Math.abs(stressDelta),
      repetitionCount: evaluation.repetitionCount,
      concessionMade: concessionUnlocked,
      lieExposed: isContradiction,
    };

    return {
      spokenDialogue,
      internalMonologue,
      stressDelta,
      newEmotionalState,
      matchedKnowledgeNode: evaluation.matchedNode,
      isContradiction,
      memoryCreated,
      intentDetected: evaluation.intentKey,
      concessionUnlocked,
      isRefusal,
    };
  }

  /**
   * Evaluates player input against keyword clusters in the NPC knowledge base
   */
  private static evaluateIntentAndRelevance(
    prompt: string,
    npc: NpcCharacter,
    evidenceAttached?: EvidenceItem
  ): IntentEvaluation {
    // A. Evidence confrontation overrides text keyword matching
    if (evidenceAttached) {
      const node = npc.knowledgeBase.find((n) => n.id === evidenceAttached.contradictionTopic);
      return {
        intentKey: `CONFRONT_EVIDENCE_${evidenceAttached.code}`,
        matchedNode: node,
        repetitionCount: 1,
        isAggressive: true,
        isUnfocused: false,
      };
    }

    const isAggressive =
      prompt.includes('murderer') ||
      prompt.includes('kill') ||
      prompt.includes('arrest') ||
      prompt.includes('guilty') ||
      prompt.includes('confess') ||
      prompt.includes('prison') ||
      prompt.includes('handcuff');

    // B. Match against knowledgeBase nodes via keywords
    let bestNode: NpcKnowledgeNode | undefined;
    let maxKeywordScore = 0;

    for (const node of npc.knowledgeBase) {
      let score = 0;
      for (const kw of node.keywords) {
        if (prompt.includes(kw.toLowerCase())) {
          score += kw.length; // prioritize longer, more specific keyword matches
        }
      }
      if (score > maxKeywordScore) {
        maxKeywordScore = score;
        bestNode = node;
      }
    }

    if (bestNode) {
      // Calculate how many times this specific topic has been asked in this session
      const priorCount = npc.memories.filter(
        (m) => m.topic === bestNode?.topicLabel || m.topic === bestNode?.id
      ).length;

      return {
        intentKey: bestNode.id,
        matchedNode: bestNode,
        repetitionCount: priorCount + 1,
        isAggressive,
        isUnfocused: false,
      };
    }

    // C. Arbitrary or unfocused questions
    return {
      intentKey: isAggressive ? 'UNSUPPORTED_ACCUSATION' : 'UNFOCUSED_INQUIRY',
      repetitionCount: 1,
      isAggressive,
      isUnfocused: true,
    };
  }

  /**
   * Deterministically calculates stress and psychological state changes
   */
  private static calculateEmotionalShift(
    current: EmotionalState,
    evaluation: IntentEvaluation,
    hasEvidence: boolean
  ): { stressDelta: number; newEmotionalState: EmotionalState } {
    let delta = 2; // Baseline conversation fatigue

    if (hasEvidence) {
      delta = 16;
    } else if (evaluation.matchedNode?.isSecret) {
      // Asking about secrets raises tension
      delta = 8;
    } else if (evaluation.isAggressive) {
      delta = 5;
    } else if (evaluation.repetitionCount >= 2) {
      delta = 3;
    } else if (evaluation.isUnfocused) {
      // Unfocused or trivial questions allow Kabir to regain composure
      delta = -2;
    }

    const nextStress = Math.min(96, Math.max(20, current.stressIndex + delta));
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
    const nextComposure = Math.max(5, Math.min(100, current.composure - delta * 0.9));
    const nextDefensiveness = Math.max(10, Math.min(100, current.defensiveness + delta * 1.2));

    const newEmotionalState: EmotionalState = {
      stressIndex: nextStress,
      stressLevel: nextLevel,
      pulseBpm: nextPulse,
      posture: nextPosture,
      posturePips: nextPips,
      composure: Math.round(nextComposure),
      defensiveness: Math.round(nextDefensiveness),
    };

    return { stressDelta: delta, newEmotionalState };
  }

  /**
   * Synthesizes dialogue strictly from character data, refusal templates, and knowledge nodes
   */
  private static synthesizeDialogue(
    npc: NpcCharacter,
    evaluation: IntentEvaluation,
    emotionalState: EmotionalState,
    evidenceAttached?: EvidenceItem
  ): {
    spokenDialogue: string;
    internalMonologue: string;
    isContradiction: boolean;
    concessionUnlocked?: string;
    isRefusal: boolean;
  } {
    // 1. Evidence Confrontation
    if (evidenceAttached) {
      return {
        spokenDialogue: evidenceAttached.reactionDialogue,
        internalMonologue: evidenceAttached.internalMonologue,
        isContradiction: true,
        concessionUnlocked: `Confronted with ${evidenceAttached.title}. Kabir attempted forensic deflection.`,
        isRefusal: false,
      };
    }

    // 2. Natural Refusal upon Repeated Badgering (repetition >= 2)
    if (evaluation.repetitionCount >= 2) {
      const templates = npc.refusalTemplates.repeatedBadgering;
      const index = Math.min(templates.length - 1, evaluation.repetitionCount - 2);
      return {
        spokenDialogue: templates[index],
        internalMonologue: 'He is looping back to force a slip-up. Hold the exact phrasing and do not budge.',
        isContradiction: false,
        isRefusal: true,
      };
    }

    // 3. Unfocused, Arbitrary or Personal Questions
    if (evaluation.isUnfocused) {
      if (evaluation.isAggressive) {
        const aggrTemplates = npc.refusalTemplates.aggressiveAccusations;
        const text = aggrTemplates[Math.floor(Math.random() * aggrTemplates.length)];
        return {
          spokenDialogue: text,
          internalMonologue: 'He is posturing aggressively because he lacks physical evidence. Push back firmly.',
          isContradiction: false,
          isRefusal: true,
        };
      }
      const unfocused = npc.refusalTemplates.unfocusedQuestions;
      const text = unfocused[Math.floor(Math.random() * unfocused.length)];
      return {
        spokenDialogue: text,
        internalMonologue: 'Irrelevant query. He is grasping in the dark. Let him waste his energy.',
        isContradiction: false,
        isRefusal: true,
      };
    }

    // 4. Matched Knowledge Node
    const node = evaluation.matchedNode!;
    const isStressCritical = emotionalState.stressIndex >= node.stressThresholdToDisclose;
    const isStressElevated = emotionalState.stressIndex >= 65;

    let spoken = node.dialogueBranches.calm;
    let concession: string | undefined = undefined;
    let contradiction = false;

    if (isStressCritical) {
      spoken = node.dialogueBranches.critical;
      concession = node.dialogueBranches.concession;
      contradiction = Boolean(node.dialogueBranches.isContradiction);
    } else if (isStressElevated) {
      spoken = node.dialogueBranches.elevated;
    } else {
      spoken = node.dialogueBranches.calm;
    }

    return {
      spokenDialogue: spoken,
      internalMonologue: node.dialogueBranches.internalMonologue,
      isContradiction: contradiction,
      concessionUnlocked: concession,
      isRefusal: false,
    };
  }
}
