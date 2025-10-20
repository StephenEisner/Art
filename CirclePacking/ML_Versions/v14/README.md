# Circle Packing v11 - Enhanced Edition

## 🎉 What's New

This version adds **three major features** to give you better control and workflow:

### 1. Multiple Budgeting Schemes 🎯

You can now choose different strategies for distributing packing attempts across islands:

#### **Fair Share** (Default - Balanced)
- Divides attempts evenly across all islands
- Caps allocation by island size to prevent waste
- Best for: Consistent quality across all regions
- Example: 10,000 attempts for 50 islands = ~200 per island (adjusted by size)

#### **Proportional** (Size-Based)
- Strictly allocates based on island size
- Large islands get proportionally more attempts
- Best for: When you have a few large important regions
- Example: 5000px island gets 10x more attempts than 500px island

#### **Weighted** (Large Islands Prioritized)
- Large islands (500+ pixels) get **2x** their proportional share
- Smaller islands still get their fair share
- Best for: When large regions are most important visually
- Example: 1000px island gets attempts as if it were 2000px

#### **Fixed + Bonus** (Guaranteed Minimum)
- Every island gets 1000 base attempts
- Remaining attempts distributed proportionally
- Best for: Ensuring all islands get some attention
- Example: Tiny island gets 1000 attempts minimum, plus bonus based on size

#### **Exponential** (Sqrt Scaling)
- Attempts scale with sqrt(island size)
- Balances between large and small islands
- Best for: When you have extreme size variations
- Example: 100px island and 10,000px island get more balanced distribution

### 2. Save Image Button 💾

- Click "Save Image" to download your generated circle pack as PNG
- Filename includes timestamp: `circle-pack-1234567890.png`
- Works even if processing failed partway through

### 3. Save/Load Settings ⚙️

**Save Settings:**
- Saves ALL current parameters to a JSON file
- Includes: clusters, spatial weight, attempts, budgeting scheme, etc.
- Filename includes timestamp for version tracking

**Load Settings:**
- Load previously saved settings instantly
- Perfect for:
  - Recreating a look you liked
  - Sharing settings with others
  - A/B testing different configurations
  - Batch processing with consistent settings

## 📊 Understanding Budgeting Impact

### Scenario: 10,000 Attempts, Cluster with 100 Islands

**Island Sizes:**
- 1 large island (5000px)
- 10 medium islands (300px each)
- 89 small islands (50px each)

**Fair Share:**
```
Large: ~2,500 attempts (capped by size)
Each medium: ~100 attempts
Each small: ~50 attempts
Result: All islands get processed
```

**Proportional:**
```
Large: ~5,000 attempts (50% of total)
Each medium: ~300 attempts
Each small: ~50 attempts
Result: Large island gets excellent coverage, small islands adequate
```

**Weighted:**
```
Large: ~7,000 attempts (gets 2x weight!)
Each medium: ~250 attempts
Each small: ~30 attempts
Result: Large island pristine, others decent
```

**Fixed + Bonus:**
```
Large: 1000 + ~4,500 = ~5,500 attempts
Each medium: 1000 + ~275 = ~1,275 attempts
Each small: 1000 + ~45 = ~1,045 attempts
Result: All islands get good minimum, large still prioritized
```

### When to Use Each Scheme

**Use Fair Share when:**
- You want balanced results across the entire image
- No particular region is more important
- You have moderate cluster counts (20-50)

**Use Proportional when:**
- Large regions are your focal points
- You're okay with tiny islands getting less attention
- You want maximum quality on prominent areas

**Use Weighted when:**
- Similar to proportional, but even more aggressive
- You have a few very large islands that dominate
- Coverage on small islands is less critical

**Use Fixed + Bonus when:**
- You want guaranteed minimum quality everywhere
- You have high cluster counts (50+) with many tiny islands
- You don't want ANY island to be neglected

**Use Exponential when:**
- You have extreme size variations (10px to 10,000px islands)
- You want a mathematically balanced approach
- Fair Share isn't distributing well for your image

## 🎨 Recommended Settings by Goal

### Maximum Coverage (65-75%)
```
Clusters: 15-20
Budgeting: Proportional or Weighted
Max Attempts: 15,000
Multi-Pass: Enabled (3 passes)
Mixed Shapes: Enabled
Gap Filling: Enabled
```

### Balanced Quality & Coverage (60-70%)
```
Clusters: 30-40
Budgeting: Fair Share or Fixed + Bonus
Max Attempts: 15,000
Multi-Pass: Enabled (3 passes)
Gap Filling: Enabled
```

### Maximum Detail (50-60% coverage)
```
Clusters: 60-100
Budgeting: Fixed + Bonus (guarantees all islands get attention)
Max Attempts: 20,000-30,000
Multi-Pass: Enabled (4 passes)
Mixed Shapes: Enabled
Gap Filling: Enabled
```

### Fast Preview
```
Clusters: 8-12
Budgeting: Fair Share
Max Attempts: 8,000
Processing Size: 300px
Multi-Pass: Disabled
```

## 🔍 Console Output Guide

### What to Look For

```
🎯 Using budgeting scheme: WEIGHTED

Cluster 5/30: 8000 pixels in 23 island(s)
  💰 Budget: WEIGHTED - Large islands get 2x proportional attempts
  
  Island 1/23: 2400px → FULL_PACK [MULTI-PASS] → 4800 attempts → 245 shapes → 68.2%
  Island 2/23: 800px → SMALL_PACK → 800 attempts → 98 shapes → 62.1%
  Island 3/23: 120px → SMALL_PACK → 240 attempts → 24 shapes → 58.3%
  ...
  
  📊 CLUSTER 5 SUMMARY:
     Total islands: 23
     Islands filled: 23 (100.0%) ✓
     Islands skipped: 0 ✓
     Attempts: 10,000 / 10,000 used
     Total shapes: 589
     Cluster coverage: 65.7%
```

**Good signs:**
- ✓ All islands filled (0 skipped)
- ✓ Multi-pass appearing on large islands
- ✓ Attempt budgets make sense for island sizes
- ✓ Coverage percentages in 55-70% range

**Problem signs:**
- ⚠️ Islands skipped > 0 → Increase Max Attempts or use Fixed + Bonus
- ⚠️ Many tiny islands (100+ tiny) → Reduce cluster count
- ⚠️ Low coverage (<45%) on medium islands → Try different budgeting scheme

## 💡 Tips & Tricks

1. **Save your baseline settings first** - Before experimenting, save your current "good" settings so you can return to them

2. **Test different budgeting schemes** - Same image, same settings, just change the budgeting scheme and compare

3. **Watch the console** - It tells you exactly what's happening. Look for the budgeting scheme line and verify it matches your selection

4. **Increase attempts for complex images** - If you have 50+ clusters, bump Max Attempts to 20,000-30,000

5. **Use Proportional/Weighted for landscapes** - Usually have a few large sky/ground regions that benefit from extra attempts

6. **Use Fixed + Bonus for portraits** - Ensures facial features get adequate attention even if fragmented

## 📦 File Structure

```
v11/
├── index.html          - Main HTML file (load this)
├── app.js              - React UI with new features
├── clustering.js       - K-means clustering
├── geometry.js         - Region processing & island detection
├── packing.js          - Circle packing algorithm
└── README.md          - This file
```

## 🚀 Getting Started

1. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari)
2. Upload an image
3. Adjust settings (try the presets above)
4. Select a budgeting scheme
5. Click "Generate Circle Pack"
6. Watch the console for detailed progress (F12)
7. Save your image and settings when done!

## 🐛 Troubleshooting

**"Islands skipped" in console:**
- Solution: Increase Max Attempts OR switch to Fixed + Bonus budgeting

**Coverage too low (<50%):**
- Solution: Reduce cluster count to 20-40 OR increase Max Attempts

**Processing too slow:**
- Solution: Reduce Processing Size to 300px OR reduce Max Attempts

**Settings not loading:**
- Check that the JSON file is valid (open in text editor)
- Make sure all required fields are present

## 📝 Version History

**v11 (Current):**
- Added 5 budgeting schemes
- Added save image button
- Added save/load settings
- Improved console logging for budgeting

**v10:**
- Fixed attempt budget bug
- Adaptive multi-pass (only for large islands)
- Improved island processing

## 🎯 Next Steps

Try creating multiple versions of the same image:
1. Load your image
2. Generate with Fair Share → Save image as "fair-share.png", save settings
3. Load settings → Change to Weighted → Generate → Save as "weighted.png"
4. Load settings → Change to Proportional → Generate → Save as "proportional.png"
5. Compare results!

Happy packing! 🎨
