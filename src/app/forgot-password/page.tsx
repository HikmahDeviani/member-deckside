"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import styles from "./page.module.css";

export default function ForgotPassword() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    const redirectTo =
      `${window.location.origin}/reset-password`;

    console.log("RESET EMAIL:", cleanEmail);
    console.log("RESET REDIRECT:", redirectTo);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo,
        }
      );

    if (error) {
      console.error("RESET PASSWORD ERROR:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "A password reset link has been sent to your email address. Please check your inbox."
    );

    setEmail("");
    setLoading(false);
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

      <section className={styles.section}>
        <div className={styles.card}>
          <p className={styles.label}>
            DECKSIDE MEMBERSHIP
          </p>

          <h1>Reset Your Password</h1>

          <p className={styles.description}>
            Enter the email address associated with your
            Deckside membership. We will send you a link
            to reset your password.
          </p>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {message && (
            <div className={styles.success}>
              {message}
            </div>
          )}

          {!message && (
            <form
              className={styles.form}
              onSubmit={handleSubmit}
            >
              <div className={styles.formGroup}>
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email address"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className={styles.resetButton}
                disabled={loading}
              >
                {loading
                  ? "SENDING..."
                  : "SEND RESET LINK"}
              </button>
            </form>
          )}

          <div className={styles.back}>
            <a href="/sign-in">
              BACK TO SIGN IN
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}