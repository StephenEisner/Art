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

  // Simple region drawing - just fill all pixels in the region
  drawRegion(ctx, region, color) {
    ctx.fillStyle = color;
    for (const p of region) {
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
    }
  }
};
