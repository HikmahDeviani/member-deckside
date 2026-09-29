"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { createClient } from "../../lib/supabase/client";
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

const addOns = [...appetizerSnacks, ...addonBeverages];

type Addon = {
  id: number;
  name: string;
  price: number;
  description: string;
};

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type ConfirmationType = "beverage" | "addon" | null;

type ClaimRecord = {
  date: string;
  beverage: string;
};

type HistoryItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

type HistoryOrder = {
  id: string;
  orderNumber: string;
  orderType: "COMPLIMENTARY_BEVERAGE" | "ADD_ON";
  status: string;
  totalAmount: number;
  createdAt: string;
  items: HistoryItem[];
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

const formatDateTime = (dateString: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(dateString))
    .replace(",", " ·");

const getJakartaDateKey = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year =
    parts.find((part) => part.type === "year")?.value || "";

  const month =
    parts.find((part) => part.type === "month")?.value || "";

  const day =
    parts.find((part) => part.type === "day")?.value || "";

  return `${year}-${month}-${day}`;
};

const isBeverageClaimTime = () => {
  const jakartaTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(
    jakartaTime.find((part) => part.type === "hour")?.value || 0
  );

  const minute = Number(
    jakartaTime.find((part) => part.type === "minute")?.value || 0
  );

  const currentMinutes = hour * 60 + minute;

  return currentMinutes >= 15 * 60 && currentMinutes < 19 * 60;
};

export default function DashboardPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [claimWindowOpen, setClaimWindowOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [scanError, setScanError] = useState("");

  const [selectedBeverage, setSelectedBeverage] =
    useState<number | null>(null);

  const [claimedToday, setClaimedToday] = useState(false);
  const [claimedBeverage, setClaimedBeverage] = useState("");

  const [cart, setCart] = useState<Record<number, number>>({});

  const [confirmationType, setConfirmationType] =
    useState<ConfirmationType>(null);

  const [orderId, setOrderId] = useState("");
  const [confirmedBeverage, setConfirmedBeverage] = useState("");
  const [confirmedItems, setConfirmedItems] = useState<OrderItem[]>([]);
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  const [extendOpen, setExtendOpen] = useState(false);
  const [extendConfirmed, setExtendConfirmed] = useState(false);

  const [memberTitle, setMemberTitle] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberId, setMemberId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [loadingMember, setLoadingMember] = useState(true);

  const [orderHistory, setOrderHistory] = useState<HistoryOrder[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  /*
   * Temporary membership data.
   * This part is intentionally kept as it is for now.
   */
  const membershipStatus = "ACTIVE";

  const startDate = new Date(2026, 8, 25);
  const endDate = new Date(2026, 9, 24);

  const claimStorageKey = memberId
    ? `deckside-claim-${memberId}`
    : "";

  const memberPrice = (price: number) => price * 0.79;

  const cartItems: OrderItem[] = addOns
    .filter((item) => (cart[item.id] || 0) > 0)
    .map((item) => ({
      name: item.name,
      quantity: cart[item.id],
      price: memberPrice(item.price),
    }));

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const serviceCharge = subtotal * 0.1;
  const tax = (subtotal + serviceCharge) * 0.11;
  const total = subtotal + serviceCharge + tax;

  const selectedBeverageData = memberBeverages.find(
    (item) => item.id === selectedBeverage
  );

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(100 + Math.random() * 900);

    return `DSK-ORD-${timestamp.slice(-6)}${random}`;
  };

  const increaseQuantity = (id: number) => {
    setCart((previous) => ({
      ...previous,
      [id]: (previous[id] || 0) + 1,
    }));
  };

  const decreaseQuantity = (id: number) => {
    setCart((previous) => {
      const quantity = previous[id] || 0;

      if (quantity <= 1) {
        const updated = { ...previous };

        delete updated[id];

        return updated;
      }

      return {
        ...previous,
        [id]: quantity - 1,
      };
    });
  };

  /*
   * Load order history from Supabase.
   */
  const loadOrderHistory = async (userId: string) => {
    setLoadingHistory(true);

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        "id, order_number, order_type, status, total_amount, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (ordersError) {
      console.error(
        "Unable to load order history:",
        ordersError.message
      );

      setOrderHistory([]);
      setLoadingHistory(false);

      return;
    }

    if (!orders || orders.length === 0) {
      setOrderHistory([]);
      setLoadingHistory(false);

      return;
    }

    const orderIds = orders.map(
      (order) => order.id
    );

    const { data: items, error: itemsError } =
      await supabase
        .from("order_items")
        .select(
          "id, order_id, item_name, quantity, unit_price"
        )
        .in("order_id", orderIds);

    if (itemsError) {
      console.error(
        "Unable to load order items:",
        itemsError.message
      );

      setOrderHistory(
        orders.map((order) => ({
          id: order.id,
          orderNumber: order.order_number,
          orderType: order.order_type,
          status: order.status,
          totalAmount: Number(order.total_amount || 0),
          createdAt: order.created_at,
          items: [],
        }))
      );

      setLoadingHistory(false);

      return;
    }

    const history: HistoryOrder[] = orders.map(
      (order) => ({
        id: order.id,
        orderNumber: order.order_number,
        orderType: order.order_type,
        status: order.status,
        totalAmount: Number(
          order.total_amount || 0
        ),
        createdAt: order.created_at,
        items: (items || [])
          .filter(
            (item) =>
              item.order_id === order.id
          )
          .map((item) => ({
            id: item.id,
            name: item.item_name,
            quantity: item.quantity,
            price: Number(
              item.unit_price || 0
            ),
          })),
      })
    );

    setOrderHistory(history);
    setLoadingHistory(false);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}

      try {
        scannerRef.current.clear();
      } catch {}

      scannerRef.current = null;
    }

    setScannerOpen(false);
  };

  const startScanner = async () => {
    if (!claimWindowOpen) {
      setScanError(
        "Camera access is only available from 15:00–19:00 WIB."
      );

      return;
    }

    if (claimedToday) {
      setScanError(
        "You have already claimed your complimentary beverage today."
      );

      return;
    }

    setScanError("");
    setScannerOpen(true);

    setTimeout(async () => {
      if (!isBeverageClaimTime()) {
        setScannerOpen(false);

        setScanError(
          "The complimentary beverage claim period has ended."
        );

        return;
      }

      if (claimedToday) {
        setScannerOpen(false);

        setScanError(
          "You have already claimed your complimentary beverage today."
        );

        return;
      }

      try {
        const scanner = new Html5Qrcode(
          "deckside-qr-reader"
        );

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: {
              width: 240,
              height: 240,
            },
          },
          async (decodedText) => {
            if (!isBeverageClaimTime()) {
              await stopScanner();

              setQrScanned(false);
              setSelectedBeverage(null);

              setScanError(
                "The complimentary beverage claim period has ended."
              );

              return;
            }

            if (claimedToday) {
              await stopScanner();

              setQrScanned(false);
              setSelectedBeverage(null);

              setScanError(
                "You have already claimed your complimentary beverage today."
              );

              return;
            }

            if (
              decodedText ===
              "DECKSIDE-CLAIM-BEVERAGE"
            ) {
              await stopScanner();

              setQrScanned(true);
              setScanError("");
            } else {
              setScanError(
                "Invalid Deckside cashier QR code."
              );
            }
          },
          () => {}
        );
      } catch {
        setScannerOpen(false);

        setScanError(
          "Unable to access the camera. Please allow camera permission and try again."
        );
      }
    }, 150);
  };

  /*
   * Load authenticated user and check role.
   */
  useEffect(() => {
    let active = true;

    const loadMember = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (userError || !user) {
        router.replace("/sign-in");
        return;
      }

      setCurrentUserId(user.id);

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "role, title, full_name, email, member_id"
        )
        .eq("id", user.id)
        .single();

      if (!active) {
        return;
      }

      if (
        !profileError &&
        profile?.role === "admin"
      ) {
        router.replace("/admin");
        return;
      }

      const titleMap: Record<string, string> = {
        mr: "Mr.",
        ms: "Ms.",
        mrs: "Mrs.",
      };

      const titleValue =
        profile?.title ||
        user.user_metadata?.title ||
        "";

      const title =
        titleMap[titleValue] || "";

      const fullName =
        profile?.full_name?.trim() ||
        user.user_metadata?.full_name?.trim() ||
        user.user_metadata?.name?.trim() ||
        user.email?.split("@")[0] ||
        "Member";

      const permanentMemberId =
        profile?.member_id ||
        `DSK-${user.id
          .replace(/-/g, "")
          .slice(0, 6)
          .toUpperCase()}`;

      setMemberTitle(title);
      setMemberName(fullName);
      setMemberEmail(
        profile?.email ||
          user.email ||
          ""
      );
      setMemberId(permanentMemberId);
      setLoadingMember(false);

      await loadOrderHistory(user.id);
    };

    loadMember();

    return () => {
      active = false;
    };
  }, [supabase, router]);

  /*
   * Load today's complimentary beverage claim.
   */
  useEffect(() => {
    if (!claimStorageKey) {
      return;
    }

    const storedClaim = localStorage.getItem(
      claimStorageKey
    );

    if (storedClaim) {
      try {
        const parsed: ClaimRecord =
          JSON.parse(storedClaim);

        if (
          parsed.date ===
          getJakartaDateKey()
        ) {
          setClaimedToday(true);
          setClaimedBeverage(
            parsed.beverage
          );
        } else {
          localStorage.removeItem(
            claimStorageKey
          );

          setClaimedToday(false);
          setClaimedBeverage("");
        }
      } catch {
        localStorage.removeItem(
          claimStorageKey
        );

        setClaimedToday(false);
        setClaimedBeverage("");
      }
    }
  }, [claimStorageKey]);

  /*
   * Check complimentary beverage time.
   */
  useEffect(() => {
    const checkClaimTime = () => {
      const open = isBeverageClaimTime();

      setClaimWindowOpen(open);

      if (!open) {
        setQrScanned(false);
        setSelectedBeverage(null);

        if (scannerRef.current) {
          stopScanner();
        }
      }
    };

    checkClaimTime();

    const interval = setInterval(
      checkClaimTime,
      30000
    );

    return () => {
      clearInterval(interval);

      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              scannerRef.current?.clear();
            } catch {}

            scannerRef.current = null;
          });
      }
    };
  }, []);

  /*
   * Save complimentary beverage order
   * to Supabase.
   */
  const confirmBeverage = async () => {
    if (
      !claimWindowOpen ||
      !qrScanned ||
      !selectedBeverageData ||
      claimedToday ||
      !claimStorageKey ||
      !currentUserId
    ) {
      return;
    }

    const today = getJakartaDateKey();

    const claimRecord: ClaimRecord = {
      date: today,
      beverage: selectedBeverageData.name,
    };

    const orderNumber =
      generateOrderNumber();

    const { data: order, error: orderError } =
      await supabase
        .from("orders")
        .insert({
          user_id: currentUserId,
          order_number: orderNumber,
          order_type:
            "COMPLIMENTARY_BEVERAGE",
          status: "ORDER RECEIVED",
          total_amount: 0,
        })
        .select(
          "id, order_number"
        )
        .single();

    if (orderError || !order) {
      console.error(
        "Unable to create beverage order:",
        orderError?.message
      );

      setScanError(
        "Unable to place your order. Please try again."
      );

      return;
    }

    const { error: itemError } =
      await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          item_name:
            selectedBeverageData.name,
          quantity: 1,
          unit_price: 0,
        });

    if (itemError) {
      console.error(
        "Unable to create beverage order item:",
        itemError.message
      );

      setScanError(
        "Unable to save your order details. Please try again."
      );

      return;
    }

    localStorage.setItem(
      claimStorageKey,
      JSON.stringify(claimRecord)
    );

    setClaimedToday(true);
    setClaimedBeverage(
      selectedBeverageData.name
    );

    setConfirmedBeverage(
      selectedBeverageData.name
    );

    setConfirmedItems([]);
    setConfirmedTotal(0);
    setOrderId(order.order_number);
    setConfirmationType("beverage");

    setQrScanned(false);
    setSelectedBeverage(null);

    await loadOrderHistory(
      currentUserId
    );
  };

  /*
   * Save add-on order to Supabase.
   */
  const placeAddonOrder = async () => {
    if (
      cartItems.length === 0 ||
      !currentUserId
    ) {
      return;
    }

    const orderNumber =
      generateOrderNumber();

    const { data: order, error: orderError } =
      await supabase
        .from("orders")
        .insert({
          user_id: currentUserId,
          order_number: orderNumber,
          order_type: "ADD_ON",
          status: "ORDER RECEIVED",
          total_amount: total,
        })
        .select(
          "id, order_number"
        )
        .single();

    if (orderError || !order) {
      console.error(
        "Unable to create add-on order:",
        orderError?.message
      );

      return;
    }

    const orderItems = cartItems.map(
      (item) => ({
        order_id: order.id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
      })
    );

    const { error: itemError } =
      await supabase
        .from("order_items")
        .insert(orderItems);

    if (itemError) {
      console.error(
        "Unable to create add-on order items:",
        itemError.message
      );

      return;
    }

    setConfirmedBeverage("");
    setConfirmedItems(cartItems);
    setConfirmedTotal(total);
    setOrderId(order.order_number);
    setConfirmationType("addon");
    setCart({});

    await loadOrderHistory(
      currentUserId
    );
  };

  const closeConfirmation = () => {
    setConfirmationType(null);
    setOrderId("");
    setConfirmedBeverage("");
    setConfirmedItems([]);
    setConfirmedTotal(0);
  };

  const calculateExtendedEndDate = () => {
    const newEndDate = new Date(endDate);

    newEndDate.setMonth(
      newEndDate.getMonth() + 1
    );

    return newEndDate;
  };

  const extendMembership = () => {
    setExtendConfirmed(true);
  };

  const closeExtend = () => {
    setExtendOpen(false);
    setExtendConfirmed(false);
  };

  const handleSignOut = async () => {
    await stopScanner();

    await supabase.auth.signOut();

    router.replace("/sign-in");
    router.refresh();
  };

  const extendedEndDate =
    calculateExtendedEndDate();

  if (loadingMember) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.welcome}>
            <p className={styles.eyebrow}>
              DECKSIDE MEMBERSHIP
            </p>

            <h1>
              Loading your membership...
            </h1>

            <p className={styles.welcomeText}>
              Please wait a moment.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <nav className={styles.navbar}>
        <a
          href="/"
          className={styles.logo}
        >
          Deckside
        </a>

        <div className={styles.navLinks}>
          <a href="/menu">
            MENU
          </a>

          <a href="/dashboard">
            DASHBOARD
          </a>

          <button
            type="button"
            onClick={handleSignOut}
          >
            SIGN OUT
          </button>
        </div>
      </nav>

      <div className={styles.container}>
        <section className={styles.welcome}>
          <p className={styles.eyebrow}>
            DECKSIDE MEMBERSHIP
          </p>

          <h1>
            Welcome,{" "}
            {memberTitle
              ? `${memberTitle} `
              : ""}
            {memberName}
          </h1>

          <p className={styles.welcomeText}>
            Manage your membership and orders.
          </p>
        </section>

        <section className={styles.membershipCard}>
          <div>
            <span>MEMBER ID</span>
            <strong>{memberId}</strong>
          </div>

          <div>
            <span>MEMBERSHIP STATUS</span>
            <strong className={styles.active}>
              {membershipStatus}
            </strong>
          </div>

          <div>
            <span>START DATE</span>
            <strong>
              {formatDate(startDate)}
            </strong>
          </div>

          <div>
            <span>END DATE</span>
            <strong>
              {formatDate(endDate)}
            </strong>
          </div>

          <button
            className={styles.extendButton}
            onClick={() =>
              setExtendOpen(true)
            }
          >
            EXTEND MEMBERSHIP
          </button>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>
                MEMBER BENEFIT
              </p>

              <h2>
                Complimentary Beverage
              </h2>
            </div>

            <span
              className={`${styles.badge} ${
                claimWindowOpen
                  ? styles.badgeAvailable
                  : styles.badgeClosed
              }`}
            >
              {claimWindowOpen
                ? "15:00 – 19:00 WIB"
                : "AVAILABLE 15:00 – 19:00 WIB"}
            </span>
          </div>

          {!claimWindowOpen ? (
            <div className={styles.lockedBox}>
              <p className={styles.lockedLabel}>
                CURRENTLY UNAVAILABLE
              </p>

              <h3>
                Complimentary Beverage
              </h3>

              <p>
                Your complimentary beverage can
                be claimed only from 15:00–19:00 WIB.
                Please return during the claim period.
              </p>

              <button
                className={styles.primaryButton}
                disabled
              >
                SCAN AVAILABLE 15:00–19:00 WIB
              </button>
            </div>
          ) : claimedToday ? (
            <div className={styles.lockedBox}>
              <p className={styles.lockedLabel}>
                CLAIMED TODAY
              </p>

              <h3>
                {claimedBeverage}
              </h3>

              <p>
                Your complimentary beverage for
                today has already been claimed.
              </p>

              <div className={styles.claimedStatus}>
                <span>✓</span>

                <div>
                  <strong>
                    CLAIM COMPLETED
                  </strong>

                  <p>
                    You can claim another
                    complimentary beverage
                    tomorrow.
                  </p>
                </div>
              </div>

              <button
                className={styles.primaryButton}
                disabled
              >
                CLAIMED TODAY
              </button>
            </div>
          ) : !qrScanned ? (
            <div className={styles.lockedBox}>
              <p className={styles.lockedLabel}>
                LOCKED
              </p>

              <h3>
                Claim Your Complimentary Beverage
              </h3>

              <p>
                Please visit the cashier and scan
                the Deckside QR code to unlock
                today&apos;s complimentary beverage.
              </p>

              <button
                className={styles.primaryButton}
                onClick={startScanner}
              >
                SCAN QR AT CASHIER
              </button>

              {scanError && (
                <p className={styles.error}>
                  {scanError}
                </p>
              )}

              {scannerOpen && (
                <div className={styles.scanner}>
                  <div
                    id="deckside-qr-reader"
                    className={styles.qrReader}
                  />

                  {scanError && (
                    <p className={styles.error}>
                      {scanError}
                    </p>
                  )}

                  <button
                    className={styles.closeButton}
                    onClick={stopScanner}
                  >
                    CLOSE CAMERA
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.unlockedBox}>
              <div className={styles.available}>
                <span>AVAILABLE</span>

                <p>
                  Select one complimentary
                  beverage for today.
                </p>
              </div>

              <div className={styles.horizontalGrid}>
                {memberBeverages.map((item) => {
                  const selected =
                    selectedBeverage === item.id;

                  return (
                    <button
                      key={item.id}
                      className={`${styles.beverageCard} ${
                        selected
                          ? styles.selected
                          : ""
                      }`}
                      onClick={() => {
                        if (
                          claimWindowOpen &&
                          qrScanned &&
                          !claimedToday
                        ) {
                          setSelectedBeverage(
                            item.id
                          );
                        }
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                      />

                      <div>
                        <h3>{item.name}</h3>

                        {selected && (
                          <span
                            className={
                              styles.selectedText
                            }
                          >
                            SELECTED
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                className={styles.primaryButton}
                disabled={
                  !selectedBeverage ||
                  !claimWindowOpen ||
                  !qrScanned ||
                  claimedToday
                }
                onClick={confirmBeverage}
              >
                CONFIRM BEVERAGE
              </button>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>
                MEMBER PRIVILEGE
              </p>

              <h2>Add-ons</h2>
            </div>

            <span className={styles.badge}>
              21% OFF
            </span>
          </div>

          <div className={styles.addonCategory}>
            <div className={styles.addonCategoryHeader}>
              <h3>
                Appetizers & Snack
              </h3>

              <span>
                12 items
              </span>
            </div>

            <div className={styles.addonList}>
              {appetizerSnacks.map(
                (item: Addon) => {
                  const quantity =
                    cart[item.id] || 0;

                  return (
                    <div
                      key={item.id}
                      className={styles.addonItem}
                    >
                      <div className={styles.addonInfo}>
                        <h3>{item.name}</h3>

                        <p>
                          {item.description}
                        </p>
                      </div>

                      <div className={styles.addonOrder}>
                        <div className={styles.addonPrices}>
                          <span
                            className={
                              styles.originalPrice
                            }
                          >
                            {formatRupiah(
                              item.price
                            )}
                          </span>

                          <strong>
                            {formatRupiah(
                              memberPrice(
                                item.price
                              )
                            )}
                          </strong>

                          <span
                            className={
                              styles.memberPriceLabel
                            }
                          >
                            Member price
                          </span>
                        </div>

                        {quantity === 0 ? (
                          <button
                            className={
                              styles.secondaryButton
                            }
                            onClick={() =>
                              increaseQuantity(
                                item.id
                              )
                            }
                          >
                            ADD TO ORDER
                          </button>
                        ) : (
                          <div
                            className={
                              styles.quantity
                            }
                          >
                            <button
                              onClick={() =>
                                decreaseQuantity(
                                  item.id
                                )
                              }
                            >
                              −
                            </button>

                            <span>
                              {quantity}
                            </span>

                            <button
                              onClick={() =>
                                increaseQuantity(
                                  item.id
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <div className={styles.addonCategory}>
            <div className={styles.addonCategoryHeader}>
              <h3>
                Beverages
              </h3>

              <span>
                10 items
              </span>
            </div>

            <div className={styles.addonList}>
              {addonBeverages.map(
                (item: Addon) => {
                  const quantity =
                    cart[item.id] || 0;

                  return (
                    <div
                      key={item.id}
                      className={styles.addonItem}
                    >
                      <div className={styles.addonInfo}>
                        <h3>{item.name}</h3>

                        <p>
                          {item.description}
                        </p>
                      </div>

                      <div className={styles.addonOrder}>
                        <div className={styles.addonPrices}>
                          <span
                            className={
                              styles.originalPrice
                            }
                          >
                            {formatRupiah(
                              item.price
                            )}
                          </span>

                          <strong>
                            {formatRupiah(
                              memberPrice(
                                item.price
                              )
                            )}
                          </strong>

                          <span
                            className={
                              styles.memberPriceLabel
                            }
                          >
                            Member price
                          </span>
                        </div>

                        {quantity === 0 ? (
                          <button
                            className={
                              styles.secondaryButton
                            }
                            onClick={() =>
                              increaseQuantity(
                                item.id
                              )
                            }
                          >
                            ADD TO ORDER
                          </button>
                        ) : (
                          <div
                            className={
                              styles.quantity
                            }
                          >
                            <button
                              onClick={() =>
                                decreaseQuantity(
                                  item.id
                                )
                              }
                            >
                              −
                            </button>

                            <span>
                              {quantity}
                            </span>

                            <button
                              onClick={() =>
                                increaseQuantity(
                                  item.id
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {cartItems.length > 0 && (
          <section className={styles.orderSection}>
            <div className={styles.orderCard}>
              <p className={styles.eyebrow}>
                YOUR ORDER
              </p>

              <h2>
                Order Summary
              </h2>

              <div className={styles.items}>
                {cartItems.map(
                  (item, index) => (
                    <div
                      className={styles.item}
                      key={index}
                    >
                      <div>
                        <span>
                          {item.name}
                        </span>

                        <small>
                          Qty {item.quantity}
                        </small>
                      </div>

                      <span>
                        {formatRupiah(
                          item.price *
                            item.quantity
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>

              <div className={styles.priceLine}>
                <span>
                  Subtotal
                </span>

                <span>
                  {formatRupiah(subtotal)}
                </span>
              </div>

              <div className={styles.priceLine}>
                <span>
                  Service Charge (10%)
                </span>

                <span>
                  {formatRupiah(
                    serviceCharge
                  )}
                </span>
              </div>

              <div className={styles.priceLine}>
                <span>
                  Tax (11%)
                </span>

                <span>
                  {formatRupiah(tax)}
                </span>
              </div>

              <div className={styles.total}>
                <span>
                  Total
                </span>

                <strong>
                  {formatRupiah(total)}
                </strong>
              </div>

              <button
                className={styles.primaryButton}
                onClick={placeAddonOrder}
              >
                PLACE ORDER
              </button>
            </div>
          </section>
        )}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>
                ACTIVITY
              </p>

              <h2>
                Order History
              </h2>
            </div>
          </div>

          <div className={styles.history}>
            {loadingHistory ? (
              <div className={styles.historyRow}>
                <div>
                  <strong>
                    Loading orders...
                  </strong>

                  <span>
                    Please wait a moment.
                  </span>
                </div>
              </div>
            ) : orderHistory.length === 0 ? (
              <div className={styles.historyRow}>
                <div>
                  <strong>
                    No orders yet
                  </strong>

                  <span>
                    Your order history will appear here.
                  </span>
                </div>
              </div>
            ) : (
              orderHistory.map((order) => (
                <div
                  className={styles.historyRow}
                  key={order.id}
                >
                  <div>
                    <strong>
                      {order.items.length > 0
                        ? order.items
                            .map((item) =>
                              item.quantity > 1
                                ? `${item.name} × ${item.quantity}`
                                : item.name
                            )
                            .join(", ")
                        : order.orderType ===
                          "COMPLIMENTARY_BEVERAGE"
                        ? "Complimentary Beverage"
                        : "Add-on Order"}
                    </strong>

                    <span>
                      {order.orderType ===
                      "COMPLIMENTARY_BEVERAGE"
                        ? "Complimentary Beverage"
                        : "Add-on Order"}
                    </span>

                    <small>
                      {order.orderNumber}
                    </small>
                  </div>

                  <div>
                    <span>
                      {formatDateTime(
                        order.createdAt
                      )}
                    </span>

                    <strong
                      className={
                        order.status ===
                        "DELIVERED"
                          ? styles.delivered
                          : undefined
                      }
                    >
                      {order.status}
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {confirmationType && (
        <div className={styles.overlay}>
          <div className={styles.confirmation}>
            <button
              className={
                styles.confirmationClose
              }
              onClick={closeConfirmation}
              aria-label="Close"
            >
              ×
            </button>

            <div className={styles.check}>
              ✓
            </div>

            <p
              className={
                styles.confirmationEyebrow
              }
            >
              ORDER RECEIVED
            </p>

            <h2>
              Thank You,{" "}
              {memberTitle
                ? `${memberTitle} `
                : ""}
              {memberName.split(" ")[0]}
            </h2>

            {confirmationType ===
            "beverage" ? (
              <>
                <p
                  className={
                    styles.confirmationText
                  }
                >
                  Your complimentary
                  beverage has been
                  ordered.
                </p>

                <p
                  className={
                    styles.confirmationText
                  }
                >
                  Please wait while we
                  prepare your beverage.
                  It will be delivered
                  to your table.
                </p>
              </>
            ) : (
              <>
                <p
                  className={
                    styles.confirmationText
                  }
                >
                  Your order has been
                  received.
                </p>

                <p
                  className={
                    styles.confirmationText
                  }
                >
                  Please wait while we
                  prepare your order. It
                  will be delivered to
                  your table.
                </p>
              </>
            )}

            <div className={styles.orderInfo}>
              <div>
                <span>
                  ORDER ID
                </span>

                <strong>
                  {orderId}
                </strong>
              </div>

              <div>
                <span>
                  STATUS
                </span>

                <strong>
                  ORDER RECEIVED
                </strong>
              </div>

              <div>
                <span>
                  PREPARATION
                </span>

                <strong>
                  10–15 MINUTES
                </strong>
              </div>
            </div>

            <div
              className={
                styles.confirmationDetails
              }
            >
              <h3>
                ORDER DETAILS
              </h3>

              {confirmationType ===
                "beverage" &&
                confirmedBeverage && (
                  <div
                    className={
                      styles.confirmationItem
                    }
                  >
                    <span>
                      {confirmedBeverage}
                    </span>

                    <span>
                      Complimentary
                    </span>
                  </div>
                )}

              {confirmationType ===
                "addon" &&
                confirmedItems.map(
                  (item, index) => (
                    <div
                      className={
                        styles.confirmationItem
                      }
                      key={index}
                    >
                      <div>
                        <span>
                          {item.name}
                        </span>

                        <small>
                          Qty{" "}
                          {item.quantity}
                        </small>
                      </div>

                      <span>
                        {formatRupiah(
                          item.price *
                            item.quantity
                        )}
                      </span>
                    </div>
                  )
                )}

              {confirmationType ===
                "addon" && (
                <div
                  className={
                    styles.confirmationTotal
                  }
                >
                  <span>
                    TOTAL
                  </span>

                  <strong>
                    {formatRupiah(
                      confirmedTotal
                    )}
                  </strong>
                </div>
              )}
            </div>

            <button
              className={styles.primaryButton}
              onClick={closeConfirmation}
            >
              BACK TO DASHBOARD
            </button>
          </div>
        </div>
      )}

      {extendOpen && (
        <div className={styles.overlay}>
          <div className={styles.extendCard}>
            <button
              className={
                styles.confirmationClose
              }
              onClick={closeExtend}
              aria-label="Close"
            >
              ×
            </button>

            {!extendConfirmed ? (
              <>
                <p
                  className={
                    styles.confirmationEyebrow
                  }
                >
                  MEMBERSHIP RENEWAL
                </p>

                <h2>
                  Extend Your Membership
                </h2>

                <p
                  className={
                    styles.confirmationText
                  }
                >
                  Continue enjoying
                  your Deckside
                  membership benefits.
                </p>

                <div
                  className={
                    styles.currentMembership
                  }
                >
                  <span>
                    CURRENT MEMBERSHIP
                  </span>

                  <strong>
                    {formatDate(
                      startDate
                    )}{" "}
                    –{" "}
                    {formatDate(
                      endDate
                    )}
                  </strong>
                </div>

                <div
                  className={
                    styles.extensionPlan
                  }
                >
                  <strong>
                    1 MONTH
                  </strong>

                  <span>
                    Extend for one month
                  </span>
                </div>

                <div
                  className={
                    styles.extensionSummary
                  }
                >
                  <div>
                    <span>
                      MEMBER ID
                    </span>

                    <strong>
                      {memberId}
                    </strong>
                  </div>

                  <div>
                    <span>
                      CURRENT END DATE
                    </span>

                    <strong>
                      {formatDate(
                        endDate
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      NEW END DATE
                    </span>

                    <strong>
                      {formatDate(
                        extendedEndDate
                      )}
                    </strong>
                  </div>
                </div>

                <button
                  className={
                    styles.primaryButton
                  }
                  onClick={
                    extendMembership
                  }
                >
                  CONTINUE TO PAYMENT
                </button>
              </>
            ) : (
              <>
                <div className={styles.check}>
                  ✓
                </div>

                <p
                  className={
                    styles.confirmationEyebrow
                  }
                >
                  RENEWAL REQUEST
                </p>

                <h2>
                  Membership Extension
                </h2>

                <p
                  className={
                    styles.confirmationText
                  }
                >
                  Your membership extension
                  request has been created.
                </p>

                <div
                  className={
                    styles.extensionSummary
                  }
                >
                  <div>
                    <span>
                      MEMBER ID
                    </span>

                    <strong>
                      {memberId}
                    </strong>
                  </div>

                  <div>
                    <span>
                      EXTENSION
                    </span>

                    <strong>
                      1 MONTH
                    </strong>
                  </div>

                  <div>
                    <span>
                      NEW END DATE
                    </span>

                    <strong>
                      {formatDate(
                        extendedEndDate
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      STATUS
                    </span>

                    <strong>
                      PAYMENT PENDING
                    </strong>
                  </div>
                </div>

                <p
                  className={
                    styles.confirmationText
                  }
                >
                  Please complete the payment.
                  Your membership will be
                  extended after the payment has
                  been verified by the Deckside
                  team.
                </p>

                <button
                  className={
                    styles.primaryButton
                  }
                  onClick={closeExtend}
                >
                  BACK TO DASHBOARD
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}