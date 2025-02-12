export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const BACKEND_ROUTES = {
  CHAT: `${API_URL}/chat`,
  UPLOAD: `${API_URL}/upload`,
  LIST: `${API_URL}/list`,
  DELETE: (filename: string) => `${API_URL}/delete/${filename}`,
}
