# Circle Packing Coverage Optimization Guide

## Current Status
- Base coverage: 34% (without connected components)
- Current coverage: 54% (with connected components)
- Target: 65-75%

## Understanding the Console Output

### What to Look For:
```
Cluster 5/30: 5000 pixels in 53 island(s)
  Island breakdown: 35 tiny (<20px), 12 small (20-100px), 4 medium (100-500px), 2 large (>500px)
  Island 1/53: 1200px → FULL_PACK → 145 shapes → 62.3% coverage
  Island 2/53: 300px → SMALL_PACK → 42 shapes → 58.1% coverage
  Island 3/53: 40px → MICRO_PACK → 8 shapes → 75.2% coverage
  Island 4/53: 15px → PIXEL_FILL → 15 shapes → 100.0% coverage
  ... (48 more islands) ...
  ✓ Cluster 5 complete: 225 total shapes, 68.5% cluster coverage
```

### Key Metrics:
1. **Island breakdown** - Shows fragmentation level
2. **Per-island coverage** - Identifies problem areas
3. **Strategy used** - Shows which algorithm was applied

## Strategies to Increase Coverage

### 1. Enable Multi-Pass Packing (BIGGEST IMPACT)
**Current:** Disabled
**Recommended:** Enable with 3-4 passes

**Why:** Single-pass places random sizes. Multi-pass ensures large shapes first, then progressively smaller.

**Expected gain:** +10-15% coverage

### 2. Increase Max Attempts
**Current:** 10,000
**For 80 clusters:** Each small island gets only ~50-200 attempts (proportional split)

**Recommended Settings:**
- 50+ clusters: Use 15,000-20,000 attempts
- 20-30 clusters: Use 10,000-12,000 attempts

**Expected gain:** +3-5% coverage

### 3. Adjust Min Shape Size
**Current:** 1px
**Issue:** Circles < 1.5px are geometrically challenging to pack

**Recommended:**
- For high cluster counts (50+): Keep at 1px
- For medium clusters (20-50): Try 0.8px
- For low clusters (<20): Use 2-3px

### 4. Enable Mixed Shapes
**Impact:** Rectangles pack 10-15% better in elongated islands

**When to use:**
- Images with linear features (horizons, edges)
- High fragmentation (50+ clusters)

**Expected gain:** +5-8% coverage

### 5. Optimize Cluster Count

**The Trade-off:**
- More clusters (50-100) = Better color separation BUT more fragmentation
- Fewer clusters (8-15) = More packable regions BUT less color detail

**Recommendation for your Yosemite image:**
- **Best quality:** 30-40 clusters (balanced)
- **Best coverage:** 15-20 clusters (less fragmentation)
- **Most detail:** 50-80 clusters (but accept lower coverage)

## Optimal Settings for Different Goals

### Maximum Coverage (~65-75%)
```
Clusters: 15-20
Spatial Weight: 0.2-0.3
Min Shape Size: 2px
Max Shape Size: 50px
Max Attempts: 12,000
Multi-Pass: ✓ Enabled (4 passes)
Mixed Shapes: ✓ Enabled
Gap Filling: ✓ Enabled
Packing Mode: Efficient
```

### Balanced Quality & Coverage (~60-70%)
```
Clusters: 25-35
Spatial Weight: 0.3
Min Shape Size: 1px
Max Shape Size: 40px
Max Attempts: 15,000
Multi-Pass: ✓ Enabled (3 passes)
Mixed Shapes: ✗ Disabled
Gap Filling: ✓ Enabled
Packing Mode: Efficient
```

### Maximum Detail (~50-60% coverage)
```
Clusters: 60-100
Spatial Weight: 0.3-0.4
Min Shape Size: 0.5px
Max Shape Size: 30px
Max Attempts: 20,000
Multi-Pass: ✓ Enabled (3 passes)
Mixed Shapes: ✓ Enabled
Gap Filling: ✓ Enabled
Packing Mode: Efficient
```

## Diagnosing Low Coverage Islands

### Problem: "Island X: 200px → SMALL_PACK → 12 shapes → 35% coverage"

**Possible causes:**
1. Island is very thin/elongated (e.g., 100×2 pixels)
2. Island has irregular boundaries
3. Not enough attempts allocated
4. Shape size range doesn't match island size

**Solutions:**
1. Enable Mixed Shapes (rectangles work better for thin regions)
2. Increase Max Attempts
3. Reduce cluster count to create larger, more compact islands

### Problem: Many tiny islands (<20px)

**If you see:** "Island breakdown: 100 tiny, 10 small, 2 medium, 1 large"

**This means:** Over-clustering - too many color regions

**Solution:** Reduce cluster count by 30-50%

## Technical Details

### Island Size Strategies:
- **< 20px:** Direct pixel fill (100% coverage guaranteed)
- **20-100px:** Micro-packing (0.5-8px circles, 4-point checking)
- **100-500px:** Small packing (normal algorithm, fewer attempts)
- **> 500px:** Full packing (all features enabled)

### Attempt Allocation:
Each island gets attempts proportional to its size:
```
island_attempts = max(1000, total_attempts × (island_size / cluster_size) × 1.5)
```

The 1.5× multiplier gives larger islands extra attempts for better packing.

## Quick Wins

**To gain 5-10% coverage right now:**
1. ☑ Enable Multi-Pass Packing (3 passes)
2. ☑ Increase Max Attempts to 15,000
3. ☑ Keep Gap Filling enabled

**To gain another 5-10%:**
4. ☐ Enable Mixed Shapes
5. ☐ Reduce clusters to 30-40

**To understand what's happening:**
- Open browser console (F12)
- Watch the detailed island-by-island logs
- Look for islands with <50% coverage
- Adjust settings based on what you see

## Example Console Analysis

```
Cluster 12/80: 8000 pixels in 87 island(s)
  Island breakdown: 62 tiny (<20px), 18 small (20-100px), 5 medium (100-500px), 2 large (>500px)
```

**Analysis:** 
- 62 tiny islands = severe fragmentation
- Only 2 large packable islands
- Recommendation: Reduce to 40 clusters

```
Island 1/87: 2400px → FULL_PACK → 95 shapes → 45.2% coverage
```

**Analysis:**
- Large island but only 45% coverage
- Recommendation: Enable multi-pass or increase attempts

## Expected Results Timeline

**Current:** 54% with gap filling only
**+ Multi-pass:** 62-67%
**+ Increased attempts:** 65-70%
**+ Mixed shapes:** 68-75%
**- OR reduce clusters:** 60-70% (but with better quality)
