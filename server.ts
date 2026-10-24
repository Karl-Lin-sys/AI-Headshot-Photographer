import { localApiOnly } from './local-api-guard.mjs';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
app.use('/api', localApiOnly(() => PORT));
  const PORT = 3000;

  // Increase payload limit for base64 image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route for Image Generation
  app.post("/api/generate", async (req, res) => {
    try {
      const { image, prompt, aspectRatio } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const contentsParts: any[] = [];

      // If an image is provided, we edit the image. Otherwise, we generate from scratch.
      if (image) {
        // Assume image is a data URI, e.g., data:image/jpeg;base64,...
        const match = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (!match) {
          return res.status(400).json({ error: "Invalid image data format." });
        }
        const mimeType = match[1];
        const base64Data = match[2];

        contentsParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        });
      }

      contentsParts.push({ text: prompt });

      // We use gemini-3.1-flash-image
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: contentsParts,
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "1:1",
            imageSize: "1K",
          },
        },
      });

      let generatedImageUrl = null;
      let textResponse = null;

      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedImageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          } else if (part.text) {
            textResponse = part.text;
          }
        }
      }

      if (!generatedImageUrl) {
        return res.status(500).json({ error: "No image was returned by the model. Check your prompt or image constraints.", text: textResponse });
      }

      res.json({ imageUrl: generatedImageUrl, text: textResponse });
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: error.message || "An error occurred while generating the image." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
