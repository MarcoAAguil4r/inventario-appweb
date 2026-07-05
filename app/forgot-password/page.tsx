'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

type ForgotPasswordResponse = {
  ok: boolean;
  message: string;
};

export default function ForgotPasswordPage() {
  const [correo, setCorreo] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const data = await apiRequest<ForgotPasswordResponse>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ correo }),
      });

      setMessage(data.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo solicitar la recuperacion.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/10 sm:p-12">
          <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-sky-700">
            Volver al login
          </Link>

          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Recuperacion</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">Restablecer contraseña</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Escribe tu correo y enviaremos un enlace seguro si la cuenta existe.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Correo</span>
              <input
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                type="email"
                required
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                placeholder="usuario@negocio.com"
              />
            </label>

            {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isLoading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
