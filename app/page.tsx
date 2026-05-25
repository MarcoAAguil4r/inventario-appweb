import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Solucion from './components/Features';
import HowItWorks from './components/HowItWorks';
import CtaForm from './components/CtaForm';
import Footer from './components/Footer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col w-full overflow-x-hidden bg-slate-50 text-slate-950 space-y-16 lg:space-y-28">
      <Navbar />
      <Hero />
      <Solucion />
      <HowItWorks />
      <CtaForm />
      <Footer />
    </main>
  );
}