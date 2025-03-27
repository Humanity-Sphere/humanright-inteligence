// Simple Gemini API test
import { GoogleGenerativeAI } from "@google/generative-ai";

// Make sure API key is properly set
console.log("API Key present:", !!process.env.GEMINI_API_KEY);

async function testGeminiAPI() {
  try {
    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    
    // Use the simplest model configuration
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Simple text prompt
    const prompt = "Hello! Please respond with a short greeting.";
    
    console.log("Sending request to Gemini API...");
    const result = await model.generateContent(prompt);
    
    console.log("Response received from Gemini API");
    console.log("Response text:", result.response.text());
    
    return "Test completed successfully";
  } catch (error) {
    console.error("Gemini API test error:", error);
    return `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

testGeminiAPI()
  .then(result => console.log(result))
  .catch(err => console.error("Unexpected error:", err));
