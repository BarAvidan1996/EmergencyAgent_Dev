import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
});

export const chatApi = {
  sendMessage: async (message: string, sessionId: string) => {
    const response = await api.post('/api/chat', { message, sessionId });
    return response.data;
  },

  generateTitle: async (question: string, answer: string) => {
    const response = await api.post('/api/generate-title', { question, answer });
    return response.data;
  }
};

export default api; 