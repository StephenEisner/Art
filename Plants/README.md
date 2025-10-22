# Plant Mathematics Visualization System

A web-based interactive visualization platform exploring the mathematical principles underlying plant growth, structure, and form. This project combines botanical accuracy with generative art to create both educational and aesthetically compelling representations of phyllotaxis, branching patterns, and organic growth algorithms.

## Project Vision

This system bridges the gap between mathematical theory and natural form by:
- **Visualizing** the equations and algorithms that govern plant structure
- **Generating** abstract and realistic representations of botanical forms
- **Teaching** the mathematical principles through interactive exploration
- **Creating** artistic interpretations that reveal hidden patterns in nature

## Core Features

### Mathematical Foundation Display
- Live equation rendering with LaTeX/MathJax
- Interactive parameter controls showing real-time equation effects
- Side-by-side comparison of formula and visual output
- Educational annotations explaining botanical significance

### Generative Plant Systems

#### Trees (12 Species)
Based on the comprehensive tree specification, including:
- Oak, Pine, Willow, Birch, Maple, Palm
- Cherry, Ginkgo, Baobab, Redwood, Cypress, Mangrove
- Realistic branching patterns (alternate, opposite, whorled)
- Age-based variations and environmental effects
- L-system implementations with species-specific rules

#### Flowers & Growth Patterns
- Fibonacci spirals in seed heads (sunflowers, pine cones)
- Petal arrangements and symmetry patterns
- Leaf phyllotaxis demonstrations
- Fractal fern generation
- Root system branching

#### Abstract Representations
- Pure mathematical visualizations
- Parametric explorations of growth equations
- Artistic interpretations emphasizing pattern and form
- Animated growth sequences
- Interactive manipulation of growth parameters

### Interactive Controls
- Species/pattern selector
- Age/growth stage slider
- Environmental factors (wind, light, damage)
- Mathematical parameter tweaking
- Animation speed and playback
- Random seed control for reproducibility
- Export capabilities (SVG, PNG, parameters as JSON)

## Technical Architecture

### Frontend Stack
```
├── p5.js          # Primary rendering engine for 2D/3D graphics
├── Three.js       # Optional 3D enhancement for realistic trees
├── MathJax/KaTeX  # Mathematical equation rendering
├── dat.GUI        # Parameter control interface
└── Vanilla JS     # Core application logic
```

### Project Structure
```
plant-math-viz/
├── src/
│   ├── systems/
│   │   ├── trees/
│   │   │   ├── species/           # Individual species implementations
│   │   │   ├── lsystem.js         # L-system generator
│   │   │   ├── branching.js       # Branching pattern algorithms
│   │   │   └── phyllotaxis.js     # Spiral arrangement math
│   │   ├── flowers/
│   │   │   ├── fibonacci.js       # Fibonacci spiral generation
│   │   │   ├── petals.js          # Petal arrangement patterns
│   │   │   └── spirals.js         # General spiral mathematics
│   │   └── abstract/
│   │       ├── parametric.js      # Parametric curve systems
│   │       └── fractals.js        # Fractal plant generation
│   ├── math/
│   │   ├── phyllotaxis.js         # Core phyllotaxis calculations
│   │   ├── golden-ratio.js        # Golden angle and ratio utilities
│   │   └── growth-functions.js    # Growth curve mathematics
│   ├── rendering/
│   │   ├── p5-renderer.js         # p5.js rendering system
│   │   ├── 3d-renderer.js         # Three.js 3D rendering
│   │   └── svg-exporter.js        # SVG export functionality
│   ├── ui/
│   │   ├── controls.js            # UI control system
│   │   ├── equation-display.js    # Math equation rendering
│   │   └── info-panel.js          # Educational information display
│   └── utils/
│       ├── noise.js               # Perlin/Simplex noise
│       └── random.js              # Seeded random generation
├── examples/
│   ├── tree-gallery.html          # Showcase of all tree species
│   ├── fibonacci-explorer.html    # Interactive Fibonacci patterns
│   ├── phyllotaxis-demo.html      # Phyllotaxis variations
│   └── abstract-garden.html       # Artistic interpretations
├── data/
│   ├── species-config.json        # Tree species parameters
│   └── equation-library.json      # Mathematical formulas
├── docs/
│   ├── SPEC.md                    # Technical specification
│   ├── MATH.md                    # Mathematical documentation
│   └── API.md                     # Developer API reference
├── index.html                     # Main entry point
└── README.md                      # This file
```

## Mathematical Concepts Explored

### Phyllotaxis (Leaf Arrangement)
- **Golden Angle**: 137.5° - optimal divergence angle
- **Fibonacci Spirals**: Spiral counts in seed heads
- **Alternate Patterns**: Spiral arrangements (oak, birch)
- **Opposite Patterns**: Paired leaves (maple)
- **Whorled Patterns**: Rings of leaves/branches (pine)

### Branching Mathematics
- **L-Systems**: Formal grammars for recursive growth
- **Fractal Dimension**: Self-similarity in branch structures
- **Murray's Law**: Optimal branch diameter ratios
- **Allometric Scaling**: Size relationships in tree structure

### Growth Curves
- **Logistic Growth**: S-curve population-like growth
- **Power Laws**: Metabolic scaling relationships
- **Exponential Decay**: Branch probability by depth
- **Gravity Effects**: Tropism and branch drooping

### Parametric Equations
- **Superellipse**: Organic shape generation
- **Bézier Curves**: Smooth branch trajectories
- **Trigonometric Functions**: Periodic patterns in nature
- **Noise Functions**: Natural variation and texture

## Usage Examples

### Basic Tree Generation
```javascript
const oak = new Tree('oak', {
  age: 50,
  seed: 12345,
  height: 20,
  environment: {
    wind: { direction: 90, strength: 0.3 },
    light: { direction: [0, 1, 0] }
  }
});

oak.generate();
oak.render();
```

### Fibonacci Spiral
```javascript
const sunflower = new FibonacciSpiral({
  elements: 500,
  scale: 5,
  goldenAngle: 137.5,
  growthRate: 1.2
});

sunflower.render();
sunflower.displayEquation(); // Shows the mathematical formula
```

### Interactive Phyllotaxis
```javascript
const phyllotaxis = new PhyllotaxisDemo({
  divergenceAngle: 137.5,
  interactive: true,
  showEquations: true,
  animateGrowth: true
});

phyllotaxis.addControls(['angle', 'spacing', 'elementSize']);
```

## Development Setup

```bash
# Clone repository
git clone [repository-url]
cd plant-math-viz

# Install dependencies (if using build tools)
npm install

# Start local development server
npm start

# Or simply open index.html in a browser for basic setup
```

## Educational Goals

This project aims to make visible the hidden mathematical structures in nature:

1. **Pattern Recognition**: Help viewers see Fibonacci numbers in nature
2. **Parameter Understanding**: Show how changing one value affects the whole system
3. **Mathematical Beauty**: Demonstrate that equations can create organic beauty
4. **Botanical Accuracy**: Maintain scientific rigor while exploring abstraction
5. **Interactive Learning**: Enable hands-on exploration of complex concepts

## Artistic Direction

The visual style ranges across a spectrum:

- **Botanical Realism**: Accurate tree rendering with proper lighting and texture
- **Mathematical Clarity**: Clean diagrams emphasizing geometric relationships
- **Abstract Expression**: Stylized interpretations focusing on pattern and rhythm
- **Generative Art**: Unpredictable variations within mathematical constraints

Color palettes, line weights, and visual density are adjustable to support both scientific visualization and artistic expression.

## Performance Considerations

- **LOD System**: Reduce detail for distant or complex scenes
- **Instancing**: Efficient rendering of repeated elements (leaves, needles)
- **Progressive Generation**: Build complex structures over multiple frames
- **Canvas Optimization**: Smart redraw only when parameters change
- **WebGL Acceleration**: Use GPU for complex 3D scenes

## Export Capabilities

- **SVG**: Vector graphics for print and further editing
- **PNG**: High-resolution raster images
- **JSON**: Complete parameter sets for reproduction
- **Animation Frames**: Sequence export for video creation
- **3D Models**: OBJ/STL export for 3D printing (stretch goal)

## Future Enhancements

- **Seasonal Changes**: Animate trees through seasons
- **Growth Animation**: Time-lapse from seed to mature plant
- **Forest Generation**: Multiple trees with interaction
- **Comparative View**: Side-by-side species comparison
- **User Gallery**: Share and explore community creations
- **VR/AR Integration**: Immersive plant exploration
- **Machine Learning**: Learn from real plant photographs
- **Sound Integration**: Sonification of growth patterns

## Contributing

This is an open-source project welcoming contributions in:
- Additional plant species implementations
- Mathematical accuracy improvements
- Performance optimizations
- Educational content and documentation
- Visual design and aesthetics
- Bug fixes and code quality

## License

[To be determined - suggest MIT or similar permissive license]

## Acknowledgments

Based on botanical research, L-system theory (Aristid Lindenmayer), and the mathematical work on phyllotaxis by numerous botanists and mathematicians throughout history.

## Contact

[Your contact information / project links]

---

*"In every walk with nature, one receives far more than he seeks." - John Muir*

*"Mathematics is the language with which God has written the universe." - Galileo Galilei*
