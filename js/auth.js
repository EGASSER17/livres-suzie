import { supabase } from './supabase-client.js';

/**
 * Inscrit un nouvel utilisateur.
 * @returns {{ data, error }}
 */
export async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

/**
 * Connecte un utilisateur existant.
 * @returns {{ data, error }}
 */
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

/**
 * Déconnecte l'utilisateur courant.
 */
export async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

/**
 * Retourne la session courante (ou null).
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Retourne l'utilisateur courant (ou null).
 */
export async function getUser() {
  const session = await getSession();
  return session ? session.user : null;
}

/**
 * Garde de page : redirige vers index.html si non authentifié.
 * À appeler en début de chaque page protégée.
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

/**
 * Garde inverse : redirige vers dashboard.html si déjà authentifié.
 * À utiliser sur index.html.
 */
export async function redirectIfAuthenticated() {
  const user = await getUser();
  if (user) {
    window.location.href = 'dashboard.html';
  }
}
