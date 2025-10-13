// Advanced circle packing algorithm with multi-pass, mixed shapes, and gap filling
const Packing = {
  async packCircles(region, defaultColor, width, height, options = {}) {
    const {
      minRadius = 3,
      maxRadius = 50,
      maxAttempts = 10000,
      shapesPerBatch = 50,
      shapeType = 'circle',
      colorMode = 'centroid',
      packingMode = 'random',
      targetFillPercent = 0.95,
      enableMultiPass = true,
      numPasses = 4,
      enableMixedShapes = false,
      enableGapFilling = false,
      onProgress
    } = options;
    
    if (region.length === 0) return [];
    
    const shapes = [];
    const regionArea = region.length;
    let filledArea = 0;
    
    // Get bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (const p of region) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    
    const regionWidth = maxX - minX;
    const regionHeight = maxY - minY;
    const boundingBoxArea = regionWidth * regionHeight;
    const regionDensity = regionArea / boundingBoxArea;
    const aspectRatio = regionWidth / regionHeight;
    
    // Adaptive sizing
    let adaptiveMinRadius = minRadius;
    let adaptiveMaxRadius = maxRadius;
    
    if (regionArea < 500) {
      adaptiveMinRadius = Math.min(minRadius, 0.5);
      adaptiveMaxRadius = Math.min(maxRadius, 5);
    } else if (regionArea < 2000) {
      adaptiveMinRadius = Math.min(minRadius, 1);
      adaptiveMaxRadius = Math.min(maxRadius, 15);
    } else if (regionDensity < 0.3) {
      adaptiveMinRadius = Math.min(minRadius, 2);
      adaptiveMaxRadius = Math.min(maxRadius, 20);
    }
    
    // Handle tiny regions
    if (regionArea < 10 || regionWidth < 2 || regionHeight < 2) {
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const radius = Math.max(1, Math.min(regionWidth, regionHeight) / 2);
      
      if (shapeType === 'circle') {
        return [{ type: 'circle', x: centerX, y: centerY, r: radius, color: defaultColor }];
      } else if (shapeType === 'rectangle') {
        return [{ type: 'rectangle', x: centerX, y: centerY, w: radius, h: radius, color: defaultColor }];
      } else if (shapeType === 'triangle') {
        return [{ type: 'triangle', x: centerX, y: centerY, r: radius, color: defaultColor }];
      }
    }
    
    console.log(`Region: ${regionArea} pixels, ${regionWidth.toFixed(0)}x${regionHeight.toFixed(0)}, density: ${regionDensity.toFixed(2)}, aspect: ${aspectRatio.toFixed(2)}`);
    
    // Create region bitmap
    const bitmap = new Uint8Array(width * height);
    for (const p of region) {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      if (px >= 0 && px < width && py >= 0 && py < height) {
        bitmap[py * width + px] = 1;
      }
    }
    
    // Create coverage grid for gap detection
    const gridSize = Math.max(2, Math.floor(adaptiveMinRadius));
    const gridWidth = Math.ceil(regionWidth / gridSize);
    const gridHeight = Math.ceil(regionHeight / gridSize);
    const coverageGrid = new Uint8Array(gridWidth * gridHeight);
    
    const isInRegion = (x, y) => {
      const px = Math.floor(x);
      const py = Math.floor(y);
      if (px < 0 || px >= width || py < 0 || py >= height) return false;
      return bitmap[py * width + px] === 1;
    };
    
    const fitsWithinRegion = (shape) => {
      if (shape.type === 'circle') {
        if (!isInRegion(shape.x, shape.y)) return false;
        const numChecks = Math.max(8, Math.ceil(shape.r / 3));
        for (let i = 0; i < numChecks; i++) {
          const angle = (i / numChecks) * Math.PI * 2;
          const px = shape.x + Math.cos(angle) * shape.r;
          const py = shape.y + Math.sin(angle) * shape.r;
          if (!isInRegion(px, py)) return false;
        }
        return true;
      } else if (shape.type === 'rectangle') {
        const hw = shape.w / 2;
        const hh = shape.h / 2;
        // Check corners and edges
        return isInRegion(shape.x - hw, shape.y - hh) &&
               isInRegion(shape.x + hw, shape.y - hh) &&
               isInRegion(shape.x - hw, shape.y + hh) &&
               isInRegion(shape.x + hw, shape.y + hh) &&
               isInRegion(shape.x, shape.y - hh) &&
               isInRegion(shape.x, shape.y + hh) &&
               isInRegion(shape.x - hw, shape.y) &&
               isInRegion(shape.x + hw, shape.y);
      } else if (shape.type === 'triangle') {
        const r = shape.r;
        for (let i = 0; i < 3; i++) {
          const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
          const px = shape.x + Math.cos(angle) * r;
          const py = shape.y + Math.sin(angle) * r;
          if (!isInRegion(px, py)) return false;
          
          const nextAngle = ((i + 1) * 2 * Math.PI / 3) - Math.PI / 2;
          const midX = shape.x + (Math.cos(angle) + Math.cos(nextAngle)) * r / 2;
          const midY = shape.y + (Math.sin(angle) + Math.sin(nextAngle)) * r / 2;
          if (!isInRegion(midX, midY)) return false;
        }
        return true;
      }
      return false;
    };
    
    const shapesCollide = (s1, s2) => {
      const dx = s1.x - s2.x;
      const dy = s1.y - s2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const padding = 0.3;
      
      if (s1.type === 'circle' && s2.type === 'circle') {
        return dist < (s1.r + s2.r - padding);
      } else if (s1.type === 'rectangle' && s2.type === 'rectangle') {
        return Math.abs(dx) < (s1.w / 2 + s2.w / 2 - padding) &&
               Math.abs(dy) < (s1.h / 2 + s2.h / 2 - padding);
      } else {
        // Mixed shape collision - approximate
        const r1 = s1.r || Math.max(s1.w || 0, s1.h || 0) / 2;
        const r2 = s2.r || Math.max(s2.w || 0, s2.h || 0) / 2;
        return dist < (r1 + r2 - padding);
      }
    };
    
    const isValidShape = (newShape) => {
      if (!fitsWithinRegion(newShape)) return false;
      for (const shape of shapes) {
        if (shapesCollide(newShape, shape)) return false;
      }
      return true;
    };
    
    const updateCoverageGrid = (shape) => {
      const r = shape.r || Math.max(shape.w || 0, shape.h || 0) / 2;
      const gx1 = Math.max(0, Math.floor((shape.x - r - minX) / gridSize));
      const gx2 = Math.min(gridWidth - 1, Math.floor((shape.x + r - minX) / gridSize));
      const gy1 = Math.max(0, Math.floor((shape.y - r - minY) / gridSize));
      const gy2 = Math.min(gridHeight - 1, Math.floor((shape.y + r - minY) / gridSize));
      
      for (let gy = gy1; gy <= gy2; gy++) {
        for (let gx = gx1; gx <= gx2; gx++) {
          coverageGrid[gy * gridWidth + gx] = 1;
        }
      }
    };
    
    const findGapPositions = (sampleSize = 50) => {
      const gaps = [];
      
      // Find grid cells with low coverage
      for (let gy = 0; gy < gridHeight; gy++) {
        for (let gx = 0; gx < gridWidth; gx++) {
          if (coverageGrid[gy * gridWidth + gx] === 0) {
            const x = minX + (gx + 0.5) * gridSize;
            const y = minY + (gy + 0.5) * gridSize;
            if (isInRegion(x, y)) {
              gaps.push({ x, y });
            }
          }
        }
      }
      
      // Shuffle and return sample
      for (let i = gaps.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gaps[i], gaps[j]] = [gaps[j], gaps[i]];
      }
      
      return gaps.slice(0, sampleSize);
    };
    
    const getShapeColor = (x, y, size) => {
      switch (colorMode) {
        case 'centroid':
          return defaultColor;
        case 'random':
          return `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
        case 'variance':
          const match = defaultColor.match(/\d+/g);
          if (match) {
            const [r, g, b] = match.map(Number);
            return `rgb(${Math.max(0, Math.min(255, r + (Math.random() - 0.5) * 100))}, ${Math.max(0, Math.min(255, g + (Math.random() - 0.5) * 100))}, ${Math.max(0, Math.min(255, b + (Math.random() - 0.5) * 100))})`;
          }
          return defaultColor;
        case 'size':
          const match2 = defaultColor.match(/\d+/g);
          if (match2) {
            const [r, g, b] = match2.map(Number);
            const ratio = (size - adaptiveMinRadius) / (adaptiveMaxRadius - adaptiveMinRadius);
            return `rgb(${Math.floor(r * ratio)}, ${Math.floor(g * ratio)}, ${Math.floor(b * ratio)})`;
          }
          return defaultColor;
        default:
          return defaultColor;
      }
    };
    
    // Decide shape type intelligently for mixed shapes
    const chooseShapeType = (x, y, localDensity = 1.0) => {
      if (!enableMixedShapes) return shapeType;
      
      // For elongated regions, prefer rectangles
      if (aspectRatio > 2 || aspectRatio < 0.5) {
        return Math.random() < 0.6 ? 'rectangle' : 'circle';
      }
      
      // Near edges, prefer rectangles
      const edgeThreshold = adaptiveMaxRadius * 1.5;
      const nearEdge = (x - minX < edgeThreshold) || (maxX - x < edgeThreshold) ||
                       (y - minY < edgeThreshold) || (maxY - y < edgeThreshold);
      
      if (nearEdge) {
        return Math.random() < 0.5 ? 'rectangle' : 'circle';
      }
      
      // For sparse regions, prefer circles (better coverage)
      if (regionDensity < 0.5) {
        return Math.random() < 0.7 ? 'circle' : 'rectangle';
      }
      
      // Default: mostly circles, some rectangles
      return Math.random() < 0.7 ? 'circle' : 'rectangle';
    };
    
    const tryPlaceShape = (x, y, radius, type = null) => {
      const actualType = type || chooseShapeType(x, y);
      const color = getShapeColor(x, y, radius);
      let testShape;
      
      if (actualType === 'circle') {
        testShape = { type: 'circle', x, y, r: radius, color };
      } else if (actualType === 'rectangle') {
        // For rectangles, vary aspect ratio slightly
        const aspectVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        testShape = { type: 'rectangle', x, y, w: radius * aspectVariation, h: radius / aspectVariation, color };
      } else if (actualType === 'triangle') {
        testShape = { type: 'triangle', x, y, r: radius, color };
      }
      
      if (isValidShape(testShape)) {
        shapes.push(testShape);
        updateCoverageGrid(testShape);
        
        // Calculate area
        if (testShape.type === 'circle') {
          filledArea += Math.PI * testShape.r * testShape.r;
        } else if (testShape.type === 'rectangle') {
          filledArea += testShape.w * testShape.h;
        } else if (testShape.type === 'triangle') {
          filledArea += (Math.sqrt(3) / 4) * testShape.r * testShape.r;
        }
        return true;
      }
      return false;
    };
    
    // === MAIN PACKING LOGIC ===
    
    let totalAttempts = 0;
    
    if (onProgress) onProgress(0, 0);
    await new Promise(resolve => setTimeout(resolve, 0));
    
    if (enableMultiPass) {
      // === MULTI-PASS PACKING ===
      console.log(`Multi-pass packing with ${numPasses} passes`);
      
      for (let pass = 0; pass < numPasses; pass++) {
        const passProgress = pass / numPasses;
        
        // Calculate size range for this pass (large to small)
        const passMaxRadius = adaptiveMaxRadius * (1 - passProgress * 0.75);
        const passMinRadius = adaptiveMinRadius + (adaptiveMaxRadius - adaptiveMinRadius) * passProgress * 0.4;
        
        const passAttempts = Math.floor(maxAttempts / numPasses);
        let passPlaced = 0;
        let consecutiveFailures = 0;
        const maxConsecutiveFailures = Math.floor(passAttempts / 20);
        
        console.log(`Pass ${pass + 1}/${numPasses}: radius ${passMinRadius.toFixed(1)}-${passMaxRadius.toFixed(1)}px`);
        
        for (let attempt = 0; attempt < passAttempts && consecutiveFailures < maxConsecutiveFailures; attempt++) {
          const fillPercent = filledArea / regionArea;
          
          // More frequent progress updates and async breaks
          if (attempt % 50 === 0) {
            if (onProgress) {
              onProgress(fillPercent, totalAttempts - shapes.length);
            }
            await new Promise(resolve => setTimeout(resolve, 0));
          }
          
          // Early exit if we've hit target coverage
          if (fillPercent > 0.85) {
            console.log('Target coverage reached, ending early');
            break;
          }
          
          let x, y, radius;
          
          // Use gap-finding for later passes
          if (pass >= Math.floor(numPasses / 2) || fillPercent > 0.3) {
            const gaps = findGapPositions(40);
            if (gaps.length > 0) {
              const gap = gaps[Math.floor(Math.random() * gaps.length)];
              x = gap.x + (Math.random() - 0.5) * gridSize;
              y = gap.y + (Math.random() - 0.5) * gridSize;
            } else {
              x = minX + Math.random() * regionWidth;
              y = minY + Math.random() * regionHeight;
            }
          } else {
            // Random placement for early passes
            x = minX + Math.random() * regionWidth;
            y = minY + Math.random() * regionHeight;
          }
          
          // Binary search for largest fitting size in this pass's range
          if (packingMode === 'efficient') {
            let low = passMinRadius;
            let high = passMaxRadius;
            let bestSize = 0;
            
            // Binary search with safety limit
            for (let i = 0; i < 7 && (high - low) > 0.1; i++) {
              const mid = (low + high) / 2;
              const testType = chooseShapeType(x, y);
              const testShape = testType === 'circle'
                ? { type: 'circle', x, y, r: mid, color: defaultColor }
                : testType === 'rectangle'
                ? { type: 'rectangle', x, y, w: mid, h: mid, color: defaultColor }
                : { type: 'triangle', x, y, r: mid, color: defaultColor };
              
              if (isValidShape(testShape)) {
                bestSize = mid;
                low = mid;
              } else {
                high = mid;
              }
            }
            
            if (bestSize >= passMinRadius) {
              if (tryPlaceShape(x, y, bestSize)) {
                passPlaced++;
                consecutiveFailures = 0;
              } else {
                consecutiveFailures++;
              }
            } else {
              consecutiveFailures++;
            }
          } else {
            // Random size within pass range
            radius = passMinRadius + Math.random() * (passMaxRadius - passMinRadius);
            
            if (tryPlaceShape(x, y, radius)) {
              passPlaced++;
              consecutiveFailures = 0;
            } else {
              consecutiveFailures++;
            }
          }
          
          totalAttempts++;
        }
        
        console.log(`Pass ${pass + 1} placed: ${passPlaced} shapes`);
        
        // Early exit if not making progress
        if (passPlaced < 5 && pass >= Math.floor(numPasses / 2)) {
          console.log('Low placement rate, ending multi-pass early');
          break;
        }
      }
      
    } else {
      // === SINGLE-PASS PACKING (Original) ===
      console.log('Single-pass packing');
      
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = Math.floor(maxAttempts / 10);
      
      for (let attempt = 0; attempt < maxAttempts && consecutiveFailures < maxConsecutiveFailures; attempt++) {
        const fillPercent = filledArea / regionArea;
        
        if (attempt % shapesPerBatch === 0) {
          if (onProgress) {
            onProgress(fillPercent, consecutiveFailures);
          }
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // Pick random point
        const point = region[Math.floor(Math.random() * region.length)];
        const x = point.x;
        const y = point.y;
        
        // Binary search for largest fit
        let low = adaptiveMinRadius;
        let high = adaptiveMaxRadius;
        let bestSize = 0;
        
        // Binary search with safety limit
        for (let i = 0; i < 7 && (high - low) > 0.1; i++) {
          const mid = (low + high) / 2;
          const testType = chooseShapeType(x, y);
          const testShape = testType === 'circle'
            ? { type: 'circle', x, y, r: mid, color: defaultColor }
            : testType === 'rectangle'
            ? { type: 'rectangle', x, y, w: mid, h: mid, color: defaultColor }
            : { type: 'triangle', x, y, r: mid, color: defaultColor };
          
          if (isValidShape(testShape)) {
            bestSize = mid;
            low = mid;
          } else {
            high = mid;
          }
        }
        
        if (bestSize >= adaptiveMinRadius) {
          if (tryPlaceShape(x, y, bestSize)) {
            consecutiveFailures = 0;
          } else {
            consecutiveFailures++;
          }
        } else {
          consecutiveFailures++;
        }
        
        totalAttempts++;
      }
    }
    
    // === GAP FILLING PASS ===
    if (enableGapFilling) {
      console.log('Running gap filling pass...');
      if (onProgress) onProgress(filledArea / regionArea, totalAttempts - shapes.length);
      
      const gapMaxRadius = adaptiveMinRadius * 2;
      const gapMinRadius = adaptiveMinRadius * 0.5;
      const gapAttempts = Math.floor(maxAttempts * 0.2); // Reduced from 0.3
      let gapPlaced = 0;
      let lastGapCount = -1;
      
      // Find gaps once every 100 attempts instead of every time
      for (let attempt = 0; attempt < gapAttempts; attempt++) {
        
        // Refresh gap positions periodically
        if (attempt % 100 === 0) {
          const gaps = findGapPositions(50);
          
          if (gaps.length === 0 || gaps.length === lastGapCount) {
            console.log('No new gaps found, ending gap filling early');
            break;
          }
          lastGapCount = gaps.length;
          
          // Process a batch of gaps
          for (const gap of gaps.slice(0, Math.min(20, gaps.length))) {
            const x = gap.x + (Math.random() - 0.5) * gridSize * 0.5;
            const y = gap.y + (Math.random() - 0.5) * gridSize * 0.5;
            
            // Try very small shapes
            const radius = gapMinRadius + Math.random() * (gapMaxRadius - gapMinRadius);
            
            // Try both circles and tiny rectangles
            if (tryPlaceShape(x, y, radius, 'circle') || 
                tryPlaceShape(x, y, radius * 0.8, 'rectangle')) {
              gapPlaced++;
            }
          }
          
          // Async break for UI
          if (onProgress) onProgress(filledArea / regionArea, totalAttempts - shapes.length);
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      console.log(`Gap filling placed: ${gapPlaced} tiny shapes`);
    }
    
    if (onProgress) {
      onProgress(filledArea / regionArea, totalAttempts - shapes.length);
    }
    
    const finalFillPercent = (filledArea / regionArea) * 100;
    
    console.log(`Region packing complete:
      - Coverage: ${finalFillPercent.toFixed(1)}%
      - Shapes placed: ${shapes.length}
      - Total attempts: ${totalAttempts}
      - Multi-pass: ${enableMultiPass}
      - Mixed shapes: ${enableMixedShapes}
      - Gap filling: ${enableGapFilling}
    `);
    
    return shapes;
  },
  
  // Micro-packing for small islands (20-100 pixels)
  async microPack(region, defaultColor, width, height, options = {}) {
    if (region.length === 0) return [];
    
    const shapes = [];
    const minRadius = Math.max(0.5, options.minRadius || 1);
    const maxRadius = Math.min(8, options.maxRadius || 5); // Increased from 5 to 8
    const maxAttempts = Math.min(region.length * 30, 3000); // Increased from 20x to 30x
    
    // Get bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (const p of region) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    
    // Create bitmap
    const bitmap = new Uint8Array(width * height);
    for (const p of region) {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      if (px >= 0 && px < width && py >= 0 && py < height) {
        bitmap[py * width + px] = 1;
      }
    }
    
    const isInRegion = (x, y) => {
      const px = Math.floor(x);
      const py = Math.floor(y);
      if (px < 0 || px >= width || py < 0 || py >= height) return false;
      return bitmap[py * width + px] === 1;
    };
    
    // Relaxed fit check - only 4 points for micro shapes
    const fitsWithinRegion = (shape) => {
      if (!isInRegion(shape.x, shape.y)) return false;
      
      // Only check 4 cardinal directions (faster)
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const px = shape.x + Math.cos(angle) * shape.r;
        const py = shape.y + Math.sin(angle) * shape.r;
        if (!isInRegion(px, py)) return false;
      }
      return true;
    };
    
    const overlaps = (s1, s2) => {
      const dx = s1.x - s2.x;
      const dy = s1.y - s2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < (s1.r + s2.r - 0.1); // Slightly tighter packing
    };
    
    const isValid = (newShape) => {
      if (!fitsWithinRegion(newShape)) return false;
      for (const shape of shapes) {
        if (overlaps(newShape, shape)) return false;
      }
      return true;
    };
    
    let consecutiveFailures = 0;
    const maxFailures = Math.floor(maxAttempts / 8); // More tolerant of failures
    
    for (let attempt = 0; attempt < maxAttempts && consecutiveFailures < maxFailures; attempt++) {
      // Pick random point from region
      const point = region[Math.floor(Math.random() * region.length)];
      const x = point.x;
      const y = point.y;
      
      // Binary search for largest possible micro circle
      let low = minRadius;
      let high = maxRadius;
      let bestRadius = 0;
      
      for (let i = 0; i < 6; i++) {
        const mid = (low + high) / 2;
        const testShape = { type: 'circle', x, y, r: mid, color: defaultColor };
        if (isValid(testShape)) {
          bestRadius = mid;
          low = mid;
        } else {
          high = mid;
        }
      }
      
      if (bestRadius >= minRadius) {
        shapes.push({ type: 'circle', x, y, r: bestRadius, color: defaultColor });
        consecutiveFailures = 0;
      } else {
        consecutiveFailures++;
      }
    }
    
    return shapes;
  },
  
  drawShapes(ctx, shapes) {
    for (const shape of shapes) {
      ctx.fillStyle = shape.color;
      
      if (shape.type === 'pixel') {
        // Draw single pixel
        ctx.fillRect(Math.floor(shape.x), Math.floor(shape.y), 1, 1);
      } else if (shape.type === 'circle') {
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape.type === 'rectangle') {
        ctx.fillRect(shape.x - shape.w / 2, shape.y - shape.h / 2, shape.w, shape.h);
      } else if (shape.type === 'triangle') {
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
          const px = shape.x + Math.cos(angle) * shape.r;
          const py = shape.y + Math.sin(angle) * shape.r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
  }
};
