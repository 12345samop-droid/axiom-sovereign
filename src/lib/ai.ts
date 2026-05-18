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

export async function callSocraticAI(messages: Message[], apiKey?: string) {
  try {
    const systemInstruction = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const finalMessages = [
      { role: 'system', content: `${SOCRATIC_SYSTEM_PROMPT}\n\nCURRENT CONTEXT:\n${systemInstruction}` },
      ...userMessages
    ];

    // Call our internal API proxy instead of NVIDIA directly
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: finalMessages,
        apiKey: apiKey // Optional client-side override
      })
    }).catch(err => {
      throw new Error(`Connection Error: ${err.message}. Ensure you are deploying to a platform that supports Next.js API routes (like Vercel).`);
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error (${response.status})`);
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI service');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Error:', error);
    throw error;
  }
}
