import axios from "axios";

const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gnc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Cola de requests que fallaron mientras se estaba renovando el token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Solo intentar renovar en 401 y si no es un reintento ya hecho
    if (err.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("gnc_refresh_token");

      // Sin refresh token: ir al login directamente
      if (!refreshToken) {
        localStorage.removeItem("gnc_token");
        localStorage.removeItem("gnc_user");
        if (window.location.pathname !== "/auth") window.location.href = "/auth";
        return Promise.reject(err);
      }

      // Si ya se está renovando, encolar esta request y esperar el resultado
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((e) => Promise.reject(e));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/auth/refresh`,
          { refreshToken }
        );
        const { token, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem("gnc_token", token);
        if (newRefreshToken) localStorage.setItem("gnc_refresh_token", newRefreshToken);

        // Avisar a todas las requests en cola que ya hay token nuevo
        processQueue(null, token);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // El refresh token también expiró o es inválido: sesión terminada
        processQueue(refreshError, null);
        localStorage.removeItem("gnc_token");
        localStorage.removeItem("gnc_refresh_token");
        localStorage.removeItem("gnc_user");
        if (window.location.pathname !== "/auth") window.location.href = "/auth";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export function formatApiError(detail) {
  if (detail == null) return "Algo salio mal. Intenta de nuevo.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  if (detail?.msg) return detail.msg;
  return String(detail);
}

export default api;
