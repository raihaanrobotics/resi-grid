"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const providerError =
        query.get("error_description") ??
        query.get("error") ??
        hash.get("error_description") ??
        hash.get("error");

      if (providerError) {
        throw new Error(providerError.replace(/\+/g, " "));
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        throw new Error("This confirmation link is invalid or expired. Sign in or request a new confirmation email.");
      }

      const role = data.session.user.user_metadata?.role;
      const destination = role === "municipal"
        ? "/dashboard"
        : role === "crew"
          ? "/crew"
          : "/profile";
      if (active) router.replace(destination);
    })().catch((error: unknown) => {
      console.error("Could not complete email confirmation:", error);
      if (active) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not confirm this email. Please try again."
        );
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (!errorMessage) {
    return (
      <main className="resigrid-shell flex min-h-screen items-center justify-center p-6 text-white">
        <p className="animate-pulse text-xs tracking-[0.2em] text-muted">CONFIRMING YOUR ACCOUNT...</p>
      </main>
    );
  }

  return (
    <main className="resigrid-shell flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center text-white">
      <p className="max-w-md text-sm text-rose-300">{errorMessage}</p>
      <Link href="/profile" className="text-sm font-semibold text-teal-300 hover:underline">
        Return to sign in
      </Link>
    </main>
  );
}
