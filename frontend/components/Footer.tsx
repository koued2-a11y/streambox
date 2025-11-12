'use client';

import Link from 'next/link';
import { FiGithub, FiTwitter, FiFacebook, FiInstagram } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-dark-card border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary">StreamBox</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Votre plateforme de streaming vidéo moderne et intuitive.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/playlists" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                  Playlists
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Suivez-nous</h4>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-gray-200 dark:bg-dark-hover rounded-full hover:bg-primary hover:text-white transition-colors">
                <FiGithub size={20} />
              </a>
              <a href="#" className="p-2 bg-gray-200 dark:bg-dark-hover rounded-full hover:bg-primary hover:text-white transition-colors">
                <FiTwitter size={20} />
              </a>
              <a href="#" className="p-2 bg-gray-200 dark:bg-dark-hover rounded-full hover:bg-primary hover:text-white transition-colors">
                <FiFacebook size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {currentYear} StreamBox. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

