import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from src.speech_analytics.pipeline import SpeechAnalyticsPipeline
import json

pipeline = SpeechAnalyticsPipeline()
result = pipeline.evaluate(
    'dataset/speeches/jfk_inaugural/baseline.wav',
    'dataset/speeches/jfk_inaugural/tier_2_moderate_flaws.wav',
    transcript='And so my fellow Americans ask not what your country can do for you ask what you can do for your country'
)

print("Scorecard:", json.dumps(result['scorecard'], indent=2))
print("Summary:", json.dumps(result['summary'], indent=2))
print(f"Flaws detected: {len(result['flaws'])}")
for f in result['flaws']:
    print(f" * [{f['start_sec']}s - {f['end_sec']}s] {f['flaw_type']} ({f['severity']})")
    print(f"   Mathematical Proof: {f['mathematical_proof']}")
    print(f"   Causal Diagnosis: {f['causal_explanation'][:120]}...")
    print(f"   Coaching: {f['coaching_recommendation'][:100]}...\n")
