import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

// Image Quality Validation on the backend
function validateBackendImage(base64Data) {
  if (!base64Data) {
    return { ok: false, reason: "No image data received" };
  }

  // Remove data URI prefix if present
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

  try {
    const buffer = Buffer.from(cleanBase64, "base64");

    // 1. Check size: A valid low-res image should be at least 5KB
    if (buffer.length < 5000) {
      return { ok: false, reason: "The uploaded file is too small to be a valid image." };
    }

    // 2. Validate basic magic bytes to check if it's typical JPEG, PNG, or WEBP
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.toString("ascii", 8, 12) === "WEBP";

    if (!isJpeg && !isPng && !isWebp) {
      return { ok: false, reason: "Invalid file format. Please submit a valid JPEG, PNG, or WEBP image." };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, reason: "Failed to read image bytes." };
  }
}

// Structured output schema for food analysis
const foodAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    foodName: {
      type: Type.STRING,
      description: "Primary identified food, meal name or main ingredient compound.",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence rating of detection as a decimal (0.0 to 1.0).",
    },
    freshnessPercentage: {
      type: Type.INTEGER,
      description: "Estimated freshness level percentage, from 10 to 100 based on standard guidelines.",
    },
    safetyStatus: {
      type: Type.STRING,
      description: "Food safety status score: MUST be strictly one of these three strings: 'Safe', 'Caution', or 'Unsafe'.",
    },
    shelfLifeEstimate: {
      type: Type.STRING,
      description: "Estimated remaining shelf-life under optimal storage conditions (e.g., '3-4 days in airtight container').",
    },
    description: {
      type: Type.OBJECT,
      properties: {
        skin: { type: Type.STRING, description: "Detailed look of outer skin, peel, crust or boundary layer." },
        color: { type: Type.STRING, description: "Color changes, spots, oxidation, browning or fading visual details." },
        texture: { type: Type.STRING, description: "Textural details (firmness, structural collapse, softness, wrinkles etc)." },
        moisture: { type: Type.STRING, description: "Condition of surface water, sweat, dryness, slime, or optimal shine." },
      },
      required: ["skin", "color", "texture", "moisture"],
    },
    storageAdvice: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Actionable, precise tips on how to prepare, pack, freeze, keep or revive this food to avoid waste.",
    },
    macroBreakdown: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.INTEGER, description: "Estimated total calories (kcal) for the entire visible dynamic portion." },
        protein: { type: Type.NUMBER, description: "Protein content in grams." },
        carbs: { type: Type.NUMBER, description: "Carbohydrate content in grams." },
        fats: { type: Type.NUMBER, description: "Overall fats in grams." },
        fiber: { type: Type.NUMBER, description: "Dietary fiber in grams." },
        sodium: { type: Type.NUMBER, description: "Sodium content in milligrams (mg)." },
      },
      required: ["calories", "protein", "carbs", "fats", "fiber", "sodium"],
    },
  },
  required: [
    "foodName",
    "confidence",
    "freshnessPercentage",
    "safetyStatus",
    "shelfLifeEstimate",
    "description",
    "storageAdvice",
    "macroBreakdown",
  ],
};

export async function POST(req) {
  try {
    const { image, mimeType = "image/jpeg" } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in the server secrets." },
        { status: 500 }
      );
    }

    // 1. Run basic backend image quality checks
    const qualityResult = validateBackendImage(image);
    if (!qualityResult.ok) {
      return NextResponse.json({ error: qualityResult.reason }, { status: 400 });
    }

    // Initialize the Google GenAI client
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // 2. Prepare the payload for Gemini
    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");
    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType,
      },
    };

    const textPart = {
      text: "You are an expert food safety inspector and culinary nutritionist. " +
        "Analyze the provided image of food or ingredients. Determine what food/meal it is, " +
        "assess its visible freshness, and look closely for any blemishes, aging, mold, browning, or spoilage. " +
        "Also estimate its nutritional profile based on the visible portion size. " +
        "Provide a detailed, scientifically-sound response matching the scheduled JSON format strictly.",
    };

    // 3. Query Gemini using the formal @google/genai syntax with a fallback chain
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let response;
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Next.js API] Attempting food analysis with model: ${modelName}`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: [imagePart, textPart] },
          config: {
            responseMimeType: "application/json",
            responseSchema: foodAnalysisSchema,
            temperature: 0.2,
          },
        });
        if (response) {
          console.log(`[Next.js API] Analysis succeeded with model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`[Next.js API] Model ${modelName} failed with error:`, err.message || err);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error("Failed to get response from any Gemini model.");
    }

    const jsonText = response.text;
    if (!jsonText) {
      return NextResponse.json(
        { error: "No response text received from the model." },
        { status: 505 }
      );
    }

    // Parse safety check and answer
    const parsedData = JSON.parse(jsonText.trim());
    return NextResponse.json({ success: true, data: parsedData });
  } catch (error) {
    console.error("[Next.js API] Gemini analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze food freshness. Please try a clearer picture.",
        details: error.message || error,
      },
      { status: 500 }
    );
  }
}
