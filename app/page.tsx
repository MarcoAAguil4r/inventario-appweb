import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-6">
        <Hero />
        <Features />
      </main>
    </div>
  );
}
