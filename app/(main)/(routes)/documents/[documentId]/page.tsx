"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";

import { Cover } from "@/components/cover";
import { Toolbar } from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveStatusIndicator } from "@/components/save-status";

import { useDocument, useUpdateDocument } from "@/hooks/use-documents";

interface DocumentIdPageProps {
  params: {
    documentId: string;
  };
}

const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const Editor = useMemo(
    () => dynamic(() => import("@/components/editor"), { ssr: false }),
    [],
  );

  const documentId = parseInt(params.documentId);
  const { document, isLoading } = useDocument(documentId);
  const { updateDocument, saveStatus, error } = useUpdateDocument();

  // Debounced save to prevent race conditions
  // The API call is debounced by 300ms to batch rapid changes
  // This prevents multiple simultaneous saves when typing quickly
  const onChange = useDebouncedCallback(
    (content: string) => {
      updateDocument(documentId, { content }).catch(() => {
        // Error is already handled by useUpdateDocument hook
        // which shows a toast notification and sets error state
      });
    },
    300,
    { maxWait: 2000 } // Force save after 2 seconds max to ensure changes aren't lost
  );

  if (isLoading) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="mx-auto mt-10 md:max-w-3xl lg:max-w-4xl">
          <div className="space-y-4 pl-8 pt-4">
            <Skeleton className="h-14 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      </div>
    );
  }

  if (document === null) {
    return <div>Not found</div>;
  }

  return (
    <div className="pb-40">
      <Cover url={document.coverImage ?? undefined} />
      <div className="mx-auto md:max-w-3xl lg:max-w-4xl">
        <div className="relative">
          <div className="absolute right-12 top-6 z-10">
            <SaveStatusIndicator status={saveStatus} error={error} />
          </div>
          <Toolbar initialData={document} />
        </div>
        <Editor onChange={onChange} initialContent={document.content ?? undefined} />
      </div>
    </div>
  );
};
export default DocumentIdPage;
