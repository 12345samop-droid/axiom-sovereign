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

VISUAL HINT MECHANISM:
If the student is stuck for more than 2-3 turns on the same concept, you MUST trigger a Visual Hint.
Include a JSON command block to highlight a specific part of the simulation.

COMMAND SYSTEM:
End your response with a JSON block if you need to manipulate the engine or provide hints.
Example:
\`\`\`json
{ "type": "SET_VELOCITY", "value": { "x": 0, "y": 0, "z": 8 } }
\`\`\`
\`\`\`json
{ "type": "VISUAL_HINT", "target": "VELOCITY_VECTOR", "color": "#ff0000" }
\`\`\`

Available Commands:
- SET_VELOCITY: { x, y, z }
- SET_POSITION: { x, y, z }
- VISUAL_HINT: { target: "VELOCITY_VECTOR" | "GRAVITY_VECTOR" | "EARTH", color: string }

CURRICULUM:
1. Falling vs. Orbiting (Tangent velocity).
2. The relation between Speed and Altitude.
3. Circular vs. Elliptical orbits.

TONE:
Expert, OLED-dark aesthetic in words, cinematic, and profoundly patient.
`;

export async function callSocraticAI(messages: Message[], apiKey: string) {
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { role: 'system', content: SOCRATIC_SYSTEM_PROMPT },
          ...messages
        ],
        temperature: 0.3,
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to call NVIDIA NIM');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Error:', error);
    throw error;
  }
}
