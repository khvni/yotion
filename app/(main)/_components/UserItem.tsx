"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton, useUser } from "@clerk/clerk-react";
import { ChevronsLeftRight } from "lucide-react";

export const UserItem = () => {
  const { user } = useUser();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

  // In dev bypass mode, show a default user
  const displayName = user?.fullName || (isDevMode ? "Dev User" : "Guest");
  const displayEmail = user?.emailAddresses?.[0]?.emailAddress || (isDevMode ? "dev_user_123@dev.local" : "");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div
          role="button"
          className="flex w-full items-center p-3 text-sm hover:bg-primary/5"
        >
          <div className="flex max-w-[9.375rem] items-center gap-x-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={user?.imageUrl} />
            </Avatar>
            <span className="line-clamp-1 text-start font-medium">
              {displayName}&apos;s Yotion
            </span>
          </div>
          <ChevronsLeftRight className="ml-2 h-4 w-4 rotate-90 text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80"
        align="start"
        alignOffset={11}
        forceMount
      >
        <div className="flex flex-col space-y-4 p-2">
          <p className="text-xs font-medium leading-none text-muted-foreground">
            {displayEmail}
          </p>
          <div className="flex items-center gap-x-2">
            <div className="rounded-md bg-secondary p-1">
              <Avatar>
                <AvatarImage src={user?.imageUrl} />
              </Avatar>
            </div>
            <div className="space-y-1">
              <p className="line-clamp-1 text-sm">
                {displayName}&apos;s Yotion
              </p>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="w-full cursor-pointer text-muted-foreground">
          {isDevMode && !user ? (
            <span>Dev Mode Active</span>
          ) : (
            <SignOutButton>Log Out</SignOutButton>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
