import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
// Override with the PORT env var when 3000 is taken.
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "25mb" }));

// The Gemini model used for optional AI assistance. The previous value,
// "gemini-3.7-flash", is not a real model id: every request failed and silently
// fell through to a canned answer, which is why recognition never worked.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Lazy initialize Gemini API client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "Synaera-SA",
    language: "South African Sign Language (SASL) & English",
    version: "1.0.0",
    aiAssist: process.env.GEMINI_API_KEY ? { enabled: true, model: GEMINI_MODEL } : { enabled: false },
  });
});

// Parse English text into SASL Gloss and keyframes sequence
app.post("/api/parse-to-sign", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid text parameter" });
    }

    // Try Gemini NLP if key available, or fallback to rule-based parser
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getGenAI();
        const prompt = `You are an expert South African Sign Language (SASL) linguist and gloss parser.
Convert the following English phrase into a sequential list of SASL gloss tokens and fingerspelling instructions.
SASL follows a Topic-Comment and Time-Topic-Comment word order.

Input phrase: "${text}"

Respond ONLY with a JSON object in this exact schema:
{
  "glossSequence": ["GLOSS_1", "GLOSS_2"],
  "saslGrammar": "Brief explanation of SASL structure",
  "facialExpression": "neutral" | "question_eyebrows_raised" | "question_eyebrows_furrowed" | "happy" | "emphatic",
  "tokens": [
    {
      "word": "original word",
      "gloss": "SASL_GLOSS",
      "isFingerspelled": false,
      "signId": "matching_id_if_standard_or_null"
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({ success: true, ...parsed });
        }
      } catch (geminiError: any) {
        console.warn("Gemini gloss parsing fallback to rule-based:", geminiError?.message);
      }
    }

    // Rule-based fallback if no Gemini or error
    const words = text
      .toUpperCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

    return res.json({
      success: true,
      glossSequence: words,
      saslGrammar: "Direct SASL gloss mapping",
      facialExpression: text.includes("?") ? "question_eyebrows_raised" : "neutral",
      tokens: words.map((w) => ({
        word: w,
        gloss: w,
        isFingerspelled: false,
        signId: w.toLowerCase(),
      })),
    });
  } catch (err: any) {
    console.error("Error in parse-to-sign:", err);
    res.status(500).json({ error: err.message || "Failed to parse sign gloss" });
  }
});

// Gesture Translation from Camera Snapshot (continuous or on-demand)
app.post("/api/translate-gesture", async (req, res) => {
  try {
    // Accepts a short burst of frames rather than a single still: SASL signs
    // carry meaning in movement, so one frame cannot distinguish HELLO (a wave)
    // from a flat hand held up. `frames` is preferred; `imageBase64` is kept for
    // backwards compatibility.
    const { frames, imageBase64, landmarkContext } = req.body ?? {};

    const clip: string[] = Array.isArray(frames) && frames.length
      ? frames.slice(0, 6)
      : imageBase64
        ? [imageBase64]
        : [];

    if (!clip.length) {
      return res.status(400).json({ error: "No frames provided" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: false,
        detected: false,
        reason: "AI assist is not configured (no GEMINI_API_KEY). On-device recognition is unaffected.",
      });
    }

    try {
      const ai = getGenAI();

      // The client's on-device tracker already measured handshape, location and
      // movement. Passing that along keeps the model grounded in what was
      // actually observed instead of guessing from pixels alone.
      const observed = landmarkContext
        ? `\n\nThe on-device tracker measured: ${JSON.stringify(landmarkContext)}.`
        : "";

      const prompt = `You are a South African Sign Language (SASL) interpreter for Synaera-SA, a non-profit accessibility platform.

You are given ${clip.length} consecutive frames from a signer, in order, spanning roughly one second. Read them as a single movement, not as separate pictures.${observed}

Identify the handshape, the location against the body, and the movement, then give the natural South African English meaning.

If the frames do not clearly show one SASL sign, you MUST return detected: false. Do not guess — a wrong translation is worse than none.

Respond only with JSON:
{
  "detected": true | false,
  "recognizedSign": "GLOSS",
  "englishTranslation": "natural English to speak aloud",
  "confidence": 0.0-1.0,
  "handShape": "description",
  "saRegionalContext": "any South African regional nuance, or empty"
}`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              ...clip.map((frame: string) => ({
                inlineData: {
                  mimeType: "image/jpeg",
                  data: String(frame).replace(/^data:image\/\w+;base64,/, ""),
                },
              })),
            ],
          },
        ],
        config: { responseMimeType: "application/json", temperature: 0.1 },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        // Trust the model's own "not sure" rather than overriding it.
        return res.json({ success: true, ...parsed, detected: parsed.detected !== false });
      }
    } catch (aiErr: any) {
      console.warn("AI assist unavailable:", aiErr?.message);
    }

    return res.json({
      success: false,
      detected: false,
      reason: "The AI assist model did not return a usable result.",
    });
  } catch (err: any) {
    console.error("Error in translate-gesture:", err);
    res.status(500).json({ error: err.message || "Gesture translation failed" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Synaera-SA running on http://localhost:${PORT}`);
  });

  // Starting the app twice is easy to do — a stray terminal, or hitting Run in
  // an editor while it is already up. Say so plainly instead of dumping an
  // unhandled EADDRINUSE stack trace.
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code !== "EADDRINUSE") throw err;
    console.error(`\nPort ${PORT} is already in use — Synaera-SA may already be running.`);
    console.error(`Try opening http://localhost:${PORT} first.`);
    console.error(`To use another port:  PORT=3001 npm run dev`);
    console.error(`PowerShell:           $env:PORT=3001; npm run dev\n`);
    process.exit(1);
  });
}

startServer();
