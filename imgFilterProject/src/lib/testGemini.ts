// Test function to debug Gemini API issues
export async function testGeminiAPI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  console.log("🧪 Testing Gemini API...");
  console.log("🔑 API Key (first 10 chars):", apiKey?.substring(0, 10) + "...");
  
  if (!apiKey) {
    console.error("❌ No API key found!");
    return;
  }

  // Test 1: Try the simplest possible request
  try {
    console.log("🧪 Test 1: Basic gemini-2.5-pro request...");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Hello, respond with just 'Hi'" }]
          }]
        })
      }
    );
    
    console.log("🧪 Response status:", response.status);
    console.log("🧪 Response headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error response:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("✅ Test 1 SUCCESS:", data);
    
  } catch (error) {
    console.error("❌ Test 1 FAILED:", error);
  }

  // Test 2: List available models
  try {
    console.log("🧪 Test 2: List available models...");
    
    const modelsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
        }
      }
    );
    
    console.log("🧪 Models response status:", modelsResponse.status);
    
    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      console.log("✅ Available models:", modelsData.models?.map((m: any) => m.name));
    } else {
      const errorText = await modelsResponse.text();
      console.error("❌ Models request failed:", errorText);
    }
    
  } catch (error) {
    console.error("❌ Test 2 FAILED:", error);
  }
}

// Call this function from browser console or component
// window.testGemini = testGeminiAPI;