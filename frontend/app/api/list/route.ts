// frontend/api/list/route.ts
import { NextResponse } from 'next/server';
import { BACKEND_ROUTES } from '@/config';

export async function GET() {
  try {
    const response = await fetch(BACKEND_ROUTES.LIST, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Backend Response:', data); // Debug log

    // Ensure we always return an array of documents, even if empty
    return NextResponse.json({ 
      documents: data.documents || [] 
    });
  } catch (error) {
    console.error('Error in list route:', error);
    return NextResponse.json(
      { documents: [] },
      { status: 200 } // Return empty array instead of error for empty bucket
    );
  }
}