import { useCallback } from "react";

export const useGifGenerator = () => {
  console.log("GIF generation button is clicked");
  const generateGif = useCallback(async (imageData: string, filter: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        console.log("🎬 Creating animated canvas instead of GIF...");
        createAnimatedCanvas(imageData, filter, resolve, reject);
      } catch (error) {
        console.error("❌ Error in generateGif:", error);
        reject(error);
      }
    });
  }, []);

  const createAnimatedCanvas = (
    imageData: string,
    filter: string,
    resolve: (url: string) => void,
    reject: (error: Error) => void
  ) => {
    console.log("🎨 Creating animated video with user image:", imageData.substring(0, 50) + "...");
    
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("❌ Failed to get canvas context");
        reject(new Error("Failed to get canvas context"));
        return;
      }

      console.log("📷 Loading user image...");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        console.log("✅ User image loaded, loading jumpscare image...");
        
        // Load the jumpscare image
        const jumpscareImg = new Image();
        jumpscareImg.crossOrigin = "anonymous";
        jumpscareImg.onload = () => {
          console.log("✅ Jumpscare image loaded, creating video...");
          startVideoRecording();
        };
        
        jumpscareImg.onerror = () => {
          console.warn("❌ Jumpscare image failed to load, using fallback");
          startVideoRecording();
        };
        
        jumpscareImg.src = "/jumpscare-1.jpeg";
        
        function startVideoRecording() {
          // Use MediaRecorder to create a video instead of GIF
          const stream = canvas.captureStream(30); // 30 FPS
          
          // Try different mimeTypes until we find a supported one
          let mimeType = 'video/webm';
          if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            mimeType = 'video/webm;codecs=vp9';
          } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            mimeType = 'video/webm;codecs=vp8';
          } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
          }
          
          console.log("Using mimeType:", mimeType);
          const mediaRecorder = new MediaRecorder(stream, { mimeType });
          
          const chunks: Blob[] = [];
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };
          
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const videoUrl = URL.createObjectURL(blob);
            console.log("🎉 Video created successfully!");
            // Add a marker to indicate this is a video
            resolve(videoUrl + '#video');
          };
          
          mediaRecorder.onerror = (error) => {
            console.error("❌ MediaRecorder error:", error);
            reject(new Error("Failed to record video"));
          };
          
          console.log("🎬 Starting video recording...");
          mediaRecorder.start();
          
          let frame = 0;
          const totalFrames = 150; // 5 seconds at 30fps
          
          const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (frame < 60) {
              // Show user image for 2 seconds (60 frames)
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            } else {
              // Show jumpscare image for 3 seconds (90 frames) - extended pause
              if (jumpscareImg.complete) {
                ctx.drawImage(jumpscareImg, 0, 0, canvas.width, canvas.height);
              } else {
                // Fallback if image didn't load
                ctx.fillStyle = "#8B0000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#FFF";
                ctx.font = "bold 72px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("👹", canvas.width / 2, canvas.height / 2);
              }
            }
            
            frame++;
            
            if (frame < totalFrames) {
              requestAnimationFrame(animate);
            } else {
              console.log("🛑 Stopping recording...");
              mediaRecorder.stop();
            }
          };
          
          animate();
        }
      };

      img.onerror = (e) => {
        console.error("❌ Failed to load image:", e);
        reject(new Error("Failed to load image"));
      };
      
      img.src = imageData;
      
    } catch (error) {
      console.error("❌ Error in createAnimatedCanvas:", error);
      reject(error as Error);
    }
  };

  console.log({ generateGif });
  return { generateGif };
};
