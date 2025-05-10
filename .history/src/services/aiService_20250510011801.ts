
/**
 * AI Code Generation Service
 * This service handles API requests for AI code generation
 */

interface GenerateCodeParams {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  language?: string;
}

interface GenerateCodeResponse {
  code: string;
  error?: string;
}

/**
 * Generates code using the specified AI API
 * Replace this implementation with your actual API integration
 */
export const generateCode = async (params: GenerateCodeParams): Promise<GenerateCodeResponse> => {
  // This is a placeholder for the actual API call
  try {
    const apiKey = localStorage.getItem("ai_api_key"); // Retrieve API key from local storage (for demo purposes)

    if (!apiKey) {
      return {
        code: "",
        error: "API key not configured. Please set your API key."
      };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01' // Specify the API version
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229', // Specify the Claude model you want to use
        max_tokens: params.maxTokens || 1024,
        temperature: params.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: params.prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status} - ${errorData.error.message}`);
    }

    const data = await response.json();
    // Assuming the response structure includes a 'content' array with 'text'
    const generatedText = data.content.map((block: any) => block.text).join('');

    return { code: generatedText };

  } catch (error: any) {
    console.error("Error generating code:", error);
    return {
      code: "",
      error: `Failed to generate code: ${error.message}`
    };
  }
};

/**
 * Utility function to set up the API key
 * In a real application, this would securely store or validate the API key
 */
export const configureApiKey = (apiKey: string): boolean => {
  // In a real implementation, this would store the API key securely
  // or validate it against the API provider
  
  // For now, we'll just return true to indicate success
  if (!apiKey || apiKey.trim() === "") {
    return false;
  }
  
  // Store the API key in local storage (for demo purposes only)
  // In a production environment, consider more secure storage options
  localStorage.setItem("ai_api_key", apiKey);
  return true;
};

/**
 * Checks if an API key is configured
 */
export const hasApiKey = (): boolean => {
  const apiKey = localStorage.getItem("ai_api_key");
  return !!apiKey && apiKey.trim() !== "";
};
