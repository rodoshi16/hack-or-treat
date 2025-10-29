import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";

interface GeminiRoastProps {
  imageData: string | null;
  selectedFilter: string | null;
}

export const GeminiRoast = ({ imageData, selectedFilter }: GeminiRoastProps) => {
  const [apiKey, setApiKey] = useState("");
  const [roast, setRoast] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [sassLevel, setSassLevel] = useState(5); // default 5/10


  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    setIsLoading(true);
    try {
      // Simple test prompt to validate API key
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Hello" }] }],
          }),
        }
      );

      if (response.ok) {
        setIsApiKeyValid(true);
        toast.success("API key is valid! 🎃");
      } else {
        toast.error("Invalid API key");
        setIsApiKeyValid(false);
      }
    } catch (error) {
      toast.error("Failed to validate API key");
      setIsApiKeyValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRoast = async () => {
    if (!isApiKeyValid || !selectedFilter) {
      toast.error("Please validate your API key and select a filter first");
      return;
    }

    setIsLoading(true);
    try {
      const filterThemes: Record<string, string> = {
        vampire: "bloodsucking fashion disaster",
        zombie: "undead fashion victim",
        ghost: "transparent fashion sense",
        pumpkin: "basic pumpkin spice obsession",
        witch: "wannabe spell-caster",
        demon: "hellish fashion choices",
        skeleton: "bare-bones effort",
        possessed: "supernaturally questionable style",
      };

      const theme = filterThemes[selectedFilter] || "questionable costume choice";
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate a witty, playful Halloween costume roast (2-3 sentences max) about this ${theme}. Make it funny but not mean-spirited. Include Halloween emojis.`
              }]
            }],
          }),
        }
      );

      const data = await response.json();
      const roastText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Even AI is speechless! 👻";
      setRoast(roastText);
      toast.success("AI roast generated! 🔥");
    } catch (error) {
      toast.error("Failed to generate roast");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 border-2 border-secondary/20 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-secondary" />
        <h3 className="text-xl font-creepy text-secondary">
          Generate a Caption with AI
        </h3>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
        <div className="relative flex-1">
        <label className="sr-only">Select the level of sass</label>
        <input
          type="range"
          min={1}
          max={10}
          value={sassLevel}
          onChange={(e) => setSassLevel(Number(e.target.value))}
          disabled={isLoading}
          className="w-full h-10 rounded-lg bg-secondary/10 accent-secondary"
        />
      </div>

          
          <Button
            onClick={testApiKey}
            disabled={isLoading || !apiKey.trim()}
            variant="outline"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test"}
          </Button>
        </div>

        {isApiKeyValid && (
          <Button
            onClick={generateRoast}
            disabled={isLoading || !selectedFilter}
            className="w-full spooky-hover"
            variant="secondary"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Summoning AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Roast
              </>
            )}
          </Button>
        )}

        {roast && (
          <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20 animate-fade-in">
            <p className="text-sm leading-relaxed">{roast}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {/* Get your free API key at{" "} */}
        <a
          href="https://ai.google.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:underline"
        >
          {/* ai.google.dev */}
        </a>
      </p>
    </Card>
  );
};
