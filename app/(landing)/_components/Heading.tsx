"use client";

import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { SignInButton, useAuth } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const Heading = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const isAuthenticated = isSignedIn;
  const isLoading = !isLoaded;

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold sm:text-5xl md:text-5xl">
        Your Ideas💡, Documents📕, & Plans🚀. Welcome to{" "}
        <span className="underline">Yotion</span>
      </h1>
      <h2 className="text-base font-medium sm:text-xl">
        Yotion is the connected workspace where <br /> better, faster work
        happens.
      </h2>
      <h3 className="text-sm text-muted-foreground sm:text-base italic">
        Open source + AI is an unbeatable duo. Incredible how polished something can look right out of the box with just an hour to tinker.
      </h3>
      {isLoading && (
        <div className="flex w-full items-center justify-center">
          <Spinner size="md" />
        </div>
      )}
      {isAuthenticated && !isLoading && (
        <Button asChild>
          <Link href="/documents">
            Enter Yotion
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
      {!isAuthenticated && !isLoading && (
        <SignInButton mode="modal">
          <Button>
            Get Yotion free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </SignInButton>
      )}
    </div>
  );
};
