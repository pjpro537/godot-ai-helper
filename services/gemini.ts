import { GoogleGenAI, Type } from "@google/genai";
import { GenerationConfig, ProjectFile } from "../types";

// Ensure API key is present
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
You are an expert Godot 4 Game Engine architect and GDScript specialist.
You are powered by Gemini 3's advanced reasoning capabilities.

Your Core Directives:
1. **Godot 4 Compliance**: strictly adhere to Godot 4.x syntax (e.g., 'super()', '@export', 'signal name(args)', 'await', 'Tween' instead of 'Tween node').
2. **Context Awareness**: Pay attention to whether the user is in a 2D, 3D, or UI context.
3. **Best Practices**: Use composition over inheritance where appropriate, prefer Signals for decoupling, and use Resources for data.
4. **Adaptation & Replication**: When provided with reference code (even from other languages like C#, Lua, Python) OR reference images, intelligently port the logic, visual style (via shaders/environment settings), and design patterns to idiomatic GDScript.
5. **Modification & Integration**: When asked to ADD a behavior or MODIFY existing code, **PRESERVE** the existing logic and variable state unless explicitly told to replace it. Merge the new functionality seamlessly (e.g., add to _physics_process rather than replacing it).

When generating code:
- Return ONLY valid, complete GDScript code.
- If the requested script requires a specific scene setup (like nodes), mention it in the explanation.
- Use 'class_name' if creating a reusable component.
`;

export const generateGodotCode = async (
  prompt: string,
  projectFiles: ProjectFile[],
  activeFileId: string,
  mode: 'physics' | 'logic' | 'general' | 'asset',
  godotContext: string,
  referenceContent?: string,
  config?: GenerationConfig,
  referenceImageBase64?: string
): Promise<{ code: string; explanation: string }> => {
  if (!apiKey) throw new Error("API Key missing");

  // Construct Style Guide based on User Config
  let styleGuide = "DEFAULT STYLE";
  if (config) {
    styleGuide = `
      USER PREFERENCES (STRICTLY FOLLOW):
      - **Typing**: ${config.typing === 'strict' ? 'ALWAYS use static typing (e.g. var x: int = 10, func foo() -> void). Fail validation if types are missing.' : 'Use dynamic typing where flexible.'}
      - **Verbosity**: ${config.verbosity === 'educational' ? 'Add detailed comments explaining WHY code works. Explain Godot concepts.' : config.verbosity === 'minimal' ? 'NO comments. Code only. Compact.' : 'Standard comments for complex logic.'}
      - **Architecture**: ${config.architecture === 'composition' ? 'Prefer COMPOSITION. Create modular Nodes/Components. Avoid deep inheritance trees.' : config.architecture === 'inheritance' ? 'Prefer INHERITANCE. Extend base classes.' : 'Choose best fit.'}
      - **Creativity**: ${config.creativity > 0.7 ? 'Be experimental and creative with solutions.' : 'Be conservative, strictly standard, and robust.'}
    `;
  }

  // Build Project Context
  const activeFile = projectFiles.find(f => f.id === activeFileId);
  const otherFiles = projectFiles.filter(f => f.id !== activeFileId);

  let projectContextStr = "";
  if (otherFiles.length > 0) {
      projectContextStr = "OTHER PROJECT FILES (Read-Only Context):\n";
      otherFiles.forEach(f => {
          projectContextStr += `--- FILE: ${f.name} ---\n${f.content}\n\n`;
      });
  }

  let specificPrompt = `
    Target Context: ${godotContext} Environment
    
    ${styleGuide}

    ${projectContextStr}

    CURRENT ACTIVE FILE (You are editing this):
    File Name: ${activeFile?.name || 'unknown_script.gd'}
    Content:
    \`\`\`gdscript
    ${activeFile?.content || ''}
    \`\`\`
  `;

  if (mode === 'asset') {
    specificPrompt += `
    ASSET GENERATION MODE (PROCEDURAL):
    The user wants a procedural asset generated via code (GDScript).
    - If 3D: Use 'ImmediateMesh', 'ArrayMesh', 'GridMap', or 'MultiMeshInstance3D' to generate geometry or place objects procedurally.
    - If 2D: Use 'draw()' functions in _draw(), or TileMap manipulation.
    - If Shader: Write a complete .gdshader file content wrapped in a string or helper script.
    - Make the script a '@tool' script so it runs in the editor.
    `;
  }

  if (referenceContent) {
    specificPrompt += `
    REFERENCE MATERIAL (Source to replicate/adapt):
    \`\`\`text
    ${referenceContent}
    \`\`\`
    
    INSTRUCTION: Analyze the Reference Material above and replicate its functionality/logic within the Godot 4 environment using best practices. Transform the reference concepts into Godot nodes/signals/resources where appropriate.
    `;
  }

  if (referenceImageBase64) {
    specificPrompt += `
    IMAGE ANALYSIS INSTRUCTION:
    An image has been provided. 
    1. Analyze the visual elements, physics implications, and game mechanics implied by the image.
    2. If it's a character, generate the movement/animation state machine code that would fit this character's design.
    3. If it's an environment, generate a procedural generation script (using GridMap, TileMap, or MultiMeshInstance3D) or a WorldEnvironment configuration script to replicate the atmosphere/style.
    4. If it's a UI, generate the Control node logic and theme overrides.
    `;
  }

  specificPrompt += `
    Task (${mode} Mode): ${prompt}
    
    Please provide the updated or new GDScript code for the CURRENT ACTIVE FILE in a JSON format with 'code' and 'explanation' fields. 
    Ensure the code is complete, strictly typed, and ready to copy-paste.
  `;

  // Construct the contents. If image exists, we need a multi-part content.
  let contentParts: any[] = [{ text: specificPrompt }];

  if (referenceImageBase64) {
    contentParts.unshift({
      inlineData: {
        mimeType: 'image/jpeg', 
        data: referenceImageBase64
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: referenceImageBase64 ? 'gemini-3-pro-image-preview' : 'gemini-3-pro-preview', // Use Vision capable model
      contents: { parts: contentParts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING, description: "The full GDScript code source." },
            explanation: { type: Type.STRING, description: "Brief explanation of changes and node requirements." }
          },
          required: ["code", "explanation"]
        },
        thinkingConfig: { thinkingBudget: 4096 } 
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Code Gen Error:", error);
    throw error;
  }
};

/**
 * Generates an image asset (Texture/Sprite) using Gemini Image Generation models.
 */
export const generateVisualAsset = async (
  prompt: string, 
  referenceImageBase64?: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");

  // If we have a reference image, we use it for image-to-image editing/variation context if supported,
  // or use the multimodal capabilities to describe it then generate.
  // Currently using gemini-3-pro-image-preview for high quality generation.
  
  const contentParts: any[] = [];
  
  if (referenceImageBase64) {
    contentParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: referenceImageBase64
      }
    });
    contentParts.push({ text: `Create a game asset texture/sprite based on this reference: ${prompt}` });
  } else {
    contentParts.push({ text: `Create a game asset texture/sprite: ${prompt}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: contentParts },
      config: {
        // Image generation specific config
        imageConfig: {
            aspectRatio: "1:1",
            imageSize: "2K"
        }
      }
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    
    throw new Error("No image data received in response.");

  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
};

export const chatWithGemini = async (
  history: { role: 'user' | 'model'; content: string }[],
  newMessage: string,
  projectFiles: ProjectFile[],
  activeFileId: string
) => {
  if (!apiKey) throw new Error("API Key missing");

  // Build simplistic project context string
  let projectContextStr = "PROJECT FILES:\n";
  projectFiles.forEach(f => {
      projectContextStr += `--- ${f.name} ---\n${f.content}\n\n`;
  });

  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + `\n Current Project State:\n${projectContextStr}`,
    }
  });

  const response = await chat.sendMessage({
    message: newMessage
  });

  return response.text;
};

export const analyzeError = async (errorLog: string, code: string) => {
    if (!apiKey) throw new Error("API Key missing");

    const prompt = `
      I have a bug in my Godot 4 project.
      
      Code:
      ${code}

      Error Log / Issue:
      ${errorLog}

      Analyze the error and provide a fixed version of the code if possible, and an explanation of why it happened.
      Focus on Common Godot 4 pitfalls (e.g. cyclic references, null instances, signal connection errors).
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            thinkingConfig: { thinkingBudget: 2048 }
        }
    });

    return response.text;
}