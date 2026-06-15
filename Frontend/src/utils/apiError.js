const stringifyMessage = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(stringifyMessage).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return value.message || value.error || JSON.stringify(value);
  }
  return String(value);
};

// Normalize any axios/thunk error to a readable string
export const getApiError = (error) =>
  stringifyMessage(error?.response?.data?.message) ||
  stringifyMessage(error?.response?.data?.error) ||
  stringifyMessage(error?.message) ||
  "Something went wrong. Please try again.";
