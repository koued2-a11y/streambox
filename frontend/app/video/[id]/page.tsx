'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import VideoPlayer from '@/components/VideoPlayer';
import LoadingSpinner from '@/components/LoadingSpinner';
import VideoCard from '@/components/VideoCard';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { FiHeart, FiEye, FiCalendar, FiSend } from 'react-icons/fi';

export default function VideoPage() {
  const params = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState<any>(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchVideo();
      fetchRelatedVideos();
      if (user) {
        addToHistory();
      }
    }
  }, [params.id, user]);

  const fetchVideo = async () => {
    try {
      const response = await api.get(`/videos/${params.id}`);
      setVideo(response.data.video);
      setLikesCount(response.data.video.likes.length);
      
      if (user) {
        setIsLiked(response.data.video.likes.includes(user.id));
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la vidéo:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedVideos = async () => {
    try {
      const response = await api.get('/videos', { params: { limit: 4 } });
      setRelatedVideos(response.data.videos);
    } catch (error) {
      console.error('Erreur lors du chargement des vidéos recommandées:', error);
    }
  };

  const addToHistory = async () => {
    try {
      await api.post(`/users/history/${params.id}`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout à l\'historique:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('Vous devez être connecté pour liker une vidéo');
      return;
    }

    try {
      const response = await api.post(`/videos/${params.id}/like`);
      setIsLiked(response.data.isLiked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Vous devez être connecté pour commenter');
      return;
    }

    if (!comment.trim()) return;

    setSubmittingComment(true);
    try {
      await api.post(`/videos/${params.id}/comment`, { text: comment });
      setComment('');
      fetchVideo();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-custom py-12">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!video) {
    return (
      <Layout>
        <div className="container-custom py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Vidéo non trouvée</h2>
        </div>
      </Layout>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="bg-white dark:bg-dark-bg min-h-screen">
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <VideoPlayer src={video.videoUrl} poster={video.thumbnailUrl} />

              <div className="mt-6">
                <h1 className="text-3xl font-bold mb-4">{video.title}</h1>

                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-2">
                      <FiEye size={20} />
                      {video.views.toLocaleString()} vues
                    </span>
                    <span className="flex items-center gap-2">
                      <FiCalendar size={20} />
                      {formatDate(video.createdAt)}
                    </span>
                  </div>

                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all ${
                      isLiked
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 dark:bg-dark-card hover:bg-gray-300 dark:hover:bg-dark-hover'
                    }`}
                  >
                    <FiHeart size={20} className={isLiked ? 'fill-current' : ''} />
                    {likesCount}
                  </button>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-card rounded-lg mb-6">
                  <img
                    src={
                      video.uploadedBy?.avatar
                        ? (video.uploadedBy.avatar.startsWith('http')
                            ? video.uploadedBy.avatar
                            : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${video.uploadedBy.avatar}`)
                        : '/default-avatar.png'
                    }
                    alt={video.uploadedBy.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{video.uploadedBy.username}</p>
                    <p className="text-sm text-gray-500">Créateur de contenu</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-dark-card p-6 rounded-lg mb-8">
                  <p className="whitespace-pre-wrap">{video.description || 'Aucune description'}</p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-4">
                    Commentaires ({video.comments.length})
                  </h3>

                  {user && (
                    <form onSubmit={handleComment} className="mb-6">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Ajouter un commentaire..."
                          className="input-field flex-1"
                        />
                        <button
                          type="submit"
                          disabled={submittingComment}
                          className="btn-primary flex items-center gap-2"
                        >
                          <FiSend />
                          Envoyer
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-4">
                    {video.comments.map((comment: any, index: number) => (
                      <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-dark-card rounded-lg">
                        <img
                          src={
                            comment.user?.avatar
                              ? (comment.user.avatar.startsWith('http')
                                  ? comment.user.avatar
                                  : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${comment.user.avatar}`)
                              : '/default-avatar.png'
                          }
                          alt={comment.user.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{comment.user.username}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Vidéos recommandées</h3>
              <div className="space-y-4">
                {relatedVideos.map((relatedVideo: any) => (
                  <VideoCard key={relatedVideo._id} video={relatedVideo} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

