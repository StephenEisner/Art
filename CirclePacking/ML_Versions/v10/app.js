const { useState, useRef } = React;
const { createRoot } = ReactDOM;

function ColorClusterCirclePack() {
  const [image, setImage] = useState(null);
  const [k, setK] = useState(5);
  const [spatialWeight, setSpatialWeight] = useState(0.3);
  const [maxDimension, setMaxDimension] = useState(400);
  const [minCircleRadius, setMinCircleRadius] = useState(3);
  const [maxCircleRadius, setMaxCircleRadius] = useState(50);
  const [polygonSides, setPolygonSides] = useState(100);
  const [shapeType, setShapeType] = useState('circle');
  const [colorMode, setColorMode] = useState('centroid');
  const [packingMode, setPackingMode] = useState('random');
  const [maxAttempts, setMaxAttempts] = useState(10000);
  
  // Multi-pass controls - start with it enabled but fewer passes
  const [enableMultiPass, setEnableMultiPass] = useState(true);
  const [numPasses, setNumPasses] = useState(3);
  
  // Feature toggles - start disabled
  const [enableMixedShapes, setEnableMixedShapes] = useState(false);
  const [enableGapFilling, setEnableGapFilling] = useState(false);
  
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [coveragePercent, setCoveragePercent] = useState(0);
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

  const createSliderWithInput = (label, value, onChange, min, max, step = 1, helpText = '') => {
    return React.createElement('div', null,
      React.createElement('label', { className: 'block text-sm font-medium mb-2' },
        label,
        helpText && React.createElement('span', { className: 'text-gray-500 text-xs ml-2' }, helpText)
      ),
      React.createElement('div', { className: 'flex gap-2 items-center' },
        React.createElement('input', {
          type: 'range',
          min: min,
          max: max,
          step: step,
          value: value,
          onChange: onChange,
          className: 'w-full'
        }),
        React.createElement('input', {
          type: 'number',
          min: min,
          max: max,
          step: step,
          value: value,
          onChange: onChange,
          className: 'border rounded px-2 py-1 w-20 text-sm'
        })
      )
    );
  };

  const process = async () => {
    if (!image) return;
    
    setProcessing(true);
    setProgress('Loading image...');
    setCoveragePercent(0);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    
    // Downsample for faster clustering
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
    
    // Extract pixels
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push({
        color: [data[i], data[i + 1], data[i + 2]],
        idx: i / 4
      });
    }
    
    // Cluster on downsampled image
    const { assignments, centroids, fullCentroids } = await Clustering.kMeans(
      pixels, 
      k, 
      workWidth, 
      workHeight, 
      spatialWeight,
      25,
      setProgress
    );
    
    // Apply clustering to full resolution
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
    
    const regions = Geometry.extractRegions(fullAssignments, img.width, img.height, k);
    
    // Display clustered regions
    setProgress('Displaying clustered regions...');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < k; i++) {
      const color = `rgb(${Math.round(centroids[i][0])}, ${Math.round(centroids[i][1])}, ${Math.round(centroids[i][2])})`;
      Geometry.drawRegion(ctx, regions[i], color);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Pack shapes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const totalImageArea = img.width * img.height;
    let totalCoveredArea = 0;
    
    for (let i = 0; i < k; i++) {
      const color = `rgb(${Math.round(centroids[i][0])}, ${Math.round(centroids[i][1])}, ${Math.round(centroids[i][2])})`;
      
      setProgress(`Processing cluster ${i + 1}/${k}...`);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // NEW: Break region into connected components (separate islands)
      const components = Geometry.findConnectedComponents(regions[i], img.width, img.height);
      
      // Warn about extreme fragmentation
      if (components.length > 1000) {
        console.warn(`⚠️  Cluster ${i + 1} has ${components.length} islands - EXTREME FRAGMENTATION!`);
        console.warn(`    This means the clustering created too many tiny disconnected pieces.`);
        console.warn(`    Recommendation: Reduce cluster count to 20-40 for better results.`);
      }
      
      // Island statistics
      const islandStats = {
        tiny: components.filter(c => c.length < 20).length,
        small: components.filter(c => c.length >= 20 && c.length < 100).length,
        medium: components.filter(c => c.length >= 100 && c.length < 500).length,
        large: components.filter(c => c.length >= 500).length
      };
      
      console.log(`Cluster ${i + 1}/${k}: ${regions[i].length} pixels in ${components.length} island(s)`);
      console.log(`  Island breakdown: ${islandStats.tiny} tiny (<20px), ${islandStats.small} small (20-100px), ${islandStats.medium} medium (100-500px), ${islandStats.large} large (>500px)`);
      
      // Pack each island separately with SHARED attempt budget
      let clusterShapes = [];
      let clusterPixelsFilled = 0;
      let clusterPixelsTotal = regions[i].length;
      
      // Track what happens to each island
      let islandsFilled = 0;
      let islandsSkipped = 0;
      let pixelFilledCount = 0;
      let microPackedCount = 0;
      let fullPackedCount = 0;
      
      // SHARED ATTEMPT BUDGET: Don't let first islands use all attempts!
      let remainingAttempts = maxAttempts;
      const totalIslands = components.length;
      
      console.log(`  💰 Attempt budget: ${maxAttempts} attempts for ${totalIslands} islands`);
      
      for (let c = 0; c < components.length; c++) {
        // Stop if we've exhausted our attempt budget
        if (remainingAttempts <= 0) {
          console.log(`  ⚠️  Attempt budget exhausted at island ${c + 1}/${totalIslands}`);
          islandsSkipped = totalIslands - c;
          break;
        }
        const island = components[c];
        const islandArea = island.length;
        
        // Async break every 100 islands for UI responsiveness (not every single island)
        if (c % 100 === 0 && c > 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        let shapes;
        let strategy;
        let shapesArea = 0;
        
        if (islandArea < 20) {
          // Strategy 1: Direct pixel fill for tiny islands
          strategy = 'PIXEL_FILL';
          shapes = island.map(p => ({ 
            type: 'pixel', 
            x: p.x, 
            y: p.y, 
            color 
          }));
          shapesArea = shapes.length; // Each pixel = 1 unit
          pixelFilledCount++;
          
        } else if (islandArea < 100) {
          // Strategy 2: Micro-packing for small islands
          strategy = 'MICRO_PACK';
          
          // Calculate attempts from shared budget
          const islandsLeft = totalIslands - c;
          const fairShare = Math.floor(remainingAttempts / Math.max(1, islandsLeft));
          const microAttempts = Math.min(
            Math.min(islandArea * 30, 3000), // Normal micro-pack limit
            fairShare, // Don't exceed fair share
            remainingAttempts // Don't exceed remaining budget
          );
          
          // Deduct from budget
          remainingAttempts -= microAttempts;
          
          shapes = await Packing.microPack(island, color, img.width, img.height, {
            minRadius: minCircleRadius,
            maxAttempts: microAttempts
          });
          microPackedCount++;
          
          // Calculate micro-pack coverage
          for (const shape of shapes) {
            if (shape.type === 'circle') {
              shapesArea += Math.PI * shape.r * shape.r;
            }
          }
          
        } else {
          // Strategy 3: Full packing for larger islands
          strategy = islandArea < 500 ? 'SMALL_PACK' : 'FULL_PACK';
          setProgress(`Packing cluster ${i + 1}/${k}, island ${c + 1}/${components.length} (${islandArea}px)`);
          
          // Calculate this island's fair share of remaining attempts
          // Give more attempts to larger islands, but cap to prevent first island hogging everything
          const islandsLeft = totalIslands - c;
          const fairShare = Math.floor(remainingAttempts / Math.max(1, islandsLeft));
          
          // Proportional to island size, but within reasonable bounds
          const proportionalAttempts = Math.floor((islandArea / clusterPixelsTotal) * maxAttempts * 1.5);
          
          // Use the minimum of: fair share, proportional, or remaining budget
          const baseAttempts = Math.max(
            500, // Absolute minimum
            Math.min(fairShare, proportionalAttempts, remainingAttempts)
          );
          
          // ADAPTIVE MULTI-PASS: Only use for large islands where it helps
          const useMultiPassForIsland = enableMultiPass && islandArea >= 1000;
          
          // Give 50% more attempts when using multi-pass
          const islandAttempts = useMultiPassForIsland ? Math.floor(baseAttempts * 1.5) : baseAttempts;
          
          // Deduct from budget BEFORE packing (prevent overshoot)
          remainingAttempts -= islandAttempts;
          
          fullPackedCount++;
          
          shapes = await Packing.packCircles(island, color, img.width, img.height, {
            minRadius: minCircleRadius,
            maxRadius: maxCircleRadius,
            maxAttempts: islandAttempts,
            shapesPerBatch: 50,
            shapeType: shapeType,
            colorMode: colorMode,
            packingMode: packingMode,
            targetFillPercent: 0.95,
            enableMultiPass: useMultiPassForIsland, // Adaptive based on island size!
            numPasses: numPasses,
            enableMixedShapes: enableMixedShapes,
            enableGapFilling: enableGapFilling,
            onProgress: (fillPercent, failedAttempts) => {
              setProgress(`Cluster ${i + 1}/${k}, island ${c + 1}/${components.length} - ${Math.round(fillPercent * 100)}% filled`);
            }
          });
          
          // Calculate full pack coverage
          for (const shape of shapes) {
            if (shape.type === 'circle') {
              shapesArea += Math.PI * shape.r * shape.r;
            } else if (shape.type === 'rectangle') {
              shapesArea += shape.w * shape.h;
            } else if (shape.type === 'triangle') {
              shapesArea += (Math.sqrt(3) / 4) * shape.r * shape.r;
            }
          }
        }
        
        // Track if this island got any shapes
        if (shapes && shapes.length > 0) {
          islandsFilled++;
        } else {
          islandsSkipped++;
        }
        
        clusterPixelsFilled += shapesArea;
        const islandCoverage = ((shapesArea / islandArea) * 100).toFixed(1);
        
        // Show if multi-pass was actually used for this island
        const multiPassUsed = strategy === 'FULL_PACK' && enableMultiPass && islandArea >= 1000 ? ' [MULTI-PASS]' : '';
        
        // Log only first 5 islands and last island, or all if < 10 islands
        if (c < 5 || c === components.length - 1 || components.length <= 10) {
          console.log(`  Island ${c + 1}/${components.length}: ${islandArea}px → ${strategy}${multiPassUsed} → ${shapes.length} shapes → ${islandCoverage}% coverage`);
        } else if (c === 5) {
          console.log(`  ... (${components.length - 6} more islands) ...`);
        }
        
        clusterShapes = clusterShapes.concat(shapes);
      }
      
      // Cluster summary with detailed stats
      const clusterCoverage = ((clusterPixelsFilled / clusterPixelsTotal) * 100).toFixed(1);
      const attemptsUsed = maxAttempts - remainingAttempts;
      const budgetWarning = islandsSkipped > 0 ? ' ⚠️ RAN OUT OF ATTEMPTS!' : '';
      
      console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`  📊 CLUSTER ${i + 1} SUMMARY:${budgetWarning}`);
      console.log(`     Total islands: ${components.length}`);
      console.log(`     Islands filled: ${islandsFilled} (${((islandsFilled/components.length)*100).toFixed(1)}%)`);
      console.log(`     Islands skipped: ${islandsSkipped} ${islandsSkipped > 0 ? '← Budget exhausted!' : ''}`);
      console.log(`     By strategy: ${pixelFilledCount} pixel-fill, ${microPackedCount} micro-pack, ${fullPackedCount} full-pack`);
      console.log(`     Attempts: ${attemptsUsed.toLocaleString()} / ${maxAttempts.toLocaleString()} used (${remainingAttempts.toLocaleString()} remaining)`);
      console.log(`     Total shapes: ${clusterShapes.length.toLocaleString()}`);
      console.log(`     Cluster coverage: ${clusterCoverage}%`);
      console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      
      // Calculate area covered by all islands in this cluster
      let clusterArea = 0;
      for (const shape of clusterShapes) {
        if (shape.type === 'pixel') {
          clusterArea += 1; // Each pixel = 1 unit area
        } else if (shape.type === 'circle') {
          clusterArea += Math.PI * shape.r * shape.r;
        } else if (shape.type === 'rectangle') {
          clusterArea += shape.w * shape.h;
        } else if (shape.type === 'triangle') {
          clusterArea += (Math.sqrt(3) / 4) * shape.r * shape.r;
        }
      }
      totalCoveredArea += clusterArea;
      
      // Update total coverage
      const coverage = (totalCoveredArea / totalImageArea) * 100;
      setCoveragePercent(coverage);
      
      // Draw all shapes for this cluster
      Packing.drawShapes(ctx, clusterShapes);
      
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
          
          createSliderWithInput(
            `Number of Clusters (k): ${k}`,
            k,
            (e) => setK(parseInt(e.target.value)),
            2,
            300,
            1
          ),
          
          createSliderWithInput(
            `Spatial Weight: ${spatialWeight.toFixed(2)}`,
            spatialWeight,
            (e) => setSpatialWeight(parseFloat(e.target.value)),
            0,
            1,
            0.05,
            '(0 = pure color, 1 = more spatial coherence)'
          ),
          
          createSliderWithInput(
            `Processing Size: ${maxDimension}px`,
            maxDimension,
            (e) => setMaxDimension(parseInt(e.target.value)),
            200,
            800,
            50,
            '(lower = faster, higher = more detail)'
          ),
          
          createSliderWithInput(
            `Min Shape Size: ${minCircleRadius}px`,
            minCircleRadius,
            (e) => setMinCircleRadius(parseFloat(e.target.value)),
            0.01,
            20,
            0.01
          ),
          
          createSliderWithInput(
            `Max Shape Size: ${maxCircleRadius}px`,
            maxCircleRadius,
            (e) => setMaxCircleRadius(parseInt(e.target.value)),
            10,
            100,
            1
          ),
          
          createSliderWithInput(
            `Max Attempts: ${maxAttempts}`,
            maxAttempts,
            (e) => setMaxAttempts(parseInt(e.target.value)),
            1000,
            30000,
            1000
          ),
          
          // Multi-pass controls
          React.createElement('div', { className: 'border-t pt-4' },
            React.createElement('h3', { className: 'text-lg font-semibold mb-3' }, 'Packing Algorithm'),
            
            React.createElement('div', { className: 'flex items-center gap-2 mb-3' },
              React.createElement('input', {
                type: 'checkbox',
                id: 'multipass',
                checked: enableMultiPass,
                onChange: (e) => setEnableMultiPass(e.target.checked),
                className: 'w-4 h-4'
              }),
              React.createElement('label', { htmlFor: 'multipass', className: 'text-sm font-medium' }, 
                'Enable Multi-Pass Packing'
              ),
              React.createElement('span', { className: 'text-xs text-gray-500 ml-2' }, 
                '(Packs large shapes first, then progressively smaller)'
              )
            ),
            
            enableMultiPass && createSliderWithInput(
              `Number of Passes: ${numPasses}`,
              numPasses,
              (e) => setNumPasses(parseInt(e.target.value)),
              2,
              8,
              1,
              '(more passes = better coverage but slower)'
            )
          ),
          
          // Feature toggles
          React.createElement('div', { className: 'border-t pt-4' },
            React.createElement('h3', { className: 'text-lg font-semibold mb-3' }, 'Advanced Features'),
            
            React.createElement('div', { className: 'flex items-center gap-2 mb-3' },
              React.createElement('input', {
                type: 'checkbox',
                id: 'mixedshapes',
                checked: enableMixedShapes,
                onChange: (e) => setEnableMixedShapes(e.target.checked),
                className: 'w-4 h-4'
              }),
              React.createElement('label', { htmlFor: 'mixedshapes', className: 'text-sm font-medium' }, 
                'Enable Mixed Shapes'
              ),
              React.createElement('span', { className: 'text-xs text-gray-500 ml-2' }, 
                '(Use circles AND rectangles for better packing)'
              )
            ),
            
            React.createElement('div', { className: 'flex items-center gap-2' },
              React.createElement('input', {
                type: 'checkbox',
                id: 'gapfilling',
                checked: enableGapFilling,
                onChange: (e) => setEnableGapFilling(e.target.checked),
                className: 'w-4 h-4'
              }),
              React.createElement('label', { htmlFor: 'gapfilling', className: 'text-sm font-medium' }, 
                'Enable Gap Filling Pass'
              ),
              React.createElement('span', { className: 'text-xs text-gray-500 ml-2' }, 
                '(Final pass to fill remaining tiny gaps)'
              )
            )
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Shape Type'),
            React.createElement('select', {
              value: shapeType,
              onChange: (e) => setShapeType(e.target.value),
              className: 'border rounded px-3 py-2 w-full',
              disabled: enableMixedShapes
            },
              React.createElement('option', { value: 'circle' }, 'Circle'),
              React.createElement('option', { value: 'rectangle' }, 'Rectangle'),
              React.createElement('option', { value: 'triangle' }, 'Triangle')
            ),
            enableMixedShapes && React.createElement('span', { className: 'text-xs text-gray-500 mt-1 block' }, 
              'Shape type disabled when Mixed Shapes is enabled'
            )
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Color Mode'),
            React.createElement('select', {
              value: colorMode,
              onChange: (e) => setColorMode(e.target.value),
              className: 'border rounded px-3 py-2 w-full'
            },
              React.createElement('option', { value: 'centroid' }, 'Centroid Color'),
              React.createElement('option', { value: 'random' }, 'Random'),
              React.createElement('option', { value: 'variance' }, 'Variance'),
              React.createElement('option', { value: 'size' }, 'Size-based')
            )
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Packing Mode'),
            React.createElement('select', {
              value: packingMode,
              onChange: (e) => setPackingMode(e.target.value),
              className: 'border rounded px-3 py-2 w-full'
            },
              React.createElement('option', { value: 'random' }, 'Random'),
              React.createElement('option', { value: 'efficient' }, 'Efficient (Largest First)')
            )
          ),
          
          React.createElement('button', {
            onClick: process,
            disabled: !image || processing,
            className: 'w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed'
          }, processing ? 'Processing...' : 'Generate Circle Pack'),
          
          progress && React.createElement('div', { className: 'mt-2 text-sm text-blue-600 font-medium' }, progress),
          
          coveragePercent > 0 && React.createElement('div', { className: 'mt-2 text-lg font-bold text-green-600' }, 
            `Total Coverage: ${coveragePercent.toFixed(2)}%`
          )
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
