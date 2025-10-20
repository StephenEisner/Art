# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Circle Packing v14** - a browser-based generative art tool that creates circle-packed versions of images using k-means color clustering. The application segments images into color clusters, then fills each cluster region with procedurally-packed shapes (circles, rectangles, triangles) using various packing algorithms and budgeting strategies.

**Key Innovation:** The system uses adaptive budgeting schemes to intelligently distribute packing attempts across fragmented regions ("islands"), achieving 55-75% coverage while handling extreme image complexity (100+ islands per cluster).

## Architecture

### Core Pipeline Flow

1. **Image Loading** → 2. **Downsampling** → 3. **K-means Clustering** → 4. **Full Resolution Mapping** → 5. **Region Extraction** → 6. **Island Detection** → 7. **Shape Packing** → 8. **Rendering**

### Module Responsibilities

- **app.js** (React UI): Main application, orchestrates the entire pipeline, handles UI state and user interactions
- **clustering.js**: K-means clustering with spatial weighting (color + position features)
- **geometry.js**: Region extraction and connected component analysis (island detection)
- **packing.js**: Shape packing algorithms with multi-pass, mixed shapes, and gap filling
- **index.html**: Single-page application entry point, loads React and dependencies

### Key Data Structures

```javascript
// Pixel representation
{ color: [r, g, b], idx: pixelIndex }

// Region (cluster of pixels)
[{ x: xCoord, y: yCoord }, ...]

// Island (connected component within a region)
[{ x: xCoord, y: yCoord }, ...]  // sorted by size

// Shape
{ type: 'circle'|'rectangle'|'triangle'|'pixel', x, y, r, color }
```

### Island Processing Strategy

Regions are decomposed into "islands" (connected components) and processed differently based on size:
- **< 20px**: PIXEL_FILL (direct pixel rendering)
- **20-100px**: MICRO_PACK (simple packing, fewer attempts)
- **100-500px**: SMALL_PACK (standard packing)
- **≥ 500px**: FULL_PACK (multi-pass enabled if configured)

## Budgeting Schemes

The core innovation is **adaptive attempt budgeting**. Six schemes distribute `maxAttempts` across islands:

1. **fairshare**: Divide evenly, cap by island size (default, most balanced)
2. **proportional**: Strictly by island area (favors large islands)
3. **weighted**: Large islands (≥500px) get 2x their proportional share
4. **fixed**: 1000 base attempts + proportional bonus (ensures minimum quality)
5. **exponential**: Scales by sqrt(area) (balances extreme size variations)
6. **adaptive**: Dynamic allocation, moves on after `adaptiveThreshold` failed attempts (most efficient)

**When to use each:**
- Use `fairshare` for balanced results across the image
- Use `proportional`/`weighted` when large regions dominate visually (landscapes)
- Use `fixed` when you have many tiny islands and want guaranteed minimum quality
- Use `exponential` for images with extreme size variations (10px to 10,000px islands)
- Use `adaptive` for efficiency - it exits early when progress stalls

## Running the Application

**Start the app:**
```bash
open index.html
# Or use a local server:
python3 -m http.server 8000
# Then navigate to http://localhost:8000
```

**No build step required** - this is a vanilla JS application using CDN-hosted React.

## Development Workflow

### Testing Changes

1. Make code changes to `app.js`, `packing.js`, `clustering.js`, or `geometry.js`
2. Refresh browser (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)
3. Open browser console (F12) to see detailed logging
4. Upload test image and generate

### Console Output

The application provides extensive console logging during processing. Key indicators:

```
🎯 Using budgeting scheme: WEIGHTED

Cluster 5/30: 8000 pixels in 23 island(s)
  💰 Budget: WEIGHTED - Large islands get 2x proportional attempts

  Island 1/23: 2400px → FULL_PACK [MULTI-PASS] → 4800 attempts → 245 shapes → 68.2%
  Island 2/23: 800px → SMALL_PACK → 800 attempts → 98 shapes → 62.1%
  ...

  📊 CLUSTER 5 SUMMARY:
     Islands filled: 23 (100.0%) ✓
     Islands skipped: 0 ✓
     Attempts: 10,000 / 10,000 used
     Total shapes: 589
     Cluster coverage: 65.7%
```

**Health indicators:**
- ✓ Islands skipped: 0
- ✓ Coverage: 55-70%
- ⚠️ Islands skipped > 0 → Budget exhausted, increase `maxAttempts` or use `fixed` budgeting
- ⚠️ Coverage < 50% → Too many clusters or insufficient attempts

### Typical Parameter Ranges

- **k (clusters)**: 2-300 (sweet spot: 15-60)
- **spatialWeight**: 0-1 (0 = pure color, 1 = pure spatial, typical: 0.25-0.35)
- **maxDimension**: 200-800px (processing size, not output size)
- **minCircleRadius**: 0.01-20px (typically 3px)
- **maxCircleRadius**: 10-100px (typically 50px)
- **maxAttempts**: 1000-30000 (scale with cluster count: k=20→10k, k=60→20k)
- **numPasses**: 2-8 (multi-pass only, typically 3-4)

## Code Conventions

### Async Processing Pattern

All heavy operations use async/await with `setTimeout(0)` to yield to the event loop:

```javascript
await new Promise(resolve => setTimeout(resolve, 10));
```

This keeps the UI responsive and allows progress updates.

### Progress Callbacks

Packing functions accept `onProgress` callback:
```javascript
onProgress: (fillPercent, failedAttempts, attemptCount) => {
  setProgress(`Island ${i}/${total} - ${Math.round(fillPercent * 100)}% filled`);
  setIslandAttempts(attemptCount);
}
```

### Shape Drawing

All shapes are drawn via `Packing.drawShapes(ctx, shapes)`. Shapes must have:
- `type`: 'circle', 'rectangle', 'triangle', or 'pixel'
- `x, y`: center coordinates
- `r`: radius (circles), side length (triangles), or width (rectangles)
- `w, h`: width/height (rectangles only)
- `color`: CSS color string

## Common Modifications

### Adding a New Budgeting Scheme

1. Add option to `<select>` in app.js around line 770
2. Add `else if (budgetingScheme === 'yourscheme')` block around line 430
3. Calculate `islandAttempts[c]` for each island
4. Add console.log explaining the scheme
5. Update README.md with scheme description

### Modifying Packing Algorithm

Edit `packing.js`. Key functions:
- `packCircles()`: Main packing loop for medium/large islands
- `microPack()`: Simplified packing for tiny islands (20-100px)
- `fitsWithinRegion()`: Collision detection against region bitmap
- `doesNotOverlap()`: Collision detection against existing shapes

### Adjusting Island Size Thresholds

In `app.js` around line 484:
```javascript
if (islandArea < 20) {
  strategy = 'PIXEL_FILL';
} else if (islandArea < 100) {
  strategy = 'MICRO_PACK';
} else if (islandArea < 500) {
  strategy = 'SMALL_PACK';
} else {
  strategy = 'FULL_PACK';
}
```

### Adding New Shape Types

1. Extend `shapeType` select in app.js
2. Add rendering in `packing.js` `drawShapes()` function
3. Add collision detection in `fitsWithinRegion()` and `doesNotOverlap()`
4. Add area calculation for coverage metrics

## Performance Considerations

### Bottlenecks

1. **K-means clustering**: O(k × pixels × iterations) - mitigated by downsampling
2. **Island detection**: O(pixels) flood-fill - uses fast Set-based lookup
3. **Shape packing**: O(attempts × shapes) collision detection - uses spatial grid and early exit

### Optimization Strategies

- **Downsampling**: Cluster on `maxDimension` sized image, then map to full resolution
- **Bitmap region checks**: Pre-compute Uint8Array bitmap for O(1) point-in-region tests
- **Adaptive budgeting**: Exit early when progress stalls (adaptive scheme)
- **Multi-pass**: Reduces collision checks by packing large shapes first
- **Spatial grid**: Coverage grid for gap detection (not full spatial hashing yet)

### Typical Processing Times

- Small image (800×600), k=30: ~10-20 seconds
- Large image (2000×1500), k=60: ~60-120 seconds
- Highly fragmented (100+ islands/cluster): +50% time

## File Format Notes

### Settings JSON

Saved via "Save Settings" button:
```json
{
  "k": 30,
  "spatialWeight": 0.3,
  "maxDimension": 400,
  "minCircleRadius": 3,
  "maxCircleRadius": 50,
  "budgetingScheme": "fairshare",
  "enableMultiPass": true,
  "numPasses": 3,
  "savedAt": "2024-01-01T12:00:00.000Z"
}
```

All settings are loaded via `loadSettings()` in app.js.

## Debugging Tips

1. **Check console logs**: Processing emits detailed logs for each cluster/island
2. **Look for "islands skipped"**: Indicates budget exhaustion
3. **Check coverage %**: Should be 55-75% for good results
4. **Count islands**: 100+ islands per cluster = extreme fragmentation, reduce k
5. **Monitor "attempts used"**: Should use most of budget without exhausting it

## Version Notes

This is **v14** in a series. Previous versions explored:
- v8-v10: Multi-pass packing, island detection
- v11: Budgeting schemes (fairshare, proportional, weighted, fixed, exponential)
- v12-v13: Refinements (not in repo)
- v14: Adaptive budgeting with early exit threshold

Check git history for evolution:
```bash
git log --oneline -- ../
```

## Related Documentation

- **README.md**: Comprehensive user guide with budgeting scheme explanations
- **QUICK_START.md**: 30-second to 5-minute quick start guides
- **BUDGETING_GUIDE.md**: Deep dive into budgeting schemes with examples
- **ADAPTIVE_BUDGETING.md**: Adaptive scheme implementation details
- **ATTEMPT_COUNTERS.md**: Attempt tracking system documentation

When making changes that affect user-facing behavior, update relevant documentation.
