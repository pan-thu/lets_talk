import { auth } from "~/server/auth";
import { signOut } from "~/server/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Let's <span className="text-[hsl(280,100%,70%)]">Talk</span>
        </h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20">
            <h3 className="text-2xl font-bold">Dashboard →</h3>
            <div className="text-lg">
              {session?.user ? (
                <div>
                  <p>Welcome, {session.user.name}!</p>
                  <p>Role: {session.user.role}</p>
                  <form
                    action={async () => {
                      "use server";
                      await signOut();
                    }}
                  >
                    <button className="mt-4 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600">
                      Sign Out
                    </button>
                  </form>
                </div>
              ) : (
                <p>Please sign in to access your dashboard.</p>
              )}
            </div>
          </div>
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20">
            <h3 className="text-2xl font-bold">Courses →</h3>
            <div className="text-lg">
              Browse and enroll in courses.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
