import { useState, useEffect } from "react";
import { Upload, Wand2, Download, Share2, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { FilterSelector } from "@/components/FilterSelector";
import { GeminiRoast } from "@/components/GeminiRoast";
import { GifPreview } from "@/components/GifPreview";
import { InstagramStoryMaker } from "@/components/InstagramStoryMaker";
import { useImageProcessor } from "@/hooks/useImageProcessor";
import { useGifGenerator } from "@/hooks/useGifGenerator";
import { toast } from "sonner";

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [generatedGif, setGeneratedGif] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { processedImage, applyFilter } = useImageProcessor(uploadedImage);
  const { generateGif } = useGifGenerator();

  useEffect(() => console.log(uploadedImage), [uploadedImage]);
  useEffect(() => {
    console.log("generatedGif changed");
    console.log(generatedGif);
  }, [generatedGif]);

  const handleImageUpload = (imageData: string) => {
    setUploadedImage(imageData);
    setGeneratedGif(null);
    toast.success("Image uploaded successfully! 👻");
  };

  const handleFilterSelect = async (filter: string) => {
    setSelectedFilter(filter);
    if (uploadedImage) {
      await applyFilter(filter);
    }
  };

  const handleGenerateGif = async () => {
    // Temporarily comment out filter requirement to isolate GIF generation
    if (!uploadedImage) {
      toast.error("Please upload an image first!");
      return;
    }

    setIsGenerating(true);
    try {
      // Use original uploaded image instead of processed image for testing
      const gif = await generateGif(uploadedImage, selectedFilter || "vampire");
      console.log("gif is generated");
      console.log(gif);
      setGeneratedGif(gif);
      toast.success("Your spooky GIF is ready! 🎃");
    } catch (error) {
      toast.error("Failed to generate GIF. Please try again!");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedGif) return;
    
    const cleanUrl = generatedGif.replace('#video', '');
    const isVideo = generatedGif.includes('#video');
    
    if (isVideo) {
      // For videos, detect the actual format from the blob
      try {
        const response = await fetch(cleanUrl);
        const blob = await response.blob();
        const mimeType = blob.type;
        
        let extension = 'mp4';
        if (mimeType.includes('webm')) {
          extension = 'webm';
        } else if (mimeType.includes('mp4')) {
          extension = 'mp4';
        }
        
        const link = document.createElement("a");
        link.href = cleanUrl;
        link.download = `halloween-costume-flex.${extension}`;
        link.click();
        toast.success(`Downloading your spooky video! 👻`);
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Failed to download video');
      }
    } else {
      // For actual GIFs
      const link = document.createElement("a");
      link.href = cleanUrl;
      link.download = 'halloween-costume-flex.gif';
      link.click();
      toast.success('Downloading your spooky GIF! 👻');
    }
  };

  const handleShare = async () => {
    if (!generatedGif) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard! 🎃");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setSelectedFilter(null);
    setGeneratedGif(null);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Ghost className="w-12 h-12 text-primary animate-float" />
            <h1 className="text-5xl md:text-7xl font-creepy text-primary text-glow">
              Halloween Costume Flex
            </h1>
            <Ghost className="w-12 h-12 text-primary animate-float" style={{ animationDelay: "1s" }} />
          </div>
          <p className="text-xl text-muted-foreground">
            Upload your costume, apply spooky filters, and create shareable GIFs with AI-powered roasts!
          </p>
        </header>

        {/* Main Content */}
        <div className="grid gap-8">
          {/* Story Maker Section */}
          <InstagramStoryMaker />
          {/* Upload Section */}
          {!uploadedImage && (
            <Card className="p-8 border-2 border-primary/20 hover:border-primary/40 transition-all spooky-hover">
              <ImageUpload onImageUpload={handleImageUpload} />
            </Card>
          )}

          {/* Processing Section */}
          {uploadedImage && !generatedGif && (
            <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
              {/* Left: Preview */}
              <Card className="p-6 border-2 border-primary/20">
                <h2 className="text-2xl font-creepy text-primary mb-4 flex items-center gap-2">
                  <Wand2 className="w-6 h-6" />
                  Preview
                </h2>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={uploadedImage}
                    alt="Costume preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </Card>

              {/* Right: Controls */}
              <div className="space-y-6">
                <Card className="p-6 border-2 border-primary/20">
                  <FilterSelector
                    selectedFilter={selectedFilter}
                    onFilterSelect={handleFilterSelect}
                  />
                </Card>

                <GeminiRoast
                  imageData={uploadedImage}
                  selectedFilter={selectedFilter}
                />

                <Button
                  onClick={handleGenerateGif}
                  disabled={!uploadedImage || isGenerating}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90 spooky-hover"
                  size="lg"
                >
                  {isGenerating ? (
                    <>Summoning spirits... 👻</>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      Generate Flex GIF
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Results Section */}
          {generatedGif && (
            <div className="animate-fade-in">
              <Card className="p-8 border-2 border-primary/20">
                <h2 className="text-3xl font-creepy text-primary mb-6 text-center text-glow">
                  Your Spooky Creation! 🎃
                </h2>
                
                <GifPreview gifUrl={generatedGif} />

                <div className="flex flex-wrap gap-4 justify-center mt-6">
                  <Button
                    onClick={handleDownload}
                    className="spooky-hover"
                    variant="default"
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Video
                  </Button>
                  
                  <Button
                    onClick={handleShare}
                    className="spooky-hover"
                    variant="secondary"
                    size="lg"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share Link
                  </Button>
                  
                  <Button
                    onClick={handleReset}
                    className="spooky-hover"
                    variant="outline"
                    size="lg"
                  >
                    Try Another Photo 👻
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-muted-foreground">
          <p className="text-sm">
            Made with 🎃 for Halloween • All processing happens in your browser
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
