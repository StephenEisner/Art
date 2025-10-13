// File: circle_packing_dynamic.js

let circles = [];
let maxAttempts = 1000;
let minRadius = 10;
let maxRadius = 50;
let colorMode = 'normal';
let attempts = 0;
let circlesPerDraw = 1;

function setup() {
  createCanvas(800, 800);
  createUI();
  noLoop(); // We'll use redraw() to control the drawing
}

function draw() {
  background(255);
  for (let circle of circles) {
    fill(circle.color);
    ellipse(circle.x, circle.y, circle.r * 2, circle.r * 2);
  }

  // Try to add new circles
  for (let i = 0; i < circlesPerDraw && attempts < maxAttempts; i++) {
    let r = random(minRadius, maxRadius);
    let x = random(r, width - r);
    let y = random(r, height - r);

    let newCircle = { x, y, r, color: getColor() };

    if (isValidCircle(newCircle)) {
      circles.push(newCircle);
    }

    attempts++;
  }

  // Stop the loop when max attempts are reached
  if (attempts >= maxAttempts) {
    noLoop();
  }
}

function createUI() {
  let minRadiusInput = createInput(minRadius.toString());
  minRadiusInput.position(10, height + 10);
  minRadiusInput.size(50);
  minRadiusInput.input(() => {
    minRadius = int(minRadiusInput.value());
    resetCircles();
  });

  let maxRadiusInput = createInput(maxRadius.toString());
  maxRadiusInput.position(70, height + 10);
  maxRadiusInput.size(50);
  maxRadiusInput.input(() => {
    maxRadius = int(maxRadiusInput.value());
    resetCircles();
  });

  let colorModeSelect = createSelect();
  colorModeSelect.position(130, height + 10);
  colorModeSelect.option('normal');
  colorModeSelect.option('random');
  colorModeSelect.option('blue');
  colorModeSelect.changed(() => {
    colorMode = colorModeSelect.value();
    resetCircles();
  });

  let maxAttemptsInput = createInput(maxAttempts.toString());
  maxAttemptsInput.position(250, height + 10);
  maxAttemptsInput.size(50);
  maxAttemptsInput.input(() => {
    maxAttempts = int(maxAttemptsInput.value());
    resetCircles();
  });

  let circlesPerDrawInput = createInput(circlesPerDraw.toString());
  circlesPerDrawInput.position(310, height + 10);
  circlesPerDrawInput.size(50);
  circlesPerDrawInput.input(() => {
    circlesPerDraw = int(circlesPerDrawInput.value());
    resetCircles();
  });

  let button = createButton('Redraw Circles');
  button.position(370, height + 10);
  button.mousePressed(resetCircles);
}

function resetCircles() {
  circles = [];
  attempts = 0;
  loop(); // Restart the drawing loop
}

function isValidCircle(newCircle) {
  for (let circle of circles) {
    let d = dist(newCircle.x, newCircle.y, circle.x, circle.y);
    if (d < newCircle.r + circle.r) {
      return false;
    }
  }
  return true;
}

function getColor() {
  if (colorMode === 'random') {
    return color(random(255), random(255), random(255));
  } else if (colorMode === 'blue') {
    return color(0, 0, random(255));
  } else {
    return color(0);
  }
}
