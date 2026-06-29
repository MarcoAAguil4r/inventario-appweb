'use client';

import Link from 'next/link';

const DEMO_EMAIL = 'demo@inventario.com';
const DEMO_PASSWORD = 'Demo1234!';

export default function CtaForm() {
  return (
    <section id="contacto" className="relative w-full bg-slate-100 py-32">
      <div id="demo" className="absolute -top-24" />

      <div className="mx-auto relative flex max-w-7xl flex-col items-center gap-16 px-6 sm:px-8 lg:px-12">

        {/* BLOQUE DEMO */}
        <div className="w-full max-w-4xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
              Demo en vivo
            </span>
            <h2 className="mt-6 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
              Prueba el sistema ahora mismo.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
              Usa las credenciales de abajo para entrar al sistema de demo sin registro.
            </p>
          </div>

          <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/5 sm:p-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Correo demo</p>
                <p className="mt-2 text-base font-bold text-slate-950 break-all">{DEMO_EMAIL}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Contraseña demo</p>
                <p className="mt-2 text-base font-bold text-slate-950">{DEMO_PASSWORD}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/login?demo=1"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-sky-400 px-8 py-4 text-base font-bold text-slate-950 shadow-lg shadow-sky-400/25 transition hover:bg-sky-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                Iniciar demo ahora
              </Link>
              <Link
                href="/login"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Entrar con mi cuenta
              </Link>
            </div>
            <p className="mt-5 text-center text-xs text-slate-400">
              La cuenta demo es compartida. No ingreses datos reales o privados.
            </p>
          </div>
        </div>

        {/* BLOQUE ACCESO NORMAL */}
        <div className="w-full max-w-xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Sistema de inventario</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-950">¿Ya tienes cuenta? Entra directo.</h2>
          <Link
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-slate-800"
          >
            Entrar al sistema
          </Link>
        </div>

      </div>
    </section>
  );
}