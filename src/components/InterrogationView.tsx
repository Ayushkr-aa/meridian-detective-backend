import React, { useState, useEffect, useRef } from 'react';
import {
  INITIAL_KABIR_MALHOTRA,
  CANONICAL_EVIDENCE,
  INITIAL_TRANSCRIPT_KABIR,
} from '../data/canonicalCaseData';
import {
  NpcCharacter,
  EvidenceItem,
  InterrogationTurn,
  EngineResponse,
  PlayerKnowledgeState,
} from '../types/gameTypes';
import { MockNpcEngine } from '../engine/mockNpcEngine';
import { InterrogationClient } from '../services/interrogationClient';

interface InterrogationViewProps {
  onOpenArchitecture: () => void;
}

export const InterrogationView: React.FC<InterrogationViewProps> = ({ onOpenArchitecture }) => {
  const [suspect, setSuspect] = useState<NpcCharacter>(INITIAL_KABIR_MALHOTRA);
  const [evidenceList] = useState<EvidenceItem[]>(CANONICAL_EVIDENCE);
  const [transcript, setTranscript] = useState<InterrogationTurn[]>(INITIAL_TRANSCRIPT_KABIR);
  
  // Player Knowledge State (Distinct from Canonical Truth & NPC Knowledge)
  const [playerKnowledge, setPlayerKnowledge] = useState<PlayerKnowledgeState>({
    discoveredClueCodes: ['#EVD-01', '#EVD-02', '#EVD-03', '#EVD-04'],
    unlockedConcessions: [],
    exposedContradictions: [],
    exploredTopics: ['kn-timeline-1030'],
    caseHypothesisScore: 18,
  });

  // Stage 2: AI Engine Mode & Diagnostics State
  const [engineMode, setEngineMode] = useState<'gemini' | 'mock'>('gemini');
  const [serverStatus, setServerStatus] = useState<{
    hasGeminiKey: boolean;
    model: string;
    modeDefault: string;
  }>({
    hasGeminiKey: false,
    model: 'gemini-3.8-flash',
    modeDefault: 'gemini',
  });
  const [lastDiagnostics, setLastDiagnostics] = useState<{
    modeUsed?: 'gemini' | 'mock';
    modelUsed?: string;
    validationPassed?: boolean;
    violations?: string[];
    warning?: string;
  } | null>({
    modeUsed: 'gemini',
    modelUsed: 'gemini-3.8-flash',
    validationPassed: true,
  });

  const [showEvidence, setShowEvidence] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [activeTabDrawer, setActiveTabDrawer] = useState<'transcript' | 'mind' | 'playerKnowledge'>('transcript');
  const [queryInput, setQueryInput] = useState('');
  
  const [currentDialogue, setCurrentDialogue] = useState(
    '"Detective, I am cooperating fully with your inquiry. I was up at the rooftop terrace bar during the timeframe in question. What specific clarification do you seek regarding Rohan\'s tragic demise?"'
  );
  const [lastInternalMonologue, setLastInternalMonologue] = useState<string>(
    'Maintain an air of calm corporate authority. Do not volunteer details about the service stairs.'
  );
  const [lastIntentDetected, setLastIntentDetected] = useState<string>('kn-timeline-1030');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSelectedEvidence, setLastSelectedEvidence] = useState<string | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Check backend server health on mount
  useEffect(() => {
    InterrogationClient.checkHealth().then((status) => {
      setServerStatus(status);
    });
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        setShowEvidence((prev) => !prev);
      } else if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowTranscript((prev) => !prev);
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setShowTranscript(true);
        setActiveTabDrawer('playerKnowledge');
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsVoiceRecording(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isVoiceRecording) {
        e.preventDefault();
        setIsVoiceRecording(false);
        handleQuickPromptSubmit('Where were you at 10:30?');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isVoiceRecording]);

  const executeInterrogationTurn = async (playerText: string, attachedEvidence?: EvidenceItem) => {
    const sanitizedText = playerText.trim();
    if (!sanitizedText || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newTurnNum = transcript.length + 1;

    // 1. Add Detective utterance to transcript
    const playerTurn: InterrogationTurn = {
      id: `t-${Date.now()}-p`,
      turnNumber: newTurnNum,
      speaker: 'YOU (DETECTIVE)',
      timestamp: timeStr,
      text: attachedEvidence
        ? `"[CONFRONTATION: ${attachedEvidence.code} - ${attachedEvidence.title}] ${attachedEvidence.canonicalFact}"`
        : `"${sanitizedText}"`,
      evidencePresented: attachedEvidence?.code,
    };

    setTranscript((prev) => [...prev, playerTurn]);

    try {
      // 2. Process query through InterrogationClient (calling backend /api/interrogation/turn)
      const turnResult = await InterrogationClient.executeTurn(
        sanitizedText,
        suspect,
        attachedEvidence,
        [...transcript, playerTurn],
        engineMode
      );

      const response: EngineResponse = turnResult.response;
      const modeUsed = turnResult.modeUsed;

      setLastDiagnostics({
        modeUsed,
        modelUsed: turnResult.diagnostics?.modelUsed || (modeUsed === 'gemini' ? serverStatus.model : 'local-mock-engine'),
        validationPassed: turnResult.diagnostics?.validationPassed !== false,
        violations: turnResult.diagnostics?.violations || [],
        warning: turnResult.diagnostics?.warning,
      });

      // 3. Update NPC emotional state and memories
      setSuspect((prev) => {
        const updatedMemories = [response.memoryCreated, ...prev.memories];
        return {
          ...prev,
          emotionalState: response.newEmotionalState,
          memories: updatedMemories,
        };
      });

      // 4. Update Player Knowledge State if new facts/contradictions discovered
      setPlayerKnowledge((prev) => {
        const newConcessions = response.concessionUnlocked && !prev.unlockedConcessions.includes(response.concessionUnlocked)
          ? [...prev.unlockedConcessions, response.concessionUnlocked]
          : prev.unlockedConcessions;

        const newContradictions = response.isContradiction && !prev.exposedContradictions.includes(response.intentDetected)
          ? [...prev.exposedContradictions, response.intentDetected]
          : prev.exposedContradictions;

        const newTopics = !prev.exploredTopics.includes(response.intentDetected)
          ? [...prev.exploredTopics, response.intentDetected]
          : prev.exploredTopics;

        const scoreGain = (response.isContradiction ? 18 : 0) + (response.concessionUnlocked ? 12 : 2);
        const newScore = Math.min(100, prev.caseHypothesisScore + scoreGain);

        return {
          ...prev,
          unlockedConcessions: newConcessions,
          exposedContradictions: newContradictions,
          exploredTopics: newTopics,
          caseHypothesisScore: newScore,
        };
      });

      // 5. Update HUD subtitle and cognitive telemetry
      setCurrentDialogue(response.spokenDialogue);
      setLastInternalMonologue(response.internalMonologue);
      setLastIntentDetected(response.intentDetected);

      // 6. Append NPC response to transcript
      const npcTurn: InterrogationTurn = {
        id: `t-${Date.now()}-npc`,
        turnNumber: newTurnNum + 1,
        speaker: modeUsed === 'gemini' ? 'KABIR MALHOTRA [GEMINI 3.8 FLASH]' : 'KABIR MALHOTRA [MOCK ENGINE]',
        timestamp: timeStr,
        text: response.spokenDialogue,
        internalMonologue: response.internalMonologue,
        isContradictionHit: response.isContradiction,
        intentDetected: response.intentDetected,
        emotionalDelta: response.stressDelta,
      };

      setTranscript((prev) => [...prev, npcTurn]);
    } catch (err) {
      setErrorMessage('Telemetry communication error. Gracefully recovered via local protocol.');
      setCurrentDialogue('"Detective, perhaps we should pause and proceed with procedural rigor."');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || isProcessing) return;

    const text = queryInput.trim();
    setQueryInput('');
    executeInterrogationTurn(text);
  };

  const handleEvidenceConfront = (evidence: EvidenceItem) => {
    if (isProcessing) return;
    setLastSelectedEvidence(evidence.code);
    executeInterrogationTurn(`I am confronting you with ${evidence.title}`, evidence);
  };

  const handleQuickPromptSubmit = (promptText: string) => {
    if (isProcessing) return;
    setQueryInput(promptText);
  };

  return (
    <div className="relative w-full h-[calc(100vh-5rem)] min-h-[860px] flex flex-col justify-between overflow-hidden select-none">
      {/* Immersive Suspect Backdrop */}
      <img
        alt="Suspect Kabir Malhotra seated in luxury hotel suite"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none scale-[1.01] brightness-90 contrast-[1.05]"
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyY115Psn5MMuawAq3nXFhjT9YgqjnVg0gRQkUpNDiTkoMnIdVQx5GkO28JNfFicSQwoeUmTB6F5AYYr0AE_TddZGzeC-JkfafS1d3Umy1bSLsdk0PlndNckuC2SIG4RqgwjskEEDx5916pYF7TIYeuofYwx78Ig9_cJHtBjamAY0jkkKeP7xEPY9Plkl3oNL5oOapqJIj6HGcvTsIOmQVg7NxwcZhcID2j7xdoFCUeFKQ0DOxVcb34A"
      />

      {/* Vignette & Diegetic HUD Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14]/30 to-[#0a0e14]/70 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,14,20,0.5)_60%,rgba(10,14,20,0.92)_100%)] pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'linear-gradient(rgba(212,175,55,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.08) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* TOP SECTION: Biometric Telemetry & Target Profile */}
      <div className="relative z-20 pt-4 px-6 md:px-12 flex flex-col md:flex-row items-start justify-between gap-6">
        {/* Suspect ID Block */}
        <div className="flex flex-col gap-1 bg-[#0a0e14]/85 backdrop-blur-md p-4 rounded-lg shadow-xl max-w-sm border border-[#4d4635]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f2ca50] animate-ping" />
              <span className="font-mono text-[10px] text-[#f2ca50] tracking-widest uppercase">
                TARGET PROFILE #04
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#99907c] tracking-wider">
              {suspect.code}
            </span>
          </div>
          <div>
            <h2 className="font-headline text-2xl text-[#dfe2eb] tracking-tight uppercase font-medium">
              {suspect.name}
            </h2>
            <p className="font-mono text-[11px] text-[#d0c5af] uppercase tracking-wider">
              {suspect.role}
            </p>
          </div>
          <div className="pt-2 flex items-center gap-4 border-t border-[#31353c]/40 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-[#99907c]">AGE</span>
              <span className="font-mono text-[11px] text-[#dfe2eb] font-semibold">{suspect.age}</span>
            </div>
            <span className="text-[#4d4635]">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-[#99907c]">STATUS</span>
              <span className="font-mono text-[11px] text-[#66dbb0] font-semibold">{suspect.status}</span>
            </div>
            <span className="text-[#4d4635]">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-[#99907c]">ACCESS</span>
              <span className="font-mono text-[11px] text-[#f2ca50] font-semibold">{suspect.access}</span>
            </div>
          </div>
        </div>

        {/* Live Biometric & Behavioral Metrics Bar */}
        <div className="flex items-center gap-6 bg-[#0a0e14]/90 backdrop-blur-md px-6 py-3 rounded-lg shadow-xl border border-[#4d4635]/30">
          {/* Stress Index with Animated ECG Sparkline */}
          <div className="flex flex-col gap-1 pr-4">
            <div className="flex items-center justify-between gap-6">
              <span className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider">
                STRESS INDEX
              </span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  suspect.emotionalState.stressIndex >= 85
                    ? 'text-[#ffb4ab]'
                    : suspect.emotionalState.stressIndex >= 70
                    ? 'text-[#ff9963]'
                    : 'text-[#66dbb0]'
                }`}
              >
                {suspect.emotionalState.stressIndex}% [{suspect.emotionalState.stressLevel}]
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Dynamic Mini SVG Waveform */}
              <svg className="w-32 h-6 text-[#ff9963]" fill="none" stroke="currentColor" viewBox="0 0 128 24">
                <path
                  className="animate-pulse"
                  d="M0 12 L20 12 L26 4 L34 20 L40 8 L46 16 L52 12 L70 12 L76 2 L84 22 L92 9 L98 15 L104 12 L128 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
              <div className="flex flex-col text-right">
                <span className="font-mono text-[12px] text-[#dfe2eb] font-bold">
                  {suspect.emotionalState.pulseBpm} BPM
                </span>
                <span className="font-mono text-[9px] text-[#99907c]">PULSE RATE</span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-[#31353c]" />

          {/* Demeanor & Posture State */}
          <div className="flex flex-col gap-1 pl-1">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider">
                POSTURE DISPOSITION
              </span>
              <span className="font-mono text-[11px] text-[#f2ca50] font-semibold">
                {suspect.emotionalState.posture}
              </span>
            </div>
            {/* Pip-based Demeanor Meter */}
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((pip) => (
                <div
                  key={pip}
                  className={`h-1.5 w-6 rounded ${
                    pip <= suspect.emotionalState.posturePips ? 'bg-[#f2ca50]' : 'bg-[#31353c]'
                  }`}
                />
              ))}
              <span className="font-mono text-[9px] text-[#d0c5af] ml-1">
                COMPOSURE {suspect.emotionalState.composure}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Toggles (Evidence & Transcript HUD triggers) + AI Engine Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stage 2 AI Engine Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-[#0a0e14]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#4d4635]/40 shadow-md">
            <div className="flex items-center gap-1.5 mr-1">
              <span className={`w-2 h-2 rounded-full ${engineMode === 'gemini' ? 'bg-[#66dbb0] animate-pulse' : 'bg-[#f2ca50]'}`} />
              <span className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider hidden lg:inline">ENGINE:</span>
            </div>
            <div className="flex items-center bg-[#181c22] rounded p-0.5 border border-[#31353c]/40">
              <button
                type="button"
                onClick={() => setEngineMode('gemini')}
                className={`px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 ${
                  engineMode === 'gemini'
                    ? 'bg-[#66dbb0] text-[#003828] font-bold shadow'
                    : 'text-[#99907c] hover:text-[#dfe2eb]'
                }`}
                title="Use real Gemini 3.8 Flash LLM with Ground-Truth Guardrails"
              >
                <span>Gemini 3.8 Flash</span>
                {lastDiagnostics?.modeUsed === 'gemini' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003828]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setEngineMode('mock')}
                className={`px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 ${
                  engineMode === 'mock'
                    ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow'
                    : 'text-[#99907c] hover:text-[#dfe2eb]'
                }`}
                title="Use deterministic Local Mock Engine (Offline / Stage 1 Fallback)"
              >
                <span>Local Mock</span>
                {lastDiagnostics?.modeUsed === 'mock' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3c2f00]" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowEvidence((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-[11px] tracking-wider uppercase shadow-md transition-all border ${
              showEvidence
                ? 'bg-[#d4af37] text-[#554300] border-[#f2ca50] font-bold'
                : 'bg-[#262a31]/90 text-[#dfe2eb] border-[#4d4635]/40 hover:bg-[#353940]'
            }`}
          >
            <span className="px-1.5 py-0.5 rounded bg-[#0a0e14] text-[#f2ca50] font-bold text-[9px]">
              TAB
            </span>
            <span>EVIDENCE ({evidenceList.length})</span>
          </button>

          <button
            onClick={() => setShowTranscript((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-[11px] tracking-wider uppercase shadow-md transition-all border ${
              showTranscript
                ? 'bg-[#31353c] text-[#dfe2eb] border-[#99907c]'
                : 'bg-[#262a31]/90 text-[#dfe2eb] border-[#4d4635]/40 hover:bg-[#353940]'
            }`}
          >
            <span className="px-1.5 py-0.5 rounded bg-[#0a0e14] text-[#dfe2eb] font-bold text-[9px]">
              H
            </span>
            <span>LOGS & MEMORY ({transcript.length})</span>
          </button>

          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-3 py-2 rounded font-mono text-[11px] tracking-wider uppercase bg-[#181c22] text-[#66dbb0] border border-[#22a37c]/50 hover:bg-[#22a37c]/20 transition-all"
            title="Inspect Data Flow & Architecture Specification"
          >
            <span className="material-symbols-outlined text-[15px]">schema</span>
            <span className="hidden sm:inline">DATA FLOW</span>
          </button>
        </div>
      </div>

      {/* MIDDLE FLANK: Flyout Conversation History, Memory, & Player Knowledge Drawer */}
      {showTranscript && (
        <div className="absolute top-44 left-6 md:left-12 z-30 w-96 bg-[#0a0e14]/94 backdrop-blur-xl p-4 rounded-lg shadow-2xl border border-[#4d4635]/40 flex flex-col gap-3 transition-all duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-[#262a31]">
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <button
                onClick={() => setActiveTabDrawer('transcript')}
                className={`tracking-wider uppercase transition-colors px-2 py-0.5 rounded ${
                  activeTabDrawer === 'transcript'
                    ? 'bg-[#d4af37] text-[#3c2f00] font-bold'
                    : 'text-[#99907c] hover:text-[#dfe2eb]'
                }`}
              >
                Log
              </button>
              <button
                onClick={() => setActiveTabDrawer('mind')}
                className={`tracking-wider uppercase transition-colors px-2 py-0.5 rounded ${
                  activeTabDrawer === 'mind'
                    ? 'bg-[#66dbb0] text-[#003828] font-bold'
                    : 'text-[#99907c] hover:text-[#dfe2eb]'
                }`}
              >
                NPC Memory ({suspect.memories.length})
              </button>
              <button
                onClick={() => setActiveTabDrawer('playerKnowledge')}
                className={`tracking-wider uppercase transition-colors px-2 py-0.5 rounded ${
                  activeTabDrawer === 'playerKnowledge'
                    ? 'bg-[#ff9963] text-[#552000] font-bold'
                    : 'text-[#99907c] hover:text-[#dfe2eb]'
                }`}
              >
                Notebook ({playerKnowledge.unlockedConcessions.length})
              </button>
            </div>
            <button
              onClick={() => setShowTranscript(false)}
              className="text-[#99907c] hover:text-[#dfe2eb] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {activeTabDrawer === 'transcript' && (
            /* Conversation Thread */
            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
              {transcript.map((item) => (
                <div key={item.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-[10px] font-semibold uppercase ${
                        item.speaker.includes('YOU')
                          ? 'text-[#f2ca50]'
                          : item.isContradictionHit
                          ? 'text-[#ff9963]'
                          : 'text-[#66dbb0]'
                      }`}
                    >
                      {item.speaker}
                    </span>
                    <span className="font-mono text-[9px] text-[#99907c]">{item.timestamp}</span>
                  </div>
                  <p
                    className={`font-body text-[13px] leading-relaxed p-2 rounded ${
                      item.speaker.includes('YOU')
                        ? 'bg-[#181c22] text-[#d0c5af]'
                        : 'bg-[#1c2026] text-[#dfe2eb]'
                    } ${item.isContradictionHit ? 'border-l-2 border-[#ff9963]' : ''}`}
                  >
                    {item.text}
                  </p>
                  {item.internalMonologue && (
                    <span className="font-mono text-[10px] text-[#ff9963]/80 italic pl-1">
                      💭 Inner Monologue: "{item.internalMonologue}"
                    </span>
                  )}
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          )}

          {activeTabDrawer === 'mind' && (
            /* Cognitive Memory & Intent State Inspector + Stage 2 AI Engine Diagnostics */
            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
              {/* Stage 2 Engine & Ground Truth Validation Telemetry */}
              <div className="p-2.5 rounded bg-[#181c22] border border-[#22a37c]/40 text-xs flex flex-col gap-1.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#66dbb0] uppercase font-bold flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${lastDiagnostics?.modeUsed === 'gemini' ? 'bg-[#66dbb0] animate-pulse' : 'bg-[#f2ca50]'}`} />
                    Engine Telemetry
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#0a0e14] text-[#f2ca50] font-bold">
                    {lastDiagnostics?.modeUsed === 'gemini' ? 'GEMINI 3.8 FLASH' : 'LOCAL MOCK'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#99907c]">
                  <span>GROUND TRUTH:</span>
                  <span className="text-[#66dbb0] font-semibold">ENFORCED (IMMUTABLE)</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#99907c]">
                  <span>VALIDATION:</span>
                  <span className={lastDiagnostics?.validationPassed ? 'text-[#66dbb0] font-semibold' : 'text-[#ffb4ab]'}>
                    {lastDiagnostics?.validationPassed ? 'PASSED (0 VIOLATIONS)' : 'DEFLECTION ACTIVATED'}
                  </span>
                </div>
                {lastDiagnostics?.warning && (
                  <p className="font-mono text-[9px] text-[#ff9963] bg-[#0a0e14]/60 p-1 rounded mt-0.5">
                    ℹ️ {lastDiagnostics.warning}
                  </p>
                )}
              </div>

              <div className="p-2.5 rounded bg-[#181c22] border border-[#31353c]/50 text-xs">
                <span className="font-mono text-[10px] text-[#66dbb0] uppercase font-bold block mb-1">
                  Active Intent Determination
                </span>
                <span className="font-mono text-[11px] text-[#f2ca50] bg-[#0a0e14] px-1.5 py-0.5 rounded">
                  {lastIntentDetected}
                </span>
                <p className="font-body text-[11px] text-[#d0c5af] mt-1.5">
                  Last Thought: <em>"{lastInternalMonologue}"</em>
                </p>
              </div>

              <span className="font-mono text-[10px] text-[#99907c] tracking-widest uppercase font-semibold">
                Recorded NPC Memories ({suspect.memories.length})
              </span>

              {suspect.memories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-2 rounded bg-[#1c2026] border border-[#31353c]/40 flex flex-col gap-1 text-[11px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#f2ca50] font-semibold">
                      {mem.topic}
                    </span>
                    <span className="font-mono text-[9px] text-[#99907c]">{mem.timestamp}</span>
                  </div>
                  <p className="text-[#d0c5af] font-body">"{mem.playerPrompt}"</p>
                  {mem.concessionMade && (
                    <span className="text-[#ff9963] font-mono text-[10px]">
                      ⚡ Concession: {mem.concessionMade}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTabDrawer === 'playerKnowledge' && (
            /* Player Knowledge & Deduction State (Distinguishes Player from Canonical Truth) */
            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1 text-xs">
              <div className="p-2.5 rounded bg-[#181c22] border border-[#31353c]/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-[#f2ca50] uppercase font-bold">
                    Case Hypothesis Progress
                  </span>
                  <span className="font-mono text-[11px] text-[#66dbb0] font-bold">
                    {playerKnowledge.caseHypothesisScore}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#0a0e14] rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#f2ca50] to-[#66dbb0] transition-all"
                    style={{ width: `${playerKnowledge.caseHypothesisScore}%` }}
                  />
                </div>
              </div>

              <div>
                <span className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider block mb-1">
                  Unlocked Suspect Concessions ({playerKnowledge.unlockedConcessions.length})
                </span>
                {playerKnowledge.unlockedConcessions.length === 0 ? (
                  <p className="text-[#99907c] italic text-[11px]">
                    No admissions unlocked yet. Press on alibis with physical evidence or high stress.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {playerKnowledge.unlockedConcessions.map((c, idx) => (
                      <div key={idx} className="p-2 rounded bg-[#0a0e14] border border-[#ff9963]/30 text-[#d0c5af] text-[11px]">
                        ✓ {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider block mb-1">
                  Contradictions Caught ({playerKnowledge.exposedContradictions.length})
                </span>
                {playerKnowledge.exposedContradictions.length === 0 ? (
                  <p className="text-[#99907c] italic text-[11px]">
                    No contradictions exposed. Present evidence to break Kabir's alibis.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {playerKnowledge.exposedContradictions.map((c, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-[#93000a]/40 border border-[#ffb4ab]/30 text-[#ffb4ab] font-mono text-[10px] rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FLOATING EVIDENCE CONFRONTATION DOCK (Triggerable / Overlay) */}
      {showEvidence && (
        <div className="absolute top-44 right-6 md:right-12 z-30 w-80 bg-[#0a0e14]/94 backdrop-blur-xl p-4 rounded-lg shadow-2xl border border-[#4d4635]/40 flex flex-col gap-2 transition-all duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-[#262a31]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#66dbb0]">fact_check</span>
              <span className="font-mono text-[11px] text-[#66dbb0] tracking-widest uppercase">
                CONFRONT WITH EVIDENCE
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#99907c]">SELECT PIECE</span>
          </div>

          {/* Evidence Chips */}
          <div className="flex flex-col gap-2">
            {evidenceList.map((item) => {
              const isSelected = lastSelectedEvidence === item.code;
              return (
                <button
                  key={item.id}
                  onClick={() => handleEvidenceConfront(item)}
                  disabled={isProcessing}
                  className={`text-left flex items-start gap-3 p-2.5 rounded transition-all group border ${
                    isSelected
                      ? 'bg-[#1c2026] border-[#f2ca50]'
                      : 'bg-[#181c22] border-[#31353c]/30 hover:bg-[#262a31]'
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-[#31353c] flex items-center justify-center text-[#f2ca50] group-hover:scale-105 transition-transform shrink-0">
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-[#f2ca50]">{item.code}</span>
                      <span className="font-mono text-[12px] text-[#dfe2eb] font-semibold truncate">
                        {item.title}
                      </span>
                    </div>
                    <p className="font-body text-[11px] text-[#d0c5af] truncate">{item.meta}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* BOTTOM INTERROGATION INTERFACE: Subtitle Banner & Query Input Console */}
      <div className="relative z-20 pb-4 px-6 md:px-12 flex flex-col items-center gap-3 w-full max-w-5xl mx-auto">
        {/* Live NPC Speech Subtitle Banner */}
        <div className="w-full bg-[#0a0e14]/94 backdrop-blur-xl p-5 rounded-xl shadow-2xl relative overflow-hidden border border-[#4d4635]/40">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f2ca50] to-transparent opacity-80" />

          {/* Speech Telemetry Status Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-headline text-lg text-[#f2ca50] tracking-wide font-medium">
                {suspect.name.toUpperCase()}
              </span>
              <span className="font-mono text-[11px] text-[#99907c] hidden sm:inline">[AUDIO STREAM ACTIVE]</span>
              <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#181c22] border border-[#31353c]/50 text-[#66dbb0] uppercase tracking-wider">
                {lastDiagnostics?.modeUsed === 'gemini' ? 'AI: GEMINI 3.8 FLASH [VALIDATED]' : 'AI: LOCAL MOCK [DETERMINISTIC]'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 h-3">
                <span className="w-1 bg-[#66dbb0] rounded h-full animate-bounce" />
                <span
                  className="w-1 bg-[#66dbb0] rounded h-2/3 animate-bounce"
                  style={{ animationDelay: '0.15s' }}
                />
                <span
                  className="w-1 bg-[#66dbb0] rounded h-5/6 animate-bounce"
                  style={{ animationDelay: '0.3s' }}
                />
                <span
                  className="w-1 bg-[#66dbb0] rounded h-1/2 animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
              <span className="font-mono text-[11px] text-[#66dbb0] tracking-widest">
                VOICE MATCH {suspect.audioMatchPercent}%
              </span>
            </div>
          </div>

          {/* Spoken Cinematic Dialogue Paragraph */}
          <p className="font-body text-[16px] md:text-[17px] text-[#dfe2eb] leading-relaxed font-normal min-h-[50px]">
            {currentDialogue}
          </p>
          {errorMessage && (
            <p className="font-mono text-xs text-[#ffb4ab] mt-1">{errorMessage}</p>
          )}
        </div>

        {/* Suggestion Prompts / Quick Test Questions Strip */}
        <div className="w-full flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-mono text-[10px] text-[#99907c] uppercase tracking-wider shrink-0">
            TEST QUESTIONS:
          </span>
          {[
            'Where were you at 10:30?',
            'Who were you with?',
            'Why did you lie to the police?',
            'Did you know Rohan?',
            'What happened in room 407?',
            'What are you hiding?',
          ].map((promptText) => (
            <button
              key={promptText}
              type="button"
              onClick={() => handleQuickPromptSubmit(promptText)}
              disabled={isProcessing}
              className="px-2.5 py-1 rounded bg-[#181c22] hover:bg-[#262a31] text-[#d0c5af] hover:text-[#f2ca50] border border-[#31353c]/40 font-mono text-[11px] whitespace-nowrap transition-colors disabled:opacity-50"
            >
              "{promptText}"
            </button>
          ))}
        </div>

        {/* PLAYER INTERACTION CONSOLE (Speech & Tactical Queries) */}
        <div className="w-full bg-[#181c22]/95 backdrop-blur-xl p-3 rounded-xl shadow-xl flex flex-col gap-2 border border-[#4d4635]/30">
          {/* Push-To-Talk Audio Banner */}
          <div
            className={`flex items-center justify-between px-3 py-1.5 rounded transition-colors ${
              isVoiceRecording ? 'bg-[#93000a]/40 border border-[#ffb4ab]' : 'bg-[#1c2026]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isVoiceRecording
                    ? 'bg-[#ffb4ab] text-[#93000a] animate-pulse'
                    : 'bg-[#22a37c]/40 text-[#66dbb0]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">mic</span>
              </div>
              <span className="font-mono text-[12px] text-[#dfe2eb] tracking-wider">
                <span className="text-[#f2ca50] font-bold">
                  {isVoiceRecording ? '[RECORDING AUDIO STREAM... RELEASE TO SEND]' : '[HOLD SPACEBAR TO SPEAK]'}
                </span>
                <span className="text-[#99907c] mx-2">|</span>
                <button
                  type="button"
                  onClick={() => handleQuickPromptSubmit('What happened in room 407?')}
                  className="text-[#d0c5af] hover:text-[#f2ca50] italic transition-colors text-left"
                >
                  "What happened in room 407?"
                </button>
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#99907c]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#66dbb0] animate-pulse" />
              <span>VOICE ENGINE 4.2 READY</span>
            </div>
          </div>

          {/* Text Query Input Field + Transmit Trigger */}
          <form onSubmit={handleQuerySubmit} className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#99907c]">
                terminal
              </span>
              <input
                className="w-full bg-[#0a0e14] text-[#dfe2eb] placeholder:text-[#99907c]/70 font-mono text-[12px] py-2.5 pl-10 pr-4 rounded focus:outline-none focus:ring-1 focus:ring-[#f2ca50] border border-[#31353c]/40 transition-all"
                placeholder="[TYPE NATURAL QUESTION] e.g. Where were you at 10:30? What are you hiding? Why are your cuffs scratched?"
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <button
              className="px-5 py-2.5 rounded bg-[#f2ca50] text-[#3c2f00] font-mono text-[12px] font-bold uppercase tracking-wider hover:bg-[#ffe088] transition-all flex items-center gap-2 shrink-0 shadow-md active:scale-95 disabled:opacity-50"
              type="submit"
              disabled={isProcessing || !queryInput.trim()}
            >
              <span>{isProcessing ? 'Analyzing...' : 'Transmit Query'}</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </form>

          {/* Godot / Engine Tactical Action Hints Strip */}
          <div className="flex flex-wrap items-center justify-between pt-1 px-1 text-[#99907c] font-mono text-[11px]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-[#262a31] text-[#dfe2eb] text-[10px]">TAB</kbd>
                <span className="text-[#d0c5af]">Present Evidence</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-[#262a31] text-[#dfe2eb] text-[10px]">H</kbd>
                <span className="text-[#d0c5af]">Transcript / Memory</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-[#262a31] text-[#dfe2eb] text-[10px]">N</kbd>
                <span className="text-[#d0c5af]">Notebook Deductions</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[#262a31] text-[#dfe2eb] text-[10px]">ESC</kbd>
              <span className="text-[#d0c5af]">Step Back / Conclude</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
