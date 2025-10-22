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
  const [hexagonOrientation, setHexagonOrientation] = useState('random');
  const [colorMode, setColorMode] = useState('centroid');
  const [packingMode, setPackingMode] = useState('random');
  const [maxAttempts, setMaxAttempts] = useState(10000);
  
  // Multi-pass controls
  const [enableMultiPass, setEnableMultiPass] = useState(true);
  const [numPasses, setNumPasses] = useState(3);
  
  // Feature toggles
  const [enableMixedShapes, setEnableMixedShapes] = useState(false);
  const [enableGapFilling, setEnableGapFilling] = useState(false);
  const [enableLivePreview, setEnableLivePreview] = useState(true);
  const [enableSpatialHash, setEnableSpatialHash] = useState(true);
  const [enableSmartEarlyExit, setEnableSmartEarlyExit] = useState(true);
  
  // Budgeting scheme
  const [budgetingScheme, setBudgetingScheme] = useState('fairshare');
  const [adaptiveThreshold, setAdaptiveThreshold] = useState(300);
  const [adaptiveThresholdMode, setAdaptiveThresholdMode] = useState('fixed');
  
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [coveragePercent, setCoveragePercent] = useState(0);
  const [islandAttempts, setIslandAttempts] = useState(0);
  const [clusterAttempts, setClusterAttempts] = useState(0);
  const [colorPalette, setColorPalette] = useState(null); // Store centroids for palette export
  const [imageStats, setImageStats] = useState(null); // Store image analysis for recommendations
  const [allShapes, setAllShapes] = useState([]); // Store all shapes for SVG export
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);

        // Analyze image for recommendations
        const img = new Image();
        img.onload = () => {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(img, 0, 0);
          const imageData = tempCtx.getImageData(0, 0, img.width, img.height);

          const analysis = analyzeImageForRecommendations(imageData, img.width, img.height);
          setImageStats(analysis);

          console.log('📊 Image Analysis:', analysis.stats);
          console.log('💡 Recommended Settings:', analysis.recommended);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const saveImage = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `circle-pack-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const saveSettings = () => {
    const settings = {
      k,
      spatialWeight,
      maxDimension,
      minCircleRadius,
      maxCircleRadius,
      shapeType,
      hexagonOrientation,
      colorMode,
      packingMode,
      maxAttempts,
      enableMultiPass,
      numPasses,
      enableMixedShapes,
      enableGapFilling,
      enableLivePreview,
      enableSpatialHash,
      enableSmartEarlyExit,
      budgetingScheme,
      adaptiveThreshold,
      adaptiveThresholdMode,
      savedAt: new Date().toISOString()
    };
    
    const json = JSON.stringify(settings, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `circle-pack-settings-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadSettings = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result);
        
        // Apply settings
        if (settings.k !== undefined) setK(settings.k);
        if (settings.spatialWeight !== undefined) setSpatialWeight(settings.spatialWeight);
        if (settings.maxDimension !== undefined) setMaxDimension(settings.maxDimension);
        if (settings.minCircleRadius !== undefined) setMinCircleRadius(settings.minCircleRadius);
        if (settings.maxCircleRadius !== undefined) setMaxCircleRadius(settings.maxCircleRadius);
        if (settings.shapeType !== undefined) setShapeType(settings.shapeType);
        if (settings.hexagonOrientation !== undefined) setHexagonOrientation(settings.hexagonOrientation);
        if (settings.colorMode !== undefined) setColorMode(settings.colorMode);
        if (settings.packingMode !== undefined) setPackingMode(settings.packingMode);
        if (settings.maxAttempts !== undefined) setMaxAttempts(settings.maxAttempts);
        if (settings.enableMultiPass !== undefined) setEnableMultiPass(settings.enableMultiPass);
        if (settings.numPasses !== undefined) setNumPasses(settings.numPasses);
        if (settings.enableMixedShapes !== undefined) setEnableMixedShapes(settings.enableMixedShapes);
        if (settings.enableGapFilling !== undefined) setEnableGapFilling(settings.enableGapFilling);
        if (settings.enableLivePreview !== undefined) setEnableLivePreview(settings.enableLivePreview);
        if (settings.enableSpatialHash !== undefined) setEnableSpatialHash(settings.enableSpatialHash);
        if (settings.enableSmartEarlyExit !== undefined) setEnableSmartEarlyExit(settings.enableSmartEarlyExit);
        if (settings.budgetingScheme !== undefined) setBudgetingScheme(settings.budgetingScheme);
        if (settings.adaptiveThreshold !== undefined) setAdaptiveThreshold(settings.adaptiveThreshold);
        if (settings.adaptiveThresholdMode !== undefined) setAdaptiveThresholdMode(settings.adaptiveThresholdMode);

        alert('Settings loaded successfully!');
      } catch (error) {
        alert('Error loading settings: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  // Color Palette Export Functions
  const exportPaletteJSON = () => {
    if (!colorPalette) {
      alert('No color palette available. Generate an image first!');
      return;
    }

    const palette = {
      colors: colorPalette.map((c, i) => ({
        name: `Color ${i + 1}`,
        rgb: { r: Math.round(c[0]), g: Math.round(c[1]), b: Math.round(c[2]) },
        hex: rgbToHex(Math.round(c[0]), Math.round(c[1]), Math.round(c[2]))
      })),
      generatedAt: new Date().toISOString(),
      source: 'Circle Packing v14'
    };

    const json = JSON.stringify(palette, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-palette-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPaletteCSS = () => {
    if (!colorPalette) {
      alert('No color palette available. Generate an image first!');
      return;
    }

    let css = ':root {\n';
    colorPalette.forEach((c, i) => {
      const r = Math.round(c[0]);
      const g = Math.round(c[1]);
      const b = Math.round(c[2]);
      css += `  --color-${i + 1}: rgb(${r}, ${g}, ${b});\n`;
      css += `  --color-${i + 1}-hex: ${rgbToHex(r, g, b)};\n`;
    });
    css += '}\n';

    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-palette-${Date.now()}.css`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  // SVG Export Function
  const saveSVG = () => {
    if (!allShapes || allShapes.length === 0) {
      alert('No shapes to export. Generate an image first!');
      return;
    }

    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;

    // Create SVG header
    let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`;
    svg += `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" version="1.1">\n`;
    svg += `  <desc>Generated by Circle Packing v14</desc>\n`;
    svg += `  <rect width="${width}" height="${height}" fill="white"/>\n`;

    // Convert all shapes to SVG elements
    allShapes.forEach(shape => {
      if (shape.type === 'circle') {
        svg += `  <circle cx="${shape.x.toFixed(2)}" cy="${shape.y.toFixed(2)}" r="${shape.r.toFixed(2)}" fill="${shape.color}"/>\n`;
      } else if (shape.type === 'rectangle') {
        const x = shape.x - shape.w / 2;
        const y = shape.y - shape.h / 2;
        svg += `  <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${shape.w.toFixed(2)}" height="${shape.h.toFixed(2)}" fill="${shape.color}"/>\n`;
      } else if (shape.type === 'triangle') {
        const points = [];
        for (let i = 0; i < 3; i++) {
          const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
          const px = shape.x + Math.cos(angle) * shape.r;
          const py = shape.y + Math.sin(angle) * shape.r;
          points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
        }
        svg += `  <polygon points="${points.join(' ')}" fill="${shape.color}"/>\n`;
      } else if (shape.type === 'hexagon') {
        const points = [];
        const rotationOffset = shape.orientation === 'flat' ? Math.PI / 6 : 0;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI / 3) + rotationOffset;
          const px = shape.x + Math.cos(angle) * shape.r;
          const py = shape.y + Math.sin(angle) * shape.r;
          points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
        }
        svg += `  <polygon points="${points.join(' ')}" fill="${shape.color}"/>\n`;
      } else if (shape.type === 'pixel') {
        svg += `  <rect x="${Math.floor(shape.x)}" y="${Math.floor(shape.y)}" width="1" height="1" fill="${shape.color}"/>\n`;
      }
    });

    svg += `</svg>`;

    // Download SVG
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `circle-pack-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`📊 SVG Export: ${allShapes.length} shapes, ${(blob.size / 1024).toFixed(1)}KB`);
  };

  // Preset Configurations
  const presets = {
    maxQuality: {
      name: 'Maximum Quality',
      k: 15,
      spatialWeight: 0.25,
      maxAttempts: 15000,
      budgetingScheme: 'weighted',
      enableMultiPass: true,
      numPasses: 3,
      enableMixedShapes: true,
      enableGapFilling: true,
      minCircleRadius: 3,
      maxCircleRadius: 50
    },
    balanced: {
      name: 'Balanced',
      k: 30,
      spatialWeight: 0.30,
      maxAttempts: 15000,
      budgetingScheme: 'fairshare',
      enableMultiPass: true,
      numPasses: 3,
      enableMixedShapes: false,
      enableGapFilling: true,
      minCircleRadius: 3,
      maxCircleRadius: 50
    },
    maxDetail: {
      name: 'Maximum Detail',
      k: 80,
      spatialWeight: 0.35,
      maxAttempts: 25000,
      budgetingScheme: 'fixed',
      enableMultiPass: true,
      numPasses: 4,
      enableMixedShapes: true,
      enableGapFilling: true,
      minCircleRadius: 2,
      maxCircleRadius: 40
    },
    fastPreview: {
      name: 'Fast Preview',
      k: 10,
      spatialWeight: 0.25,
      maxAttempts: 8000,
      budgetingScheme: 'fairshare',
      enableMultiPass: false,
      numPasses: 3,
      enableMixedShapes: false,
      enableGapFilling: false,
      minCircleRadius: 3,
      maxCircleRadius: 50
    }
  };

  const applyPreset = (presetKey) => {
    const preset = presets[presetKey];
    if (!preset) return;

    setK(preset.k);
    setSpatialWeight(preset.spatialWeight);
    setMaxAttempts(preset.maxAttempts);
    setBudgetingScheme(preset.budgetingScheme);
    setEnableMultiPass(preset.enableMultiPass);
    setNumPasses(preset.numPasses);
    setEnableMixedShapes(preset.enableMixedShapes);
    setEnableGapFilling(preset.enableGapFilling);
    setMinCircleRadius(preset.minCircleRadius);
    setMaxCircleRadius(preset.maxCircleRadius);
  };

  // Analyze image for recommendations
  const analyzeImageForRecommendations = (imageData, width, height) => {
    const data = imageData.data;
    let totalBrightness = 0;
    let totalSaturation = 0;
    const colorVariance = { r: 0, g: 0, b: 0 };

    // Sample pixels for analysis (every 10th pixel for speed)
    const sampleSize = Math.floor(data.length / 40);

    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Brightness (perceived luminance)
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      totalBrightness += brightness;

      // Saturation
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      totalSaturation += saturation;

      colorVariance.r += r;
      colorVariance.g += g;
      colorVariance.b += b;
    }

    const avgBrightness = totalBrightness / sampleSize;
    const avgSaturation = totalSaturation / sampleSize;

    // Determine image characteristics
    const isHighContrast = avgBrightness > 0.3 && avgBrightness < 0.7;
    const isColorful = avgSaturation > 0.3;
    const aspectRatio = width / height;
    const isLandscape = aspectRatio > 1.3;
    const isPortrait = aspectRatio < 0.75;
    const resolution = width * height;

    // Recommend settings based on analysis
    let recommended = { ...presets.balanced };

    if (resolution > 1000000) {
      // High resolution image
      recommended.maxAttempts = 25000;
      recommended.k = 40;
    } else if (resolution < 250000) {
      // Low resolution
      recommended.maxAttempts = 12000;
      recommended.k = 20;
    }

    if (isColorful && isHighContrast) {
      // Colorful high-contrast images benefit from more clusters
      recommended.k = Math.min(60, recommended.k * 1.5);
      recommended.budgetingScheme = 'weighted';
    } else if (!isColorful) {
      // Low saturation images (B&W, muted colors) need fewer clusters
      recommended.k = Math.max(10, Math.floor(recommended.k * 0.6));
    }

    if (isLandscape) {
      // Landscapes often have large sky/ground regions
      recommended.budgetingScheme = 'proportional';
      recommended.spatialWeight = 0.35;
    } else if (isPortrait) {
      // Portraits benefit from detail preservation
      recommended.budgetingScheme = 'fixed';
      recommended.k = Math.max(30, recommended.k);
    }

    return {
      stats: {
        brightness: avgBrightness,
        saturation: avgSaturation,
        isHighContrast,
        isColorful,
        resolution,
        aspectRatio,
        isLandscape,
        isPortrait
      },
      recommended
    };
  };

  const applyRecommendedSettings = () => {
    if (!imageStats || !imageStats.recommended) {
      alert('No recommendations available. Upload an image first!');
      return;
    }

    const rec = imageStats.recommended;
    setK(rec.k);
    setSpatialWeight(rec.spatialWeight);
    setMaxAttempts(rec.maxAttempts);
    setBudgetingScheme(rec.budgetingScheme);
    setEnableMultiPass(rec.enableMultiPass);
    setNumPasses(rec.numPasses);
    setEnableMixedShapes(rec.enableMixedShapes);
    setEnableGapFilling(rec.enableGapFilling);
    setMinCircleRadius(rec.minCircleRadius);
    setMaxCircleRadius(rec.maxCircleRadius);

    alert('Recommended settings applied!');
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

  // Calculate adaptive threshold based on island size
  const calculateAdaptiveThreshold = (islandArea, baseThreshold) => {
    if (adaptiveThresholdMode === 'fixed') {
      return baseThreshold;
    }

    // Scaled mode: adjust threshold based on island size
    if (islandArea >= 1000) {
      // Large islands: 1.67x base threshold (300 → 500)
      return Math.floor(baseThreshold * 1.67);
    } else if (islandArea >= 500) {
      // Medium-large islands: 1.33x base threshold (300 → 400)
      return Math.floor(baseThreshold * 1.33);
    } else if (islandArea >= 100) {
      // Medium islands: 1.0x base threshold (300 → 300)
      return baseThreshold;
    } else if (islandArea >= 20) {
      // Small islands: 0.5x base threshold (300 → 150)
      return Math.floor(baseThreshold * 0.5);
    } else {
      // Tiny islands: 0.33x base threshold (300 → 100)
      return Math.floor(baseThreshold * 0.33);
    }
  };

  const process = async () => {
    if (!image) return;
    
    setProcessing(true);
    setProgress('Loading image...');
    setCoveragePercent(0);
    setIslandAttempts(0);
    setClusterAttempts(0);
    
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

    // Store color palette for export
    setColorPalette(centroids);
    console.log('🎨 Color Palette Generated:', centroids.map((c, i) => ({
      index: i,
      rgb: `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`,
      hex: rgbToHex(Math.round(c[0]), Math.round(c[1]), Math.round(c[2]))
    })));

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
    const globalShapesArray = []; // Collect all shapes for SVG export

    console.log(`\n🎯 Using budgeting scheme: ${budgetingScheme.toUpperCase()}`);

    for (let i = 0; i < k; i++) {
      const color = `rgb(${Math.round(centroids[i][0])}, ${Math.round(centroids[i][1])}, ${Math.round(centroids[i][2])})`;
      
      setProgress(`Processing cluster ${i + 1}/${k}...`);
      setClusterAttempts(0); // Reset cluster counter
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const components = Geometry.findConnectedComponents(regions[i], img.width, img.height);
      
      if (components.length > 1000) {
        console.warn(`⚠️  Cluster ${i + 1} has ${components.length} islands - EXTREME FRAGMENTATION!`);
      }
      
      const islandStats = {
        tiny: components.filter(c => c.length < 20).length,
        small: components.filter(c => c.length >= 20 && c.length < 100).length,
        medium: components.filter(c => c.length >= 100 && c.length < 500).length,
        large: components.filter(c => c.length >= 500).length
      };
      
      console.log(`\nCluster ${i + 1}/${k}: ${regions[i].length} pixels in ${components.length} island(s)`);
      console.log(`  Island breakdown: ${islandStats.tiny} tiny (<20px), ${islandStats.small} small (20-100px), ${islandStats.medium} medium (100-500px), ${islandStats.large} large (>500px)`);
      
      let clusterShapes = [];
      let clusterPixelsFilled = 0;
      let clusterPixelsTotal = regions[i].length;
      
      let islandsFilled = 0;
      let islandsSkipped = 0;
      let pixelFilledCount = 0;
      let microPackedCount = 0;
      let fullPackedCount = 0;
      
      let remainingAttempts = maxAttempts;
      const totalIslands = components.length;
      
      // Calculate attempt allocation based on budgeting scheme
      const islandAttempts = [];
      
      if (budgetingScheme === 'adaptive') {
        // ADAPTIVE: No pre-planning, allocate on-the-fly based on progress
        console.log(`  💰 Budget: ADAPTIVE - Move on after ${adaptiveThreshold} failed attempts`);
        console.log(`  ⚡ Dynamic allocation: ${maxAttempts} total attempts, distributed as needed`);
        
        // Don't pre-allocate for adaptive - we'll track dynamically
        for (let c = 0; c < components.length; c++) {
          islandAttempts.push(null); // null = unlimited until threshold
        }
        
      } else if (budgetingScheme === 'fairshare') {
        // FAIR SHARE: Divide evenly across islands
        console.log(`  💰 Budget: FAIR SHARE - ${maxAttempts} attempts for ${totalIslands} islands`);
        
        for (let c = 0; c < components.length; c++) {
          const islandArea = components[c].length;
          const islandsLeft = totalIslands - c;
          const fairShare = Math.floor(remainingAttempts / Math.max(1, islandsLeft));
          const proportionalAttempts = Math.floor((islandArea / clusterPixelsTotal) * maxAttempts * 1.5);
          const allocated = Math.max(500, Math.min(fairShare, proportionalAttempts, remainingAttempts));
          
          islandAttempts.push(allocated);
          remainingAttempts -= allocated;
        }
        
      } else if (budgetingScheme === 'proportional') {
        // PROPORTIONAL: Strictly based on island size
        console.log(`  💰 Budget: PROPORTIONAL - ${maxAttempts} attempts distributed by size`);
        
        for (let c = 0; c < components.length; c++) {
          const islandArea = components[c].length;
          const proportion = islandArea / clusterPixelsTotal;
          const allocated = Math.max(500, Math.floor(maxAttempts * proportion));
          
          islandAttempts.push(Math.min(allocated, remainingAttempts));
          remainingAttempts -= allocated;
          if (remainingAttempts < 0) remainingAttempts = 0;
        }
        
      } else if (budgetingScheme === 'weighted') {
        // WEIGHTED: Give larger islands extra weight (2x their proportional share)
        console.log(`  💰 Budget: WEIGHTED - Large islands get 2x proportional attempts`);
        
        // Calculate total weighted area (large islands count 2x)
        let totalWeightedArea = 0;
        for (let c = 0; c < components.length; c++) {
          const islandArea = components[c].length;
          const weight = islandArea >= 500 ? 2.0 : 1.0; // Large islands get 2x weight
          totalWeightedArea += islandArea * weight;
        }
        
        for (let c = 0; c < components.length; c++) {
          const islandArea = components[c].length;
          const weight = islandArea >= 500 ? 2.0 : 1.0;
          const weightedProportion = (islandArea * weight) / totalWeightedArea;
          const allocated = Math.max(500, Math.floor(maxAttempts * weightedProportion));
          
          islandAttempts.push(Math.min(allocated, remainingAttempts));
          remainingAttempts -= allocated;
          if (remainingAttempts < 0) remainingAttempts = 0;
        }
        
      } else if (budgetingScheme === 'fixed') {
        // FIXED: Give each island a fixed minimum, distribute remainder proportionally
        console.log(`  💰 Budget: FIXED - 1000 per island + proportional remainder`);
        
        const fixedPerIsland = 1000;
        const totalFixed = Math.min(fixedPerIsland * totalIslands, maxAttempts);
        const remainder = maxAttempts - totalFixed;
        
        for (let c = 0; c < components.length; c++) {
          const islandArea = components[c].length;
          const proportion = islandArea / clusterPixelsTotal;
          const bonusAttempts = Math.floor(remainder * proportion);
          const allocated = fixedPerIsland + bonusAttempts;
          
          islandAttempts.push(Math.min(allocated, remainingAttempts));
          remainingAttempts -= allocated;
          if (remainingAttempts < 0) remainingAttempts = 0;
        }
        
      } else if (budgetingScheme === 'exponential') {
        // EXPONENTIAL: Larger islands get exponentially more attempts
        console.log(`  💰 Budget: EXPONENTIAL - Attempts scale with sqrt(size)`);
        
        // Calculate total sqrt area
        let totalSqrtArea = 0;
        for (let c = 0; c < components.length; c++) {
          totalSqrtArea += Math.sqrt(components[c].length);
        }
        
        for (let c = 0; c < components.length; c++) {
          const islandArea = components[c].length;
          const sqrtProportion = Math.sqrt(islandArea) / totalSqrtArea;
          const allocated = Math.max(500, Math.floor(maxAttempts * sqrtProportion));
          
          islandAttempts.push(Math.min(allocated, remainingAttempts));
          remainingAttempts -= allocated;
          if (remainingAttempts < 0) remainingAttempts = 0;
        }
      }
      
      // Reset remaining attempts for tracking during packing
      remainingAttempts = maxAttempts;
      
      // Track cluster attempts
      let clusterAttemptAccumulator = 0;
      
      for (let c = 0; c < components.length; c++) {
        const island = components[c];
        const islandArea = island.length;
        const allocatedAttempts = islandAttempts[c];
        
        // Check if we've run out of attempts (for pre-planned schemes)
        if (budgetingScheme !== 'adaptive' && allocatedAttempts <= 0) {
          islandsSkipped++;
          continue;
        }
        
        // Check if we've exhausted total budget (for adaptive scheme)
        if (budgetingScheme === 'adaptive' && remainingAttempts <= 0) {
          console.log(`  ⚠️  Total attempt budget exhausted at island ${c + 1}/${components.length}`);
          islandsSkipped = components.length - c;
          break;
        }
        
        if (c % 100 === 0 && c > 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        let shapes;
        let strategy;
        let shapesArea = 0;
        let attemptsUsedThisIsland = 0;
        
        if (islandArea < 20) {
          strategy = 'PIXEL_FILL';
          shapes = island.map(p => ({ 
            type: 'pixel', 
            x: p.x, 
            y: p.y, 
            color 
          }));
          shapesArea = shapes.length;
          pixelFilledCount++;
          attemptsUsedThisIsland = 0; // Pixel fill uses no attempts
          
        } else if (islandArea < 100) {
          strategy = 'MICRO_PACK';
          
          // For adaptive, use large attempt count but with early exit
          let microAttempts;
          if (budgetingScheme === 'adaptive') {
            microAttempts = Math.min(islandArea * 30, 3000, remainingAttempts);
          } else {
            microAttempts = allocatedAttempts;
          }
          
          const microResult = await Packing.microPack(island, color, img.width, img.height, {
            minRadius: minCircleRadius,
            maxAttempts: microAttempts,
            earlyExitThreshold: budgetingScheme === 'adaptive' ? calculateAdaptiveThreshold(islandArea, adaptiveThreshold) : null
          });
          
          shapes = microResult.shapes || microResult;
          attemptsUsedThisIsland = microResult.attemptsUsed || microAttempts;
          remainingAttempts -= attemptsUsedThisIsland;
          clusterAttemptAccumulator += attemptsUsedThisIsland;
          setClusterAttempts(clusterAttemptAccumulator);
          microPackedCount++;
          
          for (const shape of shapes) {
            if (shape.type === 'circle') {
              shapesArea += Math.PI * shape.r * shape.r;
            }
          }
          
        } else {
          strategy = islandArea < 500 ? 'SMALL_PACK' : 'FULL_PACK';
          setProgress(`Packing cluster ${i + 1}/${k}, island ${c + 1}/${components.length} (${islandArea}px)`);
          setIslandAttempts(0); // Reset island counter
          
          const useMultiPassForIsland = enableMultiPass && islandArea >= 1000;
          
          // For adaptive, start with a reasonable allocation but allow early exit
          let finalAttempts;
          if (budgetingScheme === 'adaptive') {
            const proportional = Math.floor((islandArea / clusterPixelsTotal) * maxAttempts * 2);
            finalAttempts = Math.min(proportional, remainingAttempts);
          } else {
            finalAttempts = useMultiPassForIsland ? Math.floor(allocatedAttempts * 1.5) : allocatedAttempts;
            remainingAttempts -= finalAttempts;
          }
          
          fullPackedCount++;
          
          const packResult = await Packing.packCircles(island, color, img.width, img.height, {
            minRadius: minCircleRadius,
            maxRadius: maxCircleRadius,
            maxAttempts: finalAttempts,
            shapesPerBatch: 50,
            shapeType: shapeType,
            hexagonOrientation: hexagonOrientation,
            colorMode: colorMode,
            packingMode: packingMode,
            targetFillPercent: 0.95,
            enableMultiPass: useMultiPassForIsland,
            numPasses: numPasses,
            enableMixedShapes: enableMixedShapes,
            enableGapFilling: enableGapFilling,
            livePreview: enableLivePreview,
            canvasContext: enableLivePreview ? ctx : null,
            useSpatialHash: enableSpatialHash,
            enableSmartEarlyExit: enableSmartEarlyExit,
            earlyExitThreshold: budgetingScheme === 'adaptive' ? calculateAdaptiveThreshold(islandArea, adaptiveThreshold) : null,
            onProgress: (fillPercent, failedAttempts, islandAttemptCount) => {
              setProgress(`Cluster ${i + 1}/${k}, island ${c + 1}/${components.length} - ${Math.round(fillPercent * 100)}% filled`);
              if (islandAttemptCount !== undefined) {
                setIslandAttempts(islandAttemptCount);
                setClusterAttempts(clusterAttemptAccumulator + islandAttemptCount);
              }
            }
          });
          
          shapes = packResult.shapes || packResult;
          attemptsUsedThisIsland = packResult.attemptsUsed || finalAttempts;
          
          if (budgetingScheme === 'adaptive') {
            remainingAttempts -= attemptsUsedThisIsland;
          }
          
          clusterAttemptAccumulator += attemptsUsedThisIsland;
          setClusterAttempts(clusterAttemptAccumulator);
          
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
        
        if (shapes && shapes.length > 0) {
          islandsFilled++;
        } else {
          islandsSkipped++;
        }
        
        clusterPixelsFilled += shapesArea;
        const islandCoverage = ((shapesArea / islandArea) * 100).toFixed(1);
        
        const multiPassUsed = strategy === 'FULL_PACK' && enableMultiPass && islandArea >= 1000 ? ' [MULTI-PASS]' : '';
        
        // Show attempts used for this island
        const attemptsDisplay = budgetingScheme === 'adaptive' 
          ? `${attemptsUsedThisIsland} attempts used`
          : `${allocatedAttempts} attempts`;
        
        if (c < 5 || c === components.length - 1 || components.length <= 10) {
          console.log(`  Island ${c + 1}/${components.length}: ${islandArea}px → ${strategy}${multiPassUsed} → ${attemptsDisplay} → ${shapes.length} shapes → ${islandCoverage}% coverage`);
        } else if (c === 5) {
          console.log(`  ... (${components.length - 6} more islands) ...`);
        }
        
        clusterShapes = clusterShapes.concat(shapes);
      }
      
      const clusterCoverage = ((clusterPixelsFilled / clusterPixelsTotal) * 100).toFixed(1);
      const attemptsUsed = maxAttempts - remainingAttempts;
      const budgetWarning = islandsSkipped > 0 ? ' ⚠️ RAN OUT OF ATTEMPTS!' : '';
      
      console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`  📊 CLUSTER ${i + 1} SUMMARY:${budgetWarning}`);
      console.log(`     Total islands: ${components.length}`);
      console.log(`     Islands filled: ${islandsFilled} (${((islandsFilled/components.length)*100).toFixed(1)}%)`);
      console.log(`     Islands skipped: ${islandsSkipped} ${islandsSkipped > 0 ? '← Budget exhausted!' : ''}`);
      console.log(`     By strategy: ${pixelFilledCount} pixel-fill, ${microPackedCount} micro-pack, ${fullPackedCount} full-pack`);
      console.log(`     Attempts: ${attemptsUsed.toLocaleString()} / ${maxAttempts.toLocaleString()} used`);
      console.log(`     Total shapes: ${clusterShapes.length.toLocaleString()}`);
      console.log(`     Cluster coverage: ${clusterCoverage}%`);
      console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      
      let clusterArea = 0;
      for (const shape of clusterShapes) {
        if (shape.type === 'pixel') {
          clusterArea += 1;
        } else if (shape.type === 'circle') {
          clusterArea += Math.PI * shape.r * shape.r;
        } else if (shape.type === 'rectangle') {
          clusterArea += shape.w * shape.h;
        } else if (shape.type === 'triangle') {
          clusterArea += (Math.sqrt(3) / 4) * shape.r * shape.r;
        }
      }
      totalCoveredArea += clusterArea;
      
      const coverage = (totalCoveredArea / totalImageArea) * 100;
      setCoveragePercent(coverage);

      Packing.drawShapes(ctx, clusterShapes);

      // Collect all shapes for SVG export
      globalShapesArray.push(...clusterShapes);

      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Store all shapes for SVG export
    setAllShapes(globalShapesArray);
    console.log(`📦 Total shapes for SVG export: ${globalShapesArray.length.toLocaleString()}`);

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
          
          // Save/Load buttons
          React.createElement('div', { className: 'flex gap-2' },
            React.createElement('button', {
              onClick: saveImage,
              disabled: !canvasRef.current || processing,
              className: 'flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm'
            }, '💾 Save PNG'),

            React.createElement('button', {
              onClick: saveSVG,
              disabled: !allShapes || allShapes.length === 0 || processing,
              className: 'flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm'
            }, '📐 Save SVG')
          ),

          React.createElement('div', { className: 'flex gap-2' },
            React.createElement('button', {
              onClick: saveSettings,
              className: 'flex-1 bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 text-sm'
            }, '⚙️ Save Settings'),

            React.createElement('label', { className: 'flex-1' },
              React.createElement('input', {
                type: 'file',
                accept: '.json',
                onChange: loadSettings,
                className: 'hidden',
                ref: fileInputRef
              }),
              React.createElement('div', {
                className: 'bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 text-sm text-center cursor-pointer'
              }, '📂 Load Settings')
            )
          ),

          // Color Palette Export
          colorPalette && React.createElement('div', { className: 'border-t pt-3' },
            React.createElement('h3', { className: 'text-sm font-semibold mb-2' }, '🎨 Color Palette Export'),
            React.createElement('div', { className: 'flex gap-2 mb-2' },
              ...colorPalette.map((c, i) =>
                React.createElement('div', {
                  key: i,
                  style: {
                    backgroundColor: `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`,
                    width: '30px',
                    height: '30px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    title: rgbToHex(Math.round(c[0]), Math.round(c[1]), Math.round(c[2]))
                  },
                  onClick: () => {
                    const hex = rgbToHex(Math.round(c[0]), Math.round(c[1]), Math.round(c[2]));
                    navigator.clipboard.writeText(hex);
                    alert(`Copied ${hex} to clipboard!`);
                  }
                })
              )
            ),
            React.createElement('div', { className: 'flex gap-2' },
              React.createElement('button', {
                onClick: exportPaletteJSON,
                className: 'flex-1 bg-orange-500 text-white py-2 px-3 rounded hover:bg-orange-600 text-xs'
              }, 'Export JSON'),
              React.createElement('button', {
                onClick: exportPaletteCSS,
                className: 'flex-1 bg-orange-500 text-white py-2 px-3 rounded hover:bg-orange-600 text-xs'
              }, 'Export CSS')
            )
          ),

          // Preset Configurations
          React.createElement('div', { className: 'border-t pt-3' },
            React.createElement('h3', { className: 'text-sm font-semibold mb-2' }, '⚡ Preset Configurations'),
            React.createElement('div', { className: 'grid grid-cols-2 gap-2' },
              React.createElement('button', {
                onClick: () => applyPreset('maxQuality'),
                className: 'bg-indigo-500 text-white py-2 px-3 rounded hover:bg-indigo-600 text-xs'
              }, '🎨 Max Quality'),
              React.createElement('button', {
                onClick: () => applyPreset('balanced'),
                className: 'bg-indigo-500 text-white py-2 px-3 rounded hover:bg-indigo-600 text-xs'
              }, '⚖️ Balanced'),
              React.createElement('button', {
                onClick: () => applyPreset('maxDetail'),
                className: 'bg-indigo-500 text-white py-2 px-3 rounded hover:bg-indigo-600 text-xs'
              }, '🔬 Max Detail'),
              React.createElement('button', {
                onClick: () => applyPreset('fastPreview'),
                className: 'bg-indigo-500 text-white py-2 px-3 rounded hover:bg-indigo-600 text-xs'
              }, '⚡ Fast Preview')
            )
          ),

          // Recommended Settings
          imageStats && React.createElement('div', { className: 'border-t pt-3' },
            React.createElement('h3', { className: 'text-sm font-semibold mb-2' }, '💡 AI Recommended Settings'),
            React.createElement('div', { className: 'text-xs text-gray-600 mb-2' },
              `Image: ${imageStats.stats.resolution.toLocaleString()}px, ` +
              `${imageStats.stats.isColorful ? 'Colorful' : 'Muted'}, ` +
              `${imageStats.stats.isLandscape ? 'Landscape' : imageStats.stats.isPortrait ? 'Portrait' : 'Square'}`
            ),
            React.createElement('button', {
              onClick: applyRecommendedSettings,
              className: 'w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 text-sm font-semibold'
            }, '✨ Apply Recommended Settings')
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
          
          // Budgeting scheme selector
          React.createElement('div', { className: 'border-t pt-4' },
            React.createElement('h3', { className: 'text-lg font-semibold mb-3' }, 'Attempt Budgeting Strategy'),
            React.createElement('select', {
              value: budgetingScheme,
              onChange: (e) => setBudgetingScheme(e.target.value),
              className: 'border rounded px-3 py-2 w-full mb-2'
            },
              React.createElement('option', { value: 'fairshare' }, 'Fair Share (balanced distribution)'),
              React.createElement('option', { value: 'proportional' }, 'Proportional (by island size)'),
              React.createElement('option', { value: 'weighted' }, 'Weighted (large islands get 2x)'),
              React.createElement('option', { value: 'fixed' }, 'Fixed + Bonus (1000 base + proportional)'),
              React.createElement('option', { value: 'exponential' }, 'Exponential (sqrt scaling)'),
              React.createElement('option', { value: 'adaptive' }, 'Adaptive (move on when progress stalls)')
            ),
            
            budgetingScheme === 'adaptive' && React.createElement('div', { className: 'space-y-3' },
              React.createElement('div', { className: 'flex items-center gap-3' },
                React.createElement('label', { className: 'block text-sm font-medium' }, 'Threshold Mode:'),
                React.createElement('select', {
                  value: adaptiveThresholdMode,
                  onChange: (e) => setAdaptiveThresholdMode(e.target.value),
                  className: 'border rounded px-3 py-1 text-sm'
                },
                  React.createElement('option', { value: 'fixed' }, 'Fixed'),
                  React.createElement('option', { value: 'scaled' }, 'Scaled by Island Size')
                )
              ),
              createSliderWithInput(
                `Base Early Exit Threshold: ${adaptiveThreshold}`,
                adaptiveThreshold,
                (e) => setAdaptiveThreshold(parseInt(e.target.value)),
                50,
                1000,
                50,
                adaptiveThresholdMode === 'fixed'
                  ? '(failed attempts before moving to next island)'
                  : '(base threshold, scaled per island: large=1.67x, medium=1x, small=0.5x)'
              )
            ),
            
            React.createElement('div', { className: 'text-xs text-gray-600 bg-gray-50 p-3 rounded' },
              React.createElement('strong', null, 'Budgeting Schemes:'),
              React.createElement('ul', { className: 'list-disc ml-5 mt-1 space-y-1' },
                React.createElement('li', null, React.createElement('strong', null, 'Fair Share:'), ' Divides attempts evenly, caps by size'),
                React.createElement('li', null, React.createElement('strong', null, 'Proportional:'), ' Strictly by island size (large islands get much more)'),
                React.createElement('li', null, React.createElement('strong', null, 'Weighted:'), ' Large islands (500+ px) get double their proportional share'),
                React.createElement('li', null, React.createElement('strong', null, 'Fixed + Bonus:'), ' Each island gets 1000 base + proportional bonus'),
                React.createElement('li', null, React.createElement('strong', null, 'Exponential:'), ' Scales by sqrt(size) - balances large and small'),
                React.createElement('li', null, React.createElement('strong', null, 'Adaptive:'), ' Moves to next island after X failed attempts (most efficient!)')
              )
            )
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
            
            React.createElement('div', { className: 'flex items-center gap-2 mb-3' },
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
            ),

            React.createElement('div', { className: 'flex items-center gap-2 mb-3' },
              React.createElement('input', {
                type: 'checkbox',
                id: 'livepreview',
                checked: enableLivePreview,
                onChange: (e) => setEnableLivePreview(e.target.checked),
                className: 'w-4 h-4'
              }),
              React.createElement('label', { htmlFor: 'livepreview', className: 'text-sm font-medium' },
                'Enable Live Preview'
              ),
              React.createElement('span', { className: 'text-xs text-gray-500 ml-2' },
                '(Show shapes appearing in real-time)'
              )
            ),

            React.createElement('div', { className: 'flex items-center gap-2 mb-3' },
              React.createElement('input', {
                type: 'checkbox',
                id: 'spatialhash',
                checked: enableSpatialHash,
                onChange: (e) => setEnableSpatialHash(e.target.checked),
                className: 'w-4 h-4'
              }),
              React.createElement('label', { htmlFor: 'spatialhash', className: 'text-sm font-medium' },
                'Enable Spatial Hashing'
              ),
              React.createElement('span', { className: 'text-xs text-gray-500 ml-2' },
                '(5-10x faster collision detection - recommended)'
              )
            ),

            React.createElement('div', { className: 'flex items-center gap-2' },
              React.createElement('input', {
                type: 'checkbox',
                id: 'smartexit',
                checked: enableSmartEarlyExit,
                onChange: (e) => setEnableSmartEarlyExit(e.target.checked),
                className: 'w-4 h-4'
              }),
              React.createElement('label', { htmlFor: 'smartexit', className: 'text-sm font-medium' },
                'Enable Smart Early Exit'
              ),
              React.createElement('span', { className: 'text-xs text-gray-500 ml-2' },
                '(Exit when placement rate drops - 30-50% faster)'
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
              React.createElement('option', { value: 'triangle' }, 'Triangle'),
              React.createElement('option', { value: 'hexagon' }, 'Hexagon')
            ),
            enableMixedShapes && React.createElement('span', { className: 'text-xs text-gray-500 mt-1 block' },
              'Shape type disabled when Mixed Shapes is enabled'
            )
          ),

          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Hexagon Orientation'),
            React.createElement('select', {
              value: hexagonOrientation,
              onChange: (e) => setHexagonOrientation(e.target.value),
              className: 'border rounded px-3 py-2 w-full'
            },
              React.createElement('option', { value: 'pointy' }, 'Pointy-top ⬡'),
              React.createElement('option', { value: 'flat' }, 'Flat-top ⬢'),
              React.createElement('option', { value: 'random' }, 'Random Mix')
            ),
            React.createElement('span', { className: 'text-xs text-gray-500 mt-1 block' },
              'Applies to hexagon shapes and mixed shapes mode'
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
          
          processing && (islandAttempts > 0 || clusterAttempts > 0) && React.createElement('div', { className: 'mt-2 space-y-1' },
            islandAttempts > 0 && React.createElement('div', { className: 'text-sm text-gray-700' },
              `🎯 Current Island: ${islandAttempts.toLocaleString()} attempts`
            ),
            clusterAttempts > 0 && React.createElement('div', { className: 'text-sm text-gray-700' },
              `📊 Current Cluster: ${clusterAttempts.toLocaleString()} attempts`
            )
          ),
          
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
