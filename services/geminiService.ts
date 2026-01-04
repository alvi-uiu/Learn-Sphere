
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export const geminiService = {
  async getTutorResponse(message: string, history: { role: 'user' | 'model', text: string }[]) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: history.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        })).concat({ role: 'user', parts: [{ text: message }] }),
        config: {
          systemInstruction: "You are LearnSphere AI Tutor. Your role is to adapt your teaching style to the user's needs. Be encouraging, explain complex concepts step-by-step, and provide motivational feedback. Use Markdown for formatting.",
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Tutor Error:", error);
      return "I'm having a bit of trouble connecting to my knowledge base right now. Let's try that again!";
    }
  },

  async synthesizeNotes(notes: string[]) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Synthesize the following course notes into a comprehensive, easy-to-understand study guide: \n\n${notes.join('\n---\n')}`,
        config: {
          systemInstruction: "You are an expert academic synthesizer. Create high-quality, structured study materials from raw notes.",
          temperature: 0.5,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Synthesis Error:", error);
      return "Unable to synthesize notes at this time.";
    }
  },

  async getMotivationalSupport(performanceData: string) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze this student performance summary and provide personalized motivation and study strategies: ${performanceData}`,
        config: {
          systemInstruction: "You are a student success coach. Focus on resilience, consistency, and confidence.",
        }
      });
      return response.text;
    } catch (error) {
      return "Keep going! Consistency is the key to mastery.";
    }
  }
};
