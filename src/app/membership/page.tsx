import styles from "./page.module.css";

export default function Membership() {
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
            Become a<br />
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
        <form className={styles.form}>

  <div className={styles.formGroup}>
    <label htmlFor="title">
      Title
    </label>

    <select id="title" name="title" required>
      <option value="">Select your title</option>
      <option value="mr">Mr.</option>
      <option value="ms">Ms.</option>
      <option value="mrs">Mrs.</option>
    </select>
  </div>


  <div className={styles.formGroup}>
    <label htmlFor="name">
      Full Name
    </label>

    <input
      id="name"
      name="name"
      type="text"
      placeholder="Enter your full name"
      required
    />
  </div>


  <div className={styles.formGroup}>
    <label htmlFor="email">
      Email Address
    </label>

    <input
      id="email"
      name="email"
      type="email"
      placeholder="Enter your email address"
      required
    />
  </div>


  <div className={styles.formGroup}>
    <label htmlFor="phone">
      Phone Number
    </label>

    <input
      id="phone"
      name="phone"
      type="tel"
      placeholder="Enter your phone number"
      required
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
      placeholder="Create your password"
      required
      minLength={8}
    />
  </div>


  <div className={styles.formGroup}>
    <label htmlFor="confirmPassword">
      Confirm Password
    </label>

    <input
      id="confirmPassword"
      name="confirmPassword"
      type="password"
      placeholder="Confirm your password"
      required
      minLength={8}
    />
  </div>


  <button
    type="submit"
    className={styles.submitButton}
  >
    CREATE MEMBERSHIP
  </button>

</form>

             

        </div>

      </section>

    </main>
  );
}