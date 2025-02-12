import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_ROUTES } from '@/config';

type DeleteParams = {
  params: {
    filename: string;
  };
};

export async function DELETE(
  req: NextRequest,
  context: { params: DeleteParams["params"] }
) {
  const { filename } = await context.params; 

  if (!filename) {
    return NextResponse.json(
      { error: 'Filename is required' },
      { status: 400 }
    );
  }

  try {
    // Convert the filename back from URL-safe format
    const decodedFilename = decodeURIComponent(filename);

    // Make the delete request to your backend
    const backendResponse = await fetch(
      BACKEND_ROUTES.DELETE(decodedFilename),
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Get the response data
    const responseData = await backendResponse.json();

    // If the backend request wasn't successful, return the error
    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: responseData.detail || 'Failed to delete document' },
        { status: backendResponse.status }
      );
    }

    // Return success response
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
