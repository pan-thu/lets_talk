// src/app/auth/signup/page.tsx
import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { SignUpForm } from "~/_components/auth/SignUpForm";

export default async function SignUpPage() {
  const session = await getServerAuthSession();
  
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}