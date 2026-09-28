import { NpcCharacter, EvidenceItem, EngineResponse, InterrogationTurn } from '../types/gameTypes';
import { MockNpcEngine } from '../engine/mockNpcEngine';

export class InterrogationClient {
  public static readonly DEFAULT_SESSION_ID = 'case-001-session-001';

  /**
   * Dispatches an interrogation turn to the backend /api/interrogation/turn endpoint.
   * If the backend is unreachable or returns an error, it gracefully falls back to MockNpcEngine.
   */
  public static async executeTurn(
    playerText: string,
    suspect: NpcCharacter,
    evidenceAttached?: EvidenceItem,
    recentHistory?: InterrogationTurn[],
    preferredMode: 'gemini' | 'mock' = 'gemini',
    sessionId: string = this.DEFAULT_SESSION_ID
  ): Promise<{ response: EngineResponse; modeUsed: 'gemini' | 'mock'; diagnostics?: any; contradiction?: any; animationState?: any }> {
    try {
      const payload = {
        sessionId,
        suspectId: 'kabir-malhotra',
        playerText,
        suspectState: suspect,
        attachedEvidenceId: evidenceAttached?.id,
        recentHistory: recentHistory?.slice(-6).map(t => ({ speaker: t.speaker, text: t.text })),
        mode: preferredMode,
      };

      const res = await fetch('/api/interrogation/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data && data.response) {
        return {
          response: data.response,
          modeUsed: data.modeUsed || 'gemini',
          diagnostics: data.diagnostics,
          contradiction: data.contradiction,
          animationState: data.animationState,
        };
      }
      throw new Error('Invalid response structure from backend.');
    } catch (err: any) {
      console.warn('[InterrogationClient] Backend API unavailable or failed, invoking local MockNpcEngine fallback:', err);
      const fallbackResult = MockNpcEngine.processQuery(playerText, suspect, evidenceAttached);
      return {
        response: fallbackResult,
        modeUsed: 'mock',
        diagnostics: {
          warning: 'Backend call failed; fallback mock engine activated.',
          error: err?.message || String(err),
        },
      };
    }
  }

  /**
   * Fetches authoritative session state from the server
   */
  public static async getSession(sessionId: string = this.DEFAULT_SESSION_ID): Promise<any> {
    try {
      const res = await fetch(`/api/interrogation/session/${sessionId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[InterrogationClient] Failed to fetch session state:', err);
    }
    return null;
  }

  /**
   * Resets the server-side interrogation session
   */
  public static async resetSession(sessionId: string = this.DEFAULT_SESSION_ID): Promise<boolean> {
    try {
      const res = await fetch('/api/interrogation/session/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      return res.ok;
    } catch (err) {
      console.warn('[InterrogationClient] Failed to reset session:', err);
      return false;
    }
  }

  /**
   * Checks server health and Gemini configuration status
   */
  public static async checkHealth(): Promise<{ hasGeminiKey: boolean; model: string; modeDefault: string }> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Server not reachable
    }
    return { hasGeminiKey: false, model: 'gemini-3.8-flash', modeDefault: 'mock' };
  }
}
