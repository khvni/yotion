"use client";

import { Spinner } from "@/components/spinner";
import { useAuth } from "@clerk/clerk-react";
import { redirect } from "next/navigation";
import Navigation from "./_components/Navigation";
import { SearchCommand } from "@/components/search-command";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const isAuthenticated = isSignedIn;
  const isLoading = !isLoaded;

  // Dev mode bypass
  const isDev = process.env.NODE_ENV === 'development';
  const devBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

  if (isLoading && !devBypass) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (!isAuthenticated && !(isDev && devBypass)) {
    return redirect("/");
  }

  return (
    <div className="flex h-full dark:bg-[#1F1F1F]">
      <Navigation />
      <main className="h-full flex-1 overflow-y-auto">
        <SearchCommand />
        {children}
      </main>
    </div>
  );
};
export default MainLayout;
