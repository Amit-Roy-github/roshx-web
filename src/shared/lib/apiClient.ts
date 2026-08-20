import axios from 'axios';
import { environment } from '@/shared/lib/env';

/** The single axios instance this app talks to the roshx API through. */
export const apiClient = axios.create({
    baseURL: environment.VITE_API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});
