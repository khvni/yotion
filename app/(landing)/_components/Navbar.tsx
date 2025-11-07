"use client";

import { useScrollTop } from "@/hooks/useScrollTop";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuth, SignInButton, UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import Link from "next/link";

export const Navbar = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const isAuthenticated = isSignedIn;
  const isLoading = !isLoaded;
  const scrolled = useScrollTop();

  return (
    <nav
      className={cn(
        "sticky inset-x-0 top-0 z-50 mx-auto flex w-full items-center bg-background p-6 dark:bg-[#1F1F1F]",
        scrolled && "border-b shadow-sm",
      )}
    >
      <Logo />
      <div className="flex w-full items-center justify-end md:ml-auto">
        <div className="flex items-center gap-x-2">
          {isLoading && <Spinner />}
          {!isLoading && !isAuthenticated && (
            <>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button size="sm">Get Yotion Free</Button>
              </SignInButton>
            </>
          )}

          {isAuthenticated && !isLoading && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/documents"> Enter Yotion </Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
};
