import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function generateHalloweenRoast(
  imageData: string,
  filter?: string | null
): Promise<string> {
  try {
    console.log("🤖 Generating Halloween roast with Gemini...");
    
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert base64 image data to the format Gemini expects
    const imageBase64 = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
    
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg"
      }
    };

    // Create a Halloween-themed roast prompt
    const prompt = `Look at this Halloween costume and give it a funny, playful roast! 
    Be witty and creative but keep it light-hearted and fun. 
    ${filter ? `The person chose a "${filter}" filter for extra spookiness.` : ""}
    
    Write a short, punchy roast (2-3 sentences max) that would make people laugh. 
    Make it Halloween-themed with some spooky humor. Don't be mean, just playfully sarcastic!
    
    Examples of the tone:
    - "Nice costume! I see you went for the 'I raided a thrift store blindfolded' look 👻"
    - "That's not a costume, that's a cry for help from your fashion sense! 🎃"
    - "I've seen scarier things in my morning mirror, but points for effort! 💀"`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ Gemini roast generated successfully");
    return text;
    
  } catch (error) {
    console.error("❌ Error generating Gemini roast:", error);
    
    // Fallback roasts if API fails
    const fallbackRoasts = [
      "Nice costume! I see you went for the 'effortlessly spooky' look 👻",
      "That outfit is so scary, it made my internet connection hide! 🎃",
      "I've seen scarier things, but your commitment to the bit is admirable! 💀",
      "10/10 costume choice - you really nailed the 'hauntingly fashionable' vibe! 🧛‍♀️",
      "That look is giving me chills... and not just because it's Halloween! ❄️👻"
    ];
    
    const randomRoast = fallbackRoasts[Math.floor(Math.random() * fallbackRoasts.length)];
    return randomRoast;
  }
}