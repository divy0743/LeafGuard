/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Disease detection response from CNN model
 */
export interface DiseaseDetectionResponse {
  disease: string;
  confidence: number;
  recommendations: string[];
}
