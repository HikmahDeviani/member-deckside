"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { createClient } from "../../lib/supabase/client";
import styles from "./page.module.css";

type MembershipStatus = "PENDING" | "ACTIVE" | "EXPIRED";
type PaymentStatus = "PENDING" | "VERIFIED";

type ExtensionRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

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

type ExtensionRequest = {
  id: string;
  user_id: string;
  status: ExtensionRequestStatus;
  payment_status: PaymentStatus;
  requested_at: string;
  processed_at: string | null;
};

type Menu = {
  id: string | number;
  name: string;
  category: "FOOD" | "BEVERAGE";
  price: number;
  stock: number;
  is_available: boolean;
  image_url: string | null;
};

type CartItem = {
  id: string | number;
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


const legacyMenuItems: Menu[] = [
  { id: 101, name: "Blueberry Cheesecake", category: "FOOD", price: 58000, stock: 99, is_available: true, image_url: null },
  { id: 102, name: "Tofu Salt Chili", category: "FOOD", price: 48000, stock: 99, is_available: true, image_url: null },
  { id: 103, name: "Spring Roll Oakwood", category: "FOOD", price: 48000, stock: 99, is_available: true, image_url: null },
  { id: 104, name: "Mixed Sampler", category: "FOOD", price: 58000, stock: 99, is_available: true, image_url: null },
  { id: 105, name: "Chili Baba Fries with Cheese", category: "FOOD", price: 58000, stock: 99, is_available: true, image_url: null },
  { id: 106, name: "Cheese French Fries", category: "FOOD", price: 58000, stock: 99, is_available: true, image_url: null },
  { id: 107, name: "Crispy Corn Salted Egg", category: "FOOD", price: 58000, stock: 99, is_available: true, image_url: null },
  { id: 108, name: "Chicken Karage", category: "FOOD", price: 58000, stock: 99, is_available: true, image_url: null },
  { id: 109, name: "Fried Cakwe Prawn with Beef Floss", category: "FOOD", price: 58000, stock: 99, is_available: true, image_url: null },
  { id: 110, name: "Tempe Mendoan Sambal Kecap", category: "FOOD", price: 58000, stock: 99, is_available: true, image_url: null },
  { id: 111, name: "Pisang Goreng Gula Aren", category: "FOOD", price: 58000, stock: 99, is_available: true, image_url: null },
  { id: 112, name: "French Toast", category: "FOOD", price: 58000, stock: 99, is_available: true, image_url: null },
  { id: 201, name: "Matcha Colada", category: "BEVERAGE", price: 58000, stock: 99, is_available: true, image_url: "/images/menu_6.png" },
  { id: 202, name: "Butterscotch Creamy Latte", category: "BEVERAGE", price: 68000, stock: 99, is_available: true, image_url: null },
  { id: 203, name: "Sun Kiss Coffee", category: "BEVERAGE", price: 68000, stock: 99, is_available: true, image_url: "/images/menu_7.png" },
  { id: 204, name: "Mood Monday", category: "BEVERAGE", price: 68000, stock: 99, is_available: true, image_url: null },
  { id: 205, name: "Lemon Peach Iced Tea", category: "BEVERAGE", price: 58000, stock: 99, is_available: true, image_url: "/images/menu_1.png" },
  { id: 206, name: "Coffee Boom", category: "BEVERAGE", price: 68000, stock: 99, is_available: true, image_url: "/images/menu_5.png" },
  { id: 207, name: "Mango Matcha Latte", category: "BEVERAGE", price: 58000, stock: 99, is_available: true, image_url: "/images/menu_3.png" },
  { id: 208, name: "Matcha Passion", category: "BEVERAGE", price: 58000, stock: 99, is_available: true, image_url: null },
  { id: 209, name: "Strawberry Splash", category: "BEVERAGE", price: 58000, stock: 99, is_available: true, image_url: "/images/menu_4.png" },
  { id: 210, name: "Salted Caramel Crème Brule", category: "BEVERAGE", price: 68000, stock: 99, is_available: true, image_url: "/images/menu_8.png" },
];

const mergeMenus = (databaseMenus: Menu[]) => {
  const merged = new Map<string, Menu>();
  legacyMenuItems.forEach((item) => merged.set(item.name.trim().toLowerCase(), item));
  databaseMenus.forEach((item) => merged.set(item.name.trim().toLowerCase(), item));
  return Array.from(merged.values()).sort((a, b) => {
    if (a.category !== b.category) return a.category === "FOOD" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
};

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
  }).format(new Date(`${value}T00:00:00+07:00`));
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

function getJakartaDayBounds() {
  const today = getJakartaDateKey();

  const start = new Date(`${today}T00:00:00+07:00`);

  const nextDay = new Date(start);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  return {
    start: start.toISOString(),
    end: nextDay.toISOString(),
  };
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

  const [extensionRequest, setExtensionRequest] =
    useState<ExtensionRequest | null>(null);

  const [extensionLoading, setExtensionLoading] =
    useState(false);

  const [claimWindowOpen, setClaimWindowOpen] = useState(false);
  const [claimedToday, setClaimedToday] = useState(false);
  const [claimedBeverage, setClaimedBeverage] = useState("");

  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [scanError, setScanError] = useState("");

  const [selectedBeverage, setSelectedBeverage] =
    useState<number | null>(null);

  const [menus, setMenus] = useState<Menu[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const [cart, setCart] = useState<Record<string, number>>({});

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
  const [extensionSubmitting, setExtensionSubmitting] =
    useState(false);
  const [extensionError, setExtensionError] = useState("");

  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActiveMember =
    membershipStatus === "ACTIVE" &&
    paymentStatus === "VERIFIED";

  const hasPendingExtension =
    extensionRequest?.status === "PENDING";

  const hasApprovedExtension =
    extensionRequest?.status === "APPROVED";

  const hasRejectedExtension =
    extensionRequest?.status === "REJECTED";

  const canRequestExtension =
    !hasPendingExtension &&
    !hasApprovedExtension;

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
          })
          .eq("id", membership.id);
      }
    }

    setMembershipStatus(status);
    setPaymentStatus(membership.payment_status);
    setStartDate(membership.start_date);
    setEndDate(membership.end_date);
  };

  const loadExtensionRequest = async (userId: string) => {
    setExtensionLoading(true);

    try {
      const { data, error: extensionLoadError } =
        await supabase
          .from("membership_extension_requests")
          .select(
            "id, user_id, status, payment_status, requested_at, processed_at"
          )
          .eq("user_id", userId)
          .order("requested_at", {
            ascending: false,
          })
          .limit(1);

      if (extensionLoadError) {
        console.error(
          "LOAD EXTENSION REQUEST ERROR:",
          extensionLoadError
        );

        setExtensionRequest(null);
        return;
      }

      if (!data || data.length === 0) {
        setExtensionRequest(null);
        return;
      }

      const row = data[0];

      const safeStatus: ExtensionRequestStatus =
        row.status === "APPROVED"
          ? "APPROVED"
          : row.status === "REJECTED"
            ? "REJECTED"
            : "PENDING";

      const safePaymentStatus: PaymentStatus =
        row.payment_status === "VERIFIED"
          ? "VERIFIED"
          : "PENDING";

      setExtensionRequest({
        id: String(row.id),
        user_id: String(row.user_id),
        status: safeStatus,
        payment_status: safePaymentStatus,
        requested_at: String(row.requested_at),
        processed_at: row.processed_at
          ? String(row.processed_at)
          : null,
      });
    } finally {
      setExtensionLoading(false);
    }
  };

  const loadTodayClaim = async (userId: string) => {
    const { start, end } = getJakartaDayBounds();

    const { data: orders, error: claimError } = await supabase
      .from("orders")
      .select("id, order_number, created_at")
      .eq("user_id", userId)
      .eq("order_type", "COMPLIMENTARY_BEVERAGE")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", {
        ascending: false,
      })
      .limit(1);

    if (
      claimError ||
      !orders ||
      orders.length === 0
    ) {
      setClaimedToday(false);
      setClaimedBeverage("");
      return;
    }

    const order = orders[0];

    const { data: items } = await supabase
      .from("order_items")
      .select("item_name, quantity, unit_price")
      .eq("order_id", order.id)
      .limit(1);

    setClaimedToday(true);
    setClaimedBeverage(
      items && items.length > 0
        ? String(items[0].item_name)
        : ""
    );
  };

  const loadOrderHistory = async (userId: string) => {
    setLoadingHistory(true);

    const {
      data: orders,
      error: ordersError,
    } = await supabase
      .from("orders")
      .select(
        "id, order_number, order_type, status, total_amount, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (
      ordersError ||
      !orders ||
      orders.length === 0
    ) {
      setOrderHistory([]);
      setLoadingHistory(false);
      return;
    }

    const orderIds = orders.map(
      (order) => order.id
    );

    const { data: items } = await supabase
      .from("order_items")
      .select(
        "order_id, item_name, quantity, unit_price"
      )
      .in("order_id", orderIds);

    const safeItems = items || [];

    const formattedOrders: HistoryOrder[] =
      orders.map((order) => ({
        id: String(order.id),
        order_number: String(order.order_number),
        order_type: String(order.order_type),
        status: String(order.status),
        total_amount: Number(
          order.total_amount || 0
        ),
        created_at: String(order.created_at),
        items: safeItems
          .filter(
            (item) =>
              item.order_id === order.id
          )
          .map((item) => ({
            item_name: String(item.item_name),
            quantity: Number(
              item.quantity || 0
            ),
            unit_price: Number(
              item.unit_price || 0
            ),
          })),
      }));

    setOrderHistory(formattedOrders);
    setLoadingHistory(false);
  };

  const loadMenus = async () => {
    setMenuLoading(true);

    try {
      const { data, error: menuError } = await supabase
        .from("menus")
        .select("id, name, category, price, stock, is_available, image_url")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      // The menus table is an optional database enhancement. If it is not
      // available yet (or its schema is not ready), keep the original menu
      // catalog working instead of throwing a dashboard error.
      if (menuError) {
        setMenus(legacyMenuItems);
        setError("");
        return;
      }

      const mappedMenus: Menu[] = (data ?? [])
        .map<Menu>((row) => ({
          id: row.id,
          name: String(row.name ?? ""),
          category:
            String(row.category).toUpperCase() === "BEVERAGE"
              ? "BEVERAGE"
              : "FOOD",
          price: Number(row.price ?? 0),
          stock: Math.max(0, Number(row.stock ?? 0)),
          is_available: row.is_available !== false,
          image_url: row.image_url ?? null,
        }))
        .filter((item) => item.name);

      setMenus(mergeMenus(mappedMenus));
      setError("");
    } catch {
      // Keep the dashboard usable even when the optional menus table is not
      // installed yet or Supabase rejects the query.
      setMenus(legacyMenuItems);
      setError("");
    } finally {
      setMenuLoading(false);
    }
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
        loadExtensionRequest(user.id),
        loadTodayClaim(user.id),
        loadOrderHistory(user.id),
        loadMenus(),
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

        try {
          scannerRef.current.clear();
        } catch {
          // Nothing to do.
        }

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
            if (
              decodedText.trim() !==
              CLAIM_QR_VALUE
            ) {
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
      } catch (scannerError) {
        console.error(
          "QR SCANNER ERROR:",
          scannerError
        );

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

    if (claimSubmitting) {
      return;
    }

    const beverage = memberBeverages.find(
      (item) =>
        item.id === selectedBeverage
    );

    if (!beverage) {
      return;
    }

    setClaimSubmitting(true);
    setScanError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/sign-in");
        return;
      }

      const { start, end } =
        getJakartaDayBounds();

      const {
        data: existingClaims,
        error: existingClaimError,
      } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .eq(
          "order_type",
          "COMPLIMENTARY_BEVERAGE"
        )
        .gte("created_at", start)
        .lt("created_at", end)
        .limit(1);

      if (existingClaimError) {
        setScanError(
          existingClaimError.message ||
            "Unable to verify today's beverage claim."
        );
        return;
      }

      if (
        existingClaims &&
        existingClaims.length > 0
      ) {
        setClaimedToday(true);
        setScanError(
          "You have already claimed your complimentary beverage today."
        );
        await loadTodayClaim(user.id);
        return;
      }

      const orderNumber =
        generateOrderNumber();

      const {
        data: orderData,
        error: orderError,
      } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          order_type:
            "COMPLIMENTARY_BEVERAGE",
          status: "ORDER RECEIVED",
          total_amount: 0,
        })
        .select("id")
        .single();

      if (
        orderError ||
        !orderData
      ) {
        setScanError(
          orderError?.message ||
            "Unable to create your complimentary beverage order."
        );
        return;
      }

      const {
        error: itemError,
      } = await supabase
        .from("order_items")
        .insert({
          order_id: orderData.id,
          item_name: beverage.name,
          quantity: 1,
          unit_price: 0,
        });

      if (itemError) {
        await supabase
          .from("orders")
          .delete()
          .eq("id", orderData.id);

        setScanError(
          itemError.message ||
            "Unable to save your complimentary beverage."
        );
        return;
      }

      setClaimedToday(true);
      setClaimedBeverage(beverage.name);
      setQrScanned(false);
      setSelectedBeverage(null);

      setConfirmationType("beverage");
      setOrderId(orderNumber);
      setConfirmedBeverage(
        beverage.name
      );
      setConfirmedItems([]);
      setConfirmedTotal(0);
      setConfirmationOpen(true);

      await Promise.all([
        loadTodayClaim(user.id),
        loadOrderHistory(user.id),
      ]);
    } finally {
      setClaimSubmitting(false);
    }
  };

  const getDiscountedPrice = (
    price: number
  ) => {
    return Math.round(
      price * (1 - DISCOUNT_RATE)
    );
  };

  const getCartItems = (): CartItem[] => {
    return menus
      .filter(
        (item) =>
          item.is_available && item.stock > 0 &&
          (cart[String(item.id)] || 0) > 0
      )
      .map((item) => {
        const quantity = Math.min(
          cart[String(item.id)] || 0,
          item.stock
        );

        return {
          id: item.id,
          name: item.name,
          price: getDiscountedPrice(item.price),
          quantity,
          type: item.category,
        };
      });
  };

  const updateCart = (
    itemId: string | number,
    quantity: number
  ) => {
    const key = String(itemId);
    const menuItem = menus.find(
      (item) => String(item.id) === key
    );

    setCart((previous) => {
      const next = { ...previous };

      if (quantity <= 0 || !menuItem || !menuItem.is_available) {
        delete next[key];
        return next;
      }

      next[key] = Math.min(quantity, Math.max(0, menuItem.stock));

      if (next[key] <= 0) {
        delete next[key];
      }

      return next;
    });
  };

  const cartItems = getCartItems();

  const subtotal = cartItems.reduce(
    (total, item) =>
      total +
      item.price * item.quantity,
    0
  );

  const serviceCharge = Math.round(
    subtotal * SERVICE_RATE
  );

  const tax = Math.round(
    (subtotal + serviceCharge) *
      TAX_RATE
  );

  const cartTotal =
    subtotal +
    serviceCharge +
    tax;

  const placeAddonOrder = async () => {
    if (!isActiveMember) {
      setError("Your membership must be active to place an order.");
      return;
    }

    if (cartItems.length === 0) {
      setError("Please select at least one item.");
      return;
    }

    if (orderSubmitting) {
      return;
    }

    setOrderSubmitting(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/sign-in");
        return;
      }

      // Database menus are optional for backwards compatibility. The old
      // Deckside catalog must still be orderable even if the new menus table
      // has not been created or does not contain the old items yet.
      let databaseMenus: Menu[] = [];

      const { data: latestMenus, error: latestMenuError } = await supabase
        .from("menus")
        .select("id, name, category, price, stock, is_available, image_url");

      if (!latestMenuError) {
        databaseMenus = (latestMenus ?? [])
          .map<Menu>((row) => ({
            id: row.id,
            name: String(row.name ?? ""),
            category:
              String(row.category).toUpperCase() === "BEVERAGE"
                ? "BEVERAGE"
                : "FOOD",
            price: Number(row.price ?? 0),
            stock: Math.max(0, Number(row.stock ?? 0)),
            is_available: row.is_available !== false,
            image_url: row.image_url ?? null,
          }))
          .filter((item) => item.name);
      }

      const databaseByName = new Map<string, Menu>();
      databaseMenus.forEach((item) => {
        databaseByName.set(item.name.trim().toLowerCase(), item);
      });

      // Validate every selected item against the database when a matching
      // database row exists. Legacy items remain valid when they have not yet
      // been migrated into the menus table.
      for (const item of cartItems) {
        const databaseItem = databaseByName.get(
          item.name.trim().toLowerCase()
        );

        if (!databaseItem) {
          continue;
        }

        if (
          databaseItem.is_available === false ||
          databaseItem.stock < item.quantity
        ) {
          throw new Error(
            `${item.name} is no longer available in the requested quantity.`
          );
        }
      }

      const orderNumber = generateOrderNumber();

      const {
        data: orderData,
        error: orderError,
      } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          order_type: "ADD_ON",
          status: "ORDER RECEIVED",
          total_amount: cartTotal,
        })
        .select("id")
        .single();

      if (orderError || !orderData) {
        throw new Error(
          orderError?.message || "Unable to create your order."
        );
      }

      const itemsToInsert = cartItems.map((item) => ({
        order_id: orderData.id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemError) {
        await supabase.from("orders").delete().eq("id", orderData.id);
        throw new Error(
          itemError.message ||
            "Unable to add the items to your order."
        );
      }

      // Decrease stock only for items that actually exist in the database.
      // Legacy items are intentionally left untouched so the old catalog
      // continues to work exactly as before.
      const stockUpdates: Array<{
        menu: Menu;
        quantity: number;
        previousStock: number;
      }> = [];

      try {
        for (const item of cartItems) {
          const databaseItem = databaseByName.get(
            item.name.trim().toLowerCase()
          );

          if (!databaseItem) {
            continue;
          }

          const currentStock = databaseItem.stock;

          const { data: updatedMenu, error: stockError } = await supabase
            .from("menus")
            .update({
              stock: currentStock - item.quantity,
            })
            .eq("id", databaseItem.id)
            .eq("stock", currentStock)
            .select("id, stock")
            .maybeSingle();

          if (stockError || !updatedMenu) {
            throw new Error(
              stockError?.message ||
                `${item.name} stock changed. Please try again.`
            );
          }

          stockUpdates.push({
            menu: databaseItem,
            quantity: item.quantity,
            previousStock: currentStock,
          });
        }
      } catch (stockError) {
        for (const update of stockUpdates) {
          await supabase
            .from("menus")
            .update({ stock: update.previousStock })
            .eq("id", update.menu.id);
        }

        await supabase.from("orders").delete().eq("id", orderData.id);
        throw stockError;
      }

      await loadMenus();

      setConfirmationType("addon");
      setOrderId(orderNumber);
      setConfirmedBeverage("");
      setConfirmedItems(cartItems);
      setConfirmedTotal(cartTotal);
      setConfirmationOpen(true);
      setCart({});

      await loadOrderHistory(user.id);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to place your order."
      );
    } finally {
      setOrderSubmitting(false);
    }
  };

  const extendMembership = async () => {
    if (extensionSubmitting) {
      return;
    }

    if (hasPendingExtension) {
      setExtensionError(
        "Your membership extension request is already being reviewed."
      );
      return;
    }

    if (hasApprovedExtension) {
      setExtensionError(
        "Your membership extension has already been processed."
      );
      return;
    }

    setExtensionSubmitting(true);
    setExtensionError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/sign-in");
        return;
      }

      const response = await fetch(
        "/api/admin/extensions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result =
        await response.json().catch(
          () => ({})
        );

      if (!response.ok) {
        setExtensionError(
          result?.error ||
            "Unable to submit your membership extension request."
        );
        return;
      }

      setExtensionRequest({
        id: String(
          result?.request?.id ||
            result?.id ||
            `temporary-${Date.now()}`
        ),
        user_id: currentUserId,
        status: "PENDING",
        payment_status: "PENDING",
        requested_at:
          result?.request?.requestedAt ||
          result?.request?.requested_at ||
          new Date().toISOString(),
        processed_at: null,
      });

      setExtendConfirmed(true);
    } catch (extensionRequestError) {
      console.error(
        "EXTENSION REQUEST ERROR:",
        extensionRequestError
      );

      setExtensionError(
        "Unable to submit your extension request. Please try again."
      );
    } finally {
      setExtensionSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setMobileMenuOpen(false);

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

  const closeExtensionModal = () => {
    if (extensionSubmitting) {
      return;
    }

    setExtendOpen(false);
    setExtendConfirmed(false);
    setExtensionError("");
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <nav className={styles.navbar}>
          <a
            href="/"
            className={styles.logo}
          >
            Deckside
          </a>
        </nav>

        <div className={styles.container}>
          <section
            className={styles.lockedBox}
          >
            <p
              className={
                styles.lockedLabel
              }
            >
              DECKSIDE MEMBERSHIP
            </p>

            <h3>
              Loading Your Dashboard
            </h3>

            <p>
              Please wait while we load
              your membership
              information.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (error && !currentUserId) {
    return (
      <main className={styles.page}>
        <nav className={styles.navbar}>
          <a
            href="/"
            className={styles.logo}
          >
            Deckside
          </a>
        </nav>

        <div className={styles.container}>
          <section
            className={styles.lockedBox}
          >
            <p
              className={
                styles.lockedLabel
              }
            >
              PROFILE ERROR
            </p>

            <h3>
              Unable to Load Your Profile
            </h3>

            <p>{error}</p>

            <button
              type="button"
              className={
                styles.primaryButton
              }
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
        <a
          href="/"
          className={styles.logo}
          onClick={() =>
            setMobileMenuOpen(false)
          }
        >
          Deckside
        </a>

        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={() =>
            setMobileMenuOpen(
              (previous) => !previous
            )
          }
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          className={`${styles.menu} ${
            mobileMenuOpen
              ? styles.menuOpen
              : ""
          }`}
        >
          <a
            href="/"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            HOME
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
            DECKSIDE MEMBER
          </p>

          <h1>
            Welcome{" "}
            {memberTitle
              ? `${memberTitle
                  .charAt(0)
                  .toUpperCase()}${memberTitle.slice(
                  1
                )}`
              : ""}{" "}
            {memberName}
          </h1>

          <p>
            Your cozy corner for your
            productive space.
          </p>
        </section>

        <section
          className={
            styles.membershipCard
          }
        >
          <div>
            <p
              className={
                styles.eyebrow
              }
            >
              MEMBERSHIP
            </p>

            <h2>Deckside Member</h2>

            <p>
              Member ID:{" "}
              <strong>
                {memberId}
              </strong>
            </p>

            <p>{memberEmail}</p>
          </div>

          <div>
            <p
              className={
                styles.eyebrow
              }
            >
              STATUS
            </p>

            <h3>
              {membershipStatus}
            </h3>

            <p>
              Payment:{" "}
              {paymentStatus}
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

            {extensionLoading && (
              <p
                className={
                  styles.extensionStatusText
                }
              >
                Checking extension status...
              </p>
            )}

            {!extensionLoading &&
              hasPendingExtension && (
                <div
                  className={
                    styles.extensionPending
                  }
                >
                  <strong>
                    EXTENSION REQUEST PENDING
                  </strong>

                  </div>
              )}

            {!extensionLoading &&
              hasRejectedExtension && (
                <div
                  className={
                    styles.extensionRejected
                  }
                >
                  <strong>
                    EXTENSION REQUEST REJECTED
                  </strong>

                  <span>
                    You may submit a new
                    extension request.
                  </span>
                </div>
              )}

            {!extensionLoading &&
              hasApprovedExtension && (
                <div
                  className={
                    styles.extensionApproved
                  }
                >
                  <strong>
                    EXTENSION PROCESSED
                  </strong>

                  <span>
                    Your membership extension
                    has been processed.
                  </span>
                </div>
              )}

            {!extensionLoading &&
              canRequestExtension &&
              (membershipStatus ===
                "EXPIRED" ||
                (membershipStatus ===
                  "PENDING" &&
                  paymentStatus ===
                    "VERIFIED")) && (
                <button
                  type="button"
                  className={
                    styles.extendButton
                  }
                  onClick={() => {
                    setExtensionError("");
                    setExtendConfirmed(
                      false
                    );
                    setExtendOpen(true);
                  }}
                >
                  EXTEND MEMBERSHIP
                </button>
              )}
          </div>
        </section>

        {!isActiveMember && (
          <section
            className={styles.section}
          >
            <div
              className={
                styles.lockedBox
              }
            >
              <p
                className={
                  styles.lockedLabel
                }
              >
                MEMBERSHIP NOT ACTIVE
              </p>

              <h3>
                Your Membership Is{" "}
                {membershipStatus ===
                "PENDING"
                  ? "Pending Verification"
                  : membershipStatus}
              </h3>

              <p>
                {paymentStatus ===
                "PENDING"
                  ? "Please wait for the Deckside team to verify your payment."
                  : membershipStatus ===
                      "EXPIRED"
                    ? "Your membership has expired. Please extend your membership to continue using member benefits."
                    : "Your membership will become active after the activation process is completed."}
              </p>
            </div>
          </section>
        )}

        <section
          className={styles.section}
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <div>
              <p
                className={
                  styles.eyebrow
                }
              >
                MEMBER BENEFIT
              </p>

              <h2>
                Complimentary Beverage
              </h2>
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
            <div
              className={
                styles.lockedBox
              }
            >
              <p
                className={
                  styles.lockedLabel
                }
              >
                LOCKED
              </p>

              <h3>
                Activate Your
                Membership
              </h3>

              <p>
                Complimentary
                beverage benefits
                are available only
                for active members.
              </p>
            </div>
          ) : claimedToday ? (
            <div
              className={
                styles.claimedStatus
              }
            >
              <p
                className={
                  styles.lockedLabel
                }
              >
                CLAIM COMPLETED
              </p>

              <h3>
                Your Beverage Has
                Been Claimed
              </h3>

              <p>
                Today&apos;s
                complimentary
                beverage:{" "}
                <strong>
                  {claimedBeverage}
                </strong>
              </p>

              <p>
                You can claim one
                complimentary
                beverage every day
                from 15:00 to 19:00
                WIB.
              </p>
            </div>
          ) : !claimWindowOpen ? (
            <div
              className={
                styles.lockedBox
              }
            >
              <p
                className={
                  styles.lockedLabel
                }
              >
                BENEFIT CLOSED
              </p>

              <h3>
                Come Back Between
                15:00 – 19:00
              </h3>

              <p>
                Your complimentary
                beverage can be
                claimed every day
                during the claim
                window.
              </p>
            </div>
          ) : (
            <div
              className={
                styles.unlockedBox
              }
            >
              <div
                className={
                  styles.available
                }
              >
                <p
                  className={
                    styles.lockedLabel
                  }
                >
                  AVAILABLE TODAY
                </p>

                <p>
                  Select one beverage,
                  then scan the Deckside
                  QR code at the cashier.
                </p>
              </div>

              <div
                className={
                  styles.horizontalGrid
                }
              >
                {memberBeverages.map(
                  (beverage) => (
                    <button
                      key={beverage.id}
                      type="button"
                      className={`${styles.beverageCard} ${
                        selectedBeverage ===
                        beverage.id
                          ? styles.selected
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedBeverage(
                          beverage.id
                        )
                      }
                    >
                      <img
                        src={
                          beverage.image
                        }
                        alt={
                          beverage.name
                        }
                      />

                      <div>
                        <h3>
                          {beverage.name}
                        </h3>

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
                  )
                )}
              </div>

              {selectedBeverage !==
                null && (
                <div
                  className={
                    styles.scanner
                  }
                >
                  {!qrScanned ? (
                    <>
                      <p>
                        Scan the
                        Deckside QR code
                        at the cashier
                        before
                        confirming your
                        beverage.
                      </p>

                      <button
                        type="button"
                        className={
                          styles.primaryButton
                        }
                        onClick={
                          openScanner
                        }
                      >
                        SCAN QR CODE
                      </button>
                    </>
                  ) : (
                    <>
                      <p>
                        QR code verified.
                        Your
                        complimentary
                        beverage is ready
                        to be claimed.
                      </p>

                      <button
                        type="button"
                        className={
                          styles.primaryButton
                        }
                        onClick={
                          confirmBeverage
                        }
                        disabled={
                          claimSubmitting
                        }
                      >
                        {claimSubmitting
                          ? "PROCESSING..."
                          : "CLAIM BEVERAGE"}
                      </button>
                    </>
                  )}

                  {scanError && (
                    <p
                      className={
                        styles.error
                      }
                    >
                      {scanError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <section
          className={styles.section}
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <div>
              <p
                className={
                  styles.eyebrow
                }
              >
                MEMBER PRIVILEGE
              </p>

              <h2>
                Food & Beverage
                Add-ons
              </h2>
            </div>

            <span
              className={
                styles.badgeAvailable
              }
            >
              21% MEMBER DISCOUNT
            </span>
          </div>

          {!isActiveMember ? (
            <div
              className={
                styles.lockedBox
              }
            >
              <p
                className={
                  styles.lockedLabel
                }
              >
                LOCKED
              </p>

              <h3>
                Member Ordering Is
                Locked
              </h3>

              <p>
                Activate your
                membership to access
                member pricing and
                ordering.
              </p>
            </div>
          ) : (
            <>
              {menuLoading ? (
                <div className={styles.lockedBox}>
                  <p>Loading menu...</p>
                </div>
              ) : (
                <>
                  {[
                    ["FOOD", "APPETIZERS & SNACK", "Appetizers & Snack"],
                    ["BEVERAGE", "BEVERAGES", "Beverages"],
                  ].map(([category, eyebrow, title]) => {
                    const categoryItems = menus.filter(
                      (item) => item.category === category
                    );

                    return (
                      <div
                        className={styles.addonCategory}
                        key={category}
                      >
                        <div className={styles.addonCategoryHeader}>
                          <div>
                            <p className={styles.lockedLabel}>
                              {eyebrow}
                            </p>
                            <h3>{title}</h3>
                          </div>
                        </div>

                        <div className={styles.addonList}>
                          {categoryItems.length === 0 ? (
                            <div className={styles.lockedBox}>
                              <p>No menu items available.</p>
                            </div>
                          ) : (
                            categoryItems.map((item) => {
                              const key = String(item.id);
                              const quantity = cart[key] || 0;
                              const memberPrice = getDiscountedPrice(item.price);
                              const soldOut =
                                !item.is_available || item.stock <= 0;

                              return (
                                <div
                                  key={key}
                                  className={styles.addonItem}
                                  style={{ opacity: soldOut ? 0.55 : 1 }}
                                >
                                  <div className={styles.addonInfo}>
                                    <h4>{item.name}</h4>

                                    <div className={styles.addonPrices}>
                                      <span className={styles.originalPrice}>
                                        {formatRupiah(item.price)}
                                      </span>
                                      <span>{formatRupiah(memberPrice)}</span>
                                    </div>

                                    <small className={styles.memberPriceLabel}>
                                      {soldOut
                                        ? "SOLD OUT"
                                        : `${item.stock} available · Member price`}
                                    </small>
                                  </div>

                                  <div className={styles.addonOrder}>
                                    <button
                                      type="button"
                                      className={styles.secondaryButton}
                                      onClick={() =>
                                        updateCart(item.id, quantity - 1)
                                      }
                                      disabled={quantity === 0 || soldOut}
                                    >
                                      −
                                    </button>

                                    <span className={styles.quantity}>
                                      {quantity}
                                    </span>

                                    <button
                                      type="button"
                                      className={styles.secondaryButton}
                                      onClick={() =>
                                        updateCart(item.id, quantity + 1)
                                      }
                                      disabled={
                                        soldOut || quantity >= item.stock
                                      }
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {cartItems.length >
                0 && (
                <div
                  className={
                    styles.orderSection
                  }
                >
                  <div
                    className={
                      styles.orderCard
                    }
                  >
                    <div
                      className={
                        styles.items
                      }
                    >
                      {cartItems.map(
                        (item) => (
                          <div
                            key={item.id}
                            className={
                              styles.item
                            }
                          >
                            <div>
                              <strong>
                                {item.name}
                              </strong>

                              <span>
                                {item.quantity} ×{" "}
                                {formatRupiah(
                                  item.price
                                )}
                              </span>
                            </div>

                            <strong>
                              {formatRupiah(
                                item.price *
                                  item.quantity
                              )}
                            </strong>
                          </div>
                        )
                      )}
                    </div>

                    <div
                      className={
                        styles.priceLine
                      }
                    >
                      <span>
                        Subtotal
                      </span>

                      <span>
                        {formatRupiah(
                          subtotal
                        )}
                      </span>
                    </div>

                    <div
                      className={
                        styles.priceLine
                      }
                    >
                      <span>
                        Service Charge 10%
                      </span>

                      <span>
                        {formatRupiah(
                          serviceCharge
                        )}
                      </span>
                    </div>

                    <div
                      className={
                        styles.priceLine
                      }
                    >
                      <span>
                        Tax 11%
                      </span>

                      <span>
                        {formatRupiah(tax)}
                      </span>
                    </div>

                    <div
                      className={
                        styles.total
                      }
                    >
                      <span>Total</span>

                      <strong>
                        {formatRupiah(
                          cartTotal
                        )}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className={
                        styles.primaryButton
                      }
                      onClick={
                        placeAddonOrder
                      }
                      disabled={
                        orderSubmitting
                      }
                    >
                      {orderSubmitting
                        ? "PLACING ORDER..."
                        : "PLACE ORDER"}
                    </button>

                    {error && (
                      <p
                        className={
                          styles.error
                        }
                      >
                        {error}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section
          className={styles.section}
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <div>
              <p
                className={
                  styles.eyebrow
                }
              >
                ORDER HISTORY
              </p>

              <h2>Your Orders</h2>
            </div>
          </div>

          {loadingHistory ? (
            <div
              className={
                styles.lockedBox
              }
            >
              <p>
                Loading your order
                history...
              </p>
            </div>
          ) : orderHistory.length ===
            0 ? (
            <div
              className={
                styles.lockedBox
              }
            >
              <p
                className={
                  styles.lockedLabel
                }
              >
                NO ORDERS
              </p>

              <h3>
                Your order history is
                empty.
              </h3>

              <p>
                Your Deckside orders
                will appear here once
                you place an order.
              </p>
            </div>
          ) : (
            <div
              className={
                styles.history
              }
            >
              {orderHistory.map(
                (order) => (
                  <div
                    key={order.id}
                    className={
                      styles.historyRow
                    }
                  >
                    <div>
                      <p
                        className={
                          styles.lockedLabel
                        }
                      >
                        {
                          order.order_number
                        }
                      </p>

                      <h3>
                        {order.order_type ===
                        "COMPLIMENTARY_BEVERAGE"
                          ? "Complimentary Beverage"
                          : "Member Add-on Order"}
                      </h3>

                      <p>
                        {formatDateTime(
                          order.created_at
                        )}
                      </p>

                      {order.items
                        .length >
                        0 && (
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
                          order.status ===
                          "DELIVERED"
                            ? styles.delivered
                            : ""
                        }
                      >
                        {order.status}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {scannerOpen && (
        <div
          className={styles.overlay}
        >
          <div
            className={
              styles.confirmation
            }
          >
            <button
              type="button"
              className={
                styles.confirmationClose
              }
              onClick={
                closeScanner
              }
            >
              ×
            </button>

            <p
              className={
                styles.confirmationEyebrow
              }
            >
              DECKSIDE QR
            </p>

            <h2>Scan QR Code</h2>

            <p
              className={
                styles.confirmationText
              }
            >
              Scan the QR code
              displayed by the
              Deckside cashier.
            </p>

            <div
              id="deckside-qr-reader"
              className={
                styles.qrReader
              }
            />

            {scanError && (
              <p
                className={
                  styles.error
                }
              >
                {scanError}
              </p>
            )}
          </div>
        </div>
      )}

      {confirmationOpen && (
        <div
          className={styles.overlay}
        >
          <div
            className={
              styles.confirmation
            }
          >
            <button
              type="button"
              className={
                styles.confirmationClose
              }
              onClick={() =>
                setConfirmationOpen(
                  false
                )
              }
            >
              ×
            </button>

            <div
              className={
                styles.check
              }
            >
              ✓
            </div>

            <p
              className={
                styles.confirmationEyebrow
              }
            >
              THANK YOU
            </p>

            <h2>
              Order Confirmed
            </h2>

            <p
              className={
                styles.confirmationText
              }
            >
              Please wait while your
              order is being prepared
              and delivered to you.
            </p>

            <div
              className={
                styles.orderInfo
              }
            >
              <span>
                Order Number
              </span>

              <strong>
                {orderId}
              </strong>
            </div>

            {confirmationType ===
            "beverage" ? (
              <div
                className={
                  styles.confirmationDetails
                }
              >
                <p>
                  Complimentary
                  Beverage
                </p>

                <div
                  className={
                    styles.confirmationItem
                  }
                >
                  <span>
                    {confirmedBeverage}
                  </span>

                  <strong>
                    Complimentary
                  </strong>
                </div>
              </div>
            ) : (
              <div
                className={
                  styles.confirmationDetails
                }
              >
                {confirmedItems.map(
                  (item) => (
                    <div
                      key={item.id}
                      className={
                        styles.confirmationItem
                      }
                    >
                      <span>
                        {item.name} ×{" "}
                        {item.quantity}
                      </span>

                      <strong>
                        {formatRupiah(
                          item.price *
                            item.quantity
                        )}
                      </strong>
                    </div>
                  )
                )}

                <div
                  className={
                    styles.confirmationTotal
                  }
                >
                  <span>Total</span>

                  <strong>
                    {formatRupiah(
                      confirmedTotal
                    )}
                  </strong>
                </div>
              </div>
            )}

            <button
              type="button"
              className={
                styles.primaryButton
              }
              onClick={() =>
                setConfirmationOpen(
                  false
                )
              }
            >
              DONE
            </button>
          </div>
        </div>
      )}

      {extendOpen && (
        <div
          className={styles.overlay}
        >
          <div
            className={`${styles.confirmation} ${styles.extendCard}`}
          >
            <button
              type="button"
              className={
                styles.confirmationClose
              }
              onClick={
                closeExtensionModal
              }
              disabled={
                extensionSubmitting
              }
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
                  MEMBERSHIP
                </p>

                <h2>
                  Extend Your
                  Membership
                </h2>

                <p
                  className={
                    styles.confirmationText
                  }
                >
                  Submit your membership
                  extension request to
                  the Deckside team.
                </p>

                <div
                  className={
                    styles.currentMembership
                  }
                >
                  <p>
                    Current Membership
                  </p>

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

                <div
                  className={
                    styles.extensionPlan
                  }
                >
                  <p>
                    Extension Plan
                  </p>

                  <strong>
                    1 Month
                  </strong>

                  <span>
                    Your request will be
                    reviewed and verified
                    by the Deckside team.
                  </span>
                </div>

                {extensionError && (
                  <p
                    className={
                      styles.error
                    }
                  >
                    {extensionError}
                  </p>
                )}

                <button
                  type="button"
                  className={
                    styles.primaryButton
                  }
                  onClick={
                    extendMembership
                  }
                  disabled={
                    extensionSubmitting
                  }
                >
                  {extensionSubmitting
                    ? "SUBMITTING..."
                    : "SUBMIT REQUEST"}
                </button>
              </>
            ) : (
              <>
                <div
                  className={
                    styles.check
                  }
                >
                  ✓
                </div>

                <p
                  className={
                    styles.confirmationEyebrow
                  }
                >
                  REQUEST SUBMITTED
                </p>

                <h2>
                  Request Received
                </h2>

                <p
                  className={
                    styles.confirmationText
                  }
                >
                  Your membership
                  extension request has
                  been submitted and is
                  now pending review.
                </p>

                <div
                  className={
                    styles.extensionPlan
                  }
                >
                  <p>
                    REQUEST STATUS
                  </p>

                  <strong>
                    PENDING
                  </strong>

                  <span>
                    The Deckside team will
                    review your request.
                  </span>
                </div>

                <button
                  type="button"
                  className={
                    styles.primaryButton
                  }
                  onClick={() => {
                    setExtendOpen(false);
                    setExtendConfirmed(
                      false
                    );
                    setExtensionError("");
                  }}
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