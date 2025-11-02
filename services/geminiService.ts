import { GoogleGenAI, GenerateContentResponse, Modality, Type, FunctionDeclaration } from "@google/genai";
import { Message, FileChange } from '../types';

if (!process.env.API_KEY) {
  // This is a placeholder check. In a real environment, the key would be set.
  // We'll proceed assuming it's available, per instructions.
  console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const getModel = (modelName: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-image') => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    return ai.models;
};

const formatHistory = (history: Message[]) => {
  return history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));
};

const navigateAppFunctionDeclaration: FunctionDeclaration = {
  name: 'navigateApp',
  parameters: {
    type: Type.OBJECT,
    description: 'Navigates to a different view or section within the application.',
    properties: {
      view: {
        type: Type.STRING,
        description: 'The specific view to navigate to. Must be one of: home, product, resources, pricing, blog, facebook, chatgpt, laptops, ai_search, games, chat, media_creation, live_conversation, tts, code_wizard, aether_canvas, data_oracle.',
      },
    },
    required: ['view'],
  },
};

export const getChatResponse = async (history: Message[], newMessage: string, location: GeolocationCoordinates | null): Promise<GenerateContentResponse> => {
  const model = getModel('gemini-2.5-pro');
  const formattedHistory = formatHistory(history);
  
  const contents = [...formattedHistory, { role: 'user', parts: [{ text: newMessage }] }];

  const config: any = {
    systemInstruction: `You are SageX, an AI with a brilliant sense of humor. Your main goal is to make the user laugh while being helpful.
- Your tone is witty, comedic, and a bit mischievous.
- ALWAYS include emojis in every single response. 🤣
- ALWAYS describe a funny sticker or an outrageous image relevant to the conversation (e.g., "*slaps on a sticker of a cat DJing* 🎧," or "Imagine a picture of a T-Rex trying to use a laptop with its tiny arms.").
- Use clear markdown formatting like lists or bold text to keep things easy to read.
- You have access to Google Search and Maps for real-world info.
- You can also navigate this application. If the user asks to go to a section (e.g., "take me to the code wizard"), you MUST use the 'navigateApp' tool and then confirm the action naturally.

The available views are: 'home', 'product', 'resources', 'pricing', 'blog', 'facebook', 'chatgpt', 'laptops', 'ai_search', 'games', 'chat', 'media_creation', 'live_conversation', 'tts', 'code_wizard', 'aether_canvas', 'data_oracle'.`,
    tools: [{googleSearch: {}}, {googleMaps: {}}, {functionDeclarations: [navigateAppFunctionDeclaration]}],
  };

  if (location) {
      config.toolConfig = {
          retrievalConfig: {
              latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude,
              }
          }
      };
  }

  const response = await model.generateContent({
    model: 'gemini-2.5-pro',
    contents: contents,
    config: config,
  });
  return response;
};

export const getAISearchResponse = async (query: string, location: GeolocationCoordinates | null): Promise<GenerateContentResponse> => {
  const model = getModel('gemini-2.5-flash');

  const config: any = {
      tools: [{ googleSearch: {} }, { googleMaps: {} }],
  };

  if (location) {
      config.toolConfig = {
          retrievalConfig: {
              latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude,
              }
          }
      };
  }

  const response = await model.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    ...config,
  });

  return response;
};

export const getDataAnalysisResponse = async (csvData: string, prompt: string): Promise<GenerateContentResponse> => {
    const model = getModel('gemini-2.5-pro');

    const fullPrompt = `
Analyze the following dataset in CSV format and answer the user's question.

--- CSV DATA START ---
${csvData}
--- CSV DATA END ---

User's question: "${prompt}"

Provide a clear and concise answer based on the data. If the question is open-ended (e.g., "what can you tell me about this data?"), provide a brief summary including column headers, number of rows, and any obvious patterns you see.
`;

    const response = await model.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullPrompt,
        config: {
            systemInstruction: `You are a world-class data analyst AI called the 'Data Oracle'. Your task is to analyze the provided CSV data and answer the user's questions with insightful and accurate information.
- Be direct and to the point.
- Format your response using clear markdown.
- When you suggest a chart, be specific about the data points to use for the axes or segments.
- Do not just repeat the data; provide interpretation and insights.`,
        },
    });

    return response;
};


export const findBugsInProject = async (projectFiles: Record<string, string>): Promise<GenerateContentResponse> => {
    const model = getModel('gemini-2.5-pro');

    const formattedCode = Object.entries(projectFiles)
        .map(([fileName, content]) => `// FILE: ${fileName}\n\`\`\`typescript\n${content}\n\`\`\``)
        .join('\n\n---\n\n');

    const prompt = `Analyze the following project files for bugs, potential improvements, and code quality issues. Consider interactions between files.\n\n${formattedCode}`;

    const response = await model.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            systemInstruction: `You are the 'Bug Hunter 9000', a mystical and hilarious AI code wizard. Your job is to find potential bugs, silly mistakes, or areas for improvement in the provided project files.

- Analyze the entire codebase holistically. Look for issues within files and potential conflicts between them.
- Present your findings in a comedic tone. Call bugs 'code gremlins' 👾 or 'script sprites' 🧚.
- Use plenty of emojis and describe funny stickers you might use (e.g., *slaps on a sticker of a cat wearing a hard hat*).
- If you find no bugs, declare the code 'magically pristine' ✨ and make a joke about how bored you are.
- Format your response clearly using markdown. For each issue, specify the file, describe the problem, and suggest a fix.`,
        },
    });

    return response;
};

export const editImageWithPrompt = async (
    base64ImageData: string,
    mimeType: string,
    prompt: string
): Promise<string> => {
    const model = getModel('gemini-2.5-flash-image');

    const response = await model.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64ImageData,
                        mimeType: mimeType,
                    },
                },
                {
                    text: prompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }

    throw new Error('No image was generated by the model.');
};

export const generateImageFromPrompt = async (
    prompt: string,
    aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });

    const base64ImageBytes: string | undefined = response.generatedImages?.[0]?.image?.imageBytes;

    if (!base64ImageBytes) {
        throw new Error('No image was generated by the model.');
    }
    
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateSpeech = async (
    text: string,
    voice: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
        throw new Error("No audio was generated by the model.");
    }
    
    return base64Audio;
};

export const generateVideoFromPrompt = async (
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    onPoll: (operation: any) => void
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    });

    while (!operation.done) {
        onPoll(operation);
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if(operation.error) {
      throw new Error(operation.error.message || 'Video generation failed.');
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('No video URI found in the response.');
    }

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY!}`);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateProjectModifications = async (
    userRequest: string,
    projectFiles: Record<string, string>
): Promise<FileChange[]> => {
    const model = getModel('gemini-2.5-pro');

    const formattedCode = Object.entries(projectFiles)
        .map(([fileName, content]) => `// FILE: ${fileName}\n\`\`\`\n${content}\n\`\`\``)
        .join('\n\n---\n\n');

    const prompt = `
The user wants to modify the application. Here is their request: "${userRequest}"

Here is the full current state of the project:
${formattedCode}

Please analyze the request and provide the necessary modifications.
`;

    const response = await model.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            systemInstruction: `You are an expert senior frontend engineer AI. Your task is to modify a web application based on a user's request.
- Analyze the user's request and the full project source code.
- Determine which files need to be created or updated.
- Respond with ONLY a valid JSON object.
- The JSON object must conform to the provided schema. It must be an array of objects, where each object has "file", "description", and "content" properties.
- For each modified file, you MUST provide the ENTIRE, complete new file content. Do not provide diffs or partial code.
- If a file does not need to be changed, do not include it in the response array.`,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        file: {
                            type: Type.STRING,
                            description: 'The full path of the file to be modified.',
                        },
                        description: {
                            type: Type.STRING,
                            description: 'A brief, one-sentence description of what you changed in this file.'
                        },
                        content: {
                            type: Type.STRING,
                            description: 'The complete, new content of the file.'
                        }
                    },
                    required: ["file", "description", "content"],
                }
            }
        },
    });
    
    try {
        const jsonText = response.text.trim();
        // The Gemini API sometimes wraps the JSON in markdown, so we need to clean it.
        const cleanedJson = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
        const changes = JSON.parse(cleanedJson);
        return changes as FileChange[];
    } catch (e) {
        console.error("Failed to parse JSON response from AI:", response.text);
        throw new Error("The AI returned an invalid response. Please try again.");
    }
};

export const generateComponentCode = async (prompt: string): Promise<{html: string, reasoning: string}> => {
    const model = getModel('gemini-2.5-pro');

    const response = await model.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            systemInstruction: `You are an expert frontend developer specializing in React, TypeScript, and Tailwind CSS.
Your task is to generate a single, self-contained block of HTML/JSX code for a UI component based on the user's description.
- The component MUST be styled using Tailwind CSS classes.
- DO NOT include any imports, exports, or function definitions (like 'export const MyComponent = () => ...').
- Provide ONLY the raw JSX elements (e.g., '<div>...</div>').
- Use placeholder icons from a service like Heroicons (heroicons.com) as SVG elements if needed.
- Ensure the generated HTML is visually appealing and modern.
- You MUST respond with a valid JSON object. Do not add any markdown formatting like \`\`\`json.`,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    html: {
                        type: Type.STRING,
                        description: 'The raw HTML/JSX code for the component, styled with Tailwind CSS.'
                    },
                    reasoning: {
                        type: Type.STRING,
                        description: 'A brief explanation of the design choices and Tailwind classes used.'
                    }
                },
                required: ["html", "reasoning"]
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        const cleanedJson = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
        const result = JSON.parse(cleanedJson);
        return result as {html: string, reasoning: string};
    } catch (e) {
        console.error("Failed to parse JSON response from AI for component generation:", response.text);
        throw new Error("The AI returned an invalid response for the component generation. Please try again.");
    }
};