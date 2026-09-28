'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Valider et publier un récit
export async function approveArticle(articleId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('articles')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', articleId);

    if (error) {
        throw new Error(`Erreur lors de l'approbation : ${error.message}`);
    }

    // Rafraîchit les données sur la page admin et sur le site public
    revalidatePath('/admin');
    revalidatePath('/recits');
}

// Rejeter ou archiver un récit
export async function rejectArticle(articleId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('articles')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', articleId);

    if (error) {
        throw new Error(`Erreur lors du rejet : ${error.message}`);
    }

    revalidatePath('/admin');
}