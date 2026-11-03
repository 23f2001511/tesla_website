'use client';

import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { ScrollReveal, StaggerGroup, StaggerItem } from '@/components/ui/ScrollReveal';

export default function ContactPage() {
  return (
    <div className="bg-ink overflow-x-hidden">
      <section className="bg-ink pt-20 sm:pt-28 pb-12">
        <ScrollReveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-2xl mx-auto">
          <div className="tag-mono-acid mb-3">{'// Signal'}</div>
          <h1 className="display text-5xl sm:text-7xl lg:text-8xl">
            Contact <span className="text-acid">us</span>
          </h1>
          <p className="mt-4 text-ivory-2 text-base sm:text-lg">
            Have a question or want to join the club? We&apos;d love to hear from you.
          </p>
        </ScrollReveal>
      </section>

      <section className="bg-ink pb-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerGroup className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Contact info */}
            <StaggerItem>
            <div className="flex flex-col gap-4">
              <div className="card-brut rounded-xl p-7">
                <div className="tag-mono-acid mb-4">{'// Channels'}</div>
                <h3 className="display text-xl mb-5">Get in touch</h3>

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-acid/10 rounded-md text-acid shrink-0"><MapPin className="w-4 h-4" /></div>
                    <div>
                      <h4 className="font-mono text-[11px] tracking-[0.14em] uppercase text-acid">Location</h4>
                      <p className="text-sm text-ivory-2 mt-1">CSE Block, College Campus, India 400001</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-acid/10 rounded-md text-acid shrink-0"><Mail className="w-4 h-4" /></div>
                    <div>
                      <h4 className="font-mono text-[11px] tracking-[0.14em] uppercase text-acid">Email</h4>
                      <p className="text-sm text-ivory-2 mt-1">teslaclub@college.edu</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-acid/10 rounded-md text-acid shrink-0"><Phone className="w-4 h-4" /></div>
                    <div>
                      <h4 className="font-mono text-[11px] tracking-[0.14em] uppercase text-acid">Phone</h4>
                      <p className="text-sm text-ivory-2 mt-1">+91 98765 43210</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-brut rounded-xl p-7">
                <div className="tag-mono-acid mb-3">{'// Community'}</div>
                <h3 className="display text-xl mb-3">Join our Discord</h3>
                <p className="text-sm text-muted mb-5">
                  Be a part of our thriving online community of developers and designers.
                </p>
                <button className="w-full py-2.5 border border-line hover:border-acid hover:text-acid text-ivory-2 rounded-md font-mono text-[11px] tracking-[0.14em] uppercase transition-colors">
                  Join Discord Server
                </button>
              </div>
            </div>
            </StaggerItem>

            {/* Form */}
            <StaggerItem>
            <form className="card-brut rounded-xl p-7 flex flex-col gap-5">
              <div className="tag-mono-acid mb-1">{'// Message'}</div>
              <h3 className="display text-xl mb-3">Send us a message</h3>

              <div>
                <label className="block font-mono text-[11px] tracking-[0.14em] uppercase text-muted mb-2">Full name</label>
                <input type="text" className="input-brut rounded-md" placeholder="John Doe" />
              </div>

              <div>
                <label className="block font-mono text-[11px] tracking-[0.14em] uppercase text-muted mb-2">Email address</label>
                <input type="email" className="input-brut rounded-md" placeholder="john@example.com" />
              </div>

              <div>
                <label className="block font-mono text-[11px] tracking-[0.14em] uppercase text-muted mb-2">Subject</label>
                <select className="input-brut rounded-md text-ivory-2 appearance-none cursor-pointer">
                  <option value="general">General Inquiry</option>
                  <option value="join">Membership Request</option>
                  <option value="sponsor">Sponsorship</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] tracking-[0.14em] uppercase text-muted mb-2">Message</label>
                <textarea rows={4} className="input-brut rounded-md resize-none" placeholder="How can we help you?" />
              </div>

              <button type="button" className="btn-acid mt-2 w-full justify-center">
                Send Message <Send className="w-4 h-4" />
              </button>
            </form>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>
    </div>
  );
}
