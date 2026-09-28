import styles from "./page.module.css";

export default function SignIn() {
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
          <p className={styles.label}>DECKSIDE MEMBERSHIP</p>

          <h1>Welcome Back</h1>

          <p className={styles.description}>
            Sign in to access your Deckside membership.
          </p>

          <form className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className={styles.forgotPassword}>
              <a href="/forgot-password">FORGOT PASSWORD?</a>
            </div>

            <button type="submit" className={styles.signInButton}>
              SIGN IN
            </button>
          </form>

          <div className={styles.register}>
            <p>Don't have a membership yet?</p>

            <a href="/membership">CREATE MEMBERSHIP</a>
          </div>
        </div>
      </section>
    </main>
  );
}