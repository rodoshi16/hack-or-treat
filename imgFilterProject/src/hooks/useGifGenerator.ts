import { useCallback } from "react";

export const useGifGenerator = () => {
  const generateGif = useCallback(async (imageData: string, filter: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Load gif.js dynamically
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js";
        script.onload = () => {
          createGif(imageData, filter, resolve, reject);
        };
        script.onerror = () => reject(new Error("Failed to load gif.js"));
        document.head.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const createGif = (
    imageData: string,
    filter: string,
    resolve: (url: string) => void,
    reject: (error: Error) => void
  ) => {
    // @ts-ignore - gif.js is loaded dynamically
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: 500,
      height: 500,
    });

    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Add filtered image frames (2 seconds = 20 frames at 100ms each)
      for (let i = 0; i < 20; i++) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        gif.addFrame(canvas, { delay: 100, copy: true });
      }

      // Add jumpscare frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#8B0000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add scary face (simplified)
      ctx.fillStyle = "#000";
      ctx.font = "bold 200px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👹", canvas.width / 2, canvas.height / 2);
      
      ctx.fillStyle = "#FFF";
      ctx.font = "bold 60px Arial";
      ctx.fillText("BOO!", canvas.width / 2, canvas.height - 80);
      
      gif.addFrame(canvas, { delay: 200, copy: true });

      // Add final message frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const messages = [
        "GOTCHA! 😈",
        "Sweet Dreams... 👻",
        "Hope you didn't jump! 🎃",
        "Happy Halloween! 🧛",
        "Did I scare you? 💀"
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      ctx.fillStyle = "#FF6B35";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText(randomMessage, canvas.width / 2, canvas.height / 2);
      
      gif.addFrame(canvas, { delay: 1500 });

      gif.on("finished", (blob: Blob) => {
        resolve(URL.createObjectURL(blob));
      });

      gif.render();
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageData;
  };

  return { generateGif };
};
