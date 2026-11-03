import { Zap, Boxes, Wrench, Mic2, Trophy, Factory, FlaskConical, ArrowUpRight } from 'lucide-react';
import { ScrollReveal, StaggerGroup, StaggerItem } from '@/components/ui/ScrollReveal';

const SOCIALS = [
  { label: 'X (Twitter)', href: 'https://x.com/T_E_S_L_Aclub' },
  { label: 'Instagram', href: 'https://www.instagram.com/tesla_nitp/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/tesla-club-nitp/' },
];

const ACTIVITIES = [
  { Icon: Wrench, title: 'Workshops', desc: 'Hands-on sessions that turn theory into working skills.' },
  { Icon: Mic2, title: 'Seminars', desc: 'Talks and discussions on the newest developments in the field.' },
  { Icon: Trophy, title: 'Competitions', desc: 'Contests that sharpen problem-solving under real pressure.' },
  { Icon: Factory, title: 'Industrial Visits', desc: 'First-hand exposure to how the industry actually works.' },
  { Icon: FlaskConical, title: 'Research Projects', desc: 'Collaborations among members that push the field forward.' },
];

export default function AboutPage() {
  return (
    <div className="bg-ink overflow-x-hidden">
      {/* ── Intro ──────────────────────────────────────────────────────── */}
      <section className="bg-ink pt-20 sm:pt-28 pb-16">
        <ScrollReveal className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="tag-mono-acid mb-3">{'// About'}</div>
          <h1 className="display text-5xl sm:text-7xl lg:text-8xl leading-[0.95]">
            Welcome to <span className="text-acid">T.E.S.L.A. Club</span>
          </h1>

          {/* Highlighted info strip: founded + PI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10">
            <div className="card-brut rounded-xl px-6 py-4 flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted shrink-0">
                Established
              </span>
              <span className="display text-2xl text-acid">EST. 2021</span>
            </div>
            <div className="card-brut rounded-xl px-6 py-4 flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted shrink-0">
                Under the guidance of
              </span>
              <span className="display text-lg sm:text-xl text-ivory leading-tight">
                Dr. Amitesh Sir <span className="text-muted text-sm font-mono tracking-[0.12em] uppercase">· PI</span>
              </span>
            </div>
          </div>

          <div className="mt-10 space-y-6 text-base sm:text-lg text-ivory-2 leading-relaxed">
            <p>
              Welcome to the official website of T.E.S.L.A. Club — the premier club for
              Electrical Engineering enthusiasts and professionals. Founded in 2021 by a
              group of bright-minded seniors, under the guidance of our esteemed PI,
              Dr. Amitesh Sir, T.E.S.L.A. Club is dedicated to fostering public speaking,
              teamwork, technical excellence, and management skills among its members.
            </p>
            <p>
              Our primary aim is to provide a platform for seniors, juniors, and alumni to
              come together, learn, grow, and secure rewarding careers in the field of
              Electrical Engineering.
            </p>
            <p>
              The establishment of T.E.S.L.A. Club was a long-standing demand of our seniors
              and a necessity for our department. With the club&apos;s official recognition, we
              have been able to realize our vision of creating a space where students and
              professionals can connect, collaborate, and thrive.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Our Focus Areas ────────────────────────────────────────────── */}
      <section className="bg-ink-2 border-y border-line py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="mb-12 max-w-2xl">
            <div className="tag-mono-acid mb-3">{'// Focus'}</div>
            <h2 className="display text-3xl sm:text-5xl">
              Our focus <span className="text-acid">areas</span>
            </h2>
            <p className="text-ivory-2 mt-4 text-sm sm:text-base leading-relaxed">
              At T.E.S.L.A. Club, we concentrate on two main domains — each one explored
              deeply, from fundamentals to the cutting edge.
            </p>
          </ScrollReveal>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StaggerItem className="h-full">
            <div className="card-brut rounded-xl p-8 hover:-translate-y-0.5 transition-transform">
              <span className="chip bg-acid/10 text-acid mb-5">
                <Zap className="w-5 h-5" />
              </span>
              <h3 className="display text-2xl">Electrical Engineering</h3>
              <p className="text-sm sm:text-base text-ivory-2 leading-relaxed mt-3">
                Our members have a deep interest in exploring the latest advancements in
                electrical engineering — the discipline at the heart of everything the club
                builds, breaks, and rebuilds.
              </p>
            </div>
            </StaggerItem>

            <StaggerItem className="h-full">
            <div className="card-brut rounded-xl p-8 hover:-translate-y-0.5 transition-transform">
              <span className="chip bg-acid/10 text-acid mb-5">
                <Boxes className="w-5 h-5" />
              </span>
              <h3 className="display text-2xl">Blockchain Technology</h3>
              <p className="text-sm sm:text-base text-ivory-2 leading-relaxed mt-3">
                We harness the potential of blockchain to revolutionize various industries —
                understanding the technology that is reshaping how the world transacts and
                trusts.
              </p>
            </div>
            </StaggerItem>
          </StaggerGroup>

          {/* Collaborations strip */}
          <ScrollReveal className="card-brut rounded-xl px-6 py-5 mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted shrink-0">
              Collaborations with
            </span>
            <div className="flex flex-wrap gap-2">
              {['Algorand', 'Near Blockchain'].map((name) => (
                <span
                  key={name}
                  className="chip border border-acid/40 text-acid font-mono text-xs uppercase tracking-[0.14em]"
                >
                  {name}
                </span>
              ))}
            </div>
            <span className="text-xs text-ivory-2 leading-relaxed sm:ml-auto sm:max-w-md">
              These tech-giant partnerships give our members exposure to cutting-edge
              technologies and industry trends.
            </span>
          </ScrollReveal>
        </div>
      </section>

      {/* ── What We Do ─────────────────────────────────────────────────── */}
      <section className="bg-ink py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="mb-12 max-w-2xl">
            <div className="tag-mono-acid mb-3">{'// Activities'}</div>
            <h2 className="display text-3xl sm:text-5xl">
              What we <span className="text-acid">do</span>
            </h2>
            <p className="text-ivory-2 mt-4 text-sm sm:text-base leading-relaxed">
              Our club activities encompass a wide range of initiatives. Through these
              engagements we enhance our members&apos; technical knowledge, problem-solving
              skills, and industry-relevant expertise — and we encourage and facilitate
              research projects and collaborations among members to promote innovation and
              contribute to the advancement of the field.
            </p>
          </ScrollReveal>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {ACTIVITIES.map(({ Icon, title, desc }) => (
              <StaggerItem key={title} className="h-full">
                <div className="card-brut rounded-xl p-6 flex flex-col h-full">
                  <Icon className="w-5 h-5 text-acid mb-4" />
                  <h3 className="display text-lg">{title}</h3>
                  <p className="text-xs text-muted leading-relaxed mt-2">{desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ── Community ──────────────────────────────────────────────────── */}
      <section className="bg-ink-2 border-y border-line py-20">
        <ScrollReveal className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="tag-mono-acid mb-3">{'// Community'}</div>
          <h2 className="display text-3xl sm:text-5xl mb-8">
            A vibrant <span className="text-acid">community</span>
          </h2>
          <p className="text-base sm:text-lg text-ivory-2 leading-relaxed">
            T.E.S.L.A. Club is a vibrant community of like-minded individuals driven by a
            common goal. Whether you are a seasoned professional, a curious undergraduate,
            or an aspiring researcher — the club offers a supportive environment to develop
            skills, expand networks, and shape the future.
          </p>
        </ScrollReveal>
      </section>

      {/* ── Social links ───────────────────────────────────────────────── */}
      <section className="bg-ink py-20">
        <ScrollReveal className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="tag-mono-acid mb-3">{'// Find us'}</div>
          <h2 className="display text-3xl sm:text-4xl mb-3">Follow the current</h2>
          <p className="text-sm text-ivory-2 mb-8">
            Events, wins and behind-the-scenes — across every platform.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card-brut rounded-md px-6 py-3 inline-flex items-center gap-2 text-sm text-ivory hover:text-acid hover:border-acid transition-colors"
              >
                {s.label}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            ))}
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}