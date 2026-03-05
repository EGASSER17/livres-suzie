import { supabase } from './supabase-client.js';

/** Charge tous les favoris de l'utilisateur. */
export async function loadFavorites(userId) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

/** Ajoute un livre aux favoris. Retourne l'ID créé. */
export async function addFavorite(userId, book, recommendationId = null) {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, recommendation_id: recommendationId, book })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/** Retire un livre des favoris par son ID de favori. */
export async function removeFavorite(favoriteId) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('id', favoriteId);
  if (error) throw error;
}

/**
 * Construit une map { "titre||auteur" → favoriteId }
 * pour vérifier rapidement si un livre est favori.
 */
export function buildFavMap(favorites) {
  const map = {};
  favorites.forEach(f => {
    const key = `${f.book.title}||${f.book.author}`;
    map[key] = f.id;
  });
  return map;
}
