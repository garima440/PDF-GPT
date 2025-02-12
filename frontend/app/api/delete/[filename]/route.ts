import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_ROUTES } from '@/config';

type DeleteParams = { filename: string };

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<DeleteParams> }
): Promise<NextResponse> {
  const { filename } = await params;

  if (!filename) {
    return NextResponse.json(
      { error: 'Filename is required' },
      { status: 400 }
    );
  }

  try {
    const decodedFilename = decodeURIComponent(filename);

    const backendResponse = await fetch(
      BACKEND_ROUTES.DELETE(decodedFilename),
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: responseData.detail || 'Failed to delete document' },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${decodedFilename}`
    });

  } catch (error) {
    console.error('Error in delete route:', error);
    return NextResponse.json(
      { error: 'Internal server error during deletion' },
      { status: 500 }
    );
  }
}
