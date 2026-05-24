'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 font-bold text-xl text-gray-900">
            📦 Inventario
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-gray-900 transition">
              Inicio
            </Link>
            <Link href="#solucion" className="text-gray-700 hover:text-gray-900 transition">
              Solución
            </Link>
            <Link href="#demo" className="text-gray-700 hover:text-gray-900 transition">
              Demo
            </Link>
            <button className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
              Entrar
            </button>
          </div>

          {/* Menu Mobile Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Menu Mobile */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <Link href="/" className="block py-2 text-gray-700 hover:text-gray-900">
              Inicio
            </Link>
            <Link href="#solucion" className="block py-2 text-gray-700 hover:text-gray-900">
              Solución
            </Link>
            <Link href="#demo" className="block py-2 text-gray-700 hover:text-gray-900">
              Demo
            </Link>
            <button className="w-full mt-3 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
              Entrar
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
