export const getApiErrorMessage = (error, fallback = 'Xatolik yuz berdi') => {
  const data = error?.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (Array.isArray(data) && data.length > 0) {
    return String(data[0]);
  }

  if (data && typeof data === 'object') {
    const directMessage =
      data.detail ||
      data.error ||
      data.message ||
      data.non_field_errors?.[0];

    if (typeof directMessage === 'string' && directMessage.trim()) {
      return directMessage;
    }

    const firstFieldError = Object.values(data).find((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return typeof value === 'string' && value.trim();
    });

    if (Array.isArray(firstFieldError) && firstFieldError.length > 0) {
      return String(firstFieldError[0]);
    }

    if (typeof firstFieldError === 'string' && firstFieldError.trim()) {
      return firstFieldError;
    }
  }

  return fallback;
};
