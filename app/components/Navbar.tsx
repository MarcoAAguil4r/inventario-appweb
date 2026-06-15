'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Efecto para cerrar el menú móvil automáticamente si la pantalla se hace grande
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 text-slate-950 z-50">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Inventario</p>
            <p className="text-xs text-slate-500 hidden sm:block">Control inteligente</p>
          </div>
        </Link>

        {/* Enlaces de Escritorio (Ocultos en móviles) */}
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">Inicio</Link>
          <Link href="#solucion-detalle" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">Solución</Link>
          <Link href="#como-funciona" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">Cómo funciona</Link>
          <Link href="#demo" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">Demo</Link>
        </div>

        {/* Botones de Escritorio (Ocultos en móviles) */}
        <div className="hidden items-center gap-4 md:flex">
          <button className="text-sm font-medium text-slate-600 transition hover:text-slate-900">Entrar</button>
          <a href="#demo" className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800">
            Prueba gratis
          </a>
        </div>

        {/* Botón Menú Móvil (Visible solo en md o menor) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative z-50 rounded-full bg-slate-100 p-3 text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 md:hidden"
          aria-label="Abrir menú"
          aria-expanded={isOpen}
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

      {/* Menú Desplegable Móvil con Animación */}
      <div 
        className={`absolute left-0 top-20 w-full origin-top transform border-b border-slate-200 bg-white/95 px-4 py-6 shadow-xl backdrop-blur-xl transition-all duration-300 ease-in-out md:hidden ${
          isOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col gap-4">
          <Link href="/" onClick={() => setIsOpen(false)} className="block w-full rounded-lg px-4 py-2 text-base font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900">
            Inicio
          </Link>
          <Link href="#solucion-detalle" onClick={() => setIsOpen(false)} className="block w-full rounded-lg px-4 py-2 text-base font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900">
            Solución
          </Link>
          <Link href="#como-funciona" onClick={() => setIsOpen(false)} className="block w-full rounded-lg px-4 py-2 text-base font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900">
            Cómo funciona
          </Link>
          <Link href="#demo" onClick={() => setIsOpen(false)} className="block w-full rounded-lg px-4 py-2 text-base font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900">
            Demo
          </Link>
          <hr className="my-2 border-slate-100" />
          <div className="flex flex-col gap-3 px-2">
            <button className="w-full text-center text-sm font-medium text-slate-700 transition hover:text-slate-900 py-2">
              Entrar
            </button>
            <a href="#demo" onClick={() => setIsOpen(false)} className="w-full rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:bg-slate-800">
              Prueba gratis
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}