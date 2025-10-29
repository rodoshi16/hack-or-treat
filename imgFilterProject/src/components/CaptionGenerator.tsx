import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { generateHalloweenRoast } from "@/lib/gemini";

interface CaptionGeneratorProps {
  imageData: string | null;
  selectedFilter: string | null;
}

export const CaptionGenerator = ({ imageData, selectedFilter }: CaptionGeneratorProps) => {
  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateCaption = async () => {
    if (!imageData) {
      toast.error("Please upload an image first!");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🎭 Generating Halloween caption...");
      const generatedCaption = await generateHalloweenRoast(imageData, selectedFilter);
      setCaption(generatedCaption);
      toast.success("Caption generated! 🎃");
    } catch (error) {
      console.error("Error generating caption:", error);
      toast.error("Failed to generate caption. Please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCaption = async () => {
    if (!caption) return;
    
    try {
      await navigator.clipboard.writeText(caption);
      toast.success("Caption copied to clipboard! 📋");
    } catch (error) {
      toast.error("Failed to copy caption");
    }
  };

  return (
    <Card className="p-6 border-2 border-secondary/20 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-secondary" />
        <h3 className="text-xl font-creepy text-secondary">
          AI Caption Generator
        </h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Generate a witty Halloween caption for your costume using AI!
      </p>

      <Button
        onClick={generateCaption}
        disabled={isLoading || !imageData}
        className="w-full spooky-hover"
        variant="secondary"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating Caption...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Caption
          </>
        )}
      </Button>

      {caption && (
        <div className="space-y-3 animate-fade-in">
          <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
            <p className="text-sm leading-relaxed">{caption}</p>
          </div>
          
          <Button
            onClick={copyCaption}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Caption
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Powered by Google Gemini AI
      </p>
    </Card>
  );
};