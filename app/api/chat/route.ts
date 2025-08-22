// app/api/chat/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mixtral-8x7b', // ili 'openai/gpt-4', 'meta-llama/llama-3-70b-instruct', itd.
        messages: body.messages, // [{ role: 'user', content: '...'}, ...]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000', // ili domen tvoje aplikacije
          'X-Title': 'fin-app-hub', // naziv tvoje aplikacije
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to call OpenRouter API' }, { status: 500 });
  }
}
