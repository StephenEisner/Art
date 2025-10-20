# Live Attempt Counters

## What's New

The UI now displays **real-time attempt counters** while processing:

```
Processing...
🎯 Current Island: 1,247 attempts
📊 Current Cluster: 8,532 attempts
Total Coverage: 45.32%
```

## What You See

### 🎯 Current Island Counter
Shows the number of packing attempts used **on the island currently being processed**.

- Resets to 0 when starting a new island
- Updates in real-time during packing (every 50 attempts)
- For adaptive budgeting: shows actual attempts used
- For pre-planned budgeting: counts up to allocated amount

**Example progression:**
```
Island 1: 0 → 342 → 687 → 1,024 → 1,247 (complete)
Island 2: 0 → 156 → 312 → 523 (complete, ended early)
Island 3: 0 → 89 → 178 → ...
```

### 📊 Current Cluster Counter
Shows the **cumulative attempts used for all islands in the current cluster**.

- Resets to 0 when starting a new cluster
- Accumulates as islands are processed
- Shows total cluster efficiency

**Example progression:**
```
Cluster 5:
  Island 1 completes: 1,247 attempts → Cluster: 1,247
  Island 2 completes: 523 attempts → Cluster: 1,770
  Island 3 completes: 892 attempts → Cluster: 2,662
  Island 4 in progress: 178 attempts → Cluster: 2,840
  ...
```

## Why This Matters

### 1. **See Adaptive Budgeting in Action**

With adaptive budgeting, you can watch islands exit early:
```
Island 5: 1,847 attempts (stopped early at threshold)
Island 6: 523 attempts (stopped early)
Island 7: 2,341 attempts (kept going, good progress)
```

You'll see some islands use fewer attempts (early exit) and others use more (saved attempts redistributed).

### 2. **Diagnose Slow Processing**

If you see:
```
🎯 Current Island: 8,247 attempts
```
And it's still climbing slowly, you know this island is difficult to pack.

### 3. **Monitor Budget Usage**

For pre-planned budgeting, compare:
- Island Counter: Attempts used on this island
- Console log: Allocated attempts for this island

If they match, the island used its full allocation. If island counter is lower, it finished early (good!).

### 4. **Track Cluster Efficiency**

Watch the cluster counter to see if you're staying under budget:
```
📊 Current Cluster: 9,234 attempts

Console: "Attempts: 9,234 / 10,000 used"
Result: Efficient! Saved 766 attempts.
```

## Behavior by Budgeting Scheme

### Fair Share / Proportional / Weighted / Fixed+Bonus / Exponential
**Pre-planned schemes:**
- Island counter counts up to allocated amount
- Will reach the allocated number (unless island finishes early)
- Cluster counter = sum of all island allocations

### Adaptive
**Dynamic scheme:**
- Island counter stops when early exit threshold reached
- Varies widely between islands (some use 200, others 2,000+)
- Cluster counter = actual total used (often less than budget!)

## Performance Indicators

### Good Signs:
```
Island 1: 1,847 attempts (stopped at threshold) ⚡
Island 2: 523 attempts (stopped at threshold) ⚡
Cluster: 8,234 / 10,000 used ← Under budget!
```
Early exits + under budget = efficient!

### Potential Issues:
```
Island 1: 4,500 attempts (still climbing...)
```
Very high attempt count = difficult island or poor settings

### Red Flags:
```
Island 1: 9,000 attempts
Cluster: 9,000 / 10,000 used
Islands remaining: 50
```
Used too many attempts on first island, won't have enough for others!

## Console Correlation

The counters match what you see in console:

**UI shows:**
```
🎯 Current Island: 1,847 attempts
📊 Current Cluster: 5,623 attempts
```

**Console shows:**
```
Island 1/23: 2400px → FULL_PACK → 1847 attempts used → 68.2%
📊 CLUSTER 5 SUMMARY:
   Attempts: 5,623 / 10,000 used
```

Perfect match! ✓

## Tips

1. **Watch the island counter** during adaptive budgeting to see when islands stop making progress

2. **Monitor cluster counter** to ensure you're not running out of attempts mid-cluster

3. **Compare schemes** - run the same image with different budgeting schemes and watch how the counters differ

4. **Adjust max attempts** if cluster counter consistently hits the limit before finishing all islands

5. **Adjust adaptive threshold** if island counters are consistently hitting very high numbers (increase threshold) or very low numbers (decrease threshold)

## Example Observations

### Adaptive with Threshold 300:
```
Island 1: 1,847 → 302 consecutive failures, stopped
Island 2: 523 → 311 consecutive failures, stopped
Island 3: 2,341 → Still making progress
```
**Insight:** Islands 1 & 2 reached threshold. Island 3 kept going because it was still placing shapes successfully.

### Fair Share with 50 Islands:
```
Each island: ~200 attempts
Cluster: 200 → 400 → 600 → ... → 10,000
```
**Insight:** Predictable, linear growth. Every island gets the same.

### Proportional with Large Sky:
```
Island 1 (sky): 5,000 attempts
Island 2 (mountain): 3,000 attempts
Cluster: 5,000 → 8,000 → ...
Small islands: 50-100 attempts each
```
**Insight:** Large islands dominate the budget.

## Summary

The attempt counters give you **real-time visibility** into the packing process:

- **See efficiency** (adaptive budgeting in action)
- **Diagnose problems** (islands using too many attempts)
- **Track progress** (cluster budget usage)
- **Compare strategies** (how different schemes allocate attempts)

Watch them while processing to understand how your settings affect the algorithm's behavior!
