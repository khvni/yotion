"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { SaveStatus } from "@/hooks/use-documents";
import { cn } from "@/lib/utils";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  error?: string | null;
}

export const SaveStatusIndicator = ({
  status,
  error,
}: SaveStatusIndicatorProps) => {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (status === "saved") {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (status === "idle" && !showSaved) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs transition-opacity duration-200",
        status === "error" ? "text-red-500" : "text-muted-foreground"
      )}
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {(status === "saved" || showSaved) && (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Error saving</span>
        </>
      )}
    </div>
  );
};
