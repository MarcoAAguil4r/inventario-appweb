'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 text-slate-950">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
</svg>

          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Inventario</p>
            <p className="text-xs text-slate-500">Control inteligente</p>
          </div>
        </Link>

        {/* Enlaces de Escritorio */}
        <div className="hidden items-center gap-8 md:flex">
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

        {/* Botones de Escritorio */}
        <div className="hidden items-center gap-4 md:flex">
          <button className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Entrar
          </button>
          <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800">
            Prueba gratis
          </button>
        </div>

        {/* Botón Menú Móvil */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full bg-slate-100 p-3 text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 md:hidden"
          aria-label="Abrir menú"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Menú Desplegable Móvil */}
      {isOpen && (
        <div className="absolute left-0 top-[80px] w-full border-b border-slate-200 bg-white px-4 py-6 shadow-xl md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/" onClick={() => setIsOpen(false)} className="text-base font-medium text-slate-700 transition hover:text-slate-900">
              Inicio
            </Link>
            <Link href="/solucion" onClick={() => setIsOpen(false)} className="text-base font-medium text-slate-700 transition hover:text-slate-900">
              Solución
            </Link>
            <Link href="#demo" onClick={() => setIsOpen(false)} className="text-base font-medium text-slate-700 transition hover:text-slate-900">
              Demo
            </Link>
            <Link href="#contacto" onClick={() => setIsOpen(false)} className="text-base font-medium text-slate-700 transition hover:text-slate-900">
              Contacto
            </Link>
            <hr className="my-2 border-slate-100" />
            <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Prueba gratis
            </button>
            <button className="w-full text-sm font-medium text-slate-700 transition hover:text-slate-900">
              Entrar
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}