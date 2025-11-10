"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

export interface Document {
  id: number;
  title: string;
  userId: string;
  content?: string | null;
  coverImage?: string | null;
  icon?: string | null;
  isArchived: boolean;
  isPublished: boolean;
  parentDocument?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Error types for better error handling
export enum ErrorType {
  NETWORK = "NETWORK",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE",
  SERVER_ERROR = "SERVER_ERROR",
  TIMEOUT = "TIMEOUT",
  UNKNOWN = "UNKNOWN",
}

export class APIError extends Error {
  type: ErrorType;
  statusCode?: number;

  constructor(message: string, type: ErrorType, statusCode?: number) {
    super(message);
    this.name = "APIError";
    this.type = type;
    this.statusCode = statusCode;
  }
}

// Helper function to detect error type
function getErrorType(error: any, statusCode?: number): ErrorType {
  // Check if it's a network error (offline or no connection)
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return ErrorType.NETWORK;
  }

  if (error instanceof TypeError && error.message.includes("fetch")) {
    return ErrorType.NETWORK;
  }

  if (error.name === "AbortError" || error.message?.includes("timeout")) {
    return ErrorType.TIMEOUT;
  }

  if (statusCode) {
    switch (statusCode) {
      case 404:
        return ErrorType.NOT_FOUND;
      case 401:
      case 403:
        return ErrorType.UNAUTHORIZED;
      case 413:
        return ErrorType.PAYLOAD_TOO_LARGE;
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorType.SERVER_ERROR;
      case 408:
        return ErrorType.TIMEOUT;
    }
  }

  return ErrorType.UNKNOWN;
}

// Helper function to get user-friendly error message
function getUserFriendlyMessage(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.NETWORK:
      return "Network error. Please check your connection and try again.";
    case ErrorType.NOT_FOUND:
      return "Document not found. It may have been deleted.";
    case ErrorType.UNAUTHORIZED:
      return "You don't have permission to perform this action.";
    case ErrorType.PAYLOAD_TOO_LARGE:
      return "The document is too large. Please reduce the content size.";
    case ErrorType.SERVER_ERROR:
      return "Server error. Please try again in a moment.";
    case ErrorType.TIMEOUT:
      return "Request timed out. Please try again.";
    default:
      return "Failed to save changes. Please try again.";
  }
}

// Helper function to handle API calls
async function fetchAPI(
  endpoint: string,
  options?: RequestInit
): Promise<any> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Request failed" }));
    const errorType = getErrorType(errorData, response.status);
    throw new APIError(
      errorData.error || "Request failed",
      errorType,
      response.status
    );
  }

  return response.json();
}

// Helper function to implement exponential backoff retry
async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof APIError) {
        // Don't retry on client errors (4xx except timeout)
        if (
          error.type === ErrorType.NOT_FOUND ||
          error.type === ErrorType.UNAUTHORIZED ||
          error.type === ErrorType.PAYLOAD_TOO_LARGE
        ) {
          console.error(`[API Error] Non-retryable error: ${error.type} - ${error.message}`);
          throw error;
        }
      }

      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        console.error(`[API Error] All ${maxRetries} retry attempts failed:`, error);
        throw error;
      }

      // Calculate delay with exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);

      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms...`);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error("Unknown error during retry");
}

// Hook to get sidebar documents (by parent)
export function useSidebarDocuments(parentDocument?: number) {
  const { user } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    // Use dev_user_123 when in dev bypass mode
    const userId = user?.id || (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' ? 'dev_user_123' : undefined);

    if (!userId) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ userId });
      if (parentDocument !== undefined) {
        params.append("parentDocument", parentDocument.toString());
      }
      const data = await fetchAPI(`/api/documents/sidebar?${params.toString()}`);
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch documents");
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, parentDocument]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, isLoading, error, refetch: fetchDocuments };
}

// Hook to get a single document
export function useDocument(documentId?: number) {
  const { user } = useUser();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = useCallback(async () => {
    if (!documentId) {
      setDocument(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      // Use dev_user_123 when in dev bypass mode
      const userId = user?.id || (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' ? 'dev_user_123' : undefined);
      const params = userId ? new URLSearchParams({ userId }) : "";
      const data = await fetchAPI(
        `/api/documents/${documentId}${params ? `?${params.toString()}` : ""}`
      );
      setDocument(data.document || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch document");
      setDocument(null);
    } finally {
      setIsLoading(false);
    }
  }, [documentId, user]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  return { document, isLoading, error, refetch: fetchDocument };
}

// Hook to get trash/archived documents
export function useTrash() {
  const { user } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrash = useCallback(async () => {
    // Use dev_user_123 when in dev bypass mode
    const userId = user?.id || (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' ? 'dev_user_123' : undefined);

    if (!userId) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ userId });
      const data = await fetchAPI(`/api/documents/trash?${params.toString()}`);
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trash");
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  return { documents, isLoading, error, refetch: fetchTrash };
}

// Hook to search documents
export function useSearch() {
  const { user } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSearchDocuments = useCallback(async () => {
    // Use dev_user_123 when in dev bypass mode
    const userId = user?.id || (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' ? 'dev_user_123' : undefined);

    if (!userId) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ userId });
      const data = await fetchAPI(`/api/documents/search?${params.toString()}`);
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search documents");
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSearchDocuments();
  }, [fetchSearchDocuments]);

  return { documents, isLoading, error, refetch: fetchSearchDocuments };
}

// Hook to create a document
export function useCreateDocument() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const createDocument = useCallback(
    async ({ title, parentDocument }: { title: string; parentDocument?: number }) => {
      // Use dev_user_123 when in dev bypass mode
      const userId = user?.id || (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' ? 'dev_user_123' : undefined);

      if (!userId) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      try {
        const data = await fetchAPI("/api/documents", {
          method: "POST",
          body: JSON.stringify({
            title,
            userId,
            parentDocument,
          }),
        });
        return data.document as Document;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return { createDocument, isLoading };
}

// Hook to update a document
export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useUpdateDocument() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const updateDocument = useCallback(
    async (
      documentId: number,
      updates: {
        title?: string;
        content?: string;
        coverImage?: string | null;
        icon?: string | null;
        isPublished?: boolean;
      }
    ) => {
      // Use dev_user_123 when in dev bypass mode
      const userId = user?.id || (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' ? 'dev_user_123' : undefined);
      if (!userId) {
        const authError = new APIError(
          "User not authenticated",
          ErrorType.UNAUTHORIZED
        );
        setError(getUserFriendlyMessage(ErrorType.UNAUTHORIZED));
        setSaveStatus("error");
        throw authError;
      }

      setIsLoading(true);
      setSaveStatus("saving");
      setError(null);

      try {
        // Wrap the fetch call with retry logic
        const data = await retryWithExponentialBackoff(
          () => fetchAPI(`/api/documents/${documentId}`, {
            method: "PUT",
            body: JSON.stringify({
              userId,
              ...updates,
            }),
          }),
          3, // maxRetries
          1000 // baseDelay (1 second)
        );

        setSaveStatus("saved");
        return data.document as Document;
      } catch (err) {
        setSaveStatus("error");

        // Get user-friendly error message
        let errorMessage: string;
        if (err instanceof APIError) {
          errorMessage = getUserFriendlyMessage(err.type);
          console.error(`[Save Error] ${err.type} (${err.statusCode}):`, err.message);
        } else if (err instanceof Error) {
          errorMessage = err.message;
          console.error("[Save Error]:", err);
        } else {
          errorMessage = "Failed to save changes. Please try again.";
          console.error("[Save Error]: Unknown error", err);
        }

        setError(errorMessage);

        // Show toast notification for save failures
        toast.error("Failed to save", {
          description: errorMessage,
          duration: 5000,
        });

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return { updateDocument, isLoading, saveStatus, error };
}

// Hook to archive a document
export function useArchiveDocument() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const archiveDocument = useCallback(
    async (documentId: number) => {
      // Use dev_user_123 when in dev bypass mode
      const userId = user?.id || (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' ? 'dev_user_123' : undefined);

      if (!userId) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      try {
        const data = await fetchAPI(`/api/documents/${documentId}/archive`, {
          method: "POST",
          body: JSON.stringify({ userId }),
        });
        return data.document as Document;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return { archiveDocument, isLoading };
}

// Hook to restore a document
export function useRestoreDocument() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const restoreDocument = useCallback(
    async (documentId: number) => {
      // Use dev_user_123 when in dev bypass mode
      const userId = user?.id || (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' ? 'dev_user_123' : undefined);

      if (!userId) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      try {
        const data = await fetchAPI(`/api/documents/${documentId}/restore`, {
          method: "POST",
          body: JSON.stringify({ userId }),
        });
        return data.document as Document;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return { restoreDocument, isLoading };
}

// Hook to delete a document
export function useDeleteDocument() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const deleteDocument = useCallback(
    async (documentId: number) => {
      // Use dev_user_123 when in dev bypass mode
      const userId = user?.id || (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' ? 'dev_user_123' : undefined);

      if (!userId) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({ userId });
        await fetchAPI(`/api/documents/${documentId}?${params.toString()}`, {
          method: "DELETE",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return { deleteDocument, isLoading };
}
