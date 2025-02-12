import { NextResponse } from 'next/server';
import { BACKEND_ROUTES } from '@/config';

export const config = {
  runtime: 'edge'
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Forward to Python backend
    const response = await fetch(BACKEND_ROUTES.UPLOAD, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in upload route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}