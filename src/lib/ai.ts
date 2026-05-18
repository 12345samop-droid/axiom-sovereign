"use client"

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const SOCRATIC_SYSTEM_PROMPT = `
You are the Axiom-Sovereign Socratic Tutor, an elite scientist with the tone of a documentary narrator (Veritasium/3Blue1Brown style). 

GOAL: Guide the student through Orbital Mechanics using the T+1 Rule.

T+1 RULE:
1. Identify the single next conceptual hurdle (T+1).
2. NEVER give the answer or formula.
3. Use hints, analogies, and questions.

COMMAND SYSTEM:
End your response with a JSON block if you need to manipulate the engine or provide hints.
Example:
\`\`\`json
{ "type": "SET_VELOCITY", "value": { "x": 0, "y": 0, "z": 8 } }
\`\`\`

Available Commands:
- SET_VELOCITY: { x, y, z }
- SET_POSITION: { x, y, z }
- VISUAL_HINT: { target: "VELOCITY_VECTOR" | "GRAVITY_VECTOR" | "EARTH", color: string }

TONE:
Expert, cinematic, and patient.
`;

export async function callSocraticAI(messages: Message[], apiKey: string) {
  try {
    const cleanKey = apiKey.trim();
    
    // Check if the key format looks correct
    if (!cleanKey.startsWith('nvapi-')) {
       throw new Error("Invalid API Key format. Key must start with 'nvapi-'.");
    }

    const systemInstruction = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const finalMessages = [
      { role: 'system', content: `${SOCRATIC_SYSTEM_PROMPT}\n\nCURRENT CONTEXT:\n${systemInstruction}` },
      ...userMessages
    ];

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages: finalMessages,
        temperature: 0.3,
        max_tokens: 1024,
      })
    }).catch(err => {
      // Specifically handle network/CORS errors which often result in "Failed to fetch"
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error("Network Error: Could not connect to NVIDIA API. This is usually caused by an invalid API key, lack of credits, or the NVIDIA endpoint blocking the request from the browser (CORS). Please check your browser console for details.");
      }
      throw err;
    });

    if (!response.ok) {
      let errorDetail = 'Unknown Error';
      try {
        const errorData = await response.json();
        errorDetail = errorData.message || errorData.error?.message || JSON.stringify(errorData);
      } catch (_e) {
        errorDetail = `Status: ${response.status} ${response.statusText}`;
      }
      throw new Error(`NVIDIA NIM Error: ${errorDetail}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI service');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Error:', error);
    throw error;
  }
}
