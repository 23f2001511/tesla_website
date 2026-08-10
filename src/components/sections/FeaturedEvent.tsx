'use client';

import React, { useState } from 'react';

const tabs = [
  { time: '18.00 - 22:45', date: '24 - 28 May' },
  { time: '18.00 - 22:45', date: '24 - 28 June' },
  { time: '18.00 - 22:45', date: '24 - 28 July' },
  { time: '18.00 - 22:45', date: '24 - 28 August' },
];

export function FeaturedEvent() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 w-full">
      <h1 className="text-5xl md:text-[5rem] font-extrabold mb-12 uppercase text-white">Events</h1>
      
      <div className="flex flex-wrap sm:flex-nowrap justify-between mb-16 border-b border-white/10">
        {tabs.map((tab, idx) => (
          <button 
            key={idx} 
            className="flex-1 min-w-[50%] sm:min-w-0 bg-transparent border-none py-6 text-white flex flex-col items-start gap-2 text-left relative group transition-all duration-300"
            onClick={() => setActiveTab(idx)}
          >
            <span className="text-white/50 text-sm font-semibold">{tab.time}</span>
            <span className={`text-2xl font-bold transition-colors duration-300 ${activeTab === idx ? 'text-primary' : 'text-white group-hover:text-primary/80'}`}>
              {tab.date}
            </span>
            <div className={`absolute bottom-[-1px] left-0 h-[2px] bg-primary transition-all duration-300 ${activeTab === idx ? 'w-full' : 'w-0 group-hover:w-full'}`}></div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="rounded-3xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] group">
          <img 
            src="/images/artist.png" 
            alt="Sound artist" 
            className="w-full h-auto block transition-transform duration-500 group-hover:scale-105 object-cover" 
          />
        </div>
        
        <div className="flex flex-col items-start">
          <span className="inline-block px-4 py-2 border border-primary text-primary rounded-full text-sm font-bold tracking-widest mb-6">
            CONCERT
          </span>
          <h2 className="text-5xl md:text-[4rem] font-extrabold mb-6 leading-[1.1] uppercase text-white">
            Sound artist
          </h2>
          <p className="text-white/70 text-lg leading-[1.8] mb-10 max-w-[90%]">
            Dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur. Dicta sunt explicabo.
          </p>
          
          <div className="flex gap-4">
            {['f', 'x', '@', 'in'].map((icon, i) => (
              <button 
                key={i} 
                className="w-12 h-12 rounded-full border border-white/20 bg-transparent text-white flex items-center justify-center text-lg transition-all duration-300 hover:bg-primary hover:border-primary"
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
