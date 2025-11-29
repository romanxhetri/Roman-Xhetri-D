import { GoogleGenAI, GenerateContentResponse, Modality, Type, FunctionDeclaration, Chat } from "@google/genai";
import { Message, FileChange } from '../types';

if (!process.env.API_KEY) {
  // This is a placeholder check. In a real environment, the key would be set.
  // We'll proceed assuming it's available, per instructions.
  console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
    model: 'gemini-2.5-pro',
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
    // A new instance is created here to ensure the latest API key from the dialog is used.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
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
    
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
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
        model: 'gemini-2.5-pro',
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
        model: 'gemini-2.5-pro',
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
        model: 'gemini-2.5-pro',
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
        model: 'gemini-2.5-pro',
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
        model: 'gemini-2.5-pro',
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
        model: 'gemini-2.5-pro',
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
    return ai.chats.create({ model: 'gemini-2.5-pro', config: { systemInstruction } });
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
        model: 'gemini-2.5-pro',
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

// FIX: Added missing getProactiveHint function.
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
        model: 'gemini-2.5-pro',
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
        model: 'gemini-2.5-pro',
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

    const productListText = laptopList.map(p => `- ${p.name} (ID: ${p.id}, Price: $${p.price}, Specs: ${p.specs.cpu}, ${p.specs.gpu}, ${p.specs.ram} RAM, ${p.specs.storage} Storage)`).join('\n');

    const config = {
        systemInstruction: `You are SageX, a knowledgeable and helpful AI tech expert in a high-end laptop store. Your main goal is to help users understand the products and find the perfect laptop for their needs.
- Your tone is professional, clear, and tech-savvy, but still friendly and approachable.
- You have deep knowledge of computer hardware. Explain specs like CPU, GPU, and RAM in simple terms if needed.
- When a user asks for a recommendation, analyze their needs and suggest the best fit from the product list.
- Use emojis like 💻, 🚀, 💡, 🎮 to keep the conversation engaging.

Here is the current list of available laptops:
${productListText}`,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: contents,
        config: config,
    });
    return response;
};

export const getLaptopRecommendation = async (
    userNeeds: string,
    laptopList: any[]
): Promise<{ recommendedLaptopId: string; reasoning: string }> => {
    const ai = getAI();

    const productListText = JSON.stringify(laptopList.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        specs: p.specs
    })));

    const prompt = `
A customer is looking for a new laptop. Here's what they need: "${userNeeds}"

Here is the list of available laptops in JSON format:
${productListText}

Analyze the customer's needs and the specs of each laptop. Choose the single best laptop for the customer and provide a brief, compelling reason for your choice.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    recommendedLaptopId: {
                        type: Type.STRING,
                        description: 'The ID of the single best laptop for the customer.'
                    },
                    reasoning: {
                        type: Type.STRING,
                        description: 'A concise, user-friendly explanation for why this laptop was recommended.'
                    }
                },
                required: ['recommendedLaptopId', 'reasoning']
            }
        }
    });
    
    try {
        const jsonText = response.text.trim();
        const cleanedJson = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
        return JSON.parse(cleanedJson);
    } catch (e) {
        console.error("Failed to parse JSON for laptop recommendation:", response.text);
        throw new Error("The AI returned an invalid recommendation. Please try again.");
    }
};

export const getMobileChatResponse = async (
    history: Message[],
    newMessage: string,
    mobileList: any[]
): Promise<GenerateContentResponse> => {
    const ai = getAI();
    const formattedHistory = formatHistory(history);
    const contents = [...formattedHistory, { role: 'user', parts: [{ text: newMessage }] }];

    const productListText = mobileList.map(p => `- ${p.name} (ID: ${p.id}, Price: $${p.price}, Specs: ${p.specs.cpu}, ${p.specs.ram} RAM, ${p.specs.storage} Storage, ${p.specs.camera} Camera)`).join('\n');

    const config = {
        systemInstruction: `You are SageX, a knowledgeable and helpful AI tech expert in a futuristic mobile phone store. Your main goal is to help users understand the products and find the perfect mobile for their needs.
- Your tone is professional, clear, and tech-savvy, but still friendly and approachable.
- You have deep knowledge of mobile hardware. Explain specs like CPU, RAM, and Camera in simple terms if needed.
- When a user asks for a recommendation, analyze their needs and suggest the best fit from the product list.
- Use emojis like 📱, 🚀, 💡, 📸 to keep the conversation engaging.

Here is the current list of available mobile phones:
${productListText}`,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: contents,
        config: config,
    });
    return response;
};

export const getMobileRecommendation = async (
    userNeeds: string,
    mobileList: any[]
): Promise<{ recommendedMobileId: string; reasoning: string }> => {
    const ai = getAI();

    const productListText = JSON.stringify(mobileList.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        specs: p.specs
    })));

    const prompt = `
A customer is looking for a new mobile phone. Here's what they need: "${userNeeds}"

Here is the list of available mobile phones in JSON format:
${productListText}

Analyze the customer's needs and the specs of each phone. Choose the single best mobile phone for the customer and provide a brief, compelling reason for your choice.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    recommendedMobileId: {
                        type: Type.STRING,
                        description: 'The ID of the single best mobile phone for the customer.'
                    },
                    reasoning: {
                        type: Type.STRING,
                        description: 'A concise, user-friendly explanation for why this mobile phone was recommended.'
                    }
                },
                required: ['recommendedMobileId', 'reasoning']
            }
        }
    });
    
    try {
        const jsonText = response.text.trim();
        const cleanedJson = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
        return JSON.parse(cleanedJson);
    } catch (e) {
        console.error("Failed to parse JSON for mobile recommendation:", response.text);
        throw new Error("The AI returned an invalid recommendation. Please try again.");
    }
};

export const getTroubleshootingResponse = async (history: Message[], userProblem: string): Promise<GenerateContentResponse> => {
    const ai = getAI();
    const formattedHistory = formatHistory(history);
    const contents = [...formattedHistory, { role: 'user', parts: [{ text: userProblem }] }];
    
    const config = {
        systemInstruction: `You are an expert and patient AI troubleshooting assistant named 'Chip'. Your goal is to help users solve technical problems with their devices (like laptops, mobile phones, etc.) in a clear, friendly, and effective manner.
- Your tone should be calming, reassuring, and professional.
- ALWAYS ask clarifying questions first if the user's problem is vague.
- Provide solutions as a numbered list of step-by-step instructions.
- Start with the simplest solutions first (e.g., "Have you tried turning it off and on again?") before moving to more complex ones.
- Explain technical terms simply.
- Use emojis like 🔧, 💡, ✅ to make the steps clear and friendly.
- End your response by asking if the proposed solution worked, and what the user would like to try next if it didn't.`,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: contents,
        config: config,
    });
    return response;
};


export const getAISearchResponse = async (query: string, location: GeolocationCoordinates | null): Promise<GenerateContentResponse> => {
  const ai = getAI();

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

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    ...config,
  });

  return response;
};

export const getTripPlan = async (prompt: string, location: GeolocationCoordinates | null): Promise<GenerateContentResponse> => {
  const ai = getAI();

  const config: any = {
      systemInstruction: `You are a world-class AI travel agent. Your goal is to create a detailed, exciting, and practical travel itinerary based on the user's request.
- Use markdown to structure the response clearly with headings for each day, bullet points for activities, and bold text for key locations.
- Include a mix of popular attractions and hidden gems.
- Suggest types of restaurants or specific dishes to try.
- Leverage your access to Google Search for the most up-to-date information and Google Maps to provide links to locations.
- Your tone should be enthusiastic and inspiring. Add an emoji or two to make it fun! 🏖️`,
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

  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: config,
  });

  return response;
};

export const getStoryStream = async (chat: Chat, newPrompt: string) => {
    return await chat.sendMessageStream({ message: newPrompt });
};

export const createStoryChat = (): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
            systemInstruction: `You are a master storyteller. Continue the narrative based on the user's prompt and the existing story.
- Your tone should be captivating and immersive.
- Weave detailed descriptions and compelling dialogue.
- End each segment on a point that makes the user want to know what happens next.
- Do not repeat yourself or the user's prompt. Just continue the story.`,
        },
    });
};


export const getDataAnalysisResponse = async (csvData: string, prompt: string): Promise<GenerateContentResponse> => {
    const ai = getAI();

    const fullPrompt = `
Analyze the following dataset in CSV format and answer the user's question.

--- CSV DATA START ---
${csvData}
--- CSV DATA END ---

User's question: "${prompt}"

Provide a clear and concise answer based on the data. If the question is open-ended (e.g., "what can you tell me about this data?"), provide a brief summary including column headers, number of rows, and any obvious patterns you see.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullPrompt,
        config: {
            systemInstruction: `You are a world-class data analyst AI called the 'Data Oracle'. Your task is to analyze the provided CSV data and answer the user's questions with insightful and accurate information.
- Be direct and to the point.
- Format your response using clear markdown.
- When you suggest a chart, be specific about the data points to use for the axes or segments.`,
        },
    });

    return response;
};

export const createMythosChat = (): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
            systemInstruction: `You are the Mythos Engine, a master storyteller and Dungeon Master for a text-based RPG.
- Your goal is to create a dynamic, engaging, and challenging adventure.
- You MUST track the player's state: Health Points (HP), Attack Power (AP), and Inventory. The player starts with 100 HP, 10 AP, and an empty inventory.
- Every single response you provide MUST be a JSON object adhering to the schema.
- NEVER respond with anything other than this JSON structure. Do not add markdown like \`\`\`json.
- The story must react to the user's choices. If they fight, describe the combat. If they explore, describe what they find.
- When the user gets a new item, add it to the inventory. When their stats change, update the hp/ap values.
- If the game is over, the story should reflect the final outcome (victory or defeat).`,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    story: {
                        type: Type.STRING,
                        description: "The next part of the adventure narrative. Be descriptive, engaging, and about 2-4 sentences long."
                    },
                    character: {
                        type: Type.OBJECT,
                        properties: {
                            hp: { type: Type.INTEGER, description: "Player's current health points." },
                            ap: { type: Type.INTEGER, description: "Player's current attack power." },
                            inventory: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "List of items the player is carrying."
                            }
                        },
                        required: ["hp", "ap", "inventory"]
                    },
                    gameOver: {
                        type: Type.BOOLEAN,
                        description: "True if the player's HP is 0 or they have won, otherwise false."
                    }
                },
                required: ["story", "character", "gameOver"]
            }
        },
    });
};