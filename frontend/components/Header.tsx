'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { FiSun, FiMoon, FiSearch, FiMenu, FiX, FiUser, FiLogOut, FiHome, FiVideo, FiList } from 'react-icons/fi';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-dark-bg border-b border-gray-200 dark:border-gray-800 shadow-md">
      <nav className="container-custom py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <FiVideo className="text-white" />
            </div>
            StreamBox
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 hover:text-primary transition-colors">
              <FiHome size={18} />
              Accueil
            </Link>
            {user && (
              <>
                <Link href="/playlists" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <FiList size={18} />
                  Playlists
                </Link>
                <Link href="/profile" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <FiUser size={18} />
                  Profil
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="flex items-center gap-2 text-primary font-semibold">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-card rounded-full transition-colors"
            >
              <FiSearch size={20} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-card rounded-full transition-colors"
            >
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm">Bonjour, {user.username}</span>
                <button onClick={logout} className="btn-primary flex items-center gap-2">
                  <FiLogOut size={18} />
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="hidden md:flex gap-2">
                <Link href="/login" className="btn-secondary">
                  Connexion
                </Link>
                <Link href="/register" className="btn-primary">
                  Inscription
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-dark-card rounded-full transition-colors"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Rechercher des vidéos..."
              className="input-field"
              autoFocus
            />
          </div>
        )}

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-800 pt-4 space-y-4">
            <Link href="/" className="block hover:text-primary transition-colors">
              Accueil
            </Link>
            {user ? (
              <>
                <Link href="/playlists" className="block hover:text-primary transition-colors">
                  Playlists
                </Link>
                <Link href="/profile" className="block hover:text-primary transition-colors">
                  Profil
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="block text-primary font-semibold">
                    Admin
                  </Link>
                )}
                <button onClick={logout} className="btn-primary w-full">
                  Déconnexion
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Link href="/login" className="btn-secondary w-full block text-center">
                  Connexion
                </Link>
                <Link href="/register" className="btn-primary w-full block text-center">
                  Inscription
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

