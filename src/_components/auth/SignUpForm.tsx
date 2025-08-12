"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "~/trpc/react"; // Import tRPC client

export function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [formError, setFormError] = useState<string | null>(null);

  // tRPC mutation hook for registration
  const registerMutation = api.auth.register.useMutation({
    onSuccess: (data) => {
      console.log("Registration successful:", data);
      // Redirect to sign-in page after successful registration
      router.push("/auth/signin?message=signup_success"); // Add a query param for feedback
    },
    onError: (error) => {
      // Handle specific tRPC errors or general errors
      if (error.data?.code === "CONFLICT") {
        setFormError(error.message); // Show specific message from server
      } else if (error.data?.zodError?.fieldErrors?.password) {
        // Show specific Zod validation error for password
        setFormError(
          error.data.zodError.fieldErrors.password[0] ??
            "Invalid password format.",
        );
      } else if (error.data?.zodError?.fieldErrors?.email) {
        // Show specific Zod validation error for email
        setFormError(
          error.data.zodError.fieldErrors.email[0] ?? "Invalid email format.",
        );
      } else {
        // Generic fallback error
        console.error("Registration error:", error);
        setFormError(
          "An error occurred during registration. Please try again.",
        );
      }
    },
  });

  async function handleSignUp(event: FormEvent) {
    event.preventDefault();
    setFormError(null); // Clear previous errors

    // Optional: Add client-side password confirmation logic here if needed

    // Call the tRPC mutation
    registerMutation.mutate({
      name,
      email,
      password,
    });
  }

  return (
    <div className="mx-auto w-full max-w-sm rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
        Create Account
      </h2>
      {/* Error Message Display */}
      {formError && (
        <p className="mb-4 rounded bg-red-100 p-3 text-center text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {formError}
        </p>
      )}
      {/* Sign Up Form */}
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500 sm:text-sm" />
        </div>
        {/* Email Input */}
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
        {/* Password Input */}
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
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
            placeholder="Minimum 8 characters"
          />
          {/* Optional: Add Password Confirmation field here */}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {registerMutation.isPending ? "Creating Account..." : "Sign Up"}
          </button>
        </div>
      </form>

      {/* Link to Sign In */}
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          href="/auth/signin"
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
