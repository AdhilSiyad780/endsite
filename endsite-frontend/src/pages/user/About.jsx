// src/pages/user/About.jsx

import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function About() {
  const revealRefs = useRef([])

  // ── Scroll reveal ──────────────────────────────────────────────────────────

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    revealRefs.current.forEach((el) => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  const addRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el)
    }
  }

  return (
    <div className="min-h-screen bg-white page-enter">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[70vh] flex items-end
        bg-brand-grey-100 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br
          from-brand-grey-100 via-brand-grey-200 to-brand-grey-100" />
        <div className="relative z-10 max-w-content mx-auto px-10 pb-16 md:pb-24">
          <p
            className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-4 reveal"
            ref={addRef}
          >
            Our story
          </p>
          <h1
            className="font-light uppercase text-brand-900 reveal"
            style={{
              fontSize:      'clamp(36px, 5vw, 80px)',
              letterSpacing: '0.15em',
              lineHeight:    '1.05',
            }}
            ref={addRef}
          >
            Less noise.
            <br />
            More intention.
          </h1>
        </div>
      </section>


      {/* ── Mission ───────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-content mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

            <div ref={addRef} className="reveal">
              <p className="text-[11px] uppercase tracking-widest
                text-brand-grey-500 mb-4">
                Who we are
              </p>
              <h2 className="text-3xl font-light tracking-wider uppercase
                text-brand-900 mb-6">
                Built on restraint
              </h2>
              <p className="text-[14px] text-brand-grey-500 leading-relaxed mb-6">
                endsite was born from a simple frustration: too much product,
                too little purpose. We set out to build a different kind of
                store — one that curates with intention and sells with honesty.
              </p>
              <p className="text-[14px] text-brand-grey-500 leading-relaxed">
                Every piece in our catalogue is chosen because it earns its
                place. We don't chase trends. We don't pad our shelves.
                We carry what we believe in.
              </p>
            </div>

            <div
              ref={addRef}
              className="reveal bg-brand-grey-100 aspect-square
                flex items-center justify-center"
            >
              <p className="text-[11px] uppercase tracking-widest
                text-brand-grey-500">
                Image placeholder
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* ── Values ────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-brand-grey-100">
        <div className="max-w-content mx-auto px-10">

          <div ref={addRef} className="reveal mb-14">
            <p className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-3">
              What drives us
            </p>
            <h2 className="text-3xl font-light tracking-wider uppercase
              text-brand-900">
              Our values
            </h2>
          </div>

          <div
            ref={addRef}
            className="reveal grid grid-cols-1 md:grid-cols-3 gap-px
              bg-brand-grey-200"
          >
            {[
              {
                number: '01',
                title:  'Curation over volume',
                body:   'We carry fewer things and stand behind each one. Quality is not a bullet point — it is the baseline.',
              },
              {
                number: '02',
                title:  'Transparency always',
                body:   'Honest pricing. Honest materials. No inflated markups, no hidden fees. What you see is what you pay.',
              },
              {
                number: '03',
                title:  'Longevity by design',
                body:   'We don\'t want you back next season for a replacement. We want you back because you love what you own.',
              },
            ].map(({ number, title, body }) => (
              <div key={number} className="bg-white p-8 flex flex-col gap-4">
                <p className="text-[11px] uppercase tracking-widest
                  text-brand-grey-500">
                  {number}
                </p>
                <h3 className="text-[16px] font-light tracking-wider uppercase
                  text-brand-900">
                  {title}
                </h3>
                <p className="text-[13px] text-brand-grey-500 leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-content mx-auto px-10">
          <div
            ref={addRef}
            className="reveal grid grid-cols-2 md:grid-cols-4 gap-10"
          >
            {[
              { value: '2025',   label: 'Founded'           },
              { value: '100+',   label: 'Products curated'  },
              { value: '50+',    label: 'Happy customers'   },
              { value: '0',      label: 'Compromises made'  },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-2">
                <p
                  className="font-light text-white"
                  style={{ fontSize: 'clamp(32px, 4vw, 56px)' }}
                >
                  {value}
                </p>
                <p className="text-[11px] uppercase tracking-widest
                  text-white/50">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Team ──────────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-content mx-auto px-10">

          <div ref={addRef} className="reveal mb-14">
            <p className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-3">
              The people
            </p>
            <h2 className="text-3xl font-light tracking-wider uppercase
              text-brand-900">
              Who built this
            </h2>
          </div>

          <div
            ref={addRef}
            className="reveal grid grid-cols-2 md:grid-cols-4 gap-2"
          >
            {[
              { name: 'Founder',   role: 'Vision & curation' },
              { name: 'Design',    role: 'Product & UX'      },
              { name: 'Tech',      role: 'Engineering'       },
              { name: 'Ops',       role: 'Supply & delivery' },
            ].map(({ name, role }) => (
              <div key={name} className="flex flex-col gap-3">
                <div
                  className="w-full bg-brand-grey-100"
                  style={{ aspectRatio: '1/1' }}
                />
                <div>
                  <p className="text-[13px] uppercase tracking-wider
                    text-brand-900">
                    {name}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider
                    text-brand-grey-500 mt-0.5">
                    {role}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-brand-grey-100">
        <div className="max-w-content mx-auto px-10 text-center">
          <div ref={addRef} className="reveal">
            <p className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-4">
              Ready to shop?
            </p>
            <h2 className="text-3xl font-light tracking-wider uppercase
              text-brand-900 mb-8">
              See what we carry
            </h2>
            <Link
              to="/products"
              className="btn-primary inline-flex items-center gap-2"
            >
              Browse the store
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}