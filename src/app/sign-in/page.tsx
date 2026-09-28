"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import styles from "./page.module.css";

export default function SignIn() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter your email address and password.");
      setLoading(false);
      return;
    }

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (signInError) {
      console.error("Sign in error:", signInError);

      setLoading(false);

      setError("Email or password is incorrect.");
      return;
    }

    if (!data.user) {
      setLoading(false);
      setError("Unable to sign in. Please try again.");
      return;
    }

    /*
     * Check the user's role from profiles table.
     */
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

    if (profileError) {
      console.error("Profile error:", profileError);

      /*
       * The account can still be signed in even if
       * the profile has not been created yet.
       *
       * The user will be treated as a normal member.
       */
      setLoading(false);

      router.push("/dashboard");
      router.refresh();

      return;
    }

    /*
     * Admin → Admin Dashboard
     */
    if (profile.role === "admin") {
      setLoading(false);

      router.push("/admin");
      router.refresh();

      return;
    }

    /*
     * Member → Member Dashboard
     */
    setLoading(false);

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className={styles.page}>
      <nav className={styles.navbar}>
        <a href="/" className={styles.logo}>
          Deckside
        </a>

        <div className={styles.menu}>
          <a href="/membership">MEMBERSHIP</a>
          <a href="/menu">MENU</a>
          <a href="/sign-in">SIGN IN</a>
        </div>
      </nav>

      <section className={styles.signInSection}>
        <div className={styles.card}>
          <p className={styles.label}>
            DECKSIDE MEMBERSHIP
          </p>

          <h1>Welcome Back</h1>

          <p className={styles.description}>
            Sign in to access your Deckside membership.
          </p>

          <form
            className={styles.form}
            onSubmit={handleSignIn}
          >
            <div className={styles.formGroup}>
              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.forgotPassword}>
              <a href="/forgot-password">
                FORGOT PASSWORD?
              </a>
            </div>

            {error && (
              <p className={styles.error}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className={styles.signInButton}
              disabled={loading}
            >
              {loading
                ? "SIGNING IN..."
                : "SIGN IN"}
            </button>
          </form>

          <div className={styles.register}>
            <p>
              Don't have a membership yet?
            </p>

            <a href="/membership">
              CREATE MEMBERSHIP
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}