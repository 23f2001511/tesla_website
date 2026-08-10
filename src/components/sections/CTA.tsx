'use client';

export function CTA() {
  return (
    <section 
      className="relative py-32 flex items-center justify-center text-center bg-cover bg-center"
      style={{ backgroundImage: `url('/images/footer.png')` }}
    >
      <div className="absolute inset-0 bg-[#0a0a0a]/70 z-0"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 flex flex-col items-center">
        <p className="text-sm tracking-[4px] text-primary font-bold mb-6 uppercase">
          LIVE MUSIC TO VIBRANT LIFE
        </p>
        <h2 className="text-5xl md:text-[5rem] font-extrabold leading-[1.1] uppercase mb-12 max-w-[800px] text-white">
          Concerts of a lifetime 2024
        </h2>
        <button className="bg-primary text-black border-none px-12 py-5 text-lg font-extrabold tracking-wider rounded-full cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(59,130,246,0.4)]">
          BUY TICKETS
        </button>
      </div>
    </section>
  );
}
