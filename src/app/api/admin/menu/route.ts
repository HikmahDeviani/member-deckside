import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type MenuCategory = "FOOD" | "BEVERAGE";

type MenuPayload = {
  id?: string | number;
  name?: unknown;
  category?: unknown;
  price?: unknown;
  stock?: unknown;
  is_available?: unknown;
  isAvailable?: unknown;
  image_url?: unknown;
  imageUrl?: unknown;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim() || null;
}

function getTokenClient(token: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are not configured."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

async function requireAdmin(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      error:
        "Supabase environment variables are not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      status: 500,
    } as const;
  }

  const token = getBearerToken(request);

  if (!token) {
    return {
      error: "Unauthorized. Admin session token is missing.",
      status: 401,
    } as const;
  }

  let client;

  try {
    client = getTokenClient(token);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to initialize Supabase.",
      status: 500,
    } as const;
  }

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser(token);

  if (authError || !user) {
    return {
      error: `Unauthorized. ${authError?.message || "Invalid session."}`,
      status: 401,
    } as const;
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      error: `Unable to verify admin access: ${profileError.message}`,
      status: 500,
    } as const;
  }

  if (!profile || String(profile.role ?? "").toLowerCase() !== "admin") {
    return {
      error: "Forbidden. Admin access is required.",
      status: 403,
    } as const;
  }

  return { user, client } as const;
}

function normalizeCategory(value: unknown): MenuCategory | null {
  const category = String(value ?? "").trim().toUpperCase();

  if (category === "FOOD" || category === "BEVERAGE") {
    return category;
  }

  return null;
}

function normalizePayload(body: MenuPayload) {
  const name = String(body.name ?? "").trim();
  const category = normalizeCategory(body.category);
  const price = Number(body.price);
  const stock = Number(body.stock);

  const rawAvailable =
    body.is_available !== undefined
      ? body.is_available
      : body.isAvailable;

  const is_available =
    rawAvailable === undefined
      ? true
      : rawAvailable === true ||
        rawAvailable === "true" ||
        rawAvailable === 1 ||
        rawAvailable === "1";

  const rawImage =
    body.image_url !== undefined
      ? body.image_url
      : body.imageUrl;

  const image_url =
    rawImage === null ||
    rawImage === undefined ||
    String(rawImage).trim() === ""
      ? null
      : String(rawImage).trim();

  if (!name) {
    throw new Error("Menu name is required.");
  }

  if (!category) {
    throw new Error("Category must be FOOD or BEVERAGE.");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error(
      "Price must be a valid number greater than or equal to 0."
    );
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error(
      "Stock must be a whole number greater than or equal to 0."
    );
  }

  return {
    name,
    category,
    price: Math.round(price),
    stock,
    is_available,
    image_url,
  };
}

function formatDatabaseError(
  operation: string,
  error: { message?: string; code?: string } | null
) {
  const message = error?.message || "Unknown database error.";
  const code = error?.code ? ` [${error.code}]` : "";

  const lower = message.toLowerCase();

  if (
    lower.includes("relation") &&
    lower.includes("menus") &&
    lower.includes("does not exist")
  ) {
    return `Menu gagal ${operation}: tabel public.menus belum ada di Supabase. Jalankan menus.sql terlebih dahulu.`;
  }

  if (
    lower.includes("row-level security") ||
    lower.includes("rls") ||
    error?.code === "42501"
  ) {
    return `Menu gagal ${operation}: Supabase RLS menolak akses. Pastikan policy admin untuk tabel menus sudah dibuat dan profiles.role untuk akun ini adalah admin.`;
  }

  return `Menu gagal ${operation}: ${message}${code}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);

    if ("error" in auth) {
      return jsonError(auth.error, auth.status);
    }

    const { data, error } = await auth.client
      .from("menus")
      .select(
        "id, name, category, price, stock, is_available, image_url, created_at, updated_at"
      )
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return jsonError(formatDatabaseError("memuat", error), 500);
    }

    return NextResponse.json({ menus: data ?? [] });
  } catch (error) {
    console.error("GET /api/admin/menu error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to load menus.",
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);

    if ("error" in auth) {
      return jsonError(auth.error, auth.status);
    }

    let body: MenuPayload;

    try {
      body = (await request.json()) as MenuPayload;
    } catch {
      return jsonError("Invalid JSON request body.");
    }

    let payload;

    try {
      payload = normalizePayload(body);
    } catch (error) {
      return jsonError(
        error instanceof Error
          ? error.message
          : "Invalid menu data."
      );
    }

    const { data, error } = await auth.client
      .from("menus")
      .insert(payload)
      .select(
        "id, name, category, price, stock, is_available, image_url, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("POST /api/admin/menu database error:", error);
      return jsonError(formatDatabaseError("membuat menu", error), 500);
    }

    return NextResponse.json(
      { menu: data },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/menu error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to create menu item.",
      500
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);

    if ("error" in auth) {
      return jsonError(auth.error, auth.status);
    }

    let body: MenuPayload;

    try {
      body = (await request.json()) as MenuPayload;
    } catch {
      return jsonError("Invalid JSON request body.");
    }

    if (
      body.id === undefined ||
      body.id === null ||
      String(body.id).trim() === ""
    ) {
      return jsonError("Menu id is required for editing.");
    }

    let payload;

    try {
      payload = normalizePayload(body);
    } catch (error) {
      return jsonError(
        error instanceof Error
          ? error.message
          : "Invalid menu data."
      );
    }

    const { data, error } = await auth.client
      .from("menus")
      .update(payload)
      .eq("id", body.id)
      .select(
        "id, name, category, price, stock, is_available, image_url, created_at, updated_at"
      )
      .maybeSingle();

    if (error) {
      console.error("PUT /api/admin/menu database error:", error);
      return jsonError(formatDatabaseError("mengubah menu", error), 500);
    }

    if (!data) {
      return jsonError("Menu item was not found.", 404);
    }

    return NextResponse.json({ menu: data });
  } catch (error) {
    console.error("PUT /api/admin/menu error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to update menu item.",
      500
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);

    if ("error" in auth) {
      return jsonError(auth.error, auth.status);
    }

    let body: MenuPayload;

    try {
      body = (await request.json()) as MenuPayload;
    } catch {
      return jsonError("Invalid JSON request body.");
    }

    if (
      body.id === undefined ||
      body.id === null ||
      String(body.id).trim() === ""
    ) {
      return jsonError("Menu id is required for deletion.");
    }

    const { data, error } = await auth.client
      .from("menus")
      .delete()
      .eq("id", body.id)
      .select("id, name")
      .maybeSingle();

    if (error) {
      console.error("DELETE /api/admin/menu database error:", error);
      return jsonError(formatDatabaseError("menghapus menu", error), 500);
    }

    if (!data) {
      return jsonError("Menu item was not found.", 404);
    }

    return NextResponse.json({ deleted: data });
  } catch (error) {
    console.error("DELETE /api/admin/menu error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to delete menu item.",
      500
    );
  }
}
