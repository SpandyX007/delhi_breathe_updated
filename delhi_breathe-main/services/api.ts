
import { PipelineSchema, Node, ChatMessage } from "../types";
import * as MockBackend from "./geminiService";

/**
 * API SERVICE DOCUMENTATION
 * 
 * This file acts as the client-side API layer. 
 * In a production environment, these functions would perform `fetch` or `axios` calls 
 * to your Python/Node.js backend.
 * 
 * Currently, it calls `MockBackend` which runs the logic (and Gemini calls) client-side 
 * to maintain functionality in this preview environment.
 */

const API_BASE_URL = '/api/v1'; // Example base URL

// --- 1. FORECASTING ENDPOINTS ---

/**
 * Fetches time-series data for the dashboard charts.
 * @param params Filters for date range, granularity, etc.
 */
export const fetchForecastData = async (params: {
  fromDate: string;
  toDate: string;
  granularity: string;
  sites: number[];
}) => {
  // PRODUCTION (Local running backend):
  try {
    const queryParams = new URLSearchParams({
      start_date: params.fromDate,
      end_date: params.toDate,
    });

    // Append sites individually
    params.sites.forEach(id => queryParams.append('sites', id.toString()));

    const response = await fetch(`http://127.0.0.1:8000/api/v1/forecast?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch from backend, falling back to mock temporarily for stability if needed, or throwing.", error);
    // Fallback or throw? Let's throw so user sees it works (or fails if backend not running)
    throw error;
  }
};

// --- 2. GENERATIVE AI ENDPOINTS ---

/**
 * Sends context to the backend to generate a text summary/analysis.
 */
export const fetchAnalysis = async (context: string): Promise<string> => {
  // PRODUCTION:
  // const response = await fetch(`${API_BASE_URL}/ai/analyze`, { method: 'POST', body: JSON.stringify({ context }) });
  // const data = await response.json();
  // return data.analysis;

  // MOCK:
  return MockBackend.generateAnalysis(context);
};

/**
 * Sends a chat message and context to the backend LLM agent.
 */
export const fetchChatResponse = async (message: string, context: string): Promise<string> => {
  // PRODUCTION:
  // const response = await fetch(`${API_BASE_URL}/ai/chat`, { method: 'POST', body: JSON.stringify({ message, context }) });
  // return response.json();

  // MOCK:
  return MockBackend.chatWithGemini(message, context);
};

// --- 3. PIPELINE ARCHITECTURE ENDPOINTS ---

/**
 * Sends the user prompt and current graph state to the backend.
 * The backend constructs the prompt, calls Gemini, validates the schema, and returns the plan.
 */
export const fetchPipelinePlan = async (prompt: string, currentNodes: Node[]): Promise<PipelineSchema | null> => {
  // PRODUCTION:
  // const response = await fetch(`${API_BASE_URL}/pipeline/generate`, { 
  //   method: 'POST', 
  //   body: JSON.stringify({ prompt, currentNodes }) 
  // });
  // return response.json();

  // MOCK:
  return MockBackend.generateFeaturePipeline(prompt, currentNodes);
};

// --- 4. FEATURE EXTRACTION ENDPOINTS ---

export const uploadDatasetFeatures = async (file: File): Promise<PipelineSchema> => {
  // PRODUCTION (Local running backend):
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://127.0.0.1:8000/api/v1/features/upload', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Upload failed");
  }
  return await response.json();
};
