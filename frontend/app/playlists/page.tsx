'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import PlaylistCard from '@/components/PlaylistCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/api';
import { FiPlus, FiList } from 'react-icons/fi';

export default function PlaylistsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [myPlaylists, setMyPlaylists] = useState([]);
  const [publicPlaylists, setPublicPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else {
      fetchPlaylists();
    }
  }, [user, authLoading]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const [myResponse, publicResponse] = await Promise.all([
        user ? api.get('/playlists/my') : Promise.resolve({ data: { playlists: [] } }),
        api.get('/playlists')
      ]);
      setMyPlaylists(myResponse.data.playlists);
      setPublicPlaylists(publicResponse.data.playlists);
    } catch (error) {
      console.error('Erreur lors du chargement des playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreating(true);
    try {
      await api.post('/playlists', {
        name: newPlaylistName,
        description: newPlaylistDescription,
        isPublic
      });
      setShowCreateModal(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setIsPublic(false);
      fetchPlaylists();
    } catch (error) {
      console.error('Erreur lors de la création de la playlist:', error);
      alert('Erreur lors de la création de la playlist');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div className="bg-white dark:bg-dark-bg min-h-screen">
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-12">
          <div className="container-custom">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Playlists</h1>
                <p className="text-white/80">Organisez vos vidéos préférées</p>
              </div>
              {user && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white text-primary hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FiPlus size={20} />
                  Créer une playlist
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="container-custom">
            <div className="flex gap-8">
              {user && (
                <button
                  onClick={() => setActiveTab('my')}
                  className={`py-4 px-2 border-b-2 transition-colors font-semibold ${
                    activeTab === 'my'
                      ? 'border-primary text-primary'
                      : 'border-transparent hover:text-primary'
                  }`}
                >
                  <FiList className="inline mr-2" />
                  Mes playlists ({myPlaylists.length})
                </button>
              )}
              <button
                onClick={() => setActiveTab('public')}
                className={`py-4 px-2 border-b-2 transition-colors font-semibold ${
                  activeTab === 'public'
                    ? 'border-primary text-primary'
                    : 'border-transparent hover:text-primary'
                }`}
              >
                <FiList className="inline mr-2" />
                Playlists publiques ({publicPlaylists.length})
              </button>
            </div>
          </div>
        </div>

        <div className="container-custom py-12">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {activeTab === 'my' && (
                <div>
                  {myPlaylists.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myPlaylists.map((playlist: any) => (
                        <PlaylistCard key={playlist._id} playlist={playlist} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiList size={64} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                      <p className="text-gray-500 mb-4">Vous n'avez pas encore créé de playlist</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary"
                      >
                        Créer ma première playlist
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'public' && (
                <div>
                  {publicPlaylists.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {publicPlaylists.map((playlist: any) => (
                        <PlaylistCard key={playlist._id} playlist={playlist} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiList size={64} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                      <p className="text-gray-500">Aucune playlist publique disponible</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-card rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Créer une nouvelle playlist</h2>
              <form onSubmit={handleCreatePlaylist} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Nom de la playlist *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="input-field"
                    placeholder="Ma super playlist"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    id="description"
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    className="input-field"
                    rows={3}
                    placeholder="Décrivez votre playlist..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isPublic" className="text-sm">
                    Rendre cette playlist publique
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {creating ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

