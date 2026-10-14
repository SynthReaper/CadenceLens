# Contrastive-Oratory-2026 Dataset
**Multimodal AI Hackathon 2026 — Track C (IIT Mandi)**

A rigorous, mathematically bounded contrastive speech dataset pairing pristine rhetorical orations with an intentionally engineered gradient of acoustic delivery flaws on the **exact same text**.

---

## 1. Dataset Architecture & Overview

Standard speech corpora (such as LibriSpeech or TIMIT) focus on Automatic Speech Recognition (ASR) rather than rhetorical, evaluative delivery quality. No canonical public dataset maps exemplary public speaking against an aligned spectrum of delivery failures of identical text.

`Contrastive-Oratory-2026` provides **5 canonical rhetorical orations** across **4 progressive flaw gradient tiers** (totaling 25 high-resolution audio files, 50 temporally bounded flaw ground-truth regions):

| Speech Identifier | Historical / Modern Context | Speaker Profile | Target WPM | Key Rhetorical Style |
|---|---|---|---|---|
| `jfk_inaugural` | 1961 U.S. Presidential Inauguration | John F. Kennedy (M) | 125 WPM | Chiasmus, patriotic crescendo, solemn cadence |
| `mlk_dream` | 1963 March on Washington Address | Dr. Martin Luther King Jr. (M) | 115 WPM | Anaphora, biblical cadence, melodic resonance |
| `steve_jobs_stanford` | 2005 Stanford Commencement | Steve Jobs (M) | 135 WPM | Conversational narrative, dramatic micro-pauses |
| `churchill_fight` | 1940 House of Commons War Address | Winston Churchill (M) | 110 WPM | Defiant staccato repetition, gravitas |
| `multimodal_ai_keynote` | 2026 Contemporary Scientific Keynote | Academic Orator (F) | 130 WPM | Technical articulation, conceptual clarity |

---

## 2. Flaw Gradient Spectrum Tiers

For each speech, the dataset provides 5 audio files:

1. **`baseline.wav` (Exemplary Reference, Target Score: 95–98)**
   - Pristine rhetorical pacing (110–135 WPM).
   - Natural melodic fundamental frequency ($F_0$) excursions with pitch range $> 10$ semitones.
   - Strategic pause placement strictly aligned with syntactic phrasal boundaries.
   - Dynamic RMS energy emphasis focused on key conceptual words.

2. **`tier_1_near_perfect.wav` (Near-Perfect, Target Score: 80–86)**
   - Injected with a single subtle flaw: mild pacing rush ($1.35\times$) or minor dragging across one clause.
   - Retains melodic pitch contours and clear vocal projection.

3. **`tier_2_moderate_flaws.wav` (Moderate Delivery Deficits, Target Score: 65–72)**
   - Two distinct flaws:
     - Awkward mid-clause disfluency pause ($> 1.7\text{s}$) splitting a tightly coupled noun phrase.
     - Monotone pitch suppression ($\sigma(F_0)$ collapsed by $> 75\%$) across a key rhetorical question.

4. **`tier_3_severe_flaws.wav` (Severe Delivery Deficits, Target Score: 45–52)**
   - Three concurrent flaws:
     - Violent tempo acceleration ($1.75\times$ speed, speech rate $> 220$ WPM).
     - Inverted stress dynamics ($+10\text{ dB}$ on minor prepositions/determiners, muting the punchline).
     - Robotic monotone pitch flatline across the climax.

5. **`tier_4_botched.wav` (Catastrophic Amateur Delivery, Target Score: 30–38)**
   - Four compounding flaws:
     - Disabling hesitation pauses ($> 2.2\text{s}$).
     - Hyper-rushed phrasing ($1.85\times$ speed, syllables compressed below $90\text{ms}$).
     - Inverted acoustic stress hierarchy.
     - Terminal energy collapse and robotic cadence throughout the conclusion.

---

## 3. Data Schema & Annotation Format

### Manifest: `dataset_manifest.json`
Contains speech metadata, text transcripts, baseline duration, and nested tier metadata with exact flaw arrays.

### CSV Annotations: `dataset_annotations.csv`
Every flaw region is labeled with ground-truth temporal boundaries and acoustic attributes:

```csv
speech_key,tier,flaw_type,severity,start_sec,end_sec,start_ms,end_ms,mathematical_metric,description,rationale
jfk_inaugural,tier_1_near_perfect,ERRATIC_RUSH,MODERATE,7.53,10.04,7533,10044,speech_rate_acceleration,"Speech tempo violently accelerated by 35% (+1.35x baseline speed).","Inter-syllable interval compressed to <90ms, causing phonetic blurring and rapid tempo instability."
...
```

---

## 4. Acoustic Attributes & Coordinate System
- **Sample Rate**: $22,050\text{ Hz}$ (or $16,000\text{ Hz}$ resampled).
- **Channels**: 1 (Mono).
- **Bit Depth**: 16-bit PCM.
- **Dynamic Range Normalization**: Energy normalized to $[0, 1]$ using 10th and 90th percentiles to eliminate microphone gain bias.
- **Pitch Normalization**: Semitone conversion relative to median speaker pitch:
  $$F_{0,\text{semitones}}(t) = 12 \log_2 \left(\frac{F_0(t)}{F_{0,\text{median}}}\right)$$
  ensuring gender- and anatomy-neutral comparison.

---

## 5. Citations & Attribution
- Historical orations are public domain transcripts.
- Synthesized baselines generated via Windows SAPI / formant modeling under MIT license.
- Audio processing implemented with Librosa (MIT License) and SciPy (BSD License).
