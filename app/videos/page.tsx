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
        id: '936ecc70-2b9a-41dd-a2a0-aad2e86866a8',
        title: "23 août 1996, évacuation de l'église Saint Bernard",
        youtube_id: 'aru3kVwuETs',
        description: "Reportage d'époque du journal télévisé montrant l'intervention des forces de l'ordre (CRS forçant les portes de l'église à la hache), l'évacuation des familles et des grévistes de la faim après deux mois d'occupation, et le témoignage du père Henri Coindé.",
        badge_date: 'Archive 1996',
    },
    {
        id: 'c1d2e3f4-a5b6-7890-cdef-111111111111',
        title: 'La Ballade des sans-papiers',
        youtube_id: 'kNjVJoYhc84',
        description: 'Documentaire retraçant le mouvement des sans-papiers de Saint-Bernard.',
        badge_date: 'Archive 1996',
    },
    {
        id: 'c3ada44a-5636-4d9f-b608-2f341ec72377',
        title: "L'histoire des sans-papiers de Saint Bernard",
        youtube_id: 'DhXT0moKZHc',
        description: "Rétrospective retraçant l'ensemble du parcours des collectifs depuis la première occupation de l'église Saint-Ambroise jusqu'au refuge à l'église Saint-Bernard.",
        badge_date: 'Archive 1996',
    },
    {
        id: 'c1d2e3f4-a5b6-7890-cdef-222222222222',
        title: 'Les sans-papiers après Saint-Bernard',
        youtube_id: 'mLoafEv9Vqo',
        description: 'Reportage d’époque sur les suites du mouvement après l’évacuation.',
        badge_date: 'Archive INA',
    },
    {
        id: '753e2433-8b7f-4b84-a7e9-d25b568eafd0',
        title: 'Les sans-papiers de Saint Bernard retenus à Vincennes',
        youtube_id: 'mCHtmUyj-eg',
        description: 'Images du transfert des familles au centre de rétention administrative de Vincennes et mobilisation des avocats et des comités de soutien.',
        badge_date: 'Archive 1996',
    },
    {
        id: 'c1d2e3f4-a5b6-7890-cdef-333333333333',
        title: '2ᵉ anniversaire des sans-papiers à l\'église St-Bernard',
        youtube_id: 'lUzwQ59nzuQ',
        description: 'Rassemblement de commémoration devant l’église Saint-Bernard.',
        badge_date: 'Archive INA',
    },
    {
        id: 'c1d2e3f4-a5b6-7890-cdef-444444444444',
        title: '30 ans de l\'occupation de l\'église Saint-Bernard',
        youtube_id: 'wlsK4MIzu1U',
        description: 'Anzoumane Sissoko sur l’histoire et l’impact de la lutte.',
        badge_date: 'Témoignage',
    },
    {
        id: '2e2e9f1e-4b2a-417c-bbd3-8aa42c29a53b',
        title: 'Diangounte Camara un petit souvenir',
        youtube_id: 'Mv9WVNe_mRU',
        description: 'Témoignage et souvenir du mouvement des sans-papiers de Saint-Bernard (Diangounte Camara).',
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