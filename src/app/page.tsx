import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.hero}>
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

      <div className={styles.heroContent}>
        <div className={styles.tagline}>
          <h1>Your Cozy Corner</h1>
          <p>for Your Productive Space</p>
        </div>

        <div className={styles.membershipCard}>
          <p className={styles.cardLabel}>MONTHLY MEMBERSHIP</p>

          <h2>Deckside Member</h2>

          <div className={styles.pric`e}>
            <span>IDR</span> 288.000
          </div>

          <p className={styles.period}>
            Valid for 1 month
          </p>

          <div className={styles.divider}></div>

          <div className={styles.benefits}>
            <p>Complimentary beverage every day</p>
            <p>Cozy & comfortable study space</p>
            <p>High-speed Wi-Fi access</p>
            <p>Convenient charging outlets</p>
            <p>Air-conditioned environment</p>
            <p>21% off food & beverages</p>
          </div>

          <a
            href="/membership"
            className={styles.joinButton}
          >
            JOIN MEMBERSHIP
          </a>
        </div>
      </div>
    </main>
  );
}