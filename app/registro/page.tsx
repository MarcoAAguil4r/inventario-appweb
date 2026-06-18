'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, saveSession } from '@/lib/api';
import type { LoginResponse } from '@/lib/api';

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiRequest<LoginResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ nombre, correo, password, confirmPassword }),
      });

      saveSession(data.token, data.usuario);
      router.push('/inventario');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear la cuenta.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-slate-950 p-8 text-white sm:p-12">
            <Link href="/" className="inline-flex items-center gap-3 text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400 text-slate-950">
                <PackageIcon />
              </span>
              <span>
                <span className="block text-sm font-semibold">Inventario</span>
                <span className="block text-xs text-slate-300">Control de inventario</span>
              </span>
            </Link>

            <div className="mt-16 max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">Nueva cuenta</p>
              <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
                Crea un acceso para administrar el inventario.
              </h1>
              <p className="mt-6 text-base leading-8 text-slate-300">
                Registra tu cuenta para comenzar a controlar productos, stock mínimo, daños y pérdidas.
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-12">
            <div className="mx-auto max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Registro</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950">Crear cuenta</h2>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Nombre</span>
                  <input
                    value={nombre}
                    onChange={(event) => setNombre(event.target.value)}
                    type="text"
                    required
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    placeholder="Administrador"
                  />
                </label>

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

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Contraseña</span>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    required
                    minLength={8}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    placeholder="Mínimo 8 caracteres"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Confirmar contraseña</span>
                  <input
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    type="password"
                    required
                    minLength={8}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    placeholder="Repite la contraseña"
                  />
                </label>

                {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="font-bold text-slate-950 hover:text-sky-700">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PackageIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 8.25-9-5.25-9 5.25m18 0-9 5.25m9-5.25v7.5l-9 5.25m0-7.5-9-5.25m9 5.25v7.5m-9-12v7.5l9 5.25" />
    </svg>
  );
}
