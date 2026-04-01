'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
            <nav className="flex flex-col py-2">
              <Link
                href="#brands"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors min-h-[44px] flex items-center"
              >
                Brands
              </Link>
              <Link
                href="#guide"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors min-h-[44px] flex items-center"
              >
                How to Use
              </Link>
              <Link
                href="#faq"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors min-h-[44px] flex items-center"
              >
                FAQ
              </Link>
              <Link
                href="/ask"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors min-h-[44px] flex items-center"
              >
                Ask AI
              </Link>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
