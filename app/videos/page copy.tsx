export default function VideosPage() {
    const videoList = [
        {
            id: '1',
            title: 'La Ballade des sans-papiers',
            youtubeId: 'kNjVJoYhc84', // ID YouTube de l'archive agenceIMmedia
            description: 'Documentaire retraçant le mouvement des sans-papiers de Saint-Bernard.',
            date: 'Archive 1996',
        },
        {
            id: '2',
            title: 'Les sans-papiers après Saint-Bernard',
            youtubeId: 'mLoafEv9Vqo', // ID YouTube de l'archive INA
            description: 'Reportage d’époque sur les suites du mouvement après l’évacuation.',
            date: 'Archive INA',
        },
        {
            id: '3',
            title: '2ᵉ anniversaire des sans-papiers à l\'église St-Bernard',
            youtubeId: 'lUzwQ59nzuQ', // ID YouTube de l'archive INA
            description: 'Rassemblement de commémoration devant l’église Saint-Bernard.',
            date: 'Archive INA',
        },
        {
            id: '4',
            title: '30 ans de l\'occupation de l\'église Saint-Bernard',
            youtubeId: 'wlsK4MIzu1U', // ID YouTube de l'interview
            description: 'Anzoumane Sissoko sur l’histoire et l’impact de la lutte.',
            date: 'Témoignage',
        },
    ];

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 space-y-8">
            <header className="max-w-4xl mx-auto text-center space-y-3">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest">
                    Archives Audiovisuelles
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-100">
                    Vidéos & Témoignages de la Lutte
                </h1>
                <p className="text-sm text-slate-400 max-w-2xl mx-auto">
                    Retrouvez les reportages, documentaires et témoignages vidéo retraçant l'histoire du mouvement des sans-papiers de Saint-Bernard.
                </p>
            </header>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {videoList.map((video) => (
                    <div
                        key={video.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
                    >
                        <div className="relative aspect-video w-full bg-black">
                            <iframe
                                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
                                title={video.title}
                                className="absolute top-0 left-0 w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>

                        <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-full">
                                    {video.date}
                                </span>
                                <h2 className="text-lg font-bold text-slate-100 mt-2">
                                    {video.title}
                                </h2>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    {video.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}