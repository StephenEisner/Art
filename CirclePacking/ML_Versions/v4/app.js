const { useState, useRef } = React;
const { createRoot } = ReactDOM;

function ColorClusterCirclePack() {
  const [image, setImage] = useState(null);
  const [k, setK] = useState(15);
  const [spatialWeight, setSpatialWeight] = useState(0.65);
  const [maxDimension, setMaxDimension] = useState(400);
  const [minCircleRadius, setMinCircleRadius] = useState(0.5);
  const [maxCircleRadius, setMaxCircleRadius] = useState(25);
  const [shapeType, setShapeType] = useState('circle');
  const [colorMode, setColorMode] = useState('centroid');
  const [packingMode, setPackingMode] = useState('efficient');
  const [maxAttempts, setMaxAttempts] = useState(15000);
  const [morphRadius, setMorphRadius] = useState(1);
  const [enableMorphology, setEnableMorphology] = useState(false);
  const [enableEdgeRefinement, setEnableEdgeRefinement] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [coveragePercent, setCoveragePercent] = useState(0);
  const [regionStats, setRegionStats] = useState([]);
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
    setRegionStats([]);
    
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
    
    // Cluster on downsampled image with higher spatial weight for natural images
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
    
    // Check data validity
    console.log(`Full image size: ${img.width}x${img.height}, pixels: ${fullData.length / 4}`);
    
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
    
    // Extract regions with error handling
    let regions;
    try {
      regions = Geometry.extractRegions(fullAssignments, img.width, img.height, k);
      
      // Log region sizes for debugging
      console.log('Extracted regions:', regions.map(r => r.length));
      
      // Remove empty regions
      regions = regions.filter(r => r.length > 0);
      console.log(`Non-empty regions: ${regions.length} out of ${k}`);
    } catch (error) {
      console.error('Error extracting regions:', error);
      setProgress('Error extracting regions. Please try with different parameters.');
      setProcessing(false);
      return;
    }
    
    // Apply morphological operations if enabled
    if (enableMorphology && morphRadius > 0) {
      for (let i = 0; i < regions.length; i++) {
        setProgress(`Applying morphological operations to region ${i + 1}/${regions.length}...`);
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Only apply to medium-sized regions to avoid performance issues
        if (regions[i].length > 10 && regions[i].length < 50000) {
          // Use smaller radius for large regions
          const adaptiveRadius = regions[i].length > 10000 ? 1 : morphRadius;
          regions[i] = Geometry.morphologicalCloseFast(regions[i], img.width, img.height, adaptiveRadius);
        } else if (regions[i].length >= 50000) {
          console.log(`Skipping morphology for large region ${i} with ${regions[i].length} pixels`);
        }
      }
    }
    
    // Display clustered regions briefly
    setProgress('Displaying clustered regions...');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw regions with their centroid colors
    for (let i = 0; i < Math.min(regions.length, k); i++) {
      const color = centroids[i] ? 
        `rgb(${Math.round(centroids[i][0])}, ${Math.round(centroids[i][1])}, ${Math.round(centroids[i][2])})` :
        `rgb(128, 128, 128)`;
      Geometry.drawRegion(ctx, regions[i], color);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Pack shapes with enhanced algorithm
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const totalImageArea = img.width * img.height;
    let totalCoveredArea = 0;
    const stats = [];
    
    for (let i = 0; i < regions.length; i++) {
      // Get appropriate color for this region
      const color = centroids[i] ? 
        `rgb(${Math.round(centroids[i][0])}, ${Math.round(centroids[i][1])}, ${Math.round(centroids[i][2])})` :
        `rgb(128, 128, 128)`;
      
      setProgress(`Packing region ${i + 1}/${regions.length}...`);
      
      const result = await Packing.packShapes(regions[i], color, img.width, img.height, {
        minRadius: minCircleRadius,
        maxRadius: maxCircleRadius,
        maxAttempts: Math.floor(maxAttempts / Math.max(regions.length, 1)),
        shapesPerBatch: 100,
        shapeType: shapeType,
        colorMode: colorMode,
        packingMode: packingMode,
        enableEdgeRefinement: enableEdgeRefinement,
        targetFillPercent: 0.95,
        onProgress: (fillPercent, phase) => {
          setProgress(`Packing region ${i + 1}/${regions.length} - ${phase} - ${Math.round(fillPercent * 100)}% filled`);
        }
      });
      
      totalCoveredArea += result.coveredArea;
      
      // Update total coverage
      const coverage = (totalCoveredArea / totalImageArea) * 100;
      setCoveragePercent(coverage);
      
      stats.push({
        regionId: i,
        regionArea: regions[i].length,
        shapesPlaced: result.shapes.length,
        coverage: result.coverage,
        color: color
      });
      
      Packing.drawShapes(ctx, result.shapes);
      
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    setRegionStats(stats);
    setProgress('Done! Check statistics below.');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress('');
    setProcessing(false);
  };

  return React.createElement('div', { className: 'min-h-screen bg-gray-100 p-8' },
    React.createElement('div', { className: 'max-w-6xl mx-auto' },
      React.createElement('h1', { className: 'text-3xl font-bold mb-6' }, 'Enhanced Color Clustering Circle Pack'),
      
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
          
          React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
            React.createElement('div', null,
              createSliderWithInput(
                `Number of Clusters: ${k}`,
                k,
                (e) => setK(parseInt(e.target.value)),
                2,
                30,
                1,
                'More clusters = more detail'
              )
            ),
            
            React.createElement('div', null,
              createSliderWithInput(
                `Spatial Weight: ${spatialWeight.toFixed(2)}`,
                spatialWeight,
                (e) => setSpatialWeight(parseFloat(e.target.value)),
                0,
                1,
                0.05,
                'Higher = more coherent regions'
              )
            ),
            
            React.createElement('div', null,
              createSliderWithInput(
                `Processing Size: ${maxDimension}px`,
                maxDimension,
                (e) => setMaxDimension(parseInt(e.target.value)),
                200,
                800,
                50,
                'Higher = better clustering but slower'
              )
            ),
            
            React.createElement('div', null,
              createSliderWithInput(
                `Min Shape Size: ${minCircleRadius}px`,
                minCircleRadius,
                (e) => setMinCircleRadius(parseFloat(e.target.value)),
                0.1,
                5,
                0.1
              )
            ),
            
            React.createElement('div', null,
              createSliderWithInput(
                `Max Shape Size: ${maxCircleRadius}px`,
                maxCircleRadius,
                (e) => setMaxCircleRadius(parseInt(e.target.value)),
                10,
                100,
                1
              )
            ),
            
            React.createElement('div', null,
              createSliderWithInput(
                `Max Attempts: ${maxAttempts}`,
                maxAttempts,
                (e) => setMaxAttempts(parseInt(e.target.value)),
                5000,
                30000,
                1000,
                'More attempts = better coverage'
              )
            ),
            
            React.createElement('div', null,
              createSliderWithInput(
                `Morphology Radius: ${morphRadius}px`,
                morphRadius,
                (e) => setMorphRadius(parseInt(e.target.value)),
                0,
                5,
                1,
                'Fills gaps in regions'
              )
            )
          ),
          
          React.createElement('div', { className: 'grid grid-cols-3 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Shape Type'),
              React.createElement('select', {
                value: shapeType,
                onChange: (e) => setShapeType(e.target.value),
                className: 'border rounded px-3 py-2 w-full'
              },
                React.createElement('option', { value: 'circle' }, 'Circle'),
                React.createElement('option', { value: 'rectangle' }, 'Rectangle'),
                React.createElement('option', { value: 'triangle' }, 'Triangle'),
                React.createElement('option', { value: 'mixed' }, 'Mixed')
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
                React.createElement('option', { value: 'variance' }, 'Color Variance'),
                React.createElement('option', { value: 'gradient' }, 'Gradient')
              )
            ),
            
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Packing Mode'),
              React.createElement('select', {
                value: packingMode,
                onChange: (e) => setPackingMode(e.target.value),
                className: 'border rounded px-3 py-2 w-full'
              },
                React.createElement('option', { value: 'efficient' }, 'Efficient (Distance Field)'),
                React.createElement('option', { value: 'random' }, 'Random'),
                React.createElement('option', { value: 'ordered' }, 'Size Ordered')
              )
            )
          ),
          
          React.createElement('div', { className: 'flex gap-4' },
            React.createElement('label', { className: 'flex items-center' },
              React.createElement('input', {
                type: 'checkbox',
                checked: enableMorphology,
                onChange: (e) => setEnableMorphology(e.target.checked),
                className: 'mr-2'
              }),
              'Enable Morphological Operations'
            ),
            
            React.createElement('label', { className: 'flex items-center' },
              React.createElement('input', {
                type: 'checkbox',
                checked: enableEdgeRefinement,
                onChange: (e) => setEnableEdgeRefinement(e.target.checked),
                className: 'mr-2'
              }),
              'Enable Edge Refinement'
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
      
      regionStats.length > 0 && React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6 mb-6' },
        React.createElement('h2', { className: 'text-lg font-bold mb-4' }, 'Region Statistics'),
        React.createElement('div', { className: 'grid grid-cols-4 gap-2 text-sm' },
          React.createElement('div', { className: 'font-bold' }, 'Region'),
          React.createElement('div', { className: 'font-bold' }, 'Area'),
          React.createElement('div', { className: 'font-bold' }, 'Shapes'),
          React.createElement('div', { className: 'font-bold' }, 'Coverage'),
          ...regionStats.slice(0, 10).map(stat => [
            React.createElement('div', { key: `${stat.regionId}-id`, style: { color: stat.color } }, `#${stat.regionId + 1}`),
            React.createElement('div', { key: `${stat.regionId}-area` }, `${stat.regionArea}px`),
            React.createElement('div', { key: `${stat.regionId}-shapes` }, stat.shapesPlaced),
            React.createElement('div', { key: `${stat.regionId}-cov`, className: stat.coverage < 50 ? 'text-red-600' : 'text-green-600' }, 
              `${stat.coverage.toFixed(1)}%`
            )
          ]).flat()
        ),
        regionStats.length > 10 && React.createElement('div', { className: 'mt-2 text-sm text-gray-500' }, 
          `...and ${regionStats.length - 10} more regions`
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
