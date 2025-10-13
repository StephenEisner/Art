const { useState, useRef } = React;
const { createRoot } = ReactDOM;

function ColorClusterCirclePack() {
  const [image, setImage] = useState(null);
  const [k, setK] = useState(5);
  const [spatialWeight, setSpatialWeight] = useState(0.3);
  const [maxDimension, setMaxDimension] = useState(400);
  const [minCircleRadius, setMinCircleRadius] = useState(3);
  const [polygonSides, setPolygonSides] = useState(100);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const kMeans = async (pixels, k, width, height, spatialWeight = 0.3, maxIter = 20, onProgress) => {
    const spatialScale = 255 / Math.max(width, height);
    
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
  };

  const extractRegions = (assignments, width, height, k) => {
    const regions = Array(k).fill(null).map(() => []);
    
    for (let i = 0; i < assignments.length; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      regions[assignments[i]].push({ x, y });
    }
    
    return regions;
  };

  const traceBoundary = (region, width, height) => {
    if (region.length === 0) return [];
    
    const bitmap = new Set(region.map(p => `${Math.floor(p.x)},${Math.floor(p.y)}`));
    
    const isInRegion = (x, y) => bitmap.has(`${x},${y}`);
    
    let startX = region[0].x, startY = region[0].y;
    for (const p of region) {
      const x = Math.floor(p.x);
      const y = Math.floor(p.y);
      let isBoundary = false;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          if (!isInRegion(x + dx, y + dy)) {
            isBoundary = true;
            break;
          }
        }
        if (isBoundary) break;
      }
      if (isBoundary) {
        startX = x;
        startY = y;
        break;
      }
    }
    
    const boundary = [];
    let x = startX, y = startY;
    let dir = 0;
    const dirs = [[1,0], [0,1], [-1,0], [0,-1]];
    
    const maxSteps = region.length * 2;
    let steps = 0;
    
    do {
      boundary.push({x, y});
      
      let found = false;
      for (let turn = -1; turn <= 2; turn++) {
        const newDir = (dir + turn + 4) % 4;
        const nx = x + dirs[newDir][0];
        const ny = y + dirs[newDir][1];
        
        if (isInRegion(nx, ny)) {
          let stillBoundary = false;
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              if (!isInRegion(nx + dx, ny + dy)) {
                stillBoundary = true;
                break;
              }
            }
            if (stillBoundary) break;
          }
          
          if (stillBoundary || boundary.length < 3) {
            x = nx;
            y = ny;
            dir = newDir;
            found = true;
            break;
          }
        }
      }
      
      if (!found) break;
      steps++;
      
    } while ((x !== startX || y !== startY) && steps < maxSteps);
    
    return boundary;
  };
  
  const simplifyPolygon = (points, targetCount) => {
    if (points.length <= targetCount) return points;
    
    const step = points.length / targetCount;
    const simplified = [];
    
    for (let i = 0; i < targetCount; i++) {
      const idx = Math.floor(i * step);
      simplified.push(points[idx]);
    }
    
    return simplified;
  };

  const packCircles = (region, color, width, height, minRadius = 3, onProgress) => {
    if (region.length === 0) return [];
    
    const circles = [];
    const maxRadius = 50;
    const targetFillPercent = 0.95;
    
    const regionArea = region.length;
    let filledArea = 0;
    
    const xs = region.map(p => p.x);
    const ys = region.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
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
    
    const getDistanceToNearestCircle = (x, y) => {
      let minDist = Infinity;
      for (const circle of circles) {
        const dist = Math.sqrt(Math.pow(x - circle.x, 2) + Math.pow(y - circle.y, 2)) - circle.r;
        minDist = Math.min(minDist, dist);
      }
      return minDist;
    };
    
    const canFitCircle = (x, y, r) => {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (!isInRegion(px, py)) return false;
      }
      return true;
    };
    
    const findLargestCircleAt = (x, y) => {
      if (!isInRegion(x, y)) return 0;
      
      let low = minRadius;
      let high = maxRadius;
      let bestR = 0;
      
      while (high - low > 0.5) {
        const mid = (low + high) / 2;
        const distToCircles = getDistanceToNearestCircle(x, y);
        
        if (distToCircles >= mid && canFitCircle(x, y, mid)) {
          bestR = mid;
          low = mid;
        } else {
          high = mid;
        }
      }
      
      return bestR;
    };
    
    const gridSpacing = minRadius * 2;
    const candidates = [];
    
    for (let x = minX; x <= maxX; x += gridSpacing) {
      for (let y = minY; y <= maxY; y += gridSpacing) {
        if (isInRegion(x, y)) {
          candidates.push({ x, y });
        }
      }
    }
    
    while (candidates.length > 0) {
      const fillPercent = filledArea / regionArea;
      if (onProgress) {
        onProgress(fillPercent);
      }
      
      if (fillPercent >= targetFillPercent) break;
      
      let bestCandidate = null;
      let bestRadius = 0;
      
      for (let i = 0; i < candidates.length; i++) {
        const r = findLargestCircleAt(candidates[i].x, candidates[i].y);
        if (r > bestRadius) {
          bestRadius = r;
          bestCandidate = candidates[i];
        }
      }
      
      if (bestRadius < minRadius) break;
      
      circles.push({
        x: bestCandidate.x,
        y: bestCandidate.y,
        r: bestRadius,
        color
      });
      
      filledArea += Math.PI * bestRadius * bestRadius;
      
      const removeRadius = bestRadius + minRadius;
      for (let i = candidates.length - 1; i >= 0; i--) {
        const dist = Math.sqrt(
          Math.pow(candidates[i].x - bestCandidate.x, 2) +
          Math.pow(candidates[i].y - bestCandidate.y, 2)
        );
        if (dist < removeRadius) {
          candidates.splice(i, 1);
        }
      }
    }
    
    return circles;
  };

  const process = async () => {
    if (!image) return;
    
    setProcessing(true);
    setProgress('Loading image...');
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    
    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const workWidth = Math.floor(img.width * scale);
    const workHeight = Math.floor(img.height * scale);
    
    setProgress(`Downsampling to ${workWidth}x${workHeight} for faster processing...`);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const workCanvas = document.createElement('canvas');
    workCanvas.width = workWidth;
    workCanvas.height = workHeight;
    const workCtx = workCanvas.getContext('2d');
    workCtx.drawImage(img, 0, 0, workWidth, workHeight);
    
    const imageData = workCtx.getImageData(0, 0, workWidth, workHeight);
    const data = imageData.data;
    
    setProgress('Extracting pixels...');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push({
        color: [data[i], data[i + 1], data[i + 2]],
        idx: i / 4
      });
    }
    
    const { assignments, centroids, fullCentroids } = await kMeans(
      pixels, 
      k, 
      workWidth, 
      workHeight, 
      spatialWeight,
      20,
      setProgress
    );
    
    setProgress('Applying clusters to full resolution...');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const fullImageData = ctx.getImageData(0, 0, img.width, img.height);
    const fullData = fullImageData.data;
    
    const fullAssignments = new Array(fullData.length / 4);
    const fullSpatialScale = 255 / Math.max(img.width, img.height);
    const workSpatialScale = 255 / Math.max(workWidth, workHeight);
    
    const chunkSize = 20000;
    
    for (let chunkStart = 0; chunkStart < fullData.length; chunkStart += chunkSize * 4) {
      const progressPct = Math.round((chunkStart / fullData.length) * 100);
      setProgress(`Applying clusters to full resolution... ${progressPct}%`);
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const chunkEnd = Math.min(chunkStart + chunkSize * 4, fullData.length);
      
      for (let i = chunkStart; i < chunkEnd; i += 4) {
        const r = fullData[i];
        const g = fullData[i + 1];
        const b = fullData[i + 2];
        const x = (i / 4) % img.width;
        const y = Math.floor((i / 4) / img.width);
        
        const pixelFeatures = [
          r, g, b,
          x * fullSpatialScale * spatialWeight,
          y * fullSpatialScale * spatialWeight
        ];
        
        let minDist = Infinity;
        let cluster = 0;
        
        for (let j = 0; j < k; j++) {
          const centroidFeatures = [
            fullCentroids[j][0],
            fullCentroids[j][1],
            fullCentroids[j][2],
            (fullCentroids[j][3] / workSpatialScale / spatialWeight) * fullSpatialScale * spatialWeight,
            (fullCentroids[j][4] / workSpatialScale / spatialWeight) * fullSpatialScale * spatialWeight
          ];
          
          const dist = Math.sqrt(
            Math.pow(pixelFeatures[0] - centroidFeatures[0], 2) +
            Math.pow(pixelFeatures[1] - centroidFeatures[1], 2) +
            Math.pow(pixelFeatures[2] - centroidFeatures[2], 2) +
            Math.pow(pixelFeatures[3] - centroidFeatures[3], 2) +
            Math.pow(pixelFeatures[4] - centroidFeatures[4], 2)
          );
          
          if (dist < minDist) {
            minDist = dist;
            cluster = j;
          }
        }
        
        fullAssignments[i / 4] = cluster;
      }
    }
    
    setProgress('Extracting regions...');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const regions = extractRegions(fullAssignments, img.width, img.height, k);
    
    setProgress('Displaying clustered regions...');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < k; i++) {
      const color = `rgb(${Math.round(centroids[i][0])}, ${Math.round(centroids[i][1])}, ${Math.round(centroids[i][2])})`;
      const boundary = traceBoundary(regions[i], img.width, img.height);
      const polygon = simplifyPolygon(boundary, polygonSides);
      
      if (polygon.length > 2) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(polygon[0].x, polygon[0].y);
        for (let j = 1; j < polygon.length; j++) {
          ctx.lineTo(polygon[j].x, polygon[j].y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < k; i++) {
      const color = `rgb(${Math.round(centroids[i][0])}, ${Math.round(centroids[i][1])}, ${Math.round(centroids[i][2])})`;
      
      const circles = packCircles(regions[i], color, img.width, img.height, minCircleRadius, (fillPercent) => {
        setProgress(`Packing region ${i + 1}/${k} - ${Math.round(fillPercent * 100)}% filled`);
      });
      
      ctx.fillStyle = color;
      for (const circle of circles) {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
        ctx.fill();
      }
      
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    setProgress('Done!');
    await new Promise(resolve => setTimeout(resolve, 500));
    setProgress('');
    setProcessing(false);
  };

  return React.createElement('div', { className: 'min-h-screen bg-gray-100 p-8' },
    React.createElement('div', { className: 'max-w-6xl mx-auto' },
      React.createElement('h1', { className: 'text-3xl font-bold mb-6' }, 'Color Clustering Circle Pack'),
      
      React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6 mb-6' },
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Upload Image'),
            React.createElement('input', {
              type: 'file',
              accept: 'image/*',
              onChange: handleImageUpload,
              className: 'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600'
            })
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, `Number of Clusters (k): ${k}`),
            React.createElement('input', {
              type: 'range',
              min: 2,
              max: 50,
              value: k,
              onChange: (e) => setK(parseInt(e.target.value)),
              className: 'w-full'
            })
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' },
              `Spatial Weight: ${spatialWeight.toFixed(2)}`,
              React.createElement('span', { className: 'text-gray-500 text-xs ml-2' }, '(0 = pure color, 1 = more spatial coherence)')
            ),
            React.createElement('input', {
              type: 'range',
              min: 0,
              max: 1,
              step: 0.05,
              value: spatialWeight,
              onChange: (e) => setSpatialWeight(parseFloat(e.target.value)),
              className: 'w-full'
            })
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' },
              `Processing Size: ${maxDimension}px`,
              React.createElement('span', { className: 'text-gray-500 text-xs ml-2' }, '(lower = faster, higher = more detail)')
            ),
            React.createElement('input', {
              type: 'range',
              min: 200,
              max: 800,
              step: 50,
              value: maxDimension,
              onChange: (e) => setMaxDimension(parseInt(e.target.value)),
              className: 'w-full'
            })
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' },
              `Min Circle Size: ${minCircleRadius}px`,
              React.createElement('span', { className: 'text-gray-500 text-xs ml-2' }, '(larger = faster packing)')
            ),
            React.createElement('input', {
              type: 'range',
              min: 2,
              max: 10,
              value: minCircleRadius,
              onChange: (e) => setMinCircleRadius(parseInt(e.target.value)),
              className: 'w-full'
            })
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' },
              `Polygon Sides: ${polygonSides}`,
              React.createElement('span', { className: 'text-gray-500 text-xs ml-2' }, '(for region display)')
            ),
            React.createElement('input', {
              type: 'range',
              min: 20,
              max: 200,
              step: 10,
              value: polygonSides,
              onChange: (e) => setPolygonSides(parseInt(e.target.value)),
              className: 'w-full'
            })
          ),
          
          React.createElement('button', {
            onClick: process,
            disabled: !image || processing,
            className: 'w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed'
          }, processing ? 'Processing...' : 'Generate Circle Pack'),
          
          progress && React.createElement('div', { className: 'mt-2 text-sm text-blue-600 font-medium' }, progress)
        )
      ),
      
      React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
        image ? [
          React.createElement('img', {
            key: 'img',
            ref: imgRef,
            src: image,
            alt: 'Upload',
            className: 'hidden',
            onLoad: () => {
              if (canvasRef.current) {
                canvasRef.current.width = imgRef.current.width;
                canvasRef.current.height = imgRef.current.height;
              }
            }
          }),
          React.createElement('canvas', {
            key: 'canvas',
            ref: canvasRef,
            className: 'max-w-full border border-gray-300'
          })
        ] : React.createElement('div', { className: 'text-center text-gray-400 py-20' }, 'Upload an image to get started')
      )
    )
  );
}

const root = createRoot(document.getElementById('root'));
root.render(React.createElement(ColorClusterCirclePack));
