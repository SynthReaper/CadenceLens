# Contrastive-Oratory-2026 Dataset
### Multimodal AI Hackathon 2026 — Track C (IIT Mandi)
**Architect & Curator:** **SynthReaper**

[![Live Frontend (Vercel)](https://img.shields.io/badge/Live%20Frontend-cadence--lens.vercel.app-000000.svg?style=for-the-badge&logo=vercel)](https://cadence-lens.vercel.app/)
[![Live Backend (Render)](https://img.shields.io/badge/Live%20Backend-cadencelens.onrender.com-46E3B7.svg?style=for-the-badge&logo=render)](https://cadencelens.onrender.com/)
[![Corpus Manifest](https://img.shields.io/badge/API-Corpus%20Manifest-009688.svg?style=flat-square)](https://cadencelens.onrender.com/api/speeches)

A mathematically bounded, forensic contrastive speech dataset pairing pristine rhetorical declamations with an intentionally engineered gradient of acoustic delivery flaws on the **exact same text**.

---

## 1. Dataset Architecture & Motivation

Standard speech corpora (such as LibriSpeech, TIMIT, or CommonVoice) focus almost exclusively on Automatic Speech Recognition (ASR)—evaluating *what* was spoken rather than *how* it was delivered. In competitive forensic oratory, debate, and executive declamation, the acoustic dimension (prosody, melodic pitch excursion, pause discipline, and resonant formants) dictates rhetorical effectiveness.

`Contrastive-Oratory-2026` provides **5 canonical rhetorical speeches** across **4 progressive quality tiers**, totaling **25 high-resolution 16-bit 22.05 kHz PCM WAV audio files**, accompanied by forced word alignments with millisecond boundaries (`dataset_manifest.json`) and 50 ground-truth labeled defect intervals (`dataset_annotations.csv`).

---

## 2. Canonical Speech Inventory

| Speech Identifier | Historical Context | Speaker & Neural Voice Model | Word Count | Target Duration | Live Stream (Baseline) |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `jfk_inaugural` | 1961 U.S. Presidential Inauguration | John F. Kennedy (`en-US-ChristopherNeural`) | 42 words | 15.2s | [`/api/audio/jfk_inaugural/baseline`](https://cadencelens.onrender.com/api/audio/jfk_inaugural/baseline) |
| `mlk_dream` | 1963 March on Washington Address | Dr. Martin Luther King Jr. (`en-US-GuyNeural`) | 38 words | 14.8s | [`/api/audio/mlk_dream/baseline`](https://cadencelens.onrender.com/api/audio/mlk_dream/baseline) |
| `steve_jobs_stanford` | 2005 Stanford Commencement | Steve Jobs (`en-US-EricNeural`) | 45 words | 16.1s | [`/api/audio/steve_jobs_stanford/baseline`](https://cadencelens.onrender.com/api/audio/steve_jobs_stanford/baseline) |
| `churchill_fight` | 1940 House of Commons War Address | Winston Churchill (`en-GB-RyanNeural`) | 40 words | 15.6s | [`/api/audio/churchill_fight/baseline`](https://cadencelens.onrender.com/api/audio/churchill_fight/baseline) |
| `multimodal_ai_keynote` | 2026 Scientific Keynote Address | Academic Orator (`en-US-JennyNeural`) | 44 words | 15.4s | [`/api/audio/multimodal_ai_keynote/baseline`](https://cadencelens.onrender.com/api/audio/multimodal_ai_keynote/baseline) |

---

## 3. Detailed Speech Transcripts & Acoustic Baselines

### 1. `jfk_inaugural`
* **Historical Speaker**: President John F. Kennedy
* **Transcript**:
  > *"And so, my fellow Americans: ask not what your country can do for you — ask what you can do for your country. My fellow citizens of the world: ask not what America will do for you, but what together we can do for the freedom of man."*
* **Rhetorical Mode**: Antimetabole / Chiasmus, solemn cadenced delivery, patriotic crescendo.
* **Acoustic Baselines**: Median $F_0 = 135\text{ Hz}$, $F_1 = 520\text{ Hz}$, $F_2 = 1610\text{ Hz}$, HNR $= 18.2\text{ dB}$, Jitter $= 0.85\%$, Shimmer $= 2.90\%$, Target Cadence $= 125\text{--}138\text{ WPM}$.

### 2. `mlk_dream`
* **Historical Speaker**: Dr. Martin Luther King Jr.
* **Transcript**:
  > *"I have a dream that one day this nation will rise up and live out the true meaning of its creed: We hold these truths to be self-evident, that all men are created equal."*
* **Rhetorical Mode**: Biblical anaphora, expansive vowel elongation, rich thoracic resonance.
* **Acoustic Baselines**: Median $F_0 = 118\text{ Hz}$, $F_1 = 490\text{ Hz}$, $F_2 = 1480\text{ Hz}$, HNR $= 19.5\text{ dB}$, Jitter $= 0.78\%$, Shimmer $= 2.65\%$, Target Cadence $= 110\text{--}122\text{ WPM}$.

### 3. `steve_jobs_stanford`
* **Historical Speaker**: Steve Jobs
* **Transcript**:
  > *"Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma — which is living with the results of other people's thinking. Have the courage to follow your heart and intuition."*
* **Rhetorical Mode**: Conversational intimacy, dramatic micro-pauses, punchy declarative stress.
* **Acoustic Baselines**: Median $F_0 = 126\text{ Hz}$, $F_1 = 540\text{ Hz}$, $F_2 = 1580\text{ Hz}$, HNR $= 17.8\text{ dB}$, Jitter $= 0.92\%$, Shimmer $= 3.10\%$, Target Cadence $= 130\text{--}140\text{ WPM}$.

### 4. `churchill_fight`
* **Historical Speaker**: Winston Churchill
* **Transcript**:
  > *"We shall fight on the beaches, we shall fight on the landing grounds, we shall fight in the fields and in the streets, we shall fight in the hills; we shall never surrender."*
* **Rhetorical Mode**: Epistrophe, defiant staccato phrasing, solemn baritone gravitas.
* **Acoustic Baselines**: Median $F_0 = 112\text{ Hz}$, $F_1 = 460\text{ Hz}$, $F_2 = 1420\text{ Hz}$, HNR $= 18.9\text{ dB}$, Jitter $= 0.88\%$, Shimmer $= 2.95\%$, Target Cadence $= 105\text{--}118\text{ WPM}$.

### 5. `multimodal_ai_keynote`
* **Historical Speaker**: Academic Orator (Female register)
* **Transcript**:
  > *"We stand at the threshold of a computational revolution where ambient intelligence seamlessly bridges physical and digital realms. The tools we forge today will define how humanity communicates, creates, and solves global challenges."*
* **Rhetorical Mode**: Forward visionary tempo, high consonant clarity, crystalline vocal projection.
* **Acoustic Baselines**: Median $F_0 = 210\text{ Hz}$, $F_1 = 580\text{ Hz}$, $F_2 = 1720\text{ Hz}$, HNR $= 20.1\text{ dB}$, Jitter $= 0.65\%$, Shimmer $= 2.40\%$, Target Cadence $= 132\text{--}145\text{ WPM}$.

---

## 4. Controlled Quality Tiers & Defect Spectrum

For every speech, 5 audio files represent the progressive acoustic decay curve:

1. **`baseline.wav` (Gold-Standard Master • Target CDI: 98–100)**:
   - Natural pitch inflections ($\sigma_{F_0} \ge 3.0\text{ ST}$).
   - Balanced rhetorical stress concentrating on operative nouns.
   - Clinical HNR $> 18\text{ dB}$ with Jitter $< 1.0\%$ and Shimmer $< 3.5\%$.
2. **`tier_1_near_perfect.wav` (Near-Perfect • Target CDI: 80–86)**:
   - Injected with mild pacing surge ($1.35\times$) or slight phrasal acceleration across a single clause.
3. **`tier_2_moderate_flaws.wav` (Moderate Flaws • Target CDI: 65–72)**:
   - Robotic pitch flatline ($\Delta F_{0,\text{ST}} < 0.5\text{ ST}$) across the primary declarative clause.
   - Awkward inter-constituent disfluency pause ($> 1.6\text{s}$).
4. **`tier_3_severe_flaws.wav` (Severe Flaws • Target CDI: 50–58)**:
   - Severe tempo rushing ($> 200\text{ WPM}$) compressing syllables to $< 90\text{ms}$.
   - Inverted stress dynamics ($+10\text{ dB}$ emphasis placed on insignificant grammatical particles).
5. **`tier_4_botched.wav` (Botched Oration • Target CDI: 35–45)**:
   - Severe compounding failures: erratic tempo, dead air pauses ($> 2.2\text{s}$), complete flatline monotone, and abrupt terminal cessation.

---

## 5. Annotations Schema & Manifest Structure

### Forced Alignment Manifest: `dataset_manifest.json`
Provides exact millisecond start and end boundaries for every word across all baseline recordings:
```json
{
  "speeches": {
    "jfk_inaugural": {
      "title": "JFK Inaugural Address",
      "speaker": "John F. Kennedy",
      "duration_sec": 15.2,
      "words": [
        {"word": "And", "start_sec": 0.12, "end_sec": 0.35, "start_ms": 120, "end_ms": 350},
        {"word": "so,", "start_sec": 0.38, "end_sec": 0.65, "start_ms": 380, "end_ms": 650}
      ]
    }
  }
}
```

### Flaw Interval Ground Truth: `dataset_annotations.csv`
```csv
speech_key,tier,flaw_type,severity,start_sec,end_sec,start_ms,end_ms,mathematical_metric,description,rationale
jfk_inaugural,tier_2_moderate_flaws,MONOTONE_CADENCE,HIGH,3.12,7.45,3120,7450,pitch_variance_reduction,"Fundamental frequency variance collapsed by >75%; flat robotic delivery devoid of rhetorical inflection.","Suppression of F0 modulation robs the oration of melodic cadence."
```

---

## 6. Accessing via API

Live streaming of all 25 audio files is supported directly from the cloud backend:

```bash
# Stream baseline JFK audio
curl -O https://cadencelens.onrender.com/api/audio/jfk_inaugural/baseline

# Stream Tier 4 botched audio
curl -O https://cadencelens.onrender.com/api/audio/jfk_inaugural/tier_4_botched
```

---

<div align="center">
  <b>Contrastive-Oratory-2026 Corpus</b> • Curated by <b>SynthReaper</b> • Multimodal AI Hackathon 2026
</div>
