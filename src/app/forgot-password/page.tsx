import styles from "./page.module.css";

export default function ForgotPassword() {
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
          <p className={styles.label}>DECKSIDE MEMBERSHIP</p>

          <h1>Reset Your Password</h1>

          <p className={styles.description}>
            Enter the email address associated with your Deckside membership.
            We will send you a link to reset your password.
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

            <button type="submit" className={styles.resetButton}>
              SEND RESET LINK
            </button>
          </form>

          <div className={styles.back}>
            <a href="/sign-in">BACK TO SIGN IN</a>
          </div>
        </div>
      </section>
    </main>
  );
}