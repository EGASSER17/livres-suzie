import { supabase } from './supabase-client.js';

/**
 * Récupère l'URL de la pochette via Google Books API (gratuit, sans clé).
 */
export async function fetchCoverUrl(title, author) {
  try {
    const q = encodeURIComponent(`intitle:${title} inauthor:${author}`);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&fields=items(volumeInfo/imageLinks)`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const thumb = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
    if (!thumb) return null;
    // Forcer HTTPS + zoom pour une meilleure résolution
    return thumb.replace('http://', 'https://').replace('zoom=1', 'zoom=2');
  } catch {
    return null;
  }
}

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
export function buildBookCard(book, index, coverUrl = null, favId = '') {
  const amazonUrl = buildAmazonUrl(book.amazon_search || `${book.title} ${book.author}`);
  const rotations = [-1.5, 2, -2.5, 1.5, -1, 2.5, -1.8, 1.2, -2, 1.8];
  const rotation  = rotations[index] ?? -1;

  const coverHtml = coverUrl
    ? `<img class="book-cover" src="${coverUrl}" alt="Couverture de ${escHtml(book.title)}" loading="lazy" />`
    : `<div class="book-cover book-cover--placeholder">${escHtml(book.title[0] ?? '?')}</div>`;

  const heartClass = favId ? 'book-heart active' : 'book-heart';
  const heartIcon  = favId ? '❤️' : '🤍';

  return `
    <article class="book-card" style="--card-rotation: ${rotation}deg"
             data-title="${escHtml(book.title)}" data-author="${escHtml(book.author)}">
      <button class="${heartClass}"
              data-title="${escHtml(book.title)}"
              data-author="${escHtml(book.author)}"
              data-fav-id="${escHtml(favId)}"
              title="${favId ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
        ${heartIcon}
      </button>
      <span class="book-sticker">${index + 1}</span>
      <div class="book-card-inner">
        <div class="book-cover-wrap">${coverHtml}</div>
        <div class="book-content">
          <div class="book-title">${escHtml(book.title)}</div>
          <div class="book-author">${escHtml(book.author)}</div>
          <div class="book-year">${escHtml(String(book.year))}</div>
          <div class="book-summary">${escHtml(book.summary)}</div>
          <div class="book-why">
            <strong>Pourquoi ce livre ?</strong>
            ${escHtml(book.why)}
          </div>
          <div class="book-card-footer">
            <a href="${amazonUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
              Voir sur Amazon.fr
            </a>
          </div>
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
