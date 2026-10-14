import React from 'react';
import { Mic, BarChart2, FileText, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'studio', label: '1. Contrastive Studio', icon: BarChart2 },
    { id: 'micLab', label: '2. Mic Lab (Teleprompter)', icon: Mic },
    { id: 'benchmark', label: '3. Corpus Benchmark', icon: CheckCircle2 },
    { id: 'research', label: '4. Research Paper', icon: FileText },
  ];

  return (
    <header className="border-b-2 border-[#1e1b19] bg-[#fff8f5] shadow-sm sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      {/* Top Telemetry & Watermark Strip */}
      <div className="border-b border-[#1e1b19]/20 bg-[#fffdfa] px-4 py-1 text-[11px] font-mono text-[#594139] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="washi-tape-primary text-[10px] font-bold px-2 py-0.5 rounded border border-[#1e1b19] text-[#872a00]">
            VOL. IV • ENGINEERED BY SYNTHREAPER
          </span>
          <span className="hidden sm:inline text-xs text-[#1e1b19] font-bold">
            IIT Mandi Multimodal AI Hackathon 2026 • Track C
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#37613d] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#37613d] animate-pulse"></span>
            Praat DSP: LIVE
          </span>
          <span className="hidden md:inline text-[#1e1b19]/40">•</span>
          <span className="text-[#cb4914] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            SYNTHREAPER VERIFIED
          </span>
        </div>
      </div>

      {/* Main Masthead Lockup */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab('studio')}>
          <img
            src="/favicon.svg"
            alt="CadenceLens Logo Emblem"
            className="w-11 h-11 object-contain shrink-0 active:scale-95 transition-transform"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-xl text-[#1e1b19] tracking-tight">
                CadenceLens
              </h1>
              <span className="washi-tape-tertiary text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-[#1e1b19] text-[#805200]">
                BY SYNTHREAPER
              </span>
            </div>
            <p className="text-xs font-mono text-[#594139]">
              Forensic Speech Analytics &amp; Temporal Flaw Grounding
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-xs py-0.5 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#1e1b19] font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#cb4914] text-white shadow-press translate-x-0'
                    : 'bg-white text-[#1e1b19] hover:bg-[#fff8f5] shadow-press-xs active:translate-x-0.5 active:translate-y-0.5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
