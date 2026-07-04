import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Staff Sign In | Hotel Transylvania",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">
            Hotel Transylvania
          </p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">Back office</h1>
        </div>
        <div className="border border-zinc-200 bg-white p-6 shadow-sm">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-4 text-center text-xs text-zinc-400">
          Staff access only. Sessions expire after 12 hours.
        </p>
      </div>
    </main>
  );
}
