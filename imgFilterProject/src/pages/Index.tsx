import { useState, useEffect } from "react";
import { Upload, Wand2, Download, Share2, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { FilterSelector } from "@/components/FilterSelector";
import { GeminiRoast } from "@/components/GeminiRoast";
import { GifPreview } from "@/components/GifPreview";
import { InstagramStoryMaker } from "@/components/InstagramStoryMaker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const handleSmoothScrollToFeature = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById("feature");
    if (!target) return;

    const headerOffset = 80; // account for top spacing
    const start = window.scrollY || window.pageYOffset;
    const end = target.getBoundingClientRect().top + start - headerOffset;
    const distance = end - start;
    const duration = 1200; // slower scroll (ms)
    const startTime = performance.now();

    const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutQuad(progress);
      window.scrollTo(0, start + distance * eased);
      if (elapsed < duration) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Top Navigation */}
        <nav className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Ghost className="w-6 h-6 text-primary" />
            <span className="font-creepy text-2xl text-primary">Hack-or-Treat</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="/teams" className="text-muted-foreground hover:text-primary transition-colors">Teams</a>
            <a href="mailto:contact@hackortreat.dev" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
          </div>
        </nav>
        {/* Hero */}
        <header className="min-h-[80vh] md:min-h-[90vh] flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Ghost className="w-12 h-12 text-primary animate-float" />
            <h1 className="text-5xl md:text-7xl font-creepy text-primary text-glow">
              Halloween Costume Flex
            </h1>
            <Ghost className="w-12 h-12 text-primary animate-float" style={{ animationDelay: "1s" }} />
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your costume, apply spooky filters, and create shareable GIFs with AI-powered roasts!
          </p>
          <div className="mt-8">
            <a href="#feature" onClick={handleSmoothScrollToFeature} className="inline-flex items-center bg-primary text-primary-foreground px-6 py-3 rounded-md spooky-hover">
              Get Started
            </a>
          </div>
        </header>

        {/* Main Content */}
        <div id="feature" className="grid gap-8 scroll-mt-24">
          {/* Legacy anchor for backward compatibility */}
          <div id="generate" className="sr-only" aria-hidden="true" />
          <Tabs defaultValue="gif" className="w-full">
            <div className="flex justify-center">
              <TabsList>
                <TabsTrigger value="gif">GIF Generator</TabsTrigger>
                <TabsTrigger value="story">Story Maker</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="story">
              <InstagramStoryMaker />
            </TabsContent>

            <TabsContent value="gif">
              {/* Upload Section */}
              {!uploadedImage && (
                <div className="flex justify-center">
                  <Card className="p-4 border-2 border-primary/20 hover:border-primary/40 transition-all spooky-hover w-full max-w-md">
                    <ImageUpload onImageUpload={handleImageUpload} />
                  </Card>
                </div>
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-muted-foreground">
          <p className="text-sm">
            Made with 🎃 for Halloween • All processing happens in your browser
          </p>
        </footer>
        {/* Optional anchors for nav links */}
        <div id="contact" className="sr-only" aria-hidden="true">Contact</div>
      </div>
    </div>
  );
};

export default Index;
