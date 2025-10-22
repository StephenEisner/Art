# Algorithms from "The Algorithmic Beauty of Plants"
## Practical Implementation Guide

*Extracted from Prusinkiewicz & Lindenmayer (1990)*

---

## Table of Contents

1. [Core L-System Fundamentals](#core-l-system-fundamentals)
2. [Turtle Graphics System](#turtle-graphics-system)
3. [Bracketed L-Systems for Trees](#bracketed-l-systems-for-trees)
4. [Stochastic L-Systems](#stochastic-l-systems)
5. [Context-Sensitive L-Systems](#context-sensitive-l-systems)
6. [Parametric L-Systems](#parametric-l-systems)
7. [Specific Plant Examples](#specific-plant-examples)
8. [Implementation Pseudocode](#implementation-pseudocode)

---

## Core L-System Fundamentals

### Definition (DOL-System)

An L-system is an ordered triplet: **G = ⟨V, ω, P⟩**

- **V** = alphabet (set of symbols)
- **ω** = axiom (starting string)
- **P** = productions (rewriting rules)

### Production Format

```
predecessor → successor
```

**Key Rule**: In DOL-systems, ALL symbols are replaced SIMULTANEOUSLY in each derivation step.

### Classic Example: Algae Growth (Lindenmayer's Original)

```
Axiom:  a
Rules:  a → ab
        b → a

Derivation sequence:
n=0: a
n=1: ab
n=2: aba
n=3: abaab
n=4: abaababa
n=5: abaababaabaab
...
```

**Pattern**: Generates Fibonacci sequence in string lengths: 1, 2, 3, 5, 8, 13, 21...

---

## Turtle Graphics System

### 2D Turtle State

The turtle has:
- **Position**: (x, y)
- **Heading**: angle α
- **Step size**: d
- **Angle increment**: δ

### 2D Turtle Commands

| Symbol | Meaning | Action |
|--------|---------|--------|
| `F` | Move forward | Draw line, advance position |
| `f` | Move forward (no draw) | Advance position without drawing |
| `+` | Turn left | α = α + δ |
| `-` | Turn right | α = α - δ |
| `[` | Push state | Save current state on stack |
| `]` | Pop state | Restore saved state from stack |

### 2D Turtle Implementation

```javascript
class Turtle2D {
  constructor(x, y, angle, stepSize, angleIncrement) {
    this.x = x;
    this.y = y;
    this.angle = angle;  // in radians
    this.stepSize = stepSize;
    this.angleIncrement = angleIncrement;
    this.stack = [];
  }
  
  forward(draw = true) {
    const newX = this.x + this.stepSize * Math.cos(this.angle);
    const newY = this.y + this.stepSize * Math.sin(this.angle);
    
    if (draw) {
      line(this.x, this.y, newX, newY);  // p5.js drawing
    }
    
    this.x = newX;
    this.y = newY;
  }
  
  turnLeft() {
    this.angle += this.angleIncrement;
  }
  
  turnRight() {
    this.angle -= this.angleIncrement;
  }
  
  pushState() {
    this.stack.push({
      x: this.x,
      y: this.y,
      angle: this.angle
    });
  }
  
  popState() {
    const state = this.stack.pop();
    this.x = state.x;
    this.y = state.y;
    this.angle = state.angle;
  }
}
```

### 3D Turtle State

The 3D turtle uses three unit vectors:
- **H** = Heading (direction turtle faces)
- **L** = Left (direction to turtle's left)
- **U** = Up (direction above turtle)

These vectors are mutually perpendicular: **H × L = U**

### 3D Turtle Commands

| Symbol | Meaning | Rotation Matrix |
|--------|---------|-----------------|
| `+` | Turn left | R_U(δ) around Up vector |
| `-` | Turn right | R_U(-δ) around Up vector |
| `&` | Pitch down | R_L(δ) around Left vector |
| `^` | Pitch up | R_L(-δ) around Left vector |
| `\` | Roll left | R_H(δ) around Heading vector |
| `/` | Roll right | R_H(-δ) around Heading vector |
| `\|` | Turn around | R_U(180°) |

### 3D Rotation Matrices

```javascript
// Rotation around U (up) vector by angle α
function R_U(alpha) {
  return [
    [Math.cos(alpha),  Math.sin(alpha), 0],
    [-Math.sin(alpha), Math.cos(alpha), 0],
    [0,                0,               1]
  ];
}

// Rotation around L (left) vector by angle α
function R_L(alpha) {
  return [
    [Math.cos(alpha), 0, -Math.sin(alpha)],
    [0,               1,  0],
    [Math.sin(alpha), 0,  Math.cos(alpha)]
  ];
}

// Rotation around H (heading) vector by angle α
function R_H(alpha) {
  return [
    [1, 0,                0],
    [0, Math.cos(alpha), -Math.sin(alpha)],
    [0, Math.sin(alpha),  Math.cos(alpha)]
  ];
}
```

---

## Bracketed L-Systems for Trees

### The Power of Brackets

Brackets `[` and `]` enable BRANCHING structures by using a stack:
- `[` = Save current turtle state (position, angle)
- `]` = Restore saved turtle state

### Simple Tree Example

```
Axiom:  F
Rule:   F → F[+F]F[-F]F
Angle:  δ = 25.7°

Derivation:
n=0: F
n=1: F[+F]F[-F]F
n=2: F[+F]F[-F]F[+F[+F]F[-F]F]F[+F]F[-F]F[-F[+F]F[-F]F]F[+F]F[-F]F
...
```

**Visual Interpretation**:
```
n=0:   |            (single line)

n=1:   |            (main trunk with 2 branches)
      /|\
     
n=2:  Complex branching tree
```

### Bush Example (Book Figure 1.24a)

```
Axiom:  F
Rule:   F → FF+[+F-F-F]-[-F+F+F]
Angle:  δ = 22.5°
```

### Multiple Branch Angles

```
Axiom:  F
Rule:   F → F[+F]F[-F][F]
Angle:  δ = 20°

This creates 3 branches at each node:
- Left branch (+)
- Right branch (-)
- Straight branch (no turn)
```

### Koch Curve (Fractal)

```
Axiom:  F
Rule:   F → F+F-F-F+F
Angle:  δ = 90°
```

### Dragon Curve

```
Axiom:  Fl
Rules:  Fl → Fl+Fr+
        Fr → -Fl-Fr
Angle:  δ = 90°
```

---

## Stochastic L-Systems

### Purpose
Add **natural variation** by choosing randomly between multiple productions with same predecessor.

### Format

```
Production with probability p:

predecessor → (probability) successor
```

### Example: Variable Branching

```
Axiom:  F

Rules with probabilities:
F → (0.33) F[+F]F[-F]F
F → (0.33) F[+F]F
F → (0.34) F[-F]F

Angle: δ = 25.7°
```

Each derivation step randomly chooses one of the three rules for each `F`.

### Implementation

```javascript
class StochasticProduction {
  constructor(predecessor) {
    this.predecessor = predecessor;
    this.rules = [];  // Array of {probability, successor}
  }
  
  addRule(probability, successor) {
    this.rules.push({ probability, successor });
  }
  
  apply() {
    const rand = Math.random();
    let cumulative = 0;
    
    for (let rule of this.rules) {
      cumulative += rule.probability;
      if (rand < cumulative) {
        return rule.successor;
      }
    }
    
    return this.rules[this.rules.length - 1].successor;
  }
}
```

### Plant Field Example (Book Figure 1.28)

```
Axiom:  plant
Rules:
  plant → internode[+leaf][−leaf]plant  (0.33)
  plant → internode[+leaf]plant         (0.33)
  plant → internodeplant                (0.34)
```

Creates natural-looking variation in a field of plants.

---

## Context-Sensitive L-Systems

### Purpose
Productions depend on **neighboring symbols** (context).

### 1L-System Format

**Left context**: `left < predecessor → successor`
**Right context**: `predecessor > right → successor`

### Signal Propagation Example

```
Axiom:  baaaaaaaa

Rules:
  b < a → b   (a becomes b if preceded by b)
  b → a       (b becomes a)

Derivation:
n=0: baaaaaaaa
n=1: abaaaaaaa
n=2: aabaaaaaa
n=3: aaabaaaaa
n=4: aaaabaaaa
...
```

The `b` "signal" moves from left to right.

### 2L-System Format

**Both sides**: `left < predecessor > right → successor`

### Practical Use in Plants

Context-sensitive rules model:
- **Hormone flow** (auxin, gibberellin)
- **Nutrient transport**
- **Apical dominance** (top suppresses side branches)
- **Signal propagation** (flowering signals)

### Plant Growth with Signals (Simplified from Book)

```
Axiom:  I(20)FA(0)

Rules:
  S < A(t) → flower      (if signal S reaches apex A, make flower)
  F → FS                 (segments transport signal S)
  A(t) : t>0 → A(t-1)    (apex counts down)
  A(t) : t=0 → [+branch]FA(2)  (apex creates branch)
```

---

## Parametric L-Systems

### Purpose
Symbols carry **numerical parameters** that can be modified during derivation.

### Format

```
Symbol(param1, param2, ...)
```

### Production with Conditions

```
predecessor(params) : condition → successor

Example:
A(t) : t > 0 → A(t-1)   (if t>0, decrement it)
A(t) : t = 0 → B        (if t=0, transform to B)
```

### Age Counter Example

```
Axiom:  A(10)

Rules:
  A(t) : t > 0 → A(t-1)
  A(t) : t = 0 → B

Derivation:
n=0: A(10)
n=1: A(9)
n=2: A(8)
...
n=10: A(0)
n=11: B
```

### Branch Length Control

```
Axiom:  F(1)

Rules:
  F(l) → F(l*1.1)[+F(l*0.7)][-F(l*0.7)]

Result:
- Main branch grows by 10%
- Side branches are 70% of parent length
```

### Parametric Turtle Commands

```
F(length)     - Forward with specific length
+(angle)      - Turn left by specific angle
-(angle)      - Turn right by specific angle
#(width)      - Set line width

Example:
F(5)+(30)F(3)  - Draw line of length 5, turn 30°, draw line of length 3
```

---

## Specific Plant Examples

### 1. Simple Tree (Book Figure 1.24d)

```
n = 5 iterations
δ = 20°

Axiom:  F

Rule:
  F → F[+F]F[-F][F]
```

### 2. Bushy Plant (Book Figure 1.24e)

```
n = 4 iterations
δ = 25.7°

Axiom:  F

Rule:
  F → FF-[-F+F+F]+[+F-F-F]
```

### 3. Willow-like Tree (Book Figure 1.24f)

```
n = 5 iterations
δ = 22.5°

Axiom:  X

Rules:
  X → F[+X]F[-X]+X
  F → FF
```

### 4. Pine-like Tree with Stochastic Variation

```
n = 4 iterations
δ = 25°

Axiom:  A

Rules:
  A → [B]////[B]////B      (creates whorl of branches)
  B → &F[//C]              (branch pitches down)
  C → F[+F][-F]            (creates needles)
  F → S/////F              (segments rotate)
  S → FL                   (segments grow)
```

### 5. Herb with Leaves (Mycelis muralis from Book)

```
Axiom:  I(20)FA(0)

Rules:
  S < A(t) → flower
  A(t) : t>0 → A(t-1)
  A(t) : t=0 → [+(30)G]F/(180)A(2)
  S < F → FS
  ...
```

**Features**:
- Signal propagation (S)
- Timed development (I counter)
- Spiral arrangement (180° rotation becomes 137.5° for Fibonacci)
- Apical dominance (branches wait for signal)

### 6. Fibonacci Spiral Arrangement

For spiral phyllotaxis around stem:

```
Rotation angle: 137.5° (golden angle)

Rule:
  A → [+(137.5)leaf]F/(137.5)A
```

This creates the optimal packing seen in sunflower seeds, pine cones, etc.

---

## Implementation Pseudocode

### Basic L-System Engine

```javascript
class LSystem {
  constructor(axiom, rules, iterations) {
    this.axiom = axiom;
    this.rules = rules;  // Map: predecessor → successor
    this.iterations = iterations;
  }
  
  generate() {
    let current = this.axiom;
    
    for (let i = 0; i < this.iterations; i++) {
      current = this.applyRules(current);
    }
    
    return current;
  }
  
  applyRules(input) {
    let output = '';
    
    for (let symbol of input) {
      if (this.rules.has(symbol)) {
        output += this.rules.get(symbol);
      } else {
        output += symbol;  // Identity: symbol → symbol
      }
    }
    
    return output;
  }
}
```

### Turtle Interpreter

```javascript
function interpretString(lstring, turtle, angleIncrement) {
  for (let char of lstring) {
    switch(char) {
      case 'F':
        turtle.forward(true);  // Draw
        break;
      case 'f':
        turtle.forward(false); // Move without drawing
        break;
      case '+':
        turtle.turnLeft();
        break;
      case '-':
        turtle.turnRight();
        break;
      case '[':
        turtle.pushState();
        break;
      case ']':
        turtle.popState();
        break;
      // Ignore other characters
    }
  }
}
```

### Complete Simple Tree Example

```javascript
// Define L-system
const treeSystem = {
  axiom: 'F',
  rules: new Map([
    ['F', 'F[+F]F[-F]F']
  ]),
  iterations: 4,
  angle: 25.7 * Math.PI / 180,  // Convert to radians
  stepSize: 5
};

// Generate string
const lsystem = new LSystem(
  treeSystem.axiom, 
  treeSystem.rules, 
  treeSystem.iterations
);
const treeString = lsystem.generate();

// Create turtle
const turtle = new Turtle2D(
  width/2,      // Start at center
  height,       // Bottom of canvas
  -Math.PI/2,   // Point up
  treeSystem.stepSize,
  treeSystem.angle
);

// Interpret and draw
interpretString(treeString, turtle, treeSystem.angle);
```

---

## Key Implementation Tips from the Book

### 1. String Length Explosion

L-systems can generate VERY long strings:
- **Solution**: Reduce iterations or implement progressive rendering
- **Book advice**: 4-6 iterations usually sufficient for trees

### 2. Branch Thickness

The book recommends:
```
thickness = initialThickness * (reductionFactor ^ branchOrder)

Typical reductionFactor: 0.7-0.8
```

Implementation:
```javascript
let currentThickness = initialThickness;
strokeWeight(currentThickness);

// On '[' (branch start)
stack.push(currentThickness);
currentThickness *= 0.7;

// On ']' (branch end)
currentThickness = stack.pop();
```

### 3. Natural Variation

From book's stochastic examples:
- Use 3-4 alternative productions
- Keep probabilities balanced (0.33, 0.33, 0.34)
- Add variation to angles: `δ ± random(5°)`

### 4. Leaf Representation

Simple approach:
```
leaf → circle or ellipse at current position
```

Advanced approach (from book):
```
leaf → small L-system defining leaf shape
```

### 5. Growth Animation

From book Chapter 6:
```
// Generate all iterations 0 to n
for (let i = 0; i <= maxIterations; i++) {
  strings[i] = lsystem.derive(i);
}

// In draw loop
currentIteration += 0.1;  // Smooth interpolation
displayIteration(floor(currentIteration));
```

---

## Debugging Tips

### Visualize the String

```javascript
console.log('n=0:', axiom);
let current = axiom;
for (let i = 1; i <= 3; i++) {
  current = applyRules(current);
  console.log(`n=${i}:`, current);
}
```

### Check String Length

```javascript
console.log(`String length at iteration ${n}: ${string.length}`);
// If > 10,000 characters, reduce iterations
```

### Draw Step-by-Step

```javascript
let stepDelay = 100; // ms
for (let char of lstring) {
  interpretSymbol(char);
  await sleep(stepDelay);
}
```

---

## Mathematical Formulas from the Book

### Golden Angle (for Fibonacci spirals)

```
φ = 137.5° = 137.5082...° = (360° × (2 - Φ))

where Φ = (1 + √5) / 2 ≈ 1.618 (golden ratio)
```

### Branch Angle Distribution

For natural-looking trees:
```
angle = baseAngle + gaussianRandom(0, variation)

Typical: baseAngle = 30°, variation = 10°
```

### Fractal Dimension

The book discusses how L-systems create fractals with specific dimensions:
```
D = log(N) / log(r)

where:
N = number of self-similar pieces
r = scaling factor
```

---

## Summary: Quick Start Recipe

1. **Choose a pattern**:
   - Simple tree: `F → F[+F]F[-F]F`
   - Bush: `F → FF-[-F+F+F]+[+F-F-F]`
   - Weed: `X → F[+X]F[-X]+X` with `F → FF`

2. **Set parameters**:
   - Iterations: 3-5 (start small!)
   - Angle: 20-30° for trees
   - Step size: Depends on canvas size

3. **Generate string**:
   ```javascript
   let string = axiom;
   for (let i = 0; i < iterations; i++) {
     string = applyRules(string);
   }
   ```

4. **Interpret with turtle**:
   ```javascript
   turtle = new Turtle2D(x, y, angle, step, angleIncrement);
   interpretString(string, turtle);
   ```

5. **Add variation**:
   - Use stochastic rules
   - Randomize angles slightly
   - Vary branch thickness

---

## Next Steps

1. **Implement basic DOL-system** with simple rules
2. **Add turtle graphics** for 2D visualization
3. **Implement brackets** for tree structures
4. **Add stochastic rules** for variation
5. **Experiment** with parameters
6. **Study book examples** for specific plants

---

## Bibliography Note

All algorithms and examples in this document are extracted from:

**Prusinkiewicz, P., & Lindenmayer, A. (1990). The Algorithmic Beauty of Plants. Springer-Verlag.**

Available free at: http://algorithmicbotany.org/papers/abop/abop.pdf

**Key Chapters**:
- Chapter 1: L-system fundamentals (pages 1-49)
- Chapter 2: Tree modeling (pages 51-61)
- Chapter 3: Herbaceous plants (pages 63-98)
- Chapter 4: Phyllotaxis (pages 99-117)

---

*"The beauty of plants is bound up with the elegance of developmental algorithms."*
