"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import styles from "./page.module.css";

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createClient());

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setError(
          "Unable to verify your password reset session. Please try again."
        );
        setValidSession(false);
      } else if (!data.session) {
        setError(
          "This password reset link is invalid or has expired. Please request a new reset link."
        );
        setValidSession(false);
      } else {
        setValidSession(true);
      }

      setCheckingSession(false);
    };

    checkSession();
  }, [supabase]);

  const handleResetPassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!validSession) {
      setError(
        "Your password reset session is invalid or has expired. Please request a new reset link."
      );
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      "Your password has been successfully updated. You can now log in with your new password."
    );

    setPassword("");
    setConfirmPassword("");
    setValidSession(false);
  };

  if (checkingSession) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>DECKSIDE MEMBERSHIP</p>

          <h1>Reset Password</h1>

          <p className={styles.description}>
            Checking your password reset link...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>DECKSIDE MEMBERSHIP</p>

        <h1>Reset Password</h1>

        <p className={styles.description}>
          Create a new password for your Deckside account.
        </p>

        {validSession ? (
          <form onSubmit={handleResetPassword}>
            <label htmlFor="password">NEW PASSWORD</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your new password"
              autoComplete="new-password"
              minLength={6}
              required
              disabled={loading}
            />

            <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm your new password"
              autoComplete="new-password"
              minLength={6}
              required
              disabled={loading}
            />

            {error && <p className={styles.error}>{error}</p>}

            {message && <p className={styles.success}>{message}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "UPDATING..." : "UPDATE PASSWORD"}
            </button>
          </form>
        ) : (
          <>
            {error && <p className={styles.error}>{error}</p>}

            {message && <p className={styles.success}>{message}</p>}
          </>
        )}

        {message && (
          <a href="/login" className={styles.loginLink}>
            BACK TO LOGIN
          </a>
        )}

        {!validSession && !message && (
          <a href="/forgot-password" className={styles.loginLink}>
            REQUEST NEW RESET LINK
          </a>
        )}
      </div>
    </main>
  );
}
