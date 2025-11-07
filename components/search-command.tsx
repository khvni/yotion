"use client";

import { useEffect, useState } from "react";
import { File } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSearch as useSearchModal } from "@/hooks/useSearch";
import { useSearch } from "@/hooks/use-documents";

export const SearchCommand = () => {
  const { user } = useUser();
  const router = useRouter();
  const { documents } = useSearch();
  const [isMounted, setIsMounted] = useState(false);

  const toggle = useSearchModal((store) => store.toggle);
  const isOpen = useSearchModal((store) => store.isOpen);
  const onClose = useSearchModal((store) => store.onClose);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggle]);

  const onSelect = (id: number) => {
    router.push(`/documents/${id}`);
    onClose();
  };

  if (!isMounted) {
    return null;
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput placeholder={`Search ${user?.fullName}'s Yotion..`} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Documents">
          {documents?.map((document) => (
            <CommandItem
              key={document.id}
              value={document.id.toString()}
              title={document.title}
              onSelect={() => onSelect(document.id)}
            >
              {document.icon ? (
                <p className="mr-2 text-[1.125rem]">{document.icon ?? ""}</p>
              ) : (
                <File className="mr-2 h-4 w-4" />
              )}
              <span>{document.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
