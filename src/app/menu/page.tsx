import styles from "./page.module.css";

const memberBeverages = [
  {
    id: 1,
    name: "Lemon Peach Ice Tea",
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
    name: "Matcha Passion",
    image: "/images/menu_6.png",
  },
  {
    id: 6,
    name: "Sun Kiss Coffee",
    image: "/images/menu_7.png",
  },
  {
    id: 7,
    name: "Butterscotch Creamy Latte",
    image: "/images/menu_8.png",
  },
];

const appetizerSnacks = [
  {
    id: 1,
    name: "Blueberry Cheesecake",
    price: 58000,
    description:
      "Creamy cheesecake with a buttery biscuit crust, topped with blueberry compote.",
  },
  {
    id: 2,
    name: "Tofu Salt Chili",
    price: 48000,
    description:
      "Crispy fried tofu tossed with salt and chili seasoning.",
  },
  {
    id: 3,
    name: "Spring Roll Oakwood",
    price: 48000,
    description:
      "Signature spring rolls filled with shrimp, chicken, and apple, served with Branche’s special sauce.",
  },
  {
    id: 4,
    name: "Mixed Sampler",
    price: 58000,
    description:
      "Potato wedges, spring rolls, chicken wings, and sausages, served with cheese sauce and Thai chili sauce.",
  },
  {
    id: 5,
    name: "Chili Baba Fries with Cheese",
    price: 58000,
    description:
      "Crispy fries seasoned with Chili Baba spices and topped with melted cheese.",
  },
  {
    id: 6,
    name: "Cheese French Fries",
    price: 58000,
    description:
      "Golden French Fries served with rich cheese sauce.",
  },
  {
    id: 7,
    name: "Crispy Corn Salted Egg",
    price: 58000,
    description:
      "Crispy corn coated in a rich and creamy salted egg sauce.",
  },
  {
    id: 8,
    name: "Chicken Karage",
    price: 58000,
    description:
      "Japanese-style crispy fried chicken, tender and juicy on the inside.",
  },
  {
    id: 9,
    name: "Fried Cakwe Prawn with Beef Floss",
    price: 58000,
    description:
      "Golden-fried Chinese crullers (cakwe) stuffed with juicy prawns and topped with savory beef floss.",
  },
  {
    id: 10,
    name: "Tempe Mendoan Sambal Kecap",
    price: 58000,
    description:
      "Lightly battered fried tempeh served with sweet and spicy soy chili sauce.",
  },
  {
    id: 11,
    name: "Pisang Goreng Gula Aren",
    price: 58000,
    description:
      "Crispy fried banana drizzled with rich palm sugar syrup.",
  },
  {
    id: 12,
    name: "French Toast",
    price: 58000,
    description:
      "Golden pan-fried bread served with butter and maple syrup.",
  },
];

const addonBeverages = [
  {
    id: 13,
    name: "Matcha Colada",
    price: 58000,
    description:
      "Creamy matcha blended with tropical coconut flavors.",
  },
  {
    id: 14,
    name: "Butterscotch Creamy Latte",
    price: 68000,
    description:
      "Smooth espresso with creamy milk and rich butterscotch.",
  },
  {
    id: 15,
    name: "Sun Kiss Coffee",
    price: 68000,
    description:
      "Refreshing coffee with bright citrus notes.",
  },
  {
    id: 16,
    name: "Mood Monday",
    price: 68000,
    description:
      "A refreshing coffee blend with a smooth, uplifting finish.",
  },
  {
    id: 17,
    name: "Lemon Peach Iced Tea",
    price: 58000,
    description:
      "Refreshing iced tea infused with lemon and peach.",
  },
  {
    id: 18,
    name: "Coffee Boom",
    price: 68000,
    description:
      "Bold espresso blended into a rich and creamy coffee drink.",
  },
  {
    id: 19,
    name: "Mango Matcha Latte",
    price: 58000,
    description:
      "Creamy matcha latte with sweet, tropical mango.",
  },
  {
    id: 20,
    name: "Matcha Passion",
    price: 58000,
    description:
      "A refreshing blend of matcha and passion fruit.",
  },
  {
    id: 21,
    name: "Strawberry Splash",
    price: 58000,
    description:
      "A fruity strawberry refresher served over ice.",
  },
  {
    id: 22,
    name: "Salted Caramel Crème Brûlée",
    price: 68000,
    description:
      "Salted caramel coffee topped with a hint of salted caramel.",
  },
];

const formatRupiah = (value: number) =>
  `Rp ${value.toLocaleString("id-ID")}`;

function AddonList({
  items,
}: {
  items: {
    id: number;
    name: string;
    price: number;
    description: string;
  }[];
}) {
  return (
    <div className={styles.addonList}>
      {items.map((item) => {
        const memberPrice = item.price * 0.79;

        return (
          <div className={styles.addonItem} key={item.id}>
            <div className={styles.addonInfo}>
              <h3>{item.name}</h3>

              <p>{item.description}</p>
            </div>

            <div className={styles.addonPrice}>
              <span className={styles.originalPrice}>
                {formatRupiah(item.price)}
              </span>

              <strong>{formatRupiah(memberPrice)}</strong>

              <span className={styles.memberPriceLabel}>
                Member price
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Menu() {
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

      <section className={styles.menuSection}>
        <div className={styles.heading}>
          <p className={styles.label}>DECKSIDE MENU</p>

          <h1>
            Something for
            <br />
            Every Moment
          </h1>

          <p className={styles.description}>
            Explore our selection of complimentary beverages
            and food & beverages available for Deckside Members.
          </p>
        </div>

        <section className={styles.category}>
          <div className={styles.categoryHeader}>
            <div>
              <p className={styles.categoryLabel}>
                MEMBER BENEFIT
              </p>

              <h2>Member Beverage</h2>
            </div>

            <p className={styles.categoryInfo}>
              Complimentary · 1 drink/day
              <br />
              Available 15:00 – 19:00 WIB
            </p>
          </div>

          <div className={styles.menuGrid}>
            {memberBeverages.map((item) => (
              <div className={styles.menuCard} key={item.id}>
                <img
                  src={item.image}
                  alt={item.name}
                  className={styles.menuImage}
                />

                <div className={styles.cardContent}>
                  <h3>{item.name}</h3>

                  <p className={styles.complimentary}>
                    Complimentary for Members
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.category}>
          <div className={styles.categoryHeader}>
            <div>
              <p className={styles.categoryLabel}>
                MEMBER DISCOUNT
              </p>

              <h2>Add-ons</h2>
            </div>

            <p className={styles.discount}>
              21% OFF for Deckside Members
            </p>
          </div>

          <div className={styles.addonCategory}>
            <div className={styles.addonCategoryHeader}>
              <h3>Appetizers & Snack</h3>

              <span>12 items</span>
            </div>

            <AddonList items={appetizerSnacks} />
          </div>

          <div className={styles.addonCategory}>
            <div className={styles.addonCategoryHeader}>
              <h3>Beverages</h3>

              <span>10 items</span>
            </div>

            <AddonList items={addonBeverages} />
          </div>
        </section>
      </section>
    </main>
  );
}