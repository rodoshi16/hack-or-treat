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
  const [sassLevel, setSassLevel] = useState(5); 
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;



  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    setIsLoading(true);
    try {
      // Simple test prompt to validate API key
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
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

  const generateCaption = async () => {
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate a witty, playful Halloween caption for this costume. Theme: ${selectedFilter}. Sass level: ${sassLevel}/10. Make it funny but not mean-spirited. Include Halloween emojis.`
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
        <div className="space-y-2">
        <label htmlFor="sassSlider" className="text-sm font-medium text-secondary">
          Level of Sass
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Mild</span>
          <input
            id="sassSlider"
            type="range"
            min={1}
            max={10}
            value={sassLevel}
            onChange={(e) => setSassLevel(Number(e.target.value))}
            disabled={isLoading}
            className="w-full h-4 rounded-lg bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 accent-secondary appearance-none"
            style={{
              backgroundSize: `${((sassLevel - 1) / 9) * 100}% 100%`,
            }}
          />
          <span className="text-xs text-muted-foreground">Savage</span>
        </div>
        <div className="text-center text-sm text-secondary font-bold animate-pulse">
          Current level: {sassLevel}/10
        </div>

        {/* Optional: markers below slider */}
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>1</span>
          <span>3</span>
          <span>5</span>
          <span>7</span>
          <span>10</span>
        </div>
      </div>
      <Button
      onClick={generateCaption}
      disabled={isLoading}
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
          Generate Caption
        </>
      )}
    </Button>

        </div>

        {isApiKeyValid && (
          <Button
            onClick={generateCaption}
            disabled={isLoading || !selectedFilter}
            className="spooky-hover px-4 py-2 text-sm"
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
