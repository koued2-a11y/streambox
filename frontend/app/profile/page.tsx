'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import VideoCard from '@/components/VideoCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/api';
import { FiHeart, FiClock, FiUser } from 'react-icons/fi';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'liked' | 'history'>('liked');
  const [likedVideos, setLikedVideos] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [likedResponse, historyResponse] = await Promise.all([
        api.get('/users/liked'),
        api.get('/users/history')
      ]);
      setLikedVideos(likedResponse.data.videos);
      setHistory(historyResponse.data.history);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <Layout>
        <div className="container-custom py-12">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white dark:bg-dark-bg min-h-screen">
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-12">
          <div className="container-custom">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <FiUser size={48} className="text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{user.username}</h1>
                <p className="text-white/80">{user.email}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-white/20 rounded-full text-sm">
                  {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="container-custom">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('liked')}
                className={`py-4 px-2 border-b-2 transition-colors font-semibold ${
                  activeTab === 'liked'
                    ? 'border-primary text-primary'
                    : 'border-transparent hover:text-primary'
                }`}
              >
                <FiHeart className="inline mr-2" />
                Vidéos likées ({likedVideos.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-2 border-b-2 transition-colors font-semibold ${
                  activeTab === 'history'
                    ? 'border-primary text-primary'
                    : 'border-transparent hover:text-primary'
                }`}
              >
                <FiClock className="inline mr-2" />
                Historique ({history.length})
              </button>
            </div>
          </div>
        </div>

        <div className="container-custom py-12">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {activeTab === 'liked' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Vidéos que vous avez likées</h2>
                  {likedVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {likedVideos.map((video: any) => (
                        <VideoCard key={video._id} video={video} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiHeart size={64} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                      <p className="text-gray-500">Vous n'avez pas encore liké de vidéos</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Votre historique de visionnage</h2>
                  {history.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {history.map((item: any) => (
                        <VideoCard key={item._id} video={item.video} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiClock size={64} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                      <p className="text-gray-500">Votre historique est vide</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

