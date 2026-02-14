// [FILENAME: src/lib/api.ts]
// [PURPOSE: Fetch wrapper for backend API calls with auth headers]
// [DEPENDENCIES: none]
// [PHASE: Phase 1 - Scaffolding]

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions extends RequestInit {
    token?: string;
}

/**
 * Fetch wrapper that adds auth headers and handles common patterns.
 * @param path - API path (e.g., "/api/journal")
 * @param options - Fetch options + optional auth token
 */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { token, headers: customHeaders, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((customHeaders as Record<string, string>) || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(error.detail || `API error: ${response.status}`);
    }

    return response.json();
}
