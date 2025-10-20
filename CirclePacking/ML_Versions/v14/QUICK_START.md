# 🚀 Quick Start Guide - Circle Packing v11

## What's New in This Version?

### 1️⃣ Five Budgeting Schemes
Choose how packing attempts are distributed across islands:
- **Fair Share** - Balanced (default, reliable)
- **Proportional** - Large islands get proportionally more
- **Weighted** - Large islands get 2x their share
- **Fixed + Bonus** - Every island gets 1000 minimum
- **Exponential** - Sqrt scaling (best for varied sizes)

### 2️⃣ Save Image Button
Download your generated art as PNG with one click!

### 3️⃣ Save/Load Settings
Save your perfect settings and reuse them anytime.

---

## 30-Second Start

1. Open `index.html` in your browser
2. Upload an image
3. Click "Generate Circle Pack"
4. Click "Save Image" to download

Done! ✅

---

## 2-Minute Better Results

1. Upload your image
2. **Adjust clusters** based on your image:
   - Simple image? **15-30 clusters**
   - Complex image? **40-60 clusters**
   - Very detailed? **60-80 clusters**

3. **Choose budgeting scheme:**
   - Not sure? Keep **Fair Share** ✓
   - Landscape photo? Try **Proportional**
   - Portrait photo? Try **Fixed + Bonus**

4. **Set attempts** based on clusters:
   - < 30 clusters: **10,000 attempts**
   - 30-60 clusters: **15,000 attempts**
   - > 60 clusters: **20,000-30,000 attempts**

5. Generate → Save Image → Save Settings

---

## 5-Minute Optimization

### Step 1: Generate Baseline
```
Clusters: 30
Budgeting: Fair Share
Max Attempts: 10,000
```
Click Generate → Check console (F12) for coverage %

### Step 2: Analyze Console Output
Look for:
- **Coverage:** Should be 55-70%
- **Islands skipped:** Should be 0
- **Island breakdown:** How many tiny/small/medium/large?

### Step 3: Adjust Based on Results

**If coverage is LOW (< 50%):**
- Reduce clusters to 20-30, OR
- Increase attempts to 15,000, OR
- Change budgeting to Proportional

**If "islands skipped" > 0:**
- Increase attempts to 15,000+, OR
- Change budgeting to Fixed + Bonus

**If you have many tiny islands (100+):**
- Reduce clusters to 30-40, OR
- Use Fixed + Bonus budgeting, OR
- Increase attempts to 20,000+

### Step 4: Fine-Tune
Try these advanced features:
- ✓ Enable Multi-Pass (better coverage)
- ✓ Enable Gap Filling (fills tiny gaps)
- ✓ Enable Mixed Shapes (rectangles help elongated areas)

### Step 5: Save Everything!
- Save your final image
- Save your settings for next time

---

## Preset Configurations

### 🎨 Maximum Quality
```
Clusters: 15-20
Spatial Weight: 0.25
Budgeting: Weighted
Max Attempts: 15,000
Multi-Pass: ✓ (3 passes)
Mixed Shapes: ✓
Gap Filling: ✓
Expected: 68-75% coverage, pristine large areas
```

### ⚖️ Balanced
```
Clusters: 30-40
Spatial Weight: 0.30
Budgeting: Fair Share
Max Attempts: 15,000
Multi-Pass: ✓ (3 passes)
Gap Filling: ✓
Expected: 60-68% coverage, consistent quality
```

### 🔬 Maximum Detail
```
Clusters: 70-90
Spatial Weight: 0.35
Budgeting: Fixed + Bonus
Max Attempts: 25,000
Multi-Pass: ✓ (4 passes)
Mixed Shapes: ✓
Gap Filling: ✓
Expected: 55-62% coverage, intricate detail
```

### ⚡ Fast Preview
```
Clusters: 10-15
Processing Size: 300px
Budgeting: Fair Share
Max Attempts: 8,000
Multi-Pass: ✗
Expected: ~60% coverage, ~30 seconds
```

---

## Troubleshooting

### "Processing is too slow"
- Reduce Processing Size to 300px
- Reduce Max Attempts to 8,000
- Disable Multi-Pass

### "Islands skipped in console"
- Increase Max Attempts
- OR change to Fixed + Bonus budgeting

### "Coverage is too low"
- Reduce cluster count to 20-30
- OR increase Max Attempts to 15,000+
- OR change to Proportional budgeting

### "Tiny details are missing"
- Use Fixed + Bonus budgeting
- Increase Max Attempts to 20,000+
- Enable Gap Filling

### "Large areas look sparse"
- Use Proportional or Weighted budgeting
- OR reduce cluster count

---

## Understanding the Console

Press F12 to open browser console. You'll see:

```
🎯 Using budgeting scheme: FAIR SHARE

Cluster 5/30: 8000 pixels in 23 island(s)
  💰 Budget: FAIR SHARE - 10,000 attempts for 23 islands
  
  Island 1/23: 2400px → FULL_PACK → 950 attempts → 245 shapes → 68.2%
  Island 2/23: 800px → SMALL_PACK → 340 attempts → 98 shapes → 62.1%
  ...
  
  📊 CLUSTER 5 SUMMARY:
     Islands filled: 23 (100.0%) ✓ GOOD!
     Islands skipped: 0 ✓ GOOD!
     Cluster coverage: 65.7%
```

**What to check:**
- ✓ Islands skipped: 0 = Good!
- ✓ Cluster coverage: 55-70% = Good!
- ⚠️ Islands skipped: > 0 = Increase attempts or use Fixed + Bonus
- ⚠️ Coverage: < 50% = Too many clusters or not enough attempts

---

## Files Included

- **index.html** - Open this in your browser
- **README.md** - Full documentation
- **BUDGETING_GUIDE.md** - Deep dive into budgeting schemes
- **QUICK_START.md** - This file
- **app.js, clustering.js, geometry.js, packing.js** - The code

---

## Tips

1. **Start simple:** Use defaults, then adjust
2. **Watch the console:** It tells you what's happening
3. **Save your settings:** When you find something you like
4. **Experiment:** Try different budgeting schemes on same image
5. **More clusters ≠ better:** Often 30-40 clusters looks best

---

## Next Steps

Once you're comfortable:
- Read **README.md** for detailed explanations
- Read **BUDGETING_GUIDE.md** for scheme comparisons
- Experiment with different budgeting schemes
- Share your creations!

---

**Need help?** Check the console output and compare it to examples in this guide.

**Having fun?** Save your settings and try the same image with different budgeting schemes - the results can be dramatically different!

Happy packing! 🎨✨
