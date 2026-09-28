import React, { useState } from 'react';
import {
  ARCHITECTURE_TOPICS,
  DATA_FLOW_PIPELINE,
  ArchitectureTopic,
  DataFlowStep,
} from '../data/architectureSpec';

interface ArchitectureViewProps {
  onReturnToInterrogation: () => void;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ onReturnToInterrogation }) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'spec14' | 'matrix'>('pipeline');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('ui-components');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState('');

  const selectedTopic = ARCHITECTURE_TOPICS.find((t) => t.id === selectedTopicId) || ARCHITECTURE_TOPICS[0];
  const currentStep = DATA_FLOW_PIPELINE.find((s) => s.step === activeStep) || DATA_FLOW_PIPELINE[0];

  const filteredTopics = ARCHITECTURE_TOPICS.filter(
    (t) =>
      t.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] bg-[#0a0e14] text-[#dfe2eb] p-6 md:p-10 font-body">
      {/* Top Banner with Canonical Truth Warning */}
      <div className="max-w-7xl mx-auto mb-8 bg-[#181c22]/90 border border-[#d4af37]/40 rounded-xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#d4af37] via-[#f2ca50] to-[#66dbb0]" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#f2ca50] shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[#f2ca50] tracking-widest uppercase font-bold">
                  CANONICAL ARCHITECTURE DIRECTIVE
                </span>
                <span className="px-2 py-0.5 rounded bg-[#93000a]/40 text-[#ffb4ab] border border-[#ffb4ab]/30 font-mono text-[10px]">
                  IMMUTABLE GROUND TRUTH
                </span>
              </div>
              <h1 className="font-headline text-2xl font-bold text-[#dfe2eb] tracking-tight mt-0.5">
                AI Detective Interrogation Engine Architecture
              </h1>
              <p className="font-body text-sm text-[#d0c5af] max-w-3xl mt-1">
                The Large Language Model is <strong className="text-[#ffb4ab]">never the source of truth</strong> for the murder case. 
                Canonical case facts, murder timeline, and physical evidence logs remain strictly authoritative in the backend. 
                Gemini powers natural dialogue, psychological posture, and character cadence strictly within supplied bounds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end">
            <button
              onClick={onReturnToInterrogation}
              className="px-4 py-2.5 rounded bg-[#f2ca50] text-[#3c2f00] font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-[#ffe088] transition-all flex items-center gap-2 shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Live Interrogation HUD</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[#31353c]/50">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'pipeline'
                ? 'bg-[#d4af37] text-[#3c2f00] font-bold shadow'
                : 'bg-[#1c2026] text-[#dfe2eb] hover:bg-[#262a31]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">timeline</span>
            <span>1. End-to-End Data Flow Pipeline (Player → Godot → LLM → Godot)</span>
          </button>

          <button
            onClick={() => setActiveTab('spec14')}
            className={`px-4 py-2 rounded font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'spec14'
                ? 'bg-[#d4af37] text-[#3c2f00] font-bold shadow'
                : 'bg-[#1c2026] text-[#dfe2eb] hover:bg-[#262a31]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            <span>2. 14-Point Technical Specification</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-[#d4af37] text-[#3c2f00] font-bold shadow'
                : 'bg-[#1c2026] text-[#dfe2eb] hover:bg-[#262a31]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>3. Boundary Separation (Godot vs FastAPI vs Gemini vs Postgres)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DATA FLOW PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Step Stepper */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#31353c]">
              <span className="font-mono text-xs text-[#99907c] tracking-widest uppercase font-semibold">
                PIPELINE EXECUTION STEPS
              </span>
              <span className="font-mono text-xs text-[#f2ca50]">Step {activeStep} of 7</span>
            </div>

            {DATA_FLOW_PIPELINE.map((step) => {
              const isSelected = step.step === activeStep;
              return (
                <div
                  key={step.step}
                  onClick={() => setActiveStep(step.step)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#1c2026] border-[#f2ca50] shadow-lg shadow-[#d4af37]/5'
                      : 'bg-[#181c22]/70 border-[#31353c]/40 hover:bg-[#1c2026]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[11px] font-bold ${
                          isSelected
                            ? 'bg-[#f2ca50] text-[#3c2f00]'
                            : 'bg-[#262a31] text-[#dfe2eb]'
                        }`}
                      >
                        {step.step}
                      </span>
                      <span className="font-headline font-semibold text-sm text-[#dfe2eb]">
                        {step.label}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[#66dbb0] bg-[#003828]/60 px-2 py-0.5 rounded border border-[#22a37c]/30">
                      {step.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#99907c] pl-8">
                    <span>{step.source}</span>
                    <span>→</span>
                    <span className="text-[#d0c5af]">{step.destination}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Detailed Deep Dive for Current Step */}
          <div className="lg:col-span-7 bg-[#181c22]/90 border border-[#31353c] rounded-xl p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#31353c]">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded bg-[#f2ca50] text-[#3c2f00] flex items-center justify-center font-mono font-bold text-sm">
                    {currentStep.step}
                  </span>
                  <div>
                    <h3 className="font-headline text-lg font-bold text-[#dfe2eb]">
                      {currentStep.label}
                    </h3>
                    <p className="font-mono text-xs text-[#99907c]">
                      {currentStep.source} ➔ {currentStep.destination}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded bg-[#22a37c]/20 text-[#66dbb0] border border-[#22a37c]/40 font-mono text-xs font-semibold">
                  {currentStep.role}
                </span>
              </div>

              <div className="mt-4">
                <h4 className="font-mono text-xs text-[#f2ca50] tracking-wider uppercase mb-1">
                  Architectural Description
                </h4>
                <p className="font-body text-sm text-[#dfe2eb] leading-relaxed">
                  {currentStep.description}
                </p>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-mono text-xs text-[#66dbb0] tracking-wider uppercase">
                    Live Payload / Data Contract
                  </h4>
                  <span className="font-mono text-[10px] text-[#99907c]">JSON / Internal State</span>
                </div>
                <pre className="p-4 bg-[#0a0e14] border border-[#31353c] rounded-lg font-mono text-xs text-[#dfe2eb] overflow-x-auto leading-relaxed">
                  <code>{currentStep.payloadPreview}</code>
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#31353c]">
              <button
                disabled={activeStep === 1}
                onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 rounded bg-[#262a31] text-xs font-mono text-[#dfe2eb] hover:bg-[#31353c] disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                Previous Step
              </button>
              <button
                disabled={activeStep === 7}
                onClick={() => setActiveStep((prev) => Math.min(7, prev + 1))}
                className="px-4 py-2 rounded bg-[#f2ca50] text-[#3c2f00] text-xs font-mono font-bold hover:bg-[#ffe088] disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                Next Step ({activeStep}/7)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 14-POINT TECHNICAL SPECIFICATION */}
      {activeTab === 'spec14' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: 14 Topics Navigation */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[#99907c]">
                search
              </span>
              <input
                type="text"
                placeholder="Filter 14 specifications..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-[#181c22] border border-[#31353c] rounded px-3 py-2 pl-9 font-mono text-xs text-[#dfe2eb] placeholder:text-[#99907c]"
              />
            </div>

            <div className="flex flex-col gap-1.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredTopics.map((topic) => {
                const isSelected = topic.id === selectedTopicId;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-[#1c2026] border-[#f2ca50] text-[#dfe2eb]'
                        : 'bg-[#181c22]/60 border-[#31353c]/30 text-[#d0c5af] hover:bg-[#181c22]'
                    }`}
                  >
                    <span
                      className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        isSelected
                          ? 'bg-[#f2ca50] text-[#3c2f00]'
                          : 'bg-[#262a31] text-[#99907c]'
                      }`}
                    >
                      {String(topic.number).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-headline font-semibold text-xs truncate">
                        {topic.title}
                      </div>
                      <div className="font-mono text-[10px] text-[#99907c] truncate mt-0.5">
                        {topic.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Spec View */}
          <div className="lg:col-span-8 bg-[#181c22]/90 border border-[#31353c] rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#31353c]">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded bg-[#f2ca50] text-[#3c2f00] flex items-center justify-center font-mono font-bold text-sm">
                  {selectedTopic.number}
                </span>
                <div>
                  <h3 className="font-headline text-xl font-bold text-[#dfe2eb]">
                    {selectedTopic.title}
                  </h3>
                  <span className="font-mono text-xs text-[#66dbb0]">
                    Category: {selectedTopic.category}
                  </span>
                </div>
              </div>
            </div>

            <p className="font-body text-sm text-[#dfe2eb] leading-relaxed mt-4 p-3 bg-[#1c2026] rounded border-l-2 border-[#f2ca50]">
              {selectedTopic.summary}
            </p>

            <div className="mt-6">
              <h4 className="font-mono text-xs text-[#f2ca50] tracking-wider uppercase mb-3">
                Core Architectural Requirements & Directives
              </h4>
              <ul className="flex flex-col gap-2.5">
                {selectedTopic.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-3 font-body text-sm text-[#d0c5af]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#66dbb0] mt-2 shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedTopic.schemaOrCode && (
              <div className="mt-6">
                <h4 className="font-mono text-xs text-[#66dbb0] tracking-wider uppercase mb-2">
                  Technical Contract / Interface Code
                </h4>
                <pre className="p-4 bg-[#0a0e14] border border-[#31353c] rounded-lg font-mono text-xs text-[#dfe2eb] overflow-x-auto leading-relaxed max-h-80">
                  <code>{selectedTopic.schemaOrCode}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BOUNDARY SEPARATION MATRIX */}
      {activeTab === 'matrix' && (
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* GODOT */}
            <div className="bg-[#181c22] border border-[#4d4635] rounded-xl p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#31353c]">
                <span className="material-symbols-outlined text-[#f2ca50]">sports_esports</span>
                <h3 className="font-headline font-bold text-base text-[#dfe2eb]">Godot 4 (Client)</h3>
              </div>
              <p className="font-body text-xs text-[#99907c]">
                Owns player immersion, 3D luxury suite environment, real-time input, and audiovisual playback.
              </p>
              <ul className="flex flex-col gap-2 text-xs text-[#d0c5af]">
                <li className="flex items-start gap-2">
                  <span className="text-[#f2ca50] font-bold">✓</span>
                  <span>120 FPS Tactical Glassmorphism HUD</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#f2ca50] font-bold">✓</span>
                  <span>Push-to-Talk audio recording (AudioEffectCapture)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#f2ca50] font-bold">✓</span>
                  <span>Skeletal animation blend tree (lip-sync, tension)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#f2ca50] font-bold">✓</span>
                  <span>3D spatial room acoustics in Hotel Suite 804</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#99907c] font-bold">✗</span>
                  <span className="text-[#99907c]">Never holds murder solution or unlocks</span>
                </li>
              </ul>
            </div>

            {/* FASTAPI */}
            <div className="bg-[#181c22] border border-[#22a37c]/60 rounded-xl p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#31353c]">
                <span className="material-symbols-outlined text-[#66dbb0]">dns</span>
                <h3 className="font-headline font-bold text-base text-[#dfe2eb]">FastAPI (Backend)</h3>
              </div>
              <p className="font-body text-xs text-[#99907c]">
                The authoritative arbiter and guardrail gatekeeper between game client and AI models.
              </p>
              <ul className="flex flex-col gap-2 text-xs text-[#d0c5af]">
                <li className="flex items-start gap-2">
                  <span className="text-[#66dbb0] font-bold">✓</span>
                  <span>Session orchestration and turn rate-limits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#66dbb0] font-bold">✓</span>
                  <span>Dynamic prompt assembly with canonical constraints</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#66dbb0] font-bold">✓</span>
                  <span>Pre- and Post-validation guardrail filtering</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#66dbb0] font-bold">✓</span>
                  <span>Deterministic stress calculations on evidence hits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#66dbb0] font-bold">✓</span>
                  <span>Streaming STT and TTS dispatch pipelines</span>
                </li>
              </ul>
            </div>

            {/* GEMINI */}
            <div className="bg-[#181c22] border border-[#ff9963]/60 rounded-xl p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#31353c]">
                <span className="material-symbols-outlined text-[#ff9963]">psychology</span>
                <h3 className="font-headline font-bold text-base text-[#dfe2eb]">Gemini (AI Roleplay)</h3>
              </div>
              <p className="font-body text-xs text-[#99907c]">
                Breathes organic life, deception, high-society cadence, and emotional panic into Vikram Singhania.
              </p>
              <ul className="flex flex-col gap-2 text-xs text-[#d0c5af]">
                <li className="flex items-start gap-2">
                  <span className="text-[#ff9963] font-bold">✓</span>
                  <span>Interprets natural language player queries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ff9963] font-bold">✓</span>
                  <span>Generates context-rich South Asian elite speech</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ff9963] font-bold">✓</span>
                  <span>Expresses hesitation, stammering, and defiance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ff9963] font-bold">✓</span>
                  <span>Outputs emotional telemetry tags & blendshape keys</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ffb4ab] font-bold">✗</span>
                  <span className="text-[#ffb4ab]">Zero authority to invent new clues or solve crime</span>
                </li>
              </ul>
            </div>

            {/* POSTGRESQL */}
            <div className="bg-[#181c22] border border-[#99907c]/60 rounded-xl p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#31353c]">
                <span className="material-symbols-outlined text-[#d0c5af]">database</span>
                <h3 className="font-headline font-bold text-base text-[#dfe2eb]">PostgreSQL (Ground Truth)</h3>
              </div>
              <p className="font-body text-xs text-[#99907c]">
                The relational bedrock holding immutable case timeline facts, clues, and player progression.
              </p>
              <ul className="flex flex-col gap-2 text-xs text-[#d0c5af]">
                <li className="flex items-start gap-2">
                  <span className="text-[#dfe2eb] font-bold">✓</span>
                  <span>Immutable murder chronological timeline</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#dfe2eb] font-bold">✓</span>
                  <span>Forensic evidence registry (#EVD-01, #EVD-02, #EVD-03)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#dfe2eb] font-bold">✓</span>
                  <span>NPC persona definitions and confession limits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#dfe2eb] font-bold">✓</span>
                  <span>Historical interrogation transcripts for replay/audit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#dfe2eb] font-bold">✓</span>
                  <span>Contradiction trigger rules and unlock state</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Validation Rule Highlights */}
          <div className="bg-[#181c22] border border-[#31353c] rounded-xl p-6">
            <h4 className="font-headline text-lg font-bold text-[#dfe2eb] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#f2ca50]">gavel</span>
              <span>The Canonical Truth Gatekeeping Flow</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 font-mono text-xs">
              <div className="p-3 bg-[#0a0e14] rounded border border-[#31353c]">
                <span className="text-[#f2ca50] font-bold uppercase">1. Pre-Inference Assembly</span>
                <p className="text-[#d0c5af] font-body text-xs mt-1">
                  FastAPI pulls the ground truth from PostgreSQL and writes hard constraints into Gemini's prompt:
                  <em>"You were in 804 at 22:35. You claim you were in the cellar. Do NOT admit being in 804 until stress &gt; 85."</em>
                </p>
              </div>
              <div className="p-3 bg-[#0a0e14] rounded border border-[#31353c]">
                <span className="text-[#66dbb0] font-bold uppercase">2. Post-Inference Validation</span>
                <p className="text-[#d0c5af] font-body text-xs mt-1">
                  FastAPI inspects the returned JSON. If Gemini says <em>"I killed him with a knife"</em> when the canonical weapon was blunt trauma glass, the validator intercepts and replaces with deterministic deflection.
                </p>
              </div>
              <div className="p-3 bg-[#0a0e14] rounded border border-[#31353c]">
                <span className="text-[#ff9963] font-bold uppercase">3. Client Dispatch</span>
                <p className="text-[#d0c5af] font-body text-xs mt-1">
                  Godot receives only certified, safe responses along with discrete telemetry instructions (stress = 79%, animation = "table_slam", lip_sync = stream_chunk).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
