import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-client.js';

// ── Tags input ──────────────────────────────────────────────────────────────
export function initTagsInput(containerId, inputId, tagsListId) {
  const container = document.getElementById(containerId);
  const input     = document.getElementById(inputId);
  const tagsList  = document.getElementById(tagsListId);
  const tags      = [];

  function renderTags() {
    // Remove existing badges (keep input)
    tagsList.querySelectorAll('.tag-badge').forEach(el => el.remove());
    tags.forEach((tag, i) => {
      const badge = document.createElement('span');
      badge.className = 'tag-badge';
      badge.innerHTML = `${tag}<button class="tag-badge-remove" data-index="${i}" title="Supprimer">×</button>`;
      tagsList.insertBefore(badge, input);
    });
  }

  function addTag(value) {
    const v = value.trim().toLowerCase();
    if (v && !tags.includes(v) && tags.length < 10) {
      tags.push(v);
      renderTags();
    }
  }

  function removeTag(index) {
    tags.splice(index, 1);
    renderTags();
  }

  container.addEventListener('click', () => input.focus());

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input.value);
      input.value = '';
    } else if (e.key === 'Backspace' && !input.value && tags.length) {
      removeTag(tags.length - 1);
    }
  });

  input.addEventListener('blur', () => {
    if (input.value.trim()) {
      addTag(input.value);
      input.value = '';
    }
  });

  tagsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag-badge-remove')) {
      removeTag(parseInt(e.target.dataset.index));
    }
  });

  return { getTags: () => [...tags] };
}

// ── Progress bar ────────────────────────────────────────────────────────────
export function updateProgress(currentStep, totalSteps) {
  const percent = ((currentStep - 1) / (totalSteps - 1)) * 100;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = percent + '%';

  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i + 1 < currentStep) dot.classList.add('done');
    else if (i + 1 === currentStep) dot.classList.add('active');
  });

  const label = document.getElementById('progress-label');
  if (label) label.textContent = `Étape ${currentStep} sur ${totalSteps}`;
}

// ── Validation par étape ─────────────────────────────────────────────────────
export function validateStep(step) {
  if (step === 1) {
    const checked = document.querySelectorAll('input[name="genre"]:checked');
    if (checked.length === 0) {
      showStepError('Sélectionnez au moins un genre.');
      return false;
    }
  }
  if (step === 2) {
    const checked = document.querySelectorAll('input[name="style"]:checked');
    if (checked.length === 0) {
      showStepError('Sélectionnez au moins un style.');
      return false;
    }
  }
  if (step === 4) {
    const age   = document.querySelector('input[name="age"]:checked');
    const level = document.querySelector('input[name="level"]:checked');
    if (!age || !level) {
      showStepError('Veuillez sélectionner votre tranche d\'âge et votre niveau.');
      return false;
    }
  }
  clearStepError();
  return true;
}

function showStepError(msg) {
  let el = document.getElementById('step-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'step-error';
    el.style.cssText = 'color:#c0392b;font-size:.88rem;margin-top:.8rem;font-weight:700;';
    document.querySelector('.question-step.active .step-nav')?.before(el);
  }
  el.textContent = msg;
}

function clearStepError() {
  const el = document.getElementById('step-error');
  if (el) el.remove();
}

// ── Collecte des données du formulaire ────────────────────────────────────────
export function collectFormData(getTags) {
  const genres  = [...document.querySelectorAll('input[name="genre"]:checked')].map(el => el.value);
  const styles  = [...document.querySelectorAll('input[name="style"]:checked')].map(el => el.value);
  const keywords = getTags();
  const age     = document.querySelector('input[name="age"]:checked')?.value ?? '';
  const level   = document.querySelector('input[name="level"]:checked')?.value ?? '';
  return { genres, styles, keywords, age, level };
}

// ── Appel de l'Edge Function ──────────────────────────────────────────────────
export async function callRecommendFunction(questionnaire) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Non authentifié');

  // URL de votre Edge Function Supabase
  const { data: { publicUrl } } = supabase.storage.from('_').getPublicUrl('');
  const baseUrl = new URL(publicUrl).origin.replace('storage', 'functions');

  // Récupérer l'URL du projet depuis le client Supabase
  const supabaseUrl = supabase.supabaseUrl;
  const functionUrl = `${supabaseUrl}/functions/v1/recommend`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(questionnaire),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erreur Edge Function: ${err}`);
  }

  return response.json(); // { books: [...] }
}

// ── Sauvegarde en base de données ─────────────────────────────────────────────
export async function saveRecommendation(userId, questionnaire, books) {
  const { data, error } = await supabase
    .from('recommendations')
    .insert({ user_id: userId, questionnaire, books })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}
