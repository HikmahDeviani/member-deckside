import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL belum tersedia.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum tersedia.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getJakartaDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getEndDateOneMonth(startDate: string): string {
  const [year, month, day] = startDate.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCMonth(date.getUTCMonth() + 1);

  return date.toISOString().slice(0, 10);
}

async function getAuthenticatedUser(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      user: null,
      error: "Missing authorization token.",
    };
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return {
      user: null,
      error: "Invalid authorization token.",
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      error: "Invalid or expired session.",
    };
  }

  return {
    user,
    error: null,
  };
}

async function checkAdmin(userId: string): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.role === "admin";
}

/* =========================================================
   GET
   Admin mengambil semua extension requests
========================================================= */

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { user, error: authError } =
      await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: authError || "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const isAdmin = await checkAdmin(user.id);

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    const { data: requests, error: requestsError } =
      await supabaseAdmin
        .from("membership_extension_requests")
        .select(
          `
            id,
            user_id,
            status,
            payment_status,
            requested_at,
            processed_at
          `
        )
        .order("requested_at", {
          ascending: false,
        });

    if (requestsError) {
      console.error(
        "EXTENSION GET REQUESTS ERROR:",
        requestsError
      );

      return NextResponse.json(
        {
          error: requestsError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({
        requests: [],
      });
    }

    const userIds = [
      ...new Set(requests.map((item) => item.user_id)),
    ];

    const { data: profiles, error: profilesError } =
      await supabaseAdmin
        .from("profiles")
        .select(
          `
            id,
            member_id,
            title,
            full_name,
            email
          `
        )
        .in("id", userIds);

    if (profilesError) {
      console.error(
        "EXTENSION GET PROFILES ERROR:",
        profilesError
      );

      return NextResponse.json(
        {
          error: profilesError.message,
        },
        {
          status: 500,
        }
      );
    }

    const { data: memberships, error: membershipsError } =
      await supabaseAdmin
        .from("memberships")
        .select(
          `
            id,
            user_id,
            status,
            payment_status,
            start_date,
            end_date
          `
        )
        .in("user_id", userIds);

    if (membershipsError) {
      console.error(
        "EXTENSION GET MEMBERSHIPS ERROR:",
        membershipsError
      );

      return NextResponse.json(
        {
          error: membershipsError.message,
        },
        {
          status: 500,
        }
      );
    }

    const profileMap = new Map(
      (profiles || []).map((profile) => [
        profile.id,
        profile,
      ])
    );

    const membershipMap = new Map(
      (memberships || []).map((membership) => [
        membership.user_id,
        membership,
      ])
    );

    const result = requests.map((requestItem) => {
      const profile = profileMap.get(requestItem.user_id);
      const membership = membershipMap.get(
        requestItem.user_id
      );

      return {
        id: requestItem.id,
        userId: requestItem.user_id,

        memberId: profile?.member_id || "-",
        title: profile?.title || "",
        memberName: profile?.full_name || "-",
        email: profile?.email || "-",

        requestStatus: requestItem.status,
        paymentStatus: requestItem.payment_status,

        requestedAt: requestItem.requested_at,
        processedAt: requestItem.processed_at,

        currentMembershipStatus:
          membership?.status || null,

        currentPaymentStatus:
          membership?.payment_status || null,

        currentStartDate:
          membership?.start_date || null,

        currentEndDate:
          membership?.end_date || null,
      };
    });

    return NextResponse.json({
      requests: result,
    });
  } catch (error) {
    console.error(
      "EXTENSION GET UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while loading extension requests.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
   Member membuat extension request
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { user, error: authError } =
      await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: authError || "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const isAdmin = await checkAdmin(user.id);

    if (isAdmin) {
      return NextResponse.json(
        {
          error:
            "Admin accounts cannot submit membership extension requests.",
        },
        {
          status: 403,
        }
      );
    }

    const { data: existingRequest, error: existingError } =
      await supabaseAdmin
        .from("membership_extension_requests")
        .select("id, status, payment_status")
        .eq("user_id", user.id)
        .eq("status", "PENDING")
        .limit(1)
        .maybeSingle();

    if (existingError) {
      console.error(
        "EXTENSION CHECK ERROR:",
        existingError
      );

      return NextResponse.json(
        {
          error: existingError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (existingRequest) {
      return NextResponse.json({
        success: true,
        existing: true,
        request: existingRequest,
      });
    }

    const { data: membership, error: membershipError } =
      await supabaseAdmin
        .from("memberships")
        .select(
          `
            id,
            user_id,
            status,
            payment_status,
            start_date,
            end_date
          `
        )
        .eq("user_id", user.id)
        .maybeSingle();

    if (membershipError) {
      console.error(
        "EXTENSION MEMBERSHIP CHECK ERROR:",
        membershipError
      );

      return NextResponse.json(
        {
          error: membershipError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          error: "Membership record could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    const { data: newRequest, error: insertError } =
      await supabaseAdmin
        .from("membership_extension_requests")
        .insert({
          user_id: user.id,
          status: "PENDING",
          payment_status: "PENDING",
        })
        .select(
          `
            id,
            user_id,
            status,
            payment_status,
            requested_at
          `
        )
        .single();

    if (insertError) {
      console.error(
        "EXTENSION INSERT ERROR:",
        insertError
      );

      return NextResponse.json(
        {
          error: insertError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      existing: false,
      request: newRequest,
    });
  } catch (error) {
    console.error(
      "EXTENSION POST UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while submitting your extension request.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PUT
   Admin approve / reject extension request
========================================================= */

export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { user, error: authError } =
      await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: authError || "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const isAdmin = await checkAdmin(user.id);

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    let body: {
      requestId?: string;
      action?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    const requestId = body.requestId;
    const action = body.action;

    if (!requestId) {
      return NextResponse.json(
        {
          error: "Request ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      action !== "APPROVE" &&
      action !== "REJECT"
    ) {
      return NextResponse.json(
        {
          error:
            "Action must be APPROVE or REJECT.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: extensionRequest,
      error: extensionError,
    } = await supabaseAdmin
      .from("membership_extension_requests")
      .select(
        `
          id,
          user_id,
          status,
          payment_status
        `
      )
      .eq("id", requestId)
      .maybeSingle();

    if (extensionError) {
      console.error(
        "EXTENSION REQUEST FIND ERROR:",
        extensionError
      );

      return NextResponse.json(
        {
          error: extensionError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!extensionRequest) {
      return NextResponse.json(
        {
          error:
            "Extension request could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (extensionRequest.status !== "PENDING") {
      return NextResponse.json(
        {
          error:
            "This extension request has already been processed.",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       REJECT
    ========================= */

    if (action === "REJECT") {
      const {
        data: rejectedRequest,
        error: rejectError,
      } = await supabaseAdmin
        .from("membership_extension_requests")
        .update({
          status: "REJECTED",
          processed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select(
          `
            id,
            user_id,
            status,
            payment_status,
            requested_at,
            processed_at
          `
        )
        .single();

      if (rejectError) {
        console.error(
          "EXTENSION REJECT ERROR:",
          rejectError
        );

        return NextResponse.json(
          {
            error: rejectError.message,
          },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json({
        success: true,
        action: "REJECT",
        request: rejectedRequest,
      });
    }

    /* =========================
       APPROVE
    ========================= */

    const {
      data: membership,
      error: membershipFindError,
    } = await supabaseAdmin
      .from("memberships")
      .select(
        `
          id,
          user_id,
          status,
          payment_status,
          start_date,
          end_date
        `
      )
      .eq("user_id", extensionRequest.user_id)
      .maybeSingle();

    if (membershipFindError) {
      console.error(
        "EXTENSION MEMBERSHIP FIND ERROR:",
        membershipFindError
      );

      return NextResponse.json(
        {
          error: membershipFindError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "Membership record could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    const today = getJakartaDate();

    let newStartDate: string;
    let newEndDate: string;

    if (
      membership.end_date &&
      membership.end_date >= today
    ) {
      newStartDate =
        membership.start_date || today;

      newEndDate = getEndDateOneMonth(
        membership.end_date
      );
    } else {
      newStartDate = today;
      newEndDate = getEndDateOneMonth(today);
    }

    const oldMembership = {
      status: membership.status,
      payment_status: membership.payment_status,
      start_date: membership.start_date,
      end_date: membership.end_date,
    };

    const {
      data: updatedMembership,
      error: membershipUpdateError,
    } = await supabaseAdmin
      .from("memberships")
      .update({
        status: "ACTIVE",
        payment_status: "VERIFIED",
        start_date: newStartDate,
        end_date: newEndDate,
      })
      .eq("id", membership.id)
      .select(
        `
          id,
          user_id,
          status,
          payment_status,
          start_date,
          end_date
        `
      )
      .single();

    if (membershipUpdateError) {
      console.error(
        "EXTENSION MEMBERSHIP UPDATE ERROR:",
        membershipUpdateError
      );

      return NextResponse.json(
        {
          error: membershipUpdateError.message,
        },
        {
          status: 500,
        }
      );
    }

    const {
      data: approvedRequest,
      error: requestUpdateError,
    } = await supabaseAdmin
      .from("membership_extension_requests")
      .update({
        status: "APPROVED",
        payment_status: "VERIFIED",
        processed_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select(
        `
          id,
          user_id,
          status,
          payment_status,
          requested_at,
          processed_at
        `
      )
      .single();

    if (requestUpdateError) {
      console.error(
        "EXTENSION REQUEST UPDATE ERROR:",
        requestUpdateError
      );

      await supabaseAdmin
        .from("memberships")
        .update(oldMembership)
        .eq("id", membership.id);

      return NextResponse.json(
        {
          error: requestUpdateError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      action: "APPROVE",
      request: approvedRequest,
      membership: updatedMembership,
    });
  } catch (error) {
    console.error(
      "EXTENSION PUT UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while processing the extension request.",
      },
      {
        status: 500,
      }
    );
  }
}