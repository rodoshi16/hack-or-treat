interface DSAQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  emoji_mapping: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

export async function generateDSAQuestion(): Promise<DSAQuestion> {
  try {
    console.log("🧠 Generating DSA question with Gemini...");
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not found");
    }

    const prompt = `Create a computer science multiple choice question about data structures and algorithms.

Return your response as valid JSON with this exact structure:
{
  "question": "What is the time complexity of binary search?",
  "options": {
    "A": "O(1)",
    "B": "O(log n)", 
    "C": "O(n)",
    "D": "O(n²)"
  },
  "correctAnswer": "B",
  "emoji_mapping": {
    "A": "⚡",
    "B": "📈",
    "C": "📏", 
    "D": "💥"
  }
}

Only return the JSON, no other text.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.1
            }
          }),
          signal: controller.signal
        }
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      console.log("🔍 Full API response:", JSON.stringify(data, null, 2));
      console.log("🔍 Candidates array:", data.candidates);
      console.log("🔍 First candidate:", data.candidates?.[0]);
      
      // Check for API errors or safety issues
      if (data.candidates?.[0]?.finishReason === "SAFETY") {
        throw new Error("Content filtered by safety settings");
      }
      
      if (data.candidates?.[0]?.finishReason === "MAX_TOKENS") {
        throw new Error("Response truncated due to token limit - using fallback");
      }
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No candidates in API response");
      }
      
      const questionText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      console.log("🔍 Raw response text:", questionText);
      console.log("🔍 Response text length:", questionText.length);
      
      // If response is empty, throw error immediately
      if (!questionText || questionText.trim().length === 0) {
        throw new Error("Empty response from API");
      }
      
      // Extract JSON from the response - try multiple patterns
      let jsonString = "";
      let jsonMatch = questionText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      } else {
        // Try to find JSON within code blocks
        jsonMatch = questionText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        }
      }
      
      if (!jsonString) {
        // Try to find JSON between triple backticks
        jsonMatch = questionText.match(/```\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        }
      }
      
      if (!jsonString) {
        // Last attempt: try to find any content that starts with { and ends with }
        const lines = questionText.split('\n');
        let startIndex = -1;
        let endIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('{') && startIndex === -1) {
            startIndex = i;
          }
          if (lines[i].trim().endsWith('}') && startIndex !== -1) {
            endIndex = i;
            break;
          }
        }
        
        if (startIndex !== -1 && endIndex !== -1) {
          jsonString = lines.slice(startIndex, endIndex + 1).join('\n');
        }
      }
      
      if (!jsonString) {
        console.error("❌ No JSON found in response:", questionText);
        console.error("❌ Response appears to be:", typeof questionText);
        throw new Error("No valid JSON found in response");
      }

      console.log("🔍 Extracted JSON string:", jsonString);
      const questionData = JSON.parse(jsonString);
      
      console.log("✅ DSA question generated successfully");
      return questionData;
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
    
  } catch (error) {
    console.error("❌ Error generating DSA question:", error);
    
    // Enhanced fallback questions for variety
    const fallbackQuestions = [
      {
        question: "What is the time complexity of binary search on a sorted array?",
        options: {
          A: "O(1)",
          B: "O(log n)",
          C: "O(n)",
          D: "O(n²)"
        },
        correctAnswer: "B" as const,
        emoji_mapping: {
          A: "⚡",
          B: "📈", 
          C: "📏",
          D: "💥"
        }
      },
      {
        question: "Which data structure follows LIFO (Last In, First Out) principle?",
        options: {
          A: "Queue",
          B: "Array",
          C: "Stack",
          D: "Linked List"
        },
        correctAnswer: "C" as const,
        emoji_mapping: {
          A: "🚶",
          B: "📋",
          C: "📚",
          D: "🔗"
        }
      },
      {
        question: "What is the average time complexity of insertion in a hash table?",
        options: {
          A: "O(1)",
          B: "O(log n)",
          C: "O(n)",
          D: "O(n log n)"
        },
        correctAnswer: "A" as const,
        emoji_mapping: {
          A: "⚡",
          B: "📈",
          C: "📏",
          D: "🌊"
        }
      },
      {
        question: "Which sorting algorithm has the best average case time complexity?",
        options: {
          A: "Bubble Sort",
          B: "Quick Sort",
          C: "Selection Sort", 
          D: "Insertion Sort"
        },
        correctAnswer: "B" as const,
        emoji_mapping: {
          A: "🫧",
          B: "⚡",
          C: "🎯",
          D: "➡️"
        }
      },
      {
        question: "What is the space complexity of a recursive function that calls itself n times?",
        options: {
          A: "O(1)",
          B: "O(log n)",
          C: "O(n)",
          D: "O(n²)"
        },
        correctAnswer: "C" as const,
        emoji_mapping: {
          A: "📦",
          B: "📈",
          C: "📏",
          D: "💥"
        }
      }
    ];
    
    // Return a random fallback question
    const randomIndex = Math.floor(Math.random() * fallbackQuestions.length);
    console.log("🔄 Using fallback question", randomIndex + 1);
    return fallbackQuestions[randomIndex];
  }
}

// Facial expression to answer mapping
export const EXPRESSION_TO_ANSWER: { [key: string]: 'A' | 'B' | 'C' | 'D' } = {
  'happy': 'A',      // 😊 = A
  'surprised': 'B',   // 😮 = B  
  'neutral': 'C',     // 😐 = C
  'angry': 'D'        // 😠 = D
};

export const EXPRESSION_EMOJIS = {
  'happy': '😊',
  'surprised': '😮',
  'neutral': '😐', 
  'angry': '😠'
};