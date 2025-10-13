// Advanced circle packing algorithm with grid-based gap detection
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
    
    console.log(`Region: ${regionArea} pixels, ${regionWidth.toFixed(0)}x${regionHeight.toFixed(0)}, density: ${regionDensity.toFixed(2)}`);
    
    // Create region bitmap
    const bitmap = new Uint8Array(width * height);
    for (const p of region) {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      if (px >= 0 && px < width && py >= 0 && py < height) {
        bitmap[py * width + px] = 1;
      }
    }
    
    // Create coverage grid for gap detection (lower resolution for speed)
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
        const r1 = s1.r || Math.max(s1.w, s1.h) / 2;
        const r2 = s2.r || Math.max(s2.w, s2.h) / 2;
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
      const r = shape.r || Math.max(shape.w, shape.h) / 2;
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
    
    const tryPlaceShape = (x, y, radius) => {
      const color = getShapeColor(x, y, radius);
      let testShape;
      
      if (shapeType === 'circle') {
        testShape = { type: 'circle', x, y, r: radius, color };
      } else if (shapeType === 'rectangle') {
        testShape = { type: 'rectangle', x, y, w: radius, h: radius, color };
      } else if (shapeType === 'triangle') {
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
    
    // Multi-pass packing with decreasing sizes
    const numPasses = 5;
    let totalAttempts = 0;
    
    if (onProgress) onProgress(0, 0);
    await new Promise(resolve => setTimeout(resolve, 0));
    
    for (let pass = 0; pass < numPasses; pass++) {
      const passProgress = pass / numPasses;
      const remainingProgress = 1 - passProgress;
      
      // Decrease radius range each pass
      const currentMaxRadius = adaptiveMaxRadius * (1 - passProgress * 0.7);
      const currentMinRadius = adaptiveMinRadius + (adaptiveMaxRadius - adaptiveMinRadius) * passProgress * 0.5;
      
      const passAttempts = Math.floor(maxAttempts / numPasses);
      let passPlaced = 0;
      
      console.log(`Pass ${pass + 1}/${numPasses}: radius ${currentMinRadius.toFixed(1)}-${currentMaxRadius.toFixed(1)}`);
      
      for (let attempt = 0; attempt < passAttempts; attempt++) {
        const fillPercent = filledArea / regionArea;
        
        if (attempt % shapesPerBatch === 0) {
          if (onProgress) {
            onProgress(fillPercent, totalAttempts - shapes.length);
          }
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        let x, y, radius;
        
        // Use gap-finding for later passes or when coverage is decent
        if (pass >= 2 || fillPercent > 0.3) {
          const gaps = findGapPositions(30);
          if (gaps.length > 0) {
            const gap = gaps[Math.floor(Math.random() * gaps.length)];
            x = gap.x + (Math.random() - 0.5) * gridSize;
            y = gap.y + (Math.random() - 0.5) * gridSize;
          } else {
            x = minX + Math.random() * regionWidth;
            y = minY + Math.random() * regionHeight;
          }
        } else {
          x = minX + Math.random() * regionWidth;
          y = minY + Math.random() * regionHeight;
        }
        
        // Try multiple radii (larger first in early passes, smaller in later passes)
        const radiusAttempts = pass < 2 ? 3 : 5;
        let placed = false;
        
        for (let r = 0; r < radiusAttempts; r++) {
          if (packingMode === 'efficient' && r === 0) {
            // Binary search for largest fit
            let low = currentMinRadius;
            let high = currentMaxRadius;
            let bestSize = 0;
            
            for (let i = 0; i < 8; i++) {
              const mid = (low + high) / 2;
              const testShape = shapeType === 'circle' 
                ? { type: 'circle', x, y, r: mid, color: defaultColor }
                : shapeType === 'rectangle'
                ? { type: 'rectangle', x, y, w: mid, h: mid, color: defaultColor }
                : { type: 'triangle', x, y, r: mid, color: defaultColor };
              
              if (isValidShape(testShape)) {
                bestSize = mid;
                low = mid;
              } else {
                high = mid;
              }
            }
            
            if (bestSize > currentMinRadius) {
              radius = bestSize;
              if (tryPlaceShape(x, y, radius)) {
                placed = true;
                passPlaced++;
                break;
              }
            }
          } else {
            // Random radius, biased towards smaller on later attempts
            const bias = Math.pow(1 - r / radiusAttempts, 2);
            radius = currentMinRadius + (currentMaxRadius - currentMinRadius) * bias * Math.random();
            
            if (tryPlaceShape(x, y, radius)) {
              placed = true;
              passPlaced++;
              break;
            }
          }
        }
        
        totalAttempts++;
      }
      
      console.log(`Pass ${pass + 1} placed: ${passPlaced} shapes`);
      
      // If we're not placing anything, break early
      if (passPlaced < 10 && pass >= 2) {
        console.log('Not placing enough shapes, stopping early');
        break;
      }
    }
    
    if (onProgress) {
      onProgress(filledArea / regionArea, totalAttempts - shapes.length);
    }
    
    const finalFillPercent = (filledArea / regionArea) * 100;
    
    console.log(`Region packing complete:
      - Coverage: ${finalFillPercent.toFixed(1)}%
      - Shapes placed: ${shapes.length}
      - Total attempts: ${totalAttempts}
    `);
    
    return shapes;
  },
  
  drawShapes(ctx, shapes) {
    for (const shape of shapes) {
      ctx.fillStyle = shape.color;
      
      if (shape.type === 'circle') {
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
