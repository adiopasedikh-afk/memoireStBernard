import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { isValid: false, error: 'Veuillez fournir une adresse e-mail.' },
                { status: 400 }
            );
        }

        const cleanEmail = email.trim().toLowerCase();

        // Connexion directe avec Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Vérifiez que le nom de la table 'allowed_users' correspond exactement à celui dans Supabase
        const { data, error } = await supabase
            .from('allowed_users')
            .select('email')
            .eq('email', cleanEmail)
            .maybeSingle();

        if (error) {
            console.error('Erreur Supabase :', error);
            return NextResponse.json(
                { isValid: false, error: `Erreur Supabase: ${error.message}` },
                { status: 500 }
            );
        }

        // Si l'e-mail n'est pas dans la table
        if (!data) {
            return NextResponse.json(
                { isValid: false, error: 'Cet e-mail n\'est pas autorisé à accéder à l\'espace privé.' },
                { status: 403 }
            );
        }

        return NextResponse.json({ isValid: true, email: cleanEmail });
    } catch (err: any) {
        console.error('Erreur serveur :', err);
        return NextResponse.json(
            { isValid: false, error: err.message || 'Une erreur serveur s\'est produite.' },
            { status: 500 }
        );
    }
}