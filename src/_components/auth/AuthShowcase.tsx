
// src/_components/auth/AuthShowcase.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function AuthShowcase() {
  const { data: session } = useSession();

  return (
    <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20">
      <h3 className="text-2xl font-bold">Dashboard →</h3>
      <div className="text-lg">
        {session?.user ? (
          <div>
            <p>Welcome, {session.user.name}!</p>
            <p>Role: {session.user.role}</p>
            <button
              onClick={() => signOut()}
              className="mt-4 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            <p>Please sign in to access your dashboard.</p>
            <Link
              href="/auth/signin"
              className="mt-4 inline-block rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}