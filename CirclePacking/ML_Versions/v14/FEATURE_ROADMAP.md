# Feature Roadmap - Circle Packing v14+

This document tracks potential features, enhancements, and improvements for future versions.

---

## 🎨 Current Features (v14)

- [x] K-means color clustering with spatial weighting
- [x] Multiple shape types (circle, rectangle, triangle)
- [x] Six budgeting schemes (fairshare, proportional, weighted, fixed, exponential, adaptive)
- [x] Multi-pass packing (large shapes first, then progressively smaller)
- [x] Mixed shapes mode (circles + rectangles)
- [x] Gap filling pass
- [x] Save/load settings (JSON)
- [x] Save image (PNG)
- [x] Real-time progress tracking with attempt counters
- [x] Adaptive early exit threshold
- [x] Island-based processing (pixel-fill, micro-pack, small-pack, full-pack)

---

## 🚀 High Priority Features

### 1. Per-Island Adaptive Thresholds
**Status:** 💡 Idea
**Complexity:** Medium
**Impact:** High

Allow different early exit thresholds based on island size:
```javascript
const threshold = calculateThreshold(islandArea);
// Large islands (1000+): 500 attempts
// Medium islands (100-500): 300 attempts
// Small islands (20-100): 150 attempts
```

**Benefits:**
- More efficient packing on small islands (don't waste attempts)
- More thorough packing on large islands (worth the patience)
- Better overall coverage (estimated +2-3%)

**Implementation:**
- Add `adaptiveThresholdMode` option: 'fixed' | 'scaled'
- Create threshold scaling function based on island area
- Update console logging to show threshold per island

---

### 2. Hexagonal Shape Support
**Status:** 💡 Idea
**Complexity:** Medium
**Impact:** Medium

Add hexagons as a shape option for tighter packing in certain regions.

**Benefits:**
- Hexagons tile better than circles (honeycomb packing)
- Potential +5-10% coverage in regular regions
- Unique aesthetic

**Implementation:**
- Add hexagon rendering to `packing.js` `drawShapes()`
- Add hexagon collision detection (6-sided polygon)
- Add area calculation: `(3 * sqrt(3) / 2) * r^2`
- Add to shape type selector UI

**Considerations:**
- Hexagons harder to pack in irregular boundaries
- May need orientation randomization

---

### 3. Color Palette Export
**Status:** 💡 Idea
**Complexity:** Low
**Impact:** Low-Medium

Export the k-means cluster centroids as a color palette.

**Features:**
- Download palette as JSON, CSS variables, or Adobe ASE
- Show palette preview in UI
- Click to copy individual colors

**Use Cases:**
- Design work - extract dominant colors from images
- Consistent color schemes across projects
- Color analysis

**Implementation:**
- Add "Export Palette" button
- Generate palette from `centroids` array
- Support multiple export formats

---

### 4. Batch Processing Mode
**Status:** 💡 Idea
**Complexity:** High
**Impact:** Medium

Process multiple images with the same settings automatically.

**Features:**
- Upload multiple images at once
- Apply same settings to all
- Download all results as ZIP
- Progress indicator for batch

**Use Cases:**
- Creating series/collections
- Testing settings across multiple images
- Batch art generation

**Implementation:**
- Add multi-file upload input
- Queue system for processing
- JSZip library for ZIP generation
- Batch progress UI

---

### 5. SVG Export
**Status:** 💡 Idea
**Complexity:** Medium-High
**Impact:** High

Export results as scalable vector graphics instead of raster PNG.

**Benefits:**
- Infinitely scalable artwork
- Smaller file sizes for simple images
- Editable in Illustrator/Inkscape
- Perfect for laser cutting, plotting, printing

**Implementation:**
- Generate SVG from shapes array instead of canvas rendering
- Include clipping paths for region boundaries
- Support all shape types (circle, rect, polygon for triangles/hexagons)
- Add "Save as SVG" button

**Considerations:**
- Large images with many shapes = huge SVG files
- May need shape count limit or simplification

---

### 6. Live Preview During Packing
**Status:** 💡 Idea
**Complexity:** Medium
**Impact:** Medium

Update canvas in real-time as shapes are placed, not just per-cluster.

**Benefits:**
- More engaging user experience
- See progress visually
- Catch issues early (stop if it looks bad)

**Implementation:**
- Add `drawShapes()` calls during packing (not just after)
- Throttle updates (every 50 shapes or 500ms)
- Add "Cancel" button to stop mid-processing

**Considerations:**
- May slow down processing (rendering overhead)
- Need to balance update frequency vs performance

---

## 🔧 Quality of Life Improvements

### 7. Preset Configurations
**Status:** 💡 Idea
**Complexity:** Low
**Impact:** Medium

Add one-click preset buttons for common use cases.

**Presets:**
- 🎨 Maximum Quality (k=15, weighted, 15k attempts)
- ⚖️ Balanced (k=30, fairshare, 15k attempts)
- 🔬 Maximum Detail (k=80, fixed+bonus, 25k attempts)
- ⚡ Fast Preview (k=10, fairshare, 8k attempts)
- 🏞️ Landscape (k=20, proportional, 15k attempts)
- 👤 Portrait (k=40, fixed+bonus, 20k attempts)

**Implementation:**
- Add preset buttons to UI
- Define preset objects with all settings
- Apply on click
- Could replace current manual presets in README

---

### 8. Comparison Mode
**Status:** 💡 Idea
**Complexity:** Medium
**Impact:** Medium

Generate multiple versions side-by-side with different settings.

**Features:**
- Split-screen preview (2-4 versions)
- Same image, different budgeting schemes
- Coverage comparison stats
- Save all versions

**Use Cases:**
- A/B testing different approaches
- Finding optimal settings
- Showcasing different styles

---

### 9. Undo/Redo System
**Status:** 💡 Idea
**Complexity:** Medium
**Impact:** Low

Allow undoing image generation to previous state.

**Features:**
- Undo last generation
- Keep history of last 5 generations
- Restore settings from history

**Implementation:**
- Store canvas state + settings in history array
- Undo button restores previous state
- Limited to 5 entries to save memory

---

### 10. URL Parameter Settings
**Status:** 💡 Idea
**Complexity:** Low
**Impact:** Low-Medium

Load settings from URL query parameters for sharing.

**Example:**
```
index.html?k=30&spatial=0.3&budget=adaptive&attempts=15000
```

**Benefits:**
- Share exact settings via link
- Reproducible results (with same image)
- Easier testing/debugging

**Implementation:**
- Parse URLSearchParams on load
- Apply to state
- Optionally generate shareable link button

---

## 🎯 Advanced Features

### 11. Spatial Hashing for Collision Detection
**Status:** 💡 Idea
**Complexity:** High
**Impact:** High (Performance)

Replace linear collision detection with spatial hash grid.

**Current:** O(n) collision check against all shapes
**With Spatial Hash:** O(1) average case, only check nearby shapes

**Benefits:**
- 5-10x faster packing for large shape counts
- Enables much higher shape counts
- Smoother real-time preview

**Implementation:**
- Create spatial hash grid in `packing.js`
- Hash shapes by bounding box
- Only check shapes in same/adjacent cells
- Update hash as shapes are added

**Complexity:**
- Significant refactor of collision detection
- Edge cases with shapes spanning multiple cells

---

### 12. Voronoi-Based Clustering
**Status:** 💡 Idea
**Complexity:** High
**Impact:** Medium

Alternative to k-means using Voronoi diagrams.

**Benefits:**
- More organic region boundaries
- Better for organic/natural images
- Interesting aesthetic (visible cell structure)

**Implementation:**
- Use Delaunay triangulation library
- Generate Voronoi cells from seed points
- Assign pixels to nearest cell
- Could make cells visible or invisible

---

### 13. Custom Region Masking
**Status:** 💡 Idea
**Complexity:** Medium-High
**Impact:** Medium

Allow user to draw/upload regions to pack instead of using clustering.

**Features:**
- Upload mask image (black/white regions)
- OR draw regions directly on canvas
- Pack only within masked areas
- Multiple independent masks

**Use Cases:**
- Pack specific areas (e.g., just the subject, not background)
- Create custom compositions
- Text-based packing (pack within letters)

---

### 14. Animation Export
**Status:** 💡 Idea
**Complexity:** High
**Impact:** High (Wow Factor)

Export the packing process as animated GIF or MP4.

**Features:**
- Capture frames during packing
- Show shapes appearing one-by-one
- Adjustable speed
- GIF or MP4 output

**Use Cases:**
- Social media content (satisfying to watch!)
- Process visualization
- Time-lapse art

**Implementation:**
- Capture canvas state every N shapes
- Use library like gif.js or MediaRecorder API
- Add export options (duration, fps, format)

**Considerations:**
- Memory intensive (many frames)
- Processing time significantly increased
- Large file sizes

---

### 15. Texture/Gradient Fills
**Status:** 💡 Idea
**Complexity:** Medium
**Impact:** Medium

Instead of solid colors, fill shapes with textures or gradients.

**Options:**
- **Gradients:** Radial gradient from shape center
- **Patterns:** Hatching, dots, noise
- **Image sampling:** Sample original image pixels within shape
- **Perlin noise:** Organic texture variation

**Benefits:**
- More visual interest
- Can incorporate original image detail
- Unique aesthetic styles

**Implementation:**
- Add fill mode option: 'solid' | 'gradient' | 'pattern' | 'sampled'
- Modify drawShapes() to apply fills
- For sampled mode, read from original image

---

### 16. Machine Learning-Based Packing
**Status:** 💡 Idea
**Complexity:** Very High
**Impact:** Very High (Research)

Train ML model to predict optimal placement positions.

**Approach:**
- Reinforcement learning agent
- State: current packing state
- Action: place shape at (x, y, r)
- Reward: coverage increase

**Benefits:**
- Potentially much better coverage (70-80%+?)
- Learn from successful packings
- Optimize for specific aesthetics

**Challenges:**
- Requires significant ML expertise
- Training time/data requirements
- May not be worth complexity vs current heuristics

**Status:** Research project, not near-term feature

---

## 🐛 Bug Fixes & Polish

### 17. Better Error Handling
**Status:** 💡 Idea
**Complexity:** Low
**Impact:** Low

More graceful handling of edge cases.

**Improvements:**
- Validate settings before processing
- Catch and display errors clearly
- Prevent invalid parameter combinations
- Helpful error messages

---

### 18. Responsive Mobile Layout
**Status:** 💡 Idea
**Complexity:** Medium
**Impact:** Medium

Optimize UI for mobile/tablet screens.

**Changes:**
- Collapsible settings panels
- Touch-friendly controls
- Responsive canvas sizing
- Mobile-friendly file picker

---

### 19. Accessibility Improvements
**Status:** 💡 Idea
**Complexity:** Low-Medium
**Impact:** Low-Medium

Make the tool more accessible.

**Features:**
- Keyboard navigation
- ARIA labels for screen readers
- High contrast mode option
- Focus indicators
- Alt text for images

---

## 📊 Analytics & Insights

### 20. Detailed Statistics Display
**Status:** 💡 Idea
**Complexity:** Low
**Impact:** Low-Medium

Show more detailed statistics in the UI (not just console).

**Metrics:**
- Total shapes placed
- Coverage percentage per cluster
- Attempts efficiency (% used productively)
- Processing time breakdown
- Shape type distribution (if mixed shapes enabled)
- Largest/smallest shape sizes

**Implementation:**
- Collect stats during processing
- Display in expandable panel after completion
- Option to export stats as JSON/CSV

---

### 21. Coverage Heatmap Overlay
**Status:** 💡 Idea
**Complexity:** Medium
**Impact:** Medium

Visualize which regions packed well vs poorly.

**Features:**
- Color overlay showing coverage density
- Red = low coverage, Green = high coverage
- Toggle on/off
- Helps identify problem areas

**Use Cases:**
- Debugging poor packing
- Optimizing settings
- Understanding algorithm behavior

---

## 🎨 Aesthetic Variations

### 22. Outline/Stroke Mode
**Status:** 💡 Idea
**Complexity:** Low
**Impact:** Medium

Render only shape outlines, not fills.

**Options:**
- Stroke only (transparent fill)
- Stroke + fill
- Variable stroke width
- Stroke color (same as fill, black, white, custom)

**Aesthetic:**
- Line art style
- More delicate/intricate look
- Better for printing/plotting

---

### 23. Shadow/3D Effects
**Status:** 💡 Idea
**Complexity:** Low-Medium
**Impact:** Low

Add depth with shadows or gradients.

**Options:**
- Drop shadows
- Inner shadows
- 3D sphere shading (for circles)
- Radial gradients for depth

---

### 24. Border/Frame Options
**Status:** 💡 Idea
**Complexity:** Low
**Impact:** Low

Add decorative borders around the final image.

**Options:**
- Solid color border
- Pattern border
- Fade to white/black at edges
- Vignette effect

---

## 🔬 Experimental Ideas

### 25. Physics-Based Packing
**Status:** 💡 Idea
**Complexity:** Very High
**Impact:** Medium

Use physics simulation instead of random placement.

**Approach:**
- "Drop" circles into region from top
- Use physics engine (Matter.js, Box2D)
- Shapes settle naturally via gravity
- More organic, natural appearance

**Challenges:**
- Much slower than current approach
- May not achieve better coverage
- Determinism issues (need same results on replay)

---

### 26. Recursive Subdivision
**Status:** 💡 Idea
**Complexity:** High
**Impact:** Medium

Alternative approach: recursively subdivide regions.

**Algorithm:**
1. Start with entire region
2. Place largest possible shape
3. Subdivide remaining space
4. Recurse on subdivisions
5. Continue until min size reached

**Benefits:**
- Potentially more organized appearance
- Tree-like packing structure
- Interesting aesthetic

---

### 27. Custom Shape Upload
**Status:** 💡 Idea
**Complexity:** High
**Impact:** Low-Medium

Allow users to upload custom SVG shapes to pack.

**Features:**
- Upload SVG file
- Parse path data
- Scale and pack custom shapes
- Rotation support

**Use Cases:**
- Logos, icons, symbols
- Custom motifs (stars, hearts, etc.)
- Typography

---

## 🗳️ Feature Voting

Want to see a feature implemented? Here's how to prioritize:

### Vote by commenting on GitHub Issues
1. Create issue for feature (if not exists)
2. Add 👍 reaction to vote
3. Comment with use case/rationale

### Priority Formula
```
Priority = (Votes × 3) + (Impact × 2) - Complexity
```

**Impact:** Low=1, Medium=2, High=3, Very High=4
**Complexity:** Low=1, Medium=2, High=3, Very High=4

---

## 🛠️ Contributing

Want to implement a feature?

1. **Check this roadmap** - Is it already listed?
2. **Open an issue** - Discuss approach before coding
3. **Start small** - QoL improvements are easier starting points
4. **Test thoroughly** - Try multiple images and settings
5. **Update docs** - Document new features in README.md

---

## 📝 Notes

### Feature Status Legend
- 💡 **Idea** - Concept stage, not started
- 🚧 **In Progress** - Currently being developed
- ✅ **Complete** - Implemented and merged
- ❌ **Rejected** - Decided not to pursue
- 🔬 **Research** - Experimental, feasibility unknown

### Complexity Estimates
- **Low:** 1-4 hours
- **Medium:** 1-3 days
- **High:** 1-2 weeks
- **Very High:** 2+ weeks

### Impact Estimates
- **Low:** Nice to have, minor improvement
- **Medium:** Notable improvement or new capability
- **High:** Major enhancement, game-changer
- **Very High:** Fundamental transformation

---

## 🎯 Recommended Next Steps

If starting development, recommended order:

1. **Per-Island Adaptive Thresholds** (#1) - Natural evolution of adaptive budgeting
2. **Preset Configurations** (#7) - Easy win, big UX improvement
3. **SVG Export** (#5) - High impact, enables new use cases
4. **Live Preview** (#6) - Better UX, moderate complexity
5. **Hexagonal Shapes** (#2) - Unique feature, manageable scope

---

**Last Updated:** 2024-10-20
**Version:** v14
**Maintainer:** Circle Packing Project
