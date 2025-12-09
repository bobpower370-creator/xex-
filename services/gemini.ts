import { GoogleGenAI } from "@google/genai";
import { DecompilationResult } from "../types";

const SYSTEM_PROMPT = `
You are an expert Reverse Engineer specializing in 6502 Assembly and C++. 
Your goal is to analyze provided 6502 assembly code segments (from an Atari 8-bit or similar legacy system) and "decompile" them into modern, clean, C++ code.

RULES:
1. Logic: Analyze the assembly control flow (loops, branches) and convert them to C++ 'if', 'while', 'for' structures.
2. Registers: Map A, X, Y registers to local variables or function arguments where appropriate.
3. Memory: Treat absolute memory addresses (e.g., $D400) as potential hardware registers. If you recognize them (e.g., Atari ANTIC/GTIA/POKEY), use named constants or structs.
4. Output: Return the C++ code enclosed in a markdown block, followed by a brief explanation of the logic.
5. Accuracy: If logic is ambiguous, add comments in the C++ code explaining the ambiguity. Do not invent logic.
`;

export async function decompileSegment(assemblyText: string): Promise<DecompilationResult> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // High reasoning model for coding tasks
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Here is a segment of 6502 assembly code:" },
            { text: assemblyText },
            { text: "Please decompile this into C++." }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2, // Low temperature for precise code generation
      }
    });

    const text = response.text || "";
    
    // Simple extraction of code block
    const codeMatch = text.match(/```cpp([\s\S]*?)```/) || text.match(/```c([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
    const cppCode = codeMatch ? codeMatch[1].trim() : "// No code block found in response\n" + text;
    
    // Explanation is everything else
    const explanation = text.replace(/```[\s\S]*?```/g, "").trim();

    return {
      cppCode,
      explanation
    };

  } catch (error) {
    console.error("Gemini Decompilation Error:", error);
    throw error;
  }
}
