import { NextResponse } from 'next/server';
import { resolveOrderQuery } from '@/lib/chat-service';
import type { ChatMessageInput } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const result = await resolveOrderQuery(messages as ChatMessageInput[]);

    return NextResponse.json({
      intent: result.intent,
      confidence: result.confidence,
      source: result.source,
      filters: result.filters,
      reply: result.reply,
      orders: result.orders,
    });
  } catch (error) {
    console.error('Error in order intent API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
