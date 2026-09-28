"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from "./page.module.css";

type MembershipStatus = "PENDING" | "ACTIVE" | "EXPIRED";
type PaymentStatus = "PENDING" | "VERIFIED";
type OrderStatus = "NEW" | "PREPARING" | "READY" | "DELIVERED";

type Member = {
  id: number;
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
  memberId: string;
  memberName: string;
  items: string;
  total: number;
  date: string;
  time: string;
  status: OrderStatus;
};

type BeverageClaim = {
  id: number;
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
  registrationDate: string;
  startDate: string;
  endDate: string;
  paymentStatus: PaymentStatus;
  membershipStatus: MembershipStatus;
};

const initialMembers: Member[] = [
  {
    id: 1,
    memberId: "DSK-260001",
    title: "Mrs.",
    name: "Hikmah Deviani",
    email: "hikmah@example.com",
    phone: "081234567890",
    registrationDate: "2026-09-24",
    startDate: "2026-09-25",
    endDate: "2026-10-24",
    paymentStatus: "VERIFIED",
    membershipStatus: "ACTIVE",
    source: "ONLINE",
  },
  {
    id: 2,
    memberId: "DSK-260002",
    title: "Ms.",
    name: "Alya Putri",
    email: "alya@example.com",
    phone: "081298765432",
    registrationDate: "2026-09-24",
    startDate: "2026-09-25",
    endDate: "2026-10-24",
    paymentStatus: "VERIFIED",
    membershipStatus: "ACTIVE",
    source: "ONLINE",
  },
  {
    id: 3,
    memberId: "DSK-260003",
    title: "Mr.",
    name: "Rizky Pratama",
    email: "rizky@example.com",
    phone: "081377889900",
    registrationDate: "2026-09-23",
    startDate: "2026-09-24",
    endDate: "2026-10-23",
    paymentStatus: "VERIFIED",
    membershipStatus: "ACTIVE",
    source: "MANUAL",
  },
  {
    id: 4,
    memberId: "DSK-260004",
    title: "Ms.",
    name: "Sarah Amelia",
    email: "sarah@example.com",
    phone: "081355667788",
    registrationDate: "2026-09-22",
    startDate: "2026-09-23",
    endDate: "2026-10-22",
    paymentStatus: "VERIFIED",
    membershipStatus: "ACTIVE",
    source: "MANUAL",
  },
  {
    id: 5,
    memberId: "DSK-260005",
    title: "Mr.",
    name: "Andi Wijaya",
    email: "andi@example.com",
    phone: "081211223344",
    registrationDate: "2026-09-25",
    startDate: "",
    endDate: "",
    paymentStatus: "PENDING",
    membershipStatus: "PENDING",
    source: "ONLINE",
  },
];

const initialOrders: Order[] = [
  {
    id: "DSK-ORD-1024",
    memberId: "DSK-260001",
    memberName: "Hikmah Deviani",
    items: "Menu 8 × 1",
    total: 31000,
    date: "2026-09-25",
    time: "15:42",
    status: "NEW",
  },
  {
    id: "DSK-ORD-1023",
    memberId: "DSK-260002",
    memberName: "Alya Putri",
    items: "Menu 10 × 2",
    total: 79900,
    date: "2026-09-25",
    time: "15:25",
    status: "PREPARING",
  },
  {
    id: "DSK-ORD-1022",
    memberId: "DSK-260003",
    memberName: "Rizky Pratama",
    items: "Menu 12 × 1",
    total: 48895,
    date: "2026-09-24",
    time: "14:58",
    status: "READY",
  },
  {
    id: "DSK-ORD-1021",
    memberId: "DSK-260001",
    memberName: "Hikmah Deviani",
    items: "Menu 9 × 1",
    total: 31600,
    date: "2026-09-23",
    time: "16:12",
    status: "DELIVERED",
  },
];

const initialClaims: BeverageClaim[] = [
  {
    id: 1,
    memberId: "DSK-260001",
    memberName: "Hikmah Deviani",
    beverage: "Menu 3",
    date: "2026-09-25",
    time: "15:31",
  },
  {
    id: 2,
    memberId: "DSK-260004",
    memberName: "Sarah Amelia",
    beverage: "Menu 5",
    date: "2026-09-25",
    time: "15:18",
  },
  {
    id: 3,
    memberId: "DSK-260002",
    memberName: "Alya Putri",
    beverage: "Menu 2",
    date: "2026-09-24",
    time: "15:46",
  },
];

const emptyMemberForm: MemberForm = {
  memberId: "",
  title: "",
  name: "",
  email: "",
  phone: "",
  registrationDate: "",
  startDate: "",
  endDate: "",
  paymentStatus: "VERIFIED",
  membershipStatus: "ACTIVE",
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
};

const getNextStatus = (status: OrderStatus): OrderStatus => {
  if (status === "NEW") return "PREPARING";
  if (status === "PREPARING") return "READY";
  if (status === "READY") return "DELIVERED";
  return "DELIVERED";
};

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [claims] = useState<BeverageClaim[]>(initialClaims);

  const [dateFilter, setDateFilter] =
    useState<DateFilter>("TODAY");

  const [customFrom, setCustomFrom] =
    useState("2026-09-01");

  const [customTo, setCustomTo] =
    useState("2026-09-25");

  const [reportType, setReportType] =
    useState<ReportType>("ALL");

  const [addMemberOpen, setAddMemberOpen] =
    useState(false);

  const [editMemberOpen, setEditMemberOpen] =
    useState(false);

  const [selectedMember, setSelectedMember] =
    useState<Member | null>(null);

  const [selectedHistoryMember, setSelectedHistoryMember] =
    useState<Member | null>(null);

  const [memberForm, setMemberForm] =
    useState<MemberForm>(emptyMemberForm);

  const [notification, setNotification] =
    useState("");

  const [qrOpen, setQrOpen] =
    useState(false);

  const today = "2026-09-25";

  const dateRange = useMemo(() => {
    if (dateFilter === "TODAY") {
      return {
        from: today,
        to: today,
      };
    }

    if (dateFilter === "YESTERDAY") {
      return {
        from: "2026-09-24",
        to: "2026-09-24",
      };
    }

    if (dateFilter === "THIS_WEEK") {
      return {
        from: "2026-09-21",
        to: today,
      };
    }

    if (dateFilter === "THIS_MONTH") {
      return {
        from: "2026-09-01",
        to: today,
      };
    }

    if (dateFilter === "LAST_MONTH") {
      return {
        from: "2026-08-01",
        to: "2026-08-31",
      };
    }

    return {
      from: customFrom,
      to: customTo,
    };
  }, [dateFilter, customFrom, customTo]);

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.date >= dateRange.from &&
        order.date <= dateRange.to
    );
  }, [orders, dateRange]);

  const filteredClaims = useMemo(() => {
    return claims.filter(
      (claim) =>
        claim.date >= dateRange.from &&
        claim.date <= dateRange.to
    );
  }, [claims, dateRange]);

  const filteredMembers = useMemo(() => {
    return members.filter(
      (member) =>
        member.registrationDate >= dateRange.from &&
        member.registrationDate <= dateRange.to
    );
  }, [members, dateRange]);

  const activeMembers = members.filter(
    (member) =>
      member.membershipStatus === "ACTIVE"
  ).length;

  const pendingPayments = members.filter(
    (member) =>
      member.paymentStatus === "PENDING"
  ).length;

  const totalRevenue = filteredOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const showNotification = (message: string) => {
    setNotification(message);

    window.setTimeout(() => {
      setNotification("");
    }, 3000);
  };

  const handleFormChange = (
    field: keyof MemberForm,
    value: string
  ) => {
    setMemberForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const generateMemberId = () => {
    const nextNumber = members.length + 1;

    return `DSK-260${String(nextNumber).padStart(4, "0")}`;
  };

  const openAddMember = () => {
    setMemberForm({
      ...emptyMemberForm,
      memberId: generateMemberId(),
      registrationDate: today,
      startDate: today,
      endDate: "2026-10-24",
    });

    setAddMemberOpen(true);
  };

  const openEditMember = (member: Member) => {
    setSelectedMember(member);

    setMemberForm({
      memberId: member.memberId,
      title: member.title,
      name: member.name,
      email: member.email,
      phone: member.phone,
      registrationDate: member.registrationDate,
      startDate: member.startDate,
      endDate: member.endDate,
      paymentStatus: member.paymentStatus,
      membershipStatus: member.membershipStatus,
    });

    setEditMemberOpen(true);
  };

  const closeMemberModal = () => {
    setAddMemberOpen(false);
    setEditMemberOpen(false);
    setSelectedMember(null);
    setMemberForm(emptyMemberForm);
  };

  const saveNewMember = () => {
    if (
      !memberForm.name ||
      !memberForm.email ||
      !memberForm.phone
    ) {
      showNotification(
        "Please complete the member information."
      );
      return;
    }

    const newMember: Member = {
      id: Date.now(),
      memberId: memberForm.memberId,
      title: memberForm.title,
      name: memberForm.name,
      email: memberForm.email,
      phone: memberForm.phone,
      registrationDate: memberForm.registrationDate,
      startDate: memberForm.startDate,
      endDate: memberForm.endDate,
      paymentStatus: memberForm.paymentStatus,
      membershipStatus: memberForm.membershipStatus,
      source: "MANUAL",
    };

    setMembers((current) => [
      newMember,
      ...current,
    ]);

    closeMemberModal();

    showNotification(
      "Member has been added successfully."
    );
  };

  const saveEditedMember = () => {
    if (!selectedMember) return;

    setMembers((current) =>
      current.map((member) =>
        member.id === selectedMember.id
          ? {
              ...member,
              title: memberForm.title,
              name: memberForm.name,
              email: memberForm.email,
              phone: memberForm.phone,
              registrationDate:
                memberForm.registrationDate,
              startDate: memberForm.startDate,
              endDate: memberForm.endDate,
              paymentStatus:
                memberForm.paymentStatus,
              membershipStatus:
                memberForm.membershipStatus,
            }
          : member
      )
    );

    closeMemberModal();

    showNotification(
      "Member information has been updated."
    );
  };

  const verifyPayment = (id: number) => {
    setMembers((current) =>
      current.map((member) =>
        member.id === id
          ? {
              ...member,
              paymentStatus: "VERIFIED",
            }
          : member
      )
    );

    showNotification(
      "Payment has been verified."
    );
  };

  const activateMembership = (id: number) => {
    setMembers((current) =>
      current.map((member) =>
        member.id === id
          ? {
              ...member,
              membershipStatus: "ACTIVE",
              startDate: today,
              endDate: "2026-10-24",
            }
          : member
      )
    );

    showNotification(
      "Membership has been activated."
    );
  };

  const updateOrderStatus = (id: string) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === id
          ? {
              ...order,
              status: getNextStatus(order.status),
            }
          : order
      )
    );

    showNotification(
      "Order status has been updated."
    );
  };

  const getOrderAction = (
    status: OrderStatus
  ) => {
    if (status === "NEW") {
      return "START PREPARING";
    }

    if (status === "PREPARING") {
      return "MARK READY";
    }

    if (status === "READY") {
      return "MARK DELIVERED";
    }

    return "COMPLETED";
  };

  const memberOrders = selectedHistoryMember
    ? orders.filter(
        (order) =>
          order.memberId ===
          selectedHistoryMember.memberId
      )
    : [];

  const memberClaims = selectedHistoryMember
    ? claims.filter(
        (claim) =>
          claim.memberId ===
          selectedHistoryMember.memberId
      )
    : [];

  const downloadQr = () => {
    const svg = document.getElementById(
      "deckside-cashier-qr"
    );

    if (!svg) return;

    const svgData =
      new XMLSerializer().serializeToString(svg);

    const canvas =
      document.createElement("canvas");

    const context =
      canvas.getContext("2d");

    if (!context) return;

    canvas.width = 1000;
    canvas.height = 1000;

    const image = new Image();

    image.onload = () => {
      context.fillStyle = "#ffffff";
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
        document.createElement("a");

      link.download =
        "Deckside-Cashier-QR.png";

      link.href =
        canvas.toDataURL("image/png");

      link.click();
    };

    image.src =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(svgData);
  };

  const exportExcel = () => {
    const workbook =
      XLSX.utils.book_new();

    if (
      reportType === "SUMMARY" ||
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

      const sheet =
        XLSX.utils.aoa_to_sheet(
          summaryData
        );

      XLSX.utils.book_append_sheet(
        workbook,
        sheet,
        "Summary"
      );
    }

    if (
      reportType === "MEMBERS" ||
      reportType === "ALL"
    ) {
      const data =
        filteredMembers.map(
          (member) => ({
            "Member ID": member.memberId,
            Title: member.title,
            "Full Name": member.name,
            Email: member.email,
            Phone: member.phone,
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
            Source: member.source,
          })
        );

      const sheet =
        XLSX.utils.json_to_sheet(data);

      XLSX.utils.book_append_sheet(
        workbook,
        sheet,
        "Members"
      );
    }

    if (
      reportType === "ORDERS" ||
      reportType === "ALL"
    ) {
      const data =
        filteredOrders.map(
          (order) => ({
            "Order ID": order.id,
            "Member ID": order.memberId,
            Member: order.memberName,
            Items: order.items,
            Date: order.date,
            Time: order.time,
            Total: order.total,
            Status: order.status,
          })
        );

      const sheet =
        XLSX.utils.json_to_sheet(data);

      XLSX.utils.book_append_sheet(
        workbook,
        sheet,
        "Orders"
      );
    }

    if (
      reportType === "CLAIMS" ||
      reportType === "ALL"
    ) {
      const data =
        filteredClaims.map(
          (claim) => ({
            "Member ID": claim.memberId,
            Member: claim.memberName,
            Beverage: claim.beverage,
            Date: claim.date,
            Time: claim.time,
            Status: "CLAIMED",
          })
        );

      const sheet =
        XLSX.utils.json_to_sheet(data);

      XLSX.utils.book_append_sheet(
        workbook,
        sheet,
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
    const pdf = new jsPDF(
      "landscape",
      "mm",
      "a4"
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);

    pdf.text(
      "DECKSIDE ADMIN REPORT",
      15,
      18
    );

    pdf.setFont("helvetica", "normal");
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
      reportType === "SUMMARY" ||
      reportType === "ALL"
    ) {
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");

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
            String(members.length),
          ],
          [
            "Active Members",
            String(activeMembers),
          ],
          [
            "Pending Payments",
            String(pendingPayments),
          ],
          [
            "New Members in Period",
            String(filteredMembers.length),
          ],
          [
            "Orders in Period",
            String(filteredOrders.length),
          ],
          [
            "Revenue in Period",
            formatRupiah(totalRevenue),
          ],
          [
            "Beverage Claims",
            String(filteredClaims.length),
          ],
        ],
        theme: "grid",
        styles: {
          fontSize: 8,
        },
      });

      y =
        ((pdf as any).lastAutoTable?.finalY ||
          50) + 15;
    }

    if (
      reportType === "MEMBERS" ||
      reportType === "ALL"
    ) {
      if (y > 160) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");

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
          filteredMembers.length > 0
            ? filteredMembers.map(
                (member) => [
                  member.memberId,
                  `${member.title} ${member.name}`,
                  member.email,
                  member.phone,
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
        ((pdf as any).lastAutoTable?.finalY ||
          50) + 15;
    }

    if (
      reportType === "ORDERS" ||
      reportType === "ALL"
    ) {
      if (y > 160) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");

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
          filteredOrders.length > 0
            ? filteredOrders.map(
                (order) => [
                  order.id,
                  order.memberName,
                  order.items,
                  formatDate(order.date),
                  order.time,
                  formatRupiah(order.total),
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
        ((pdf as any).lastAutoTable?.finalY ||
          50) + 15;
    }

    if (
      reportType === "CLAIMS" ||
      reportType === "ALL"
    ) {
      if (y > 160) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");

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
          filteredClaims.length > 0
            ? filteredClaims.map(
                (claim) => [
                  claim.memberId,
                  claim.memberName,
                  claim.beverage,
                  formatDate(claim.date),
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
          <a href="/menu">MENU</a>

          <a href="/dashboard">
            DASHBOARD
          </a>

          <a href="/sign-in">
            SIGN OUT
          </a>
        </div>
      </nav>

      <div className={styles.container}>
        <section className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              DECKSIDE ADMINISTRATION
            </p>

            <h1>Admin Dashboard</h1>

            <p className={styles.headerText}>
              Manage memberships, orders,
              complimentary beverage claims,
              and customer information.
            </p>
          </div>

          <div className={styles.adminInfo}>
            <span>ADMIN</span>
            <strong>
              Deckside Team
            </strong>
          </div>
        </section>

        {notification && (
          <div className={styles.notification}>
            <span>{notification}</span>

            <button
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
              <button
                className={
                  dateFilter === "TODAY"
                    ? styles.filterActive
                    : styles.filterButton
                }
                onClick={() =>
                  setDateFilter("TODAY")
                }
              >
                Today
              </button>

              <button
                className={
                  dateFilter === "YESTERDAY"
                    ? styles.filterActive
                    : styles.filterButton
                }
                onClick={() =>
                  setDateFilter("YESTERDAY")
                }
              >
                Yesterday
              </button>

              <button
                className={
                  dateFilter === "THIS_WEEK"
                    ? styles.filterActive
                    : styles.filterButton
                }
                onClick={() =>
                  setDateFilter("THIS_WEEK")
                }
              >
                This Week
              </button>

              <button
                className={
                  dateFilter === "THIS_MONTH"
                    ? styles.filterActive
                    : styles.filterButton
                }
                onClick={() =>
                  setDateFilter("THIS_MONTH")
                }
              >
                This Month
              </button>

              <button
                className={
                  dateFilter === "LAST_MONTH"
                    ? styles.filterActive
                    : styles.filterButton
                }
                onClick={() =>
                  setDateFilter("LAST_MONTH")
                }
              >
                Last Month
              </button>

              <button
                className={
                  dateFilter === "CUSTOM"
                    ? styles.filterActive
                    : styles.filterButton
                }
                onClick={() =>
                  setDateFilter("CUSTOM")
                }
              >
                Custom Range
              </button>
            </div>
          </div>

          {dateFilter === "CUSTOM" && (
            <div className={styles.customRange}>
              <div>
                <label>FROM</label>

                <input
                  type="date"
                  value={customFrom}
                  onChange={(event) =>
                    setCustomFrom(
                      event.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>TO</label>

                <input
                  type="date"
                  value={customTo}
                  onChange={(event) =>
                    setCustomTo(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>
          )}

          <div className={styles.currentRange}>
            <span>SELECTED PERIOD</span>

            <strong>
              {formatDate(dateRange.from)}{" "}
              —{" "}
              {formatDate(dateRange.to)}
            </strong>
          </div>
        </section>

        <section className={styles.overview}>
          <div className={styles.statCard}>
            <span>TOTAL MEMBERS</span>

            <strong>
              {members.length}
            </strong>

            <p>
              All registered members
            </p>
          </div>

          <div className={styles.statCard}>
            <span>ACTIVE MEMBERS</span>

            <strong>
              {activeMembers}
            </strong>

            <p>
              Current active memberships
            </p>
          </div>

          <div className={styles.statCard}>
            <span>ORDERS</span>

            <strong>
              {filteredOrders.length}
            </strong>

            <p>
              Orders in selected period
            </p>
          </div>

          <div className={styles.statCard}>
            <span>REVENUE</span>

            <strong>
              {formatRupiah(totalRevenue)}
            </strong>

            <p>
              Revenue in selected period
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>
                REPORTING
              </p>

              <h2>Export Report</h2>
            </div>
          </div>

          <div className={styles.exportCard}>
            <div className={styles.exportText}>
              <span>SELECTED PERIOD</span>

              <strong>
                {formatDate(dateRange.from)}{" "}
                —{" "}
                {formatDate(dateRange.to)}
              </strong>

              <p>
                Export customer, order,
                membership, and beverage
                claim data based on the
                selected period.
              </p>
            </div>

            <div className={styles.reportType}>
              <label>REPORT TYPE</label>

              <select
                value={reportType}
                onChange={(event) =>
                  setReportType(
                    event.target.value as ReportType
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

            <div className={styles.exportActions}>
              <button
                className={styles.primaryButton}
                onClick={exportExcel}
              >
                EXPORT EXCEL
              </button>

              <button
                className={styles.secondaryButton}
                onClick={exportPdf}
              >
                EXPORT PDF
              </button>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>
                MEMBERSHIP
              </p>

              <h2>Member Database</h2>
            </div>

            <button
              className={styles.primaryButton}
              onClick={openAddMember}
            >
              ADD MEMBER
            </button>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.memberTableHeader}>
              <span>MEMBER</span>
              <span>REGISTRATION</span>
              <span>MEMBERSHIP</span>
              <span>SOURCE</span>
              <span>ACTION</span>
            </div>

            {filteredMembers.map(
              (member) => (
                <div
                  className={styles.memberTableRow}
                  key={member.id}
                >
                  <div className={styles.memberIdentity}>
                    <button
                      className={styles.memberName}
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
                      {member.memberId}
                    </span>

                    <small>
                      {member.email}
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
                    {member.membershipStatus}
                  </span>

                  <span className={styles.source}>
                    {member.source}
                  </span>

                  <div className={styles.actionGroup}>
                    <button
                      className={
                        styles.secondaryButton
                      }
                      onClick={() =>
                        openEditMember(member)
                      }
                    >
                      EDIT
                    </button>

                    {member.paymentStatus ===
                      "PENDING" && (
                      <button
                        className={
                          styles.secondaryButton
                        }
                        onClick={() =>
                          verifyPayment(member.id)
                        }
                      >
                        VERIFY
                      </button>
                    )}

                    {member.paymentStatus ===
                      "VERIFIED" &&
                      member.membershipStatus ===
                        "PENDING" && (
                        <button
                          className={
                            styles.primarySmallButton
                          }
                          onClick={() =>
                            activateMembership(
                              member.id
                            )
                          }
                        >
                          ACTIVATE
                        </button>
                      )}
                  </div>
                </div>
              )
            )}

            {filteredMembers.length === 0 && (
              <div className={styles.emptyState}>
                No members found in the
                selected period.
              </div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>
                OPERATIONS
              </p>

              <h2>Orders</h2>
            </div>

            <span className={styles.sectionCount}>
              {filteredOrders.length} ORDERS
            </span>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.orderHeader}>
              <span>ORDER</span>
              <span>MEMBER</span>
              <span>DATE</span>
              <span>ITEMS</span>
              <span>TOTAL</span>
              <span>STATUS</span>
              <span>ACTION</span>
            </div>

            {filteredOrders.map(
              (order) => (
                <div
                  className={styles.orderRow}
                  key={order.id}
                >
                  <div>
                    <strong>
                      {order.id}
                    </strong>

                    <span>
                      {order.time}
                    </span>
                  </div>

                  <button
                    className={styles.orderMember}
                    onClick={() => {
                      const member =
                        members.find(
                          (item) =>
                            item.memberId ===
                            order.memberId
                        );

                      if (member) {
                        setSelectedHistoryMember(
                          member
                        );
                      }
                    }}
                  >
                    {order.memberName}
                  </button>

                  <span>
                    {formatDate(order.date)}
                  </span>

                  <span>
                    {order.items}
                  </span>

                  <strong>
                    {formatRupiah(
                      order.total
                    )}
                  </strong>

                  <span className={styles.orderStatus}>
                    {order.status}
                  </span>

                  <div>
                    {order.status !==
                    "DELIVERED" ? (
                      <button
                        className={
                          styles.secondaryButton
                        }
                        onClick={() =>
                          updateOrderStatus(
                            order.id
                          )
                        }
                      >
                        {getOrderAction(
                          order.status
                        )}
                      </button>
                    ) : (
                      <span className={styles.completed}>
                        COMPLETED
                      </span>
                    )}
                  </div>
                </div>
              )
            )}

            {filteredOrders.length === 0 && (
              <div className={styles.emptyState}>
                No orders found in the
                selected period.
              </div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>
                COMPLIMENTARY BEVERAGE
              </p>

              <h2>Claim History</h2>
            </div>

            <span className={styles.sectionCount}>
              {filteredClaims.length} CLAIMS
            </span>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.claimHeader}>
              <span>MEMBER</span>
              <span>MEMBER ID</span>
              <span>BEVERAGE</span>
              <span>DATE</span>
              <span>TIME</span>
              <span>STATUS</span>
            </div>

            {filteredClaims.map(
              (claim) => (
                <div
                  className={styles.claimRow}
                  key={claim.id}
                >
                  <button
                    className={styles.orderMember}
                    onClick={() => {
                      const member =
                        members.find(
                          (item) =>
                            item.memberId ===
                            claim.memberId
                        );

                      if (member) {
                        setSelectedHistoryMember(
                          member
                        );
                      }
                    }}
                  >
                    {claim.memberName}
                  </button>

                  <span>
                    {claim.memberId}
                  </span>

                  <span>
                    {claim.beverage}
                  </span>

                  <span>
                    {formatDate(claim.date)}
                  </span>

                  <span>
                    {claim.time}
                  </span>

                  <span className={styles.claimed}>
                    CLAIMED
                  </span>
                </div>
              )
            )}

            {filteredClaims.length === 0 && (
              <div className={styles.emptyState}>
                No beverage claims found
                in the selected period.
              </div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>
                CASHIER ACCESS
              </p>

              <h2>
                Complimentary Beverage QR
              </h2>
            </div>

            <span className={styles.sectionCount}>
              PERMANENT QR
            </span>
          </div>

          <div className={styles.qrSection}>
            <div className={styles.qrText}>
              <p className={styles.qrLabel}>
                CASHIER QR CODE
              </p>

              <h3>
                Customer Beverage Claim
              </h3>

              <p>
                This QR code is used by
                Deckside members to unlock
                their daily complimentary
                beverage.
              </p>

              <div className={styles.qrStatus}>
                <span>STATUS</span>
                <strong>ACTIVE</strong>
              </div>

              <div className={styles.qrInfo}>
                <span>QR TYPE</span>

                <strong>
                  Permanent Cashier QR
                </strong>
              </div>

              <div className={styles.qrActions}>
                <button
                  className={styles.primaryButton}
                  onClick={() =>
                    setQrOpen(true)
                  }
                >
                  VIEW QR
                </button>

                <button
                  className={styles.secondaryButton}
                  onClick={downloadQr}
                >
                  DOWNLOAD QR
                </button>
              </div>
            </div>

            <div className={styles.qrPreview}>
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

      {(addMemberOpen ||
        editMemberOpen) && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <button
              className={styles.closeButton}
              onClick={closeMemberModal}
            >
              ×
            </button>

            <p className={styles.sectionLabel}>
              {addMemberOpen
                ? "MANUAL MEMBER ENTRY"
                : "MEMBER INFORMATION"}
            </p>

            <h2>
              {addMemberOpen
                ? "Add Member"
                : "Edit Member"}
            </h2>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>MEMBER ID</label>

                <input
                  value={memberForm.memberId}
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label>TITLE</label>

                <select
                  value={memberForm.title}
                  onChange={(event) =>
                    handleFormChange(
                      "title",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select title
                  </option>

                  <option value="Mr.">
                    Mr.
                  </option>

                  <option value="Ms.">
                    Ms.
                  </option>

                  <option value="Mrs.">
                    Mrs.
                  </option>
                </select>
              </div>

              <div
                className={`${styles.formGroup} ${styles.fullWidth}`}
              >
                <label>FULL NAME</label>

                <input
                  value={memberForm.name}
                  onChange={(event) =>
                    handleFormChange(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Enter full name"
                />
              </div>

              <div className={styles.formGroup}>
                <label>EMAIL</label>

                <input
                  type="email"
                  value={memberForm.email}
                  onChange={(event) =>
                    handleFormChange(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="Enter email"
                />
              </div>

              <div className={styles.formGroup}>
                <label>PHONE</label>

                <input
                  value={memberForm.phone}
                  onChange={(event) =>
                    handleFormChange(
                      "phone",
                      event.target.value
                    )
                  }
                  placeholder="Enter phone number"
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  REGISTRATION DATE
                </label>

                <input
                  type="date"
                  value={
                    memberForm.registrationDate
                  }
                  onChange={(event) =>
                    handleFormChange(
                      "registrationDate",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  MEMBERSHIP START
                </label>

                <input
                  type="date"
                  value={memberForm.startDate}
                  onChange={(event) =>
                    handleFormChange(
                      "startDate",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  MEMBERSHIP END
                </label>

                <input
                  type="date"
                  value={memberForm.endDate}
                  onChange={(event) =>
                    handleFormChange(
                      "endDate",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  PAYMENT STATUS
                </label>

                <select
                  value={
                    memberForm.paymentStatus
                  }
                  onChange={(event) =>
                    handleFormChange(
                      "paymentStatus",
                      event.target.value
                    )
                  }
                >
                  <option value="VERIFIED">
                    VERIFIED
                  </option>

                  <option value="PENDING">
                    PENDING
                  </option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  MEMBERSHIP STATUS
                </label>

                <select
                  value={
                    memberForm.membershipStatus
                  }
                  onChange={(event) =>
                    handleFormChange(
                      "membershipStatus",
                      event.target.value
                    )
                  }
                >
                  <option value="ACTIVE">
                    ACTIVE
                  </option>

                  <option value="PENDING">
                    PENDING
                  </option>

                  <option value="EXPIRED">
                    EXPIRED
                  </option>
                </select>
              </div>
            </div>

            <button
              className={styles.primaryButtonFull}
              onClick={
                addMemberOpen
                  ? saveNewMember
                  : saveEditedMember
              }
            >
              {addMemberOpen
                ? "ADD MEMBER"
                : "SAVE CHANGES"}
            </button>
          </div>
        </div>
      )}

      {selectedHistoryMember && (
        <div className={styles.overlay}>
          <div className={styles.historyModal}>
            <button
              className={styles.closeButton}
              onClick={() =>
                setSelectedHistoryMember(null)
              }
            >
              ×
            </button>

            <p className={styles.sectionLabel}>
              MEMBER PROFILE
            </p>

            <h2>
              {selectedHistoryMember.title}{" "}
              {selectedHistoryMember.name}
            </h2>

            <div className={styles.profileMeta}>
              <span>
                {selectedHistoryMember.memberId}
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

            <div className={styles.profileGrid}>
              <div>
                <span>EMAIL</span>

                <strong>
                  {selectedHistoryMember.email}
                </strong>
              </div>

              <div>
                <span>PHONE</span>

                <strong>
                  {selectedHistoryMember.phone}
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

            <div className={styles.historyBlock}>
              <div
                className={
                  styles.historyBlockHeader
                }
              >
                <h3>ORDER HISTORY</h3>

                <span>
                  {memberOrders.length} ORDERS
                </span>
              </div>

              {memberOrders.length > 0 ? (
                memberOrders.map(
                  (order) => (
                    <div
                      className={
                        styles.historyItem
                      }
                      key={order.id}
                    >
                      <div>
                        <strong>
                          {order.id}
                        </strong>

                        <span>
                          {formatDate(
                            order.date
                          )}{" "}
                          ·{" "}
                          {order.time}
                        </span>
                      </div>

                      <div>
                        <span>
                          {order.items}
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
                        {order.status}
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

            <div className={styles.historyBlock}>
              <div
                className={
                  styles.historyBlockHeader
                }
              >
                <h3>
                  BEVERAGE CLAIM HISTORY
                </h3>

                <span>
                  {memberClaims.length} CLAIMS
                </span>
              </div>

              {memberClaims.length > 0 ? (
                memberClaims.map(
                  (claim) => (
                    <div
                      className={
                        styles.historyItem
                      }
                      key={claim.id}
                    >
                      <div>
                        <strong>
                          {claim.beverage}
                        </strong>

                        <span>
                          {formatDate(
                            claim.date
                          )}
                        </span>
                      </div>

                      <span>
                        {claim.time}
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

      {qrOpen && (
        <div className={styles.overlay}>
          <div className={styles.qrModal}>
            <button
              className={styles.closeButton}
              onClick={() =>
                setQrOpen(false)
              }
            >
              ×
            </button>

            <p className={styles.sectionLabel}>
              CASHIER QR
            </p>

            <h2>
              Complimentary Beverage
            </h2>

            <p className={styles.modalText}>
              This is the permanent QR
              code for customer beverage
              claims.
            </p>

            <div className={styles.largeQr}>
              <QRCodeSVG
                value="DECKSIDE-CLAIM-BEVERAGE"
                size={300}
                bgColor="#ffffff"
                fgColor="#00494f"
                level="H"
              />
            </div>

            <p className={styles.qrCodeText}>
              DECKSIDE-CLAIM-BEVERAGE
            </p>

            <div className={styles.qrModalActions}>
              <button
                className={styles.primaryButton}
                onClick={downloadQr}
              >
                DOWNLOAD QR
              </button>

              <button
                className={styles.secondaryButton}
                onClick={() =>
                  setQrOpen(false)
                }
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}