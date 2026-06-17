'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-slate-950">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/10">
            📦
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Inventario</p>
            <p className="text-xs text-slate-500">Control inteligente</p>
          </div>
        </Link>

        <div className="hidden items-center gap-8 xl:flex">
          <Link href="/" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Inicio
          </Link>
          <Link href="/solucion" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Solución
          </Link>
          <Link href="#demo" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Demo
          </Link>
          <Link href="#contacto" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Contacto
          </Link>
        </div>

        <div className="hidden items-center gap-4 xl:flex">
          <button className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Entrar
          </button>
          <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800">
            Prueba gratis
          </button>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="xl:hidden rounded-full bg-slate-100 p-3 text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
          aria-label="Abrir menú"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-slate-200 bg-white px-6 py-4 xl:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/" className="text-slate-700 transition hover:text-slate-900">
              Inicio
            </Link>
            <Link href="/solucion" className="text-slate-700 transition hover:text-slate-900">
              Solución
            </Link>
            <Link href="#demo" className="text-slate-700 transition hover:text-slate-900">
              Demo
            </Link>
            <Link href="#contacto" className="text-slate-700 transition hover:text-slate-900">
              Contacto
            </Link>
            <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              Prueba gratis
            </button>
            <button className="text-sm font-medium text-slate-700 transition hover:text-slate-900">
              Entrar
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
