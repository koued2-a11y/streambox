'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/api';
import { FiUpload, FiVideo, FiTrash2, FiUsers, FiEye } from 'react-icons/fi';

export default function AdminPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('Autre');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const genres = ['Action', 'Comédie', 'Drame', 'Horreur', 'Science-Fiction', 'Documentaire', 'Animation', 'Autre'];

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
    } else if (user && isAdmin) {
      fetchVideos();
    }
  }, [user, authLoading, isAdmin]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/videos', { params: { limit: 100 } });
      setVideos(response.data.videos);
    } catch (error) {
      console.error('Erreur lors du chargement des vidéos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      alert('Veuillez sélectionner un fichier vidéo');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('video', videoFile);
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }
    formData.append('title', title);
    formData.append('description', description);
    formData.append('genre', genre);

    try {
      await api.post('/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setGenre('Autre');
      setVideoFile(null);
      setThumbnailFile(null);
      fetchVideos();
      alert('Vidéo uploadée avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de l\'upload:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'upload de la vidéo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) return;

    try {
      await api.delete(`/videos/${videoId}`);
      fetchVideos();
      alert('Vidéo supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la vidéo');
    }
  };

  if (authLoading || !user || !isAdmin) {
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Administration</h1>
                <p className="text-white/80">Gérez le contenu de la plateforme</p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-white text-primary hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FiUpload size={20} />
                Upload une vidéo
              </button>
            </div>
          </div>
        </div>

        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FiVideo className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Vidéos</p>
                  <p className="text-3xl font-bold">{videos.length}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <FiEye className="text-green-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vues Totales</p>
                  <p className="text-3xl font-bold">
                    {videos.reduce((acc: number, video: any) => acc + video.views, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <FiUsers className="text-blue-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Créateurs</p>
                  <p className="text-3xl font-bold">
                    {new Set(videos.map((v: any) => v.uploadedBy._id)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-bold">Gestion des vidéos</h2>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-hover">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vidéo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Genre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vues</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Likes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {videos.map((video: any) => (
                      <tr key={video._id} className="hover:bg-gray-50 dark:hover:bg-dark-hover">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                video.thumbnailUrl
                                  ? (video.thumbnailUrl.startsWith('http')
                                      ? video.thumbnailUrl
                                      : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${video.thumbnailUrl}`)
                                  : '/default-avatar.png'
                              }
                              alt={video.title}
                              className="w-16 h-9 object-cover rounded"
                            />
                            <div>
                              <p className="font-semibold line-clamp-1">{video.title}</p>
                              <p className="text-sm text-gray-500">{video.uploadedBy.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            {video.genre}
                          </span>
                        </td>
                        <td className="px-6 py-4">{video.views.toLocaleString()}</td>
                        <td className="px-6 py-4">{video.likes.length}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/video/${video._id}`)}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-dark-card rounded-lg transition-colors"
                              title="Voir"
                            >
                              <FiEye size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(video._id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-dark-card rounded-2xl p-8 max-w-2xl w-full my-8">
              <h2 className="text-2xl font-bold mb-6">Upload une nouvelle vidéo</h2>
              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Titre de la vidéo *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                    placeholder="Titre de votre vidéo"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field"
                    rows={4}
                    placeholder="Décrivez votre vidéo..."
                  />
                </div>

                <div>
                  <label htmlFor="genre" className="block text-sm font-medium mb-2">
                    Genre *
                  </label>
                  <select
                    id="genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="input-field"
                    required
                  >
                    {genres.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="thumbnail" className="block text-sm font-medium mb-2">
                    Vignette (thumbnail) - Optionnel
                  </label>
                  <input
                    type="file"
                    id="thumbnail"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    className="input-field"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Image de prévisualisation (JPG, PNG, GIF, WEBP - max 5MB)
                  </p>
                </div>

                <div>
                  <label htmlFor="video" className="block text-sm font-medium mb-2">
                    Fichier vidéo *
                  </label>
                  <input
                    type="file"
                    id="video"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="input-field"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Formats acceptés : MP4, AVI, MKV, MOV, WEBM (max 500MB)
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                    className="btn-secondary flex-1"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {uploading ? 'Upload en cours...' : 'Upload'}
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

