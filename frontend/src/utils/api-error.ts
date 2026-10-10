export function getApiErrorMessage(error: any, fallback: string) {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim()) return message;

  const errorText = error?.response?.data?.error;
  if (typeof errorText === 'string' && errorText.trim()) return errorText;

  if (error?.response?.status) {
    return `${fallback} (HTTP ${error.response.status})`;
  }

  if (error?.message) return `${fallback}: ${error.message}`;

  return fallback;
}
