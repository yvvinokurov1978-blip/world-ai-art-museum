(function () {
  'use strict';

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
      'hero.status.live.body': 'Static catalog with 10 thematic categories (external-link previews).',
      'hero.status.wip.title': 'In development',
      'hero.status.wip.body': 'Discovery Engine — Civitai connector (dry-run only, no auto-publication).',
      'hero.status.soon.title': 'Coming later',
      'hero.status.soon.body': 'Model comparison lab, international competitions, rating system.',
      'collection.title': 'Collection',
      'collection.note': 'Only works with confirmed provenance (A/B) and a documented rights basis are listed. Previews in this version are external-link only.',
      'collection.loading': 'Loading catalog…',
      'collection.empty': 'No works published yet. The first verified works will appear here.',
      'collection.linkOnly': 'External preview — open source',
      'models.title': 'AI Models',
      'models.note': 'Models, generators, and versions are tracked separately. A language model, a generation interface, and a specific generator version are not the same entity.',
      'models.empty': 'Model registry will appear here once verified works with identified models are published.',
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
      'hero.status.live.body': 'Статический каталог из 10 тематических категорий (превью по внешним ссылкам).',
      'hero.status.wip.title': 'В разработке',
      'hero.status.wip.body': 'Discovery Engine — коннектор Civitai (только dry-run, без автопубликации).',
      'hero.status.soon.title': 'Скоро',
      'hero.status.soon.body': 'Сравнительная лаборатория, международные конкурсы, рейтинги.',
      'collection.title': 'Коллекция',
      'collection.note': 'В каталоге только работы с подтверждённым происхождением (A/B) и документированным правовым основанием. В этой версии превью — только по внешним ссылкам.',
      'collection.loading': 'Загрузка каталога…',
      'collection.empty': 'Опубликованных работ пока нет. Первые проверенные работы появятся здесь.',
      'collection.linkOnly': 'Внешнее превью — открыть источник',
      'models.title': 'ИИ-модели',
      'models.note': 'Модели, генераторы и версии учитываются раздельно. Языковая модель, интерфейс генерации и конкретная версия генератора — разные сущности.',
      'models.empty': 'Реестр моделей появится здесь, когда будут опубликованы проверенные работы с указанной моделью.',
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
    },
    zh: {
      'brand': '世界人工智能艺术博物馆',
      'nav.collection': '馆藏',
      'nav.models': 'AI 模型',
      'nav.discovery': '发现引擎',
      'nav.rights': '权利与条款',
      'nav.contact': '联系',
      'hero.eyebrow': '非商业研究项目 · Launch v1 · 2026-11-04',
      'hero.title': '经核验的 AI 艺术。<br>研究优先。',
      'hero.lead': '一个收录生成式 AI 艺术作品的目录，每件已发表作品都有可查证来源与权利依据。已发现 ≠ 已核验 ≠ 已发表。',
      'hero.status.live.title': '运行中',
      'hero.status.live.body': '静态目录，包含 10 个主题分类（仅外部链接预览）。',
      'hero.status.wip.title': '开发中',
      'hero.status.wip.body': '发现引擎 — Civitai 连接器（仅 dry-run，不自动发布）。',
      'hero.status.soon.title': '即将推出',
      'hero.status.soon.body': '模型比较实验室、国际竞赛、评分系统。',
      'collection.title': '馆藏',
      'collection.note': '仅收录来源已确认（A/B 级）且具有书面权利依据的作品。本版本预览仅通过外部链接提供。',
      'collection.loading': '正在加载目录…',
      'collection.empty': '尚无已发表作品。首批经核验的作品将在此展示。',
      'collection.linkOnly': '外部预览 — 打开来源',
      'models.title': 'AI 模型',
      'models.note': '模型、生成器与版本分别记录。语言模型、生成界面与具体生成器版本是不同的实体。',
      'models.empty': '当带有明确模型信息的核验作品发表后，模型登记表将在此显示。',
      'discovery.title': '发现引擎',
      'discovery.note': '流程：发现 → 识别 → 核验来源 → 核验权利 → 去重 → 人工审核 → 发表。任何作品都不会自动进入公开馆藏。',
      'discovery.step1': '来源连接器（Civitai、Hugging Face、RSS）',
      'discovery.step2': '导入与元数据规范化',
      'discovery.step3': '来源核验（A/B/C，C2PA 证据）',
      'discovery.step4': '权利核验（必须提供 rights_basis）',
      'discovery.step5': '去重（SHA-256、pHash）',
      'discovery.step6': '人工审核',
      'discovery.step7': '发表（仅限已核验作品）',
      'discovery.status': '状态：仓库中提供 dry-run CLI。自动导入尚未启用。',
      'rights.title': '权利与条款',
      'rights.body': 'WAAM 不对已发表图像主张版权。每件作品都带有权利状态与权利依据。即使正式许可允许展示，我们也尊重作者的明确退出请求。',
      'rights.policy': '权利政策',
      'rights.offer': '使用条款（要约）',
      'rights.schema': '作品护照结构（JSON）',
      'contact.title': '联系与下架',
      'contact.body': '作者与权利人可请求更正或删除。响应时间：72 小时内。',
      'footer.line': '世界人工智能艺术博物馆 · 非商业研究项目 · Launch v1 · 2026-11-04'
    }
  };

  const langOrder = ['en', 'ru', 'zh'];
  let currentLang = localStorage.getItem('waam_lang') || 'en';
  if (!translations[currentLang]) currentLang = 'en';

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
    if (toggle) {
      const next = langOrder[(langOrder.indexOf(lang) + 1) % langOrder.length];
      toggle.textContent = next.toUpperCase();
      toggle.setAttribute('aria-label', 'Switch to ' + next);
    }
    renderCollection();
    renderModels();
  }

  document.getElementById('langToggle').addEventListener('click', () => {
    const idx = langOrder.indexOf(currentLang);
    applyLang(langOrder[(idx + 1) % langOrder.length]);
  });

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
      const previewText = translations[currentLang]['collection.linkOnly'] || 'External preview';
      const preview = a.preview_url
        ? '<img src="' + esc(a.preview_url) + '" alt="' + esc(a.title) + '" loading="lazy" referrerpolicy="no-referrer">'
        : '<span>' + esc(previewText) + '</span>';
      const level = a.provenance_level || 'B';
      const subtitle = [a.category, a.creator || (currentLang === 'en' ? 'Author unknown' : currentLang === 'ru' ? 'Автор неизвестен' : '作者未知')].filter(Boolean).join(' · ');
      return '' +
        '<article class="art-card">' +
          '<div class="art-preview">' + preview + '</div>' +
          '<div class="art-body">' +
            '<p class="art-meta">' + esc(a.passport_id) + '</p>' +
            '<h3 class="art-title">' + esc(a.title) + '</h3>' +
            '<p class="art-meta">' + esc(subtitle) + '</p>' +
            '<div>' +
              '<span class="art-badge level-' + level.toLowerCase() + '">' + esc(currentLang === 'en' ? 'Provenance ' : currentLang === 'ru' ? 'Происхождение ' : '来源 ') + esc(level) + '</span>' +
              '<span class="art-badge">' + esc(a.rights_status) + '</span>' +
            '</div>' +
            '<a class="art-link" href="' + esc(a.source_url) + '" target="_blank" rel="noopener">' +
              esc(currentLang === 'en' ? 'View source →' : currentLang === 'ru' ? 'Открыть источник →' : '打开来源 →') +
            '</a>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  async function renderModels() {
    const el = document.getElementById('modelsTable');
    if (!el) return;
    await ensureData();
    const list = (modelsData || []).filter(m => m.model_name && m.model_name !== '—');
    if (!list.length) {
      el.innerHTML = '<p class
