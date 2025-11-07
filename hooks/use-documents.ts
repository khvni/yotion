"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";

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
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// Hook to get sidebar documents (by parent)
export function useSidebarDocuments(parentDocument?: number) {
  const { user } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!user) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ userId: user.id });
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
      const params = user ? new URLSearchParams({ userId: user.id }) : "";
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
    if (!user) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ userId: user.id });
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
    if (!user) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ userId: user.id });
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
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      try {
        const data = await fetchAPI("/api/documents", {
          method: "POST",
          body: JSON.stringify({
            title,
            userId: user.id,
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
export function useUpdateDocument() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

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
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      try {
        const data = await fetchAPI(`/api/documents/${documentId}`, {
          method: "PUT",
          body: JSON.stringify({
            userId: user.id,
            ...updates,
          }),
        });
        return data.document as Document;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return { updateDocument, isLoading };
}

// Hook to archive a document
export function useArchiveDocument() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const archiveDocument = useCallback(
    async (documentId: number) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      try {
        const data = await fetchAPI(`/api/documents/${documentId}/archive`, {
          method: "POST",
          body: JSON.stringify({ userId: user.id }),
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
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      try {
        const data = await fetchAPI(`/api/documents/${documentId}/restore`, {
          method: "POST",
          body: JSON.stringify({ userId: user.id }),
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
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({ userId: user.id });
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
