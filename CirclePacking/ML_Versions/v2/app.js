const { useState, useRef } = React;
const { createRoot } = ReactDOM;

function ColorClusterCirclePack() {
  const [image, setImage] = useState(null);
  const [k, setK] = useState(5);
  const [spatialWeight, setSpatialWeight] = useState(0.3);
  const [maxDimension, setMaxDimension] = useState(400);
  const [minCircleRadius, setMinCircleRadius] = useState(.5);
  const [maxCircleRadius, setMaxCircleRadius] = useState(50);
  const [polygonSides, setPolygonSides] = useState(100);
  const [shapeType, setShapeType] = useState('circle');
  const [colorMode, setColorMode] = useState('centroid');
  const [packingMode, setPackingMode] = useState('random');
  const [maxAttempts, setMaxAttempts] = useState(40000);
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

  const process = async () => {
    if (!image) return;
    
    setProcessing(true);
    setProgress('Loading image...');
    
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
      20,
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
    
    // DEBUG: Check region sizes
    console.log('Region sizes:', regions.map(r => r.length));
    console.log('Total assignments:', fullAssignments.length);
    console.log('Sample assignments:', fullAssignments.slice(0, 100));
    
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
    
    console.log('About to start packing. Regions:', regions.map(r => r.length));
    
    for (let i = 0; i < k; i++) {
          const color = `rgb(${Math.round(centroids[i][0])}, ${Math.round(centroids[i][1])}, ${Math.round(centroids[i][2])})`;
          
          console.log(`Loop iteration ${i}, region size:`, regions[i].length);
          console.log(`First few points:`, regions[i].slice(0, 5));
          
          setProgress('Packing Circles');
          
          const shapes = await Packing.packCircles(regions[i], color, img.width, img.height, {
            minRadius: minCircleRadius,
            maxRadius: maxCircleRadius,
            maxAttempts: maxAttempts,
            shapesPerBatch: 100,
            shapeType: shapeType,
            colorMode: colorMode,
            packingMode: packingMode,
            targetFillPercent: 0.95,
            onProgress: (fillPercent, failedAttempts) => {
              setProgress(`Packing region ${i + 1}/${k} - ${Math.round(fillPercent * 100)}% filled (${failedAttempts} failed)`);
            }
          });
          
          console.log(`Shapes returned:`, shapes.length);
          
          Packing.drawShapes(ctx, shapes);
          
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
              max: 500,
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
              `Min Shape Size: ${minCircleRadius}px`
            ),
            React.createElement('input', {
              type: 'range',
              min: 0.1,
              max: 20,
              value: minCircleRadius,
              onChange: (e) => setMinCircleRadius(parseInt(e.target.value)),
              className: 'w-full'
            })
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' },
              `Max Shape Size: ${maxCircleRadius}px`
            ),
            React.createElement('input', {
              type: 'range',
              min: 10,
              max: 100,
              value: maxCircleRadius,
              onChange: (e) => setMaxCircleRadius(parseInt(e.target.value)),
              className: 'w-full'
            })
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' },
              `Max Attempts: ${maxAttempts}`
            ),
            React.createElement('input', {
              type: 'range',
              min: 1000,
              max: 20000,
              step: 1000,
              value: maxAttempts,
              onChange: (e) => setMaxAttempts(parseInt(e.target.value)),
              className: 'w-full'
            })
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Shape Type'),
            React.createElement('select', {
              value: shapeType,
              onChange: (e) => setShapeType(e.target.value),
              className: 'border rounded px-3 py-2 w-full'
            },
              React.createElement('option', { value: 'circle' }, 'Circle'),
              React.createElement('option', { value: 'rectangle' }, 'Rectangle'),
              React.createElement('option', { value: 'triangle' }, 'Triangle')
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
