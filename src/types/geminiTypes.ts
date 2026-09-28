export interface GeminiStructuredOutput {
  spokenResponse: string;
  emotion: {
    primary: 'neutral' | 'calm' | 'nervous' | 'afraid' | 'angry' | 'defensive' | 'cooperative' | 'surprised';
    intensity: number; // 0.0 to 1.0
  };
  informationRevealed: Array<{
    factId: string;
    importance: 'low' | 'medium' | 'high';
  }>;
  memory: {
    shouldStore: boolean;
    importance: 'low' | 'medium' | 'high';
    summary: string;
  };
  evidenceReaction: {
    reaction: 'none' | 'fear' | 'anger' | 'surprise' | 'defensive' | 'cooperative';
    evidenceId: string | null;
  };
}

export interface InterrogationTurnRequest {
  playerText: string;
  suspectId: string;
  attachedEvidenceId?: string;
  recentTurns?: Array<{
    speaker: string;
    text: string;
  }>;
  mode?: 'gemini' | 'mock';
}

export interface InterrogationTurnResponse {
  success: boolean;
  modeUsed: 'gemini' | 'mock';
  response: {
    spokenDialogue: string;
    internalMonologue: string;
    stressDelta: number;
    newEmotionalState: import('./gameTypes').EmotionalState;
    isContradiction: boolean;
    memoryCreated: import('./gameTypes').NpcMemory;
    intentDetected: string;
    concessionUnlocked?: string;
    isRefusal: boolean;
  };
  diagnostics?: {
    modelUsed?: string;
    validationPassed: boolean;
    rawGeminiEmotion?: string;
    warning?: string;
  };
}
