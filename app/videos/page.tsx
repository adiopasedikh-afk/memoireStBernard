'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/app/lib/api';

interface VideoItem {
    id: string;
    title: string;
    youtube_id?: string;
    youtubeId?: string;
    description?: string | null;
    badge_date?: string;
    date?: string;
}

const FALLBACK_VIDEOS: VideoItem[] = [
    {
        id: '1',
        title: 'La Ballade des sans-papiers',
        youtube_id: 'kNjVJoYhc84',
        description: 'Documentaire retraçant le mouvement des sans-papiers de Saint-Bernard.',
        badge_date: 'Archive 1996',
    },
    {
        id: '2',
        title: 'Les sans-papiers après Saint-Bernard',
        youtube_id: 'mLoafEv9Vqo',
        description: 'Reportage d’époque sur les suites du mouvement après l’évacuation.',
        badge_date: 'Archive INA',
    },
    {
        id: '3',
        title: '2ᵉ anniversaire des sans-papiers à l\'église St-Bernard',
        youtube_id: 'lUzwQ59nzuQ',
        description: 'Rassemblement de commémoration devant l’église Saint-Bernard.',
        badge_date: 'Archive INA',
    },
    {
        id: '4',
        title: '30 ans de l\'occupation de l\'église Saint-Bernard',
        youtube_id: 'wlsK4MIzu1U',
        description: 'Anzoumane Sissoko sur l’histoire et l’impact de la lutte.',
        badge_date: 'Témoignage',
    },
];

export default function TemoignagesPage() {
    const [videos, setVideos] = useState<VideoItem[]>(FALLBACK_VIDEOS);

    useEffect(() => {
        let active = true;
        async function fetchVideos() {
            try {
                const res = await apiRequest<{ data: VideoItem[] }>('/api/videos');
                if (active && res.data && res.data.length > 0) {
                    setVideos(res.data);
                }
            } catch {
                // Keep fallback on error
            }
        }
        fetchVideos();
        return () => { active = false; };
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 space-y-8 max-w-6xl mx-auto">
            <header className="max-w-4xl mx-auto text-center space-y-3">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest">
                    Archives Audiovisuelles
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-amber-500 border-b border-slate-800 pb-4">
                    Témoignages audio & vidéo
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
                    Collection d'entretiens, d'enregistrements sonores, de reportages et d'extraits vidéo retraçant l'histoire et les récits des acteurs du mouvement des sans-papiers de Saint-Bernard.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                {videos.map((video) => {
                    const yId = video.youtube_id || video.youtubeId;
                    const dateBadge = video.badge_date || video.date || 'Archive';
                    return (
                        <div
                            key={video.id}
                            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
                        >
                            <div className="relative aspect-video w-full bg-black">
                                <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${yId}`}
                                    title={video.title}
                                    className="absolute top-0 left-0 w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>

                            <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-full">
                                        {dateBadge}
                                    </span>
                                    <h2 className="text-lg font-bold text-slate-100 mt-2">
                                        {video.title}
                                    </h2>
                                    {video.description && (
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            {video.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </main>
    );
}