let shapes = [];
let maxAttempts = 1000;
let minRadius = 10;
let maxRadius = 50;
let colorModeValue = 'normal'; // Renamed to avoid conflict with p5.js colorMode function
let attempts = 0;
let shapesPerDraw = 1;
let packingMode = 'random';
let failedAttempts = 0;
let chosenColor = '#000000';
let shapeType = 'circle'; // New variable for shape type
let colorPicker;

function setup() {
  createCanvas(800, 800);
  initializeUI();
  createInfoTable();
  noLoop();
}

function draw() {
  background(255);
  for (let shape of shapes) {
    fill(shape.color);
    if (shape.type === 'circle') {
      ellipse(shape.x, shape.y, shape.r * 2, shape.r * 2);
    } else if (shape.type === 'rectangle') {
      rectMode(CENTER);
      rect(shape.x, shape.y, shape.w, shape.h);
    }
  }

  for (let i = 0; i < shapesPerDraw && attempts < maxAttempts; i++) {
    let newShape;
    if (packingMode === 'cursor') {
      newShape = createShapeNearCursor();
    } else if (packingMode === 'efficient') {
      newShape = createLargestShape();
    } else {
      newShape = createRandomShape();
    }

    if (newShape && isValidShape(newShape)) {
      shapes.push(newShape);
    } else {
      failedAttempts++;
    }

    attempts++;
  }

  updateInfoTable();

  if (attempts >= maxAttempts) {
    noLoop();
  }
}

function resetShapes() {
  shapes = [];
  attempts = 0;
  failedAttempts = 0;
  loop();
}

function createRandomShape() {
  let size = random(minRadius, maxRadius);
  let x = random(size, width - size);
  let y = random(size, height - size);
  if (shapeType === 'circle') {
    return { type: 'circle', x, y, r: size, color: getColor(x, y, size) };
  } else if (shapeType === 'rectangle') {
    return { type: 'rectangle', x, y, w: size, h: size, color: getColor(x, y, size) };
  }
}

function createShapeNearCursor() {
  let size = random(minRadius, maxRadius);
  let x = constrain(mouseX + random(-100, 100), size, width - size);
  let y = constrain(mouseY + random(-100, 100), size, height - size);
  if (shapeType === 'circle') {
    return { type: 'circle', x, y, r: size, color: getColor(x, y, size) };
  } else if (shapeType === 'rectangle') {
    return { type: 'rectangle', x, y, w: size, h: size, color: getColor(x, y, size) };
  }
}

function createLargestShape() {
  let x = random(width);
  let y = random(height);
  let low = minRadius;
  let high = maxRadius;
  let bestSize = low;

  while (low <= high) {
    let mid = floor((low + high) / 2);
    let newShape;
    if (shapeType === 'circle') {
      newShape = { type: 'circle', x, y, r: mid, color: getColor(x, y, mid) };
    } else if (shapeType === 'rectangle') {
      newShape = { type: 'rectangle', x, y, w: mid, h: mid, color: getColor(x, y, mid) };
    }

    if (isValidShape(newShape) && fitsWithinCanvas(newShape)) {
      bestSize = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (shapeType === 'circle') {
    return { type: 'circle', x, y, r: bestSize, color: getColor(x, y, bestSize) };
  } else if (shapeType === 'rectangle') {
    return { type: 'rectangle', x, y, w: bestSize, h: bestSize, color: getColor(x, y, bestSize) };
  }
}

function isValidShape(newShape) {
  for (let shape of shapes) {
    let d;
    if (shape.type === 'circle' && newShape.type === 'circle') {
      d = dist(newShape.x, newShape.y, shape.x, shape.y);
      if (d < newShape.r + shape.r) {
        return false;
      }
    } else if (shape.type === 'rectangle' && newShape.type === 'rectangle') {
      if (abs(newShape.x - shape.x) < (newShape.w / 2 + shape.w / 2) &&
          abs(newShape.y - shape.y) < (newShape.h / 2 + shape.h / 2)) {
        return false;
      }
    } else if (shape.type === 'circle' && newShape.type === 'rectangle') {
      d = dist(newShape.x, newShape.y, shape.x, shape.y);
      if (d < newShape.w / 2 + shape.r) {
        return false;
      }
    } else if (shape.type === 'rectangle' && newShape.type === 'circle') {
      d = dist(newShape.x, newShape.y, shape.x, shape.y);
      if (d < newShape.r + shape.w / 2) {
        return false;
      }
    }
  }
  return true;
}

function fitsWithinCanvas(shape) {
  if (shape.type === 'circle') {
    return shape.x - shape.r >= 0 && shape.x + shape.r <= width &&
           shape.y - shape.r >= 0 && shape.y + shape.r <= height;
  } else if (shape.type === 'rectangle') {
    return shape.x - shape.w / 2 >= 0 && shape.x + shape.w / 2 <= width &&
           shape.y - shape.h / 2 >= 0 && shape.y + shape.h / 2 <= height;
  }
}

function getColor(x, y, size) {
  if (colorModeValue === 'random') {
    return color(random(255), random(255), random(255));
  } else if (colorModeValue === 'blue') {
    return color(0, 0, random(255));
  } else if (colorModeValue === 'chosen') {
    return color(chosenColor);
  } else if (colorModeValue === 'variance') {
    let baseColor = color(chosenColor);
    return color(
      red(baseColor) + random(-100, 100),
      green(baseColor) + random(-100, 100),
      blue(baseColor) + random(-100, 100)
    );
  } else if (colorModeValue === 'radius') {
    let baseColor = color(chosenColor);
    let ratio = (size - minRadius) / (maxRadius - minRadius);
    return color(
      red(baseColor) * ratio,
      green(baseColor) * ratio,
      blue(baseColor) * ratio
    );
  } else if (colorModeValue === 'radius-hue') {
    colorMode(HSB, 360, 100, 100);
    let baseHue = hue(color(chosenColor));
    let baseSaturation = saturation(color(chosenColor));
    let baseBrightness = brightness(color(chosenColor));
    let hueVariance = map(size, minRadius, maxRadius, 0, 360);
    return color((baseHue + hueVariance) % 360, baseSaturation, baseBrightness);
  } else if (colorModeValue === 'position') {
    return color(map(x, 0, width, 0, 255), map(y, 0, height, 0, 255), 150);
  } else {
    return color(0);
  }
}

function updateInfoTable() {
  let coveredArea = shapes.reduce((sum, shape) => {
    if (shape.type === 'circle') {
      return sum + PI * shape.r * shape.r;
    } else if (shape.type === 'rectangle') {
      return sum + shape.w * shape.h;
    }
  }, 0);
  let totalArea = width * height;
  let coveragePercentage = (coveredArea / totalArea) * 100;

  // Update HTML table with coverage information
  let tableHtml = `
    <table border="1">
      <tr>
        <th>Failed Attempts</th>
        <td>${failedAttempts}</td>
      </tr>
      <tr>
        <th>Coverage Percentage</th>
        <td>${coveragePercentage.toFixed(2)}%</td>
      </tr>
    </table>
  `;

  let table = document.getElementById('info-table');
  if (table) {
    table.innerHTML = tableHtml;
  } else {
    table = createDiv(tableHtml);
    table.id('info-table');
    table.position(10, height + 50);
  }
}

function initializeUI() {
  let minRadiusInput = createInput(minRadius.toString());
  minRadiusInput.position(10, height + 10);
  minRadiusInput.size(50);
  minRadiusInput.input(() => {
    minRadius = int(minRadiusInput.value());
    resetShapes();
  });

  let maxRadiusInput = createInput(maxRadius.toString());
  maxRadiusInput.position(70, height + 10);
  maxRadiusInput.size(50);
  maxRadiusInput.input(() => {
    maxRadius = int(maxRadiusInput.value());
    resetShapes();
  });

  let colorModeSelect = createSelect();
  colorModeSelect.position(130, height + 10);
  colorModeSelect.option('normal');
  colorModeSelect.option('random');
  colorModeSelect.option('blue');
  colorModeSelect.option('chosen');
  colorModeSelect.option('variance');
  colorModeSelect.option('radius');
  colorModeSelect.option('radius-hue');
  colorModeSelect.option('position');
  colorModeSelect.changed(() => {
    colorModeValue = colorModeSelect.value();
    resetShapes();
  });

  colorPicker = createColorPicker('#000000');
  colorPicker.position(210, height + 10);
  colorPicker.changed(() => {
    chosenColor = colorPicker.value();
    if (['chosen', 'variance', 'radius', 'radius-hue', 'position'].includes(colorModeValue)) {
      resetShapes();
    }
  });

  let maxAttemptsInput = createInput(maxAttempts.toString());
  maxAttemptsInput.position(250, height + 10);
  maxAttemptsInput.size(50);
  maxAttemptsInput.input(() => {
    maxAttempts = int(maxAttemptsInput.value());
    resetShapes();
  });

  let shapesPerDrawInput = createInput(shapesPerDraw.toString());
  shapesPerDrawInput.position(310, height + 10);
  shapesPerDrawInput.size(50);
  shapesPerDrawInput.input(() => {
    shapesPerDraw = int(shapesPerDrawInput.value());
    resetShapes();
  });

  let packingModeSelect = createSelect();
  packingModeSelect.position(370, height + 10);
  packingModeSelect.option('random');
  packingModeSelect.option('cursor');
  packingModeSelect.option('efficient');
  packingModeSelect.changed(() => {
    packingMode = packingModeSelect.value();
    resetShapes();
  });

  let shapeTypeSelect = createSelect();
  shapeTypeSelect.position(430, height + 10);
  shapeTypeSelect.option('circle');
  shapeTypeSelect.option('rectangle');
  shapeTypeSelect.changed(() => {
    shapeType = shapeTypeSelect.value();
    resetShapes();
  });

  let button = createButton('Redraw Shapes');
  button.position(500, height + 10);
  button.mousePressed(resetShapes);
}

function createInfoTable() {
  let tableHtml = `
    <table border="1">
      <tr>
        <th>Failed Attempts</th>
        <td>${failedAttempts}</td>
      </tr>
      <tr>
        <th>Coverage Percentage</th>
        <td>0%</td>
      </tr>
    </table>
  `;
  let table = createDiv(tableHtml);
  table.id('info-table');
  table.position(10, height + 50);
}

