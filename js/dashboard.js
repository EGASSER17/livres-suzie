import { supabase } from './supabase-client.js';

/**
 * Charge les 5 dernières recommandations de l'utilisateur.
 * @param {string} userId
 * @returns {Array}
 */
export async function loadHistory(userId) {
  const { data, error } = await supabase
    .from('recommendations')
    .select('id, created_at, questionnaire, books')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Erreur chargement historique:', error);
    return [];
  }
  return data || [];
}

/**
 * Formate une date ISO en texte lisible en français.
 */
export function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Construit un résumé des critères du questionnaire pour l'affichage.
 */
export function summarizeCriteria(questionnaire) {
  const parts = [];
  if (questionnaire.genres?.length) {
    parts.push(...questionnaire.genres.slice(0, 2));
  }
  if (questionnaire.styles?.length) {
    parts.push(...questionnaire.styles.slice(0, 1));
  }
  if (questionnaire.age) {
    parts.push(questionnaire.age);
  }
  return parts;
}
