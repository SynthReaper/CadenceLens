import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from src.speech_analytics.pipeline import SpeechAnalyticsPipeline

def test_gradient():
    pipeline = SpeechAnalyticsPipeline()
    speeches = ["jfk_inaugural", "mlk_dream", "steve_jobs_stanford"]
    tiers = ["tier_1_near_perfect", "tier_2_moderate_flaws", "tier_3_severe_flaws", "tier_4_botched"]
    
    print("\n================ CONTRASTIVE GRADIENT BENCHMARK ================")
    print(f"{'Speech':<20} | {'Tier':<22} | {'CDI Score':<10} | {'Grade':<6} | {'Flaws':<6} | {'Detected Flaw Types'}")
    print("-" * 95)
    
    for sp in speeches:
        base_path = f"dataset/speeches/{sp}/baseline.wav"
        for t in tiers:
            test_path = f"dataset/speeches/{sp}/{t}.wav"
            res = pipeline.evaluate(base_path, test_path)
            sc = res["scorecard"]
            flaw_types = ", ".join(list(set(f["flaw_type"] for f in res["flaws"])))
            print(f"{sp:<20} | {t:<22} | {sc['composite_delivery_index']:<10.1f} | {sc['letter_grade']:<6} | {len(res['flaws']):<6} | {flaw_types}")
            
    print("=================================================================\n")

if __name__ == "__main__":
    test_gradient()
