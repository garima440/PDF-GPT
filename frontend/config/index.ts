export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const BACKEND_ROUTES = {
  CHAT: `${API_URL}/chat`,
  UPLOAD: `${API_URL}/upload`,
  LIST: `${API_URL}/list`,
  DELETE: (filename: string) => `${API_URL}/delete/${filename}`,
  GENERATE_UPLOAD_URL: `${API_URL}/generate-upload-url`,
  PROCESS_UPLOAD: `${API_URL}/process-upload`,
}
