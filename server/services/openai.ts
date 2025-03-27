import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder-key" 
});

interface ContentGenerationParams {
  title: string;
  type: string;
  tone: string;
  instructions?: string;
  dataSources?: string[];
}

export async function generateContent(params: ContentGenerationParams): Promise<string> {
  try {
    const { title, type, tone, instructions, dataSources } = params;

    // Prepare the prompt based on content type
    let prompt = `Generate a ${tone} ${type} with the title "${title}".`;
    
    if (dataSources && dataSources.length > 0) {
      prompt += ` Use the following data sources as reference: ${dataSources.join(", ")}.`;
    }
    
    if (instructions) {
      prompt += ` Additional instructions: ${instructions}`;
    }

    // Create content based on type
    switch (type.toLowerCase()) {
      case "report":
        prompt += " Include an executive summary, key findings, methodology, analysis, and recommendations.";
        break;
      case "social media":
        prompt += " Create concise, engaging posts suitable for social media platforms with appropriate hashtags.";
        break;
      case "press release":
        prompt += " Format as a professional press release with headline, dateline, introduction, quotes, and contact information.";
        break;
      case "legal document":
        prompt += " Structure with formal legal language, including references to relevant laws and precedents.";
        break;
      default:
        prompt += " Ensure the content is well-structured, informative, and actionable.";
    }

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert content creator for human rights advocacy. You create professional, accurate, and impactful content that respects human dignity and promotes human rights principles."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
    });

    const generatedContent = response.choices[0].message.content;
    
    if (!generatedContent) {
      throw new Error("Failed to generate content");
    }

    return generatedContent;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

export async function analyzeDocument(text: string): Promise<{
  topics: string[];
  sentiment: string;
  keyFindings: string[];
  suggestedActions: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in human rights analysis. Analyze the document and extract key information."
        },
        {
          role: "user",
          content: `Analyze this document and provide: 1) Main topics (as an array), 2) Overall sentiment, 3) Key findings (as an array), 4) Suggested actions (as an array).\n\n${text}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const analysisContent = JSON.parse(response.choices[0].message.content);
    
    return {
      topics: analysisContent.topics || [],
      sentiment: analysisContent.sentiment || "neutral",
      keyFindings: analysisContent.keyFindings || [],
      suggestedActions: analysisContent.suggestedActions || []
    };
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error(`Failed to analyze document: ${error.message}`);
  }
}
