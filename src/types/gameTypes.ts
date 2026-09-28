export type EmotionalPosture = 'COMPOSED' | 'CALCULATING' | 'DEFENSIVE' | 'TENSE' | 'CORNERED' | 'CONTEMPTUOUS';
export type StressLevel = 'NORMAL' | 'ELEVATED' | 'SURGING' | 'CRITICAL' | 'MAXIMUM';

export interface EmotionalState {
  stressIndex: number; // 0 - 100
  stressLevel: StressLevel;
  pulseBpm: number;
  posture: EmotionalPosture;
  posturePips: number; // 1 to 5
  composure: number; // 100 to 0 (resilience against pressure)
  defensiveness: number; // 0 to 100
}

export interface NpcMemory {
  id: string;
  timestamp: string;
  topic: string;
  playerPrompt: string;
  npcResponse: string;
  significance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  emotionalImpact: number;
  repetitionCount: number;
  concessionMade?: string;
  lieExposed?: boolean;
}

export interface DialogueBranch {
  calm: string;
  elevated: string;
  critical: string;
  internalMonologue: string;
  concession?: string;
  isContradiction?: boolean;
}

export interface NpcKnowledgeNode {
  id: string;
  category: 'TIMELINE' | 'RELATIONSHIP' | 'LOCATION' | 'MOTIVE' | 'ALIBI' | 'FINANCES';
  topicLabel: string;
  keywords: string[];
  canonicalTruth: string;       // Ground reality in game world
  whatNpcKnows: string;         // Subjective reality inside NPC's mind
  publicStory: string;          // Fabricated cover story told to police
  isSecret: boolean;            // Whether NPC actively conceals this
  stressThresholdToDisclose: number; // Stress required to unlock concessions
  dialogueBranches: DialogueBranch;
}

export interface NpcRefusalTemplates {
  repeatedBadgering: string[];
  unfocusedQuestions: string[];
  aggressiveAccusations: string[];
  proceduralPushback: string[];
}

export interface NpcCharacter {
  id: string;
  code: string;
  name: string;
  role: string;
  age: number;
  status: string;
  access: string;
  location: string;
  personality: {
    traits: string[];
    summary: string;
    speakingStyle: string;
    manipulationTactics: string[];
  };
  relationshipWithVictim: {
    victimName: string;
    relationshipType: string;
    publicPerception: string;
    privateReality: string;
  };
  emotionalState: EmotionalState;
  knowledgeBase: NpcKnowledgeNode[];
  refusalTemplates: NpcRefusalTemplates;
  memories: NpcMemory[];
  audioMatchPercent: number;
}

export interface EvidenceItem {
  id: string;
  code: string;
  title: string;
  meta: string;
  icon: string;
  contradictionTopic: string;
  canonicalFact: string;
  impactOnStress: number;
  reactionDialogue: string;
  internalMonologue: string;
}

export interface CanonicalCase {
  caseId: string;
  title: string;
  crimeScene: string;
  victim: {
    name: string;
    title: string;
    timeOfDeath: string;
    causeOfDeath: string;
  };
  timeline: Array<{
    time: string;
    event: string;
    actor: string;
    verifiedBy: string;
  }>;
  immutableGroundTruth: string[];
}

/**
 * Explicit state tracking what the player/detective has established so far.
 * Distinguishes Player Knowledge from Canonical Truth and NPC Knowledge.
 */
export interface PlayerKnowledgeState {
  discoveredClueCodes: string[];
  unlockedConcessions: string[];
  exposedContradictions: string[];
  exploredTopics: string[];
  caseHypothesisScore: number; // 0 - 100
}

export interface InterrogationTurn {
  id: string;
  turnNumber: number;
  speaker: 'YOU (DETECTIVE)' | string;
  timestamp: string;
  text: string;
  internalMonologue?: string;
  isContradictionHit?: boolean;
  intentDetected?: string;
  evidencePresented?: string;
  emotionalDelta?: number;
}

export interface EngineResponse {
  spokenDialogue: string;
  internalMonologue: string;
  stressDelta: number;
  newEmotionalState: EmotionalState;
  matchedKnowledgeNode?: NpcKnowledgeNode;
  isContradiction: boolean;
  memoryCreated: NpcMemory;
  intentDetected: string;
  concessionUnlocked?: string;
  isRefusal: boolean;
}
