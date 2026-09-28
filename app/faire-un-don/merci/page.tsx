import Link from 'next/link';

export default function MerciPage() {
    return (
        <div className="max-w-md mx-auto my-16 p-8 border rounded-lg shadow-md bg-white text-center">
            <div className="text-5xl mb-4">❤️</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Un grand merci !</h1>
            <p className="text-gray-600 mb-6">
                Votre don à l'association Saint-Bernard a bien été pris en compte.
                Votre soutien nous est précieux pour continuer nos actions.
            </p>
            <Link
                href="/"
                className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
            >
                Retourner à l'accueil
            </Link>
        </div>
    );
}