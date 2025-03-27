import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

interface ContentGenerationParams {
  title: string;
  type: string;
  tone: string;
  instructions?: string;
  dataSources?: string[];
}

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export async function generateContent(params: ContentGenerationParams): Promise<string> {
  try {
    const { title, type, tone, instructions, dataSources } = params;

    // Prompt based on content type
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
        prompt += " Create concise, engaging posts for social media platforms with appropriate hashtags.";
        break;
      case "press release":
        prompt += " Format as a professional press release with headline, dateline, introduction, quotes, and contact information.";
        break;
      case "legal document":
        prompt += " Structure with formal legal language, including references to relevant laws and precedents.";
        break;
      default:
        prompt += " Ensure the content is well-structured, informative, and action-oriented.";
    }

    // Use a faster Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings
    });

    const systemPrompt = "You are an expert in content creation for human rights activism. You create professional, accurate, and impactful content that respects human dignity and promotes human rights principles.";
    
    const result = await model.generateContent([systemPrompt, prompt]);
    const response = result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error("Content generation failed");
    }

    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Content generation failed: ${errorMessage}`);
  }
}

export async function analyzeDocument(text: string): Promise<{
  topics: string[];
  sentiment: string;
  keyFindings: string[];
  suggestedActions: string[];
  entities: any[];
  legalReferences: any[];
  contradictions: any[];
}> {
  try {
    // Use Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings
    });

    const systemPrompt = "You are an expert in human rights analysis and international law. Analyze the document with precision and extract important information, focusing on both factual content and legal implications.";
    
    const userPrompt = `Analyze this human rights document comprehensively and provide:

1) Main topics (as array of strings)
2) Overall sentiment (as string: positive, negative, neutral, or mixed)
3) Key findings (as array of strings)
4) Recommended actions (as array of strings)
5) Important entities (as array of objects with 'name' and 'type' fields, where type can be person, organization, location, date, etc.)
6) Legal references (as array of objects with 'reference' and 'description' fields - include relevant human rights laws, conventions, treaties, or court decisions)
7) Contradictions (as array of objects with 'statement1', 'statement2', and 'explanation' fields - identify any conflicting testimonies or inconsistencies)

Answer in JSON format with the following fields:
'topics', 'sentiment', 'keyFindings', 'suggestedActions', 'entities', 'legalReferences', and 'contradictions'

Document to analyze:
${text}`;
    
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = result.response;
    const responseText = response.text();
    
    try {
      // Try to parse the response as JSON
      const analysisContent = JSON.parse(responseText);
      
      return {
        topics: analysisContent.topics || [],
        sentiment: analysisContent.sentiment || "neutral",
        keyFindings: analysisContent.keyFindings || [],
        suggestedActions: analysisContent.suggestedActions || [],
        entities: analysisContent.entities || [],
        legalReferences: analysisContent.legalReferences || [],
        contradictions: analysisContent.contradictions || []
      };
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      
      // Fallback: Try to extract structured information from text
      return {
        topics: ["Extraction failed"],
        sentiment: "neutral",
        keyFindings: ["JSON parsing failed, please try again"],
        suggestedActions: ["Retry request with more structured format"],
        entities: [],
        legalReferences: [],
        contradictions: []
      };
    }
  } catch (error) {
    console.error("Gemini analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Document analysis failed: ${errorMessage}`);
  }
}

// Advanced document analysis focused on pattern detection
export async function detectPatterns(documentIds: number[], documentTexts: string[]): Promise<{
  patternName: string;
  patternType: string;
  description: string;
  documentIds: number[];
  geographicScope: any;
  temporalTrends: any;
  relatedLaws?: string;
  recommendedActions?: string;
}> {
  try {
    // Use Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings
    });

    const systemPrompt = "You are an expert in human rights analysis specializing in detecting patterns of violations across multiple documents and regions. Identify systematic patterns with precision.";
    
    // Create a single combined text with document identifiers
    const combinedText = documentTexts.map((text, index) => 
      `DOCUMENT ${documentIds[index]}:\n${text}\n\n`
    ).join('');
    
    const userPrompt = `Analyze these human rights documents to identify systematic patterns:

${combinedText}

Based on the content of these documents, identify ONE significant pattern of human rights violations or issues.

Respond in JSON format with the following fields:
1) patternName (string): A concise name for the identified pattern
2) patternType (string): The type of pattern (e.g., 'violation', 'systemic issue', 'discrimination', 'state violence', etc.)
3) description (string): A thorough description of the pattern
4) documentIds (array of numbers): The document IDs where this pattern appears
5) geographicScope (object): Information about the geographic distribution of this pattern
6) temporalTrends (object): Information about how this pattern has evolved over time
7) relatedLaws (string): Applicable international human rights laws, conventions, or treaties
8) recommendedActions (string): Recommended actions for human rights defenders based on this pattern

Format the response as clean JSON without additional explanations. Use German language for the results since this is a tool for German-speaking human rights defenders.

Ensure your analysis is objective and based solely on the content of the provided documents.`;
    
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = result.response;
    const responseText = response.text();
    
    try {
      // Try to parse the response as JSON
      const patternContent = JSON.parse(responseText);
      
      return {
        patternName: patternContent.patternName || "Unnamed Pattern",
        patternType: patternContent.patternType || "Unknown",
        description: patternContent.description || "",
        documentIds: patternContent.documentIds || documentIds,
        geographicScope: patternContent.geographicScope || {},
        temporalTrends: patternContent.temporalTrends || {},
        relatedLaws: patternContent.relatedLaws || "",
        recommendedActions: patternContent.recommendedActions || ""
      };
    } catch (parseError) {
      console.error("Failed to parse Gemini pattern response as JSON:", parseError);
      
      // Fallback
      return {
        patternName: "Pattern Detection Failed",
        patternType: "Error",
        description: "Failed to parse AI response. Please try again with different documents.",
        documentIds: documentIds,
        geographicScope: {},
        temporalTrends: {},
        relatedLaws: "",
        recommendedActions: ""
      };
    }
  } catch (error) {
    console.error("Gemini pattern detection error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Pattern detection failed: ${errorMessage}`);
  }
}
