import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:8080/iceman/v1',
  timeout: 8000,
});
