// Enhanced packing algorithm with distance fields, hierarchical packing, and edge refinement
const Packing = {
  async packShapes(region, defaultColor, width, height, options = {}) {
    const {
      minRadius = 0.5,
      maxRadius = 30,
      maxAttempts = 20000,
      shapesPerBatch = 100,
      shapeType = 'circle',
      colorMode = 'centroid',
      packingMode = 'efficient',
      enableEdgeRefinement = true,
      targetFillPercent = 0.95,
      onProgress
    } = options;
    
    if (region.length === 0) {
      return { shapes: [], coveredArea: 0, coverage: 0 };
    }
    
    const shapes = [];
    const regionArea = region.length;
    let coveredArea = 0;
    
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
    const isElongated = aspectRatio > 3 || aspectRatio < 0.33;
    const isSparse = regionDensity < 0.4;
    const isTiny = regionArea < 100;
    
    // Adaptive parameters based on region characteristics
    let adaptiveMinRadius = minRadius;
    let adaptiveMaxRadius = maxRadius;
    let collisionPadding = 0.3;
    
    if (isTiny) {
      adaptiveMinRadius = Math.min(minRadius, 0.5);
      adaptiveMaxRadius = Math.min(maxRadius, Math.sqrt(regionArea) / 4);
      collisionPadding = 0.1;
    } else if (isElongated) {
      adaptiveMaxRadius = Math.min(maxRadius, Math.min(regionWidth, regionHeight) / 3);
      adaptiveMinRadius = Math.min(minRadius, 0.5);
      collisionPadding = 0.15;
    } else if (isSparse) {
      collisionPadding = 0.1;
    }
    
    console.log(`Region stats: ${regionArea}px, ${regionWidth.toFixed(0)}x${regionHeight.toFixed(0)}, density: ${regionDensity.toFixed(2)}, elongated: ${isElongated}, sparse: ${isSparse}`);
    
    // Create region bitmap
    const bitmap = new Uint8Array(width * height);
    const regionSet = new Set();
    for (const p of region) {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      if (px >= 0 && px < width && py >= 0 && py < height) {
        bitmap[py * width + px] = 1;
        regionSet.add(`${px},${py}`);
      }
    }
    
    // Compute distance field for efficient placement
    let distanceField = null;
    if (packingMode === 'efficient') {
      if (onProgress) onProgress(0, 'Computing distance field');
      distanceField = this.computeDistanceField(region, width, height, minX, maxX, minY, maxY);
    }
    
    // Helper functions
    const isInRegion = (x, y) => {
      const px = Math.floor(x);
      const py = Math.floor(y);
      return regionSet.has(`${px},${py}`);
    };
    
    const fitsWithinRegion = (shape) => {
      if (shape.type === 'circle') {
        if (!isInRegion(shape.x, shape.y)) return false;
        // More thorough checking with 16+ points
        const numChecks = Math.max(16, Math.ceil(shape.r * 2));
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
        for (let t = 0; t <= 1; t += 0.25) {
          if (!isInRegion(shape.x - hw + t * shape.w, shape.y - hh)) return false;
          if (!isInRegion(shape.x - hw + t * shape.w, shape.y + hh)) return false;
          if (!isInRegion(shape.x - hw, shape.y - hh + t * shape.h)) return false;
          if (!isInRegion(shape.x + hw, shape.y - hh + t * shape.h)) return false;
        }
        return true;
      } else if (shape.type === 'triangle') {
        const r = shape.r;
        for (let i = 0; i < 3; i++) {
          const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
          const px = shape.x + Math.cos(angle) * r;
          const py = shape.y + Math.sin(angle) * r;
          if (!isInRegion(px, py)) return false;
          
          // Check edge midpoints
          const nextAngle = ((i + 1) * 2 * Math.PI / 3) - Math.PI / 2;
          for (let t = 0.25; t <= 0.75; t += 0.25) {
            const edgeX = shape.x + (Math.cos(angle) * (1-t) + Math.cos(nextAngle) * t) * r;
            const edgeY = shape.y + (Math.sin(angle) * (1-t) + Math.sin(nextAngle) * t) * r;
            if (!isInRegion(edgeX, edgeY)) return false;
          }
        }
        return true;
      }
      return false;
    };
    
    const shapesCollide = (s1, s2) => {
      const dx = s1.x - s2.x;
      const dy = s1.y - s2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (s1.type === 'circle' && s2.type === 'circle') {
        return dist < (s1.r + s2.r - collisionPadding);
      } else if (s1.type === 'rectangle' && s2.type === 'rectangle') {
        return Math.abs(dx) < (s1.w / 2 + s2.w / 2 - collisionPadding) &&
               Math.abs(dy) < (s1.h / 2 + s2.h / 2 - collisionPadding);
      } else {
        const r1 = s1.r || Math.max(s1.w, s1.h) / 2;
        const r2 = s2.r || Math.max(s2.w, s2.h) / 2;
        return dist < (r1 + r2 - collisionPadding);
      }
    };
    
    const isValidShape = (newShape) => {
      if (!fitsWithinRegion(newShape)) return false;
      for (const shape of shapes) {
        if (shapesCollide(newShape, shape)) return false;
      }
      return true;
    };
    
    const getShapeColor = (x, y, size) => {
      const match = defaultColor.match(/\d+/g);
      if (!match) return defaultColor;
      const [r, g, b] = match.map(Number);
      
      switch (colorMode) {
        case 'variance':
          const variance = 30;
          return `rgb(${Math.max(0, Math.min(255, r + (Math.random() - 0.5) * variance))}, ${Math.max(0, Math.min(255, g + (Math.random() - 0.5) * variance))}, ${Math.max(0, Math.min(255, b + (Math.random() - 0.5) * variance))})`;
        case 'gradient':
          const gradientFactor = ((x - minX) / regionWidth + (y - minY) / regionHeight) / 2;
          return `rgb(${Math.floor(r * (0.5 + gradientFactor * 0.5))}, ${Math.floor(g * (0.5 + gradientFactor * 0.5))}, ${Math.floor(b * (0.5 + gradientFactor * 0.5))})`;
        default:
          return defaultColor;
      }
    };
    
    const createShape = (x, y, radius, type = shapeType) => {
      const color = getShapeColor(x, y, radius);
      
      if (type === 'mixed') {
        const rand = Math.random();
        type = rand < 0.5 ? 'circle' : rand < 0.75 ? 'rectangle' : 'triangle';
      }
      
      if (type === 'circle') {
        return { type: 'circle', x, y, r: radius, color };
      } else if (type === 'rectangle') {
        const aspect = 0.7 + Math.random() * 0.6;
        return { type: 'rectangle', x, y, w: radius * aspect, h: radius / aspect, color };
      } else if (type === 'triangle') {
        return { type: 'triangle', x, y, r: radius, color };
      }
    };
    
    const tryPlaceShape = (x, y, radius) => {
      const shape = createShape(x, y, radius);
      if (isValidShape(shape)) {
        shapes.push(shape);
        
        // Calculate area
        if (shape.type === 'circle') {
          coveredArea += Math.PI * shape.r * shape.r;
        } else if (shape.type === 'rectangle') {
          coveredArea += shape.w * shape.h;
        } else if (shape.type === 'triangle') {
          coveredArea += (Math.sqrt(3) / 4) * shape.r * shape.r;
        }
        return true;
      }
      return false;
    };
    
    // Main packing phase
    if (onProgress) onProgress(0, 'Main packing');
    
    if (packingMode === 'efficient' && distanceField) {
      // Distance field-based placement - start from areas furthest from edges
      const candidates = this.findLocalMaxima(distanceField, minX, maxX, minY, maxY);
      candidates.sort((a, b) => b.distance - a.distance);
      
      // Try to place largest possible shapes at best positions
      for (let i = 0; i < Math.min(candidates.length, maxAttempts / 10); i++) {
        const candidate = candidates[i];
        const maxPossibleRadius = Math.min(candidate.distance, adaptiveMaxRadius);
        
        // Binary search for largest fitting radius
        let low = adaptiveMinRadius;
        let high = maxPossibleRadius;
        let bestRadius = 0;
        
        for (let j = 0; j < 10; j++) {
          const mid = (low + high) / 2;
          const testShape = createShape(candidate.x, candidate.y, mid);
          
          if (isValidShape(testShape)) {
            bestRadius = mid;
            low = mid;
          } else {
            high = mid;
          }
        }
        
        if (bestRadius > adaptiveMinRadius) {
          tryPlaceShape(candidate.x, candidate.y, bestRadius);
        }
        
        if (i % shapesPerBatch === 0) {
          if (onProgress) onProgress(coveredArea / regionArea, 'Distance field placement');
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
    
    // Multi-pass random/ordered packing
    const passes = [
      { sizeRange: [0.7, 1.0], attempts: maxAttempts * 0.3 },
      { sizeRange: [0.4, 0.7], attempts: maxAttempts * 0.3 },
      { sizeRange: [0.2, 0.4], attempts: maxAttempts * 0.2 },
      { sizeRange: [0, 0.2], attempts: maxAttempts * 0.2 }
    ];
    
    for (let passIndex = 0; passIndex < passes.length; passIndex++) {
      const pass = passes[passIndex];
      const passMinRadius = adaptiveMinRadius + (adaptiveMaxRadius - adaptiveMinRadius) * pass.sizeRange[0];
      const passMaxRadius = adaptiveMinRadius + (adaptiveMaxRadius - adaptiveMinRadius) * pass.sizeRange[1];
      
      for (let attempt = 0; attempt < pass.attempts; attempt++) {
        // Choose position based on mode
        let x, y;
        if (packingMode === 'ordered') {
          // Grid-based ordered placement
          const gridStep = passMaxRadius * 2;
          const gx = (attempt % Math.ceil(regionWidth / gridStep)) * gridStep + minX;
          const gy = Math.floor(attempt / Math.ceil(regionWidth / gridStep)) * gridStep + minY;
          x = gx + (Math.random() - 0.5) * gridStep * 0.8;
          y = gy + (Math.random() - 0.5) * gridStep * 0.8;
        } else {
          // Random placement
          x = minX + Math.random() * regionWidth;
          y = minY + Math.random() * regionHeight;
        }
        
        // Try different sizes
        const sizesToTry = 3;
        for (let s = 0; s < sizesToTry; s++) {
          const sizeRatio = 1 - s / sizesToTry;
          const radius = passMinRadius + (passMaxRadius - passMinRadius) * sizeRatio * Math.random();
          
          if (tryPlaceShape(x, y, radius)) {
            break;
          }
        }
        
        if (attempt % shapesPerBatch === 0) {
          if (onProgress) onProgress(coveredArea / regionArea, `Pass ${passIndex + 1}/4`);
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // Early exit if target reached
        if (coveredArea / regionArea >= targetFillPercent) {
          break;
        }
      }
    }
    
    // Hierarchical gap filling for remaining spaces
    if (coveredArea / regionArea < 0.7 && shapes.length > 0) {
      if (onProgress) onProgress(coveredArea / regionArea, 'Gap filling');
      
      const gaps = this.findGaps(region, shapes, width, height, minX, maxX, minY, maxY);
      const microRadius = Math.min(adaptiveMinRadius, 1);
      
      for (const gap of gaps) {
        // Try tiny shapes in gaps
        for (let attempt = 0; attempt < 10; attempt++) {
          const radius = microRadius + Math.random() * microRadius * 2;
          tryPlaceShape(gap.x, gap.y, radius);
        }
      }
    }
    
    // Edge refinement - fill edges with micro shapes
    if (enableEdgeRefinement && coveredArea / regionArea < 0.9) {
      if (onProgress) onProgress(coveredArea / regionArea, 'Edge refinement');
      
      const edgePixels = this.findEdgePixels(region, shapes, minX, maxX, minY, maxY);
      const edgeRadius = Math.min(0.5, adaptiveMinRadius);
      
      for (let i = 0; i < Math.min(edgePixels.length, 1000); i++) {
        const pixel = edgePixels[i];
        const microShape = createShape(pixel.x, pixel.y, edgeRadius);
        if (isValidShape(microShape)) {
          shapes.push(microShape);
          coveredArea += Math.PI * edgeRadius * edgeRadius;
        }
        
        if (i % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
    
    const coverage = (coveredArea / regionArea) * 100;
    console.log(`Region packing complete: ${coverage.toFixed(1)}% coverage, ${shapes.length} shapes`);
    
    return {
      shapes: shapes,
      coveredArea: coveredArea,
      coverage: coverage
    };
  },
  
  computeDistanceField(region, width, height, minX, maxX, minY, maxY) {
    const fieldWidth = Math.ceil(maxX - minX) + 1;
    const fieldHeight = Math.ceil(maxY - minY) + 1;
    const field = new Float32Array(fieldWidth * fieldHeight);
    
    // Initialize with large values for pixels in region, 0 for outside
    const regionSet = new Set(region.map(p => `${Math.floor(p.x)},${Math.floor(p.y)}`));
    
    for (let y = 0; y < fieldHeight; y++) {
      for (let x = 0; x < fieldWidth; x++) {
        const wx = Math.floor(minX + x);
        const wy = Math.floor(minY + y);
        field[y * fieldWidth + x] = regionSet.has(`${wx},${wy}`) ? 1000 : 0;
      }
    }
    
    // Compute distance transform using chamfer distance
    // Forward pass
    for (let y = 1; y < fieldHeight; y++) {
      for (let x = 1; x < fieldWidth; x++) {
        const idx = y * fieldWidth + x;
        if (field[idx] > 0) {
          field[idx] = Math.min(
            field[idx],
            field[(y - 1) * fieldWidth + x] + 1,
            field[y * fieldWidth + (x - 1)] + 1,
            field[(y - 1) * fieldWidth + (x - 1)] + 1.4
          );
        }
      }
    }
    
    // Backward pass
    for (let y = fieldHeight - 2; y >= 0; y--) {
      for (let x = fieldWidth - 2; x >= 0; x--) {
        const idx = y * fieldWidth + x;
        if (field[idx] > 0) {
          field[idx] = Math.min(
            field[idx],
            field[(y + 1) * fieldWidth + x] + 1,
            field[y * fieldWidth + (x + 1)] + 1,
            field[(y + 1) * fieldWidth + (x + 1)] + 1.4
          );
        }
      }
    }
    
    return { data: field, width: fieldWidth, height: fieldHeight };
  },
  
  findLocalMaxima(distanceField, minX, maxX, minY, maxY) {
    const { data, width, height } = distanceField;
    const maxima = [];
    
    // Sample the field to find good placement positions
    const step = Math.max(2, Math.floor(Math.min(width, height) / 50));
    
    for (let y = step; y < height - step; y += step) {
      for (let x = step; x < width - step; x += step) {
        const idx = y * width + x;
        const dist = data[idx];
        
        if (dist > 1) {
          // Check if local maximum
          let isMaximum = true;
          for (let dy = -step; dy <= step; dy += step) {
            for (let dx = -step; dx <= step; dx += step) {
              if (dx === 0 && dy === 0) continue;
              const nidx = (y + dy) * width + (x + dx);
              if (nidx >= 0 && nidx < data.length && data[nidx] > dist) {
                isMaximum = false;
                break;
              }
            }
            if (!isMaximum) break;
          }
          
          if (isMaximum) {
            maxima.push({
              x: minX + x,
              y: minY + y,
              distance: dist
            });
          }
        }
      }
    }
    
    // Add some random positions for variety
    for (let i = 0; i < 50; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const idx = y * width + x;
      if (data[idx] > 1) {
        maxima.push({
          x: minX + x,
          y: minY + y,
          distance: data[idx]
        });
      }
    }
    
    return maxima;
  },
  
  findGaps(region, shapes, width, height, minX, maxX, minY, maxY) {
    const gaps = [];
    const gridSize = 5;
    const gridWidth = Math.ceil((maxX - minX) / gridSize);
    const gridHeight = Math.ceil((maxY - minY) / gridSize);
    
    const regionSet = new Set(region.map(p => `${Math.floor(p.x)},${Math.floor(p.y)}`));
    
    // Check grid cells for gaps
    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        const x = minX + (gx + 0.5) * gridSize;
        const y = minY + (gy + 0.5) * gridSize;
        
        // Check if in region
        if (!regionSet.has(`${Math.floor(x)},${Math.floor(y)}`)) continue;
        
        // Check if covered by any shape
        let covered = false;
        for (const shape of shapes) {
          const dx = x - shape.x;
          const dy = y - shape.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (shape.type === 'circle' && dist < shape.r) {
            covered = true;
            break;
          } else if (shape.type === 'rectangle' && 
                     Math.abs(dx) < shape.w / 2 && 
                     Math.abs(dy) < shape.h / 2) {
            covered = true;
            break;
          } else if (shape.type === 'triangle' && dist < shape.r) {
            covered = true;
            break;
          }
        }
        
        if (!covered) {
          gaps.push({ x, y });
        }
      }
    }
    
    return gaps;
  },
  
  findEdgePixels(region, shapes, minX, maxX, minY, maxY) {
    const edges = [];
    const regionSet = new Set(region.map(p => `${Math.floor(p.x)},${Math.floor(p.y)}`));
    
    // Find pixels at the edge of the region
    for (const p of region) {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      
      // Check if edge pixel (has a non-region neighbor)
      let isEdge = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (!regionSet.has(`${px + dx},${py + dy}`)) {
            isEdge = true;
            break;
          }
        }
        if (isEdge) break;
      }
      
      if (isEdge) {
        // Check if not covered by existing shapes
        let covered = false;
        for (const shape of shapes) {
          const dx = px - shape.x;
          const dy = py - shape.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (shape.type === 'circle' && dist < shape.r - 0.5) {
            covered = true;
            break;
          }
        }
        
        if (!covered) {
          edges.push({ x: px + 0.5, y: py + 0.5 });
        }
      }
    }
    
    // Shuffle for random edge filling
    for (let i = edges.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [edges[i], edges[j]] = [edges[j], edges[i]];
    }
    
    return edges;
  },
  
  drawShapes(ctx, shapes) {
    for (const shape of shapes) {
      ctx.fillStyle = shape.color;
      
      if (shape.type === 'circle') {
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape.type === 'rectangle') {
        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.fillRect(-shape.w / 2, -shape.h / 2, shape.w, shape.h);
        ctx.restore();
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
