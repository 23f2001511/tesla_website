'use client';

import React, { useState, useEffect } from 'react';

const features = [
  {
    title: 'Location',
    desc: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.'
  },
  {
    title: 'Sound',
    desc: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.'
  },
  {
    title: 'Lighting',
    desc: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.'
  }
];

export function Features() {
  const fullText = "Crafting extraordinary\nconcert experiences";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, i + 1));
      i++;
      if (i > fullText.length) {
        clearInterval(interval);
      }
    }, 100); // typing speed
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 relative bg-background">
      <div className="max-w-7xl mx-auto px-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="flex flex-col">
            <h2 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight uppercase text-white">
              {displayedText.split('\n').map((line, idx) => (
                <React.Fragment key={idx}>
                  {line}
                  {idx === 0 && displayedText.includes('\n') && <br />}
                </React.Fragment>
              ))}
              <span className="inline-block w-1 bg-primary ml-1 animate-[pulse_1s_step-end_infinite]">|</span>
            </h2>
          </div>
          
          <div className="flex flex-col gap-12">
            {features.map((item, idx) => (
              <div key={idx} className="relative pb-8 border-b border-white/10 group">
                <h3 className="text-3xl font-bold mb-4 uppercase text-white">{item.title}</h3>
                <p className="text-white/60 leading-relaxed text-lg max-w-[90%]">{item.desc}</p>
                <div className="absolute top-0 right-0 text-4xl text-primary font-light group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform">
                  ↗
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/20 tracking-[2px] uppercase">
          www.DownloadNewThemes.com
        </div>
      </div>
    </section>
  );
}
