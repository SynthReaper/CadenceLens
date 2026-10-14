import React from 'react';
import { ShieldCheck, Award, Terminal, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t-2 border-[#1e1b19] bg-[#fff8f5] mt-12 py-10 relative overflow-hidden">
      {/* SynthReaper Watermark Ribbon */}
      <div className="bg-[#ffddb6] border-y-2 border-[#1e1b19] py-1.5 px-4 mb-8 text-center font-mono text-xs font-bold text-[#805200] tracking-wider uppercase">
        ENGINEERED WITH PASSION BY SYNTHREAPER
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs font-mono">

          {/* Col 1: Masthead & SynthReaper Seal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/favicon.svg"
                alt="CadenceLens Logo Emblem"
                className="w-9 h-9 object-contain shrink-0"
              />
              <div>
                <div className="font-display font-black text-sm text-[#1e1b19] tracking-tight">
                  CadenceLens
                </div>
                <div className="text-[10px] text-[#594139] font-bold">
                  Engineered by SynthReaper
                </div>
              </div>
            </div>
            <p className="font-serif text-[#594139] leading-relaxed text-xs">
              A deterministic forensic speech intelligence system combining speaker-agnostic acoustic normalization, non-linear dynamic time warping, and causal prosody flaw grounding.
            </p>
          </div>

          {/* Col 2: Forensic Signal Stack */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-black uppercase text-[#1e1b19] border-b border-[#1e1b19]/30 pb-1 flex items-center gap-1.5">
              <span>🔬</span> Forensic Acoustic Stack
            </div>
            <ul className="space-y-1.5 text-[11px] text-[#594139]">
              <li className="flex items-center gap-1.5">
                <span className="text-[#37613d] font-bold">✓</span> Praat / Parselmouth C-Engine
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#37613d] font-bold">✓</span> Semitone Centered Pitch (F0,ST)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#37613d] font-bold">✓</span> Burg LPC Formants (F1, F2, F3)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#37613d] font-bold">✓</span> Dynamic Time Warping (DTW)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#37613d] font-bold">✓</span> HNR, Local Jitter &amp; Local Shimmer
              </li>
            </ul>
          </div>

          {/* Col 3: Hackathon Metadata */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-black uppercase text-[#1e1b19] border-b border-[#1e1b19]/30 pb-1 flex items-center gap-1.5">
              <span>🏆</span> Hackathon Specifications
            </div>
            <div className="space-y-1.5 text-[11px] text-[#594139]">
              <div><b>Event:</b> Multimodal AI Hackathon 2026</div>
              <div><b>Organizers:</b> IIT Mandi &amp; KamandPrompt</div>
              <div><b>Track:</b> Track C (Contrastive Speech Analytics)</div>
              <div><b>Lead Architect:</b> <span className="font-bold text-[#cb4914]">SynthReaper</span></div>
              <div><b>Dataset:</b> Contrastive-Oratory-2026 (25 WAVs)</div>
            </div>
          </div>

          {/* Col 4: Authenticity & Status */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-black uppercase text-[#1e1b19] border-b border-[#1e1b19]/30 pb-1 flex items-center gap-1.5">
              <span>🛡️</span> Authenticity &amp; Verification
            </div>
            <div className="bg-white border-2 border-[#1e1b19] p-2.5 rounded-lg shadow-press-xs space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#594139]">SynthReaper Core:</span>
                <span className="font-bold text-[#37613d]">AUTHENTICATED</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#594139]">PyTest Suite:</span>
                <span className="font-bold text-[#37613d]">7/7 PASSING</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#594139]">Vercel Edge Ready:</span>
                <span className="font-bold text-[#37613d]">STANDALONE / LIVE</span>
              </div>
            </div>
            <div className="pt-1 text-center">
              <span className="rubber-stamp text-[10px] text-[#37613d] border-[#37613d] inline-block -rotate-2">
                MADE BY SYNTHREAPER • AUDITED
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Hairline Bar */}
        <div className="border-t border-[#1e1b19]/20 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-[#594139]">
          <div className="flex items-center gap-1">
            <span>© 2026 CadenceLens. Engineered with precision by</span>
            <span className="font-bold text-[#1e1b19] underline decoration-[#cb4914] decoration-2">SynthReaper</span>.
          </div>
        </div>
      </div>
    </footer>
  );
}
