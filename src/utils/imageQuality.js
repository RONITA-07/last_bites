/**
 * Loads a base64 or DataURL image into an HTMLImageElement
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Performs client-side image quality analysis using an offscreen canvas.
 * Assesses average brightness and contrast (as standard deviation of luminance).
 */
export async function analyzeImageQuality(base64Data) {
  try {
    const img = await loadImage(base64Data);
    
    // Create offscreen canvas for swift pixel analysis
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    // Choose a fixed size for speed
    const width = 120;
    const height = 120;
    canvas.width = width;
    canvas.height = height;
    
    if (!ctx) {
      throw new Error("Could not initialize 2D canvas context");
    }
    
    // Draw image onto canvas
    ctx.drawImage(img, 0, 0, width, height);
    
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    let totalLuminance = 0;
    const grayscaleValues = [];
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Standard perceived perceived luminance weights
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuminance += luminance;
      grayscaleValues.push(luminance);
    }
    
    const pixelCount = grayscaleValues.length;
    const avgBrightness = totalLuminance / pixelCount;
    
    // Calculate variance and standard deviation for contrast/blur check
    let sumOfSquares = 0;
    for (let i = 0; i < pixelCount; i++) {
      const diff = grayscaleValues[i] - avgBrightness;
      sumOfSquares += diff * diff;
    }
    
    const variance = sumOfSquares / pixelCount;
    const standardDeviation = Math.sqrt(variance); // Lower standard deviation = lower contrast (blurry or flat)
    
    // Custom threshold rules
    const tooDark = avgBrightness < 40;  // Very low illumination
    const tooBright = avgBrightness > 225; // Overexposed
    const isBlurry = standardDeviation < 18; // Very flat lighting, lacking edges/features
    
    let score = 100;
    let details = "Excellent image quality.";
    
    if (tooDark) {
      score -= 40;
      details = "Image is too dark. Please add more lighting or turn on your flashlight.";
    } else if (tooBright) {
      score -= 30;
      details = "Image is too bright or overexposed. Avoid shooting directly into strong lights.";
    }
    
    if (isBlurry) {
      score -= 40;
      details = tooDark 
        ? "Image is too dark and lacks contrast. Try increasing the illumination." 
        : "Image appears blurry or low contrast. Stabilize your camera and hold closer to the food item.";
    }
    
    // Guard overall score boundaries
    score = Math.max(0, Math.min(100, score));
    const ok = score >= 50; // Pass if score is at least 50
    
    return {
      brightness: Math.round(avgBrightness),
      contrast: Math.round(standardDeviation),
      tooDark,
      tooBright,
      isBlurry,
      score,
      ok,
      details,
    };
  } catch (err) {
    console.error("Client image quality check failed:", err);
    return {
      brightness: 120,
      contrast: 50,
      tooDark: false,
      tooBright: false,
      isBlurry: false,
      score: 85,
      ok: true,
      details: "Quality check bypassed due to a read error. Proceeding with analysis.",
    };
  }
}
