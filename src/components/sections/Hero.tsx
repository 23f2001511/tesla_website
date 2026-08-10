'use client';

import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section 
      className="relative min-h-[90vh] flex flex-col justify-between pt-8 pb-16 bg-cover bg-center" 
      style={{ backgroundImage: `url('/images/hero.png')` }}
    >
      <div 
        className="absolute inset-0 z-0" 
        style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.9) 100%)' }}
      ></div>
      
      <header className="relative z-10 max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
        <div className="text-2xl font-bold tracking-widest flex items-center gap-2 text-white">
          <span className="text-primary text-xl">✽</span> AGORA
        </div>
        <nav className="flex gap-6">
          <button className="bg-transparent text-white text-xl">≡</button>
          <button className="bg-transparent text-white text-xl">🛍️</button>
          <button className="bg-transparent text-white text-xl">🔍</button>
        </nav>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full flex-grow flex flex-col justify-center mt-auto">
        <h1 className="text-6xl md:text-[8rem] font-extrabold leading-[1.1] tracking-tight mb-16 text-white uppercase">
          AGORA <span className="text-transparent" style={{ WebkitTextStroke: '2px rgba(255, 255, 255, 0.8)' }}>CONCERT</span>
        </h1>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 md:gap-0">
          <div className="flex items-center gap-4 font-semibold text-sm text-white uppercase tracking-wide">
            <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-xs hover:scale-105 transition-transform">
              ▶
            </button>
            <span>Festival Teaser</span>
          </div>
          
          <div className="text-left md:text-right text-white">
            <h2 className="text-5xl md:text-[5rem] font-extrabold leading-none">21-22</h2>
            <p className="text-xl md:text-2xl font-medium mt-2 uppercase tracking-wide">october 2024</p>
          </div>
        </div>
      </div>
    </section>
  );
}
