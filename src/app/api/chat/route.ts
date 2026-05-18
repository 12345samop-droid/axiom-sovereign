import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, apiKey: clientApiKey } = await req.json();
    
    // Use the server-side environment variable or the client-side override
    const apiKey = (process.env.NVIDIA_API_KEY || clientApiKey || '').trim();

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing NVIDIA API Key. Please set NVIDIA_API_KEY on the server or provide it in settings.' }, { status: 401 });
    }

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages,
        temperature: 0.3,
        max_tokens: 1024,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: data.message || data.error?.message || `NVIDIA API error (${response.status})` 
      }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
