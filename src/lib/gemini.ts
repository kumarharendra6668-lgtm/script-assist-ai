import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

// Initialize the API using the process env key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ScriptGenerationParams {
  topic: string;
  platform: string;
  tone: string;
  language: string;
  isHumanMode: boolean;
  isStoryMode: boolean;
  needsHooks: boolean;
}

export interface GeneratedScript {
  hooks: string[];
  script: string;
}

export async function generateScript(params: ScriptGenerationParams): Promise<GeneratedScript> {
  let prompt = `You are a world-class content creator and scriptwriter. 
Your task is to write a highly engaging script for ${params.platform} about "${params.topic}".
Language: ${params.language}.
Tone: ${params.tone}.
`;

  if (params.tone === "Shayari ✍️") {
    prompt += `
SHAYARI / POETIC MODE IS ON:
- Write the entire script ONLY in a Shayari (Poetic) style.
- Use short, rhythmic lines with deep human emotions, feelings, and flow.
- AVOID normal paragraphs, bullet points, or formal explanations. 
- It should feel like spoken word poetry or a heart-touching Shayari.
- Use metaphors and soul-searching language.
- Structure it line-by-line with rhythmic breaks.
`;
  }

  if (params.isHumanMode) {
    prompt += `
HUMAN MODE IS ON: 
- Write like a real human speaks. 
- Use raw, authentic emotion. 
- Avoid robotic, generic, or cliché AI language. 
- Include natural pauses, filler words (if appropriate for the language), and conversational transitions.
- Make it feel like a genuine personal perspective.
`;
  } else {
    prompt += `
Write in a clean, professional, and structured manner. Provide clear takeaways.
`;
  }

  if (params.isStoryMode) {
    prompt += `
STORY MODE IS ON:
- Structure the script around a compelling narrative or real-life anecdote.
- Hook the viewer with a relatable situation, build tension, and resolve it with a valuable lesson or conclusion.
- Use sensory details to paint a picture.
`;
  }

  if (params.needsHooks) {
    prompt += `
Please provide 3 to 5 catchy, viral hooks for the beginning of the script to grab attention instantly.
`;
  }

  prompt += `
Return the response as a JSON object with:
- "hooks": an array of strings (the hooks). If hooks are not requested, return an empty array.
- "script": the main script body (using markdown for formatting like bold, italics, or paragraph breaks).
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hooks: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "An array of catchy viral hooks."
            },
            script: {
              type: Type.STRING,
              description: "The main body of the script, formatted with markdown."
            }
          },
          required: ["hooks", "script"]
        },
        temperature: params.isHumanMode ? 0.9 : 0.7, // Higher temp for more natural/unpredictable human text
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated.");
    }
    
    const parsed = JSON.parse(text) as GeneratedScript;
    return parsed;
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error("Failed to generate script. Please try again.");
  }
}
