import { NextResponse } from 'next/server';
import { resolveChat } from '@/lib/chat-service';
import type { ChatMessageInput } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const result = await resolveChat(messages as ChatMessageInput[]);

    return NextResponse.json({
      intent: result.intent,
      reply: result.reply,
      products: result.products,
      orders: result.orders,
      steps: result.steps,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
