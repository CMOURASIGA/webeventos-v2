import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || 'dummy_key_for_demo_purposes';
const ai = new GoogleGenAI({ apiKey });

export const generateEventConcept = async (title: string, type: string) => {
  if (!process.env.API_KEY) {
    // Fallback for demo if no key provided
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`(Simulated AI Response) Based on "${title}", here is a suggested concept: A transformative ${type} experience designed to engage attendees through immersive workshops and networking opportunities.`);
      }, 1500);
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a compelling 2-sentence description for a corporate event titled "${title}" of type "${type}". make it professional yet exciting.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Generation failed", error);
    return "Could not generate concept at this time.";
  }
};