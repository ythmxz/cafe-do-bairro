"use client";

import { type SubmitEvent, useState } from "react";
import { loginAdminAction } from "./actions";

export function AdminLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await loginAdminAction(formData);
      if (result.error) {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-8 max-w-md rounded-2xl border border-biscuit bg-cream p-6 shadow-xs sm:p-8"
    >
      <h1 className="font-serif text-2xl font-bold text-espresso">
        Caderno da Dona Marta
      </h1>
      <p className="mt-1 text-sm text-cinnamon">
        Digite a senha de acesso para ver e organizar as encomendas.
      </p>

      <div className="mt-5">
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-espresso"
        >
          Senha de acesso
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••••••••••"
          className="mt-1.5 w-full rounded-xl border border-biscuit bg-cream px-3.5 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-terracotta/40 bg-terracotta/10 p-3 text-xs font-medium text-terracotta"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full cursor-pointer rounded-xl bg-terracotta px-5 py-3 text-sm font-semibold text-cream transition hover:bg-espresso disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Abrir caderno de encomendas"}
      </button>
    </form>
  );
}
