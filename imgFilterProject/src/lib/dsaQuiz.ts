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

    const prompt = `Generate a DSA multiple choice question. Topics: arrays, trees, sorting, time complexity. Return ONLY this JSON format:
{
  "question": "What is the time complexity of...",
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
}`;

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
              maxOutputTokens: 500,
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
      const questionText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      console.log("🔍 Raw response text:", questionText);
      
      // Extract JSON from the response - try multiple patterns
      let jsonMatch = questionText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Try to find JSON within code blocks
        jsonMatch = questionText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        }
      }
      
      if (!jsonMatch) {
        // Try to find JSON between triple backticks
        jsonMatch = questionText.match(/```\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        }
      }
      
      if (!jsonMatch) {
        console.error("❌ No JSON found in response:", questionText);
        throw new Error("No valid JSON found in response");
      }

      const questionData = JSON.parse(jsonMatch[0]);
      
      console.log("✅ DSA question generated successfully");
      return questionData;
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
    
  } catch (error) {
    console.error("❌ Error generating DSA question:", error);
    
    // Multiple fallback questions for variety
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