import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resetPassword } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Choose a New Password | Hotel Transylvania",
  robots: { index: false },
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; error?: string };
}) {
  const token = searchParams.token;
  if (!token) redirect("/admin/forgot-password");

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-sm border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">Choose a new password</h1>
        {searchParams.error === "weak" && (
          <p className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Use at least 10 characters.
          </p>
        )}
        <form action={resetPassword} className="mt-4 space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={10}
              autoComplete="new-password"
              required
            />
            <p className="mt-1 text-xs text-zinc-400">
              At least 10 characters. A short sentence works well.
            </p>
          </div>
          <Button type="submit" variant="dark" className="w-full">
            Save Password
          </Button>
        </form>
      </div>
    </main>
  );
}
