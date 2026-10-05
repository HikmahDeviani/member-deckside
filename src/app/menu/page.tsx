"use client";

import Link from "next/link";
import styles from "./page.module.css";

const memberBeverages = [
   {
    id: 1,
    name: "Lemon Peach Iced Tea", 
    image: "/images/menu_1.png",
  },                                     
  {
    id: 2,
    name: "Mango Matcha Latte",
    image: "/images/menu_3.png",
  },
  {
    id: 3,
    name: "Strawberry Splash",
    image: "/images/menu_4.png",
  },
  {
    id: 4,
    name: "Coffee Boom",
    image: "/images/menu_5.png",
  },
  {
    id: 5,
    name:"Matcha Colada",
    image: "/images/menu_6.png",
  },
  {
    id: 6,
    name: "Sunkiss Coffee",
    image: "/images/menu_7.png",
  },
  {
    id: 7,
    name: "Salted Caramel Crème Brule",
    image: "/images/menu_8.png",
  },
];

const foodAddons = [
  {
    id: 101,
    name: "Blueberry Cheesecake",
    price: 58000,
  },
  {
    id: 102,
    name: "Tofu Salt Chili",
    price: 48000,
  },
  {
    id: 103,
    name: "Spring Roll Oakwood",
    price: 48000,
  },
  {
    id: 104,
    name: "Mixed Sampler",
    price: 58000,
  },
  {
    id: 105,
    name: "Chili Baba Fries with Cheese",
    price: 58000,
  },
  {
    id: 106,
    name: "Cheese French Fries",
    price: 58000,
  },
  {
    id: 107,
    name: "Crispy Corn Salted Egg",
    price: 58000,
  },
  {
    id: 108,
    name: "Chicken Karage",
    price: 58000,
  },
  {
    id: 109,
    name: "Fried Cakwe Prawn with Beef Floss",
    price: 58000,
  },
  {
    id: 110,
    name: "Tempe Mendoan Sambal Kecap",
    price: 58000,
  },
  {
    id: 111,
    name: "Pisang Goreng Gula Aren",
    price: 58000,
  },
  {
    id: 112,
    name: "French Toast",
    price: 58000,
  },
];

const beverageAddons = [
  {
    id: 201,
    name: "Matcha Colada",
    price: 58000,
  },
  {
    id: 202,
    name: "Butterscotch Creamy Latte",
    price: 68000,
  },
  {
    id: 203,
    name: "Sun Kiss Coffee",
    price: 68000,
  },
  {
    id: 204,
    name: "Mood Monday",
    price: 68000,
  },
  {
    id: 205,
    name: "Lemon Peach Iced Tea",
    price: 58000,
  },
  {
    id: 206,
    name: "Coffee Boom",
    price: 68000,
  },
  {
    id: 207,
    name: "Mango Matcha Latte",
    price: 58000,
  },
  {
    id: 208,
    name: "Matcha Passion",
    price: 58000,
  },
  {
    id: 209,
    name: "Strawberry Splash",
    price: 58000,
  },
  {
    id: 210,
    name: "Salted Caramel Crème Brule",
    price: 68000,
  },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
};

export default function MenuPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.logo}>
          Deckside
        </Link>

        <div className={styles.menu}>
          <Link href="/membership">Membership</Link>
          <Link href="/menu">Menu</Link>
        </div>
      </nav>

      <main className={styles.menuSection}>
        <section className={styles.heading}>
          <div className={styles.label}>DECKSIDE MENU</div>

          <h1>
            Something good
            <br />
            for every moment.
          </h1>

          <p className={styles.description}>
            Explore our selection of complimentary member beverages
            and additional food and beverage options available at
            Deckside.
          </p>
        </section>

        {/* MEMBER BEVERAGE */}

        <section className={styles.category}>
          <div className={styles.categoryHeader}>
            <div>
              <div className={styles.categoryLabel}>
                MEMBER BENEFIT
              </div>

              <h2>Member Beverage</h2>
            </div>

            <div className={styles.categoryInfo}>
              <div>
                Choose one complimentary beverage every day.
              </div>

              <div className={styles.discount}>
                1 beverage / day
              </div>
            </div>
          </div>

          <div className={styles.menuGrid}>
            {memberBeverages.map((beverage) => (
              <article
                key={beverage.id}
                className={styles.menuCard}
              >
                <img
                  src={beverage.image}
                  alt={beverage.name}
                  className={styles.menuImage}
                />

                <div className={styles.cardContent}>
                  <h3>{beverage.name}</h3>

                  <p className={styles.complimentary}>
                    Complimentary for Deckside Members
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ADD-ONS */}

        <section className={styles.category}>
          <div className={styles.categoryHeader}>
            <div>
              <div className={styles.categoryLabel}>
                ADDITIONAL MENU
              </div>

              <h2>Add-ons</h2>
            </div>

            <div className={styles.categoryInfo}>
              <div>
                Enjoy more from our selection.
              </div>

              <div className={styles.discount}>
                21% member discount
              </div>
            </div>
          </div>

          {/* FOOD */}

          <div className={styles.addonCategory}>
            <div className={styles.addonCategoryHeader}>
              <h3>Food Add-ons</h3>

              <span>
                Available for Deckside Members
              </span>
            </div>

            <div className={styles.addonList}>
              {foodAddons.map((item) => (
                <article
                  key={item.id}
                  className={styles.addonItem}
                >
                  <div className={styles.addonInfo}>
                    <h3>{item.name}</h3>

                    <p>
                      Enjoy this selection as an additional
                      item to your complimentary daily
                      beverage.
                    </p>
                  </div>

                  <div className={styles.addonPrice}>
                    <strong>
                      {formatPrice(item.price)}
                    </strong>

                    <span className={styles.memberPriceLabel}>
                      Member price available
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* BEVERAGE */}

          <div className={styles.addonCategory}>
            <div className={styles.addonCategoryHeader}>
              <h3>Beverage Add-ons</h3>

              <span>
                Available for Deckside Members
              </span>
            </div>

            <div className={styles.addonList}>
              {beverageAddons.map((item) => (
                <article
                  key={item.id}
                  className={styles.addonItem}
                >
                  <div className={styles.addonInfo}>
                    <h3>{item.name}</h3>

                    <p>
                      Explore another beverage option beyond
                      your complimentary daily selection.
                    </p>
                  </div>

                  <div className={styles.addonPrice}>
                    <strong>
                      {formatPrice(item.price)}
                    </strong>

                    <span className={styles.memberPriceLabel}>
                      Member price available
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}