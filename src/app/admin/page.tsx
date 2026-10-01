"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from "./page.module.css";
import { createClient } from "../../lib/supabase/client";

type MembershipStatus = "PENDING" | "ACTIVE" | "EXPIRED";
type PaymentStatus = "PENDING" | "VERIFIED";

type OrderStatus =
  | "ORDER RECEIVED"
  | "PREPARING"
  | "DELIVERED"
  | "CANCELLED";

type Member = {
  id: string;
  userId: string;
  memberId: string;
  title: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  startDate: string;
  endDate: string;
  paymentStatus: PaymentStatus;
  membershipStatus: MembershipStatus;
  source: "ONLINE" | "MANUAL";
};

type Order = {
  id: string;
  orderNumber: string;
  userId: string;
  memberId: string;
  memberName: string;
  items: string;
  total: number;
  date: string;
  time: string;
  status: OrderStatus;
  orderType: string;
};

type BeverageClaim = {
  id: string;
  userId: string;
  memberId: string;
  memberName: string;
  beverage: string;
  date: string;
  time: string;
};

type DateFilter =
  | "TODAY"
  | "YESTERDAY"
  | "THIS_WEEK"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "CUSTOM";

type ReportType =
  | "SUMMARY"
  | "MEMBERS"
  | "ORDERS"
  | "CLAIMS"
  | "ALL";

type MemberForm = {
  memberId: string;
  title: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  registrationDate: string;
  startDate: string;
  endDate: string;
  paymentStatus: PaymentStatus;
  membershipStatus: MembershipStatus;
};

type ProfileRow = {
  id: string;
  member_id: string | null;
  title: string | null;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
};

type MembershipRow = {
  id: string;
  user_id: string;
  status: MembershipStatus;
  payment_status: PaymentStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

type OrderRow = {
  id: string;
  user_id: string;
  order_number: string;
  order_type: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  created_at?: string;
};

const emptyMemberForm: MemberForm = {
  memberId: "",
  title: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  registrationDate: "",
  startDate: "",
  endDate: "",
  paymentStatus: "PENDING",
  membershipStatus: "PENDING",
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) => {
  if (!value) return "-";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatTime = (value: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date);
};

const getJakartaDate = (value: string) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const getTodayJakarta = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const shiftDate = (dateString: string, days: number) => {
  const date = new Date(`${dateString}T12:00:00Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
};

const getEndDateOneMonth = (startDate: string) => {
  if (!startDate) return "";

  const date = new Date(`${startDate}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(date.getUTCDate() - 1);

  return date.toISOString().slice(0, 10);
};

const getNextStatus = (status: OrderStatus): OrderStatus => {
  if (status === "ORDER RECEIVED") {
    return "PREPARING";
  }

  if (status === "PREPARING") {
    return "DELIVERED";
  }

  return status;
};

export default function AdminPage() {
  const [supabase] = useState(() => createClient());

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [claims, setClaims] = useState<BeverageClaim[]>([]);

  const [dateFilter, setDateFilter] =
    useState<DateFilter>("TODAY");

  const [customFrom, setCustomFrom] =
    useState(() => getTodayJakarta());

  const [customTo, setCustomTo] =
    useState(() => getTodayJakarta());

  const [reportType, setReportType] =
    useState<ReportType>("ALL");

  const [editMemberOpen, setEditMemberOpen] =
    useState(false);

  const [addMemberOpen, setAddMemberOpen] =
    useState(false);

  const [selectedMember, setSelectedMember] =
    useState<Member | null>(null);

  const [selectedHistoryMember, setSelectedHistoryMember] =
    useState<Member | null>(null);

  const [memberForm, setMemberForm] =
    useState<MemberForm>(emptyMemberForm);

  const [addMemberForm, setAddMemberForm] =
    useState<MemberForm>({
      ...emptyMemberForm,
      registrationDate: getTodayJakarta(),
      startDate: getTodayJakarta(),
      endDate: getEndDateOneMonth(getTodayJakarta()),
    });

  const [notification, setNotification] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [qrOpen, setQrOpen] =
    useState(false);

  const today = getTodayJakarta();

  useEffect(() => {
    loadAdminData();
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);

    window.setTimeout(() => {
      setNotification("");
    }, 3500);
  };

  const loadAdminData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/sign-in";
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "ADMIN PROFILE ERROR:",
          profileError
        );

        setErrorMessage(
          `Unable to verify admin access: ${profileError.message}`
        );

        return;
      }

      if (!profile) {
        setErrorMessage(
          "Admin profile was not found."
        );

        return;
      }

      if (profile.role !== "admin") {
        window.location.href = "/dashboard";
        return;
      }

      await Promise.all([
        loadMembers(),
        loadOrders(),
        loadClaims(),
      ]);
    } catch (error) {
      console.error(
        "ADMIN DASHBOARD ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading the admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const {
        data: profiles,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, member_id, title, full_name, email, role, created_at"
        )
        .eq("role", "member")
        .order("created_at", {
          ascending: false,
        });

      if (profileError) {
        console.error(
          "MEMBER PROFILE ERROR:",
          profileError
        );

        setMembers([]);

        setErrorMessage(
          `Unable to load member data: ${profileError.message}`
        );

        return;
      }

      if (!profiles || profiles.length === 0) {
        setMembers([]);
        return;
      }

      const userIds = profiles.map(
        (profile) => profile.id
      );

      const {
        data: memberships,
        error: membershipError,
      } = await supabase
        .from("memberships")
        .select(
          "id, user_id, status, payment_status, start_date, end_date, created_at"
        )
        .in("user_id", userIds)
        .order("created_at", {
          ascending: false,
        });

      if (membershipError) {
        console.error(
          "MEMBERSHIP ERROR:",
          membershipError
        );

        setErrorMessage(
          `Unable to load membership data: ${membershipError.message}`
        );
      }

      const membershipMap =
        new Map<string, MembershipRow>();

      (memberships ?? []).forEach(
        (membership) => {
          if (
            !membershipMap.has(
              membership.user_id
            )
          ) {
            membershipMap.set(
              membership.user_id,
              membership as MembershipRow
            );
          }
        }
      );

      const mappedMembers: Member[] =
        (profiles as ProfileRow[]).map(
          (profile) => {
            const membership =
              membershipMap.get(profile.id);

            let membershipStatus: MembershipStatus =
              membership?.status ?? "PENDING";

            if (
              membershipStatus === "ACTIVE" &&
              membership?.end_date &&
              membership.end_date < today
            ) {
              membershipStatus = "EXPIRED";
            }

            return {
              id: profile.id,
              userId: profile.id,
              memberId:
                profile.member_id ?? "-",
              title:
                profile.title ?? "",
              name:
                profile.full_name ?? "",
              email:
                profile.email ?? "",
              phone: "",
              registrationDate:
                getJakartaDate(
                  profile.created_at
                ),
              startDate:
                membership?.start_date ?? "",
              endDate:
                membership?.end_date ?? "",
              paymentStatus:
                membership?.payment_status ??
                "PENDING",
              membershipStatus,
              source: "ONLINE",
            };
          }
        );

      setMembers(mappedMembers);
    } catch (error) {
      console.error(
        "LOAD MEMBERS ERROR:",
        error
      );

      setMembers([]);

      setErrorMessage(
        error instanceof Error
          ? `Unable to load members: ${error.message}`
          : "Unable to load members."
      );
    }
  };

  const loadOrders = async () => {
    try {
      console.log("LOADING ORDERS...");

      const {
        data: orderRows,
        error,
      } = await supabase
        .from("orders")
        .select(
          "id, user_id, order_number, order_type, status, total_amount, created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "ORDER ERROR:",
          error
        );

        setOrders([]);

        setErrorMessage(
          `Unable to load orders: ${error.message}`
        );

        return;
      }

      console.log(
        "ORDERS:",
        orderRows
      );

      if (
        !orderRows ||
        orderRows.length === 0
      ) {
        setOrders([]);
        return;
      }

      const userIds = [
        ...new Set(
          orderRows.map(
            (order) => order.user_id
          )
        ),
      ];

      const orderIds =
        orderRows.map(
          (order) => order.id
        );

      const [
        {
          data: profiles,
          error: profileError,
        },
        {
          data: items,
          error: itemError,
        },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, member_id, full_name"
          )
          .in("id", userIds),

        supabase
          .from("order_items")
          .select(
            "id, order_id, item_name, quantity, unit_price, created_at"
          )
          .in("order_id", orderIds),
      ]);

      if (profileError) {
        console.error(
          "ORDER PROFILE ERROR:",
          profileError
        );
      }

      if (itemError) {
        console.error(
          "ORDER ITEM ERROR:",
          itemError
        );
      }

      const profileMap = new Map<
        string,
        {
          member_id: string | null;
          full_name: string;
        }
      >();

      (profiles ?? []).forEach(
        (profile) => {
          profileMap.set(profile.id, {
            member_id:
              profile.member_id,
            full_name:
              profile.full_name,
          });
        }
      );

      const itemsMap = new Map<
        string,
        OrderItemRow[]
      >();

      (items ?? []).forEach(
        (item) => {
          const existing =
            itemsMap.get(item.order_id) ?? [];

          existing.push(
            item as OrderItemRow
          );

          itemsMap.set(
            item.order_id,
            existing
          );
        }
      );

      const mappedOrders: Order[] =
        (orderRows as OrderRow[]).map(
          (order) => {
            const profile =
              profileMap.get(order.user_id);

            const orderItems =
              itemsMap.get(order.id) ?? [];

            const itemText =
              orderItems.length > 0
                ? orderItems
                    .map(
                      (item) =>
                        `${item.item_name} × ${item.quantity}`
                    )
                    .join(", ")
                : "-";

            return {
              id: order.id,
              orderNumber:
                order.order_number,
              userId:
                order.user_id,
              memberId:
                profile?.member_id ?? "-",
              memberName:
                profile?.full_name ??
                "Unknown Member",
              items: itemText,
              total:
                Number(
                  order.total_amount
                ) || 0,
              date:
                getJakartaDate(
                  order.created_at
                ),
              time:
                formatTime(
                  order.created_at
                ),
              status:
                order.status,
              orderType:
                order.order_type,
            };
          }
        );

      console.log(
        "MAPPED ORDERS:",
        mappedOrders
      );

      setOrders(mappedOrders);
    } catch (error) {
      console.error(
        "LOAD ORDERS ERROR:",
        error
      );

      setOrders([]);

      setErrorMessage(
        error instanceof Error
          ? `Unable to load orders: ${error.message}`
          : "Unable to load orders."
      );
    }
  };

  const loadClaims = async () => {
    try {
      console.log(
        "LOADING CLAIM HISTORY..."
      );

      const {
        data: claimOrders,
        error: claimOrderError,
      } = await supabase
        .from("orders")
        .select(
          "id, user_id, order_number, order_type, status, total_amount, created_at"
        )
        .eq(
          "order_type",
          "COMPLIMENTARY_BEVERAGE"
        )
        .order("created_at", {
          ascending: false,
        });

      if (claimOrderError) {
        console.error(
          "CLAIM ORDER ERROR:",
          claimOrderError
        );

        setClaims([]);

        setErrorMessage(
          `Unable to load beverage claims: ${claimOrderError.message}`
        );

        return;
      }

      console.log(
        "CLAIM ORDERS:",
        claimOrders
      );

      if (
        !claimOrders ||
        claimOrders.length === 0
      ) {
        console.log(
          "NO CLAIM ORDERS FOUND"
        );

        setClaims([]);
        return;
      }

      const userIds = [
        ...new Set(
          claimOrders.map(
            (order) => order.user_id
          )
        ),
      ];

      const orderIds =
        claimOrders.map(
          (order) => order.id
        );

      const [
        {
          data: profiles,
          error: profileError,
        },
        {
          data: orderItems,
          error: itemError,
        },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, member_id, full_name"
          )
          .in("id", userIds),

        supabase
          .from("order_items")
          .select(
            "id, order_id, item_name, quantity, unit_price, created_at"
          )
          .in("order_id", orderIds),
      ]);

      if (profileError) {
        console.error(
          "CLAIM PROFILE ERROR:",
          profileError
        );

        setErrorMessage(
          `Unable to load claim member data: ${profileError.message}`
        );
      }

      if (itemError) {
        console.error(
          "CLAIM ITEM ERROR:",
          itemError
        );

        setErrorMessage(
          `Unable to load claimed beverage: ${itemError.message}`
        );
      }

      const profileMap = new Map<
        string,
        {
          member_id: string | null;
          full_name: string;
        }
      >();

      (profiles ?? []).forEach(
        (profile) => {
          profileMap.set(
            profile.id,
            {
              member_id:
                profile.member_id,
              full_name:
                profile.full_name,
            }
          );
        }
      );

      const itemMap = new Map<
        string,
        OrderItemRow[]
      >();

      (orderItems ?? []).forEach(
        (item) => {
          const existing =
            itemMap.get(
              item.order_id
            ) ?? [];

          existing.push(
            item as OrderItemRow
          );

          itemMap.set(
            item.order_id,
            existing
          );
        }
      );

      const mappedClaims: BeverageClaim[] =
        claimOrders.map(
          (order) => {
            const profile =
              profileMap.get(
                order.user_id
              );

            const items =
              itemMap.get(
                order.id
              ) ?? [];

            const beverage =
              items[0];

            return {
              id: order.id,
              userId:
                order.user_id,
              memberId:
                profile?.member_id ??
                "-",
              memberName:
                profile?.full_name ??
                "Unknown Member",
              beverage:
                beverage?.item_name ??
                "Complimentary Beverage",
              date:
                getJakartaDate(
                  order.created_at
                ),
              time:
                formatTime(
                  order.created_at
                ),
            };
          }
        );

      console.log(
        "CLAIM HISTORY:",
        mappedClaims
      );

      setClaims(
        mappedClaims
      );
    } catch (error) {
      console.error(
        "LOAD CLAIMS ERROR:",
        error
      );

      setClaims([]);

      setErrorMessage(
        error instanceof Error
          ? `Unable to load beverage claims: ${error.message}`
          : "Unable to load beverage claims."
      );
    }
  };

  const dateRange = useMemo(() => {
    if (dateFilter === "TODAY") {
      return {
        from: today,
        to: today,
      };
    }

    if (
      dateFilter ===
      "YESTERDAY"
    ) {
      const yesterday =
        shiftDate(
          today,
          -1
        );

      return {
        from: yesterday,
        to: yesterday,
      };
    }

    if (
      dateFilter ===
      "THIS_WEEK"
    ) {
      const current =
        new Date(
          `${today}T12:00:00Z`
        );

      const day =
        current.getUTCDay();

      const diff =
        day === 0
          ? 6
          : day - 1;

      const monday =
        shiftDate(
          today,
          -diff
        );

      return {
        from: monday,
        to: today,
      };
    }

    if (
      dateFilter ===
      "THIS_MONTH"
    ) {
      return {
        from:
          today.slice(0, 8) +
          "01",
        to: today,
      };
    }

    if (
      dateFilter ===
      "LAST_MONTH"
    ) {
      const firstCurrentMonth =
        new Date(
          `${today.slice(
            0,
            7
          )}-01T12:00:00Z`
        );

      firstCurrentMonth.setUTCMonth(
        firstCurrentMonth.getUTCMonth() -
          1
      );

      const firstDay =
        firstCurrentMonth
          .toISOString()
          .slice(0, 10);

      const lastDayDate =
        new Date(
          `${today.slice(
            0,
            7
          )}-01T12:00:00Z`
        );

      lastDayDate.setUTCDate(0);

      const lastDay =
        lastDayDate
          .toISOString()
          .slice(0, 10);

      return {
        from: firstDay,
        to: lastDay,
      };
    }

    return {
      from: customFrom,
      to: customTo,
    };
  }, [
    dateFilter,
    customFrom,
    customTo,
    today,
  ]);

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.date >=
          dateRange.from &&
        order.date <=
          dateRange.to
    );
  }, [
    orders,
    dateRange,
  ]);

  const filteredClaims = useMemo(() => {
    return claims.filter(
      (claim) =>
        claim.date >=
          dateRange.from &&
        claim.date <=
          dateRange.to
    );
  }, [
    claims,
    dateRange,
  ]);

  const filteredMembers = useMemo(() => {
    return members.filter(
      (member) =>
        member.registrationDate >=
          dateRange.from &&
        member.registrationDate <=
          dateRange.to
    );
  }, [
    members,
    dateRange,
  ]);

  const activeMembers =
    members.filter(
      (member) =>
        member.membershipStatus ===
        "ACTIVE"
    ).length;

  const pendingPayments =
    members.filter(
      (member) =>
        member.paymentStatus ===
        "PENDING"
    ).length;

  const totalRevenue =
    filteredOrders
      .filter(
        (order) =>
          order.status !==
          "CANCELLED"
      )
      .reduce(
        (sum, order) =>
          sum + order.total,
        0
      );

  const handleFormChange = (
    field: keyof MemberForm,
    value: string
  ) => {
    setMemberForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  };

  const handleAddFormChange = (
    field: keyof MemberForm,
    value: string
  ) => {
    setAddMemberForm(
      (current) => {
        const updated = {
          ...current,
          [field]: value,
        };

        if (
          field ===
            "startDate" &&
          value
        ) {
          updated.endDate =
            getEndDateOneMonth(
              value
            );
        }

        return updated;
      }
    );
  };

  const generateMemberId = () => {
    const numbers =
      members
        .map((member) => {
          const match =
            member.memberId.match(
              /DS-(\d+)/
            );

          return match
            ? Number(match[1])
            : 0;
        })
        .filter(
          (value) =>
            !Number.isNaN(
              value
            )
        );

    const nextNumber =
      numbers.length > 0
        ? Math.max(
            ...numbers
          ) + 1
        : 1;

    return `DS-${String(
      nextNumber
    ).padStart(4, "0")}`;
  };

  const openAddMember = () => {
    const registrationDate =
      getTodayJakarta();

    setAddMemberForm({
      ...emptyMemberForm,
      memberId:
        generateMemberId(),
      registrationDate,
      startDate:
        registrationDate,
      endDate:
        getEndDateOneMonth(
          registrationDate
        ),
    });

    setAddMemberOpen(true);
  };

  const closeAddMember = () => {
    setAddMemberOpen(false);

    const currentToday =
      getTodayJakarta();

    setAddMemberForm({
      ...emptyMemberForm,
      registrationDate:
        currentToday,
      startDate:
        currentToday,
      endDate:
        getEndDateOneMonth(
          currentToday
        ),
    });
  };

  const getAdminAccessToken = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(
        `Unable to get admin session: ${error.message}`
      );
    }

    if (!session?.access_token) {
      throw new Error(
        "Admin session tidak ditemukan. Silakan login kembali."
      );
    }

    return session.access_token;
  };

  const addMember = async () => {
    if (
      !addMemberForm.name.trim() ||
      !addMemberForm.email.trim() ||
      !addMemberForm.password.trim()
    ) {
      showNotification(
        "Please complete the member name, email, and password."
      );
      return;
    }

    if (addMemberForm.password.length < 6) {
      showNotification(
        "Password must contain at least 6 characters."
      );
      return;
    }

    setActionLoading(true);
    setErrorMessage("");

    try {
      const accessToken = await getAdminAccessToken();

      const response = await fetch(
        "/api/admin/members",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            memberId:
              addMemberForm.memberId || generateMemberId(),
            title: addMemberForm.title.trim(),
            fullName: addMemberForm.name.trim(),
            email: addMemberForm.email.trim().toLowerCase(),
            phone: addMemberForm.phone.trim(),
            password: addMemberForm.password,
            registrationDate:
              addMemberForm.registrationDate || null,
            membershipStart:
              addMemberForm.startDate || null,
            membershipEnd:
              addMemberForm.endDate || null,
            paymentStatus:
              addMemberForm.paymentStatus,
            membershipStatus:
              addMemberForm.membershipStatus,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("ADD MEMBER API ERROR:", result);
        throw new Error(
          result.error || "Unable to add member."
        );
      }

      await loadMembers();
      closeAddMember();

      showNotification(
        "Member account and membership have been created successfully."
      );
    } catch (error) {
      console.error("ADD MEMBER ERROR:", error);

      showNotification(
        error instanceof Error
          ? error.message
          : "Unable to add member."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openEditMember = (member: Member) => {
    setSelectedMember(member);

    setMemberForm({
      memberId: member.memberId,
      title: member.title,
      name: member.name,
      email: member.email,
      phone: member.phone,
      password: "",
      registrationDate: member.registrationDate,
      startDate: member.startDate,
      endDate: member.endDate,
      paymentStatus: member.paymentStatus,
      membershipStatus: member.membershipStatus,
    });

    setEditMemberOpen(true);
  };

  const closeMemberModal = () => {
    setEditMemberOpen(false);
    setSelectedMember(null);
    setMemberForm(emptyMemberForm);
  };

  const saveEditedMember = async () => {
    if (!selectedMember) {
      return;
    }

    if (
      !memberForm.name.trim() ||
      !memberForm.email.trim()
    ) {
      showNotification(
        "Please complete the member information."
      );
      return;
    }

    setActionLoading(true);
    setErrorMessage("");

    try {
      const accessToken = await getAdminAccessToken();

      const response = await fetch(
        "/api/admin/members",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: selectedMember.userId,
            memberId: memberForm.memberId.trim(),
            title: memberForm.title.trim(),
            fullName: memberForm.name.trim(),
            email: memberForm.email.trim().toLowerCase(),
            phone: memberForm.phone.trim(),
            password: memberForm.password.trim() || null,
            membershipStart: memberForm.startDate || null,
            membershipEnd: memberForm.endDate || null,
            paymentStatus: memberForm.paymentStatus,
            membershipStatus: memberForm.membershipStatus,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("UPDATE MEMBER API ERROR:", result);
        throw new Error(
          result.error || "Unable to update member."
        );
      }

      await loadMembers();
      closeMemberModal();

      showNotification(
        "Member information has been updated."
      );
    } catch (error) {
      console.error("SAVE MEMBER ERROR:", error);

      showNotification(
        error instanceof Error
          ? error.message
          : "Unable to update member."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const approveMember = async (
    userId: string
  ) => {
    setActionLoading(true);
    setErrorMessage("");

    try {
      const startDate =
        today;

      const endDate =
        getEndDateOneMonth(
          startDate
        );

      const {
        data,
        error,
      } = await supabase
        .from("memberships")
        .update({
          status: "ACTIVE",
          payment_status:
            "VERIFIED",
          start_date:
            startDate,
          end_date:
            endDate,
        })
        .eq(
          "user_id",
          userId
        )
        .select(
          "id, user_id, status, payment_status, start_date, end_date"
        )
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        showNotification(
          "Membership record was not found."
        );

        return;
      }

      await loadMembers();

      showNotification(
        "Member has been approved and activated."
      );
    } catch (error) {
      console.error(
        "APPROVE MEMBER ERROR:",
        error
      );

      showNotification(
        error instanceof Error
          ? error.message
          : "Unable to approve member."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const updateOrderStatus =
    async (
      orderId: string,
      currentStatus: OrderStatus
    ) => {
      const nextStatus =
        getNextStatus(
          currentStatus
        );

      if (
        nextStatus ===
        currentStatus
      ) {
        return;
      }

      setActionLoading(true);

      try {
        const {
          error,
        } = await supabase
          .from("orders")
          .update({
            status:
              nextStatus,
          })
          .eq(
            "id",
            orderId
          );

        if (error) {
          throw error;
        }

        await Promise.all([
          loadOrders(),
          loadClaims(),
        ]);

        showNotification(
          "Order status has been updated."
        );
      } catch (error) {
        console.error(
          "ORDER STATUS ERROR:",
          error
        );

        showNotification(
          error instanceof Error
            ? error.message
            : "Unable to update order status."
        );
      } finally {
        setActionLoading(false);
      }
    };

  const getOrderAction = (
    status: OrderStatus
  ) => {
    if (
      status ===
      "ORDER RECEIVED"
    ) {
      return "START PREPARING";
    }

    if (
      status ===
      "PREPARING"
    ) {
      return "MARK DELIVERED";
    }

    return "COMPLETED";
  };

  const memberOrders =
    selectedHistoryMember
      ? orders.filter(
          (order) =>
            order.userId ===
            selectedHistoryMember.userId
        )
      : [];

  const memberClaims =
    selectedHistoryMember
      ? claims.filter(
          (claim) =>
            claim.userId ===
            selectedHistoryMember.userId
        )
      : [];

  const downloadQr = () => {
    const svg =
      document.getElementById(
        "deckside-cashier-qr"
      );

    if (!svg) return;

    const svgData =
      new XMLSerializer().serializeToString(
        svg
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    const context =
      canvas.getContext("2d");

    if (!context) return;

    canvas.width = 1000;
    canvas.height = 1000;

    const image =
      new Image();

    image.onload = () => {
      context.fillStyle =
        "#ffffff";

      context.fillRect(
        0,
        0,
        1000,
        1000
      );

      context.drawImage(
        image,
        100,
        100,
        800,
        800
      );

      const link =
        document.createElement(
          "a"
        );

      link.download =
        "Deckside-Cashier-QR.png";

      link.href =
        canvas.toDataURL(
          "image/png"
        );

      link.click();
    };

    image.src =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        svgData
      );
  };

  const exportExcel = () => {
    const workbook =
      XLSX.utils.book_new();

    if (
      reportType ===
        "SUMMARY" ||
      reportType === "ALL"
    ) {
      const summaryData = [
        ["DECKSIDE ADMIN REPORT"],
        [
          "Report Period",
          `${formatDate(
            dateRange.from
          )} - ${formatDate(
            dateRange.to
          )}`,
        ],
        [],
        ["Metric", "Value"],
        [
          "Total Members",
          members.length,
        ],
        [
          "Active Members",
          activeMembers,
        ],
        [
          "Pending Payments",
          pendingPayments,
        ],
        [
          "New Members in Period",
          filteredMembers.length,
        ],
        [
          "Orders in Period",
          filteredOrders.length,
        ],
        [
          "Revenue in Period",
          totalRevenue,
        ],
        [
          "Beverage Claims in Period",
          filteredClaims.length,
        ],
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet(
          summaryData
        ),
        "Summary"
      );
    }

    if (
      reportType ===
        "MEMBERS" ||
      reportType === "ALL"
    ) {
      const data =
        filteredMembers.map(
          (member) => ({
            "Member ID":
              member.memberId,
            Title:
              member.title,
            "Full Name":
              member.name,
            Email:
              member.email,
            Phone:
              member.phone,
            "Registration Date":
              member.registrationDate,
            "Membership Start":
              member.startDate,
            "Membership End":
              member.endDate,
            "Payment Status":
              member.paymentStatus,
            "Membership Status":
              member.membershipStatus,
            Source:
              member.source,
          })
        );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          data
        ),
        "Members"
      );
    }

    if (
      reportType ===
        "ORDERS" ||
      reportType === "ALL"
    ) {
      const data =
        filteredOrders.map(
          (order) => ({
            "Order ID":
              order.orderNumber,
            "Member ID":
              order.memberId,
            Member:
              order.memberName,
            "Order Type":
              order.orderType,
            Items:
              order.items,
            Date:
              order.date,
            Time:
              order.time,
            Total:
              order.total,
            Status:
              order.status,
          })
        );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          data
        ),
        "Orders"
      );
    }

    if (
      reportType ===
        "CLAIMS" ||
      reportType === "ALL"
    ) {
      const data =
        filteredClaims.map(
          (claim) => ({
            "Member ID":
              claim.memberId,
            Member:
              claim.memberName,
            Beverage:
              claim.beverage,
            Date:
              claim.date,
            Time:
              claim.time,
            Status:
              "CLAIMED",
          })
        );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          data
        ),
        "Beverage Claims"
      );
    }

    XLSX.writeFile(
      workbook,
      `Deckside-Report-${dateRange.from}-${dateRange.to}.xlsx`
    );

    showNotification(
      "Excel report has been exported."
    );
  };

  const exportPdf = () => {
    const pdf =
      new jsPDF(
        "landscape",
        "mm",
        "a4"
      );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(18);

    pdf.text(
      "DECKSIDE ADMIN REPORT",
      15,
      18
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(9);

    pdf.text(
      `Report Period: ${formatDate(
        dateRange.from
      )} - ${formatDate(
        dateRange.to
      )}`,
      15,
      25
    );

    let y = 32;

    if (
      reportType ===
        "SUMMARY" ||
      reportType === "ALL"
    ) {
      pdf.setFontSize(12);

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        "Summary",
        15,
        y
      );

      autoTable(pdf, {
        startY: y + 4,
        head: [
          ["Metric", "Value"],
        ],
        body: [
          [
            "Total Members",
            String(
              members.length
            ),
          ],
          [
            "Active Members",
            String(
              activeMembers
            ),
          ],
          [
            "Pending Payments",
            String(
              pendingPayments
            ),
          ],
          [
            "New Members in Period",
            String(
              filteredMembers.length
            ),
          ],
          [
            "Orders in Period",
            String(
              filteredOrders.length
            ),
          ],
          [
            "Revenue in Period",
            formatRupiah(
              totalRevenue
            ),
          ],
          [
            "Beverage Claims",
            String(
              filteredClaims.length
            ),
          ],
        ],
        theme: "grid",
        styles: {
          fontSize: 8,
        },
      });

      y =
        ((pdf as any)
          .lastAutoTable
          ?.finalY ||
          50) + 15;
    }

    if (
      reportType ===
        "MEMBERS" ||
      reportType === "ALL"
    ) {
      if (y > 160) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(12);

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        "Members",
        15,
        y
      );

      autoTable(pdf, {
        startY: y + 4,
        head: [
          [
            "Member ID",
            "Name",
            "Email",
            "Phone",
            "Registration",
            "Start",
            "End",
            "Status",
          ],
        ],
        body:
          filteredMembers.length >
          0
            ? filteredMembers.map(
                (member) => [
                  member.memberId,
                  `${member.title} ${member.name}`,
                  member.email,
                  member.phone ||
                    "-",
                  formatDate(
                    member.registrationDate
                  ),
                  formatDate(
                    member.startDate
                  ),
                  formatDate(
                    member.endDate
                  ),
                  member.membershipStatus,
                ]
              )
            : [
                [
                  "-",
                  "No member data",
                  "-",
                  "-",
                  "-",
                  "-",
                  "-",
                  "-",
                ],
              ],
        theme: "grid",
        styles: {
          fontSize: 7,
        },
      });

      y =
        ((pdf as any)
          .lastAutoTable
          ?.finalY ||
          50) + 15;
    }

    if (
      reportType ===
        "ORDERS" ||
      reportType === "ALL"
    ) {
      if (y > 160) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(12);

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        "Orders",
        15,
        y
      );

      autoTable(pdf, {
        startY: y + 4,
        head: [
          [
            "Order ID",
            "Member",
            "Items",
            "Date",
            "Time",
            "Total",
            "Status",
          ],
        ],
        body:
          filteredOrders.length >
          0
            ? filteredOrders.map(
                (order) => [
                  order.orderNumber,
                  order.memberName,
                  order.items,
                  formatDate(
                    order.date
                  ),
                  order.time,
                  formatRupiah(
                    order.total
                  ),
                  order.status,
                ]
              )
            : [
                [
                  "-",
                  "No order data",
                  "-",
                  "-",
                  "-",
                  "-",
                  "-",
                ],
              ],
        theme: "grid",
        styles: {
          fontSize: 8,
        },
      });

      y =
        ((pdf as any)
          .lastAutoTable
          ?.finalY ||
          50) + 15;
    }

    if (
      reportType ===
        "CLAIMS" ||
      reportType === "ALL"
    ) {
      if (y > 160) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(12);

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        "Complimentary Beverage Claims",
        15,
        y
      );

      autoTable(pdf, {
        startY: y + 4,
        head: [
          [
            "Member ID",
            "Member",
            "Beverage",
            "Date",
            "Time",
            "Status",
          ],
        ],
        body:
          filteredClaims.length >
          0
            ? filteredClaims.map(
                (claim) => [
                  claim.memberId,
                  claim.memberName,
                  claim.beverage,
                  formatDate(
                    claim.date
                  ),
                  claim.time,
                  "CLAIMED",
                ]
              )
            : [
                [
                  "-",
                  "No claim data",
                  "-",
                  "-",
                  "-",
                  "-",
                ],
              ],
        theme: "grid",
        styles: {
          fontSize: 8,
        },
      });
    }

    pdf.save(
      `Deckside-Report-${dateRange.from}-${dateRange.to}.pdf`
    );

    showNotification(
      "PDF report has been exported."
    );
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div
          className={styles.container}
          style={{
            paddingTop:
              "120px",
            textAlign:
              "center",
          }}
        >
          Loading admin dashboard...
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
          <a
            href="/menu"
            className={styles.navItem}
          >
            MENU
          </a>

          <a
            href="/admin"
            className={styles.navItem}
          >
            ADMIN DASHBOARD
          </a>

          <button
            type="button"
            className={styles.navItem}
            onClick={async () => {
              await supabase.auth.signOut();

              window.location.href =
                "/sign-in";
            }}
          >
            SIGN OUT
          </button>
        </div>
      </nav>

      <div className={styles.container}>
        <section className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              DECKSIDE ADMINISTRATION
            </p>

            <h1>
              Admin Dashboard
            </h1>

            <p className={styles.headerText}>
              Manage memberships,
              orders, complimentary
              beverage claims, and
              customer information.
            </p>
          </div>

          <div className={styles.adminInfo}>
            <span>ADMIN</span>

            <strong>
              Deckside Team
            </strong>
          </div>
        </section>

        {errorMessage && (
          <div className={styles.notification}>
            <span>
              {errorMessage}
            </span>

            <button
              type="button"
              onClick={() =>
                setErrorMessage("")
              }
            >
              ×
            </button>
          </div>
        )}

        {notification && (
          <div className={styles.notification}>
            <span>
              {notification}
            </span>

            <button
              type="button"
              onClick={() =>
                setNotification("")
              }
            >
              ×
            </button>
          </div>
        )}

        <section className={styles.filterBar}>
          <div>
            <p className={styles.filterLabel}>
              REPORT PERIOD
            </p>

            <div className={styles.filterOptions}>
              {[
                ["TODAY", "Today"],
                [
                  "YESTERDAY",
                  "Yesterday",
                ],
                [
                  "THIS_WEEK",
                  "This Week",
                ],
                [
                  "THIS_MONTH",
                  "This Month",
                ],
                [
                  "LAST_MONTH",
                  "Last Month",
                ],
                [
                  "CUSTOM",
                  "Custom Range",
                ],
              ].map(
                ([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={
                      dateFilter ===
                      value
                        ? styles.filterActive
                        : styles.filterButton
                    }
                    onClick={() =>
                      setDateFilter(
                        value as DateFilter
                      )
                    }
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {dateFilter ===
            "CUSTOM" && (
            <div
              className={
                styles.customRange
              }
            >
              <div>
                <label>
                  FROM
                </label>

                <input
                  type="date"
                  value={
                    customFrom
                  }
                  onChange={(
                    event
                  ) =>
                    setCustomFrom(
                      event.target
                        .value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  TO
                </label>

                <input
                  type="date"
                  value={
                    customTo
                  }
                  onChange={(
                    event
                  ) =>
                    setCustomTo(
                      event.target
                        .value
                    )
                  }
                />
              </div>
            </div>
          )}

          <div
            className={
              styles.currentRange
            }
          >
            <span>
              SELECTED PERIOD
            </span>

            <strong>
              {formatDate(
                dateRange.from
              )}{" "}
              —{" "}
              {formatDate(
                dateRange.to
              )}
            </strong>
          </div>
        </section>

        <section
          className={
            styles.overview
          }
        >
          <div
            className={
              styles.statCard
            }
          >
            <span>
              TOTAL MEMBERS
            </span>

            <strong>
              {members.length}
            </strong>

            <p>
              All registered members
            </p>
          </div>

          <div
            className={
              styles.statCard
            }
          >
            <span>
              ACTIVE MEMBERS
            </span>

            <strong>
              {activeMembers}
            </strong>

            <p>
              Current active memberships
            </p>
          </div>

          <div
            className={
              styles.statCard
            }
          >
            <span>
              ORDERS
            </span>

            <strong>
              {
                filteredOrders.length
              }
            </strong>

            <p>
              Orders in selected period
            </p>
          </div>

          <div
            className={
              styles.statCard
            }
          >
            <span>
              REVENUE
            </span>

            <strong>
              {formatRupiah(
                totalRevenue
              )}
            </strong>

            <p>
              Revenue in selected period
            </p>
          </div>
        </section>

        <section
          className={
            styles.section
          }
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <div>
              <p
                className={
                  styles.sectionLabel
                }
              >
                REPORTING
              </p>

              <h2>
                Export Report
              </h2>
            </div>
          </div>

          <div
            className={
              styles.exportCard
            }
          >
            <div
              className={
                styles.exportText
              }
            >
              <span>
                SELECTED PERIOD
              </span>

              <strong>
                {formatDate(
                  dateRange.from
                )}{" "}
                —{" "}
                {formatDate(
                  dateRange.to
                )}
              </strong>

              <p>
                Export customer,
                order, membership,
                and beverage claim
                data based on the
                selected period.
              </p>
            </div>

            <div
              className={
                styles.reportType
              }
            >
              <label>
                REPORT TYPE
              </label>

              <select
                value={
                  reportType
                }
                onChange={(
                  event
                ) =>
                  setReportType(
                    event.target
                      .value as ReportType
                  )
                }
              >
                <option value="ALL">
                  All Data
                </option>

                <option value="SUMMARY">
                  Summary
                </option>

                <option value="MEMBERS">
                  Members
                </option>

                <option value="ORDERS">
                  Orders
                </option>

                <option value="CLAIMS">
                  Beverage Claims
                </option>
              </select>
            </div>

            <div
              className={
                styles.exportActions
              }
            >
              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={
                  exportExcel
                }
              >
                EXPORT EXCEL
              </button>

              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={
                  exportPdf
                }
              >
                EXPORT PDF
              </button>
            </div>
          </div>
        </section>

        <section
          className={
            styles.section
          }
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <div>
              <p
                className={
                  styles.sectionLabel
                }
              >
                MEMBERSHIP
              </p>

              <h2>
                Member Database
              </h2>
            </div>

            <div
              className={
                styles.sectionHeaderActions
              }
            >
              <span
                className={
                  styles.sectionCount
                }
              >
                {members.length}{" "}
                MEMBERS
              </span>

              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={
                  openAddMember
                }
              >
                + ADD MEMBER
              </button>
            </div>
          </div>

          <div
            className={
              styles.tableCard
            }
          >
            <div
              className={
                styles.memberTableHeader
              }
            >
              <span>
                MEMBER
              </span>

              <span>
                REGISTRATION
              </span>

              <span>
                MEMBERSHIP
              </span>

              <span>
                SOURCE
              </span>

              <span>
                ACTION
              </span>
            </div>

            {members.map(
              (member) => (
                <div
                  className={
                    styles.memberTableRow
                  }
                  key={
                    member.id
                  }
                >
                  <div
                    className={
                      styles.memberIdentity
                    }
                  >
                    <button
                      type="button"
                      className={
                        styles.memberName
                      }
                      onClick={() =>
                        setSelectedHistoryMember(
                          member
                        )
                      }
                    >
                      {member.title}{" "}
                      {member.name}
                    </button>

                    <span>
                      {
                        member.memberId
                      }
                    </span>

                    <small>
                      {
                        member.email
                      }
                    </small>
                  </div>

                  <span>
                    {formatDate(
                      member.registrationDate
                    )}
                  </span>

                  <span
                    className={
                      member.membershipStatus ===
                      "ACTIVE"
                        ? styles.statusActive
                        : member.membershipStatus ===
                          "PENDING"
                        ? styles.statusPending
                        : styles.statusExpired
                    }
                  >
                    {
                      member.membershipStatus
                    }
                  </span>

                  <span
                    className={
                      styles.source
                    }
                  >
                    {
                      member.source
                    }
                  </span>

                  <div
                    className={
                      styles.actionGroup
                    }
                  >
                    <button
                      type="button"
                      className={
                        styles.secondaryButton
                      }
                      onClick={() =>
                        openEditMember(
                          member
                        )
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      EDIT
                    </button>

                    {member.membershipStatus ===
                      "PENDING" && (
                      <button
                        type="button"
                        className={
                          styles.primarySmallButton
                        }
                        onClick={() =>
                          approveMember(
                            member.userId
                          )
                        }
                        disabled={
                          actionLoading
                        }
                      >
                        {actionLoading
                          ? "PROCESSING..."
                          : "ACTIVATE"}
                      </button>
                    )}
                  </div>
                </div>
              )
            )}

            {members.length ===
              0 && (
              <div
                className={
                  styles.emptyState
                }
              >
                No members registered
                yet.
              </div>
            )}
          </div>
        </section>

        <section
          className={
            styles.section
          }
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <div>
              <p
                className={
                  styles.sectionLabel
                }
              >
                OPERATIONS
              </p>

              <h2>
                Orders
              </h2>
            </div>

            <span
              className={
                styles.sectionCount
              }
            >
              {
                filteredOrders.length
              }{" "}
              ORDERS
            </span>
          </div>

          <div
            className={
              styles.tableCard
            }
          >
            <div
              className={
                styles.orderHeader
              }
            >
              <span>
                ORDER
              </span>

              <span>
                MEMBER
              </span>

              <span>
                MEMBER ID
              </span>

              <span>
                DATE
              </span>

              <span>
                ITEMS
              </span>

              <span>
                TOTAL
              </span>

              <span>
                STATUS
              </span>

              <span>
                ACTION
              </span>
            </div>

            {filteredOrders.map(
              (order) => (
                <div
                  className={
                    styles.orderRow
                  }
                  key={
                    order.id
                  }
                >
                  <div>
                    <strong>
                      {
                        order.orderNumber
                      }
                    </strong>

                    <span>
                      {
                        order.time
                      }
                    </span>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.orderMember
                    }
                    onClick={() => {
                      const member =
                        members.find(
                          (
                            item
                          ) =>
                            item.userId ===
                            order.userId
                        );

                      if (
                        member
                      ) {
                        setSelectedHistoryMember(
                          member
                        );
                      }
                    }}
                  >
                    {
                      order.memberName
                    }
                  </button>

                  <span>
                    {
                      order.memberId
                    }
                  </span>

                  <span>
                    {formatDate(
                      order.date
                    )}
                  </span>

                  <span>
                    {
                      order.items
                    }
                  </span>

                  <strong>
                    {formatRupiah(
                      order.total
                    )}
                  </strong>

                  <span
                    className={
                      styles.orderStatus
                    }
                  >
                    {
                      order.status
                    }
                  </span>

                  <div>
                    {order.status ===
                      "ORDER RECEIVED" ||
                    order.status ===
                      "PREPARING" ? (
                      <button
                        type="button"
                        className={
                          styles.secondaryButton
                        }
                        onClick={() =>
                          updateOrderStatus(
                            order.id,
                            order.status
                          )
                        }
                        disabled={
                          actionLoading
                        }
                      >
                        {
                          getOrderAction(
                            order.status
                          )
                        }
                      </button>
                    ) : order.status ===
                      "DELIVERED" ? (
                      <span
                        className={
                          styles.completed
                        }
                      >
                        COMPLETED
                      </span>
                    ) : (
                      <span
                        className={
                          styles.completed
                        }
                      >
                        CANCELLED
                      </span>
                    )}
                  </div>
                </div>
              )
            )}

            {filteredOrders.length ===
              0 && (
              <div
                className={
                  styles.emptyState
                }
              >
                No orders found in
                the selected period.
              </div>
            )}
          </div>
        </section>

        <section
          className={
            styles.section
          }
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <div>
              <p
                className={
                  styles.sectionLabel
                }
              >
                COMPLIMENTARY BEVERAGE
              </p>

              <h2>
                Claim History
              </h2>
            </div>

            <span
              className={
                styles.sectionCount
              }
            >
              {
                filteredClaims.length
              }{" "}
              CLAIMS
            </span>
          </div>

          <div
            className={
              styles.tableCard
            }
          >
            <div
              className={
                styles.claimHeader
              }
            >
              <span>
                MEMBER
              </span>

              <span>
                MEMBER ID
              </span>

              <span>
                BEVERAGE
              </span>

              <span>
                DATE
              </span>

              <span>
                TIME
              </span>

              <span>
                STATUS
              </span>
            </div>

            {filteredClaims.map(
              (claim) => (
                <div
                  className={
                    styles.claimRow
                  }
                  key={
                    claim.id
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.orderMember
                    }
                    onClick={() => {
                      const member =
                        members.find(
                          (
                            item
                          ) =>
                            item.userId ===
                            claim.userId
                        );

                      if (
                        member
                      ) {
                        setSelectedHistoryMember(
                          member
                        );
                      }
                    }}
                  >
                    {
                      claim.memberName
                    }
                  </button>

                  <span>
                    {
                      claim.memberId
                    }
                  </span>

                  <span>
                    {
                      claim.beverage
                    }
                  </span>

                  <span>
                    {formatDate(
                      claim.date
                    )}
                  </span>

                  <span>
                    {
                      claim.time
                    }
                  </span>

                  <span
                    className={
                      styles.claimed
                    }
                  >
                    CLAIMED
                  </span>
                </div>
              )
            )}

            {filteredClaims.length ===
              0 && (
              <div
                className={
                  styles.emptyState
                }
              >
                No beverage claims
                found in the
                selected period.
              </div>
            )}
          </div>
        </section>

        <section
          className={
            styles.section
          }
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <div>
              <p
                className={
                  styles.sectionLabel
                }
              >
                CASHIER ACCESS
              </p>

              <h2>
                Complimentary Beverage QR
              </h2>
            </div>

            <span
              className={
                styles.sectionCount
              }
            >
              PERMANENT QR
            </span>
          </div>

          <div
            className={
              styles.qrSection
            }
          >
            <div
              className={
                styles.qrText
              }
            >
              <p
                className={
                  styles.qrLabel
                }
              >
                CASHIER QR CODE
              </p>

              <h3>
                Customer Beverage Claim
              </h3>

              <p>
                This QR code is
                used by Deckside
                members to unlock
                their daily
                complimentary
                beverage.
              </p>

              <div
                className={
                  styles.qrStatus
                }
              >
                <span>
                  STATUS
                </span>

                <strong>
                  ACTIVE
                </strong>
              </div>

              <div
                className={
                  styles.qrInfo
                }
              >
                <span>
                  QR TYPE
                </span>

                <strong>
                  Permanent Cashier QR
                </strong>
              </div>

              <div
                className={
                  styles.qrActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.primaryButton
                  }
                  onClick={() =>
                    setQrOpen(
                      true
                    )
                  }
                >
                  VIEW QR
                </button>

                <button
                  type="button"
                  className={
                    styles.secondaryButton
                  }
                  onClick={
                    downloadQr
                  }
                >
                  DOWNLOAD QR
                </button>
              </div>
            </div>

            <div
              className={
                styles.qrPreview
              }
            >
              <QRCodeSVG
                id="deckside-cashier-qr"
                value="DECKSIDE-CLAIM-BEVERAGE"
                size={220}
                bgColor="#ffffff"
                fgColor="#00494f"
                level="H"
              />

              <span>
                DECKSIDE-CLAIM-BEVERAGE
              </span>
            </div>
          </div>
        </section>
      </div>

      {selectedHistoryMember && (
        <div
          className={
            styles.overlay
          }
        >
          <div
            className={
              styles.historyModal
            }
          >
            <button
              type="button"
              className={
                styles.closeButton
              }
              onClick={() =>
                setSelectedHistoryMember(
                  null
                )
              }
            >
              ×
            </button>

            <p
              className={
                styles.sectionLabel
              }
            >
              MEMBER PROFILE
            </p>

            <h2>
              {
                selectedHistoryMember.title
              }{" "}
              {
                selectedHistoryMember.name
              }
            </h2>

            <div
              className={
                styles.profileMeta
              }
            >
              <span>
                {
                  selectedHistoryMember.memberId
                }
              </span>

              <span
                className={
                  selectedHistoryMember.membershipStatus ===
                  "ACTIVE"
                    ? styles.statusActive
                    : selectedHistoryMember.membershipStatus ===
                      "PENDING"
                    ? styles.statusPending
                    : styles.statusExpired
                }
              >
                {
                  selectedHistoryMember.membershipStatus
                }
              </span>
            </div>

            <div
              className={
                styles.profileGrid
              }
            >
              <div>
                <span>
                  EMAIL
                </span>

                <strong>
                  {
                    selectedHistoryMember.email
                  }
                </strong>
              </div>

              <div>
                <span>
                  PHONE
                </span>

                <strong>
                  {
                    selectedHistoryMember.phone ||
                    "-"
                  }
                </strong>
              </div>

              <div>
                <span>
                  MEMBERSHIP START
                </span>

                <strong>
                  {formatDate(
                    selectedHistoryMember.startDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  MEMBERSHIP END
                </span>

                <strong>
                  {formatDate(
                    selectedHistoryMember.endDate
                  )}
                </strong>
              </div>
            </div>

            <div
              className={
                styles.historyBlock
              }
            >
              <div
                className={
                  styles.historyBlockHeader
                }
              >
                <h3>
                  ORDER HISTORY
                </h3>

                <span>
                  {
                    memberOrders.length
                  }{" "}
                  ORDERS
                </span>
              </div>

              {memberOrders.length >
              0 ? (
                memberOrders.map(
                  (order) => (
                    <div
                      className={
                        styles.historyItem
                      }
                      key={
                        order.id
                      }
                    >
                      <div>
                        <strong>
                          {
                            order.orderNumber
                          }
                        </strong>

                        <span>
                          {formatDate(
                            order.date
                          )}{" "}
                          ·{" "}
                          {
                            order.time
                          }
                        </span>
                      </div>

                      <div>
                        <span>
                          {
                            order.items
                          }
                        </span>

                        <strong>
                          {formatRupiah(
                            order.total
                          )}
                        </strong>
                      </div>

                      <span
                        className={
                          styles.orderStatus
                        }
                      >
                        {
                          order.status
                        }
                      </span>
                    </div>
                  )
                )
              ) : (
                <p
                  className={
                    styles.emptyHistory
                  }
                >
                  No orders found.
                </p>
              )}
            </div>

            <div
              className={
                styles.historyBlock
              }
            >
              <div
                className={
                  styles.historyBlockHeader
                }
              >
                <h3>
                  BEVERAGE CLAIM HISTORY
                </h3>

                <span>
                  {
                    memberClaims.length
                  }{" "}
                  CLAIMS
                </span>
              </div>

              {memberClaims.length >
              0 ? (
                memberClaims.map(
                  (claim) => (
                    <div
                      className={
                        styles.historyItem
                      }
                      key={
                        claim.id
                      }
                    >
                      <div>
                        <strong>
                          {
                            claim.beverage
                          }
                        </strong>

                        <span>
                          {formatDate(
                            claim.date
                          )}
                        </span>
                      </div>

                      <span>
                        {
                          claim.time
                        }
                      </span>

                      <span
                        className={
                          styles.claimed
                        }
                      >
                        CLAIMED
                      </span>
                    </div>
                  )
                )
              ) : (
                <p
                  className={
                    styles.emptyHistory
                  }
                >
                  No beverage claims
                  found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {addMemberOpen && (
        <div
          className={
            styles.overlay
          }
        >
          <div
            className={
              styles.historyModal
            }
          >
            <button
              type="button"
              className={
                styles.closeButton
              }
              onClick={
                closeAddMember
              }
            >
              ×
            </button>

            <p
              className={
                styles.sectionLabel
              }
            >
              MEMBER MANAGEMENT
            </p>

            <h2>
              Add Member
            </h2>

            <p
              className={
                styles.modalText
              }
            >
              Create a new Deckside
              member account and
              membership.
            </p>

            <div
              className={
                styles.profileGrid
              }
            >
              <div>
                <span>
                  MEMBER ID
                </span>

                <strong>
                  {
                    addMemberForm.memberId
                  }
                </strong>
              </div>

              <div>
                <span>
                  REGISTRATION
                </span>

                <strong>
                  {formatDate(
                    addMemberForm.registrationDate
                  )}
                </strong>
              </div>
            </div>

            <div
              className={
                styles.memberForm
              }
            >
              <div>
                <label>
                  TITLE
                </label>

                <select
                  value={
                    addMemberForm.title
                  }
                  onChange={(
                    event
                  ) =>
                    handleAddFormChange(
                      "title",
                      event.target
                        .value
                    )
                  }
                >
                  <option value="">
                    Select
                  </option>

                  <option value="Mr.">
                    Mr.
                  </option>

                  <option value="Mrs.">
                    Mrs.
                  </option>

                  <option value="Ms.">
                    Ms.
                  </option>
                </select>
              </div>

              <div>
                <label>
                  FULL NAME
                </label>

                <input
                  type="text"
                  value={
                    addMemberForm.name
                  }
                  onChange={(
                    event
                  ) =>
                    handleAddFormChange(
                      "name",
                      event.target
                        .value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  EMAIL
                </label>

                <input
                  type="email"
                  value={
                    addMemberForm.email
                  }
                  onChange={(
                    event
                  ) =>
                    handleAddFormChange(
                      "email",
                      event.target
                        .value
                    )
                  }
                  placeholder="member@email.com"
                />
              </div>

              <div>
                <label>
                  PASSWORD
                </label>

                <input
                  type="password"
                  value={
                    addMemberForm.password
                  }
                  onChange={(
                    event
                  ) =>
                    handleAddFormChange(
                      "password",
                      event.target
                        .value
                    )
                  }
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label>
                  PHONE
                </label>

                <input
                  type="text"
                  value={
                    addMemberForm.phone
                  }
                  onChange={(
                    event
                  ) =>
                    handleAddFormChange(
                      "phone",
                      event.target
                        .value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  MEMBERSHIP START
                </label>

                <input
                  type="date"
                  value={
                    addMemberForm.startDate
                  }
                  onChange={(
                    event
                  ) =>
                    handleAddFormChange(
                      "startDate",
                      event.target
                        .value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  MEMBERSHIP END
                </label>

                <input
                  type="date"
                  value={
                    addMemberForm.endDate
                  }
                  onChange={(
                    event
                  ) =>
                    handleAddFormChange(
                      "endDate",
                      event.target
                        .value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  PAYMENT STATUS
                </label>

                <select
                  value={
                    addMemberForm.paymentStatus
                  }
                  onChange={(
                    event
                  ) =>
                    handleAddFormChange(
                      "paymentStatus",
                      event.target
                        .value
                    )
                  }
                >
                  <option value="PENDING">
                    PENDING
                  </option>

                  <option value="VERIFIED">
                    VERIFIED
                  </option>
                </select>
              </div>

              <div>
                <label>
                  MEMBERSHIP STATUS
                </label>

                <select
                  value={
                    addMemberForm.membershipStatus
                  }
                  onChange={(
                    event
                  ) =>
                    handleAddFormChange(
                      "membershipStatus",
                      event.target
                        .value
                    )
                  }
                >
                  <option value="PENDING">
                    PENDING
                  </option>

                  <option value="ACTIVE">
                    ACTIVE
                  </option>

                  <option value="EXPIRED">
                    EXPIRED
                  </option>
                </select>
              </div>
            </div>

            <div
              className={
                styles.qrModalActions
              }
            >
              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={
                  addMember
                }
                disabled={
                  actionLoading
                }
              >
                {actionLoading
                  ? "ADDING..."
                  : "ADD MEMBER"}
              </button>

              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={
                  closeAddMember
                }
                disabled={
                  actionLoading
                }
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {qrOpen && (
        <div
          className={
            styles.overlay
          }
        >
          <div
            className={
              styles.qrModal
            }
          >
            <button
              type="button"
              className={
                styles.closeButton
              }
              onClick={() =>
                setQrOpen(false)
              }
            >
              ×
            </button>

            <p
              className={
                styles.sectionLabel
              }
            >
              CASHIER QR
            </p>

            <h2>
              Complimentary Beverage
            </h2>

            <p
              className={
                styles.modalText
              }
            >
              This is the permanent QR
              code for customer
              beverage claims.
            </p>

            <div
              className={
                styles.largeQr
              }
            >
              <QRCodeSVG
                value="DECKSIDE-CLAIM-BEVERAGE"
                size={300}
                bgColor="#ffffff"
                fgColor="#00494f"
                level="H"
              />
            </div>

            <p
              className={
                styles.qrCodeText
              }
            >
              DECKSIDE-CLAIM-BEVERAGE
            </p>

            <div
              className={
                styles.qrModalActions
              }
            >
              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={
                  downloadQr
                }
              >
                DOWNLOAD QR
              </button>

              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={() =>
                  setQrOpen(
                    false
                  )
                }
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {editMemberOpen &&
        selectedMember && (
          <div
            className={
              styles.overlay
            }
          >
            <div
              className={
                styles.historyModal
              }
            >
              <button
                type="button"
                className={
                  styles.closeButton
                }
                onClick={
                  closeMemberModal
                }
              >
                ×
              </button>

              <p
                className={
                  styles.sectionLabel
                }
              >
                MEMBER MANAGEMENT
              </p>

              <h2>
                Edit Member
              </h2>

              <div
                className={
                  styles.profileGrid
                }
              >
                <div>
                  <span>
                    MEMBER ID
                  </span>

                  <strong>
                    {
                      memberForm.memberId
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    REGISTRATION
                  </span>

                  <strong>
                    {formatDate(
                      memberForm.registrationDate
                    )}
                  </strong>
                </div>
              </div>

              <div
                className={
                  styles.memberForm
                }
              >
                <div>
                  <label>
                    TITLE
                  </label>

                  <select
                    value={
                      memberForm.title
                    }
                    onChange={(
                      event
                    ) =>
                      handleFormChange(
                        "title",
                        event.target
                          .value
                      )
                    }
                  >
                    <option value="">
                      Select
                    </option>

                    <option value="Mr.">
                      Mr.
                    </option>

                    <option value="Mrs.">
                      Mrs.
                    </option>

                    <option value="Ms.">
                      Ms.
                    </option>
                  </select>
                </div>

                <div>
                  <label>
                    FULL NAME
                  </label>

                  <input
                    type="text"
                    value={
                      memberForm.name
                    }
                    onChange={(
                      event
                    ) =>
                      handleFormChange(
                        "name",
                        event.target
                          .value
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    EMAIL
                  </label>

                  <input
                    type="email"
                    value={
                      memberForm.email
                    }
                    onChange={(
                      event
                    ) =>
                      handleFormChange(
                        "email",
                        event.target
                          .value
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    NEW PASSWORD
                  </label>

                  <input
                    type="password"
                    value={
                      memberForm.password
                    }
                    onChange={(
                      event
                    ) =>
                      handleFormChange(
                        "password",
                        event.target
                          .value
                      )
                    }
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                <div>
                  <label>
                    PHONE
                  </label>

                  <input
                    type="text"
                    value={
                      memberForm.phone
                    }
                    onChange={(
                      event
                    ) =>
                      handleFormChange(
                        "phone",
                        event.target
                          .value
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    MEMBERSHIP START
                  </label>

                  <input
                    type="date"
                    value={
                      memberForm.startDate
                    }
                    onChange={(
                      event
                    ) =>
                      handleFormChange(
                        "startDate",
                        event.target
                          .value
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    MEMBERSHIP END
                  </label>

                  <input
                    type="date"
                    value={
                      memberForm.endDate
                    }
                    onChange={(
                      event
                    ) =>
                      handleFormChange(
                        "endDate",
                        event.target
                          .value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  PAYMENT STATUS
                </label>

                <select
                  value={
                    memberForm.paymentStatus
                  }
                  onChange={(
                    event
                  ) =>
                    handleFormChange(
                      "paymentStatus",
                      event.target
                        .value
                    )
                  }
                >
                  <option value="PENDING">
                    PENDING
                  </option>

                  <option value="VERIFIED">
                    VERIFIED
                  </option>
                </select>
              </div>

              <div>
                <label>
                  MEMBERSHIP STATUS
                </label>

                <select
                  value={
                    memberForm.membershipStatus
                  }
                  onChange={(
                    event
                  ) =>
                    handleFormChange(
                      "membershipStatus",
                      event.target
                        .value
                    )
                  }
                >
                  <option value="PENDING">
                    PENDING
                  </option>

                  <option value="ACTIVE">
                    ACTIVE
                  </option>

                  <option value="EXPIRED">
                    EXPIRED
                  </option>
                </select>
              </div>
            </div>

            <div
              className={
                styles.qrModalActions
              }
            >
              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={
                  saveEditedMember
                }
                disabled={
                  actionLoading
                }
              >
                {actionLoading
                  ? "SAVING..."
                  : "SAVE CHANGES"}
              </button>

              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={
                  closeMemberModal
                }
                disabled={
                  actionLoading
                }
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}