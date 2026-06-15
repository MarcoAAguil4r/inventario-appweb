"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [activeSection, setActiveSection] = useState('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (window.innerWidth < 768) {
        if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
          setIsVisible(false);
          setIsMobileMenuOpen(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const sections = ['inicio', 'solucion', 'demo', 'contacto'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-30% 0px -50% 0px' } 
    );

    sections.forEach((section) => {
      const element = document.getElementById(section);
      if (element) observer.observe(element);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  // Cerrar al dar clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <nav 
      ref={navRef} 
      className={`fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <Link href="#inicio" className="flex items-center gap-3 text-slate-950">
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

        <div className="hidden items-center gap-8 md:flex">
          {['inicio', 'solucion', 'demo', 'contacto'].map((item) => (
            <Link 
              key={item} 
              href={`#${item}`} 
              className={`text-sm font-medium capitalize transition-all duration-300 relative group ${
                activeSection === item ? 'text-sky-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item}
              <span className={`absolute -bottom-1.5 left-0 h-0.5 bg-sky-500 transition-all duration-300 ${
                activeSection === item ? 'w-full' : 'w-0 group-hover:w-full group-hover:bg-slate-300'
              }`}></span>
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="#entrar" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Entrar
          </Link>
          <Link href="#demo" className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800">
            Prueba gratis
          </Link>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileMenuOpen(!isMobileMenuOpen);
          }}
          className="rounded-full bg-slate-100 p-3 text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 md:hidden"
          aria-label="Abrir menú"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      
      {isMobileMenuOpen && (
        <div className="absolute left-0 top-[80px] w-full border-b border-slate-200 bg-white px-4 py-6 shadow-xl md:hidden">
          <div className="flex flex-col gap-4">
            {['inicio', 'solucion', 'demo', 'contacto'].map((item) => (
              <Link 
                key={item} 
                href={`#${item}`} 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`text-base font-medium capitalize transition flex items-center ${
                  activeSection === item ? 'text-sky-600' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {activeSection === item && <span className="w-2 h-2 rounded-full bg-sky-500 mr-3"></span>}
                {item}
              </Link>
            ))}
            
            <hr className="my-2 border-slate-100" />
            
            <Link href="#demo" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Prueba gratis
            </Link>
            <Link href="#entrar" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center text-sm font-medium text-slate-700 transition hover:text-slate-900">
              Entrar
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}