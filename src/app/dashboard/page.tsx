"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { createClient } from "../../lib/supabase/client";
import styles from "./page.module.css";

type MembershipStatus = "PENDING" | "ACTIVE" | "EXPIRED";
type PaymentStatus = "PENDING" | "VERIFIED";

type Profile = {
  id: string;
  title: string | null;
  full_name: string;
  email: string;
  member_id: string;
  role: "member" | "admin";
};

type Membership = {
  id: string;
  user_id: string;
  status: MembershipStatus;
  payment_status: PaymentStatus;
  start_date: string | null;
  end_date: string | null;
};

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: "FOOD" | "BEVERAGE";
};

type HistoryItem = {
  item_name: string;
  quantity: number;
  unit_price: number;
};

type HistoryOrder = {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: HistoryItem[];
};

const memberBeverages = [
  {
    id: 1,
    name: "Lemon Peach Ice Tea",
    image: "/images/menu_1.png",
  },
  {
    id: 3,
    name: "Mango Matcha Latte",
    image: "/images/menu_3.png",
  },
  {
    id: 4,
    name: "Strawberry Splash",
    image: "/images/menu_4.png",
  },
  {
    id: 5,
    name: "Coffee Boom",
    image: "/images/menu_5.png",
  },
  {
    id: 6,
    name: "Matcha Passion",
    image: "/images/menu_6.png",
  },
  {
    id: 7,
    name: "Sun Kiss Coffee",
    image: "/images/menu_7.png",
  },
  {
    id: 8,
    name: "Butterscotch Creamy Latte",
    image: "/images/menu_8.png",
  },
];

const foodAddons = [
  { id: 101, name: "French Fries", price: 35000 },
  { id: 102, name: "Chicken Wings", price: 45000 },
  { id: 103, name: "Chicken Popcorn", price: 40000 },
  { id: 104, name: "Onion Rings", price: 35000 },
  { id: 105, name: "Nachos", price: 40000 },
  { id: 106, name: "Club Sandwich", price: 55000 },
  { id: 107, name: "Beef Burger", price: 65000 },
  { id: 108, name: "Chicken Sandwich", price: 50000 },
  { id: 109, name: "Caesar Salad", price: 50000 },
  { id: 110, name: "Chocolate Cake", price: 40000 },
  { id: 111, name: "Cheese Cake", price: 45000 },
  { id: 112, name: "Croissant", price: 30000 },
];

const beverageAddons = [
  { id: 201, name: "Americano", price: 35000 },
  { id: 202, name: "Cappuccino", price: 40000 },
  { id: 203, name: "Cafe Latte", price: 40000 },
  { id: 204, name: "Mocha", price: 45000 },
  { id: 205, name: "Matcha Latte", price: 45000 },
  { id: 206, name: "Chocolate", price: 40000 },
  { id: 207, name: "Iced Tea", price: 25000 },
  { id: 208, name: "Lemon Tea", price: 30000 },
  { id: 209, name: "Mineral Water", price: 15000 },
  { id: 210, name: "Orange Juice", price: 35000 },
];

const CLAIM_QR_VALUE = "DECKSIDE-CLAIM-BEVERAGE";
const DISCOUNT_RATE = 0.21;
const SERVICE_RATE = 0.1;
const TAX_RATE = 0.11;

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function getJakartaDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isBeverageClaimTime() {
  const current = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  const [hour, minute] = current.split(":").map(Number);
  const totalMinutes = hour * 60 + minute;

  return totalMinutes >= 15 * 60 && totalMinutes <= 19 * 60;
}

function generateOrderNumber() {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("-", "");

  const random = Math.floor(1000 + Math.random() * 9000);

  return `DSK-${date}-${random}`;
}

export default function Dashboard() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [memberTitle, setMemberTitle] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberId, setMemberId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const [membershipStatus, setMembershipStatus] =
    useState<MembershipStatus>("PENDING");

  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("PENDING");

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const [claimWindowOpen, setClaimWindowOpen] = useState(false);
  const [claimedToday, setClaimedToday] = useState(false);
  const [claimedBeverage, setClaimedBeverage] = useState("");

  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [scanError, setScanError] = useState("");

  const [selectedBeverage, setSelectedBeverage] =
    useState<number | null>(null);

  const [cart, setCart] = useState<Record<number, number>>({});

  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const [confirmationType, setConfirmationType] =
    useState<"beverage" | "addon">("beverage");

  const [orderId, setOrderId] = useState("");
  const [confirmedBeverage, setConfirmedBeverage] = useState("");
  const [confirmedItems, setConfirmedItems] = useState<CartItem[]>([]);
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  const [orderHistory, setOrderHistory] = useState<HistoryOrder[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [extendOpen, setExtendOpen] = useState(false);
  const [extendConfirmed, setExtendConfirmed] = useState(false);

  const isActiveMember =
    membershipStatus === "ACTIVE" &&
    paymentStatus === "VERIFIED";

  const refreshClaimWindow = () => {
    setClaimWindowOpen(isBeverageClaimTime());
  };

  const loadProfile = async (userId: string) => {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, title, full_name, email, member_id, role")
      .eq("id", userId)
      .limit(1);

    if (profileError) {
      setError(
        "Unable to load your profile. Please try again or contact the Deckside team."
      );
      setLoading(false);
      return null;
    }

    if (!data || data.length === 0) {
      setError(
        "Your account profile has not been created yet. Please contact the Deckside team."
      );
      setLoading(false);
      return null;
    }

    const row = data[0];

    const profile: Profile = {
      id: String(row.id),
      title: row.title ?? null,
      full_name: String(row.full_name ?? ""),
      email: String(row.email ?? ""),
      member_id: String(row.member_id ?? ""),
      role: row.role === "admin" ? "admin" : "member",
    };

    if (profile.role === "admin") {
      router.replace("/admin");
      return null;
    }

    setMemberTitle(profile.title || "");
    setMemberName(profile.full_name);
    setMemberEmail(profile.email);
    setMemberId(profile.member_id);
    setCurrentUserId(profile.id);

    return profile;
  };

  const loadMembership = async (userId: string) => {
    const { data, error: membershipError } = await supabase
      .from("memberships")
      .select(
        "id, user_id, status, payment_status, start_date, end_date"
      )
      .eq("user_id", userId)
      .limit(1);

    if (membershipError) {
      setMembershipStatus("PENDING");
      setPaymentStatus("PENDING");
      setStartDate(null);
      setEndDate(null);
      return;
    }

    if (!data || data.length === 0) {
      setMembershipStatus("PENDING");
      setPaymentStatus("PENDING");
      setStartDate(null);
      setEndDate(null);
      return;
    }

    const row = data[0];

    const membership: Membership = {
      id: String(row.id),
      user_id: String(row.user_id),
      status:
        row.status === "ACTIVE"
          ? "ACTIVE"
          : row.status === "EXPIRED"
            ? "EXPIRED"
            : "PENDING",
      payment_status:
        row.payment_status === "VERIFIED"
          ? "VERIFIED"
          : "PENDING",
      start_date: row.start_date ?? null,
      end_date: row.end_date ?? null,
    };

    let status = membership.status;

    if (status === "ACTIVE" && membership.end_date) {
      const today = getJakartaDateKey();

      if (today > membership.end_date) {
        status = "EXPIRED";

        await supabase
          .from("memberships")
          .update({
            status: "EXPIRED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", membership.id);
      }
    }

    setMembershipStatus(status);
    setPaymentStatus(membership.payment_status);
    setStartDate(membership.start_date);
    setEndDate(membership.end_date);
  };

  const loadTodayClaim = async (userId: string) => {
    const today = getJakartaDateKey();

    const { data, error: claimError } = await supabase
      .from("beverage_claims")
      .select("id, beverage_name, claim_date")
      .eq("user_id", userId)
      .eq("claim_date", today)
      .limit(1);

    if (claimError || !data || data.length === 0) {
      setClaimedToday(false);
      setClaimedBeverage("");
      return;
    }

    setClaimedToday(true);
    setClaimedBeverage(String(data[0].beverage_name));
  };

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

    if (ordersError || !orders || orders.length === 0) {
      setOrderHistory([]);
      setLoadingHistory(false);
      return;
    }

    const orderIds = orders.map((order) => order.id);

    const { data: items } = await supabase
      .from("order_items")
      .select(
        "order_id, item_name, quantity, unit_price"
      )
      .in("order_id", orderIds);

    const safeItems = items || [];

    const formattedOrders: HistoryOrder[] = orders.map(
      (order) => ({
        id: String(order.id),
        order_number: String(order.order_number),
        order_type: String(order.order_type),
        status: String(order.status),
        total_amount: Number(order.total_amount || 0),
        created_at: String(order.created_at),
        items: safeItems
          .filter(
            (item) => item.order_id === order.id
          )
          .map((item) => ({
            item_name: String(item.item_name),
            quantity: Number(item.quantity || 0),
            unit_price: Number(item.unit_price || 0),
          })),
      })
    );

    setOrderHistory(formattedOrders);
    setLoadingHistory(false);
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (!user) {
        router.replace("/sign-in");
        return;
      }

      const profile = await loadProfile(user.id);

      if (!mounted || !profile) {
        return;
      }

      await Promise.all([
        loadMembership(user.id),
        loadTodayClaim(user.id),
        loadOrderHistory(user.id),
      ]);

      if (!mounted) {
        return;
      }

      refreshClaimWindow();
      setLoading(false);
    };

    initialize();

    const interval = window.setInterval(
      refreshClaimWindow,
      30 * 1000
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);

      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => undefined);

        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scannerOpen) {
      return;
    }

    let cancelled = false;

    const startScanner = async () => {
      setScanError("");

      await new Promise((resolve) =>
        window.setTimeout(resolve, 150)
      );

      if (cancelled) {
        return;
      }

      const readerId = "deckside-qr-reader";
      const scanner = new Html5Qrcode(readerId);

      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          async (decodedText) => {
            if (decodedText.trim() !== CLAIM_QR_VALUE) {
              setScanError(
                "Invalid QR code. Please scan the Deckside cashier QR code."
              );
              return;
            }

            setQrScanned(true);
            setScanError("");

            try {
              await scanner.stop();
            } catch {
              // Nothing to do.
            }

            try {
              scanner.clear();
            } catch {
              // Nothing to do.
            }

            scannerRef.current = null;
            setScannerOpen(false);
          },
          () => {
            // QR scan frame without a valid result.
          }
        );
      } catch {
        if (!cancelled) {
          setScanError(
            "Unable to access the camera. Please allow camera permission and try again."
          );
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;

      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => undefined);

        try {
          scannerRef.current.clear();
        } catch {
          // Nothing to do.
        }

        scannerRef.current = null;
      }
    };
  }, [scannerOpen]);

  const openScanner = () => {
    setScanError("");

    if (!isActiveMember) {
      setScanError(
        "Your membership is not active yet."
      );
      return;
    }

    if (!claimWindowOpen) {
      setScanError(
        "Complimentary beverage claiming is available from 15:00 to 19:00 WIB."
      );
      return;
    }

    if (claimedToday) {
      setScanError(
        "You have already claimed your complimentary beverage today."
      );
      return;
    }

    setQrScanned(false);
    setScannerOpen(true);
  };

  const closeScanner = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .catch(() => undefined);

      try {
        scannerRef.current.clear();
      } catch {
        // Nothing to do.
      }

      scannerRef.current = null;
    }

    setScannerOpen(false);
    setQrScanned(false);
    setScanError("");
  };

  const confirmBeverage = async () => {
    if (selectedBeverage === null) {
      setScanError(
        "Please select one complimentary beverage."
      );
      return;
    }

    if (!isActiveMember) {
      setScanError(
        "Your membership is not active yet."
      );
      return;
    }

    if (!claimWindowOpen) {
      setScanError(
        "Complimentary beverage claiming is available from 15:00 to 19:00 WIB."
      );
      return;
    }

    if (!qrScanned) {
      setScanError(
        "Please scan the Deckside QR code first."
      );
      return;
    }

    if (claimedToday) {
      setScanError(
        "You have already claimed your complimentary beverage today."
      );
      return;
    }

    const beverage = memberBeverages.find(
      (item) => item.id === selectedBeverage
    );

    if (!beverage) {
      return;
    }

    setScanError("");

    const orderNumber = generateOrderNumber();

    const {
      data: orderData,
      error: orderError,
    } = await supabase
      .from("orders")
      .insert({
        user_id: currentUserId,
        order_number: orderNumber,
        order_type: "COMPLIMENTARY",
        status: "NEW",
        subtotal: 0,
        service_charge: 0,
        tax: 0,
        total_amount: 0,
      })
      .select("id")
      .limit(1);

    if (
      orderError ||
      !orderData ||
      orderData.length === 0
    ) {
      setScanError(
        orderError?.message ||
          "Unable to create your order."
      );
      return;
    }

    const createdOrder = orderData[0];

    const { error: itemError } = await supabase
      .from("order_items")
      .insert({
        order_id: createdOrder.id,
        item_name: beverage.name,
        quantity: 1,
        unit_price: 0,
        item_type: "COMPLIMENTARY",
      });

    if (itemError) {
      await supabase
        .from("orders")
        .delete()
        .eq("id", createdOrder.id);

      setScanError(
        "Unable to create your order item."
      );
      return;
    }

    const today = getJakartaDateKey();

    const { error: claimError } = await supabase
      .from("beverage_claims")
      .insert({
        user_id: currentUserId,
        order_id: createdOrder.id,
        beverage_name: beverage.name,
        claim_date: today,
      });

    if (claimError) {
      await supabase
        .from("order_items")
        .delete()
        .eq("order_id", createdOrder.id);

      await supabase
        .from("orders")
        .delete()
        .eq("id", createdOrder.id);

      if (claimError.code === "23505") {
        setClaimedToday(true);
        setScanError(
          "You have already claimed your complimentary beverage today."
        );
      } else {
        setScanError(
          "Unable to complete your beverage claim."
        );
      }

      return;
    }

    setClaimedToday(true);
    setClaimedBeverage(beverage.name);
    setQrScanned(false);
    setSelectedBeverage(null);

    setConfirmationType("beverage");
    setOrderId(orderNumber);
    setConfirmedBeverage(beverage.name);
    setConfirmedItems([]);
    setConfirmedTotal(0);
    setConfirmationOpen(true);

    await loadOrderHistory(currentUserId);
  };

  const getDiscountedPrice = (price: number) => {
    return Math.round(
      price * (1 - DISCOUNT_RATE)
    );
  };

  const getCartItems = (): CartItem[] => {
    const items: CartItem[] = [];

    [...foodAddons, ...beverageAddons].forEach(
      (item) => {
        const quantity = cart[item.id] || 0;

        if (quantity > 0) {
          items.push({
            id: item.id,
            name: item.name,
            price: getDiscountedPrice(item.price),
            quantity,
            type:
              item.id >= 200
                ? "BEVERAGE"
                : "FOOD",
          });
        }
      }
    );

    return items;
  };

  const updateCart = (
    itemId: number,
    quantity: number
  ) => {
    setCart((previous) => {
      const next = { ...previous };

      if (quantity <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = quantity;
      }

      return next;
    });
  };

  const cartItems = getCartItems();

  const subtotal = cartItems.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  const serviceCharge = Math.round(
    subtotal * SERVICE_RATE
  );

  const tax = Math.round(
    (subtotal + serviceCharge) * TAX_RATE
  );

  const cartTotal =
    subtotal + serviceCharge + tax;

  const placeAddonOrder = async () => {
    if (!isActiveMember) {
      setError(
        "Your membership must be active to place an order."
      );
      return;
    }

    if (cartItems.length === 0) {
      setError(
        "Please select at least one item."
      );
      return;
    }

    setError("");

    const orderNumber = generateOrderNumber();

    const {
      data: orderData,
      error: orderError,
    } = await supabase
      .from("orders")
      .insert({
        user_id: currentUserId,
        order_number: orderNumber,
        order_type: "ADD_ON",
        status: "NEW",
        subtotal,
        service_charge: serviceCharge,
        tax,
        total_amount: cartTotal,
      })
      .select("id")
      .limit(1);

    if (
      orderError ||
      !orderData ||
      orderData.length === 0
    ) {
      setError(
        orderError?.message ||
          "Unable to create your order."
      );
      return;
    }

    const createdOrder = orderData[0];

    const itemsToInsert = cartItems.map(
      (item) => ({
        order_id: createdOrder.id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        item_type: item.type,
      })
    );

    const { error: itemError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemError) {
      await supabase
        .from("orders")
        .delete()
        .eq("id", createdOrder.id);

      setError(
        "Unable to add the items to your order."
      );
      return;
    }

    setConfirmationType("addon");
    setOrderId(orderNumber);
    setConfirmedBeverage("");
    setConfirmedItems(cartItems);
    setConfirmedTotal(cartTotal);
    setConfirmationOpen(true);

    setCart({});

    await loadOrderHistory(currentUserId);
  };

  const extendMembership = async () => {
    if (!currentUserId) {
      return;
    }

    if (extendConfirmed) {
      setExtendOpen(false);
      return;
    }

    const requestedEndDate = new Date();

    requestedEndDate.setMonth(
      requestedEndDate.getMonth() + 1
    );

    const formattedDate = requestedEndDate
      .toISOString()
      .split("T")[0];

    const { error: extensionError } =
      await supabase
        .from("membership_extensions")
        .insert({
          user_id: currentUserId,
          requested_end_date: formattedDate,
          status: "PENDING",
        });

    if (extensionError) {
      setError(
        extensionError.message ||
          "Unable to submit membership extension."
      );
      return;
    }

    setExtendConfirmed(true);
  };

  const handleSignOut = async () => {
    if (scannerRef.current) {
      await scannerRef.current
        .stop()
        .catch(() => undefined);

      try {
        scannerRef.current.clear();
      } catch {
        // Nothing to do.
      }

      scannerRef.current = null;
    }

    await supabase.auth.signOut();

    router.replace("/sign-in");
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <nav className={styles.navbar}>
          <a href="/" className={styles.logo}>
            Deckside
          </a>
        </nav>

        <div className={styles.container}>
          <section className={styles.lockedBox}>
            <p className={styles.lockedLabel}>
              DECKSIDE MEMBERSHIP
            </p>

            <h3>Loading Your Dashboard</h3>

            <p>
              Please wait while we load your
              membership information.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <nav className={styles.navbar}>
          <a href="/" className={styles.logo}>
            Deckside
          </a>
        </nav>

        <div className={styles.container}>
          <section className={styles.lockedBox}>
            <p className={styles.lockedLabel}>
              PROFILE ERROR
            </p>

            <h3>Unable to Load Your Profile</h3>

            <p>{error}</p>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={() =>
                window.location.reload()
              }
            >
              TRY AGAIN
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <nav className={styles.navbar}>
        <a href="/" className={styles.logo}>
          Deckside
        </a>

        <div className={styles.navLinks}>
          <a href="/">HOME</a>

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
            DECKSIDE MEMBER
          </p>

          <h1>
            Welcome{" "}
            {memberTitle
              ? `${memberTitle
                  .charAt(0)
                  .toUpperCase()}${memberTitle.slice(1)}`
              : ""}{" "}
            {memberName}
          </h1>

          <p>
            Your cozy corner for your productive
            space.
          </p>
        </section>

        <section className={styles.membershipCard}>
          <div>
            <p className={styles.eyebrow}>
              MEMBERSHIP
            </p>

            <h2>Deckside Member</h2>

            <p>
              Member ID:{" "}
              <strong>{memberId}</strong>
            </p>

            <p>{memberEmail}</p>
          </div>

          <div>
            <p className={styles.eyebrow}>
              STATUS
            </p>

            <h3>{membershipStatus}</h3>

            <p>
              Payment: {paymentStatus}
            </p>

            {startDate && (
              <p>
                Valid from:{" "}
                {formatDate(startDate)}
              </p>
            )}

            {endDate && (
              <p>
                Valid until:{" "}
                {formatDate(endDate)}
              </p>
            )}

            {(membershipStatus === "EXPIRED" ||
              (membershipStatus === "PENDING" &&
                paymentStatus === "VERIFIED")) && (
              <button
                type="button"
                className={styles.extendButton}
                onClick={() => {
                  setExtendOpen(true);
                  setExtendConfirmed(false);
                }}
              >
                EXTEND MEMBERSHIP
              </button>
            )}
          </div>
        </section>

        {!isActiveMember && (
          <section className={styles.section}>
            <div className={styles.lockedBox}>
              <p className={styles.lockedLabel}>
                MEMBERSHIP NOT ACTIVE
              </p>

              <h3>
                Your Membership Is{" "}
                {membershipStatus === "PENDING"
                  ? "Pending Verification"
                  : membershipStatus}
              </h3>

              <p>
                {paymentStatus === "PENDING"
                  ? "Please wait for the Deckside team to verify your payment."
                  : membershipStatus === "EXPIRED"
                    ? "Your membership has expired. Please extend your membership to continue using member benefits."
                    : "Your membership will become active after the activation process is completed."}
              </p>
            </div>
          </section>
        )}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>
                MEMBER BENEFIT
              </p>

              <h2>Complimentary Beverage</h2>
            </div>

            <span
              className={
                claimWindowOpen
                  ? styles.badgeAvailable
                  : styles.badgeClosed
              }
            >
              {claimWindowOpen
                ? "15:00 – 19:00 WIB"
                : "CLOSED"}
            </span>
          </div>

          {!isActiveMember ? (
            <div className={styles.lockedBox}>
              <p className={styles.lockedLabel}>
                LOCKED
              </p>

              <h3>Activate Your Membership</h3>

              <p>
                Complimentary beverage benefits
                are available only for active
                members.
              </p>
            </div>
          ) : claimedToday ? (
            <div className={styles.claimedStatus}>
              <p className={styles.lockedLabel}>
                CLAIM COMPLETED
              </p>

              <h3>
                Your Beverage Has Been Claimed
              </h3>

              <p>
                Today&apos;s complimentary
                beverage:{" "}
                <strong>{claimedBeverage}</strong>
              </p>

              <p>
                You can claim one complimentary
                beverage every day from 15:00 to
                19:00 WIB.
              </p>
            </div>
          ) : !claimWindowOpen ? (
            <div className={styles.lockedBox}>
              <p className={styles.lockedLabel}>
                BENEFIT CLOSED
              </p>

              <h3>
                Come Back Between 15:00 – 19:00
              </h3>

              <p>
                Your complimentary beverage can
                be claimed every day during the
                claim window.
              </p>
            </div>
          ) : (
            <div className={styles.unlockedBox}>
              <div className={styles.available}>
                <p className={styles.lockedLabel}>
                  AVAILABLE TODAY
                </p>

                <p>
                  Select one beverage, then scan
                  the Deckside QR code at the
                  cashier.
                </p>
              </div>

              <div className={styles.horizontalGrid}>
                {memberBeverages.map((beverage) => (
                  <button
                    key={beverage.id}
                    type="button"
                    className={`${styles.beverageCard} ${
                      selectedBeverage === beverage.id
                        ? styles.selected
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedBeverage(beverage.id)
                    }
                  >
                    <img
                      src={beverage.image}
                      alt={beverage.name}
                    />

                    <div>
                      <h3>{beverage.name}</h3>

                      {selectedBeverage ===
                        beverage.id && (
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
                ))}
              </div>

              {selectedBeverage !== null && (
                <div className={styles.scanner}>
                  {!qrScanned ? (
                    <>
                      <p>
                        Scan the Deckside QR code
                        at the cashier before
                        confirming your beverage.
                      </p>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={openScanner}
                      >
                        SCAN QR CODE
                      </button>
                    </>
                  ) : (
                    <>
                      <p>
                        QR code verified. Your
                        complimentary beverage is
                        ready to be claimed.
                      </p>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={confirmBeverage}
                      >
                        CLAIM BEVERAGE
                      </button>
                    </>
                  )}

                  {scanError && (
                    <p className={styles.error}>
                      {scanError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>
                MEMBER PRIVILEGE
              </p>

              <h2>Food & Beverage Add-ons</h2>
            </div>

            <span className={styles.badgeAvailable}>
              21% MEMBER DISCOUNT
            </span>
          </div>

          {!isActiveMember ? (
            <div className={styles.lockedBox}>
              <p className={styles.lockedLabel}>
                LOCKED
              </p>

              <h3>Member Ordering Is Locked</h3>

              <p>
                Activate your membership to access
                member pricing and ordering.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.addonCategory}>
                <div className={styles.addonCategoryHeader}>
                  <div>
                    <p className={styles.lockedLabel}>
                      FOOD
                    </p>

                    <h3>Snacks & Meals</h3>
                  </div>
                </div>

                <div className={styles.addonList}>
                  {foodAddons.map((item) => {
                    const quantity = cart[item.id] || 0;
                    const memberPrice =
                      getDiscountedPrice(item.price);

                    return (
                      <div
                        key={item.id}
                        className={styles.addonItem}
                      >
                        <div className={styles.addonInfo}>
                          <h4>{item.name}</h4>

                          <div
                            className={styles.addonPrices}
                          >
                            <span
                              className={
                                styles.originalPrice
                              }
                            >
                              {formatRupiah(item.price)}
                            </span>

                            <span>
                              {formatRupiah(memberPrice)}
                            </span>
                          </div>

                          <small
                            className={
                              styles.memberPriceLabel
                            }
                          >
                            Member price
                          </small>
                        </div>

                        <div className={styles.addonOrder}>
                          <button
                            type="button"
                            className={
                              styles.secondaryButton
                            }
                            onClick={() =>
                              updateCart(
                                item.id,
                                quantity - 1
                              )
                            }
                            disabled={quantity === 0}
                          >
                            −
                          </button>

                          <span className={styles.quantity}>
                            {quantity}
                          </span>

                          <button
                            type="button"
                            className={
                              styles.secondaryButton
                            }
                            onClick={() =>
                              updateCart(
                                item.id,
                                quantity + 1
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.addonCategory}>
                <div className={styles.addonCategoryHeader}>
                  <div>
                    <p className={styles.lockedLabel}>
                      BEVERAGE
                    </p>

                    <h3>Additional Beverages</h3>
                  </div>
                </div>

                <div className={styles.addonList}>
                  {beverageAddons.map((item) => {
                    const quantity = cart[item.id] || 0;
                    const memberPrice =
                      getDiscountedPrice(item.price);

                    return (
                      <div
                        key={item.id}
                        className={styles.addonItem}
                      >
                        <div className={styles.addonInfo}>
                          <h4>{item.name}</h4>

                          <div
                            className={styles.addonPrices}
                          >
                            <span
                              className={
                                styles.originalPrice
                              }
                            >
                              {formatRupiah(item.price)}
                            </span>

                            <span>
                              {formatRupiah(memberPrice)}
                            </span>
                          </div>

                          <small
                            className={
                              styles.memberPriceLabel
                            }
                          >
                            Member price
                          </small>
                        </div>

                        <div className={styles.addonOrder}>
                          <button
                            type="button"
                            className={
                              styles.secondaryButton
                            }
                            onClick={() =>
                              updateCart(
                                item.id,
                                quantity - 1
                              )
                            }
                            disabled={quantity === 0}
                          >
                            −
                          </button>

                          <span className={styles.quantity}>
                            {quantity}
                          </span>

                          <button
                            type="button"
                            className={
                              styles.secondaryButton
                            }
                            onClick={() =>
                              updateCart(
                                item.id,
                                quantity + 1
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {cartItems.length > 0 && (
                <div className={styles.orderSection}>
                  <div className={styles.orderCard}>
                    <div className={styles.items}>
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className={styles.item}
                        >
                          <div>
                            <strong>{item.name}</strong>

                            <span>
                              {item.quantity} ×{" "}
                              {formatRupiah(item.price)}
                            </span>
                          </div>

                          <strong>
                            {formatRupiah(
                              item.price * item.quantity
                            )}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div className={styles.priceLine}>
                      <span>Subtotal</span>

                      <span>
                        {formatRupiah(subtotal)}
                      </span>
                    </div>

                    <div className={styles.priceLine}>
                      <span>
                        Service Charge 10%
                      </span>

                      <span>
                        {formatRupiah(serviceCharge)}
                      </span>
                    </div>

                    <div className={styles.priceLine}>
                      <span>Tax 11%</span>

                      <span>
                        {formatRupiah(tax)}
                      </span>
                    </div>

                    <div className={styles.total}>
                      <span>Total</span>

                      <strong>
                        {formatRupiah(cartTotal)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={placeAddonOrder}
                    >
                      PLACE ORDER
                    </button>

                    {error && (
                      <p className={styles.error}>
                        {error}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>
                ORDER HISTORY
              </p>

              <h2>Your Orders</h2>
            </div>
          </div>

          {loadingHistory ? (
            <div className={styles.lockedBox}>
              <p>
                Loading your order history...
              </p>
            </div>
          ) : orderHistory.length === 0 ? (
            <div className={styles.lockedBox}>
              <p className={styles.lockedLabel}>
                NO ORDERS
              </p>

              <h3>
                Your order history is empty.
              </h3>

              <p>
                Your Deckside orders will appear
                here once you place an order.
              </p>
            </div>
          ) : (
            <div className={styles.history}>
              {orderHistory.map((order) => (
                <div
                  key={order.id}
                  className={styles.historyRow}
                >
                  <div>
                    <p className={styles.lockedLabel}>
                      {order.order_number}
                    </p>

                    <h3>
                      {order.order_type ===
                      "COMPLIMENTARY"
                        ? "Complimentary Beverage"
                        : "Member Add-on Order"}
                    </h3>

                    <p>
                      {formatDateTime(
                        order.created_at
                      )}
                    </p>

                    {order.items.length > 0 && (
                      <p>
                        {order.items
                          .map(
                            (item) =>
                              `${item.item_name} × ${item.quantity}`
                          )
                          .join(", ")}
                      </p>
                    )}
                  </div>

                  <div>
                    <strong>
                      {formatRupiah(
                        order.total_amount
                      )}
                    </strong>

                    <p
                      className={
                        order.status === "DELIVERED"
                          ? styles.delivered
                          : ""
                      }
                    >
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {scannerOpen && (
        <div className={styles.overlay}>
          <div className={styles.confirmation}>
            <button
              type="button"
              className={styles.confirmationClose}
              onClick={closeScanner}
            >
              ×
            </button>

            <p className={styles.confirmationEyebrow}>
              DECKSIDE QR
            </p>

            <h2>Scan QR Code</h2>

            <p className={styles.confirmationText}>
              Scan the QR code displayed by the
              Deckside cashier.
            </p>

            <div
              id="deckside-qr-reader"
              className={styles.qrReader}
            />

            {scanError && (
              <p className={styles.error}>
                {scanError}
              </p>
            )}
          </div>
        </div>
      )}

      {confirmationOpen && (
        <div className={styles.overlay}>
          <div className={styles.confirmation}>
            <button
              type="button"
              className={styles.confirmationClose}
              onClick={() =>
                setConfirmationOpen(false)
              }
            >
              ×
            </button>

            <div className={styles.check}>
              ✓
            </div>

            <p className={styles.confirmationEyebrow}>
              THANK YOU
            </p>

            <h2>Order Confirmed</h2>

            <p className={styles.confirmationText}>
              Please wait while your order is being
              prepared and delivered to you.
            </p>

            <div className={styles.orderInfo}>
              <span>Order Number</span>

              <strong>{orderId}</strong>
            </div>

            {confirmationType === "beverage" ? (
              <div className={styles.confirmationDetails}>
                <p>Complimentary Beverage</p>

                <div className={styles.confirmationItem}>
                  <span>{confirmedBeverage}</span>

                  <strong>Complimentary</strong>
                </div>
              </div>
            ) : (
              <div className={styles.confirmationDetails}>
                {confirmedItems.map((item) => (
                  <div
                    key={item.id}
                    className={styles.confirmationItem}
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>

                    <strong>
                      {formatRupiah(
                        item.price * item.quantity
                      )}
                    </strong>
                  </div>
                ))}

                <div className={styles.confirmationTotal}>
                  <span>Total</span>

                  <strong>
                    {formatRupiah(confirmedTotal)}
                  </strong>
                </div>
              </div>
            )}

            <button
              type="button"
              className={styles.primaryButton}
              onClick={() =>
                setConfirmationOpen(false)
              }
            >
              DONE
            </button>
          </div>
        </div>
      )}

      {extendOpen && (
        <div className={styles.overlay}>
          <div
            className={`${styles.confirmation} ${styles.extendCard}`}
          >
            <button
              type="button"
              className={styles.confirmationClose}
              onClick={() =>
                setExtendOpen(false)
              }
            >
              ×
            </button>

            {!extendConfirmed ? (
              <>
                <p className={styles.confirmationEyebrow}>
                  MEMBERSHIP
                </p>

                <h2>Extend Your Membership</h2>

                <p className={styles.confirmationText}>
                  Submit an extension request to the
                  Deckside team.
                </p>

                <div
                  className={styles.currentMembership}
                >
                  <p>Current Membership</p>

                  <strong>
                    {membershipStatus}
                  </strong>

                  {endDate && (
                    <span>
                      Valid until{" "}
                      {formatDate(endDate)}
                    </span>
                  )}
                </div>

                <div className={styles.extensionPlan}>
                  <p>Extension Plan</p>

                  <strong>1 Month</strong>

                  <span>
                    The Deckside team will review and
                    verify your extension request.
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={extendMembership}
                >
                  SUBMIT REQUEST
                </button>
              </>
            ) : (
              <>
                <div className={styles.check}>
                  ✓
                </div>

                <p className={styles.confirmationEyebrow}>
                  REQUEST SUBMITTED
                </p>

                <h2>Thank You</h2>

                <p className={styles.confirmationText}>
                  Your membership extension request
                  has been submitted. The Deckside team
                  will verify your request.
                </p>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() =>
                    setExtendOpen(false)
                  }
                >
                  DONE
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}