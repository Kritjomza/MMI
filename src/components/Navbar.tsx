'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="navbar"
    >
      <div className="main-container navbar-inner">
        {/* Logo */}
        <Link href="/" className="nav-logo group">
          <div className="nav-logo-dot" />
          <span>MoodInsight.</span>
        </Link>

        {/* Nav Links */}
        <div className="nav-links">
          {[
            { href: '/', label: 'Overview' },
            { href: '/analyze', label: 'Analysis' },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <span className={`nav-link ${pathname === link.href ? 'active' : ''}`}>
                {link.label}
              </span>
            </Link>
          ))}
          <Link href="/analyze">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-outline btn-sm ml-4"
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              Start
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
