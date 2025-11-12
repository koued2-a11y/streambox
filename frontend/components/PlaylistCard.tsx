'use client';

import Link from 'next/link';
import { FiList, FiLock, FiGlobe } from 'react-icons/fi';

interface PlaylistCardProps {
  playlist: {
    _id: string;
    name: string;
    description: string;
    isPublic: boolean;
    videos: any[];
    owner: {
      username: string;
      avatar: string;
    };
  };
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <Link href={`/playlist/${playlist._id}`}>
      <div className="card p-6 hover:border-primary hover:border-2 transition-all duration-300 cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FiList className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">{playlist.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                {playlist.isPublic ? (
                  <>
                    <FiGlobe size={14} />
                    Publique
                  </>
                ) : (
                  <>
                    <FiLock size={14} />
                    Privée
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {playlist.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {playlist.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {playlist.videos.length} vidéo{playlist.videos.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <img
              src={playlist.owner.avatar}
              alt={playlist.owner.username}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-gray-600 dark:text-gray-400">
              {playlist.owner.username}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

