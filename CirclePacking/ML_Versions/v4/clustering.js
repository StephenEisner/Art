// K-means clustering algorithm with spatial weighting optimized for natural images
const Clustering = {
  async kMeans(pixels, k, width, height, spatialWeight = 0.65, maxIter = 25, onProgress) {
    // Higher spatial weight creates more coherent regions that are easier to pack
    const spatialScale = 255 / Math.max(width, height);
    
    // Initialize centroids using k-means++ for better starting positions
    let centroids = await this.kMeansPlusPlus(pixels, k, width, height, spatialWeight, spatialScale);
    
    let assignments = new Array(pixels.length);
    let previousAssignments = null;
    let converged = false;
    
    for (let iter = 0; iter < maxIter && !converged; iter++) {
      if (onProgress) {
        onProgress(`K-means clustering: iteration ${iter + 1}/${maxIter}`);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      // Assignment step
      for (let i = 0; i < pixels.length; i++) {
        const x = pixels[i].idx % width;
        const y = Math.floor(pixels[i].idx / width);
        const pixelFeatures = [
          pixels[i].color[0],
          pixels[i].color[1],
          pixels[i].color[2],
          x * spatialScale * spatialWeight,
          y * spatialScale * spatialWeight
        ];
        
        let minDist = Infinity;
        let cluster = 0;
        
        for (let j = 0; j < k; j++) {
          const dist = this.euclideanDistance(pixelFeatures, centroids[j]);
          if (dist < minDist) {
            minDist = dist;
            cluster = j;
          }
        }
        assignments[i] = cluster;
      }
      
      // Check for convergence
      if (previousAssignments) {
        converged = true;
        for (let i = 0; i < assignments.length; i++) {
          if (assignments[i] !== previousAssignments[i]) {
            converged = false;
            break;
          }
        }
      }
      previousAssignments = [...assignments];
      
      // Update step
      const newCentroids = Array(k).fill(null).map(() => [0, 0, 0, 0, 0]);
      const counts = Array(k).fill(0);
      
      for (let i = 0; i < pixels.length; i++) {
        const cluster = assignments[i];
        const x = pixels[i].idx % width;
        const y = Math.floor(pixels[i].idx / width);
        newCentroids[cluster][0] += pixels[i].color[0];
        newCentroids[cluster][1] += pixels[i].color[1];
        newCentroids[cluster][2] += pixels[i].color[2];
        newCentroids[cluster][3] += x * spatialScale * spatialWeight;
        newCentroids[cluster][4] += y * spatialScale * spatialWeight;
        counts[cluster]++;
      }
      
      // Update centroids
      for (let j = 0; j < k; j++) {
        if (counts[j] > 0) {
          centroids[j] = [
            newCentroids[j][0] / counts[j],
            newCentroids[j][1] / counts[j],
            newCentroids[j][2] / counts[j],
            newCentroids[j][3] / counts[j],
            newCentroids[j][4] / counts[j]
          ];
        } else {
          // Reinitialize empty clusters
          const idx = Math.floor(Math.random() * pixels.length);
          const x = pixels[idx].idx % width;
          const y = Math.floor(pixels[idx].idx / width);
          centroids[j] = [
            pixels[idx].color[0],
            pixels[idx].color[1],
            pixels[idx].color[2],
            x * spatialScale * spatialWeight,
            y * spatialScale * spatialWeight
          ];
        }
      }
    }
    
    if (onProgress) {
      onProgress('Clustering complete!');
    }

    const colorCentroids = centroids.map(c => [c[0], c[1], c[2]]);
    return { assignments, centroids: colorCentroids, fullCentroids: centroids };
  },
  
  // K-means++ initialization for better starting centroids
  async kMeansPlusPlus(pixels, k, width, height, spatialWeight, spatialScale) {
    const centroids = [];
    
    // Choose first centroid randomly
    const firstIdx = Math.floor(Math.random() * pixels.length);
    const x0 = pixels[firstIdx].idx % width;
    const y0 = Math.floor(pixels[firstIdx].idx / width);
    centroids.push([
      pixels[firstIdx].color[0],
      pixels[firstIdx].color[1],
      pixels[firstIdx].color[2],
      x0 * spatialScale * spatialWeight,
      y0 * spatialScale * spatialWeight
    ]);
    
    // Choose remaining centroids
    for (let c = 1; c < k; c++) {
      const distances = new Float32Array(pixels.length);
      let totalDistance = 0;
      
      // Calculate distance to nearest centroid for each pixel
      for (let i = 0; i < pixels.length; i++) {
        const x = pixels[i].idx % width;
        const y = Math.floor(pixels[i].idx / width);
        const pixelFeatures = [
          pixels[i].color[0],
          pixels[i].color[1],
          pixels[i].color[2],
          x * spatialScale * spatialWeight,
          y * spatialScale * spatialWeight
        ];
        
        let minDist = Infinity;
        for (const centroid of centroids) {
          const dist = this.euclideanDistance(pixelFeatures, centroid);
          if (dist < minDist) {
            minDist = dist;
          }
        }
        
        distances[i] = minDist * minDist; // Square for probability weighting
        totalDistance += distances[i];
      }
      
      // Choose next centroid with probability proportional to squared distance
      let random = Math.random() * totalDistance;
      let sum = 0;
      let chosenIdx = 0;
      
      for (let i = 0; i < pixels.length; i++) {
        sum += distances[i];
        if (sum >= random) {
          chosenIdx = i;
          break;
        }
      }
      
      const x = pixels[chosenIdx].idx % width;
      const y = Math.floor(pixels[chosenIdx].idx / width);
      centroids.push([
        pixels[chosenIdx].color[0],
        pixels[chosenIdx].color[1],
        pixels[chosenIdx].color[2],
        x * spatialScale * spatialWeight,
        y * spatialScale * spatialWeight
      ]);
    }
    
    return centroids;
  },
  
  euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  },
  
  // Alternative: Use LAB color space for better perceptual clustering
  rgbToLab(r, g, b) {
    // Normalize RGB values
    r = r / 255;
    g = g / 255;
    b = b / 255;
    
    // Convert to XYZ
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    
    let x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100;
    let y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) * 100;
    let z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) * 100;
    
    // Normalize for D65 illuminant
    x = x / 95.047;
    y = y / 100.000;
    z = z / 108.883;
    
    // Convert to LAB
    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
    
    const l = (116 * y) - 16;
    const a = 500 * (x - y);
    const bValue = 200 * (y - z);
    
    return [l, a, bValue];
  },
  
  labToRgb(l, a, bValue) {
    // Convert LAB to XYZ
    let y = (l + 16) / 116;
    let x = a / 500 + y;
    let z = y - bValue / 200;
    
    x = x > 0.206893 ? Math.pow(x, 3) : (x - 16/116) / 7.787;
    y = y > 0.206893 ? Math.pow(y, 3) : (y - 16/116) / 7.787;
    z = z > 0.206893 ? Math.pow(z, 3) : (z - 16/116) / 7.787;
    
    // Denormalize for D65 illuminant
    x = x * 95.047 / 100;
    y = y * 100.000 / 100;
    z = z * 108.883 / 100;
    
    // Convert XYZ to RGB
    let r = x *  3.2404542 + y * -1.5371385 + z * -0.4985314;
    let g = x * -0.9692660 + y *  1.8760108 + z *  0.0415560;
    let b = x *  0.0556434 + y * -0.2040259 + z *  1.0572252;
    
    // Apply gamma correction
    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
    b = b > 0.0031308 ? 1.055 * Math.pow(b, 1/2.4) - 0.055 : 12.92 * b;
    
    return [
      Math.max(0, Math.min(255, Math.round(r * 255))),
      Math.max(0, Math.min(255, Math.round(g * 255))),
      Math.max(0, Math.min(255, Math.round(b * 255)))
    ];
  }
};
