'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import VideoCard from '@/components/VideoCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/api';
import { FiTrendingUp, FiFilter } from 'react-icons/fi';

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [popularVideos, setPopularVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('');

  const genres = ['Action', 'Comédie', 'Drame', 'Horreur', 'Science-Fiction', 'Documentaire', 'Animation'];

  useEffect(() => {
    fetchVideos();
    fetchPopularVideos();
  }, [selectedGenre]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = selectedGenre ? { genre: selectedGenre } : {};
      const response = await api.get('/videos', { params });
      setVideos(response.data.videos);
    } catch (error) {
      console.error('Erreur lors du chargement des vidéos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularVideos = async () => {
    try {
      const response = await api.get('/videos/popular');
      setPopularVideos(response.data.videos);
    } catch (error) {
      console.error('Erreur lors du chargement des vidéos populaires:', error);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white dark:bg-dark-bg">
        <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-20">
          <div className="container-custom text-center">
            <h1 className="text-5xl font-bold mb-4">Bienvenue sur StreamBox</h1>
            <p className="text-xl mb-8">Découvrez des milliers de vidéos à regarder en streaming</p>
          </div>
        </section>

        <section className="container-custom py-12">
          <div className="flex items-center gap-3 mb-6">
            <FiTrendingUp className="text-primary" size={28} />
            <h2 className="text-3xl font-bold">Vidéos Populaires</h2>
          </div>

          {popularVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {popularVideos.slice(0, 4).map((video: any) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mb-12">Aucune vidéo populaire pour le moment</p>
          )}
        </section>

        <section className="container-custom py-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <FiFilter className="text-primary" size={24} />
            <h3 className="text-2xl font-bold">Filtrer par genre</h3>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setSelectedGenre('')}
              className={`px-4 py-2 rounded-full transition-all ${
                selectedGenre === ''
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-dark-card hover:bg-gray-300 dark:hover:bg-dark-hover'
              }`}
            >
              Tous
            </button>
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full transition-all ${
                  selectedGenre === genre
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-dark-card hover:bg-gray-300 dark:hover:bg-dark-hover'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </section>

        <section className="container-custom pb-12">
          <h3 className="text-2xl font-bold mb-6">
            {selectedGenre ? `Vidéos ${selectedGenre}` : 'Toutes les vidéos'}
          </h3>

          {loading ? (
            <LoadingSpinner />
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video: any) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucune vidéo trouvée</p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

