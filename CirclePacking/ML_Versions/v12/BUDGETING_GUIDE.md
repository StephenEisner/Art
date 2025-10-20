# Budgeting Scheme Visual Comparison Guide

## Quick Reference Chart

| Budgeting Scheme | Best For | Typical Coverage | Large Islands | Small Islands | Speed |
|-----------------|----------|------------------|---------------|---------------|-------|
| **Fair Share** | Balanced images | 60-68% | Good (60-65%) | Good (55-60%) | ⚡⚡⚡ Fast |
| **Proportional** | Focal points | 62-70% | Excellent (70-75%) | Fair (45-55%) | ⚡⚡ Medium |
| **Weighted** | Hero regions | 63-72% | Excellent (75-80%) | Fair (40-50%) | ⚡⚡ Medium |
| **Fixed + Bonus** | Consistent quality | 58-65% | Good (60-68%) | Good (55-60%) | ⚡ Slower |
| **Exponential** | Varied sizes | 60-68% | Very Good (65-70%) | Good (50-58%) | ⚡⚡ Medium |

## Real-World Examples

### Landscape Photo (Sky + Ground + Details)

**Image characteristics:**
- 1 large sky region (~40,000 pixels)
- 1 large ground region (~35,000 pixels)  
- 50+ small detail regions (trees, rocks, clouds: 100-500 pixels each)

**With Fair Share (10,000 attempts):**
```
Sky: 2,500 attempts → 62% coverage
Ground: 2,500 attempts → 64% coverage
Each detail: 50-200 attempts → 55-60% coverage
Overall: 62% coverage ✓ Balanced look
```

**With Proportional (10,000 attempts):**
```
Sky: 4,000 attempts → 72% coverage  ⭐ Much better!
Ground: 3,500 attempts → 70% coverage ⭐ Much better!
Each detail: 10-100 attempts → 45-50% coverage ⚠️ Noticeably worse
Overall: 68% coverage ✓ Sky looks great, details sparse
```

**With Weighted (10,000 attempts):**
```
Sky: 5,000 attempts → 78% coverage ⭐⭐ Excellent!
Ground: 4,000 attempts → 75% coverage ⭐⭐ Excellent!
Each detail: 5-50 attempts → 38-45% coverage ⚠️⚠️ Quite sparse
Overall: 70% coverage ✓ Dramatic sky, minimal details
```

**Recommendation:** Proportional or Weighted for landscapes where sky/ground dominate

### Portrait Photo (Face + Hair + Background)

**Image characteristics:**
- Face: 15 medium islands (nose, cheeks, forehead: 200-800 pixels each)
- Hair: 80+ small islands (strands, highlights: 30-150 pixels each)
- Background: 1 large region (20,000 pixels)

**With Fair Share (10,000 attempts):**
```
Background: 2,000 attempts → 65% coverage
Each face island: 150-300 attempts → 58-62% coverage
Each hair island: 50-100 attempts → 52-58% coverage
Overall: 60% coverage ✓ All features visible
```

**With Proportional (10,000 attempts):**
```
Background: 4,000 attempts → 72% coverage ⭐
Each face island: 100-400 attempts → 55-65% coverage
Each hair island: 15-60 attempts → 42-50% coverage ⚠️
Overall: 63% coverage ✓ Background great, hair details lost
```

**With Fixed + Bonus (10,000 attempts):**
```
Background: 1,000 + 2,000 = 3,000 attempts → 68% coverage
Each face island: 1,000 + 200 = 1,200 attempts → 62-68% coverage ⭐
Each hair island: 1,000 + 30 = 1,030 attempts → 60-65% coverage ⭐⭐
Overall: 65% coverage ✓ Everything gets attention!
```

**Recommendation:** Fixed + Bonus for portraits to preserve all facial features

### Abstract/Geometric (Many Equal Regions)

**Image characteristics:**
- 100 similar-sized regions (300-500 pixels each)
- No clear focal point

**With Fair Share (10,000 attempts):**
```
Each region: 95-105 attempts → 54-60% coverage
Overall: 57% coverage ✓ Uniform quality
```

**With Proportional (10,000 attempts):**
```
Each region: 90-110 attempts → 54-60% coverage
Overall: 57% coverage ✓ Same as fair share (regions are equal)
```

**With Fixed + Bonus (10,000 attempts):**
```
Each region: 1,000 + 0 = 1,000 attempts → 62-68% coverage ⭐⭐
Overall: 65% coverage ✓ Much better! (guaranteed minimum helps)
```

**Recommendation:** Fixed + Bonus when regions are similar sizes

### Night Sky (Few Large Stars + Many Tiny Stars)

**Image characteristics:**
- Dark background: 1 huge region (50,000 pixels)
- 5 large stars: (500-1000 pixels each)
- 200 tiny stars: (5-20 pixels each)

**With Fair Share (10,000 attempts):**
```
Background: 2,500 attempts → 60% coverage
Each large star: 100-150 attempts → 58-62% coverage
Each tiny star: 10-30 attempts → 40-55% coverage ⚠️
Overall: 58% coverage ✓ Okay, but tiny stars suffer
```

**With Exponential (10,000 attempts):**
```
Background: 3,500 attempts → 68% coverage ⭐
Each large star: 180-250 attempts → 65-70% coverage ⭐
Each tiny star: 30-60 attempts → 58-68% coverage ⭐⭐
Overall: 66% coverage ✓ Balanced across all scales!
```

**Recommendation:** Exponential for extreme size variations

## Visual Decision Tree

```
START: What's your image like?

├─ Has 1-3 LARGE dominant regions (sky, ocean, wall)?
│  ├─ Want MAXIMUM quality on those regions?
│  │  └─→ Use WEIGHTED
│  └─ Want good quality on those + decent elsewhere?
│     └─→ Use PROPORTIONAL
│
├─ Has MANY small regions (100+) of similar importance?
│  ├─ Want to guarantee each gets attention?
│  │  └─→ Use FIXED + BONUS
│  └─ Want balanced distribution?
│     └─→ Use FAIR SHARE
│
├─ Has EXTREME size variation (10px to 10,000px regions)?
│  └─→ Use EXPONENTIAL
│
└─ Not sure? Just want good overall results?
   └─→ Use FAIR SHARE (default, reliable)
```

## Console Pattern Recognition

### Fair Share Console Output:
```
💰 Budget: FAIR SHARE - 10,000 attempts for 87 islands
Island 1/87: 5000px → 2400 attempts → 62% ✓ Reasonable
Island 45/87: 120px → 85 attempts → 54% ✓ Reasonable
Islands skipped: 0 ✓ All processed
```
**Pattern:** Similar per-pixel attempt density across islands

### Proportional Console Output:
```
💰 Budget: PROPORTIONAL - 10,000 attempts distributed by size
Island 1/87: 5000px → 5500 attempts → 74% ⭐ High quality
Island 45/87: 120px → 13 attempts → 42% ⚠️ Lower quality
Islands skipped: 0 ✓ All processed
```
**Pattern:** Large islands get many attempts, small islands get few

### Weighted Console Output:
```
💰 Budget: WEIGHTED - Large islands get 2x proportional attempts
Island 1/87: 5000px → 7200 attempts → 80% ⭐⭐ Excellent
Island 45/87: 120px → 8 attempts → 38% ⚠️⚠️ Sparse
Islands skipped: 5 ⚠️ Budget exhausted on large islands
```
**Pattern:** Extremely high quality on large, may skip smallest

### Fixed + Bonus Console Output:
```
💰 Budget: FIXED - 1000 per island + proportional remainder
Island 1/87: 5000px → 1000+1800=2800 attempts → 68% ⭐
Island 45/87: 120px → 1000+3=1003 attempts → 64% ⭐ Nice!
Islands skipped: 0 ✓ All processed
```
**Pattern:** Consistent minimum quality everywhere

## Attempt Budget Recommendations

### By Cluster Count:
- **< 20 clusters:** 8,000-10,000 attempts (Fair Share or Proportional)
- **20-40 clusters:** 10,000-15,000 attempts (Fair Share or Fixed + Bonus)
- **40-60 clusters:** 15,000-20,000 attempts (Fixed + Bonus)
- **60-100 clusters:** 20,000-30,000 attempts (Fixed + Bonus mandatory!)

### By Budgeting Scheme:
- **Fair Share:** Base budget (10,000)
- **Proportional:** Base budget (10,000)
- **Weighted:** +20% budget (12,000) - Large islands need more
- **Fixed + Bonus:** +50% budget (15,000) - Minimum per island adds up
- **Exponential:** Base budget (10,000)

## A/B Testing Template

Want to find the best scheme for your image? Try this:

1. **Baseline:**
   - Budgeting: Fair Share
   - Attempts: 10,000
   - Save as: `baseline-fairshare.png` + settings

2. **Test Proportional:**
   - Load baseline settings
   - Change to: Proportional
   - Save as: `test-proportional.png`

3. **Test Weighted:**
   - Load baseline settings
   - Change to: Weighted
   - Attempts: 12,000 (give it more budget)
   - Save as: `test-weighted.png`

4. **Test Fixed + Bonus:**
   - Load baseline settings
   - Change to: Fixed + Bonus
   - Attempts: 15,000 (needs more for minimums)
   - Save as: `test-fixedbonus.png`

5. **Compare visually** - Which looks best for YOUR image?

## Pro Tips

1. **Console is your friend:** Watch the attempt allocations - if large islands get <1000 attempts with Fair Share, try Proportional

2. **"Islands skipped" = wrong scheme:** If you see skipped islands, either increase attempts OR switch to Fixed + Bonus

3. **High cluster count? Use Fixed + Bonus:** With 60+ clusters, you NEED the guaranteed minimum

4. **Low cluster count? Proportional works great:** With <20 clusters, regions are large enough that proportional distribution excels

5. **Not seeing differences? Increase attempts:** If all schemes look similar, you may have enough attempts that the scheme doesn't matter - good problem to have!

---

**Remember:** The "best" scheme depends on YOUR image. Use this guide to understand the trade-offs, then experiment!
