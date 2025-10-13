// K-means clustering algorithm with spatial weighting
const Clustering = {
  async kMeans(pixels, k, width, height, spatialWeight = 0.3, maxIter = 20, onProgress) {
    const spatialScale = 255 / Math.max(width, height);
    
    // Initialize centroids randomly
    let centroids = [];
    for (let i = 0; i < k; i++) {
      const idx = Math.floor(Math.random() * pixels.length);
      const x = pixels[idx].idx % width;
      const y = Math.floor(pixels[idx].idx / width);
      centroids.push([
        ...pixels[idx].color,
        x * spatialScale * spatialWeight,
        y * spatialScale * spatialWeight
      ]);
    }

    let assignments = new Array(pixels.length);
    
    for (let iter = 0; iter < maxIter; iter++) {
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
          const dist = Math.sqrt(
            Math.pow(pixelFeatures[0] - centroids[j][0], 2) +
            Math.pow(pixelFeatures[1] - centroids[j][1], 2) +
            Math.pow(pixelFeatures[2] - centroids[j][2], 2) +
            Math.pow(pixelFeatures[3] - centroids[j][3], 2) +
            Math.pow(pixelFeatures[4] - centroids[j][4], 2)
          );
          if (dist < minDist) {
            minDist = dist;
            cluster = j;
          }
        }
        assignments[i] = cluster;
      }

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
      
      for (let j = 0; j < k; j++) {
        if (counts[j] > 0) {
          centroids[j] = [
            newCentroids[j][0] / counts[j],
            newCentroids[j][1] / counts[j],
            newCentroids[j][2] / counts[j],
            newCentroids[j][3] / counts[j],
            newCentroids[j][4] / counts[j]
          ];
        }
      }
    }

    const colorCentroids = centroids.map(c => [c[0], c[1], c[2]]);
    return { assignments, centroids: colorCentroids, fullCentroids: centroids };
  }
};
