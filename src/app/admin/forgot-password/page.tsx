import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Reset Password | Hotel Transylvania",
  robots: { index: false },
};

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { sent?: string; invalid?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-sm">
        <div className="border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Reset your password</h1>
          {searchParams.sent ? (
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              If that address belongs to a staff account, a reset link is on
              its way. It works once and expires in an hour.
            </p>
          ) : (
            <>
              {searchParams.invalid && (
                <p className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  That reset link is expired or already used. Request a fresh one.
                </p>
              )}
              <p className="mt-2 text-sm text-zinc-500">
                Enter your staff email and we will send a one-time link.
              </p>
              <form action={requestPasswordReset} className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <Button type="submit" variant="dark" className="w-full">
                  Send Reset Link
                </Button>
              </form>
            </>
          )}
          <p className="mt-4 text-center text-sm">
            <Link href="/admin/login" className="text-zinc-500 underline underline-offset-2">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
