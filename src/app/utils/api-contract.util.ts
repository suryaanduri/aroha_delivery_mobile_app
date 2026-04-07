import { HttpErrorResponse } from '@angular/common/http';

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  details?: unknown;
}

interface ApiSuccessResult<T> {
  data: T | undefined;
  message: string;
}

export function unwrapApiSuccess<T>(response: unknown, fallbackMessage = 'Request succeeded'): ApiSuccessResult<T> {
  if (!response || typeof response !== 'object') {
    return { data: undefined, message: fallbackMessage };
  }

  const envelope = response as Partial<ApiEnvelope<T>>;
  if (typeof envelope.success === 'boolean') {
    if (!envelope.success) {
      throw new Error(envelope.message || 'Request failed');
    }
    return {
      data: envelope.data,
      message: envelope.message || fallbackMessage,
    };
  }

  // Backward compatibility for endpoints that still return raw payloads.
  return { data: response as T, message: fallbackMessage };
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof HttpErrorResponse) {
    const payload = error.error;

    if (payload && typeof payload === 'object') {
      const envelope = payload as Partial<ApiEnvelope<unknown>>;
      if (typeof envelope.message === 'string' && envelope.message.trim().length > 0) {
        return envelope.message;
      }

      const genericMessage = (payload as { error?: string }).error;
      if (typeof genericMessage === 'string' && genericMessage.trim().length > 0) {
        return genericMessage;
      }
    }

    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}
