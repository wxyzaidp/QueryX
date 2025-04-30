import endent from 'endent';
import { AIModel } from '@/types/types';

const createPrompt = (inputCode: string) => {
  const data = (inputCode: string) => {
    return endent`${inputCode}`;
  };

  if (inputCode) {
    return data(inputCode);
  }
};

// Renamed from OpenAIStream to GeminiStream to reflect the change
export const OpenAIStream = async (
  inputCode: string,
  model: string,
  key: string | undefined,
) => {
  const prompt = createPrompt(inputCode);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Get the correct model name for the API URL
  const modelName = model || 'gemini-1.0-pro';
  
  // Explicitly build the URL with the correct format for the Gemini API
  // Format from docs example: https://generativelanguage.googleapis.com/v1beta/models/[model]:streamGenerateContent
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  const apiUrl = `${baseUrl}/${modelName}:streamGenerateContent`;
  const apiKey = key || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("No API key provided");
  }
  
  try {
    console.log('Making API stream request to:', apiUrl);
    const res = await fetch(`${apiUrl}?key=${apiKey}&alt=sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!res.ok) {
    const statusText = res.statusText;
      const errorData = await res.text();
      console.error('API Stream Response Error:', errorData || statusText);
    throw new Error(
        `Gemini API stream returned an error: ${errorData || statusText}`,
    );
    }

    if (!res.body) {
      throw new Error('Response body is null, expected a stream.');
  }

    const stream = res.body;
    
    const modifiedStream = new ReadableStream({
    async start(controller) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              if (buffer) {
                try {
                  const data = JSON.parse(buffer);
                  console.log('Parsed final backend JSON chunk:', JSON.stringify(data, null, 2));
                  if (data.candidates && data.candidates[0]?.content?.parts) {
                    const parts = data.candidates[0].content.parts;
                    for (const part of parts) {
                      if (part.text) {
                        console.log('Extracted final text part:', part.text);
                        controller.enqueue(encoder.encode(part.text));
                      }
                    }
                  }
                } catch (jsonError) {
                  console.error('Error parsing final JSON data:', jsonError, 'Data:', buffer);
                }
              }
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim().startsWith('data:')) {
                const jsonData = line.trim().substring(5).trim();
                if (jsonData && jsonData !== '[DONE]') {
                  try {
                    const data = JSON.parse(jsonData);
                    console.log('Parsed backend JSON chunk:', JSON.stringify(data, null, 2));
                    if (data.candidates && data.candidates[0]?.content?.parts) {
                      const parts = data.candidates[0].content.parts;
                      for (const part of parts) {
                        if (part.text) {
                          console.log('Extracted text part:', part.text);
                          controller.enqueue(encoder.encode(part.text));
                        } else {
                          console.log('Found part without text:', JSON.stringify(part, null, 2));
                        }
                      }
                    } else {
                      console.log('Parsed JSON chunk missing expected structure');
                    }
                  } catch (jsonError) {
                    console.error('Error parsing JSON data:', jsonError, 'Data:', jsonData);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Stream reading error:', e);
            controller.error(e);
        } finally {
          controller.close();
        }
      }
    });

    return modifiedStream;

  } catch (error) {
    console.error('API stream request error:', error);
    throw error;
  }
};

export async function* chatStream(
  inputCode: string,
  model: AIModel,
  apiKey?: string,
): AsyncGenerator<string> {
  try {
    // The endpoint URL should use the model name directly, including "models/"
    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    const url = `${baseUrl}/${model}:generateContent`;
    
    // Get API key from environment or parameter
    const key = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!key) {
      throw new Error('Google API key is missing');
    }
    
    console.log('Making API request to:', url);

    const response = await fetch(`${url}?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${inputCode}\n\nPlease tell me what this code does and suggest any improvements.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Response Error:', JSON.stringify(errorData));
      throw new Error(`Gemini API returned an error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      yield data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Unexpected response format from Gemini API');
      }
  } catch (error) {
    console.error('Error in chatStream:', error);
    yield `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
