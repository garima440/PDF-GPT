// frontend/api/list/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://localhost:8000/list', {
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