import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Film, Upload, Play } from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function StoryMaker() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [theme, setTheme] = useState("");
  const [statusUrl, setStatusUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [narration, setNarration] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleCreateStory = async () => {
    if (!files || files.length === 0) {
      toast.error("Please select at least one image or video");
      return;
    }

    setIsProcessing(true);
    setVideoUrl(null);
    setStatusUrl(null);
    setNarration(null);

    try {
      // Step 1: Upload files
      toast.info("Uploading files...");
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const uploadResponse = await fetch(`${API_BASE}/api/uploads`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Upload failed");
      }

      const { urls } = await uploadResponse.json();
      toast.success(`Uploaded ${urls.length} file(s)`);

      // Step 2: Generate story
      toast.info("Generating story with AI...");
      const storyResponse = await fetch(`${API_BASE}/api/story`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetUrls: urls,
          theme: theme || undefined,
        }),
      });

      if (!storyResponse.ok) {
        const error = await storyResponse.json();
        throw new Error(error.error || "Story generation failed");
      }

      const storyData = await storyResponse.json();
      setStatusUrl(storyData.statusUrl);
      setNarration(storyData.narration);

      toast.success("Story generated! Starting video render...");

      // Step 3: Poll for video completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (5s intervals)
      let completed = false;

      while (!completed && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

        try {
          const statusResponse = await fetch(
            `${API_BASE}/api/story/status?statusUrl=${encodeURIComponent(storyData.statusUrl)}`
          );

          if (!statusResponse.ok) {
            throw new Error("Status check failed");
          }

          const statusData = await statusResponse.json();
          
          if (statusData.status === "completed" || statusData.status === "done") {
            // Video is ready
            const outputUrl = statusData.output_url || statusData.outputUrl || statusData.url;
            if (outputUrl) {
              setVideoUrl(outputUrl);
              completed = true;
              toast.success("🎬 Your story video is ready!");
            } else {
              throw new Error("Video completed but no output URL provided");
            }
          } else if (statusData.status === "failed" || statusData.status === "error") {
            throw new Error(statusData.error || "Video rendering failed");
          } else {
            // Still processing
            toast.info(`Rendering... (${attempts + 1}/${maxAttempts})`);
          }
        } catch (error: any) {
          // If status check fails, might still be processing
          console.warn("Status check error:", error);
        }

        attempts++;
      }

      if (!completed) {
        toast.warning("Rendering is taking longer than expected. Check back later or use the status URL.");
      }
    } catch (error: any) {
      console.error("Story creation error:", error);
      toast.error(error.message || "Failed to create story video");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles(null);
    setTheme("");
    setVideoUrl(null);
    setStatusUrl(null);
    setNarration(null);
    // Reset file input
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  return (
    <Card className="p-6 space-y-6 border-2 border-primary/20">
      <div className="flex items-center gap-2">
        <Film className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-primary">Create a Story Video</h2>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="story-files" className="text-base">
            Upload Images or Videos (2-10 files recommended)
          </Label>
          <Input
            id="story-files"
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="mt-2"
          />
          {files && (
            <p className="text-sm text-muted-foreground mt-2">
              {files.length} file(s) selected
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="story-theme" className="text-base">
            Theme (optional)
          </Label>
          <Input
            id="story-theme"
            placeholder="e.g., spooky, uplifting, adventure, mystery"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            disabled={isProcessing}
            className="mt-2"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleCreateStory}
            disabled={isProcessing || !files || files.length === 0}
            className="flex-1"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Story...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Create Story Video
              </>
            )}
          </Button>

          {(videoUrl || statusUrl) && (
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isProcessing}
              size="lg"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {narration && (
        <div className="p-4 rounded-lg bg-muted border">
          <h3 className="font-semibold mb-2">Generated Narration:</h3>
          <p className="text-sm leading-relaxed">{narration}</p>
        </div>
      )}

      {statusUrl && (
        <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
          <p className="text-sm text-muted-foreground">
            <strong>Status URL:</strong>{" "}
            <a
              href={statusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:underline break-all"
            >
              {statusUrl}
            </a>
          </p>
        </div>
      )}

      {videoUrl && (
        <div className="space-y-2">
          <h3 className="font-semibold">Your Story Video:</h3>
          <video
            controls
            className="w-full rounded-lg border-2 border-primary/20"
            src={videoUrl}
          >
            Your browser does not support the video tag.
          </video>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                window.open(videoUrl, "_blank");
              }}
            >
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const link = document.createElement("a");
                link.href = videoUrl;
                link.download = `story-video-${Date.now()}.mp4`;
                link.click();
              }}
            >
              Download
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

