# PDF Document Assistant

A Next.js and FastAPI application that allows users to upload PDF documents and chat with them using AI. The application uses OpenAI for document analysis and AWS S3 for document storage.

## Live Demo

Visit the live application: [PDF Document Assistant](https://pdf-gpt-alpha.vercel.app/)

### Live Demo Notes
- Frontend is hosted on Vercel
- Backend is hosted on Railways
- Known Issues:
  - File upload may timeout due to Vercel's serverless function limitations (10s timeout on hobby plan)
  - After successful upload, if not automatically redirected to chat interface:
    1. Refresh the page
    2. Click "Chat About Documents" on the home screen
    3. Your uploaded document will be available for chatting

## Local Development

### Prerequisites
- Docker Desktop installed and running
- Git installed
- Node.js and npm (for manual setup)
- Python 3.9+ (for manual setup)

### Quick Start with Docker

1. Clone the repository
```bash
git clone [repository-url]
cd [repository-name]
```

2. Set up environment variables:
   - Create `.env` in root directory:
   ```bash
   cp .env.example .env
   ```
   - Create `.env` in backend directory:
   ```bash
   cp backend/.env.example backend/.env
   ```

   Add these required environment variables to both files:
   ```
   OPENAI_API_KEY=
   PINECONE_API_KEY=
   PINECONE_ENVIRONMENT=
   PINECONE_INDEX=
   MONGO_URI=
   AWS_SECRET_ACCESS_KEY=
   AWS_ACCESS_KEY_ID=
   S3_BUCKET_NAME=
   AWS_REGION=
   ```

3. Run with Docker Compose
```bash
docker compose up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Manual Setup (Alternative)

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # For Unix/Mac
# OR
.\venv\Scripts\activate  # For Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Features

- PDF document upload and storage
- Real-time chat interface with uploaded documents
- Document context-aware responses / general responses
- Document management (upload, delete)
- Responsive design
- Secure file handling

## Tech Stack

### Frontend
- Next.js 13+
- TypeScript
- Tailwind CSS
- Lucide React Icons

### Backend
- FastAPI
- Python 3.9+
- OpenAI API
- AWS S3
- Uvicorn
- MongoDB
- Pinecone Vector Database

### Infrastructure
- Docker & Docker Compose
- Vercel (Frontend Hosting)
- Railway (Backend Hosting)
- AWS S3 (File Storage)

## Contributing

Feel free to open issues and pull requests for any improvements you want to add.

## License

This is a personal project created for educational purposes.
