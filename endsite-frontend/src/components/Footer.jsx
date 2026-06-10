// src/components/Footer.jsx

import { Link } from 'react-router-dom'

const FOOTER_NAV = [
  { label: 'Home',    to: '/'         },
  { label: 'Shop',    to: '/products' },
  { label: 'About',   to: '/about'    },
  { label: 'Profile', to: '/profile'  },
]

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'Twitter',   href: 'https://twitter.com'   },
  { label: 'YouTube',   href: 'https://youtube.com'   },
]

export default function Footer() {
  return (
    <footer className="bg-[#e9edf2] border-t border-[#d2dae3]">
      <div className="max-w-[1920px] mx-auto px-10 pt-10 pb-8">

        {/* Top row */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">

          {/* Nav links */}
          <nav className="flex flex-col gap-4">
            {FOOTER_NAV.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className="text-[18.7px] text-[#484e5a] hover:opacity-60
                  transition-opacity leading-[18.7px]"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Social links */}
          {/* <div className="flex flex-col gap-4">
            {SOCIAL_LINKS.map(({ label, href }) => (
              
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[16px] text-[#949dae] hover:text-[#484e5a]
                  transition-colors leading-[16px]"
              >
                {label}
              </a>
            ))}
          </div> */}

          {/* Brand */}
          <div className="flex flex-col items-start md:items-end">
            <span className="text-[18px] tracking-[0.18em] text-[#484e5a]">
              endsite
            </span>
          </div>

        </div>

        {/* Bottom — copyright */}
        <div className="border-t border-[#d2dae3] pt-5 flex flex-col sm:flex-row
          items-start sm:items-center justify-between gap-2">
          <p className="text-[13.3px] text-[#86909c] leading-[13.3px]">
            © {new Date().getFullYear()} endsite
          </p>
          <p className="text-[13.3px] text-[#86909c] leading-[13.3px]">
            All rights reserved
          </p>
        </div>

      </div>
    </footer>
  )
}