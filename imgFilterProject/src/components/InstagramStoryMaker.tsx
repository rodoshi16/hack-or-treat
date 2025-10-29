import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ImageIcon, Wand2, Download, ArrowLeft, ArrowRight, Video, Play } from "lucide-react";
import { toast } from "sonner";
import { generateHalloweenRoast } from "@/lib/gemini";

interface ProcessedStory {
  originalImage: string;
  processedImage: string;
  caption: string;
}

export function InstagramStoryMaker() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [processedStories, setProcessedStories] = useState<ProcessedStory[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingReel, setIsGeneratingReel] = useState(false);
  const [generatedReel, setGeneratedReel] = useState<string | null>(null);
  const [theme, setTheme] = useState("Horror Story");
  const [imageDuration, setImageDuration] = useState(2); // seconds per image
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length < 4) {
      toast.error("Minimum 4 images required for a complete horror story.");
      return;
    }

    if (files.length > 8) {
      toast.warning("Maximum 8 images allowed. Taking the first 8.");
    }

    const validFiles = files.slice(0, 8).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length < 4) {
      toast.error("At least 4 valid images are required for a horror story.");
      return;
    }
    
    Promise.all(
      validFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      })
    ).then(imageDataUrls => {
      setUploadedImages(imageDataUrls);
      setProcessedStories([]);
      setCurrentStoryIndex(0);
      toast.success(`Uploaded ${imageDataUrls.length} images - ready for horror story!`);
    });
  };

  const generateHorrorStory = async (allImages: string[]): Promise<string[]> => {
    try {
      console.log("🎭 Generating horror story with Gemini...");
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key not found");
      }

      // Prepare all images for the API call
      const imageParts = allImages.map((imageData, index) => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData.split(',')[1] // Remove data URL prefix
        }
      }));

      const prompt = `Look at these ${allImages.length} images and create a cohesive horror story that uses each image as a chapter. 

      Write a spooky, suspenseful story with ${allImages.length} parts - one for each image in order. Each part should be 1-2 sentences that creates tension and moves the story forward.

      Structure:
      - Part 1: Set the eerie scene
      - Part 2: Something strange begins
      - Part 3: The horror escalates
      - Part 4: The terrifying climax
      ${allImages.length > 4 ? `- Continue building tension for remaining parts` : ''}

      Make it genuinely creepy but suitable for social media. Focus on psychological horror and suspense rather than gore. Each part should end with a cliffhanger that makes you want to see the next image.

      Return ONLY the story parts separated by "|" with no other text. Example format:
      Part 1 text here|Part 2 text here|Part 3 text here|Part 4 text here`;

      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            ...imageParts
          ]
        }]
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const storyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Split the story into parts
      const storyParts = storyText.split('|').map(part => part.trim());
      
      // Ensure we have the right number of parts
      if (storyParts.length !== allImages.length) {
        console.warn(`Expected ${allImages.length} story parts, got ${storyParts.length}`);
        // Pad with generic parts if needed
        while (storyParts.length < allImages.length) {
          storyParts.push("The horror continues...");
        }
      }

      console.log("✅ Horror story generated successfully");
      return storyParts.slice(0, allImages.length);
      
    } catch (error) {
      console.error("❌ Error generating horror story:", error);
      
      // Fallback horror story parts
      const fallbackStory = [
        "Something felt wrong the moment I arrived... 😨",
        "The shadows seemed to move on their own... 👻", 
        "I should have left when I had the chance... 💀",
        "Now there's no escape from this nightmare... 🔥"
      ];
      
      // Extend fallback if more images
      while (fallbackStory.length < allImages.length) {
        fallbackStory.push("The terror never ends... 😱");
      }
      
      return fallbackStory.slice(0, allImages.length);
    }
  };

  const generateCustomCaption = async (imageData: string, theme: string): Promise<string> => {
    try {
      console.log("🤖 Generating story caption with Gemini...");
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key not found");
      }

      // Convert base64 image data
      const imageBase64 = imageData.split(',')[1];
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `Create a short, engaging Instagram story caption for this image. Theme: ${theme}. 
                  Make it 1-2 short sentences, trendy, and perfect for social media. 
                  Include relevant emojis but keep it concise and catchy.
                  Examples: "Main character energy ✨", "Serving looks 💅", "This is my moment 🌟"`
                },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64
                  }
                }
              ]
            }]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const caption = data.candidates?.[0]?.content?.parts?.[0]?.text || "Living my best life ✨";
      
      console.log("✅ Story caption generated successfully");
      return caption.trim();
      
    } catch (error) {
      console.error("❌ Error generating story caption:", error);
      
      // Fallback captions
      const fallbackCaptions = [
        "Main character energy ✨",
        "Serving looks 💅", 
        "This is my moment 🌟",
        "Living my best life 🔥",
        "Feeling myself today 💫"
      ];
      
      return fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)];
    }
  };

  const addTextToImage = (imageData: string, caption: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve(imageData);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageData);
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Set canvas to Instagram story dimensions (9:16 aspect ratio)
        const targetWidth = 600;
        const targetHeight = 1067; // 600 * (16/9)
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Calculate image scaling to fit properly
        const imageAspect = img.width / img.height;
        const canvasAspect = targetWidth / targetHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imageAspect > canvasAspect) {
          // Image is wider - fit to height
          drawHeight = targetHeight;
          drawWidth = drawHeight * imageAspect;
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller - fit to width
          drawWidth = targetWidth;
          drawHeight = drawWidth / imageAspect;
          offsetX = 0;
          offsetY = (targetHeight - drawHeight) / 2;
        }

        // Fill background with black
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw the image
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Add horror-themed text overlay at the top
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; // Darker stroke for better contrast
        ctx.lineWidth = 4;
        ctx.font = 'bold 36px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Add dramatic text shadow effect
        const x = targetWidth / 2;
        let y = 30;
        
        // Split text into multiple lines if it's too long
        const words = caption.split(' ');
        const maxWordsPerLine = 4; // Reduce words per line due to larger font
        const lines: string[] = [];
        
        for (let i = 0; i < words.length; i += maxWordsPerLine) {
          lines.push(words.slice(i, i + maxWordsPerLine).join(' '));
        }
        
        // Draw each line with shadow effect
        lines.forEach((line, index) => {
          const lineY = y + (index * 45); // Increase line spacing for larger font
          
          // Shadow effect (multiple layers for depth)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillText(line, x + 2, lineY + 2);
          ctx.fillText(line, x + 1, lineY + 1);
          
          // Stroke (outline)
          ctx.strokeText(line, x, lineY);
          
          // Main text
          ctx.fillStyle = 'white';
          ctx.fillText(line, x, lineY);
        });

        // Convert canvas to data URL
        const processedImageData = canvas.toDataURL('image/jpeg', 0.9);
        resolve(processedImageData);
      };

      img.src = imageData;
    });
  };

  const processAllImages = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Please upload images first");
      return;
    }

    if (uploadedImages.length < 4) {
      toast.error("Minimum 4 images required for a horror story");
      return;
    }

    setIsProcessing(true);
    setProcessedStories([]);

    try {
      toast.info("Analyzing all images to create horror story...");
      
      // Generate the complete horror story based on all images
      const storyParts = await generateHorrorStory(uploadedImages);
      
      const processed: ProcessedStory[] = [];

      for (let i = 0; i < uploadedImages.length; i++) {
        const imageData = uploadedImages[i];
        const storyPart = storyParts[i];
        
        toast.info(`Creating story slide ${i + 1}/${uploadedImages.length}...`);
        
        // Add text to image
        const processedImage = await addTextToImage(imageData, storyPart);
        
        processed.push({
          originalImage: imageData,
          processedImage,
          caption: storyPart
        });
      }

      setProcessedStories(processed);
      setCurrentStoryIndex(0);
      toast.success("Horror story complete! 👻");
      
    } catch (error) {
      console.error("Error processing images:", error);
      toast.error("Failed to create horror story");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCurrentStory = () => {
    if (processedStories.length === 0) return;
    
    const current = processedStories[currentStoryIndex];
    const link = document.createElement('a');
    link.href = current.processedImage;
    link.download = `story-${currentStoryIndex + 1}.jpg`;
    link.click();
    
    toast.success("Story downloaded! 📱");
  };

  const downloadAllStories = () => {
    if (processedStories.length === 0) return;
    
    processedStories.forEach((story, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = story.processedImage;
        link.download = `story-${index + 1}.jpg`;
        link.click();
      }, index * 500); // Stagger downloads
    });
    
    toast.success("All stories downloaded! 📱");
  };

  const generateInstagramReel = async () => {
    if (processedStories.length === 0) {
      toast.error("Please generate stories first");
      return;
    }

    setIsGeneratingReel(true);
    setGeneratedReel(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas not available");
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Canvas context not available");
      }

      // Instagram Reel dimensions (9:16 aspect ratio)
      const width = 600;
      const height = 1067;
      canvas.width = width;
      canvas.height = height;

      // Setup MediaRecorder for video creation
      const stream = canvas.captureStream(30); // 30 FPS
      
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8';
      }

      console.log("Creating reel with mimeType:", mimeType);
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
        setGeneratedReel(videoUrl);
        console.log("🎬 Instagram Reel created successfully!");
        toast.success("Your Instagram Reel is ready! 🎬");
      };

      mediaRecorder.onerror = (error) => {
        console.error("MediaRecorder error:", error);
        toast.error("Failed to create reel");
      };

      // Start recording
      console.log("🎬 Starting reel recording...");
      mediaRecorder.start();

      // Calculate total frames
      const totalImages = processedStories.length;
      const framesPerImage = imageDuration * 30; // 30 FPS
      const totalFrames = totalImages * framesPerImage;
      let currentFrame = 0;

      const animate = async () => {
        const imageIndex = Math.floor(currentFrame / framesPerImage);
        
        if (imageIndex >= totalImages) {
          console.log("🛑 Stopping reel recording...");
          mediaRecorder.stop();
          return;
        }

        const currentStory = processedStories[imageIndex];
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Load and draw the current story image
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          
          currentFrame++;
          
          // Update progress
          const progress = Math.round((currentFrame / totalFrames) * 100);
          if (currentFrame % 30 === 0) { // Update every second
            toast.info(`Creating reel... ${progress}%`);
          }
          
          requestAnimationFrame(animate);
        };
        
        img.src = currentStory.processedImage;
      };

      // Start animation
      animate();

    } catch (error) {
      console.error("Error generating reel:", error);
      toast.error("Failed to generate Instagram Reel");
    } finally {
      setIsGeneratingReel(false);
    }
  };

  const downloadReel = () => {
    if (!generatedReel) return;
    
    const link = document.createElement('a');
    link.href = generatedReel;
    link.download = 'instagram-reel.mp4';
    link.click();
    
    toast.success("Reel downloaded! 📱");
  };

  return (
    <Card className="p-6 space-y-6 border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-primary">Horror Story Generator</h2>
        <span className="text-xl">👻</span>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="story-images" className="text-base">
            Upload Images (4-8 images required for horror story)
          </Label>
          <Input
            id="story-images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isProcessing}
            className="mt-2"
          />
          {uploadedImages.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {uploadedImages.length} image(s) selected {uploadedImages.length >= 4 ? "✅" : `(need ${4 - uploadedImages.length} more)`}
            </p>
          )}
        </div>

        <div className="bg-muted/30 p-4 rounded-lg border border-primary/10">
          <h3 className="text-sm font-semibold text-primary mb-2">📖 How it works:</h3>
          <p className="text-sm text-muted-foreground">
            Upload 4-8 images and AI will analyze them to create a cohesive horror story. Each image becomes a chapter with spine-chilling text that builds suspense from start to finish.
          </p>
        </div>

        <div>
          <Label htmlFor="image-duration" className="text-base">
            Duration per Image (seconds) - for Reels
          </Label>
          <Input
            id="image-duration"
            type="number"
            min="1"
            max="5"
            value={imageDuration}
            onChange={(e) => setImageDuration(Number(e.target.value))}
            disabled={isProcessing || isGeneratingReel}
            className="mt-2"
          />
        </div>

        <div className="space-y-2">
          <Button
            onClick={processAllImages}
            disabled={isProcessing || uploadedImages.length < 4}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Horror Story...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Horror Story 👻
              </>
            )}
          </Button>

          {processedStories.length > 0 && (
            <Button
              onClick={generateInstagramReel}
              disabled={isGeneratingReel || isProcessing}
              className="w-full"
              size="lg"
              variant="secondary"
            >
              {isGeneratingReel ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Reel...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Create Horror Reel 🎬
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Story Preview */}
      {processedStories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Horror Story 📚</h3>
            <div className="flex gap-2">
              <Button
                onClick={downloadCurrentStory}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download This
              </Button>
              <Button
                onClick={downloadAllStories}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>
          </div>

          {/* Story Navigation */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setCurrentStoryIndex(Math.max(0, currentStoryIndex - 1))}
              disabled={currentStoryIndex === 0}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {currentStoryIndex + 1} / {processedStories.length}
            </span>
            
            <Button
              onClick={() => setCurrentStoryIndex(Math.min(processedStories.length - 1, currentStoryIndex + 1))}
              disabled={currentStoryIndex === processedStories.length - 1}
              variant="outline"
              size="sm"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Current Story Display */}
          <div className="flex justify-center">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ width: '300px', height: '533px' }}>
              <img
                src={processedStories[currentStoryIndex].processedImage}
                alt={`Story ${currentStoryIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="text-center">
            <div className="bg-muted/50 p-3 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary mb-1">Chapter {currentStoryIndex + 1}:</p>
              <p className="text-sm leading-relaxed">"{processedStories[currentStoryIndex].caption}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Reel Preview */}
      {generatedReel && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Horror Reel 🎬</h3>
            <Button
              onClick={downloadReel}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Reel
            </Button>
          </div>

          <div className="flex justify-center">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ width: '300px', height: '533px' }}>
              <video
                src={generatedReel}
                controls
                autoPlay
                loop
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Duration: {processedStories.length * imageDuration} seconds • {processedStories.length} slides
            </p>
          </div>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Card>
  );
}