import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServiceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getAccessToken(request: NextRequest) {
  // 1. Coba Authorization Bearer Token terlebih dahulu
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization
      .replace("Bearer ", "")
      .trim();

    if (token) {
      return token;
    }
  }

  // 2. Fallback ke cookie
  try {
    const cookieStore = await cookies();

    const directToken =
      cookieStore.get("sb-access-token")?.value;

    if (directToken) {
      return directToken;
    }

    const projectRef = new URL(supabaseUrl)
      .hostname
      .split(".")[0];

    const possibleCookieNames = [
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-auth-token.0`,
      `sb-${projectRef}-auth-token.1`,
    ];

    for (const cookieName of possibleCookieNames) {
      const value = cookieStore.get(cookieName)?.value;

      if (value) {
        try {
          const parsed = JSON.parse(value);

          if (parsed?.access_token) {
            return parsed.access_token;
          }
        } catch {
          // bukan JSON, lanjut
        }

        if (value.startsWith("base64-")) {
          try {
            const decoded = Buffer.from(
              value.replace("base64-", ""),
              "base64"
            ).toString("utf8");

            const parsed = JSON.parse(decoded);

            if (parsed?.access_token) {
              return parsed.access_token;
            }
          } catch {
            // lanjut
          }
        }
      }
    }
  } catch {
    // lanjut ke unauthorized
  }

  return null;
}

async function verifyAdmin(request: NextRequest) {
  const token = await getAccessToken(request);

  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error:
            "Session admin tidak ditemukan. Silakan login kembali.",
        },
        { status: 401 }
      ),
    };
  }

  const serviceSupabase = getServiceClient();

  const {
    data: { user },
    error: userError,
  } = await serviceSupabase.auth.getUser(token);

  if (userError || !user) {
    console.error("VERIFY ADMIN USER ERROR:", userError);

    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error:
            "Session admin tidak valid atau sudah expired. Silakan login kembali.",
        },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } =
    await serviceSupabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    console.error(
      "VERIFY ADMIN PROFILE ERROR:",
      profileError
    );

    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: `Gagal memeriksa profile admin: ${profileError.message}`,
        },
        { status: 500 }
      ),
    };
  }

  if (!profile || profile.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: "Admin access required.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    user,
  };
}

/* =========================================================
   POST
   CREATE MEMBER
========================================================= */

export async function POST(request: NextRequest) {
  try {
    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY belum tersedia di environment variable.",
        },
        { status: 500 }
      );
    }

    const adminCheck = await verifyAdmin(request);

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const body = await request.json();

    const {
      title,
      fullName,
      email,
      password,
      membershipStart,
      membershipEnd,
      paymentStatus,
      membershipStatus,
    } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        {
          error:
            "Nama lengkap, email, dan password wajib diisi.",
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "Password minimal 6 karakter.",
        },
        { status: 400 }
      );
    }

    const serviceSupabase = getServiceClient();

    // Cek email di profiles
    const { data: existingProfile, error: existingError } =
      await serviceSupabase
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        {
          error: `Gagal mengecek email: ${existingError.message}`,
        },
        { status: 500 }
      );
    }

    if (existingProfile) {
      return NextResponse.json(
        {
          error: "Email tersebut sudah terdaftar.",
        },
        { status: 400 }
      );
    }

    // Buat Auth User
    const {
      data: authData,
      error: authError,
    } = await serviceSupabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        title: title || "",
        full_name: cleanName,
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          error:
            authError?.message ||
            "Gagal membuat akun member.",
        },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Buat profile
    const { error: profileError } =
      await serviceSupabase
        .from("profiles")
        .insert({
          id: userId,
          email: cleanEmail,
          full_name: cleanName,
          title: title || "",
          role: "member",
        });

    if (profileError) {
      await serviceSupabase.auth.admin.deleteUser(
        userId
      );

      return NextResponse.json(
        {
          error: `Gagal membuat profile: ${profileError.message}`,
        },
        { status: 400 }
      );
    }

    // Buat membership
    const { error: membershipError } =
      await serviceSupabase
        .from("memberships")
        .insert({
          user_id: userId,
          status:
            membershipStatus || "PENDING",
          payment_status:
            paymentStatus || "PENDING",
          start_date:
            membershipStart || null,
          end_date:
            membershipEnd || null,
        });

    if (membershipError) {
      await serviceSupabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      await serviceSupabase.auth.admin.deleteUser(
        userId
      );

      return NextResponse.json(
        {
          error: `Gagal membuat membership: ${membershipError.message}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      message: "Member berhasil dibuat.",
    });
  } catch (error) {
    console.error("CREATE MEMBER ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat membuat member.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT
   UPDATE MEMBER
========================================================= */

export async function PUT(request: NextRequest) {
  try {
    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY belum tersedia di environment variable.",
        },
        { status: 500 }
      );
    }

    const adminCheck = await verifyAdmin(request);

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const body = await request.json();

    const {
      userId,
      title,
      fullName,
      email,
      password,
      membershipStart,
      membershipEnd,
      paymentStatus,
      membershipStatus,
    } = body;

    if (!userId) {
      return NextResponse.json(
        {
          error: "User ID tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    if (!fullName || !email) {
      return NextResponse.json(
        {
          error:
            "Nama lengkap dan email wajib diisi.",
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return NextResponse.json(
          {
            error:
              "Password minimal 6 karakter.",
          },
          { status: 400 }
        );
      }
    }

    const serviceSupabase = getServiceClient();

    // Pastikan user memang ada
    const {
      data: existingUser,
      error: existingUserError,
    } =
      await serviceSupabase.auth.admin.getUserById(
        userId
      );

    if (
      existingUserError ||
      !existingUser?.user
    ) {
      return NextResponse.json(
        {
          error:
            "Akun member tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // Cek apakah email dipakai member lain
    const {
      data: emailOwner,
      error: emailCheckError,
    } = await serviceSupabase
      .from("profiles")
      .select("id, email")
      .eq("email", cleanEmail)
      .neq("id", userId)
      .maybeSingle();

    if (emailCheckError) {
      return NextResponse.json(
        {
          error: `Gagal mengecek email: ${emailCheckError.message}`,
        },
        { status: 500 }
      );
    }

    if (emailOwner) {
      return NextResponse.json(
        {
          error:
            "Email tersebut sudah digunakan oleh member lain.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // UPDATE AUTH USER
    // ==========================================

    const authUpdate: {
      email?: string;
      password?: string;
      user_metadata?: {
        title: string;
        full_name: string;
      };
    } = {
      email: cleanEmail,
      user_metadata: {
        title: title || "",
        full_name: cleanName,
      },
    };

    if (password && password.trim()) {
      authUpdate.password =
        password.trim();
    }

    const {
      error: authError,
    } =
      await serviceSupabase.auth.admin.updateUserById(
        userId,
        authUpdate
      );

    if (authError) {
      console.error(
        "UPDATE AUTH USER ERROR:",
        authError
      );

      return NextResponse.json(
        {
          error: `Gagal update akun: ${authError.message}`,
        },
        { status: 400 }
      );
    }

    // ==========================================
    // UPDATE PROFILE
    // ==========================================

    const {
      error: profileError,
    } = await serviceSupabase
      .from("profiles")
      .update({
        email: cleanEmail,
        full_name: cleanName,
        title: title || "",
      })
      .eq("id", userId);

    if (profileError) {
      console.error(
        "UPDATE PROFILE ERROR:",
        profileError
      );

      return NextResponse.json(
        {
          error: `Gagal update profile: ${profileError.message}`,
        },
        { status: 400 }
      );
    }

    // ==========================================
    // UPDATE MEMBERSHIP
    // ==========================================

    const {
      data: membership,
      error: membershipFindError,
    } = await serviceSupabase
      .from("memberships")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipFindError) {
      return NextResponse.json(
        {
          error: `Gagal mencari membership: ${membershipFindError.message}`,
        },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "Membership member tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const {
      error: membershipError,
    } = await serviceSupabase
      .from("memberships")
      .update({
        status:
          membershipStatus || "PENDING",
        payment_status:
          paymentStatus || "PENDING",
        start_date:
          membershipStart || null,
        end_date:
          membershipEnd || null,
      })
      .eq("id", membership.id);

    if (membershipError) {
      console.error(
        "UPDATE MEMBERSHIP ERROR:",
        membershipError
      );

      return NextResponse.json(
        {
          error: `Gagal update membership: ${membershipError.message}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Member berhasil diperbarui.",
    });
  } catch (error) {
    console.error(
      "UPDATE MEMBER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat update member.",
      },
      { status: 500 }
    );
  }
}
