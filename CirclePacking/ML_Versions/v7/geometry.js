// Geometry utilities for region processing
const Geometry = {
  extractRegions(assignments, width, height, k) {
    const regions = Array(k).fill(null).map(() => []);
    
    for (let i = 0; i < assignments.length; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      regions[assignments[i]].push({ x, y });
    }
    
    return regions;
  },

  // Find connected components (separate islands) within a region
  findConnectedComponents(pixels, width, height) {
    if (pixels.length === 0) return [];
    
    // Create a fast lookup map for pixel existence
    const pixelMap = new Set();
    for (const p of pixels) {
      pixelMap.add(`${Math.floor(p.x)},${Math.floor(p.y)}`);
    }
    
    const visited = new Set();
    const components = [];
    
    for (const pixel of pixels) {
      const key = `${Math.floor(pixel.x)},${Math.floor(pixel.y)}`;
      if (visited.has(key)) continue;
      
      // Flood fill from this pixel to find connected component
      const component = [];
      const queue = [pixel];
      visited.add(key);
      
      while (queue.length > 0) {
        const p = queue.shift();
        component.push(p);
        
        // Check 8-connected neighbors
        const neighbors = [
          {x: p.x - 1, y: p.y},     // left
          {x: p.x + 1, y: p.y},     // right
          {x: p.x, y: p.y - 1},     // up
          {x: p.x, y: p.y + 1},     // down
          {x: p.x - 1, y: p.y - 1}, // top-left
          {x: p.x + 1, y: p.y - 1}, // top-right
          {x: p.x - 1, y: p.y + 1}, // bottom-left
          {x: p.x + 1, y: p.y + 1}  // bottom-right
        ];
        
        for (const n of neighbors) {
          const nKey = `${Math.floor(n.x)},${Math.floor(n.y)}`;
          if (!visited.has(nKey) && pixelMap.has(nKey)) {
            visited.add(nKey);
            queue.push(n);
          }
        }
      }
      
      components.push(component);
    }
    
    // Sort by size (largest first) for better visual results
    components.sort((a, b) => b.length - a.length);
    
    return components;
  },

  // Simple region drawing - just fill all pixels in the region
  drawRegion(ctx, region, color) {
    ctx.fillStyle = color;
    for (const p of region) {
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
    }
  }
};
