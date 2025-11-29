

import { GoogleGenAI, GenerateContentResponse, Modality, Type, FunctionDeclaration, Chat } from "@google/genai";
import { Message, FileChange } from '../types';

// Hardcoded API Key to ensure functionality in production deployments
export const API_KEY = 'AIzaSyCOycJFafEhEOxjSVIMgTe59BLRyJov9lA';

// Log initialization to help debug in production console
console.log(`SageX AI Service Initialized. Key available: ${!!API_KEY}`);

const getAI = () => new GoogleGenAI({ apiKey: API_KEY });

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
        description: 'The specific view to navigate to. Must be one of: home, product, pricing, blog, facebook, chatgpt, laptops, mobiles, device_troubleshooter, ai_search, games, chat, media_creation, live_conversation, tts, code_wizard, aether_canvas, data_oracle, trip_planner, story_weaver, dream_weaver, cosmic_composer, mythos_engine, temporal_investigator, bio_symphony, echo_forge, admin.',
      },
    },
    required: ['view'],
  },
};

export const getChatResponse = async (history: Message[], newMessage: string, location: GeolocationCoordinates | null): Promise<GenerateContentResponse> => {
  const ai = getAI();
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

The available views are: 'home', 'product', 'pricing', 'blog', 'facebook', 'chatgpt', 'laptops', 'mobiles', 'device_troubleshooter', 'ai_search', 'games', 'chat', 'media_creation', 'live_conversation', 'tts', 'code_wizard', 'aether_canvas', 'data_oracle', 'trip_planner', 'story_weaver', 'dream_weaver', 'cosmic_composer', 'mythos_engine', 'temporal_investigator', 'bio_symphony', 'echo_forge', 'admin'.`,
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

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: config,
  });
  return response;
};

export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data returned from API.");
    }
    return base64Audio;
};

export const editImageWithPrompt = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64ImageData, mimeType } },
                { text: prompt },
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
    throw new Error("No edited image was generated.");
};

export const generateVideoFromPrompt = async (prompt: string, aspectRatio: '16:9' | '9:16', onPoll?: (op: any) => void): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio,
        }
    });

    while (!operation.done) {
        if(onPoll) onPoll(operation);
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed but no download link was found.");
    }
    
    const videoResponse = await fetch(`${downloadLink}&key=${API_KEY}`);
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
};

export const generateImageFromPrompt = async (prompt: string, aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio,
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const findBugsInProject = async (files: Record<string, string>): Promise<GenerateContentResponse> => {
    const ai = getAI();
    const formattedFiles = Object.entries(files).map(([path, content]) => `
--- FILE: ${path} ---
\`\`\`
${content}
\`\`\`
`).join('\n');

    const prompt = `
        You are an expert software engineer specializing in finding bugs in React + TypeScript applications.
        Analyze the following project files and identify any potential bugs, logical errors, or anti-patterns.
        Do not suggest stylistic changes or minor improvements unless they prevent a bug. Focus on actual errors.
        Provide a concise report in markdown format. For each issue found, specify the file, the line number (if possible), and a brief explanation of the bug and how to fix it.
        If you find no bugs, respond with: "The code looks magically pristine! I couldn't find any bugs. ✨"

        Project Files:
        ${formattedFiles}
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
    });
    return response;
};

export const generateComponentCode = async (prompt: string): Promise<{ html: string, reasoning: string }> => {
    const ai = getAI();
    const fullPrompt = `
        Generate a single, self-contained HTML component using Tailwind CSS based on the following user request: "${prompt}".
        - The component should be visually appealing and modern.
        - Use placeholder images from unsplash.com if needed (e.g., https://images.unsplash.com/photo-15...)
        - DO NOT include \`<html>\`, \`<body>\`, or any script tags. Only provide the HTML for the component itself.
        - The entire response MUST be a JSON object.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: fullPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    html: { type: Type.STRING, description: "The raw HTML and Tailwind CSS code for the component." },
                    reasoning: { type: Type.STRING, description: "A brief, friendly explanation of the component created." }
                },
                required: ['html', 'reasoning']
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        const cleanedJson = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
        return JSON.parse(cleanedJson);
    } catch (e) {
        console.error("Failed to parse component code JSON:", response.text);
        throw new Error("The AI returned invalid component data.");
    }
};

export const applyDesignToClothing = async (mockupImage: {data: string, mimeType: string}, designImage: {data: string, mimeType: string}): Promise<string> => {
    const ai = getAI();
    const prompt = "Place the second image (the design) realistically onto the front of the t-shirt in the first image (the mockup). The design should look like it's printed on the fabric, following its contours and lighting.";
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: mockupImage },
                { inlineData: designImage },
                { text: prompt },
            ],
        },
        config: { responseModalities: [Modality.IMAGE] },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("No mockup image was generated.");
};


export const performVirtualTryOn = async (userImage: {data: string, mimeType: string}, clothingImage: {data: string, mimeType: string}): Promise<string> => {
     const ai = getAI();
    const prompt = "Edit the first image (the person) so they are realistically wearing the item of clothing from the second image. The clothing should fit the person's body and posture naturally.";
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: userImage },
                { inlineData: clothingImage },
                { text: prompt },
            ],
        },
        config: { responseModalities: [Modality.IMAGE] },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("No try-on image was generated.");
};


export const interpretAndVisualizeDream = async (dreamDescription: string): Promise<{ interpretation: string, imageUrl: string }> => {
    const ai = getAI();
    const interpretationPrompt = `
        Analyze the following dream description and provide a brief, insightful psychological interpretation.
        Then, based on the key symbols and emotions in the dream, create a detailed, artistic, and visually stunning image prompt for an AI image generator. The style should be surreal and dreamlike.

        Dream: "${dreamDescription}"

        Respond ONLY with a JSON object in the format:
        { "interpretation": "Your interpretation of the dream.", "image_prompt": "Your detailed prompt for the image generator." }
    `;
    const interpretationResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: interpretationPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    interpretation: { type: Type.STRING },
                    image_prompt: { type: Type.STRING }
                },
                required: ['interpretation', 'image_prompt']
            }
        }
    });

    const { interpretation, image_prompt } = JSON.parse(interpretationResponse.text);
    const imageUrl = await generateImageFromPrompt(image_prompt, '4:3');
    return { interpretation, imageUrl };
};

export const generateCosmicComposition = async (prompt: string): Promise<string> => {
    const fullPrompt = `A user wants to hear music described as: "${prompt}". Compose a short, evocative, spoken-word poem that describes this music. Use rich, sensory language.`;
    return generateSpeech(fullPrompt, 'Zephyr');
};

export const generateAnomaly = async (): Promise<{ case_file: string; image_prompt: string; }> => {
    const ai = getAI();
    const prompt = `
        Create a historical anomaly for a "Temporal Investigator" game. The anomaly should be a subtle but impossible paradox in a specific historical setting. Provide a short case file description and a detailed prompt for an AI image generator to visualize the scene of the anomaly.
        Respond ONLY with a JSON object in the format:
        { "case_file": "A brief, intriguing description of the temporal anomaly.", "image_prompt": "A detailed, atmospheric prompt for an image generator, focusing on the historical setting and the paradoxical element." }
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: { case_file: { type: Type.STRING }, image_prompt: { type: Type.STRING } },
                required: ['case_file', 'image_prompt']
            }
        }
    });
    return JSON.parse(response.text);
};


export const createAnomalyChat = (): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are A.R.I.A. (Archival Retrieval & Intelligence Assistant), the AI partner for a Temporal Investigator. Your tone is professional, calm, and slightly futuristic. The user is an agent trying to solve a historical paradox you've presented. You have access to the "entire historical record." Answer user questions based on established history, but also hint at the paradoxical elements. Your goal is to guide the user to identify the specific object or event that doesn't belong. Keep responses concise and analytical.`,
        },
    });
};

export const createBioSymphony = async (base64ImageData: string, mimeType: string): Promise<{ poem: string; imageUrl: string; audioBase64: string; }> => {
    const ai = getAI();
    const imagePart = { inlineData: { data: base64ImageData, mimeType } };
    const generationPrompt = `Analyze the person's facial expression in this image. Based on the perceived emotion, do two things: 1. Write a short, four-line poem that captures this emotion. 2. Create a detailed, artistic prompt for an AI image generator to create an abstract, beautiful visualization of this emotion. The style should be ethereal and symbolic. Combine these into a single JSON object. Respond ONLY with the JSON object.`;
    
    const interpretationResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: generationPrompt }] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: { poem: { type: Type.STRING }, image_prompt: { type: Type.STRING } },
                required: ['poem', 'image_prompt']
            }
        }
    });
    
    const { poem, image_prompt } = JSON.parse(interpretationResponse.text);
    const imageUrl = await generateImageFromPrompt(image_prompt, '1:1');
    const audioBase64 = await generateSpeech(poem, 'Kore');
    return { poem, imageUrl, audioBase64 };
};

export const generateAvatar = async (prompt: string): Promise<string> => {
    const fullPrompt = `A detailed, expressive character avatar based on the description: "${prompt}". centered, portrait, character design, detailed face, fantasy art style.`;
    return generateImageFromPrompt(fullPrompt, '1:1');
};

export const createPersonaChat = (systemInstruction: string): Chat => {
    const ai = getAI();
    return ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
};

export const generateProjectModifications = async (request: string, files: Record<string, string>, systemInstruction?: string): Promise<FileChange[]> => {
    const ai = getAI();
    const formattedFiles = Object.entries(files).map(([path, content]) => `
--- FILE: ${path} ---
\`\`\`
${content}
\`\`\`
`).join('\n');

    const prompt = `
        You are an expert AI software engineer. The user wants to modify their React + TypeScript application.
        User Request: "${request}"
        ${systemInstruction || ''}
        Current Project Files:
        ${formattedFiles}
        Based on the user's request, provide the necessary code changes. Only return files that need to be changed. For each file, provide a brief description of the change and the FULL updated content of the file. Ensure the code is clean, correct, and follows best practices. The entire response MUST be a JSON array of objects.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        file: { type: Type.STRING, description: "The full path of the file to change." },
                        description: { type: Type.STRING, description: "A brief, one-sentence description of the changes made to this file." },
                        content: { type: Type.STRING, description: "The complete, new content of the file." }
                    },
                    required: ["file", "description", "content"]
                }
            }
        }
    });
    
    try {
        const jsonText = response.text.trim();
        const cleanedJson = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
        return JSON.parse(cleanedJson);
    } catch (e) {
        console.error("Failed to parse project modifications JSON:", response.text);
        throw new Error("The AI returned invalid modification data.");
    }
};

export const getProactiveHint = async (context: { currentView: string; activityLog: any[] }): Promise<{ hint_text: string; target_view: string }> => {
    const ai = getAI();

    const activityLogString = context.activityLog
        .map(log => ` - At ${new Date(log.timestamp).toLocaleTimeString()}, user did '${log.type}' on '${JSON.stringify(log.details)}'`)
        .join('\n');

    const prompt = `
        You are an AI assistant integrated into a web application called SageX. Your goal is to proactively help the user by suggesting relevant features they might be interested in, based on their recent activity.

        Current application state:
        - The user is currently on the '${context.currentView}' view.
        - The user has been idle for a while.

        Here is a log of the user's recent activities:
        ${activityLogString}

        Analyze the user's current location and recent activity. Based on this, suggest a single, relevant feature they might want to explore next. Your suggestion should be encouraging and intriguing.

        For example, if the user was just looking at the 'Media Creation' page, you might suggest they try the 'Dream Weaver' to visualize their thoughts. If they are on the home page and haven't done much, maybe suggest the main 'ChatGPT' feature.

        The available views are: 'home', 'product', 'pricing', 'blog', 'facebook', 'chatgpt', 'laptops', 'mobiles', 'device_troubleshooter', 'ai_search', 'games', 'chat', 'media_creation', 'live_conversation', 'tts', 'code_wizard', 'aether_canvas', 'data_oracle', 'trip_planner', 'story_weaver', 'dream_weaver', 'cosmic_composer', 'mythos_engine', 'temporal_investigator', 'bio_symphony', 'echo_forge', 'admin'.

        Respond ONLY with a JSON object.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    hint_text: {
                        type: Type.STRING,
                        description: "A short, engaging hint for the user. Phrase it like a curious suggestion, e.g., 'Feeling creative? Why not try visualizing your dreams?'"
                    },
                    target_view: {
                        type: Type.STRING,
                        description: "The view ID to navigate to if the user clicks the hint. Must be one of the available views."
                    }
                },
                required: ['hint_text', 'target_view']
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        const cleanedJson = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
        return JSON.parse(cleanedJson);
    } catch (e) {
        console.error("Failed to parse proactive hint JSON:", response.text, e);
        throw new Error("The AI returned an invalid hint.");
    }
};

export const getFashionChatResponse = async (
    history: Message[],
    newMessage: string,
    productList: any[]
): Promise<GenerateContentResponse> => {
    const ai = getAI();
    const formattedHistory = formatHistory(history);
    const contents = [...formattedHistory, { role: 'user', parts: [{ text: newMessage }] }];

    const productListText = productList.map(p => `- ${p.name} (ID: ${p.id}, Price: $${p.price}, Category: ${p.category})`).join('\n');

    const config = {
        systemInstruction: `You are SageX, an enthusiastic and highly persuasive AI fashion assistant in a virtual clothing store. Your primary goal is to help users find clothes they love and encourage them to make a purchase.
- Your tone is friendly, stylish, and confident. Use fashion-forward language.
- Be proactive! If a user seems unsure, suggest alternatives or complementary items.
- You have access to the store's inventory. Use it to make specific recommendations.
- When a user asks for something, find relevant items from the list and suggest them by name.
- Always aim to close the sale. End your responses with a positive, action-oriented phrase like "Ready to add it to your cart?" or "Let's get you styled!".
- Use plenty of emojis like 🛍️, ✨, 👕, 👖, 🤩.

Here is the current list of available products:
${productListText}`,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: config,
    });
    return response;
};

export const getLaptopChatResponse = async (
    history: Message[],
    newMessage: string,
    laptopList: any[]
): Promise<GenerateContentResponse> => {
    const ai = getAI();
    const formattedHistory = formatHistory(history);
    const contents = [...formattedHistory, { role: 'user', parts: [{ text: newMessage }] }];

    const productListText = laptopList.map(p => `- ${p.name} (ID: ${p.id}, Price: $${p.price}, Specs: ${p.specs.cpu}, ${p.specs.gpu}, ${p.specs.ram} RAM`).join('\n');

    const config = {
        systemInstruction: `You are a knowledgeable tech sales assistant for high-end laptops.
        Current Inventory:
        ${productListText}
        Help the user pick the right laptop.`,
    };
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: config,
    });
    return response;
};

export const getMobileChatResponse = async (
    history: Message[],
    newMessage: string,
    mobileList: any[]
): Promise<GenerateContentResponse> => {
    const ai = getAI();
    const formattedHistory = formatHistory(history);
    const contents = [...formattedHistory, { role: 'user', parts: [{ text: newMessage }] }];

    const productListText = mobileList.map(p => `- ${p.name} (ID: ${p.id}, Price: $${p.price}, Specs: ${p.specs.cpu}, ${p.specs.camera}, ${p.specs.ram} RAM`).join('\n');

    const config = {
        systemInstruction: `You are a knowledgeable tech sales assistant for mobile phones.
        Current Inventory:
        ${productListText}
        Help the user pick the right phone.`,
    };
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: config,
    });
    return response;
};

export const getLaptopRecommendation = async (userNeeds: string, laptopList: any[]): Promise<{ recommendedLaptopId: string; reasoning: string }> => {
    const ai = getAI();
    const productListText = laptopList.map(p => `- ${p.name} (ID: ${p.id}, Price: $${p.price}, Specs: ${JSON.stringify(p.specs)})`).join('\n');

    const prompt = `
        User needs: "${userNeeds}"
        Available Laptops:
        ${productListText}

        Select the best laptop from the list that matches the user's needs.
        Respond ONLY with a JSON object: { "recommendedLaptopId": "id", "reasoning": "brief explanation" }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                 type: Type.OBJECT,
                 properties: {
                     recommendedLaptopId: { type: Type.STRING },
                     reasoning: { type: Type.STRING }
                 },
                 required: ['recommendedLaptopId', 'reasoning']
            }
        }
    });

    return JSON.parse(response.text);
};

export const getMobileRecommendation = async (userNeeds: string, mobileList: any[]): Promise<{ recommendedMobileId: string; reasoning: string }> => {
    const ai = getAI();
    const productListText = mobileList.map(p => `- ${p.name} (ID: ${p.id}, Price: $${p.price}, Specs: ${JSON.stringify(p.specs)})`).join('\n');

    const prompt = `
        User needs: "${userNeeds}"
        Available Mobiles:
        ${productListText}

        Select the best mobile from the list that matches the user's needs.
        Respond ONLY with a JSON object: { "recommendedMobileId": "id", "reasoning": "brief explanation" }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                 type: Type.OBJECT,
                 properties: {
                     recommendedMobileId: { type: Type.STRING },
                     reasoning: { type: Type.STRING }
                 },
                 required: ['recommendedMobileId', 'reasoning']
            }
        }
    });

    return JSON.parse(response.text);
};

export const getTroubleshootingResponse = async (history: Message[], newMessage: string): Promise<GenerateContentResponse> => {
     const ai = getAI();
    const formattedHistory = formatHistory(history);
    const contents = [...formattedHistory, { role: 'user', parts: [{ text: newMessage }] }];

    const config = {
        systemInstruction: `You are Chip, a friendly and expert technical support AI. Help the user troubleshoot their device issues. Ask clarifying questions if needed. Provide step-by-step solutions.`,
    };
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: config,
    });
    return response;
};

export const getAISearchResponse = async (query: string, location: GeolocationCoordinates | null): Promise<GenerateContentResponse> => {
     const ai = getAI();
     const config: any = {
        tools: [{googleSearch: {}}, {googleMaps: {}}],
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: config,
    });
    return response;
};

export const getTripPlan = async (prompt: string, location: GeolocationCoordinates | null): Promise<GenerateContentResponse> => {
    const ai = getAI();
    const config: any = {
        systemInstruction: "You are a world-class travel agent. Create a detailed, day-by-day itinerary based on the user's request. Include hotels, restaurants, and activities. Use Google Search and Maps to find real, highly-rated places.",
        tools: [{googleSearch: {}}, {googleMaps: {}}],
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: config,
    });
    return response;
};

export const createStoryChat = (): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are a master storyteller. Collaborate with the user to write a story. You can write a paragraph, then let the user write one, or simply continue the story based on their prompts. Be creative and descriptive.",
        }
    });
};

export const getStoryStream = async (chat: Chat, prompt: string) => {
    const result = await chat.sendMessageStream({ message: prompt });
    return result;
}

export const createMythosChat = (): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    story: { type: Type.STRING, description: "The narrative description of what happens next." },
                    character: {
                        type: Type.OBJECT,
                        properties: {
                            hp: { type: Type.INTEGER },
                            ap: { type: Type.INTEGER },
                            inventory: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    },
                    gameOver: { type: Type.BOOLEAN }
                }
            },
            systemInstruction: `You are the Mythos Engine, an AI Dungeon Master. Run a text-based RPG.
            - Track the user's HP (starts at 100), AP (starts at 10), and Inventory.
            - Update the state based on the user's actions.
            - If HP reaches 0, gameOver is true.
            - Respond in JSON format with the 'story', 'character' state, and 'gameOver' status.`,
        }
    });
}

export const getDataAnalysisResponse = async (csvData: string, query: string): Promise<GenerateContentResponse> => {
    const ai = getAI();
    const prompt = `
        Here is a dataset in CSV format:
        \`\`\`csv
        ${csvData.slice(0, 10000)} 
        \`\`\`
        (Note: Data might be truncated if too large)

        User Question: "${query}"

        Analyze the data to answer the user's question. Provide insights, trends, or specific values. 
        Format the response with Markdown tables or lists if appropriate.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response;
};