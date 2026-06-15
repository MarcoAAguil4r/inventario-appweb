import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import CtaForm from './components/CtaForm';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-6">
        <Hero />
        <Features />
        <section id="contacto" className="py-24 bg-white">
          <div className="mx-auto max-w-xl px-6 sm:px-8">
            <CtaForm />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
