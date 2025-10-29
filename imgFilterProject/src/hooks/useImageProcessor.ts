import { useState, useCallback } from "react";

export const useImageProcessor = (uploadedImage: string | null) => {
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  const applyFilter = useCallback(async (filter: string) => {
    if (!uploadedImage) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply filter effects based on selection
      switch (filter) {
        case "vampire":
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.3); // Boost red
            data[i + 1] *= 0.7; // Reduce green
            data[i + 2] *= 0.7; // Reduce blue
          }
          break;
        
        case "zombie":
          for (let i = 0; i < data.length; i += 4) {
            data[i] *= 0.8;
            data[i + 1] = Math.min(255, data[i + 1] * 1.2); // Green tint
            data[i + 2] *= 0.8;
          }
          break;
        
        case "ghost":
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = data[i + 1] = data[i + 2] = Math.min(255, avg * 1.5);
            data[i + 3] *= 0.8; // Transparency
          }
          break;
        
        case "pumpkin":
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.4); // Boost red
            data[i + 1] = Math.min(255, data[i + 1] * 1.2); // Boost green (orange)
            data[i + 2] *= 0.6; // Reduce blue
          }
          break;
        
        case "witch":
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.2); // Boost red
            data[i + 1] *= 0.8;
            data[i + 2] = Math.min(255, data[i + 2] * 1.3); // Boost blue (purple)
          }
          break;
        
        case "demon":
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.5); // Strong red
            data[i + 1] *= 0.5;
            data[i + 2] *= 0.5;
          }
          break;
        
        case "skeleton":
          for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const contrast = gray > 128 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = contrast;
          }
          break;
        
        case "possessed":
          for (let i = 0; i < data.length; i += 4) {
            data[i] *= 0.9;
            data[i + 1] *= 0.9;
            data[i + 2] *= 0.9;
            // Dark, desaturated look
          }
          break;
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedImage(canvas.toDataURL("image/png"));
    };

    img.src = uploadedImage;
  }, [uploadedImage]);

  return { processedImage, applyFilter };
};
