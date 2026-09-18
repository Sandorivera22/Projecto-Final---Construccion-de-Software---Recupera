const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(
  /\/$/,
  ""
);

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest(path, { accessToken, ...options } = {}) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload?.error
        ? payload.error
        : `La solicitud falló con el estado ${response.status}.`;
    throw new ApiError(message, response.status, payload?.detalles);
  }

  return payload;
}

export { API_URL };
