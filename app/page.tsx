"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import { Editor } from "@/components/editor/Editor";

export default function Home() {
  const { setBlocks } = useEditorStore();

  useEffect(() => {
    // Fetch blocks on mount
    fetch("/api/blocks")
      .then((res) => res.json())
      .then((data) => setBlocks(data.blocks))
      .catch((error) => console.error("Failed to load blocks:", error));
  }, [setBlocks]);

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Editor />
      </div>
    </main>
  );
}
