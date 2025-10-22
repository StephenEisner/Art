# Plant Mathematics Visualization System - Technical Specification

## Version 1.0 - Initial Specification

## 1. System Overview

### 1.1 Purpose
Create an interactive web-based platform that visualizes the mathematical principles underlying plant growth and structure, combining educational value with generative art aesthetics.

### 1.2 Target Audience
- Students and educators exploring mathematical biology
- Artists interested in generative and algorithmic art
- Botanists and researchers visualizing growth models
- General public interested in nature and mathematics

### 1.3 Core Requirements
- Real-time rendering of plant structures
- Interactive parameter manipulation
- Mathematical equation display with visual correlation
- Export capabilities for sharing and further use
- Responsive design for various screen sizes
- No backend required (purely client-side)

---

## 2. Technical Stack

### 2.1 Primary Technologies

**Rendering Engine**: p5.js (v1.7+)
- Reasons: Accessible API, excellent for generative art, good performance, 2D/3D support
- Alternative: Three.js for enhanced 3D tree rendering

**Math Display**: KaTeX (v0.16+)
- Reasons: Fast, no dependencies, excellent rendering quality
- Alternative: MathJax if more complex equation interaction needed

**UI Controls**: dat.GUI (v0.7+) or custom controls
- Reasons: Quick prototyping, familiar to generative art community
- Alternative: Custom UI for more artistic/integrated design

**Build Tools** (optional): 
- Vite for development server and bundling
- Can also run as pure HTML/JS for maximum accessibility

### 2.2 Language & Code Style

**Primary Language**: JavaScript (ES6+)
- Use modern JS features (arrow functions, destructuring, modules)
- Functional programming where appropriate
- Clear variable naming prioritizing readability

**Code Organization**: ES6 Modules
```javascript
// Export pattern
export class TreeGenerator { }
export function goldenAngle() { }

// Import pattern
import { TreeGenerator } from './systems/trees/generator.js';
```

### 2.3 Browser Support
- Modern browsers with ES6 support (Chrome 51+, Firefox 54+, Safari 10+, Edge 15+)
- WebGL support for 3D rendering
- No IE11 support required

---

## 3. System Architecture

### 3.1 Core Modules

#### 3.1.1 Plant Generation System
```
PlantSystem (abstract base)
├── TreeSystem
│   ├── SpeciesDefinition (config-based)
│   ├── LSystemGenerator
│   ├── BranchingEngine
│   └── FoliageRenderer
├── FlowerSystem
│   ├── FibonacciSpiral
│   ├── PetalArrangement
│   └── PhyllotaxisPattern
└── AbstractSystem
    ├── ParametricCurves
    └── FractalGenerator
```

#### 3.1.2 Mathematical Foundation
```
MathCore
├── Phyllotaxis
│   ├── goldenAngle()
│   ├── spiralPattern()
│   └── divergenceAngle()
├── GrowthCurves
│   ├── logistic()
│   ├── exponential()
│   └── allometric()
└── Geometry
    ├── rotation3D()
    ├── bezierCurve()
    └── noiseField()
```

#### 3.1.3 Rendering Pipeline
```
Renderer (abstract)
├── P5Renderer
│   ├── 2D mode (default)
│   └── WEBGL mode (3D trees)
├── SVGExporter
└── PNGExporter
```

#### 3.1.4 User Interface
```
UIController
├── ParameterPanel
│   ├── Species/Pattern selector
│   ├── Numeric sliders
│   ├── Vector inputs (wind, light)
│   └── Random seed input
├── EquationDisplay
│   ├── KaTeX renderer
│   └── Parameter highlighting
└── InfoPanel
    ├── Species information
    └── Mathematical explanation
```

### 3.2 Data Flow

```
User Input → UIController → ParameterState → Generator → Renderer → Canvas
                ↓                                          ↓
          EquationDisplay                            ScreenOutput
```

### 3.3 State Management

**Single Source of Truth**: Central state object
```javascript
const AppState = {
  currentSystem: 'tree', // 'tree', 'flower', 'abstract'
  generator: {
    type: 'oak',
    seed: 12345,
    parameters: { /* species-specific */ }
  },
  environment: {
    wind: { direction: 0, strength: 0 },
    light: { x: 0, y: 1, z: 0 }
  },
  display: {
    showEquations: true,
    showInfo: true,
    animate: false
  },
  rendering: {
    mode: 'p5-2d', // 'p5-2d', 'p5-3d', 'three'
    lod: 'high'
  }
};
```

**State Updates**: Immutable update pattern
```javascript
function updateState(updates) {
  AppState = { ...AppState, ...updates };
  regenerate();
  render();
}
```

---

## 4. Tree Generation Specification

### 4.1 Species Implementation

Each species defined as configuration object:

```javascript
const OakConfig = {
  id: 'oak',
  name: 'Oak Tree',
  family: 'Fagaceae',
  
  structure: {
    trunkTaper: 0.98,
    branchPattern: 'ALTERNATE',
    phyllotaxisAngle: 137.5,
    branchAngleVariation: [45, 80]
  },
  
  branching: {
    baseProbability: 0.7,
    reductionFactor: 0.8,
    thicknessRatio: 0.65,
    lengthRatio: 0.75,
    maxDepth: 6
  },
  
  lsystem: {
    axiom: 'F',
    rules: {
      'F': 'F[+F][-F][>F][<F]F'
    },
    angle: 30,
    angleVariation: 10,
    iterations: 5
  },
  
  dimensions: {
    heightRange: [15, 25],
    baseRadiusRatio: 0.08 // relative to height
  },
  
  age: {
    young: { branchAngle: 35, iterations: 3 },
    mature: { branchAngle: 60, iterations: 5 },
    old: { branchAngle: 70, iterations: 4, deadBranchProb: 0.2 }
  },
  
  foliage: {
    type: 'cluster',
    density: 'dense',
    leafSize: 0.1,
    color: { r: 60, g: 120, b: 40 }
  },
  
  visual: {
    barkTexture: 'deeply-furrowed',
    barkColor: { r: 80, g: 60, b: 50 }
  }
};
```

### 4.2 L-System Implementation

**Core L-System Engine**:
```javascript
class LSystem {
  constructor(config) {
    this.axiom = config.axiom;
    this.rules = config.rules;
    this.angle = config.angle;
    this.angleVariation = config.angleVariation;
  }
  
  generate(iterations) {
    let current = this.axiom;
    for (let i = 0; i < iterations; i++) {
      current = this.applyRules(current);
    }
    return current;
  }
  
  applyRules(string) {
    return string.split('').map(char => {
      return this.rules[char] || char;
    }).join('');
  }
  
  interpret(string, initialState) {
    const turtle = new Turtle(initialState);
    const stack = [];
    
    for (let char of string) {
      switch(char) {
        case 'F': // Draw forward
          turtle.forward(1);
          break;
        case '+': // Turn left
          turtle.rotate(this.angle + randomVariation());
          break;
        case '-': // Turn right
          turtle.rotate(-(this.angle + randomVariation()));
          break;
        case '[': // Save state
          stack.push(turtle.getState());
          break;
        case ']': // Restore state
          turtle.setState(stack.pop());
          break;
        // Additional symbols as needed
      }
    }
    
    return turtle.getGeometry();
  }
}
```

### 4.3 Branching Pattern Algorithms

**Alternate (Spiral) Pattern**:
```javascript
function generateAlternateBranches(trunk, config) {
  const branches = [];
  let angle = 0;
  let height = 0;
  
  while (height < trunk.length) {
    if (shouldBranch(height, config)) {
      branches.push({
        position: height,
        azimuth: angle % 360,
        elevation: randomInRange(config.branchAngleVariation),
        thickness: trunk.thickness * config.thicknessRatio,
        length: trunk.length * config.lengthRatio
      });
      
      angle += config.phyllotaxisAngle;
      angle += randomGaussian(0, 10); // Natural variation
    }
    
    height += config.branchSpacing;
  }
  
  return branches;
}
```

**Opposite Pattern**:
```javascript
function generateOppositeBranches(trunk, config) {
  const branches = [];
  let rotation = 0;
  let height = 0;
  
  while (height < trunk.length) {
    if (shouldBranch(height, config)) {
      // Create pair
      for (let offset of [0, 180]) {
        branches.push({
          position: height,
          azimuth: (rotation + offset) % 360,
          elevation: randomInRange(config.branchAngleVariation),
          thickness: trunk.thickness * config.thicknessRatio,
          length: trunk.length * config.lengthRatio
        });
      }
      
      rotation += 90; // Decussate pattern
    }
    
    height += config.nodeSpacing;
  }
  
  return branches;
}
```

**Whorled Pattern**:
```javascript
function generateWhorledBranches(trunk, config) {
  const branches = [];
  let height = 0;
  
  while (height < trunk.length) {
    if (shouldBranch(height, config)) {
      const branchCount = randomInt(
        config.minWhorlBranches,
        config.maxWhorlBranches
      );
      const angleStep = 360 / branchCount;
      
      for (let i = 0; i < branchCount; i++) {
        branches.push({
          position: height,
          azimuth: (i * angleStep + randomGaussian(0, 5)) % 360,
          elevation: randomInRange(config.branchAngleVariation),
          thickness: trunk.thickness * config.thicknessRatio,
          length: trunk.length * config.lengthRatio
        });
      }
    }
    
    height += config.whorlSpacing;
  }
  
  return branches;
}
```

---

## 5. Flower & Pattern Generation

### 5.1 Fibonacci Spiral

**Mathematical Foundation**:
```
Polar coordinates:
r(n) = c * √n
θ(n) = n * φ

where φ = 137.5° (golden angle)
```

**Implementation**:
```javascript
class FibonacciSpiral {
  constructor(config) {
    this.elementCount = config.elements || 500;
    this.scale = config.scale || 5;
    this.goldenAngle = 137.5;
    this.growthRate = config.growthRate || 1.0;
  }
  
  generate() {
    const elements = [];
    
    for (let n = 0; n < this.elementCount; n++) {
      const r = this.scale * Math.sqrt(n) * this.growthRate;
      const theta = n * this.goldenAngle * (Math.PI / 180);
      
      elements.push({
        x: r * Math.cos(theta),
        y: r * Math.sin(theta),
        size: this.getElementSize(n),
        angle: theta
      });
    }
    
    return elements;
  }
  
  getElementSize(n) {
    // Size decreases slightly toward center
    return 0.5 + 0.5 * Math.sqrt(n / this.elementCount);
  }
}
```

### 5.2 Petal Arrangements

**Rose Pattern** (regular angular spacing):
```javascript
class RosePetals {
  constructor(petalCount, size) {
    this.count = petalCount;
    this.size = size;
  }
  
  generate() {
    const petals = [];
    const angleStep = (2 * Math.PI) / this.count;
    
    for (let i = 0; i < this.count; i++) {
      const angle = i * angleStep;
      petals.push({
        angle: angle,
        x: Math.cos(angle) * this.size,
        y: Math.sin(angle) * this.size,
        rotation: angle,
        shape: this.getPetalShape()
      });
    }
    
    return petals;
  }
  
  getPetalShape() {
    // Bezier control points for petal shape
    return {
      type: 'bezier',
      points: [
        [0, 0],
        [0.3, 0.5],
        [0.5, 1.0],
        [0.7, 0.5],
        [1.0, 0]
      ]
    };
  }
}
```

### 5.3 Phyllotaxis Variations

**General Phyllotaxis Pattern**:
```javascript
class PhyllotaxisPattern {
  constructor(config) {
    this.divergenceAngle = config.angle || 137.5;
    this.scaleFactor = config.scale || 1.0;
    this.elementCount = config.elements || 200;
  }
  
  generate() {
    const elements = [];
    
    for (let n = 0; n < this.elementCount; n++) {
      const angle = n * this.divergenceAngle * (Math.PI / 180);
      const radius = this.scaleFactor * Math.sqrt(n);
      
      elements.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        index: n,
        angle: angle
      });
    }
    
    return elements;
  }
  
  // Test different angles to see pattern changes
  setDivergenceAngle(angle) {
    this.divergenceAngle = angle;
  }
}
```

---

## 6. Mathematical Display System

### 6.1 Equation Rendering

**KaTeX Integration**:
```javascript
class EquationDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }
  
  displayEquation(latexString, parameters) {
    // Substitute parameters into equation
    const substituted = this.substituteParameters(latexString, parameters);
    
    // Render with KaTeX
    katex.render(substituted, this.container, {
      displayMode: true,
      throwOnError: false
    });
  }
  
  substituteParameters(latex, params) {
    // Replace parameter placeholders with actual values
    return latex.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }
}
```

**Equation Library**:
```javascript
const Equations = {
  goldenAngle: {
    latex: '\\phi = 137.5^\\circ = 360^\\circ(2 - \\varphi)',
    description: 'Golden angle derived from golden ratio',
    parameters: []
  },
  
  fibonacciSpiral: {
    latex: 'r(n) = c\\sqrt{n}, \\quad \\theta(n) = n \\cdot \\phi',
    description: 'Fibonacci spiral in polar coordinates',
    parameters: ['c', 'phi']
  },
  
  branchThickness: {
    latex: 'd_{child} = d_{parent} \\cdot r^n',
    description: "Murray's law for branch diameter",
    parameters: ['r', 'n']
  },
  
  phyllotaxis: {
    latex: '\\theta_n = n \\cdot \\alpha, \\quad r_n = k\\sqrt{n}',
    description: 'General phyllotaxis pattern',
    parameters: ['alpha', 'k']
  }
};
```

### 6.2 Interactive Parameter Highlighting

When user adjusts a parameter, highlight its occurrence in equations:
```javascript
function highlightParameter(paramName) {
  // Add CSS class to parameter in equation
  const equation = document.querySelector('.equation');
  const paramSpans = equation.querySelectorAll(`[data-param="${paramName}"]`);
  
  paramSpans.forEach(span => {
    span.classList.add('highlighted');
  });
  
  // Remove highlight after 2 seconds
  setTimeout(() => {
    paramSpans.forEach(span => {
      span.classList.remove('highlighted');
    });
  }, 2000);
}
```

---

## 7. Rendering Implementation

### 7.1 P5.js Rendering

**2D Tree Rendering**:
```javascript
class P5TreeRenderer {
  constructor(p5Instance, tree) {
    this.p5 = p5Instance;
    this.tree = tree;
  }
  
  render() {
    this.p5.push();
    this.p5.translate(this.p5.width / 2, this.p5.height);
    this.p5.scale(1, -1); // Flip Y-axis
    
    this.renderBranch(this.tree.trunk, 0);
    
    this.p5.pop();
  }
  
  renderBranch(branch, depth) {
    this.p5.push();
    
    // Set stroke weight based on thickness
    this.p5.strokeWeight(branch.thickness);
    this.p5.stroke(this.getBarkColor(depth));
    
    // Draw branch
    this.p5.line(0, 0, 0, branch.length);
    
    // Translate to end of branch
    this.p5.translate(0, branch.length);
    
    // Draw children
    for (let child of branch.children) {
      this.p5.push();
      this.p5.rotate(child.angle);
      this.renderBranch(child, depth + 1);
      this.p5.pop();
    }
    
    // Draw foliage if terminal branch
    if (branch.children.length === 0) {
      this.renderFoliage(branch);
    }
    
    this.p5.pop();
  }
  
  renderFoliage(branch) {
    this.p5.noStroke();
    this.p5.fill(60, 120, 40, 200);
    this.p5.ellipse(0, 0, branch.thickness * 3);
  }
  
  getBarkColor(depth) {
    // Gradient from dark to light with depth
    const base = 60;
    const lightness = base + depth * 5;
    return this.p5.color(lightness, lightness * 0.8, lightness * 0.6);
  }
}
```

**3D Tree Rendering with p5.js WEBGL**:
```javascript
class P5Tree3DRenderer {
  constructor(p5Instance, tree) {
    this.p5 = p5Instance;
    this.tree = tree;
  }
  
  render() {
    this.p5.push();
    this.p5.translate(0, this.p5.height / 4, 0);
    this.p5.rotateX(Math.PI);
    
    this.renderBranch3D(this.tree.trunk, 0);
    
    this.p5.pop();
  }
  
  renderBranch3D(branch, depth) {
    this.p5.push();
    
    // Set material
    this.p5.fill(80, 60, 50);
    this.p5.noStroke();
    
    // Draw cylinder for branch
    this.p5.translate(0, branch.length / 2, 0);
    this.p5.cylinder(branch.thickness, branch.length);
    this.p5.translate(0, branch.length / 2, 0);
    
    // Recurse for children
    for (let child of branch.children) {
      this.p5.push();
      
      // Rotate to child angle (azimuth and elevation)
      this.p5.rotateY(child.azimuth * Math.PI / 180);
      this.p5.rotateZ(child.elevation * Math.PI / 180);
      
      this.renderBranch3D(child, depth + 1);
      this.p5.pop();
    }
    
    this.p5.pop();
  }
}
```

### 7.2 SVG Export

```javascript
class SVGExporter {
  constructor() {
    this.svg = '';
    this.width = 800;
    this.height = 600;
  }
  
  export(tree) {
    this.svg = `<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">`;
    this.svg += `<g transform="translate(${this.width/2}, ${this.height})">`;
    
    this.exportBranch(tree.trunk, 0, 0, 0);
    
    this.svg += '</g></svg>';
    
    return this.svg;
  }
  
  exportBranch(branch, x, y, angle) {
    const endX = x + Math.sin(angle) * branch.length;
    const endY = y - Math.cos(angle) * branch.length;
    
    this.svg += `<line x1="${x}" y1="${y}" x2="${endX}" y2="${endY}" `;
    this.svg += `stroke="rgb(80,60,50)" stroke-width="${branch.thickness}" />`;
    
    for (let child of branch.children) {
      this.exportBranch(child, endX, endY, angle + child.angle);
    }
  }
  
  download(filename) {
    const blob = new Blob([this.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
}
```

---

## 8. User Interface Specification

### 8.1 Layout Structure

```
┌─────────────────────────────────────────┐
│ Header: Plant Mathematics Visualizer    │
├──────────┬──────────────────────────────┤
│          │                              │
│ Controls │     Main Canvas              │
│ Panel    │                              │
│          │                              │
│ - System │                              │
│ - Species│                              │
│ - Params │                              │
│ - Export │                              │
│          │                              │
├──────────┴──────────────────────────────┤
│ Equation Display & Info Panel           │
└─────────────────────────────────────────┘
```

### 8.2 Control Panel Elements

**System Selector**:
```javascript
const systemControl = gui.add(params, 'system', [
  'Tree',
  'Flower - Fibonacci',
  'Flower - Petals',
  'Phyllotaxis',
  'Abstract - Parametric',
  'Abstract - Fractal'
]);
```

**Tree-Specific Controls**:
```javascript
const treeFolder = gui.addFolder('Tree');
treeFolder.add(params.tree, 'species', [
  'Oak', 'Pine', 'Willow', 'Birch', 'Maple', 
  'Palm', 'Cherry', 'Ginkgo', 'Baobab', 
  'Redwood', 'Cypress', 'Mangrove'
]);
treeFolder.add(params.tree, 'age', 1, 100);
treeFolder.add(params.tree, 'height', 5, 50);
treeFolder.add(params.tree, 'seed', 0, 999999);

const environmentFolder = treeFolder.addFolder('Environment');
environmentFolder.add(params.environment.wind, 'direction', 0, 360);
environmentFolder.add(params.environment.wind, 'strength', 0, 1);
environmentFolder.add(params.environment.light, 'y', -1, 1);
```

**Flower Controls**:
```javascript
const flowerFolder = gui.addFolder('Flower');
flowerFolder.add(params.flower, 'type', ['Fibonacci', 'Rose', 'Custom']);
flowerFolder.add(params.flower, 'elements', 50, 2000);
flowerFolder.add(params.flower, 'goldenAngle', 120, 160);
flowerFolder.add(params.flower, 'scale', 0.1, 20);
```

**Display Options**:
```javascript
const displayFolder = gui.addFolder('Display');
displayFolder.add(params.display, 'showEquations');
displayFolder.add(params.display, 'showInfo');
displayFolder.add(params.display, 'animate');
displayFolder.add(params.display, 'renderMode', ['2D', '3D', 'Minimal']);
```

**Export Controls**:
```javascript
const exportFolder = gui.addFolder('Export');
exportFolder.add(actions, 'exportSVG');
exportFolder.add(actions, 'exportPNG');
exportFolder.add(actions, 'exportParams');
exportFolder.add(actions, 'copyShareLink');
```

### 8.3 Equation Display Panel

```html
<div id="equation-panel">
  <h3>Mathematical Foundation</h3>
  <div id="primary-equation" class="equation-display">
    <!-- KaTeX rendered equation -->
  </div>
  <p class="equation-description">
    <!-- Plain English explanation -->
  </p>
  <div id="secondary-equations" class="equation-list">
    <!-- Related equations -->
  </div>
</div>
```

### 8.4 Info Panel

```html
<div id="info-panel">
  <h3 id="species-name">Oak Tree</h3>
  <p id="species-scientific"><em>Quercus</em> spp.</p>
  <div id="species-info">
    <p><strong>Branching Pattern:</strong> Alternate (Spiral)</p>
    <p><strong>Phyllotaxis Angle:</strong> 137.5° (Golden Angle)</p>
    <p><strong>Typical Height:</strong> 15-25 meters</p>
    <p><strong>Key Feature:</strong> Wide-spreading crown with horizontal branches</p>
  </div>
  <div id="botanical-notes">
    <!-- Additional educational content -->
  </div>
</div>
```

---

## 9. Performance Optimization

### 9.1 Level of Detail (LOD)

```javascript
class LODManager {
  constructor() {
    this.lodLevels = {
      high: { maxDepth: 8, foliageDetail: 'full' },
      medium: { maxDepth: 6, foliageDetail: 'simplified' },
      low: { maxDepth: 4, foliageDetail: 'minimal' }
    };
  }
  
  determineLOD(tree, viewDistance) {
    if (viewDistance < 100) return 'high';
    if (viewDistance < 300) return 'medium';
    return 'low';
  }
  
  applyLOD(tree, level) {
    const config = this.lodLevels[level];
    tree.maxDepth = config.maxDepth;
    tree.foliageDetail = config.foliageDetail;
  }
}
```

### 9.2 Instancing for Foliage

```javascript
// Instead of drawing each leaf individually
// Use instanced drawing for repeated elements
class InstancedFoliage {
  constructor(p5Instance) {
    this.p5 = p5Instance;
    this.leafGeometry = this.createLeafGeometry();
    this.positions = [];
  }
  
  addLeaf(x, y, z, rotation) {
    this.positions.push({ x, y, z, rotation });
  }
  
  renderAll() {
    for (let pos of this.positions) {
      this.p5.push();
      this.p5.translate(pos.x, pos.y, pos.z);
      this.p5.rotate(pos.rotation);
      // Draw leaf geometry once
      this.p5.model(this.leafGeometry);
      this.p5.pop();
    }
  }
}
```

### 9.3 Progressive Generation

```javascript
class ProgressiveGenerator {
  constructor(tree, maxFrames) {
    this.tree = tree;
    this.maxFrames = maxFrames;
    this.currentFrame = 0;
    this.branchQueue = [tree.trunk];
  }
  
  step() {
    if (this.currentFrame >= this.maxFrames) return true;
    
    const branchesThisFrame = Math.ceil(this.branchQueue.length / 
                                       (this.maxFrames - this.currentFrame));
    
    for (let i = 0; i < branchesThisFrame && this.branchQueue.length > 0; i++) {
      const branch = this.branchQueue.shift();
      this.generateChildren(branch);
      this.branchQueue.push(...branch.children);
    }
    
    this.currentFrame++;
    return this.branchQueue.length === 0;
  }
}
```

---

## 10. Export & Sharing

### 10.1 Parameter Serialization

```javascript
class ParameterSerializer {
  serialize(state) {
    return JSON.stringify(state, null, 2);
  }
  
  deserialize(json) {
    return JSON.parse(json);
  }
  
  toURL(state) {
    const compressed = this.compress(state);
    return `${window.location.origin}?params=${compressed}`;
  }
  
  compress(state) {
    // Base64 encode the JSON for URL
    const json = JSON.stringify(state);
    return btoa(json);
  }
  
  decompress(encoded) {
    const json = atob(encoded);
    return JSON.parse(json);
  }
}
```

### 10.2 Image Export

```javascript
class ImageExporter {
  exportPNG(canvas, filename, scale = 1) {
    // Temporarily resize canvas for high-res export
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    
    canvas.width *= scale;
    canvas.height *= scale;
    
    // Re-render at high resolution
    regenerate();
    
    // Export
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      // Restore original size
      canvas.width = originalWidth;
      canvas.height = originalHeight;
      regenerate();
    });
  }
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

**Mathematical Functions**:
```javascript
describe('PhyllotaxisCalculations', () => {
  test('golden angle is approximately 137.5', () => {
    expect(goldenAngle()).toBeCloseTo(137.5, 1);
  });
  
  test('fibonacci spiral positions are correct', () => {
    const spiral = new FibonacciSpiral({ elements: 10 });
    const positions = spiral.generate();
    expect(positions.length).toBe(10);
    expect(positions[0].r).toBeCloseTo(0);
  });
});
```

**Tree Generation**:
```javascript
describe('TreeGenerator', () => {
  test('oak tree has correct branching pattern', () => {
    const oak = new Tree('oak', { seed: 123 });
    oak.generate();
    expect(oak.branchPattern).toBe('ALTERNATE');
  });
  
  test('same seed produces identical tree', () => {
    const tree1 = new Tree('oak', { seed: 456 });
    const tree2 = new Tree('oak', { seed: 456 });
    tree1.generate();
    tree2.generate();
    expect(tree1.serialize()).toEqual(tree2.serialize());
  });
});
```

### 11.2 Visual Regression Testing

- Capture reference images for each species
- Compare generated output against references
- Flag significant visual differences
- Tools: Percy, BackstopJS, or custom solution

### 11.3 Performance Benchmarks

```javascript
const benchmarks = {
  'Oak generation (depth 6)': () => {
    const oak = new Tree('oak', { maxDepth: 6 });
    oak.generate();
  },
  'Fibonacci spiral (1000 elements)': () => {
    const spiral = new FibonacciSpiral({ elements: 1000 });
    spiral.generate();
  },
  'Full render (2D)': () => {
    render2D();
  }
};

// Run benchmarks
for (let [name, fn] of Object.entries(benchmarks)) {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}
```

---

## 12. Accessibility

### 12.1 Keyboard Navigation

- All controls accessible via keyboard
- Tab order logical and consistent
- Visual focus indicators
- Escape key to close modals/info panels

### 12.2 Screen Reader Support

```html
<div role="application" aria-label="Plant Mathematics Visualizer">
  <div role="region" aria-label="Control Panel">
    <select aria-label="Select tree species">
      <option>Oak</option>
      <!-- ... -->
    </select>
  </div>
  
  <canvas aria-label="Generated plant visualization" role="img">
    <!-- Fallback content -->
    <p id="canvas-description">
      A {{species}} tree with {{age}} years of age, 
      showing {{pattern}} branching pattern.
    </p>
  </canvas>
</div>
```

### 12.3 Alternative Text & Descriptions

- Dynamically generated alt text for canvas
- Textual description of mathematical concepts
- Audio descriptions (stretch goal)

---

## 13. Documentation Requirements

### 13.1 Code Documentation

**JSDoc comments for all public APIs**:
```javascript
/**
 * Generates a tree structure based on species configuration
 * @param {string} species - Species identifier (e.g., 'oak', 'pine')
 * @param {Object} config - Configuration options
 * @param {number} config.age - Age of tree in years (1-100)
 * @param {number} config.seed - Random seed for reproducibility
 * @param {Object} config.environment - Environmental factors
 * @returns {Tree} Generated tree structure
 * @example
 * const tree = generateTree('oak', { 
 *   age: 50, 
 *   seed: 12345,
 *   environment: { wind: { direction: 90, strength: 0.3 } }
 * });
 */
function generateTree(species, config) {
  // Implementation
}
```

### 13.2 User Documentation

- **Getting Started Guide**: Basic usage tutorial
- **Species Reference**: Detailed info on each tree species
- **Mathematical Concepts**: Explanation of underlying math
- **Parameter Guide**: What each parameter does
- **Examples Gallery**: Curated collection with descriptions

### 13.3 Mathematical Documentation

Separate document explaining:
- Phyllotaxis theory
- L-system formalism
- Branching algorithms
- Growth models
- References to scientific literature

---

## 14. Future Enhancements

### Phase 2 Features
- Additional plant species (herbs, grasses, succulents)
- Seasonal animation system
- Time-lapse growth visualization
- Multiple trees with spatial relationships

### Phase 3 Features
- VR/AR support using WebXR
- Machine learning integration for realistic variation
- Collaborative gardens (multi-user)
- Sound generation from plant structures

### Phase 4 Features
- Full ecosystem simulation
- Procedural landscape generation
- Export to 3D printing formats
- Plugin system for community extensions

---

## 15. Implementation Timeline

### Week 1-2: Foundation
- Set up project structure
- Implement core math utilities
- Build basic p5.js rendering system
- Create simple L-system generator

### Week 3-4: Tree System
- Implement branching patterns (alternate, opposite, whorled)
- Create 3-5 species configurations
- Build 2D tree renderer
- Add basic UI controls

### Week 5-6: Flower & Patterns
- Implement Fibonacci spiral
- Create phyllotaxis demonstrations
- Add petal arrangement system
- Integrate equation display

### Week 7-8: Enhancement & Polish
- Add remaining tree species
- Implement 3D rendering
- Create export functionality
- Optimize performance
- Write documentation

### Week 9-10: Testing & Launch
- User testing
- Bug fixes
- Polish UI/UX
- Deploy to hosting
- Create example gallery

---

## 16. Success Metrics

- **Performance**: 60fps rendering for standard configurations
- **Botanical Accuracy**: Verification by botanical references
- **User Engagement**: Time spent exploring, number of exports
- **Educational Value**: User comprehension of mathematical concepts
- **Artistic Quality**: Visual appeal and variety of outputs
- **Technical Quality**: Code maintainability, test coverage

---

## Appendix A: Dependencies

```json
{
  "dependencies": {
    "p5": "^1.7.0",
    "katex": "^0.16.0",
    "dat.gui": "^0.7.9"
  },
  "devDependencies": {
    "vite": "^4.0.0",
    "vitest": "^0.34.0"
  }
}
```

## Appendix B: Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| ES6 Modules | 61+ | 60+ | 11+ | 16+ |
| Canvas 2D | All | All | All | All |
| WebGL | 56+ | 51+ | 12+ | 79+ |
| Web Workers | All | All | All | All |

## Appendix C: File Size Estimates

- Core system: ~150KB (minified)
- p5.js library: ~1MB
- KaTeX: ~300KB
- Total initial load: ~1.5MB
- Optimized with code splitting: ~500KB initial

---

*End of Technical Specification v1.0*
