"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import type { OrderStatus } from "@cafe/shared";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const COOKIE_NAME = "cafe_admin_session";
const API_URL: string =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333";

function hashToken(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(hashToken(a), hashToken(b));
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD ?? process.env.ADMIN_TOKEN;
  if (!expected) return false;

  const store = await cookies();
  const session = store.get(COOKIE_NAME)?.value;
  if (!session) return false;

  return safeEqual(session, expected);
}

export async function loginAdminAction(formData: FormData): Promise<{
  error?: string;
}> {
  const expected = process.env.ADMIN_PASSWORD ?? process.env.ADMIN_TOKEN;
  if (!expected) {
    return {
      error: "Senha de acesso não configurada no servidor (.env).",
    };
  }

  const password = String(formData.get("password") ?? "").trim();
  if (!password || !safeEqual(password, expected)) {
    return { error: "Senha incorreta. Confira e tente novamente." };
  }

  const store = await cookies();
  store.set(COOKIE_NAME, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/admin");
  return {};
}

export async function logoutAdminAction(): Promise<void> {
  const store = await cookies();
  store.delete({ name: COOKIE_NAME, path: "/admin" });
  revalidatePath("/admin");
}

export async function updateOrderStatusAction(
  id: number,
  status: OrderStatus,
): Promise<{ error?: string }> {
  if (!(await isAdminAuthenticated())) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const response = await fetch(`${API_URL}/encomendas/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    return { error: "Não foi possível atualizar o status." };
  }

  revalidatePath("/admin");
  return {};
}

export async function deleteOrderAction(
  id: number,
): Promise<{ error?: string }> {
  if (!(await isAdminAuthenticated())) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const response = await fetch(`${API_URL}/encomendas/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
    },
  });

  if (!response.ok) {
    return { error: "Não foi possível remover a encomenda." };
  }

  revalidatePath("/admin");
  return {};
}
