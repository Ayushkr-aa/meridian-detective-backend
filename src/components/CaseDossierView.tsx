import React from 'react';
import { CANONICAL_CASE, INITIAL_KABIR_MALHOTRA, CANONICAL_EVIDENCE } from '../data/canonicalCaseData';

interface CaseDossierViewProps {
  onReturnToInterrogation: () => void;
}

export const CaseDossierView: React.FC<CaseDossierViewProps> = ({ onReturnToInterrogation }) => {
  return (
    <div className="w-full min-h-[calc(100vh-5rem)] bg-[#0a0e14] text-[#dfe2eb] p-6 md:p-10 font-body">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto mb-8 bg-[#181c22]/90 border border-[#d4af37]/40 rounded-xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#d4af37] via-[#f2ca50] to-[#66dbb0]" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#f2ca50] shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[24px]">folder_shared</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[#f2ca50] tracking-widest uppercase font-bold">
                  POLICE DOSSIER // CLASSIFIED
                </span>
                <span className="px-2 py-0.5 rounded bg-[#93000a]/40 text-[#ffb4ab] border border-[#ffb4ab]/30 font-mono text-[10px]">
                  CANONICAL GROUND TRUTH
                </span>
              </div>
              <h1 className="font-headline text-2xl font-bold text-[#dfe2eb] tracking-tight mt-0.5">
                Case File #04: The Malabar Oberoi Homicide
              </h1>
              <p className="font-body text-sm text-[#d0c5af] max-w-3xl mt-1">
                Victim: <strong className="text-[#dfe2eb]">{CANONICAL_CASE.victim.name}</strong> ({CANONICAL_CASE.victim.title}). 
                Crime Scene: <span className="text-[#f2ca50]">{CANONICAL_CASE.crimeScene}</span>.
              </p>
            </div>
          </div>

          <button
            onClick={onReturnToInterrogation}
            className="px-4 py-2.5 rounded bg-[#f2ca50] text-[#3c2f00] font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-[#ffe088] transition-all flex items-center gap-2 shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Interrogation</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Suspect Profile & Immutable Facts */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Target Profile Card */}
          <div className="bg-[#181c22] border border-[#31353c] rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#31353c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f2ca50]">person</span>
                <h3 className="font-headline font-bold text-base text-[#dfe2eb]">
                  Primary Suspect: {INITIAL_KABIR_MALHOTRA.name}
                </h3>
              </div>
              <span className="font-mono text-[10px] text-[#f2ca50] bg-[#0a0e14] px-2 py-0.5 rounded border border-[#f2ca50]/30">
                {INITIAL_KABIR_MALHOTRA.code}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#99907c]">Role:</span>
                <span className="text-[#dfe2eb] font-semibold">{INITIAL_KABIR_MALHOTRA.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#99907c]">Personality Traits:</span>
                <span className="text-[#66dbb0] font-mono">
                  {INITIAL_KABIR_MALHOTRA.personality.traits.join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#99907c]">Speaking Style:</span>
                <span className="text-[#d0c5af] text-right max-w-[240px]">
                  {INITIAL_KABIR_MALHOTRA.personality.speakingStyle}
                </span>
              </div>
              <div className="p-3 bg-[#0a0e14] rounded border border-[#31353c]/50 mt-2">
                <span className="font-mono text-[10px] text-[#ff9963] uppercase font-bold block mb-1">
                  Private Reality with Victim (The Secret)
                </span>
                <p className="text-[#d0c5af] font-body text-xs">
                  {INITIAL_KABIR_MALHOTRA.relationshipWithVictim.privateReality}
                </p>
              </div>
            </div>
          </div>

          {/* Immutable Ground Truth */}
          <div className="bg-[#181c22] border border-[#31353c] rounded-xl p-5 shadow-xl">
            <h3 className="font-headline font-bold text-base text-[#dfe2eb] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb4ab]">lock</span>
              <span>Immutable Ground Truth (Game Engine Reality)</span>
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs text-[#d0c5af]">
              {CANONICAL_CASE.immutableGroundTruth.map((truth, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-2 bg-[#0a0e14] rounded border border-[#31353c]/40">
                  <span className="text-[#f2ca50] font-mono font-bold mt-0.5">#{idx + 1}</span>
                  <span>{truth}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Canonical Murder Timeline & Forensic Evidence */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Timeline */}
          <div className="bg-[#181c22] border border-[#31353c] rounded-xl p-5 shadow-xl">
            <h3 className="font-headline font-bold text-base text-[#dfe2eb] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#66dbb0]">schedule</span>
              <span>Verified Crime Scene Timeline</span>
            </h3>
            <div className="flex flex-col gap-2">
              {CANONICAL_CASE.timeline.map((event, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-[#0a0e14] rounded-lg border border-[#31353c]/40"
                >
                  <span className="font-mono text-xs text-[#f2ca50] font-bold shrink-0 mt-0.5">
                    {event.time}
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-[#dfe2eb] font-body">{event.event}</p>
                    <span className="font-mono text-[10px] text-[#99907c]">
                      Actor: {event.actor} • Verified by: {event.verifiedBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forensic Evidence Items */}
          <div className="bg-[#181c22] border border-[#31353c] rounded-xl p-5 shadow-xl">
            <h3 className="font-headline font-bold text-base text-[#dfe2eb] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#f2ca50]">fact_check</span>
              <span>Recovered Physical Evidence</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CANONICAL_EVIDENCE.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#0a0e14] rounded-lg border border-[#31353c]/40 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#f2ca50] font-bold">
                      {item.code}
                    </span>
                    <span className="font-mono text-[10px] text-[#66dbb0]">
                      +{item.impactOnStress} Stress
                    </span>
                  </div>
                  <h4 className="font-headline text-xs font-bold text-[#dfe2eb]">{item.title}</h4>
                  <p className="font-body text-[11px] text-[#99907c]">{item.canonicalFact}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
