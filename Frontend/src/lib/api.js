import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

// 401 callback, registered by store.js to avoid circular import
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

// Unwrap { success, data, ... } -> returns full body (services pick fields)
export const unwrap = (res) => res.data;

// Download a blob (used for payslip PDF)
export const downloadBlob = async (url, filename) => {
  const res = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export default api;
