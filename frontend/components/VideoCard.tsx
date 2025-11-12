'use client';

import Link from 'next/link';
import { FiPlay, FiEye, FiHeart, FiClock } from 'react-icons/fi';

interface VideoCardProps {
  video: {
    _id: string;
    title: string;
    thumbnailUrl: string;
    duration: number;
    views: number;
    likes: any[];
    uploadedBy: {
      username: string;
      avatar: string;
    };
    createdAt: string;
  };
}

export default function VideoCard({ video }: VideoCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const videoDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Aujourd\'hui';
    if (diffInDays === 1) return 'Hier';
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffInDays / 30)} mois`;
  };

  // Construire l'URL complète du thumbnail
  const getThumbnailUrl = () => {
    if (video.thumbnailUrl.startsWith('http')) {
      return video.thumbnailUrl; // URL externe (placeholder)
    }
    // URL locale : ajouter l'URL du backend
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${video.thumbnailUrl}`;
  };

  return (
    <Link href={`/video/${video._id}`}>
      <div className="card overflow-hidden group cursor-pointer">
        <div className="relative aspect-video bg-gray-200 dark:bg-dark-hover overflow-hidden">
          <img
            src={getThumbnailUrl()}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <FiPlay size={32} className="text-white ml-1" />
            </div>
          </div>

          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            <FiClock className="inline mr-1" size={12} />
            {formatDuration(video.duration)}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>

          <div className="flex items-center gap-2 mb-3">
            <img
              src={video.uploadedBy.avatar}
              alt={video.uploadedBy.username}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {video.uploadedBy.username}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <FiEye size={16} />
                {video.views.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <FiHeart size={16} />
                {video.likes.length}
              </span>
            </div>
            <span className="text-xs">{formatDate(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

