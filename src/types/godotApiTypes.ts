import { EmotionalState, EngineResponse, NpcCharacter, EvidenceItem, InterrogationTurn } from './gameTypes';

export type AnimationPosture =
  | 'composed_upright'
  | 'attentive_calculating'
  | 'defensive_arms_crossed'
  | 'tense_leaning_forward'
  | 'cornered_shaken';

export type AnimationGesture =
  | 'steepled_hands'
  | 'dismissive_wave'
  | 'adjusting_cuff'
  | 'fidgeting'
  | 'clenched_fists'
  | 'defensive_palm'
  | 'shocked_flinch';

export interface GodotAnimationState {
  posture: AnimationPosture;
  gesture: AnimationGesture;
  eyeContact: number; // 0.0 to 1.0 (clamped float)
  tension: number;    // 0.0 to 1.0 (clamped float)
}

export interface GodotEmotion {
  state: string;     // 'calm' | 'defensive' | 'nervous' | 'angry' | 'afraid' | 'cornered' | 'composed'
  stress: number;    // 0 to 100
  composure: number; // 0 to 100
  suspicion: number; // 0 to 100 (maps to defensiveness)
}

export type ContradictionType = 'timeline' | 'alibi' | 'physical' | 'financial';
export type ContradictionSeverity = 'minor' | 'moderate' | 'high' | 'critical';

export interface ContradictionClaim {
  source: string;
  claim: string;
}

export interface GodotContradictionRecord {
  id: string;
  type: ContradictionType;
  severity: ContradictionSeverity;
  claims: ContradictionClaim[];
  canonicalResolution: string;
  discovered: boolean;
  stressImpact: number;
  evidenceId?: string;
  linkedTopicId?: string;
  discoveredAtTurn?: number;
}

export type MemoryCategory =
  | 'player_statement'
  | 'npc_statement'
  | 'evidence_confrontation'
  | 'contradiction_exposed'
  | 'emotional_shift';

export interface GodotMemoryRecord {
  id: string;
  type: MemoryCategory;
  summary: string;
  turnNumber: number;
  timestamp: string;
  significance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  associatedClaim?: string;
  contradictionId?: string;
}

export type SuggestedPlayerAction =
  | 'present_evidence'
  | 'press_timeline'
  | 'inquire_motive'
  | 'confront_contradiction'
  | 'cross_examine_alibi'
  | null;

export interface GodotInterrogationTurnRequest {
  sessionId?: string;
  suspectId?: string;
  playerText: string;
  mode?: 'gemini' | 'mock';
  attachedEvidenceId?: string;
  evidenceId?: string; // Alternative key accepted by Godot
  // Optional client-side state for backward-compatibility with React client
  suspectState?: NpcCharacter;
  recentHistory?: Array<{ speaker: string; text: string }>;
}

export interface PublicContradictionDTO {
  id: string;
  type: ContradictionType;
  severity: ContradictionSeverity;
  claims: ContradictionClaim[];
  discovered: boolean;
  stressImpact: number;
  evidenceId?: string;
  discoveredAtTurn?: number;
}

export interface SafeDiagnosticsDTO {
  modelUsed?: string;
  validationPassed?: boolean;
  fallbackActive?: boolean;
  warning?: string;
}

export interface GodotInterrogationTurnResponse {
  turnId: string;
  sessionId: string;
  suspectId: string;
  spokenResponse: string;
  emotion: GodotEmotion;
  informationRevealed: Array<{ factId: string; importance: string }>;
  memoryCreated: GodotMemoryRecord[];
  evidenceReaction: {
    reaction: string;
    evidenceId: string | null;
  } | null;
  contradiction: PublicContradictionDTO | null;
  suggestedAction: SuggestedPlayerAction;
  animationState: GodotAnimationState;
  modeUsed?: 'gemini' | 'mock';
  diagnostics?: SafeDiagnosticsDTO;
}
