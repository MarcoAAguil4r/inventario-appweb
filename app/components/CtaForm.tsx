'use client';

import Link from 'next/link';

export default function CtaForm() {
  return (
    <section id="contacto" className="relative w-full bg-slate-100 py-32">
      <div id="demo" className="absolute -top-24" />
      <div className="mx-auto relative flex max-w-7xl flex-col items-center px-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-slate-500">MVP operativo</p>
          <h2 className="mb-4 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            Entra al sistema de gestión de inventario.
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-slate-600">
            Prueba el flujo principal con login, productos, stock mínimo, productos dañados, mermas y desactivación lógica.
          </p>
        </div>

        <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-2xl shadow-slate-900/5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            API REST protegida
          </p>
          <p className="mt-4 text-base leading-7 text-slate-600">
            El MVP usa Express, MySQL, JWT y bcrypt para coincidir con la justificación técnica del proyecto.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-8 py-4 text-base font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800"
          >
            Entrar al sistema
          </Link>
        </div>
      </div>
    </section>
  );
}
