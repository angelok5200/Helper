import { GoogleGenAI, Chat, GenerativeModel } from "@google/genai";
import { Message, GeminiModel } from '../types';

const getAiClient = () => {
  // Use the new GoogleGenAI class from the new SDK
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// System instruction for the chat consultant
const CONSULTANT_SYSTEM_INSTRUCTION = `
You are an expert Senior Solutions Architect and Product Manager named "Architect AI". 
Your goal is to help users refine their application ideas and make informed technology choices.

Role:
1.  **Consultant**: Analyze the user's idea. Do not just accept it. Ask 1-2 clarifying questions about functionality, target audience, scale, or specific challenges.
2.  **Tech Advisor**: Suggest modern, robust tech stacks (favoring React, TypeScript, Tailwind, Node.js, Python, Go etc., depending on the need).
3.  **Tech Comparator**: When asked to compare languages (e.g., Python vs JavaScript) or frameworks (e.g., React vs Vue, Django vs Flask), provide a structured comparison including:
    *   **Strengths & Weaknesses**: Pros and cons of each.
    *   **Typical Use Cases**: Where each shines (e.g., "Django for rapid enterprise dev", "Go for high concurrency").
    *   **Learning Curve**: Estimated difficulty for beginners vs experienced devs.
    *   **Verdict**: Recommendation based on the specific context of the user's app (if known).
4.  **UI/UX Designer**: Suggest design systems, color palettes, and user flows. Highlight potential design challenges.
5.  **Language**: If the user writes in Ukrainian, YOU MUST REPLY IN UKRAINIAN. If English, reply in English. Match the user's language.

Process:
- Start by discussing the idea to understand the scope.
- When comparing technologies, use **Markdown tables** or clear bullet points for readability.
- Keep responses concise but insightful. 
- Use Markdown for formatting.

IMPORTANT:
- Do not generate the final code prompt yet. Your job now is to CONSULT and REFINE.
- Be encouraging but realistic about technical feasibility.
`;

// System instruction for the final prompt generation
const ARCHITECT_SYSTEM_INSTRUCTION = `
You are an expert Prompt Engineer and Senior Developer.
Your task is to take a conversation history about an app idea and generate a massive, detailed, high-fidelity System Prompt or Project Specification.

Output Format:
- The output should be a single block of text (Markdown) that the user can copy and paste into an LLM (like Gemini or ChatGPT) to build the app.
- The prompt should cover:
  1.  **Project Overview**: High-level summary.
  2.  **Tech Stack**: Strict definitions (e.g., React 18, Vite, Tailwind, Supabase/Firebase).
  3.  **File Structure**: Recommended folder structure.
  4.  **Core Features**: Detailed requirements.
  5.  **UI/UX Guidelines**: Color palette, typography, responsive behavior.
  6.  **Step-by-Step Implementation Plan**: How to build it.

Language:
- Write the final prompt in the SAME LANGUAGE the user was conversing in (Ukrainian or English).
`;

let chatInstance: Chat | null = null;
let modelInstance: GenerativeModel | null = null;

export const initializeChat = async () => {
  const ai = getAiClient();
  chatInstance = ai.chats.create({
    model: GeminiModel.CHAT,
    config: {
      systemInstruction: CONSULTANT_SYSTEM_INSTRUCTION,
    },
  });
  return chatInstance;
};

export const sendMessageStream = async (
  message: string,
  onChunk: (text: string) => void
): Promise<string> => {
  if (!chatInstance) {
    await initializeChat();
  }

  if (!chatInstance) {
    throw new Error("Failed to initialize chat");
  }

  let fullResponse = "";
  try {
    const result = await chatInstance.sendMessageStream({ message });
    
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        onChunk(text);
      }
    }
  } catch (error) {
    console.error("Error in chat stream:", error);
    throw error;
  }
  
  return fullResponse;
};

export const generateFinalBlueprint = async (
  history: Message[],
  languageContext: string = "Ukrainian"
): Promise<string> => {
  const ai = getAiClient();
  
  // Convert history to a readable string format for the model context
  const conversationContext = history
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const prompt = `
    Based on the following consultation history, generate the Master Development Prompt.
    
    --- CONVERSATION HISTORY ---
    ${conversationContext}
    ----------------------------
    
    Please generate the Master Prompt now. Ensure it is detailed and ready for a developer agent to execute.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.ARCHITECT,
      contents: prompt,
      config: {
        systemInstruction: ARCHITECT_SYSTEM_INSTRUCTION,
        // Using Thinking Config for better reasoning on the architecture
        thinkingConfig: { thinkingBudget: 2048 },
      },
    });

    return response.text || "Failed to generate blueprint.";
  } catch (error) {
    console.error("Error generating blueprint:", error);
    return `Error generating blueprint. Please try again. Details: ${error}`;
  }
};