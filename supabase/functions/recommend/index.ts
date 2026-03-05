import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Questionnaire {
  genres:   string[];
  styles:   string[];
  keywords: string[];
  age:      string;
  level:    string;
}

interface Book {
  title:         string;
  author:        string;
  year:          string;
  summary:       string;
  why:           string;
  amazon_search: string;
}

// ─── Handler principal ────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Préflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── 1. Vérification du JWT Supabase ───────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 2. Récupération et validation des données ──────────────────────────────
    const q: Questionnaire = await req.json();

    if (!q.genres?.length || !q.styles?.length || !q.age || !q.level) {
      return new Response(JSON.stringify({ error: 'Données incomplètes' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 3. Construction du prompt ──────────────────────────────────────────────
    const keywordsText = q.keywords?.length
      ? q.keywords.join(', ')
      : 'aucun mot-clé particulier';

    const prompt = `Tu es un expert libraire francophone. Recommande exactement 5 livres selon ces critères :
- Genres appréciés : ${q.genres.join(', ')}
- Format souhaité : ${q.styles.join(', ')}
- Mots-clés thématiques : ${keywordsText}
- Tranche d'âge du lecteur : ${q.age}
- Niveau de lecture : ${q.level}

RÈGLES ABSOLUES — lis-les attentivement :
1. Ne recommande QUE des livres réels que tu connais avec certitude : titre exact, auteur exact, année exacte.
2. N'invente JAMAIS un titre, un auteur ou une date. Si tu n'es pas sûr à 100%, choisis un autre livre connu.
3. Préfère des livres célèbres, primés, ou très connus dans leur genre (bestsellers, classiques, prix littéraires).
4. Varie les auteurs et les époques.
5. Adapte le niveau de complexité au profil indiqué.
6. Les livres doivent être disponibles en français (traduits ou écrits en français).
7. Pour le champ "isbn", donne le vrai ISBN-13 du livre si tu le connais, sinon laisse une chaîne vide "".

Retourne UNIQUEMENT un tableau JSON valide, sans texte avant ni après, sans markdown :
[{"title":"...","author":"Prénom Nom","year":"AAAA","isbn":"978...","summary":"Résumé en 2-3 phrases.","why":"Pourquoi ce livre correspond exactement à ces critères.","amazon_search":"titre auteur"}]`;

    // ── 4. Appel à l'API Claude ────────────────────────────────────────────────
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      console.error('ANTHROPIC_API_KEY manquante');
      return new Response(JSON.stringify({ error: 'Configuration serveur manquante' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error('Erreur Claude API:', errText);
      return new Response(JSON.stringify({ error: 'Erreur lors de la génération' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const claudeData = await claudeResponse.json();
    const rawContent = claudeData.content?.[0]?.text ?? '[]';

    // ── 5. Parsing du JSON retourné par Claude ─────────────────────────────────
    let books: Book[] = [];
    try {
      // Extraire le tableau JSON même s'il y a du texte autour
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Pas de JSON trouvé');
      books = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('Erreur parsing JSON Claude:', parseErr, '\nContenu brut:', rawContent);
      return new Response(JSON.stringify({ error: 'Réponse IA invalide' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Valider le format minimal
    books = books.filter(b => b.title && b.author).slice(0, 5);

    return new Response(JSON.stringify({ books }), {
      status:  200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Erreur inattendue:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne' }), {
      status:  500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
