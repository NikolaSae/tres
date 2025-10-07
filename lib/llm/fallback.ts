// lib/llm/fallback.ts
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function callOnlineLLM(query: string): Promise<string> {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: query }],
  });

  return res.choices[0].message?.content || 'Nema odgovora od LLM.';
}
