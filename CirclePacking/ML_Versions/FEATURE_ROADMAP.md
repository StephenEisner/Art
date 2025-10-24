# Feature Roadmap - Circle Packing v14+

This document tracks potential features, enhancements, and improvements for future versions.

---

## 🎨 Current Features (v14)

- [x] K-means color clustering with spatial weighting
- [x] Multiple shape types (circle, rectangle, triangle, **hexagon**)
- [x] Six budgeting schemes (fairshare, proportional, weighted, fixed, exponential, adaptive)
- [x] Multi-pass packing (large shapes first, then progressively smaller)
- [x] Mixed shapes mode (circles + rectangles + hexagons)
- [x] Gap filling pass
- [x] Save/load settings (JSON)
- [x] Save image (PNG)
- [x] Real-time progress tracking with attempt counters
- [x] Adaptive early exit threshold
- [x] Island-based processing (pixel-fill, micro-pack, small-pack, full-pack)
- [x] **Per-island adaptive thresholds** (scaled by island size)
- [x] **Hexagon shape support** (pointy-top, flat-top, random orientations)
- [x] **Live preview** during packing (real-time canvas updates)
- [x] **Spatial hashing** for O(1) collision detection
- [x] **Smart early exit** based on placement rate
- [x] **Collision caching** with decay mechanism

---

## 🚀 High Priority Features

### 1. ✅ Per-Island Adaptive Thresholds
**Status:** ✅ Complete (v14)
**Complexity:** Medium
**Impact:** High

Different early exit thresholds based on island size with 5 scaling tiers:
- Large islands (1000+): 1.67x threshold
- Medium-large (500-1000): 1.33x threshold
- Medium (100-500): 1.0x threshold
- Small (20-100): 0.5x threshold
- Tiny (<20): 0.33x threshold

**Result:** 47-54% faster processing with maintained coverage quality.

---

### 2. ✅ Hexagonal Shape Support
**Status:** ✅ Complete (v14)
**Complexity:** Medium
**Impact:** Medium

Full hexagon support with multiple orientation modes.

**Implemented:**
- Hexagon rendering in `drawShapes()` with rotation offset
- Proper 6-sided polygon collision detection
- Correct area calculation: `(3 * sqrt(3) / 2) * r^2`
- UI controls: Pointy-top, Flat-top, Random mix
- Integration with mixed shapes mode

---

### 3. Web Deployment
**Status:** 💡 Idea
**Complexity:** Low-Medium
**Impact:** High

Deploy as a public website for easy access without downloading files.

**Architecture:**
- Static site hosting (GitHub Pages, Netlify, Vercel, Cloudflare Pages)
- **Client-side processing only** (no server computation needed)
- All algorithms run in user's browser (privacy-friendly)
- Image processing happens locally (no upload to server)

**Benefits:**
- Easy access via URL
- No installation required
- Share with others easily
- Automatic updates
- Works offline after first load (PWA capability)

**Implementation:**
- Choose hosting platform (free tier available)
- Add basic landing page with examples
- Optional: Add custom domain
- Optional: Add analytics (privacy-respecting)
- Optional: PWA manifest for offline use

**Considerations:**
- Everything is already client-side JavaScript (perfect for static hosting!)
- No backend needed (algorithms serve themselves)
- No CORS issues (no external API calls)
- Mobile-responsive design might need improvements

---

### 4. Region Selection Tool (Windowing)
**Status:** 💡 Idea
**Complexity:** Medium
**Impact:** High

Interactive tool to select specific regions of the image to pack.

**Features:**
- Draw rectangular selection box on uploaded image
- Multiple selection windows (pack only selected areas)
- OR inverse selection (exclude selected areas from packing)
- Drag to reposition, resize handles
- Clear/reset selections
- Save selections with settings

**Use Cases:**
- Pack only the subject, ignore background
- Focus on specific image areas (face in portrait, focal point in landscape)
- Exclude areas (sky, uniform backgrounds)
- Create artistic partial-packing effects

**Implementation:**
- Add selection mode toggle
- Canvas overlay for drawing selection rectangles
- Store selection coordinates
- Modify clustering to only consider selected pixels
- OR create binary mask from selections

**UI Flow:**
1. Upload image
2. Click "Select Region" button
3. Draw rectangle(s) on image preview
4. Generate (only packs within rectangles)

**Difference from Custom Region Masking (#13):**
- This is simpler: rectangular selections only
- Masking is more advanced: arbitrary shapes, mask images
- This should be implemented first (easier, covers 80% of use cases)

---

### 5. Color Palette Export
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

### 6. Batch Processing Mode
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

### 7. SVG Export
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

### 8. ✅ Live Preview During Packing
**Status:** ✅ Complete (v14)
**Complexity:** Medium
**Impact:** Medium

Real-time canvas updates as shapes are placed.

**Implemented:**
- Throttled `drawShapes()` calls every 50 shapes during packing
- UI toggle to enable/disable live preview
- Minimal performance impact (async rendering)

**Result:** Much more engaging user experience with visual feedback during processing.

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

### 11. ✅ Spatial Hashing for Collision Detection
**Status:** ✅ Complete (v14)
**Complexity:** High
**Impact:** High (Performance)

Grid-based spatial indexing for O(1) collision detection.

**Implemented:**
- `SpatialHash` class with dynamic grid sizing
- Shapes inserted into grid cells by bounding box
- Query only checks nearby shapes (same/adjacent cells)
- Adaptive cell sizing between multi-pass iterations
- Automatic grid rebuilding when cell size changes

**Performance Gains:**
- O(n) → O(1) collision detection
- 5-10x faster for large shape counts
- Enables smooth live preview
- Combined with other optimizations: 47-54% faster overall

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

Based on current state and priorities, recommended order:

1. **✅ COMPLETED:** Per-Island Adaptive Thresholds, Hexagons, Live Preview, Spatial Hashing
2. **Region Selection Tool** (#4) - High impact, enables targeted packing
3. **Web Deployment** (#3) - Make it accessible to everyone
4. **SVG Export** (#7) - High impact, enables new use cases
5. **Color Palette Export** (#5) - Easy win, nice utility
6. **Preset Configurations** (QoL) - Easy win, big UX improvement

**Why this order?**
- Region selection enables powerful new creative workflows
- Web deployment makes the tool accessible to everyone (no download needed)
- SVG export adds professional-grade output capability
- The rest are polish and convenience features

---

**Last Updated:** 2025-01-20
**Version:** v14
**Maintainer:** Circle Packing Project
