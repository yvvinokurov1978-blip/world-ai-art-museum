(function () {
  'use strict';

  // --- i18n ---
  const translations = {
    en: {
      'brand': 'World AI Art Museum',
      'nav.collection': 'Collection',
      'nav.models': 'AI Models',
      'nav.discovery': 'Discovery Engine',
      'nav.rights': 'Rights & Offer',
      'nav.contact': 'Contact',
      'hero.eyebrow': 'Non-commercial research project · Launch v1 · 2026-11-04',
      'hero.title': 'Verified AI art.<br>Research-first.',
      'hero.lead': 'A catalog of AI-generated artworks with documented provenance and a rights basis for every published work. Discovered ≠ Verified ≠ Published.',
      'hero.status.live.title': 'Working',
      'hero.status.live.body': 'Static catalog with verified passports (10 works, external-link previews).',
      'hero.status.wip.title': 'In development',
      'hero.status.wip.body': 'Discovery Engine — Civitai connector (dry-run only, no auto-publication).',
      'hero.status.soon.title': 'Coming later',
      'hero.status.soon.body': 'Model comparison lab, international competitions, rating system.',
      'collection.title': 'Collection',
      'collection.note': 'Only works with confirmed provenance (A/B) and a documented rights basis are listed. Previews in this version are external-link only.',
      'collection.loading': 'Loading catalog…',
      'collection.empty': 'No works published yet. The first verified works will appear here.',
      'models.title': 'AI Models',
      'models.note': 'Models, generators, and versions are tracked separately. A language model, a generation interface, and a specific generator version are not the same entity.',
      'discovery.title': 'Discovery Engine',
      'discovery.note': 'Pipeline: find → identify → verify provenance → verify rights → deduplicate → moderate → publish. Nothing enters the public collection automatically.',
      'discovery.step1': 'Source connectors (Civitai, Hugging Face, RSS)',
      'discovery.step2': 'Ingestion & metadata normalization',
      'discovery.step3': 'Provenance check (A/B/C, C2PA evidence)',
      'discovery.step4': 'Rights check (rights_basis required)',
      'discovery.step5': 'Duplicate detection (SHA-256, pHash)',
      'discovery.step6': 'Human moderation',
      'discovery.step7': 'Publication (verified only)',
      'discovery.status': 'Status: dry-run CLI available in repository. Automated ingestion is not yet enabled.',
      'rights.title': 'Rights & Offer',
      'rights.body': 'WAAM does not claim copyright over published images. Every artwork carries a rights status and a rights basis. We respect an explicit author opt-out even when the formal license would permit display.',
      'rights.policy': 'Rights Policy',
      'rights.offer': 'Terms of Use (Offer)',
      'rights.schema': 'Passport Schema (JSON)',
      'contact.title': 'Contact & Takedown',
      'contact.body': 'Authors and rights holders can request correction or removal. Response time: within 72 hours.',
      'footer.line': 'World AI Art Museum · Non-commercial research project · Launch v1 · 2026-11-04'
    },
    ru: {
      'brand': 'Всемирный музей ИИ-искусства',
      'nav.collection': 'Коллекция',
      'nav.models': 'ИИ-модели',
      'nav.discovery': 'Discovery Engine',
      'nav.rights': 'Права и оферта',
      'nav.contact': 'Контакты',
      'hero.eyebrow': 'Некоммерческий исследовательский проект · Launch v1 · 2026-11-04',
      'hero.title': 'Проверенное ИИ-искусство.<br>Research-first.',
      'hero.lead': 'Каталог произведений, созданных генеративным ИИ, с подтверждённым происхождением и правовым основанием для каждой публикации. Discovered ≠ Verified ≠ Published.',
      'hero.status.live.title': 'Работает',
      'hero.status.live.body': 'Статический каталог с проверенными паспортами (10 работ, превью по внешним ссылкам).',
      'hero.status.wip.title': 'В разработке',
      'hero.status.wip.body': 'Discovery Engine — коннектор Civitai (только dry-run, без автопубликации).',
      'hero.status.soon.title': 'Скоро',
      'hero.status.soon.body': 'Сравнительная лаборатория, международные конкурсы, рейтинги.',
      'collection.title': 'Коллекция',
      'collection.note': 'В каталоге только работы с подтверждённым происхождением (A/B) и документированным правовым основанием. В этой версии превью — только по внешним ссылкам.',
      'collection.loading': 'Загрузка каталога…',
      'collection.empty': 'Опубликованных работ пока нет. Первые проверенные работы появятся здесь.',
      'models.title': 'ИИ-модели',
      'models.note': 'Модели, генераторы и версии учитываются раздельно. Языковая модель, интерфейс генерации и конкретная версия генератора — разные сущности.',
      'discovery.title': 'Discovery Engine',
      'discovery.note': 'Пайплайн: найти → идентифицировать → проверить происхождение → проверить права → исключить дубликаты → модерировать → опубликовать. Ничто не попадает в публичную коллекцию автоматически.',
      'discovery.step1': 'Коннекторы источников (Civitai, Hugging Face, RSS)',
      'discovery.step2': 'Импорт и нормализация метаданных',
      'discovery.step3': 'Проверка происхождения (A/B/C, C2PA)',
      'discovery.step4': 'Проверка прав (обязателен rights_basis)',
      'discovery.step5': 'Поиск дубликатов (SHA-256, pHash)',
      'discovery.step6': 'Ручная модерация',
      'discovery.step7': 'Публикация (только verified)',
      'discovery.status': 'Статус: dry-run CLI доступен в репозитории. Автоматический импорт пока не включён.',
      'rights.title': 'Права и оферта',
      'rights.body': 'WAAM не претендует на copyright опубликованных изображений. Каждая работа имеет правовой статус и правовое основание. Мы уважаем явный opt-out автора, даже если формальная лицензия допускает показ.',
      'rights.policy': 'Политика прав',
      'rights.offer': 'Условия использования (оферта)',
      'rights.schema': 'Схема паспорта (JSON)',
      'contact.title': 'Контакты и takedown',
      'contact.body': 'Авторы и правообладатели могут запросить исправление или удаление. Срок ответа — 72 часа.',
      'footer.line': 'World AI Art Museum · Некоммерческий исследовательский проект · Launch v1 · 2026-11-04'
    }
  };

  let currentLang = localStorage.getItem('waam_lang') || 'en';

  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem('waam_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = translations[lang][key];
      if (val !== undefined) el.innerHTML = val;
    });
    const toggle = document.getElementById('langToggle');
    if (toggle) toggle.textContent = lang === 'en' ? 'RU' : 'EN';
    renderCollection();
    renderModels();
  }

  document.getElementById('langToggle').addEventListener('click', () => {
    applyLang(currentLang === 'en' ? 'ru' : 'en');
  });

  // --- Catalog ---
  let catalog = null;
  let modelsData = null;

  async function loadJSON(path) {
    try {
      const res = await fetch(path + '?v=' + Date.now());
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      console.warn('Failed to load', path, e);
      return null;
    }
  }

  async function ensureData() {
    if (catalog !== null) return;
    catalog = (await loadJSON('data/artworks.json')) || [];
    modelsData = (await loadJSON('data/models.json')) || [];
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function renderCollection() {
    const grid = document.getElementById('collectionGrid');
    if (!grid) return;
    await ensureData();
    const items = (catalog || []).filter(a => a.status === 'published');
    if (!items.length) {
      grid.innerHTML = '<p class="loading">' + esc(translations[currentLang]['collection.empty']) + '</p>';
      return;
    }
    grid.innerHTML = items.map(a => {
      const preview = a.preview_url
        ? '<img src="' + esc(a.preview_url) + '" alt="' + esc(a.title) + '" loading="lazy" referrerpolicy="no-referrer">'
        : '<span>' + esc(a.rights_scope === 'link_only' ? 'LINK ONLY' : 'PREVIEW') + '</span>';
      const level = a.provenance_level || 'B';
      return '' +
        '<article class="art-card">' +
          '<div class="art-preview">' + preview + '</div>' +
          '<div class="art-body">' +
            '<p class="art-meta">' + esc(a.passport_id) + '</p>' +
            '<h3 class="art-title">' + esc(a.title) + '</h3>' +
            '<p class="art-meta">' + esc(a.creator || 'Unknown author') + (a.model_name ? ' · ' + esc(a.model_name) : '') + '</p>' +
            '<div>' +
              '<span class="art-badge level-' + level.toLowerCase() + '">Provenance ' + esc(level) + '</span>' +
              '<span class="art-badge">' + esc(a.rights_status) + '</span>' +
            '</div>' +
            '<a class="art-link" href="' + esc(a.source_url) + '" target="_blank" rel="noopener">View source →</a>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  async function renderModels() {
    const el = document.getElementById('modelsTable');
    if (!el) return;
    await ensureData();
    if (!modelsData || !modelsData.length) {
      el.innerHTML = '<p class="loading">' + esc(currentLang === 'en' ? 'Model registry will appear here.' : 'Реестр моделей появится здесь.') + '</p>';
      return;
    }
    const rows = modelsData.map(m =>
      '<tr>' +
        '<td>' + esc(m.model_name) + '</td>' +
        '<td>' + esc(m.image_generator || '—') + '</td>' +
        '<td class="mono">' + esc(m.model_version || '—') + '</td>' +
        '<td>' + esc(m.works_count != null ? m.works_count : '—') + '</td>' +
      '</tr>'
    ).join('');
    el.innerHTML =
      '<table class="models-table"><thead><tr>' +
        '<th>' + esc(currentLang === 'en' ? 'Model' : 'Модель') + '</th>' +
        '<th>' + esc(currentLang === 'en' ? 'Generator' : 'Генератор') + '</th>' +
        '<th>' + esc(currentLang === 'en' ? 'Version' : 'Версия') + '</th>' +
        '<th>' + esc(currentLang === 'en' ? 'Works' : 'Работ') + '</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  // --- Init ---
  applyLang(currentLang);
  renderCollection();
  renderModels();
})();
