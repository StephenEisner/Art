// Circle packing algorithm with multiple packing strategies
const Packing = {
  async packCircles(region, defaultColor, width, height, options = {}) {
    console.log('packCircles called with:');
    console.log('- region.length:', region.length);
    console.log('- defaultColor:', defaultColor);
    console.log('- width x height:', width, 'x', height);
    console.log('- options:', options);
    console.log('- onProgress exists?', typeof options.onProgress);
    
    const {
      minRadius = 3,
      maxRadius = 50,
      maxAttempts = 5000,
      shapesPerBatch = 50,
      shapeType = 'circle',
      colorMode = 'centroid',
      packingMode = 'random',
      targetFillPercent = 0.95,
      onProgress
    } = options;
    

    // Call progress at the start
    if (onProgress && typeof onProgress === 'function') {
      onProgress(0, 0);
    }
    await new Promise(resolve => setTimeout(resolve, 0));
     
    if (region.length === 0) return [];

    if (onProgress && typeof onProgress === 'function') {
      onProgress(2, 2);
    }
    await new Promise(resolve => setTimeout(resolve, 0));
 
    const shapes = [];
    const regionArea = region.length;
    let filledArea = 0;
    let attempts = 0;
    let failedAttempts = 0;
 
    if (onProgress && typeof onProgress === 'function') {
      onProgress(3, 3);
    }
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Get bounding box - don't use spread operator on large arrays!
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (const p of region) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }    

    // Create region bitmap
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
    
    const fitsWithinRegion = (shape) => {
      if (shape.type === 'circle') {
        // Check center and perimeter
        if (!isInRegion(shape.x, shape.y)) return false;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          const px = shape.x + Math.cos(angle) * shape.r;
          const py = shape.y + Math.sin(angle) * shape.r;
          if (!isInRegion(px, py)) return false;
        }
        return true;
      } else if (shape.type === 'rectangle') {
        // Check corners
        const hw = shape.w / 2;
        const hh = shape.h / 2;
        return isInRegion(shape.x - hw, shape.y - hh) &&
               isInRegion(shape.x + hw, shape.y - hh) &&
               isInRegion(shape.x - hw, shape.y + hh) &&
               isInRegion(shape.x + hw, shape.y + hh);
      } else if (shape.type === 'triangle') {
        // Check vertices
        const r = shape.r;
        for (let i = 0; i < 3; i++) {
          const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
          const px = shape.x + Math.cos(angle) * r;
          const py = shape.y + Math.sin(angle) * r;
          if (!isInRegion(px, py)) return false;
        }
        return true;
      }
      return false;
    };
       if (options.onProgress) {
        options.onProgress(3,3);
        await new Promise(resolve => setTimeout(resolve, 0));
      }

    const shapesCollide = (s1, s2) => {
      const dx = s1.x - s2.x;
      const dy = s1.y - s2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (s1.type === 'circle' && s2.type === 'circle') {
        return dist < s1.r + s2.r;
      } else if (s1.type === 'rectangle' && s2.type === 'rectangle') {
        return Math.abs(dx) < (s1.w / 2 + s2.w / 2) &&
               Math.abs(dy) < (s1.h / 2 + s2.h / 2);
      } else {
        // Approximation for mixed types
        const r1 = s1.r || Math.max(s1.w, s1.h) / 2;
        const r2 = s2.r || Math.max(s2.w, s2.h) / 2;
        return dist < r1 + r2;
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
      switch (colorMode) {
        case 'centroid':
          return defaultColor;
        case 'random':
          return `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
        case 'variance':
          // Parse RGB from default color
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
            const ratio = (size - minRadius) / (maxRadius - minRadius);
            return `rgb(${Math.floor(r * ratio)}, ${Math.floor(g * ratio)}, ${Math.floor(b * ratio)})`;
          }
          return defaultColor;
        default:
          return defaultColor;
      }
    };
    
    const createRandomShape = () => {
      const size = minRadius + Math.random() * (maxRadius - minRadius);
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      const color = getShapeColor(x, y, size);
      
      if (shapeType === 'circle') {
        return { type: 'circle', x, y, r: size, color };
      } else if (shapeType === 'rectangle') {
        return { type: 'rectangle', x, y, w: size, h: size, color };
      } else if (shapeType === 'triangle') {
        return { type: 'triangle', x, y, r: size, color };
      }
    };
    
    const createLargestShape = () => {
      // Pick random position
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      
      // Binary search for largest size
      let low = minRadius;
      let high = maxRadius;
      let bestSize = minRadius;
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        let testShape;
        
        if (shapeType === 'circle') {
          testShape = { type: 'circle', x, y, r: mid, color: defaultColor };
        } else if (shapeType === 'rectangle') {
          testShape = { type: 'rectangle', x, y, w: mid, h: mid, color: defaultColor };
        } else if (shapeType === 'triangle') {
          testShape = { type: 'triangle', x, y, r: mid, color: defaultColor };
        }
        
        if (isValidShape(testShape)) {
          bestSize = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      
      const color = getShapeColor(x, y, bestSize);
      
      if (shapeType === 'circle') {
        return { type: 'circle', x, y, r: bestSize, color };
      } else if (shapeType === 'rectangle') {
        return { type: 'rectangle', x, y, w: bestSize, h: bestSize, color };
      } else if (shapeType === 'triangle') {
        return { type: 'triangle', x, y, r: bestSize, color };
      }
    };
    
// Main packing loop
    let lastProgressUpdate = 0;
    
    // Call progress at the start
    if (options.onProgress) {
      options.onProgress(0, 0);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    while (attempts < maxAttempts) {
      const fillPercent = filledArea / regionArea;
      
      // Yield to browser and update progress every batch OR every 1% of fill
      const shouldUpdate = (attempts % shapesPerBatch === 0) || 
                          (Math.floor(fillPercent * 100) > lastProgressUpdate);
      
      if (shouldUpdate) {
        if (options.onProgress) {
          options.onProgress(fillPercent, failedAttempts);
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        lastProgressUpdate = Math.floor(fillPercent * 100);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      // Stop at target fill
      if (fillPercent >= targetFillPercent) break;
      
      let newShape;
      if (packingMode === 'efficient') {
        newShape = createLargestShape();
      } else {
        newShape = createRandomShape();
      }
      
      if (isValidShape(newShape)) {
        shapes.push(newShape);
        
        // Calculate area
        if (newShape.type === 'circle') {
          filledArea += Math.PI * newShape.r * newShape.r;
        } else if (newShape.type === 'rectangle') {
          filledArea += newShape.w * newShape.h;
        } else if (newShape.type === 'triangle') {
          filledArea += (Math.sqrt(3) / 4) * newShape.r * newShape.r;
        }
      } else {
        failedAttempts++;
      }
      
      attempts++;
    }
    
    // Final progress update
    if (options.onProgress) {
      options.onProgress(filledArea / regionArea, failedAttempts);
    }
    
    return shapes;  },
  
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
