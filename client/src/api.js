const API_URL = "http://localhost:3001/api";

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  let body = null;

  if (response.status !== 204) {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      body = await response.json();
    } else {
      body = await response.text();
    }
  }

  if (!response.ok) {
    const error = new Error(
      body?.error || `Request failed with status ${response.status}.`,
    );

    error.status = response.status;
    throw error;
  }

  return body;
}

export function login(username, password) {
  return apiRequest("/sessions", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
    }),
  });
}

export function logout() {
  return apiRequest("/sessions/current", {
    method: "DELETE",
  });
}

export function getCurrentUser() {
  return apiRequest("/sessions/current");
}

export function getNetwork() {
  return apiRequest("/network");
}

export function getRankings() {
  return apiRequest("/rankings");
}

export function createGame() {
  return apiRequest("/games", {
    method: "POST",
  });
}

export function submitRoute(gameId, segmentIds) {
  return apiRequest(`/games/${gameId}/route`, {
    method: "POST",
    body: JSON.stringify({
      segmentIds,
    }),
  });
}

export function revealNextStep(gameId) {
  return apiRequest(`/games/${gameId}/next-step`, {
    method: "POST",
  });
}