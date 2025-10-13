// Geometry utilities with morphological operations for region processing
const Geometry = {
  extractRegions(assignments, width, height, k) {
    console.log(`Extracting ${k} regions from ${assignments.length} pixels`);
    const regions = Array(k).fill(null).map(() => []);
    
    // Process in chunks to avoid blocking
    for (let i = 0; i < assignments.length; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      const cluster = assignments[i];
      if (cluster >= 0 && cluster < k) {
        regions[cluster].push({ x, y });
      }
    }
    
    return regions;
  },

  // Simple region drawing - just fill all pixels in the region
  drawRegion(ctx, region, color) {
    ctx.fillStyle = color;
    // Draw in batches for better performance
    ctx.beginPath();
    for (let i = 0; i < region.length; i++) {
      const p = region[i];
      ctx.rect(Math.floor(p.x), Math.floor(p.y), 1, 1);
      
      // Flush every 1000 rectangles
      if (i % 1000 === 999) {
        ctx.fill();
        ctx.beginPath();
      }
    }
    ctx.fill();
  },
  
  // Fast morphological close for large regions
  morphologicalCloseFast(region, width, height, radius = 2) {
    if (radius === 0 || region.length === 0) return region;
    
    // For very large regions, use a simpler approach
    if (region.length > 20000) {
      console.log(`Using fast morphology for large region (${region.length} pixels)`);
      return this.morphologicalCloseSimple(region, width, height, Math.min(radius, 1));
    }
    
    // Standard approach for smaller regions
    const dilated = this.dilateRegionFast(region, width, height, radius);
    const eroded = this.erodeRegionFast(dilated, width, height, Math.max(1, radius - 1));
    
    return eroded;
  },
  
  // Simpler morphological close for very large regions
  morphologicalCloseSimple(region, width, height, radius) {
    // Create a bitmap for fast lookup
    const bitmap = new Uint8Array(width * height);
    for (const p of region) {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      if (px >= 0 && px < width && py >= 0 && py < height) {
        bitmap[py * width + px] = 1;
      }
    }
    
    // Simple dilation - just add immediate neighbors
    const expanded = [];
    for (const p of region) {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      expanded.push({ x: px, y: py });
      
      // Add 4-connected neighbors
      if (px > 0 && bitmap[(py * width + px - 1)] === 0) {
        expanded.push({ x: px - 1, y: py });
        bitmap[py * width + px - 1] = 2;
      }
      if (px < width - 1 && bitmap[py * width + px + 1] === 0) {
        expanded.push({ x: px + 1, y: py });
        bitmap[py * width + px + 1] = 2;
      }
      if (py > 0 && bitmap[(py - 1) * width + px] === 0) {
        expanded.push({ x: px, y: py - 1 });
        bitmap[(py - 1) * width + px] = 2;
      }
      if (py < height - 1 && bitmap[(py + 1) * width + px] === 0) {
        expanded.push({ x: px, y: py + 1 });
        bitmap[(py + 1) * width + px] = 2;
      }
    }
    
    return expanded;
  },
  
  // Optimized dilate region
  dilateRegionFast(region, width, height, radius) {
    const expanded = new Map();
    const radiusSq = radius * radius;
    
    // Pre-calculate the structuring element
    const offsets = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radiusSq) {
          offsets.push([dx, dy]);
        }
      }
    }
    
    for (const p of region) {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      
      // Add all pixels within radius
      for (const [dx, dy] of offsets) {
        const nx = px + dx;
        const ny = py + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const key = ny * width + nx;
          if (!expanded.has(key)) {
            expanded.set(key, { x: nx, y: ny });
          }
        }
      }
    }
    
    return Array.from(expanded.values());
  },
  
  // Optimized erode region
  erodeRegionFast(region, width, height, radius) {
    // Create a bitmap for fast lookup
    const bitmap = new Uint8Array(width * height);
    for (const p of region) {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      if (px >= 0 && px < width && py >= 0 && py < height) {
        bitmap[py * width + px] = 1;
      }
    }
    
    const eroded = [];
    const radiusSq = radius * radius;
    
    for (const p of region) {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      let keepPixel = true;
      
      // Check if all pixels within radius are in the region
      for (let dy = -radius; dy <= radius && keepPixel; dy++) {
        for (let dx = -radius; dx <= radius && keepPixel; dx++) {
          if (dx * dx + dy * dy <= radiusSq) {
            const nx = px + dx;
            const ny = py + dy;
            
            if (nx < 0 || nx >= width || ny < 0 || ny >= height || bitmap[ny * width + nx] === 0) {
              keepPixel = false;
            }
          }
        }
      }
      
      if (keepPixel) {
        eroded.push({ x: px, y: py });
      }
    }
    
    return eroded;
  },
  
  // Keep old method name for compatibility but use fast version
  morphologicalClose(region, width, height, radius = 2) {
    return this.morphologicalCloseFast(region, width, height, radius);
  },
  
  // Keep old method names for compatibility but use fast versions
  dilateRegion(region, width, height, radius) {
    return this.dilateRegionFast(region, width, height, radius);
  },
  
  erodeRegion(region, width, height, radius) {
    return this.erodeRegionFast(region, width, height, radius);
  },
  
  // Alternative: Morphological open operation (erode then dilate) to remove small protrusions
  morphologicalOpen(region, width, height, radius = 2) {
    if (radius === 0 || region.length === 0) return region;
    
    // First erode to remove small features
    const eroded = this.erodeRegionFast(region, width, height, radius);
    
    // Then dilate to restore size
    const dilated = this.dilateRegionFast(eroded, width, height, radius);
    
    return dilated;
  },
  
  // Fill holes in a region
  fillHoles(region, width, height) {
    // Create a bitmap of the region
    const bitmap = new Uint8Array(width * height);
    for (const p of region) {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      if (px >= 0 && px < width && py >= 0 && py < height) {
        bitmap[py * width + px] = 1;
      }
    }
    
    // Flood fill from edges to find exterior
    const exterior = new Uint8Array(width * height);
    const queue = [];
    
    // Start flood fill from all edge pixels
    for (let x = 0; x < width; x++) {
      queue.push([x, 0]);
      queue.push([x, height - 1]);
    }
    for (let y = 1; y < height - 1; y++) {
      queue.push([0, y]);
      queue.push([width - 1, y]);
    }
    
    // Flood fill exterior
    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (exterior[idx] === 1 || bitmap[idx] === 1) continue;
      
      exterior[idx] = 1;
      
      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }
    
    // Combine original region with filled holes (everything not exterior)
    const filled = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (bitmap[idx] === 1 || exterior[idx] === 0) {
          filled.push({ x, y });
        }
      }
    }
    
    return filled;
  },
  
  // Smooth region boundaries
  smoothRegion(region, width, height, iterations = 2) {
    let smoothed = region;
    
    for (let iter = 0; iter < iterations; iter++) {
      // Apply small radius open followed by close
      smoothed = this.morphologicalOpen(smoothed, width, height, 1);
      smoothed = this.morphologicalClose(smoothed, width, height, 1);
    }
    
    return smoothed;
  },
  
  // Get connected components (separate disconnected parts of a region)
  getConnectedComponents(region) {
    if (region.length === 0) return [];
    
    const pointSet = new Set(region.map(p => `${Math.floor(p.x)},${Math.floor(p.y)}`));
    const visited = new Set();
    const components = [];
    
    for (const p of region) {
      const key = `${Math.floor(p.x)},${Math.floor(p.y)}`;
      if (visited.has(key)) continue;
      
      // BFS to find connected component
      const component = [];
      const queue = [p];
      
      while (queue.length > 0) {
        const current = queue.shift();
        const cx = Math.floor(current.x);
        const cy = Math.floor(current.y);
        const ckey = `${cx},${cy}`;
        
        if (visited.has(ckey)) continue;
        visited.add(ckey);
        component.push({ x: cx, y: cy });
        
        // Check 8-connected neighbors
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nkey = `${cx + dx},${cy + dy}`;
            if (pointSet.has(nkey) && !visited.has(nkey)) {
              queue.push({ x: cx + dx, y: cy + dy });
            }
          }
        }
      }
      
      if (component.length > 0) {
        components.push(component);
      }
    }
    
    return components;
  },
  
  // Remove small components from a region
  removeSmallComponents(region, minSize = 10) {
    const components = this.getConnectedComponents(region);
    const filtered = [];
    
    for (const component of components) {
      if (component.length >= minSize) {
        filtered.push(...component);
      }
    }
    
    return filtered;
  }
};
