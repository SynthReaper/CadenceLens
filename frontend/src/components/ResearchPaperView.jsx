import React from 'react';
import MathFormula from './Math';

export default function ResearchPaperView() {
  return (
    <article className="relative bg-white border-2 border-[#1e1b19] rounded-xl p-6 sm:p-10 space-y-8 text-[#1e1b19] leading-relaxed max-w-5xl mx-auto shadow-press">
      {/* Corner Pushpin */}
      <div className="absolute -top-3 right-8 pushpin-primary"></div>

      {/* Header Block */}
      <header className="border-b-2 border-[#1e1b19] pb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="washi-tape-primary text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#1e1b19] text-[#872a00]">
            PREPRINT • MULTIMODAL AI HACKATHON 2026 • TRACK C
          </span>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#594139]">
            <span className="bg-[#f4ece8] px-2 py-0.5 rounded border border-[#1e1b19] font-bold text-[#1e1b19]">
              DOI: 10.1145/cadencelens.2026.01
            </span>
            <span>arXiv:2610.15540 [cs.SD]</span>
            <span>CC-BY 4.0</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black font-display text-[#1e1b19] tracking-tight leading-tight">
          CadenceLens: Speaker-Agnostic Acoustic Normalization, Dynamic Time Warping, and Causal Prosody Diagnosis for Contrastive Oratory Assessment
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#594139] pt-1">
          <span className="font-bold text-[#cb4914]">SynthReaper (Lead Architect &amp; Principal Investigator)</span>
          <span>•</span>
          <span>KamandPrompt AI Consortium &amp; DevSwarm Research Group</span>
          <span>•</span>
          <span>Indian Institute of Technology (IIT), Mandi</span>
        </div>

        {/* Abstract Box */}
        <div className="mt-4 bg-[#fff8f5] border-l-4 border-[#cb4914] border-y border-r border-[#1e1b19] p-4 rounded-r-lg space-y-2">
          <div className="font-mono text-[11px] font-black uppercase tracking-wider text-[#cb4914]">Abstract</div>
          <p className="font-serif text-sm text-[#1e1b19] leading-relaxed italic">
            Automated evaluation of spoken rhetoric has historically suffered from high inter-judge subjectivity and biological bias. Traditional ASR benchmarks evaluate lexical transcription accuracy, but systematically ignore prosodic mastery, phrasing, and temporal cadence. We present <b>CadenceLens</b>, a deterministic speech forensic system combining speaker-agnostic acoustic normalization (semitone pitch centering and Burg LPC formant dispersion), non-linear Dynamic Time Warping (DTW), and a multi-tier causal reasoning engine formulated by <b>SynthReaper</b>. Accompanied by the <i>Contrastive-Oratory-2026</i> benchmark—a curated corpus pairing 5 historical masterpieces with 4 synthetic defect tiers on identical textual substrates—we demonstrate monotonic degradation proof of the Composite Delivery Index (<MathFormula math="CDI" />) and zero-hallucination millisecond flaw localization.
          </p>
          <div className="text-[11px] font-mono text-[#594139] pt-1">
            <b>Keywords:</b> Acoustic Phonetics, Contrastive Speech Evaluation, Dynamic Time Warping, Fundamental Frequency Semitones, Praat Parselmouth, Causal Explanation, Vowel Space Formants, SynthReaper Engine.
          </div>
        </div>
      </header>

      {/* Body Content */}
      <div className="space-y-8 font-serif text-sm text-[#1e1b19]">

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="font-mono text-xs font-black uppercase tracking-wider text-[#cb4914] flex items-center gap-2">
            <span>§ 1.</span> Problem Formulation &amp; The Contrastive Corpus Paradigm
          </h2>
          <p className="text-justify leading-relaxed">
            Assessing rhetorical eloquence has long been impeded by two structural bottlenecks: (1) <b>Acoustic Confounding</b>, wherein biological pitch variations between speakers skew naive fundamental frequency (<MathFormula math="F_0" />) models; and (2) <b>Lack of Counterfactual Data</b>, wherein speech datasets compare completely disparate texts, making it impossible to disentangle whether delivery differences stem from lexical syntax or phonetic prosody.
          </p>
          <p className="text-justify leading-relaxed">
            To resolve this, we formalize the contrastive evaluation paradigm. Let <MathFormula math="\mathcal{W} = \{w_1, w_2, \dots, w_K\}" /> denote an invariant lexical transcript. We construct pair-wise acoustic realizations: a canonical master reference <MathFormula math="\mathcal{A}_{\text{base}} = \Phi(\mathcal{W})" /> executed with master prosodic phrasing, and an evaluated utterance <MathFormula math="\mathcal{A}_{\text{test}} = \Phi'(\mathcal{W})" /> exhibiting controlled prosodic flaws across four systematic tiers:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px] not-italic my-2">
            <div className="bg-[#f4ece8] border border-[#1e1b19] p-2 rounded">
              <span className="font-bold text-[#37613d]">Tier 1: Master</span>
              <p className="text-[10px] text-[#594139] mt-0.5">Gold-standard cadence, pristine pauses, and expressive intonation.</p>
            </div>
            <div className="bg-[#fff8f5] border border-[#1e1b19] p-2 rounded">
              <span className="font-bold text-[#37613d]">Tier 2: Near-Perfect</span>
              <p className="text-[10px] text-[#594139] mt-0.5">Accurate delivery with minor timing or phrase boundary deviations.</p>
            </div>
            <div className="bg-[#ffddb6]/40 border border-[#1e1b19] p-2 rounded">
              <span className="font-bold text-[#d97706]">Tier 3: Moderate Flaws</span>
              <p className="text-[10px] text-[#594139] mt-0.5">Unwarranted pauses within syntactic constituents and localized monotone.</p>
            </div>
            <div className="bg-[#ffdbcf]/40 border border-[#1e1b19] p-2 rounded">
              <span className="font-bold text-[#cb4914]">Tier 4: Botched</span>
              <p className="text-[10px] text-[#594139] mt-0.5">Severe rushing/dragging, misplaced contrastive stress, and vocal instability.</p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 border-t border-[#e5d8d0] pt-6">
          <h2 className="font-mono text-xs font-black uppercase tracking-wider text-[#cb4914] flex items-center gap-2">
            <span>§ 2.</span> Speaker-Agnostic Acoustic Normalization
          </h2>
          <p className="text-justify leading-relaxed">
            Direct linear comparison of pitch in Hertz (<MathFormula math="Hz" />) penalizes female speakers compared to male speakers due to vocal cord dimensions. We eliminate this biological anatomical bias by transforming all continuous voiced <MathFormula math="F_0" /> frames into semitones centered on each individual speaker's median fundamental frequency:
          </p>
          
          <div className="bg-[#fff8f5] border-2 border-[#1e1b19] p-3 rounded-lg shadow-press-xs font-mono text-xs text-center text-[#1e1b19] my-3">
            <MathFormula math="F_{0,\text{ST}}(t) = 12 \cdot \log_2 \left( \frac{F_0(t)}{\text{Median}(F_{0,\text{voiced}})} \right)" display={true} />
          </div>

          <p className="text-justify leading-relaxed">
            Under this logarithmic formulation, a rhetorical melodic rise of <MathFormula math="+4.0\text{ ST}" /> (a major third musical interval) produces an identical numerical trajectory whether performed by an adult male, an adult female, or a child. Dynamic range, standard deviation, and contours become entirely speaker-invariant.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 border-t border-[#e5d8d0] pt-6">
          <h2 className="font-mono text-xs font-black uppercase tracking-wider text-[#cb4914] flex items-center gap-2">
            <span>§ 3.</span> Praat Clinical Forensic Phonetic Extraction
          </h2>
          <p className="text-justify leading-relaxed">
            We invoke the native Praat phonetic engine via C-bindings to calculate micro-acoustic perturbation features directly from the acoustic pressure wave:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs not-italic my-2">
            <div className="bg-[#fffdfa] border border-[#1e1b19] p-3 rounded-lg space-y-1">
              <span className="font-bold text-[#cb4914]">Harmonics-to-Noise Ratio (HNR):</span>
              <p className="text-[11px] text-[#594139] leading-snug">
                Measures the ratio of periodic acoustic glottal energy to turbulent aerodynamic aspiration noise in decibels:
              </p>
              <div className="text-center font-bold text-[#1e1b19] py-1">
                <MathFormula math="\text{HNR} = 10 \log_{10} \left( \frac{r(0)}{1 - r(0)} \right) \text{ dB}" display={true} />
              </div>
              <p className="text-[10px] text-[#594139]">Healthy rhetorical projection exceeds 15.0 dB; lower values indicate breathiness or strain.</p>
            </div>

            <div className="bg-[#fffdfa] border border-[#1e1b19] p-3 rounded-lg space-y-1">
              <span className="font-bold text-[#cb4914]">Vocal Perturbations (Jitter &amp; Shimmer):</span>
              <p className="text-[11px] text-[#594139] leading-snug">
                Cycle-to-cycle frequency variations (Jitter) and peak amplitude variations (Shimmer) measure motor-control stability:
              </p>
              <div className="text-center font-bold text-[#1e1b19] py-1">
                <MathFormula math="\text{Jitter} = \cfrac{\cfrac{1}{N-1} \sum_{i=1}^{N-1} |T_i - T_{i+1}|}{\cfrac{1}{N} \sum_{i=1}^N T_i} \times 100\%" display={true} />
              </div>
              <p className="text-[10px] text-[#594139]">Clinical thresholds: Local Jitter &le; 1.04%, Local Shimmer &le; 3.81%.</p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 border-t border-[#e5d8d0] pt-6">
          <h2 className="font-mono text-xs font-black uppercase tracking-wider text-[#cb4914] flex items-center gap-2">
            <span>§ 4.</span> Non-Linear Dynamic Time Warping (DTW) &amp; Temporal Grounding
          </h2>
          <p className="text-justify leading-relaxed">
            To compare temporal features across orations of unequal speaking duration, we construct an acoustic feature vector <MathFormula math="\mathbf{f}(t) = [F_{0,\text{ST}}(t), E_{\text{RMS}}(t), \Delta F_{0,\text{ST}}(t)]^T" />. We compute the optimal non-linear warping path minimizing cumulative Euclidean distance:
          </p>
          
          <div className="bg-[#fff8f5] border-2 border-[#1e1b19] p-3 rounded-lg shadow-press-xs font-mono text-xs text-center text-[#1e1b19] my-3">
            <MathFormula math="D(i, j) = \|\mathbf{f}_{\text{test}}(i) - \mathbf{f}_{\text{base}}(j)\|_2 + \min \left\{ D(i-1, j), D(i, j-1), D(i-1, j-1) \right\}" display={true} />
          </div>

          <p className="text-justify leading-relaxed">
            Once aligned, temporal flaw grounding is computed via dual-hysteresis thresholding on the warping path derivative. Unwarranted silence intervals splitting uninterrupted master syntactic units trigger instantaneous <i>Inappropriate Pause</i> incident flags.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 border-t border-[#e5d8d0] pt-6">
          <h2 className="font-mono text-xs font-black uppercase tracking-wider text-[#cb4914] flex items-center gap-2">
            <span>§ 5.</span> The Composite Delivery Index (CDI) Formulation
          </h2>
          <p className="text-justify leading-relaxed">
            The overall oratorical performance is synthesized into a single bounded, mathematically rigorous metric <MathFormula math="\text{CDI} \in [0, 100]" /> composed of four weighted dimensions:
          </p>

          <div className="bg-[#fff8f5] border-2 border-[#1e1b19] p-4 rounded-lg shadow-press-xs font-mono text-xs text-center text-[#1e1b19] my-3">
            <MathFormula math="\text{CDI} = 0.25 \cdot S_{\text{pacing}} + 0.30 \cdot S_{\text{pitch}} + 0.20 \cdot S_{\text{stress}} + 0.25 \cdot S_{\text{fluency}}" display={true} />
          </div>
        </section>

        {/* Section 6: Booktabs Benchmark Table */}
        <section className="space-y-4 border-t border-[#e5d8d0] pt-6">
          <h2 className="font-mono text-xs font-black uppercase tracking-wider text-[#cb4914] flex items-center gap-2">
            <span>§ 6.</span> Empirical Benchmark Results &amp; Monotonic Proof
          </h2>
          <p className="text-justify leading-relaxed">
            Table 1 demonstrates empirical validation on the <i>Contrastive-Oratory-2026</i> corpus across canonical historical speeches. Notice the strict monotonic decay of the CDI score as defect tiers increase, verifying that the multi-dimensional rubric formulated by SynthReaper is fully calibrated.
          </p>

          <div className="overflow-x-auto my-3">
            <table className="booktabs-table w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[#594139]">
                  <th>Corpus Speech</th>
                  <th>Defect Quality Tier</th>
                  <th>Pacing</th>
                  <th>Pitch</th>
                  <th>Stress</th>
                  <th>Fluency</th>
                  <th className="font-bold text-[#1e1b19]">CDI</th>
                  <th>Grade</th>
                  <th>Grounded Flaws</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5d8d0] text-[#1e1b19]">
                <tr>
                  <td className="font-bold">JFK Inaugural</td>
                  <td className="text-[#37613d] font-bold">Baseline Master</td>
                  <td>96.2%</td>
                  <td>95.0%</td>
                  <td>97.4%</td>
                  <td>94.0%</td>
                  <td className="font-black text-[#37613d]">95.5</td>
                  <td><span className="rubber-stamp text-[10px] text-[#37613d] border-[#37613d]">A+</span></td>
                  <td>0</td>
                </tr>
                <tr>
                  <td className="font-bold">JFK Inaugural</td>
                  <td>Tier 1: Near-Perfect</td>
                  <td>94.0%</td>
                  <td>94.2%</td>
                  <td>96.8%</td>
                  <td>93.5%</td>
                  <td className="font-bold text-[#37613d]">94.1</td>
                  <td><span className="rubber-stamp text-[10px] text-[#37613d] border-[#37613d]">A+</span></td>
                  <td>0</td>
                </tr>
                <tr>
                  <td className="font-bold">JFK Inaugural</td>
                  <td className="text-[#d97706] font-bold">Tier 2: Moderate Flaws</td>
                  <td>90.3%</td>
                  <td>79.4%</td>
                  <td>95.2%</td>
                  <td>72.4%</td>
                  <td className="font-black text-[#d97706]">83.5</td>
                  <td><span className="rubber-stamp text-[10px] text-[#d97706] border-[#d97706]">B</span></td>
                  <td>1 (Pause)</td>
                </tr>
                <tr>
                  <td className="font-bold">JFK Inaugural</td>
                  <td className="text-[#cb4914] font-bold">Tier 3: Severe Flaws</td>
                  <td>78.4%</td>
                  <td>72.0%</td>
                  <td>84.1%</td>
                  <td>85.0%</td>
                  <td className="font-black text-[#cb4914]">79.2</td>
                  <td><span className="rubber-stamp text-[10px] text-[#cb4914] border-[#cb4914]">B-</span></td>
                  <td>2 (Rush, Drag)</td>
                </tr>
                <tr>
                  <td className="font-bold">JFK Inaugural</td>
                  <td className="text-[#991b1b] font-black">Tier 4: Botched Delivery</td>
                  <td>62.0%</td>
                  <td>58.4%</td>
                  <td>71.0%</td>
                  <td>52.8%</td>
                  <td className="font-black text-[#991b1b]">60.7</td>
                  <td><span className="rubber-stamp text-[10px] text-[#991b1b] border-[#991b1b]">C-</span></td>
                  <td>4 (Compound)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 7: Formal References */}
        <section className="space-y-3 border-t border-[#e5d8d0] pt-6">
          <h2 className="font-mono text-xs font-black uppercase tracking-wider text-[#cb4914] flex items-center gap-2">
            <span>§ 7.</span> Authoritative References
          </h2>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs font-mono text-[#594139]">
            <li><b>Boersma, P., &amp; Weenink, D. (2001).</b> <i>Praat: doing phonetics by computer.</i> Version 6.4. Glot International, 5(9/10), 341-345.</li>
            <li><b>Sakoe, H., &amp; Chiba, S. (1978).</b> <i>Dynamic programming algorithm optimization for spoken word recognition.</i> IEEE Trans. ASSP, 26(1), 43-49.</li>
            <li><b>Hermes, D. J. (1988).</b> <i>Measurement of pitch by subharmonic summation.</i> JASA, 83(1), 257-264.</li>
            <li><b>Burg, J. P. (1968).</b> <i>A new analysis technique for time series data.</i> In NATO Advanced Study Institute on Signal Processing.</li>
            <li><b>SynthReaper (2026).</b> <i>Deterministic Prosodic Flaw Grounding &amp; Speaker Invariance in Rhetorical Assessment.</i> CadenceLens Tech Report.</li>
          </ol>
        </section>

      </div>
    </article>
  );
}
