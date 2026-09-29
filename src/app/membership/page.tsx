"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import styles from "./page.module.css";

export default function Membership() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [title, setTitle] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          title,
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (!data.user) {
      setLoading(false);
      setError("Unable to create your account. Please try again.");
      return;
    }

    setLoading(false);

    setSuccess(
      "Your account has been created successfully. Your membership is now pending verification. Please wait for the Deckside team to verify your payment and activate your membership."
    );
  };

  if (success) {
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

        <section className={styles.registration}>
          <div className={styles.introduction}>
            <p className={styles.label}>DECKSIDE MEMBERSHIP</p>

            <h1>
              Almost
              <br />
              There
            </h1>

            <p className={styles.description}>
              Your account has been created. Your membership will become
              active after verification by the Deckside team.
            </p>
          </div>

          <div className={styles.formCard}>
            <h2>Registration Submitted</h2>

            <p className={styles.formDescription}>
              Thank you for registering with Deckside.
            </p>

            <div
              style={{
                marginTop: "24px",
                padding: "18px",
                borderRadius: "8px",
                backgroundColor: "#C4BFB6",
                color: "#00494F",
                lineHeight: "1.6",
              }}
            >
              <strong>Membership Status: Pending Verification</strong>

              <p style={{ marginTop: "10px", marginBottom: 0 }}>
                Our team will verify your payment before activating your
                membership. You will be able to access member benefits once
                your membership has been approved.
              </p>
            </div>

            <button
              type="button"
              className={styles.submitButton}
              style={{ marginTop: "24px" }}
              onClick={() => router.push("/sign-in")}
            >
              GO TO SIGN IN
            </button>
          </div>
        </section>
      </main>
    );
  }

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

      <section className={styles.registration}>
        <div className={styles.introduction}>
          <p className={styles.label}>DECKSIDE MEMBERSHIP</p>

          <h1>
            Become a
            <br />
            Deckside Member
          </h1>

          <p className={styles.description}>
            Create your membership account and enjoy a cozy
            space to work, study, and recharge every day.
          </p>
        </div>

        <div className={styles.formCard}>
          <h2>Create Your Account</h2>

          <p className={styles.formDescription}>
            Fill in your details to get started.
          </p>

          <form className={styles.form} onSubmit={handleSignUp}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title</label>

              <select
                id="title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select your title</option>
                <option value="mr">Mr.</option>
                <option value="ms">Ms.</option>
                <option value="mrs">Mrs.</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number</label>

              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Create your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
                disabled={loading}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "CREATING ACCOUNT..." : "CREATE MEMBERSHIP"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

