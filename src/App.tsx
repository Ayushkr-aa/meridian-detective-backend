/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InterrogationView } from './components/InterrogationView';
import { ArchitectureView } from './components/ArchitectureView';
import { CaseDossierView } from './components/CaseDossierView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'interrogation' | 'architecture' | 'dossier'>('interrogation');

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#dfe2eb] flex flex-col justify-between font-body select-none">
      {/* HEADER: Matches exact Google Stitch HUD Specification */}
      <header className="fixed top-0 inset-x-0 z-50 h-20 pointer-events-none bg-gradient-to-b from-[#0a0e14] via-[#0a0e14]/80 to-transparent">
        <div className="w-full h-20 px-6 md:px-12 flex items-center justify-between pointer-events-auto">
          {/* Brand & Case Location Header */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#f2ca50] tracking-widest uppercase font-semibold">
                  AI DETECTIVE
                </span>
                <span className="font-mono text-[10px] text-[#4d4635] font-bold">//</span>
                <span className="font-mono text-xs text-[#dfe2eb] tracking-widest uppercase font-medium">
                  CASE FILE #04
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#99907c]">
                <span className="material-symbols-outlined text-[12px] text-[#f2ca50]">schedule</span>
                <span>23:42 IST</span>
                <span className="text-[#4d4635]">|</span>
                <span className="material-symbols-outlined text-[12px] text-[#66dbb0]">location_on</span>
                <span>THE REGAL OBEROI SUITE 804 // RM 407</span>
              </div>
            </div>

            <div className="h-6 w-px bg-[#4d4635]/40 hidden md:block" />

            {/* Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1 font-mono text-[11px]">
              <button
                onClick={() => setActiveTab('interrogation')}
                className={`px-3 py-1.5 tracking-wider uppercase transition-colors rounded ${
                  activeTab === 'interrogation'
                    ? 'bg-[#d4af37] text-[#554300] font-bold shadow'
                    : 'text-[#d0c5af] hover:text-[#dfe2eb]'
                }`}
              >
                Interrogation View
              </button>
              <button
                onClick={() => setActiveTab('architecture')}
                className={`px-3 py-1.5 tracking-wider uppercase transition-colors rounded ${
                  activeTab === 'architecture'
                    ? 'bg-[#d4af37] text-[#554300] font-bold shadow'
                    : 'text-[#d0c5af] hover:text-[#dfe2eb]'
                }`}
              >
                Forensic Matrix / Architecture
              </button>
              <button
                onClick={() => setActiveTab('dossier')}
                className={`px-3 py-1.5 tracking-wider uppercase transition-colors rounded ${
                  activeTab === 'dossier'
                    ? 'bg-[#d4af37] text-[#554300] font-bold shadow'
                    : 'text-[#d0c5af] hover:text-[#dfe2eb]'
                }`}
              >
                Case Dossier / Ground Truth
              </button>
            </nav>
          </div>

          {/* Right Header Status Telemetry */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#181c22]/70 rounded border border-[#4d4635]/30 backdrop-blur-md">
              <span className="material-symbols-outlined text-[14px] text-[#66dbb0] animate-pulse">
                mic
              </span>
              <span className="font-mono text-[10px] text-[#66dbb0] tracking-widest uppercase">
                MIC LIVE
              </span>
            </div>

            <div className="hidden sm:flex flex-col items-end">
              <span className="font-mono text-[10px] text-[#d0c5af] tracking-wider">
                120 FPS // ENGINE VER 5.4
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]" />
                <span className="font-mono text-[10px] text-[#f2ca50] tracking-widest uppercase">
                  ACTIVE INTERROGATION
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-[#f2ca50] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#3c2f00] text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="w-full pt-20 flex-1 flex flex-col justify-between">
        {activeTab === 'interrogation' && (
          <InterrogationView onOpenArchitecture={() => setActiveTab('architecture')} />
        )}
        {activeTab === 'architecture' && (
          <ArchitectureView onReturnToInterrogation={() => setActiveTab('interrogation')} />
        )}
        {activeTab === 'dossier' && (
          <CaseDossierView onReturnToInterrogation={() => setActiveTab('interrogation')} />
        )}
      </main>

      {/* FOOTER: Matches exact Google Stitch HUD Specification */}
      <footer className="w-full bg-[#0a0e14]/90 border-t border-[#4d4635]/20 py-2.5 px-6 md:px-12 pointer-events-auto">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2 font-mono text-[10px] text-[#99907c]">
          <div className="flex items-center gap-3">
            <span className="text-[#f2ca50]">EVIDENCE PROTOCOL: LEVEL 3 OMNI-STREAM</span>
            <span className="text-[#4d4635]">•</span>
            <span>SURVEILLANCE NODE #804-A</span>
            <span className="text-[#4d4635]">•</span>
            <span className="text-[#66dbb0]">SUSPECT: KABIR MALHOTRA (BUSINESS PARTNER)</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab(activeTab === 'dossier' ? 'interrogation' : 'dossier')}
              className="flex items-center gap-1.5 hover:text-[#dfe2eb] transition-colors"
            >
              <span className="px-1.5 py-0.5 rounded bg-[#262a31] text-[#dfe2eb] border border-[#4d4635]/30">
                TAB
              </span>
              <span className="text-[#d0c5af]">
                {activeTab === 'dossier' ? 'RESUME INTERROGATION' : 'OPEN DOSSIER'}
              </span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-[#262a31] text-[#dfe2eb] border border-[#4d4635]/30">
                SPACE
              </span>
              <span className="text-[#d0c5af]">VOICE QUERY PTT</span>
            </div>
            <button
              onClick={() => setActiveTab('interrogation')}
              className="flex items-center gap-1.5 hover:text-[#dfe2eb] transition-colors"
            >
              <span className="px-1.5 py-0.5 rounded bg-[#262a31] text-[#dfe2eb] border border-[#4d4635]/30">
                ESC
              </span>
              <span className="text-[#d0c5af]">PAUSE / RESET</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
