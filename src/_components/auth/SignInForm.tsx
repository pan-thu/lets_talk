"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, useEffect } from "react";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"; // Default redirect to home
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Set initial error/success message based on query params
  useEffect(() => {
    if (error) {
      setFormError("Invalid email or password. Please try again.");
    }
    if (message === "signup_success") {
      setSuccessMessage("Registration successful! Please sign in.");
    }
  }, [error, message]);

  async function handleCredentialsSignIn(event: FormEvent) {
    event.preventDefault();
    setFormError(null); // Clear previous errors
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Handle redirect manually after checking result
        callbackUrl, // Pass intended redirect URL
      });



      if (result?.error) {
        // Error occurred (e.g., invalid credentials, user not found)
        setFormError("Invalid email or password.");
        console.error("Sign-in error:", result.error);
      } else if (result?.ok && result?.url) {
        // Sign-in successful, redirect using the URL provided by NextAuth
        // which includes the callbackUrl or default
        router.push(result.url);
        router.refresh(); // Refresh server components after login
      } else if (result?.ok && !result.url) {
        // Signed in successfully, but no redirect URL? Go to callbackUrl
        router.push(callbackUrl);
        router.refresh();
      } else {
        // Handle unexpected cases
        setFormError("An unexpected error occurred during sign in.");
      }
    } catch (error) {
      console.error("Sign-in exception:", error);
      setFormError("An error occurred during sign in.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
        Sign In
      </h2>
      {/* Error Message */}
      {formError && (
        <p className="mb-4 rounded bg-red-100 p-3 text-center text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {formError}
        </p>
      )}
      {/* Success Message (from signup) */}
      {successMessage && (
        <p className="mb-4 rounded bg-green-100 p-3 text-center text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {successMessage}
        </p>
      )}
      {/* Credentials Form */}
      <form onSubmit={handleCredentialsSignIn} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
            placeholder="••••••••"
          />
        </div>

        {/* Optional: Add forgot password link here */}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </div>
      </form>

      {/* Link to Sign Up */}
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Not a member?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
