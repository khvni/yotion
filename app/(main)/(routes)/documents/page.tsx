"use client";

import Image from "next/image";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useCreateDocument } from "@/hooks/use-documents";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const DocumentsPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const { createDocument } = useCreateDocument();

  const onCreate = () => {
    const promise = createDocument({ title: "Untitled" }).then((document) =>
      router.push(`/documents/${document.id}`),
    );

    toast.promise(promise, {
      loading: "Creating a new note....",
      success: "New note created!",
      error: "Failed to create a new note.",
    });
  };

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <Image
        src="/empty.svg"
        alt="empty"
        height="300"
        width="300"
        priority
        className="h-auto dark:hidden"
      />
      <Image
        src="/empty-dark.svg"
        alt="empty"
        height="300"
        width="300"
        priority
        className="hidden h-auto dark:block"
      />
      <h2 className="text-lg font-medium">
        Welcome to {user?.firstName}&apos;s Yotion
      </h2>
      <Button onClick={onCreate}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Create a note
      </Button>
    </div>
  );
};
export default DocumentsPage;
