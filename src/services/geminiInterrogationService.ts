import { GoogleGenAI, Type } from '@google/genai';
import { GeminiContextBuilder, PromptContextParams } from './geminiContextBuilder';
import { GeminiResponseValidator, ValidationResult } from './geminiResponseValidator';
import { GeminiStructuredOutput } from '../types/geminiTypes';
import { EngineResponse, NpcCharacter, EvidenceItem, NpcMemory } from '../types/gameTypes';
import { MockNpcEngine } from '../engine/mockNpcEngine';
import { GodotContradictionRecord, GodotMemoryRecord } from '../types/godotApiTypes';
import { getAuthoritativeGeminiModel } from '../config/modelConfig';

export class GeminiInterrogationService {
  // Configurable model name via environment variable, single authoritative source
  public static get MODEL_NAME(): string {
    return getAuthoritativeGeminiModel();
  }

  private static aiClient: GoogleGenAI | null = null;

  /**
   * Initializes the server-side Google GenAI client
   */
  private static getClient(): GoogleGenAI | null {
    if (this.aiClient) return this.aiClient;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      console.warn('[GeminiInterrogationService] GEMINI_API_KEY not configured or set to placeholder.');
      return null;
    }

    try {
      this.aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      return this.aiClient;
    } catch (err) {
      console.error('[GeminiInterrogationService] Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }

  /**
   * Main entry point to process an interrogation turn via Gemini or Mock Fallback
   */
  public static async executeTurn(
    playerText: string,
    npc: NpcCharacter,
    evidenceAttached?: EvidenceItem,
    recentHistory?: Array<{ speaker: string; text: string; turnNumber?: number }>,
    forceMock: boolean = false,
    discoveredContradictions?: GodotContradictionRecord[],
    sessionMemories?: GodotMemoryRecord[]
  ): Promise<{
    response: EngineResponse;
    modeUsed: 'gemini' | 'mock';
    diagnostics?: any;
    rawInformationRevealed?: Array<{ factId: string; importance: string }>;
    rawMemory?: { shouldStore: boolean; importance: string; summary: string };
    rawEvidenceReaction?: { reaction: string; evidenceId: string | null };
  }> {
    // If mock mode is forced, return deterministic mock engine immediately
    if (forceMock) {
      const mockResult = MockNpcEngine.processQuery(playerText, npc, evidenceAttached);
      return {
        response: mockResult,
        modeUsed: 'mock',
        diagnostics: { reason: 'User requested mock mode' },
        rawInformationRevealed: [],
        rawMemory: {
          shouldStore: true,
          importance: 'medium',
          summary: mockResult.memoryCreated.topic,
        },
        rawEvidenceReaction: evidenceAttached ? { reaction: 'defensive', evidenceId: evidenceAttached.id } : undefined,
      };
    }

    const ai = this.getClient();
    if (!ai) {
      console.warn('[GeminiInterrogationService] Falling back to MockNpcEngine due to unconfigured API key.');
      const mockResult = MockNpcEngine.processQuery(playerText, npc, evidenceAttached);
      return {
        response: mockResult,
        modeUsed: 'mock',
        diagnostics: { warning: 'GEMINI_API_KEY not found or invalid; mock engine activated as graceful fallback.' },
        rawInformationRevealed: [],
        rawMemory: {
          shouldStore: true,
          importance: 'medium',
          summary: mockResult.memoryCreated.topic,
        },
        rawEvidenceReaction: evidenceAttached ? { reaction: 'defensive', evidenceId: evidenceAttached.id } : undefined,
      };
    }

    try {
      // 1. Build controlled context
      const systemInstruction = GeminiContextBuilder.buildSystemInstruction(npc);
      const userPrompt = GeminiContextBuilder.buildUserPrompt({
        playerText,
        npc,
        evidenceAttached,
        recentHistory,
        discoveredContradictions,
        sessionMemories,
      });

      // 2. Query Gemini with structured response schema
      const response = await ai.models.generateContent({
        model: this.MODEL_NAME,
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spokenResponse: {
                type: Type.STRING,
                description: 'The spoken dialogue of the character. Under 45 words. Realistic Indian English cadence.',
              },
              emotion: {
                type: Type.OBJECT,
                properties: {
                  primary: {
                    type: Type.STRING,
                    enum: ['neutral', 'calm', 'nervous', 'afraid', 'angry', 'defensive', 'cooperative', 'surprised'],
                  },
                  intensity: {
                    type: Type.NUMBER,
                    description: 'Float from 0.0 to 1.0',
                  },
                },
                required: ['primary', 'intensity'],
              },
              informationRevealed: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    factId: { type: Type.STRING },
                    importance: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                  },
                  required: ['factId', 'importance'],
                },
              },
              memory: {
                type: Type.OBJECT,
                properties: {
                  shouldStore: { type: Type.BOOLEAN },
                  importance: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                  summary: { type: Type.STRING },
                },
                required: ['shouldStore', 'importance', 'summary'],
              },
              evidenceReaction: {
                type: Type.OBJECT,
                properties: {
                  reaction: {
                    type: Type.STRING,
                    enum: ['none', 'fear', 'anger', 'surprise', 'defensive', 'cooperative'],
                  },
                  evidenceId: { type: Type.STRING },
                },
                required: ['reaction'],
              },
            },
            required: ['spokenResponse', 'emotion', 'informationRevealed', 'memory', 'evidenceReaction'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini returned an empty text payload.');
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Failed to parse Gemini response as JSON: ${responseText}`);
      }

      // 3. Response Validation Layer
      const validation: ValidationResult = GeminiResponseValidator.validate(
        parsedJson,
        npc,
        evidenceAttached
      );

      // Construct NpcMemory
      const memoryCreated: NpcMemory = {
        id: `mem-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        topic: validation.sanitizedOutput.memory.summary || 'Interrogation Exchange',
        playerPrompt: playerText,
        npcResponse: validation.sanitizedOutput.spokenResponse,
        significance: validation.sanitizedOutput.memory.importance.toUpperCase() as any,
        emotionalImpact: Math.abs(validation.stressDelta),
        repetitionCount: 1,
        concessionMade: validation.concessionUnlocked,
        lieExposed: validation.isContradiction,
      };

      const engineResponse: EngineResponse = {
        spokenDialogue: validation.sanitizedOutput.spokenResponse,
        internalMonologue: `[Emotion: ${validation.sanitizedOutput.emotion.primary}] ${validation.sanitizedOutput.memory.summary}`,
        stressDelta: validation.stressDelta,
        newEmotionalState: validation.newEmotionalState,
        isContradiction: validation.isContradiction,
        memoryCreated,
        intentDetected: validation.concessionUnlocked ? 'CONCESSION_TRIGGERED' : 'GEMINI_CONVERSATION',
        concessionUnlocked: validation.concessionUnlocked,
        isRefusal: validation.sanitizedOutput.emotion.primary === 'defensive' && validation.sanitizedOutput.emotion.intensity > 0.8,
      };

      return {
        response: engineResponse,
        modeUsed: 'gemini',
        diagnostics: {
          modelUsed: this.MODEL_NAME,
          validationPassed: validation.isValid,
          violations: validation.violations,
          rawEmotion: validation.sanitizedOutput.emotion,
        },
        rawInformationRevealed: validation.sanitizedOutput.informationRevealed,
        rawMemory: validation.sanitizedOutput.memory,
        rawEvidenceReaction: validation.sanitizedOutput.evidenceReaction,
      };
    } catch (err: any) {
      console.error('[GeminiInterrogationService] Error calling Gemini API:', err);
      // Seamlessly fall back to MockNpcEngine to ensure game never crashes
      const mockFallback = MockNpcEngine.processQuery(playerText, npc, evidenceAttached);
      return {
        response: mockFallback,
        modeUsed: 'mock',
        diagnostics: {
          warning: 'Gemini call failed; seamlessly served response via deterministic Mock Engine.',
          errorDetails: err?.message || String(err),
        },
        rawInformationRevealed: [],
        rawMemory: {
          shouldStore: true,
          importance: 'medium',
          summary: mockFallback.memoryCreated.topic,
        },
        rawEvidenceReaction: evidenceAttached ? { reaction: 'defensive', evidenceId: evidenceAttached.id } : undefined,
      };
    }
  }
}
