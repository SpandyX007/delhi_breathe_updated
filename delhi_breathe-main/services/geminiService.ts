
import { GoogleGenAI } from "@google/genai";
import { PipelineSchema, Node } from "../types";
import { buildPipelinePrompt, sanitizeNodePositions } from "../utils/pipelineLogic";
import { generateChartData } from "../constants";

// --- SERVER-SIDE SIMULATION ---
// This file simulates what your Backend Service (Node.js/Python) would do.
// It directly accesses the Gemini SDK and performs data generation.

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client && process.env.API_KEY) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

// --- MOCK ENDPOINT: /api/v1/forecast ---
export const simulateForecastEndpoint = async (params: { fromDate: string; toDate: string }) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Calculate days difference roughly
  const start = new Date(params.fromDate).getTime();
  const end = new Date(params.toDate).getTime();
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 3600 * 24)));
  
  return generateChartData(days);
};

// --- MOCK ENDPOINT: /api/v1/ai/analyze ---
export const generateAnalysis = async (context: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API Key missing. Cannot generate analysis.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert environmental data scientist. 
      Analyze the following air quality context in markdown bullet points. 
      Be concise, professional, and focus on health risks and forecast trends.
      
      Context: ${context}`
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating analysis. Please try again.";
  }
};

// --- MOCK ENDPOINT: /api/v1/ai/chat ---
export const chatWithGemini = async (message: string, context: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API Key missing.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `System: You are an intelligent assistant in a pollution analysis dashboard called AeroAnalytica.
      Current App State/Context: ${context}
      
      User: ${message}`,
    });
    return response.text || "I couldn't process that.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Connection error.";
  }
};

// --- MOCK ENDPOINT: /api/v1/pipeline/generate ---
export const generateFeaturePipeline = async (prompt: string, existingNodes: Node[] = []): Promise<PipelineSchema | null> => {
  const ai = getClient();
  if (!ai) throw new Error("API Key missing");

  // 1. Construct the strictly structured prompt using the logic utility
  const systemInstruction = buildPipelinePrompt(existingNodes, prompt);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: { 
        responseMimeType: 'application/json',
        temperature: 0.1 // Very low temp for strict schema compliance
      },
      contents: systemInstruction
    });
    
    const text = response.text;
    if (!text) return null;
    
    const result = JSON.parse(text);
    
    // 2. Backend Validation Layer (Simplified)
    if (!result.nodes || !Array.isArray(result.nodes)) return null;
    
    // 3. Logic Layer: Sanitize positions to grid
    const sanitizedNodes = sanitizeNodePositions(result.nodes);

    return {
      ...result,
      nodes: sanitizedNodes,
      metadata: {
        ...result.metadata,
        generated_at: new Date().toISOString()
      }
    } as PipelineSchema;

  } catch (error) {
    console.error("Pipeline Gen Error:", error);
    return null;
  }
};
