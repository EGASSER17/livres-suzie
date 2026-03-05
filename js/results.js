import { supabase } from './supabase-client.js';

/**
 * Charge une recommandation par son ID.
 */
export async function loadRecommendation(id) {
  const { data, error } = await supabase
    .from('recommendations')
    .select('id, created_at, questionnaire, books')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Construit l'URL de recherche Amazon.fr pour un livre.
 */
export function buildAmazonUrl(amazonSearch) {
  const query = encodeURIComponent(amazonSearch);
  return `https://www.amazon.fr/s?k=${query}`;
}

/**
 * Formate une date ISO en texte lisible.
 */
export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Génère le HTML d'une card de livre.
 */
export function buildBookCard(book, index) {
  const amazonUrl = buildAmazonUrl(book.amazon_search || `${book.title} ${book.author}`);
  return `
    <article class="book-card">
      <div class="book-card-number">${index + 1}</div>
      <div class="book-card-body">
        <div class="book-title">${escHtml(book.title)}</div>
        <div class="book-author">${escHtml(book.author)}</div>
        <div class="book-year">${escHtml(String(book.year))}</div>
        <div class="book-summary">${escHtml(book.summary)}</div>
        <div class="book-why"><strong>Pourquoi ce livre ?</strong> ${escHtml(book.why)}</div>
        <div class="book-card-footer">
          <a href="${amazonUrl}"
             target="_blank"
             rel="noopener noreferrer"
             class="btn btn-primary btn-sm">
            Voir sur Amazon.fr
          </a>
        </div>
      </div>
    </article>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
