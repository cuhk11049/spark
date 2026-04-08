import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { ApiEnvelope, ApiErrorShape } from '../types/api';

function resolveBaseUrl() {
  const directBaseUrl = import.meta.env.VITE_ICEMAN_API_BASE_URL?.trim();

  if (directBaseUrl) {
    return directBaseUrl.replace(/\/$/, '');
  }

  const host = import.meta.env.VITE_ICEMAN_HOST?.trim();

  if (host) {
    return `${host.replace(/\/$/, '')}/iceman/v1`;
  }

  return 'http://localhost:8080/iceman/v1';
}

export const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 8000,
});

type RequestOptions = AxiosRequestConfig & {
  userId: string;
};

export function normalizeApiError(error: unknown): ApiErrorShape {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiEnvelope<unknown>>;
    const responseData = axiosError.response?.data;

    return {
      code:
        typeof responseData?.code === 'number'
          ? responseData.code
          : (axiosError.response?.status ?? 50001),
      message: responseData?.message ?? axiosError.message ?? 'request failed',
    };
  }

  if (error && typeof error === 'object') {
    const maybeError = error as Partial<ApiErrorShape>;

    return {
      code: typeof maybeError.code === 'number' ? maybeError.code : 50001,
      message: maybeError.message ?? 'request failed',
    };
  }

  return {
    code: 50001,
    message: 'request failed',
  };
}

export async function requestApi<T>({ userId, headers, ...config }: RequestOptions): Promise<T> {
  try {
    const response = await apiClient.request<ApiEnvelope<T>>({
      ...config,
      headers: {
        ...headers,
        'X-User-Id': userId,
      },
    });

    const payload = response.data;

    if (typeof payload?.code === 'number' && payload.code !== 0) {
      throw {
        code: payload.code,
        message: payload.message,
      } satisfies ApiErrorShape;
    }

    return payload.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}
