# The Real Coverage Problem: Fragmentation vs Packing

## Why Multi-Pass Wasn't Helping (You Were Right!)

### The Math of Multi-Pass with 80 Clusters

```
Example Island: 300 pixels
Total attempts available: 10,000
Island gets: 10,000 × (300 / 80,000) × 2 = ~750 attempts

WITHOUT Multi-Pass:
✓ 750 attempts
✓ Size range: 1-40px (full range)
✓ Can try any size anywhere
✓ Result: ~55-60% coverage

WITH Multi-Pass (4 passes):
✗ Pass 1: 187 attempts, size 40-30px  
✗ Pass 2: 187 attempts, size 30-20px
✗ Pass 3: 187 attempts, size 20-10px
✗ Pass 4: 187 attempts, size 10-1px
✗ Each pass too constrained
✗ Result: ~45-50% coverage (WORSE!)
```

**Multi-pass only helps when islands are LARGE (>1000px) with MANY attempts.**

## What I Just Fixed

### Adaptive Multi-Pass
Now multi-pass is **smart**:

- Islands < 1000px: Single-pass (more flexible, works better)
- Islands ≥ 1000px: Multi-pass (enough attempts to make it worthwhile)
- Multi-pass gets 50% bonus attempts to compensate for division

### Increased Base Attempts
- Minimum per island: 1000 → **1500**
- Multiplier: 1.5x → **2x**
- Small islands get ~2x more attempts than before

## The REAL Problem: 80 Clusters = Too Much Fragmentation

### Your Current Situation
```
80 clusters × ~50 islands each = ~4000 islands to pack
Most islands: 20-200 pixels each
Each island gets: 100-500 attempts
Result: 54% coverage (decent, but limited)
```

### The Fundamental Trade-off

**More Clusters:**
✓ Better color separation
✓ More artistic detail
✓ Unique aesthetic
✗ Severe fragmentation
✗ Thousands of tiny islands
✗ Lower coverage (50-60%)

**Fewer Clusters:**
✗ Less color detail
✗ Less visual complexity
✓ Larger, more packable regions
✓ Higher coverage (65-80%)

## Strategies to Increase Coverage

### Strategy 1: Reduce Clusters (BIGGEST IMPACT)
**From 80 → 35 clusters**
- Expected gain: +15-25% coverage
- Trade-off: Less color detail

**Settings:**
```
Clusters: 30-40
Multi-pass: Enabled (will actually help now!)
Max Attempts: 12,000
Gap Filling: Enabled
```
Expected: **68-75% coverage**

### Strategy 2: Enable Mixed Shapes (GOOD FOR 80 CLUSTERS)
With high fragmentation, rectangles pack better in thin/elongated islands.

**Settings:**
```
Clusters: 80
Mixed Shapes: Enabled ← NEW
Multi-pass: Let it auto-decide (disabled for most islands)
Max Attempts: 15,000 ← Increased
Gap Filling: Enabled
```
Expected: **58-65% coverage**

### Strategy 3: Massive Attempt Boost
Throw more computation at the problem.

**Settings:**
```
Clusters: 80
Max Attempts: 25,000 ← Doubled
Multi-pass: Enabled (system auto-disables for small islands)
Mixed Shapes: Enabled
Gap Filling: Enabled
Processing Size: 400px
```
Expected: **60-68% coverage**
Warning: Will be SLOW (~2-5 minutes)

### Strategy 4: Hybrid Approach (RECOMMENDED)
Balance between detail and coverage.

**Settings:**
```
Clusters: 45-50 ← Sweet spot
Spatial Weight: 0.25 ← Slightly less spatial coherence
Max Attempts: 15,000
Multi-pass: Enabled
Mixed Shapes: Enabled
Gap Filling: Enabled
```
Expected: **65-72% coverage**
Good balance of detail + coverage

## Console Output Guide

### Good Signs:
```
Cluster 15/45: 8000 pixels in 23 island(s)
  Island breakdown: 8 tiny, 9 small, 4 medium, 2 large
  Island 1/23: 2400px → FULL_PACK [MULTI-PASS] → 245 shapes → 68.2% coverage
  Island 2/23: 800px → SMALL_PACK → 98 shapes → 62.1% coverage
```
This means:
- Reasonable island count (23 vs hundreds)
- Multi-pass being used on large islands
- Good per-island coverage

### Problem Signs:
```
Cluster 15/80: 3000 pixels in 127 island(s)
  Island breakdown: 89 tiny, 28 small, 8 medium, 2 large
  Island 1/127: 340px → SMALL_PACK → 32 shapes → 44.5% coverage
```
This means:
- Too many tiny islands (89 tiny!)
- Multi-pass never triggers (no islands >1000px)
- Poor coverage on even medium islands

## Quick Test Comparison

### Test 1: Current Settings (80 clusters)
Run and note:
- Total islands across all clusters?
- How many show [MULTI-PASS]?
- Average island coverage?

### Test 2: Reduced Clusters (35 clusters)
Same other settings, just change clusters to 35
Run and compare:
- Should see fewer, larger islands
- [MULTI-PASS] should appear more often
- Higher per-island coverage

### Test 3: Mixed Shapes + More Attempts
Back to 80 clusters, but:
- Enable Mixed Shapes
- Increase Max Attempts to 20,000
Compare coverage improvement

## Expected Results

**Current (80 clusters, no multi-pass, gap fill):** 54%

**After fixes:**
- Same 80 clusters: **56-58%** (marginal improvement)
- 50 clusters: **62-68%** (good improvement)
- 35 clusters: **68-75%** (major improvement)
- 25 clusters: **72-78%** (maximum coverage, less detail)

## The Bottom Line

**Your observation was correct:** Multi-pass wasn't helping because:
1. Too many clusters = too much fragmentation
2. Small islands = too few attempts per island
3. Multi-pass made it worse by dividing those few attempts

**Now it's fixed:**
- Multi-pass only activates for large islands (>1000px)
- Small islands get more attempts
- But the fundamental issue remains: 80 clusters = severe fragmentation

**Recommendation:** Try 40-50 clusters. You'll still get great detail but much better coverage.
