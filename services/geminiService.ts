
import { GoogleGenAI, Type } from "@google/genai";

// Safe access to process.env to prevent "process is not defined" errors in some browser environments
const getApiKey = () => {
  try {
    return process.env.API_KEY;
  } catch (e) {
    return undefined;
  }
};

const FALLBACK_QUOTES = [
  { text: "The expert in anything was once a beginner.", source: "Helen Hayes" },
  { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", source: "Malcolm X" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", source: "B.B. King" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", source: "Mahatma Gandhi" },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", source: "Benjamin Franklin" },
  { text: "It is not that I'm so smart. But I stay with the questions much longer.", source: "Albert Einstein" },
  { text: "The roots of education are bitter, but the fruit is sweet.", source: "Aristotle" },
  { text: "Develop a passion for learning. If you do, you will never cease to grow.", source: "Anthony J. D'Angelo" },
  { text: "You don't have to be great to start, but you have to start to be great.", source: "Zig Ziglar" },
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", source: "Brian Herbert" },
  { text: "Change is the end result of all true learning.", source: "Leo Buscaglia" },
  { text: "Learning never exhausts the mind.", source: "Leonardo da Vinci" }
];

const FALLBACK_OUTLINE = (topic: string) => `
## Week 1: Introduction to ${topic}
- Overview and core concepts
- Setting up the environment
- First practical exercise

## Week 2: Deep Dive
- Advanced techniques
- Common pitfalls
- Case study analysis

## Week 3: Application
- Building a real-world project
- Integration strategies
- Optimization tips

## Week 4: Mastery
- Final project presentation
- Future trends
- Certification exam prep
`;

export const generateCourseOutline = async (topic: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return FALLBACK_OUTLINE(topic);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a structured 4-week course outline for a course titled: "${topic}". 
      Format it as a simple bulleted list. Keep it concise.`,
    });
    
    return response.text || FALLBACK_OUTLINE(topic);
  } catch (error) {
    // Silently fail to fallback outline to prevent console noise
    return FALLBACK_OUTLINE(topic);
  }
};

export const generateDailyQuote = async (): Promise<{text: string, source: string}> => {
  const apiKey = getApiKey();
  const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];

  if (!apiKey) {
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a short, inspiring quote or verse suitable for a student starting their learning day. Focus on knowledge, patience, or growth.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            source: { type: Type.STRING }
          },
          required: ["text", "source"]
        }
      }
    });
    
    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);
    
    if (parsed.text && parsed.source) {
        return parsed;
    }
    return fallback;
  } catch (error) {
    // Silently fail to fallback quote to prevent console noise on quota limits
    return fallback;
  }
};
