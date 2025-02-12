import { NextResponse } from 'next/server';
import { BACKEND_ROUTES } from '@/config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;
   

    const response = await fetch(BACKEND_ROUTES.CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: query }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: 'Failed to get response from server' },
      { status: 500 }
    );
  }
}