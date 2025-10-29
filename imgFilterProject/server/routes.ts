import { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { pool } from "./pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer configuration - store files in memory, then save to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// Helper to save uploaded files to disk and return public URLs
function saveBufferToUploads(buf: Buffer, originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);
  const fileName = `${timestamp}_${randomSuffix}_${safeName}`;
  const uploadsDir = path.resolve(__dirname, "..", "uploads");
  const filePath = path.join(uploadsDir, fileName);
  
  fs.writeFileSync(filePath, buf);
  return `/uploads/${fileName}`;
}

// Helper to generate narration script with Gemini
async function generateNarrationScript(assetUrls: string[], theme?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set in environment variables");
  }

  const prompt = [
    "Write a concise, cinematic narration (around 100-150 words) for a short video story.",
    "The narration should:",
    "- Create a cohesive narrative connecting the uploaded images/videos in sequence",
    "- Be engaging and suitable for text-to-speech",
    "- Match the theme provided",
    "",
    `Theme: ${theme || "general, family-friendly"}`,
    "",
    "Assets (in order):",
    ...assetUrls.map((url, i) => `  ${i + 1}. ${url.split("/").pop() || "asset"}`),
    "",
    "Output only the narration text, no scene headings or formatting."
  ].join("\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const script = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!script) {
      throw new Error("No script generated from Gemini");
    }

    return script;
  } catch (error) {
    console.error("Error generating narration:", error);
    throw error;
  }
}

// Helper to submit job to JSON2Video API
async function submitJson2VideoJob(
  assetUrls: string[],
  narration: string
): Promise<{ id: string; statusUrl: string }> {
  const apiKey = process.env.JSON2VIDEO_API_KEY;
  if (!apiKey) {
    throw new Error("JSON2VIDEO_API_KEY not set in environment variables");
  }

  const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
  const fullUrls = assetUrls.map((url) => {
    if (url.startsWith("http")) return url;
    return `${baseUrl}${url}`;
  });

  // JSON2Video timeline structure
  // Note: Adjust this payload based on your actual JSON2Video API documentation
  const payload = {
    timeline: {
      tracks: [
        {
          type: "video",
          clips: fullUrls.map((url, index) => ({
            asset: {
              type: (url.toLowerCase().includes("video") || url.toLowerCase().endsWith(".mp4") || url.toLowerCase().endsWith(".mov") || url.toLowerCase().endsWith(".avi"))
                ? "video" 
                : "image",
              src: url,
            },
            start: index * 3, // 3 seconds per asset
            length: 3,
          })),
        },
        {
          type: "audio",
          clips: [
            {
              asset: {
                type: "tts",
                provider: "elevenlabs", // or "google" based on JSON2Video support
                voice: "alloy", // adjust based on available voices
                text: narration,
                language: "en",
              },
              start: 0,
            },
          ],
        },
      ],
    },
    output: {
      resolution: "1080p",
      format: "mp4",
    },
  };

  try {
    // JSON2Video API endpoint - adjust URL based on actual API documentation
    const response = await fetch("https://api.json2video.com/v2/render", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`JSON2Video API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      id: data.id || data.job_id || String(Date.now()),
      statusUrl: data.status_url || `https://api.json2video.com/v2/render/${data.id || data.job_id}`,
    };
  } catch (error) {
    console.error("Error submitting JSON2Video job:", error);
    throw error;
  }
}

export function setupRoutes(app: Express) {
  app.post("/api/gifs", async (req: Request, res: Response) => {
    try {
      const { gifBase64, filterType, roastText } = req.body as { gifBase64: string; filterType: string; roastText?: string };
      if (!gifBase64 || !filterType) return res.status(400).json({ error: "gifBase64 and filterType required" });

      const base64Data = gifBase64.replace(/^data:image\/gif;base64,/, "");
      const gifBuffer = Buffer.from(base64Data, "base64");

      const result = await pool.query(
        "insert into gifs (gif_data, filter_type) values ($1, $2) returning id",
        [gifBuffer, filterType]
      );
      const id = result.rows[0].id as string;

      if (roastText) {
        await pool.query("insert into roasts (gif_id, roast_text) values ($1, $2)", [id, roastText]);
      }

      res.json({ id });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/gifs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rows } = await pool.query("select gif_data from gifs where id = $1", [id]);
      if (rows.length === 0) return res.status(404).json({ error: "not found" });
      const data: Buffer = rows[0].gif_data;
      res.setHeader("Content-Type", "image/gif");
      res.send(data);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // Upload endpoint - saves files and returns public URLs
  app.post("/api/uploads", upload.array("files", 20), async (req: Request, res: Response) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const files = (req as any).files as Array<{
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        buffer: Buffer;
        size: number;
      }>;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
      const urls = files.map((file) => {
        const publicPath = saveBufferToUploads(file.buffer, file.originalname);
        return `${baseUrl}${publicPath}`;
      });

      res.json({ urls });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // Story generation endpoint
  app.post("/api/story", async (req: Request, res: Response) => {
    try {
      const { assetUrls, theme } = req.body as { assetUrls: string[]; theme?: string };
      
      if (!assetUrls || assetUrls.length === 0) {
        return res.status(400).json({ error: "assetUrls required and must not be empty" });
      }

      // 1. Generate narration script with Gemini
      const narration = await generateNarrationScript(assetUrls, theme);

      // 2. Submit to JSON2Video
      const job = await submitJson2VideoJob(assetUrls, narration);

      res.json({
        jobId: job.id,
        statusUrl: job.statusUrl,
        narration, // Return narration for preview
      });
    } catch (e) {
      console.error("Story generation error:", e);
      res.status(500).json({ error: String(e) });
    }
  });

  // Story status check endpoint
  app.get("/api/story/status", async (req: Request, res: Response) => {
    try {
      const { statusUrl } = req.query as { statusUrl?: string };
      
      if (!statusUrl) {
        return res.status(400).json({ error: "statusUrl query parameter required" });
      }

      const apiKey = process.env.JSON2VIDEO_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "JSON2VIDEO_API_KEY not configured" });
      }

      const response = await fetch(statusUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });
}


