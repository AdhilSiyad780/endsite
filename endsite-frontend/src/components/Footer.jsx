// src/components/Footer.jsx

import { Link } from 'react-router-dom'

const FOOTER_NAV = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/products' },
  { label: 'About', to: '/about' },
  { label: 'Profile', to: '/profile' },
]

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'Twitter', href: 'https://twitter.com' },
  { label: 'YouTube', href: 'https://youtube.com' },
]

export default function Footer() {
  return (
    <footer className="bg-[#e9edf2] border-t border-[#d2dae3]">
      <div className="max-w-[1920px] mx-auto px-10 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16">

          {/* Brand Col */}
          <div className="flex flex-col gap-6">
            <h2 className="text-[20px] font-black tracking-widest uppercase text-black">ENDSITE</h2>
            <p className="text-[13px] text-[#949dae] leading-relaxed max-w-[200px]">
              Technical equipment and aesthetic essentials for the modern explorer.
            </p>
          </div>

          {/* Nav Col */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[12px] font-semibold text-[#484e5a] tracking-widest uppercase">Shop</h3>
            <nav className="flex flex-col gap-3">
              {FOOTER_NAV.map(({ label, to }) => (
                <Link key={to} to={to} className="text-[14px] text-[#484e5a] hover:opacity-60 transition-opacity">
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Support Col */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[12px] font-semibold text-[#484e5a] tracking-widest uppercase">Support</h3>
            <nav className="flex flex-col gap-3">
              <Link to="/about" className="text-[14px] text-[#484e5a] hover:opacity-60 transition-opacity">Shipping</Link>
              <Link to="/about" className="text-[14px] text-[#484e5a] hover:opacity-60 transition-opacity">Returns</Link>
              <Link to="/about" className="text-[14px] text-[#484e5a] hover:opacity-60 transition-opacity">Privacy</Link>
            </nav>
          </div>

          {/* Social Col */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[12px] font-semibold text-[#484e5a] tracking-widest uppercase">Connect</h3>
            <div className="flex flex-col gap-3">
              {SOCIAL_LINKS.map(({ label, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#484e5a] hover:opacity-60 transition-opacity">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-[#d2dae3] flex justify-between items-center text-[12px] text-[#949dae]">
          <p>© {new Date().getFullYear()} ENDSITE. All rights reserved.</p>
          <div className="flex gap-8">
            <span>Global / English</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
