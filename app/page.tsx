import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import CtaForm from './components/CtaForm';
import Footer from './components/Footer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col w-full overflow-x-hidden bg-slate-50 text-slate-950">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <section id="contacto" className="py-24 bg-white">
        <div className="mx-auto max-w-xl px-6 sm:px-8">
          <CtaForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
