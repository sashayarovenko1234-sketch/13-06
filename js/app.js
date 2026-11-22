// ==================== LIQUEUR & SPIRITS ATLAS — CORE APP (js/app.js) ====================
let LIQUEURS = [];
let COCKTAILS = [];
let PRICES_DATA = [];
let REAL_LABELS = {};

async function bootAtlas() {
  try {
    const resp = await fetch('./data/catalog.json');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const catalog = await resp.json();
    LIQUEURS = catalog.liqueurs || [];
    COCKTAILS = catalog.cocktails || [];
    PRICES_DATA = catalog.prices || [];
    REAL_LABELS = catalog.realLabels || {};
    LIQUEURS.forEach(l => {
      if (!l.category) l.category = 'liqueur';
      l.overallScore = calcOverall(l);
    });
    window.__ATLAS_READY__ = true;
    window.dispatchEvent(new CustomEvent('atlas-ready'));
    // Apply initial #hash route after all renderers are wired
    setTimeout(() => applyHashRoute(true), 20);
  } catch (err) {
    console.error('Failed to load catalog.json:', err);
    const grid = document.getElementById('catalogGrid') || document.getElementById('homeLiqueurGrid');
    if (grid) {
      grid.innerHTML = '<div class="col-span-full p-6 rounded-2xl border border-red-200 bg-red-50 text-red-900 text-sm">Не удалось загрузить базу данных (<code>data/catalog.json</code>). Убедитесь, что сайт открыт через HTTP/HTTPS (например, GitHub Pages), а не как локальный <code>file://</code>.</div>';
    }
  }
}

window.addEventListener('DOMContentLoaded', bootAtlas);

// ==================== STATE & HELPERS ====================
    const state = {
      view: 'home',
      detailId: 'cointreau',
      visualMode: '3d', // 'photo' | '3d'
      selectedCompare: ['cointreau', 'aperol', 'jagermeister'],
      sortCol: 'overall',
      sortDir: 'desc',
      catalogCategory: 'all',
      storeFilter: 'all',
      priceCat: 'all',
      compareCat: 'all',
      guideTask: 'cocktails',
      onlyMyBar: false,
      myBar: { liqueurs: [], pantry: [] },
      picker: { step: 0, answers: {}, forcedIdx: null }
    };

    let radarChartInst = null;
    let barChartInst = null;
    let threeCtx = null;

    function calcOverall(l) {
      const r = l.ratings;
      const val = r.taste.score * 0.25 + r.versatility.score * 0.20 + r.cocktails.score * 0.20 + r.aroma.score * 0.15 + r.neat.score * 0.10 + r.value.score * 0.10;
      return Math.round(val * 100) / 100;
    }

    // Data initialized asynchronously from ./data/catalog.json in bootAtlas()

    function getLiqueur(id) { return LIQUEURS.find(x => x.id === id) || LIQUEURS[0]; }

    // ==================== NAVIGATION & #HASH ROUTING ====================
    let isApplyingHash = false;
    let currentModalCocktailId = null;

    function updateUrlHash(hashStr) {
      if (isApplyingHash) return;
      const target = hashStr.startsWith('#') ? hashStr : '#' + hashStr;
      if (window.location.hash !== target) {
        try {
          history.pushState(null, '', target);
        } catch (e) {
          window.location.hash = target;
        }
      }
    }

    function shareAtlasLink(title, text, hashPath) {
      const base = window.location.href.split('#')[0];
      const url = base + (hashPath.startsWith('#') ? hashPath : '#' + hashPath);
      if (navigator.share) {
        navigator.share({ title, text, url }).catch(() => {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          if (typeof showToast === 'function') showToast('Ссылка скопирована');
        }).catch(() => {});
      }
    }

    function navigateTo(view, detailId, opts = {}) {
      if (detailId) {
        state.detailId = detailId;
        state.activeLiqueurId = detailId;
      }
      state.view = view;

      document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
      const target = document.getElementById('view-' + view);
      if (target) target.classList.add('active');

      // Update nav highlights
      const navKey = view === 'detail' ? 'catalog' : view;
      document.querySelectorAll('.desk-nav').forEach(btn => {
        const active = btn.dataset.nav === navKey;
        btn.classList.toggle('bg-[#1A1816]', active);
        btn.classList.toggle('text-[#FAF7F2]', active);
        btn.classList.toggle('text-[#524C46]', !active);
      });
      document.querySelectorAll('.tab-btn-mobile').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.nav === navKey);
      });

      if (view === 'detail') {
        renderDetail(state.detailId);
      } else {
      }
      if (view === 'compare') renderCompare();
      if (view === 'cocktails') renderCocktails();
      if (view === 'prices') renderPrices();
      if (view === 'guide') {
        renderQuickPicker();
        renderGuideTask(state.guideTask);
      }
      if (view === 'mybar') renderMyBar();
      if (view === 'guest' && typeof renderGuestMenu === 'function') renderGuestMenu();

      if (!opts.skipHash) {
        if (view === 'detail' && state.detailId) updateUrlHash('#liqueur/' + state.detailId);
        else if (view === 'guest' && typeof getGuestRouteHash === 'function') updateUrlHash(getGuestRouteHash());
        else updateUrlHash('#' + view);
      }

      if (!opts.preserveScroll) {
        if (window.__LENIS__) { window.__LENIS__.scrollTo(0, { immediate: true }); } window.scrollTo(0, 0);
      }
      if (window.lucide) lucide.createIcons();
      setupReveals();
      window.dispatchEvent(new CustomEvent('atlas-navigate', { detail: { view, detailId: state.detailId } }));
    }

    function applyHashRoute(isInitial = false) {
      if (!window.__ATLAS_READY__) return;
      const raw = (window.location.hash || '').replace(/^#\/?/, '').trim();
      isApplyingHash = true;
      try {
        if (!raw || raw === 'home') {
          if (currentModalCocktailId) closeCocktailModal({ skipHash: true });
          if (!isInitial || state.view !== 'home') navigateTo('home', null, { skipHash: true });
          return;
        }
        const [section, param] = raw.split('/');
        if (section === 'liqueur' && param) {
          if (currentModalCocktailId) closeCocktailModal({ skipHash: true });
          const exists = LIQUEURS.some(l => l.id === param);
          navigateTo('detail', exists ? param : LIQUEURS[0].id, { skipHash: true });
          return;
        }
        if (section === 'cocktail' && param) {
          if (state.view !== 'cocktails') navigateTo('cocktails', null, { skipHash: true });
          const exists = COCKTAILS.some(c => c.id === param);
          if (exists) openCocktailModal(param, { skipHash: true });
          return;
        }
        if (section === 'guest') {
          if (currentModalCocktailId) closeCocktailModal({ skipHash: true });
          if (typeof parseGuestHashParam === 'function') parseGuestHashParam(param || '');
          navigateTo('guest', null, { skipHash: true });
          return;
        }
        const validViews = ['home', 'catalog', 'compare', 'cocktails', 'prices', 'guide', 'mybar', 'guest'];
        if (validViews.includes(section)) {
          if (currentModalCocktailId) closeCocktailModal({ skipHash: true });
          navigateTo(section, null, { skipHash: true });
        }
      } finally {
        isApplyingHash = false;
      }
    }

    window.addEventListener('hashchange', () => applyHashRoute(false));

    // ==================== HOME & CATALOG CARDS ====================
    function buildLiqueurCard(l) {
      return `
        <article class="card-ed overflow-hidden flex flex-col cursor-pointer group reveal" data-open-detail="${l.id}">
          <div class="relative aspect-[4/3] overflow-hidden bg-[#EFE9DF]">
            <img src="${l.img}" alt="${l.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            <div class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shadow-sm" style="background:${l.accent};">
              ${l.general.abvLabel.split(' ')[0]}
            </div>
            <div class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FAF7F2]/92 text-[#1A1816] backdrop-blur-sm">
              ★ ${l.overallScore.toFixed(2)}
            </div>
          </div>
          <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div class="text-[11px] uppercase tracking-[0.14em]" style="color:${l.accentDark};">${l.general.country.split(' ')[0]} · ${l.general.type.split('(')[0].trim()}</div>
              <h3 class="font-serif-ed text-2xl font-semibold mt-1 group-hover:opacity-75 transition-opacity">${l.name}</h3>
              <p class="text-xs text-[#6B655E] mt-1 leading-relaxed">${l.subtitle}</p>
            </div>
            <div class="pt-3 border-t border-[#EDE6DA] flex items-center justify-between text-xs">
              <span class="text-[#524C46] font-medium">от ${l.general.priceNum.toLocaleString('ru-RU')} ₽</span>
              <span class="font-medium flex items-center gap-1" style="color:${l.accent};">Обзор <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i></span>
            </div>
          </div>
        </article>`;
    }

    function renderHomeAndCatalog() {
      const list = state.catalogCategory === 'all' ? LIQUEURS : LIQUEURS.filter(l => l.category === state.catalogCategory);
      const html = list.map(buildLiqueurCard).join('');
      document.getElementById('homeLiqueurGrid').innerHTML = html;
      document.getElementById('catalogGrid').innerHTML = html;
      document.querySelectorAll('.cat-pill').forEach(b => {
        const active = b.dataset.catFilter === state.catalogCategory;
        b.classList.toggle('bg-[#1A1816]', active);
        b.classList.toggle('text-white', active);
        b.classList.toggle('bg-white', !active);
      });
      if (window.lucide) lucide.createIcons();
      setupReveals();
    }

    // ==================== FULL LIQUEUR REVIEW (A–Ж + 3D) ====================
    const TASTE_LABELS = [
      ['sweetness', 'Сладость'],
      ['acidity', 'Кислотность'],
      ['bitterness', 'Горечь'],
      ['spiciness', 'Пряность'],
      ['body', 'Плотность и текстура'],
      ['aromaIntensity', 'Интенсивность аромата'],
      ['flavorIntensity', 'Насыщенность вкуса'],
      ['aftertasteLen', 'Длина послевкусия'],
      ['freshness', 'Свежесть'],
      ['complexity', 'Сложность букета']
    ];

    const RATING_LABELS = [
      ['taste', 'Вкусовые качества'],
      ['aroma', 'Аромат'],
      ['versatility', 'Универсальность'],
      ['cocktails', 'Использование в коктейлях'],
      ['neat', 'Употребление в чистом виде'],
      ['value', 'Соотношение цены и качества']
    ];

    function renderDetail(id) {
      const l = getLiqueur(id);

      // Switcher pills
      document.getElementById('detailSwitcherPills').innerHTML = LIQUEURS.map(item => `
        <button type="button" data-open-detail="${item.id}" class="px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${item.id === l.id ? 'text-white' : 'bg-white border border-[#D7CEC0] text-[#524C46]'}" style="${item.id === l.id ? 'background:' + item.accent : ''}">
          ${item.shortName}
        </button>`).join('');

      const relatedCocktailsCount = COCKTAILS.filter(c => c.liqueurs.includes(l.id)).length;

      const html = `
        <!-- Hero Banner of Liqueur -->
        <div class="card-ed overflow-hidden">
          <div class="grid lg:grid-cols-12">
            <div class="lg:col-span-6 p-5 sm:p-8 flex flex-col justify-between" class="soft-bg-tile" style="background:${l.accentSoft};">
              <div class="space-y-3">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold text-white" style="background:${l.accent};">
                  <span>${l.general.country}</span>
                </div>
                <h1 class="font-serif-ed text-4xl sm:text-5xl font-semibold leading-tight text-[#1A1816]">${l.name}</h1>
                <p class="text-sm text-[#4A453F]">${l.subtitle}</p>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                  <div class="bg-white/85 rounded-xl p-2.5 border border-black/5">
                    <div class="text-[10px] uppercase text-[#6B655E]">Крепость</div>
                    <div class="font-semibold text-sm mt-0.5">${l.general.abv}%</div>
                  </div>
                  <div class="bg-white/85 rounded-xl p-2.5 border border-black/5">
                    <div class="text-[10px] uppercase text-[#6B655E]">Калории</div>
                    <div class="font-semibold text-sm mt-0.5">${l.general.kcal} ккал</div>
                  </div>
                  <div class="bg-white/85 rounded-xl p-2.5 border border-black/5">
                    <div class="text-[10px] uppercase text-[#6B655E]">Сахар/100мл</div>
                    <div class="font-semibold text-sm mt-0.5">${l.id === 'bols-cassis' ? '≥45 г' : l.general.sugar + ' г'}</div>
                  </div>
                  <div class="bg-white/85 rounded-xl p-2.5 border border-black/5">
                    <div class="text-[10px] uppercase text-[#6B655E]">Рейтинг</div>
                    <div class="font-semibold text-sm mt-0.5" style="color:${l.accent};">${l.overallScore.toFixed(2)} / 10</div>
                  </div>
                </div>
              </div>
              <div class="pt-5 flex flex-wrap gap-2">
                <button type="button" id="shareLiqueurBtn" aria-label="Поделиться ссылкой на напиток" class="px-3.5 py-2 rounded-full border border-[#D7CEC0] bg-white text-xs font-medium hover:border-[#1A1816] transition-colors inline-flex items-center gap-1.5"><i data-lucide="share-2" class="w-3.5 h-3.5"></i><span>Поделиться</span></button>
              <button type="button" id="jumpCocktailsBtn" class="px-4 py-2 rounded-full text-xs font-medium text-white flex items-center gap-1.5" style="background:${l.accent};">
                  <i data-lucide="wine" class="w-3.5 h-3.5"></i> Коктейли с ${l.shortName} (${relatedCocktailsCount})
                </button>
                <button type="button" data-nav="prices" class="px-4 py-2 rounded-full text-xs font-medium bg-white border border-[#D7CEC0] hover:border-[#1A1816]">
                  Цены во Владивостоке
                </button>
              </div>
            </div>

            <!-- Winelab-style Real Bottle Photo Showcase -->
            <div class="lg:col-span-6 relative bg-white flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#E5DDD0] winelab-bottle-card">
              <div class="relative flex-1 flex items-center justify-center p-4 sm:p-6 min-h-[290px] sm:min-h-[360px] bg-gradient-to-b from-[#FAF7F2] to-[#F2ECE1]">
                <img decoding="async" src="${l.img}" alt="${l.name} — фото бутылки" class="w-full max-h-[340px] object-contain rounded-2xl img-zoomable shadow-sm" data-zoom-caption="${l.name} (${l.general.abvLabel}, ${l.general.volumes})" />
                <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/90 border border-[#E5DDD0] text-[#524C46] pointer-events-none">
                  Нажмите для увеличения 🔍
                </span>
              </div>
              <div class="px-4 py-3 sm:px-5 bg-white border-t border-[#E5DDD0] flex items-center justify-between gap-3">
                <div>
                  <div class="text-[10px] uppercase tracking-[0.14em] text-[#6B655E]">Ориентир цены · ${l.general.volumes.split(',')[0]}</div>
                  <div class="font-serif-ed text-2xl font-bold text-[#1A1816] leading-tight">от ${l.general.priceNum.toLocaleString('ru-RU')} ₽</div>
                </div>
                <button type="button" id="detailToggleMyBarBtn" class="px-4 py-2 rounded-full text-xs font-medium transition-colors ${state.myBar && state.myBar.liqueurs && state.myBar.liqueurs.includes(l.id) ? 'bg-[#1B4D3E] text-white' : 'bg-[#1A1816] text-white hover:opacity-90'}">
                  ${state.myBar && state.myBar.liqueurs && state.myBar.liqueurs.includes(l.id) ? '✓ В моём баре' : '+ В мой бар'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- A. Общая информация -->
        <div class="card-ed p-5 sm:p-7 space-y-4">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style="background:${l.accent};">А</span>
            <h2 class="font-serif-ed text-2xl sm:text-3xl font-semibold">Общая информация</h2>
          </div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div class="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><div class="text-[11px] text-[#6B655E]">Производитель</div><div class="font-medium mt-0.5">${l.general.producer}</div></div>
            <div class="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><div class="text-[11px] text-[#6B655E]">Страна производства</div><div class="font-medium mt-0.5">${l.general.country}</div></div>
            <div class="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><div class="text-[11px] text-[#6B655E]">Тип ликёра</div><div class="font-medium mt-0.5">${l.general.type}</div></div>
            <div class="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><div class="text-[11px] text-[#6B655E]">Крепость</div><div class="font-medium mt-0.5">${l.general.abvLabel}</div></div>
            <div class="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><div class="text-[11px] text-[#6B655E]">Содержание сахара</div><div class="font-medium mt-0.5">${l.general.sugarLabel}</div></div>
            <div class="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><div class="text-[11px] text-[#6B655E]">Калорийность</div><div class="font-medium mt-0.5">${l.general.kcalLabel}</div></div>
            <div class="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><div class="text-[11px] text-[#6B655E]">Стандартные объёмы</div><div class="font-medium mt-0.5">${l.general.volumes}</div></div>
            <div class="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><div class="text-[11px] text-[#6B655E]">Ориентир цены в РФ</div><div class="font-medium mt-0.5">${l.general.priceRu}</div></div>
            <div class="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><div class="text-[11px] text-[#6B655E]">Диетический статус</div><div class="font-medium mt-0.5">${l.general.vegan ? 'Веганский (без молочных продуктов)' : 'Содержит молочные сливки и лактозу'}</div></div>
          </div>
          <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA] text-xs sm:text-sm">
            <span class="text-[#6B655E] font-medium">Основное сырьё: </span>${l.general.rawMaterial}
          </div>
        </div>

        <!-- Б. Состав и производство -->
        <div class="card-ed p-5 sm:p-7 space-y-4">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style="background:${l.accent};">Б</span>
            <h2 class="font-serif-ed text-2xl sm:text-3xl font-semibold">Состав и производство</h2>
          </div>
          <div class="grid md:grid-cols-2 gap-3.5 text-xs sm:text-sm leading-relaxed">
            <div class="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DA]"><div class="font-semibold mb-1">Ингредиенты</div><p class="text-[#4A453F]">${l.production.ingredients}</p></div>
            <div class="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DA]"><div class="font-semibold mb-1">Что формирует вкус</div><p class="text-[#4A453F]">${l.production.keyFlavorDrivers}</p></div>
            <div class="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DA]"><div class="font-semibold mb-1">Технология производства</div><p class="text-[#4A453F]">${l.production.technology}</p></div>
            <div class="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DA]"><div class="font-semibold mb-1">Главная особенность</div><p class="text-[#4A453F]">${l.production.uniqueness}</p></div>
          </div>
          <div class="p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed" data-soft-bg="1" style="background:${l.accentSoft}; border-color:${l.accent}33;">
            <span class="font-semibold">Отличие от аналогов: </span>${l.production.comparisonDiff}
          </div>
          ${renderLiqueurBotanicalCards(l)}
        </div>

        <!-- В. Подробный вкусовой анализ -->
        <div class="card-ed p-5 sm:p-7 space-y-5">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style="background:${l.accent};">В</span>
            <h2 class="font-serif-ed text-2xl sm:text-3xl font-semibold">Подробный вкусовой анализ</h2>
          </div>
          <div class="grid md:grid-cols-2 gap-5">
            <div class="space-y-3 text-xs sm:text-sm leading-relaxed">
              <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><b>Аромат при открытии:</b> ${l.taste.aroma}</div>
              <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><b>Первые ощущения:</b> ${l.taste.initial}</div>
              <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><b>Основной профиль:</b> ${l.taste.mainProfile}</div>
              <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><b>Плотность и текстура:</b> ${l.taste.textureDesc}</div>
              <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><b>Послевкусие:</b> ${l.taste.aftertaste}</div>
            </div>
            <div class="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DA] space-y-3">
              <div class="text-xs font-semibold uppercase tracking-wider text-[#6B655E]">Сенсорные шкалы (1–10)</div>
              ${TASTE_LABELS.map(([key, label]) => {
                const v = l.taste.scores[key];
                return `
                  <div class="space-y-1">
                    <div class="flex justify-between text-xs">
                      <span class="text-[#3E3934]">${label}</span>
                      <span class="font-semibold" style="color:${l.accentDark};">${v} / 10</span>
                    </div>
                    <div class="h-2 rounded-full bg-[#E6DFD3] overflow-hidden">
                      <div class="scale-fill h-full rounded-full" style="width:${v * 10}%; background:${l.accent};"></div>
                    </div>
                  </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Г. Как правильно употреблять -->
        <div class="card-ed p-5 sm:p-7 space-y-4">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style="background:${l.accent};">Г</span>
            <h2 class="font-serif-ed text-2xl sm:text-3xl font-semibold">Как правильно употреблять</h2>
          </div>
          <div class="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div class="p-3.5 rounded-xl border" data-soft-bg="1" style="background:${l.accentSoft}; border-color:${l.accent}33;"><b>Температура подачи:</b> ${l.serving.temp}</div>
            <div class="p-3.5 rounded-xl border" data-soft-bg="1" style="background:${l.accentSoft}; border-color:${l.accent}33;"><b>Подходящие бокалы:</b> ${l.serving.glassware}</div>
          </div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm leading-relaxed">
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><b>В чистом виде:</b><br/>${l.serving.neat}</div>
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><b>Со льдом:</b><br/>${l.serving.rocks}</div>
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><b>С миксерами и содовой:</b><br/>${l.serving.mixers}</div>
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA] sm:col-span-2"><b>В составе коктейлей:</b> ${l.serving.cocktails}</div>
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><b>Лучшие партнёры:</b> ${l.serving.pairingsNote}</div>
          </div>
        </div>

        <!-- Д. Гастрономические сочетания -->
        <div class="card-ed p-5 sm:p-7 space-y-4">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style="background:${l.accent};">Д</span>
            <h2 class="font-serif-ed text-2xl sm:text-3xl font-semibold">Гастрономические сочетания</h2>
          </div>
          <div class="grid sm:grid-cols-2 gap-3.5">
            ${l.gastronomy.map(g => `
              <div class="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DA]">
                <div class="font-semibold text-sm">${g.item}</div>
                <p class="text-xs text-[#524C46] mt-1 leading-relaxed">${g.why}</p>
              </div>`).join('')}
          </div>
        </div>

        <!-- Е. Достоинства и недостатки -->
        <div class="card-ed p-5 sm:p-7 space-y-4">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style="background:${l.accent};">Е</span>
            <h2 class="font-serif-ed text-2xl sm:text-3xl font-semibold">Достоинства и недостатки</h2>
          </div>
          <div class="grid md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div class="p-4 rounded-2xl bg-[#EEF6F2] border border-[#C6E0D3] space-y-2">
              <div class="font-semibold text-[#1B4D3E]">Сильные стороны</div>
              <ul class="list-disc pl-4 space-y-1 text-[#2A3B33]">${l.prosCons.pros.map(p => `<li>${p}</li>`).join('')}</ul>
            </div>
            <div class="p-4 rounded-2xl bg-[#FDF2F2] border border-[#F0CBCB] space-y-2">
              <div class="font-semibold text-[#9B1C1C]">Слабые стороны</div>
              <ul class="list-disc pl-4 space-y-1 text-[#4A2525]">${l.prosCons.cons.map(c => `<li>${c}</li>`).join('')}</ul>
            </div>
          </div>
          <div class="grid md:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><b>Может понравиться:</b> ${l.prosCons.mayLike}</div>
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><b>Может не понравиться:</b> ${l.prosCons.mayDislike}</div>
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]"><b>Для кого:</b> ${l.prosCons.audience}</div>
          </div>
        </div>

        <!-- Ж. Итоговая оценка + Источники -->
        <div class="card-ed p-5 sm:p-7 space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style="background:${l.accent};">Ж</span>
              <h2 class="font-serif-ed text-2xl sm:text-3xl font-semibold">Итоговая оценка</h2>
            </div>
            <div class="px-4 py-1.5 rounded-full text-sm font-semibold text-white" style="background:${l.accent};">Итого: ${l.overallScore.toFixed(2)} / 10</div>
          </div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            ${RATING_LABELS.map(([key, label]) => {
              const item = l.ratings[key];
              return `
                <div class="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DA] space-y-1.5">
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-semibold">${label}</span>
                    <span class="font-serif-ed text-xl font-bold" style="color:${l.accent};">${item.score.toFixed(1)}</span>
                  </div>
                  <p class="text-xs text-[#524C46] leading-relaxed">${item.reason}</p>
                </div>`;
            }).join('')}
          </div>
          <div class="pt-3 border-t border-[#EDE6DA] space-y-1.5">
            <div class="text-[11px] uppercase tracking-wider text-[#6B655E] font-medium">Проверенные первоисточники</div>
            <div class="flex flex-wrap gap-2">
              ${l.sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener" class="text-xs px-3 py-1 rounded-full bg-[#F2ECE1] hover:bg-[#1A1816] hover:text-white transition-colors">${s.title} ↗</a>`).join('')}
            </div>
          </div>
        </div>
      `;

      document.getElementById('detailContent').innerHTML = html;

      // Bind "+ В мой бар" button on Winelab-style bottle card
      const barToggleBtn = document.getElementById('detailToggleMyBarBtn');
      if (barToggleBtn) {
        barToggleBtn.addEventListener('click', () => {
          if (!state.myBar) return;
          const idx = state.myBar.liqueurs.indexOf(l.id);
          if (idx >= 0) {
            state.myBar.liqueurs.splice(idx, 1);
            if (typeof showToast === 'function') showToast(`${l.shortName} убран из «Моего бара»`);
          } else {
            state.myBar.liqueurs.push(l.id);
            if (typeof showToast === 'function') showToast(`${l.shortName} добавлен в «Мой бар»`);
          }
          if (typeof saveMyBar === 'function') saveMyBar();
          if (typeof updateMyBarHeaderBadge === 'function') updateMyBarHeaderBadge();
          renderDetail(l.id);
        });
      }

      const shareLiqBtn = document.getElementById('shareLiqueurBtn');
      if (shareLiqBtn) {
        shareLiqBtn.addEventListener('click', () => shareAtlasLink(l.name + ' — LIQUEUR ATLAS', l.subtitle || l.name, '#liqueur/' + l.id));
      }
      document.getElementById('jumpCocktailsBtn').addEventListener('click', () => {
        document.getElementById('fLiqueur').value = l.id;
        navigateTo('cocktails');
      });


      if (window.lucide) lucide.createIcons();
    }

        
// ==================== COMPARE & RATINGS ====================
    const COMPARE_COLS = [
      { key: 'name', label: 'Ликёр' },
      { key: 'abv', label: 'Крепость %', get: l => l.general.abv },
      { key: 'kcal', label: 'Ккал/100мл', get: l => l.general.kcal },
      { key: 'sugar', label: 'Сахар г/100', get: l => l.general.sugar, fmt: (v, l) => l.id === 'bols-cassis' ? '≥45' : v },
      { key: 'sweetness', label: 'Сладость', get: l => l.taste.scores.sweetness },
      { key: 'acidity', label: 'Кислотн.', get: l => l.taste.scores.acidity },
      { key: 'bitterness', label: 'Горечь', get: l => l.taste.scores.bitterness },
      { key: 'aromaIntensity', label: 'Аромат', get: l => l.taste.scores.aromaIntensity },
      { key: 'flavorIntensity', label: 'Насыщенн.', get: l => l.taste.scores.flavorIntensity },
      { key: 'body', label: 'Плотность', get: l => l.taste.scores.body },
      { key: 'versatility', label: 'Универс.', get: l => l.ratings.versatility.score },
      { key: 'neat', label: 'Чистым', get: l => l.ratings.neat.score },
      { key: 'cocktails', label: 'Коктейли', get: l => l.ratings.cocktails.score },
      { key: 'gastro', label: 'Гастрон.', get: l => l.ratings.gastroScore },
      { key: 'priceNum', label: 'Цена (₽)', get: l => l.general.priceNum, fmt: v => v.toLocaleString('ru-RU') + ' ₽' },
      { key: 'value', label: 'Цена/кач.', get: l => l.ratings.value.score },
      { key: 'overall', label: 'Итог', get: l => l.overallScore, fmt: v => v.toFixed(2) }
    ];

    function renderCompare() {
      // Picker pills
      document.getElementById('comparePickerPills').innerHTML = LIQUEURS.map(l => {
        const active = state.selectedCompare.includes(l.id);
        return `
          <button type="button" data-toggle-cmp="${l.id}" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${active ? 'text-white border-transparent shadow-sm' : 'bg-white border-[#D7CEC0] text-[#524C46]'}" style="${active ? 'background:' + l.accent : ''}">
            ${active ? '✓ ' : '+ '}${l.shortName}
          </button>`;
      }).join('');

      document.querySelectorAll('[data-toggle-cmp]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.toggleCmp;
          if (state.selectedCompare.includes(id)) {
            if (state.selectedCompare.length > 2) {
              state.selectedCompare = state.selectedCompare.filter(x => x !== id);
            }
          } else {
            state.selectedCompare.push(id);
          }
          renderCompare();
        });
      });

      const chosen = LIQUEURS.filter(l => state.selectedCompare.includes(l.id));
      renderCompareCharts(chosen);
      if (typeof renderTasteMap === 'function') renderTasteMap();
      renderHeadToHead(chosen);
      renderCompareTable();
      renderRankings();
    }

    function renderCompareCharts(chosen) {
      if (typeof Chart === 'undefined') return;
      if (radarChartInst) radarChartInst.destroy();
      if (barChartInst) barChartInst.destroy();

      const radarCtx = document.getElementById('radarChart').getContext('2d');
      radarChartInst = new Chart(radarCtx, {
        type: 'radar',
        data: {
          labels: ['Сладость', 'Кислотность', 'Горечь', 'Пряность', 'Плотность', 'Аромат'],
          datasets: chosen.map(l => ({
            label: l.shortName,
            data: [l.taste.scores.sweetness, l.taste.scores.acidity, l.taste.scores.bitterness, l.taste.scores.spiciness, l.taste.scores.body, l.taste.scores.aromaIntensity],
            borderColor: l.accent,
            backgroundColor: l.accent + '26',
            borderWidth: 2,
            pointRadius: 3
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              min: 0, max: 10,
              ticks: { stepSize: 2, display: false },
              grid: { color: document.documentElement.classList.contains('speakeasy-mode') ? 'rgba(255,255,255,0.12)' : '#E5DDD0' },
              angleLines: { color: document.documentElement.classList.contains('speakeasy-mode') ? 'rgba(255,255,255,0.12)' : '#E5DDD0' },
              pointLabels: { color: document.documentElement.classList.contains('speakeasy-mode') ? '#EAE2D6' : '#524C46', font: { size: 11 } }
            }
          },
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: document.documentElement.classList.contains('speakeasy-mode') ? '#EAE2D6' : '#524C46' } } }
        }
      });

      const metric = document.getElementById('barMetricSelect').value;
      const metricGet = l => {
        if (metric === 'abv') return l.general.abv;
        if (metric === 'kcal') return l.general.kcal;
        if (metric === 'sugar') return l.general.sugar;
        if (metric === 'priceNum') return l.general.priceNum;
        return l.overallScore;
      };
      const barCtx = document.getElementById('barChart').getContext('2d');
      barChartInst = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: chosen.map(l => l.shortName),
          datasets: [{
            label: document.getElementById('barMetricSelect').selectedOptions[0].text,
            data: chosen.map(metricGet),
            backgroundColor: chosen.map(l => l.accent),
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: document.documentElement.classList.contains('speakeasy-mode') ? 'rgba(255,255,255,0.10)' : '#EDE6DA' },
              ticks: { color: document.documentElement.classList.contains('speakeasy-mode') ? '#D6CCC0' : '#524C46' }
            },
            x: {
              grid: { display: false },
              ticks: { color: document.documentElement.classList.contains('speakeasy-mode') ? '#D6CCC0' : '#524C46' }
            }
          }
        }
      });
    }

    function renderHeadToHead(chosen) {
      const box = document.getElementById('headToHeadBox');
      if (chosen.length !== 2) {
        box.innerHTML = `<div class="text-xs text-[#6B655E] bg-[#FAF7F2] rounded-xl px-4 py-2.5 border border-[#EDE6DA]">Совет: оставьте выбранными ровно <b>2 напитка</b>, чтобы открыть режим прямой дуэли «1 на 1».</div>`;
        return;
      }
      const [a, b] = chosen;
      const rows = [
        ['Крепость', a.general.abv + '%', b.general.abv + '%'],
        ['Калорийность', a.general.kcal + ' ккал', b.general.kcal + ' ккал'],
        ['Сахар / 100 мл', (a.id === 'bols-cassis' ? '≥45 г' : a.general.sugar + ' г'), (b.id === 'bols-cassis' ? '≥45 г' : b.general.sugar + ' г')],
        ['Акция 0,7 л', a.general.priceNum.toLocaleString('ru-RU') + ' ₽', b.general.priceNum.toLocaleString('ru-RU') + ' ₽'],
        ['В чистом виде', a.ratings.neat.score + ' / 10', b.ratings.neat.score + ' / 10'],
        ['Для коктейлей', a.ratings.cocktails.score + ' / 10', b.ratings.cocktails.score + ' / 10'],
        ['Итоговый балл', a.overallScore.toFixed(2), b.overallScore.toFixed(2)]
      ];
      box.innerHTML = `
        <div class="rounded-2xl border border-[#E5DDD0] bg-[#FAF7F2] p-4 space-y-3">
          <div class="flex items-center justify-between text-xs uppercase tracking-wider font-semibold">
            <span style="color:${a.accent};">${a.name}</span>
            <span class="text-[#6B655E]">VS</span>
            <span style="color:${b.accent};">${b.name}</span>
          </div>
          <div class="divide-y divide-[#E5DDD0]">
            ${rows.map(([lbl, va, vb]) => `
              <div class="py-2 grid grid-cols-3 text-xs sm:text-sm items-center">
                <div class="font-semibold">${va}</div>
                <div class="text-center text-[#6B655E] text-[11px]">${lbl}</div>
                <div class="font-semibold text-right">${vb}</div>
              </div>`).join('')}
          </div>
        </div>`;
    }

    function renderCompareTable() {
      document.getElementById('compareTableHead').innerHTML = `
        <tr>
          ${COMPARE_COLS.map(c => `
            <th class="px-3 py-3 cursor-pointer hover:text-[#1A1816] select-none whitespace-nowrap" data-sort-col="${c.key}">
              ${c.label} ${state.sortCol === c.key ? (state.sortDir === 'desc' ? '↓' : '↑') : ''}
            </th>`).join('')}
        </tr>`;

      const pool = state.compareCat === "all" ? [...LIQUEURS] : LIQUEURS.filter(l => l.category === state.compareCat);
      const sorted = pool.sort((a, b) => {
        if (state.sortCol === 'name') {
          return state.sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        const col = COMPARE_COLS.find(c => c.key === state.sortCol);
        const va = col ? col.get(a) : a.overallScore;
        const vb = col ? col.get(b) : b.overallScore;
        return state.sortDir === 'asc' ? va - vb : vb - va;
      });

      document.getElementById('compareTableBody').innerHTML = sorted.map(l => `
        <tr class="hover:bg-[#FAF7F2] transition-colors">
          ${COMPARE_COLS.map(c => {
            if (c.key === 'name') {
              return `<td class="px-3 py-3 font-semibold whitespace-nowrap"><button type="button" data-open-detail="${l.id}" class="flex items-center gap-2 hover:underline text-left"><span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${l.accent};"></span>${l.shortName}</button></td>`;
            }
            const raw = c.get(l);
            const txt = c.fmt ? c.fmt(raw, l) : raw;
            return `<td class="px-3 py-3 whitespace-nowrap ${c.key === 'overall' ? 'font-bold text-[#1A1816]' : 'text-[#4A453F]'}">${txt}</td>`;
          }).join('')}
        </tr>`).join('');

      document.querySelectorAll('[data-sort-col]').forEach(th => {
        th.addEventListener('click', () => {
          const k = th.dataset.sortCol;
          if (state.sortCol === k) state.sortDir = state.sortDir === 'desc' ? 'asc' : 'desc';
          else { state.sortCol = k; state.sortDir = 'desc'; }
          renderCompareTable();
        });
      });
    }

    function renderRankings() {
      const awards = [
        { title: 'Лучший по вкусу', id: 'cointreau', score: '9,5 / 10', why: 'Кристальная чистота эфирных масел сладкого и горького апельсина без приторности.' },
        { title: 'Лучшая текила 100% агавы', id: 'espolon-blanco', score: '9,0 / 10', why: 'Эталонный баланс чистой голубой агавы, цитрусов и перца для Paloma и Margarita.' },
        { title: 'Лучший для коктейлей', id: 'cointreau', score: '10,0 / 10', why: 'Фундамент 500+ классических рецептов при 40% ABV (вместе с Absolut 9,5 и Espolòn 9,5).' },
        { title: 'Лучший в чистом виде', id: 'baileys', score: '9,5 / 10', why: 'Бархатистая сливочно-шоколадная гармония со льдом; среди крепких — Jägermeister (9,0) и Espolòn (8,5).' },
        { title: 'Лучший по цене и качеству', id: 'jim-beam-bourbon', score: '9,5 / 10', why: '4-летний кентуккийский бурбон от 1 400 ₽ за 0,7 л — делит первое место с Jägermeister (от 1 390 ₽).' },
        { title: 'Самый интересный профиль', id: 'jagermeister', score: '9,5 / 10 аромат', why: '56 растительных компонентов и дубовая выдержка; среди виски выделяется угольная мягкость Jack Daniel’s.' }
      ];

      document.getElementById('specialRankingsGrid').innerHTML = awards.map(a => {
        const l = getLiqueur(a.id);
        return `
          <div class="card-ed p-5 space-y-2 cursor-pointer" data-open-detail="${l.id}">
            <div class="text-[11px] uppercase tracking-[0.14em] text-[#6B655E]">${a.title}</div>
            <div class="flex items-center justify-between gap-2">
              <div class="font-serif-ed text-2xl font-semibold" style="color:${l.accent};">${l.shortName}</div>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E5DDD0] shrink-0">${a.score}</span>
            </div>
            <p class="text-xs text-[#524C46] leading-relaxed">${a.why}</p>
          </div>`;
      }).join('');

      const ranked = [...LIQUEURS].sort((a, b) => b.overallScore - a.overallScore);
      const reasons = {
        cointreau: 'Абсолютный лидер коллекции: максимум за коктейли (10,0), вкус (9,5) и универсальность (9,5).',
        'espolon-blanco': 'Лучший крепкий релиз (100% голубая агава): 9,5 за коктейли и 9,0 за вкус и аромат.',
        jagermeister: 'Эталонный травяной дижестив: 56 ботаникалов, минимум сахара среди ликёров и цена/качество 9,5.',
        'jack-daniels': 'Узнаваемый теннесси-виски с угольной фильтрацией: высокая универсальность (9,0) и коктейли (9,0).',
        'absolut-vodka': 'Чистейшая пшеничная база без сахара (0 г): универсальность 9,5, коктейли 9,5 и выгодная цена.',
        aperol: 'Безупречный низкоградусный аперитив (11% ABV) с высоким коктейльным потенциалом (9,0).',
        'jim-beam-bourbon': 'Надёжная 4-летняя бурбонная база (9,0 за универсальность и 9,5 за соотношение цены и качества).',
        baileys: 'Лучший напиток в чистом виде (9,5) и к десертам, но ограничен сливочной основой в миксологии.',
        'jim-beam-honey': 'Мягкий медовый бурбон (32,5%): отличный вариант для неспешной подачи со льдом (8,5).',
        'bols-triple-sec': 'Сильная барная 38%-я база (9,0 за коктейли), но уступает Cointreau в глубине и акционной цене.',
        'jim-beam-apple': 'Освежающий яблочно-бурбонный хайбол-формат (32,5%) с хорошим балансом цены и качества (8,5).',
        passoa: 'Яркая звезда Pornstar Martini с живой кислинкой маракуйи, но дороже аналогов в РФ (2 300 ₽).',
        'bols-cassis': 'Классический смородиновый модификатор для Kir Royale, но слишком сладок (≥45 г/100 мл) для соло.',
        'olmeca-gold': 'Доступная миксто-текила с карамельно-дубовым оттенком для вечеринок и шотов.',
        'olmeca-silver': 'Базовая недорогая миксто-текила для массовых коктейлей; проще по букету, чем 100% агава Espolòn.',
        'beefeater-gin': 'Эталонный лондонский сухой джин с ярким можжевельником и цитрусами — база для Negroni и Dry Martini.',
        'havana-club-3': 'Классический кубинский выдержанный белый ром (3 года) для аутентичных Daiquiri, Mojito и Cuba Libre.',
        'martini-rosso': 'Культовый итальянский сладкий вермут с травяной горчинкой — незаменимый партнёр в Negroni и Manhattan.',
        'campari': 'Знаковый рубиновый итальянский биттер с неповторимой горько-апельсиновой структурой для аперитивов.'
      };

      document.getElementById('overallRankingList').innerHTML = ranked.map((l, idx) => `
        <div class="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DA] flex flex-col sm:flex-row sm:items-center gap-3 justify-between cursor-pointer hover:border-[#1A1816] transition-colors" data-open-detail="${l.id}">
          <div class="flex items-center gap-3.5">
            <div class="w-9 h-9 rounded-full flex items-center justify-center font-serif-ed text-xl font-bold text-white shrink-0" style="background:${l.accent};">${idx + 1}</div>
            <div>
              <div class="font-semibold text-sm sm:text-base">${l.name}</div>
              <div class="text-xs text-[#524C46] mt-0.5">${reasons[l.id] || l.subtitle || ''}</div>
            </div>
          </div>
          <div class="flex items-center gap-3 sm:shrink-0 pl-12 sm:pl-0">
            <div class="w-28 h-2 rounded-full bg-[#E6DFD3] overflow-hidden">
              <div class="h-full rounded-full" style="width:${l.overallScore * 10}%; background:${l.accent};"></div>
            </div>
            <span class="font-serif-ed text-2xl font-bold w-12 text-right">${l.overallScore.toFixed(2)}</span>
          </div>
        </div>`).join('');
    }

    // ==================== COCKTAILS (79 + FILTERS) ====================
    function renderCocktails() {
      const fLiq = document.getElementById('fLiqueur').value;
      const fFlav = document.getElementById('fFlavor').value;
      const fStr = document.getElementById('fStrength').value;
      const fDiff = document.getElementById('fDifficulty').value;
      const fMeth = document.getElementById('fMethod').value;
      const fIng = document.getElementById('fIngredient').value.trim().toLowerCase();

      const filtered = COCKTAILS.filter(c => {
        if (state.onlyFavorites && typeof isCocktailFav === 'function' && !isCocktailFav(c.id)) return false;
        if (fLiq !== 'all') {
          if (fLiq === 'multi') { if (c.mainLiqueur !== 'multi') return false; }
          else if (!c.liqueurs.includes(fLiq)) return false;
        }
        if (fFlav !== 'all' && c.flavorTag !== fFlav) return false;
        if (fStr !== 'all' && c.strengthTag !== fStr) return false;
        if (fDiff !== 'all' && c.difficulty !== fDiff) return false;
        if (fMeth !== 'all' && c.method !== fMeth) return false;
        if (fIng) {
          const blob = (c.name + ' ' + c.flavor + ' ' + c.ingredients.map(i => i.name).join(' ')).toLowerCase();
          if (!blob.includes(fIng)) return false;
        }
        if (state.onlyMyBar && !evaluateCocktailForBar(c).canMakeNow) return false;
        return true;
      });

      document.getElementById('cocktailCountBadge').textContent = `Показано: ${filtered.length} из ${COCKTAILS.length}`;

      if (!filtered.length) {
        document.getElementById('cocktailsGrid').innerHTML = `
          <div class="col-span-full card-ed p-8 text-center space-y-2">
            <div class="font-serif-ed text-2xl font-semibold">Рецепты не найдены</div>
            <p class="text-xs text-[#6B655E]">Попробуйте ослабить один из фильтров или очистить поиск по ингредиенту.</p>
          </div>`;
        return;
      }

      const filterSig = [fLiq, fFlav, fStr, fDiff, fMeth, fIng, state.onlyMyBar, state.onlyFavorites].join('|');
      if (state._cockFilterSig !== filterSig) {
        state._cockFilterSig = filterSig;
        state._cockLimit = 24;
      }
      const limit = state._cockLimit || 24;
      const visible = filtered.slice(0, limit);
      const remaining = filtered.length - visible.length;

      const cardsHtml = visible.map(c => {
        const badgeColor = c.mainLiqueur === 'multi' ? '#1A1816' : getLiqueur(c.mainLiqueur).accent;
        const liqNames = c.liqueurs.map(id => getLiqueur(id).shortName).join(' + ');
        return `
          <article class="card-ed overflow-hidden flex flex-col cursor-pointer group" data-open-cocktail="${c.id}">
            <div class="relative aspect-[4/3] overflow-hidden bg-[#EFE9DF]">
              <img src="${c.img}" alt="${c.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
              <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white" style="background:${badgeColor};">${liqNames}</span>
              <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FAF7F2]/92 text-[#1A1816]">~${c.abv}% ABV</span>
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <div class="text-[10px] uppercase tracking-[0.14em] text-[#6B655E]">${c.status} · ${c.method}</div>
                  ${typeof renderCardJournalBadges === 'function' ? renderCardJournalBadges(c.id) : ''}
                </div>
                <h3 class="font-serif-ed text-2xl font-semibold mt-0.5 leading-tight">${c.name}</h3>
                <p class="text-xs text-[#6B655E] mt-1">${c.flavor}</p>
              </div>
              <div class="pt-2.5 border-t border-[#EDE6DA] flex items-center justify-between text-[11px] text-[#524C46]">
                <span>${c.glass} · ~${calcCocktailCostAndVolume(c, 1).perGlassCost} ₽</span>
                <span class="font-medium text-[#1A1816]">Рецепт и расчёт →</span>
              </div>
            </div>
          </article>`;
      }).join('');

      const loadMoreHtml = remaining > 0 ? `
        <div class="col-span-full flex justify-center pt-2">
          <button type="button" id="loadMoreCocktailsBtn" class="px-6 py-3 rounded-full bg-[#1A1816] text-[#FAF7F2] text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity">
            Показать ещё (${Math.min(24, remaining)} из ${remaining})
          </button>
        </div>` : '';

      document.getElementById('cocktailsGrid').innerHTML = cardsHtml + loadMoreHtml;
      const moreBtn = document.getElementById('loadMoreCocktailsBtn');
      if (moreBtn) {
        moreBtn.addEventListener('click', () => {
          state._cockLimit = (state._cockLimit || 24) + 24;
          renderCocktails();
        });
      }
    }

    function openCocktailModal(id, opts = {}) {
      const c = COCKTAILS.find(x => x.id === id);
      if (!c) return;
      currentModalCocktailId = c.id;
      const modal = document.getElementById('cocktailModal');
      renderCocktailModalContent(c, 1);
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      if (!opts.skipHash) {
        updateUrlHash('#cocktail/' + c.id);
      }
    }

    function closeCocktailModal(opts = {}) {
      const modal = document.getElementById('cocktailModal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      const wasOpen = !!currentModalCocktailId;
      currentModalCocktailId = null;
      if (wasOpen && !opts.skipHash && window.location.hash.startsWith('#cocktail/')) {
        const backHash = state.view === 'detail' && state.detailId ? '#liqueur/' + state.detailId : '#' + (state.view || 'cocktails');
        updateUrlHash(backHash);
      }
    }

    // ==================== PRICES VLADIVOSTOK ====================
    function renderPriceCell(storeName, cell) {
      let badge = '';
      if (cell.status === 'available') {
        badge = `<span class="text-[10px] px-2 py-0.5 rounded-full bg-[#EEF6F2] text-[#1B4D3E] font-medium">В каталоге</span>`;
      } else if (cell.status === 'hidden') {
        badge = `<span class="text-[10px] px-2 py-0.5 rounded-full bg-[#FBF5E6] text-[#855A0C] font-medium">Цена скрыта онлайн</span>`;
      } else {
        badge = `<span class="text-[10px] px-2 py-0.5 rounded-full bg-[#F2ECE1] text-[#6B655E] font-medium">Нет в каталоге</span>`;
      }
      return `
        <div class="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DA] flex flex-col justify-between gap-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold">${storeName}</span>
            ${badge}
          </div>
          <div>
            ${cell.price
              ? `<div class="font-serif-ed text-2xl font-bold text-[#1A1816]">${cell.price}</div>
                 <div class="text-[11px] text-[#6B655E]">Баз. ${cell.basePrice} · ${cell.volume}</div>`
              : `<div class="text-xs font-medium text-[#524C46]">${cell.statusText}</div>
                 <div class="text-[11px] text-[#6B655E]">Объём: ${cell.volume}</div>`
            }
          </div>
          <p class="text-[11px] text-[#6B655E] leading-snug">${cell.note}</p>
          ${cell.url ? `<a href="${cell.url}" target="_blank" rel="noopener" class="text-[11px] font-medium underline underline-offset-2 text-[#1A1816]">Открыть товар на сайте ↗</a>` : ''}
        </div>`;
    }

    function renderPrices() {
      const f = state.storeFilter;
      const filteredPrices = PRICES_DATA.filter(row => {
        if (state.priceCat === 'all') return true;
        const l = getLiqueur(row.liqueurId);
        return l && l.category === state.priceCat;
      });
      document.getElementById('pricesContainer').innerHTML = filteredPrices.map(row => {
        const l = getLiqueur(row.liqueurId);
        const cells = [];
        if (f === 'all' || f === 'winelab') cells.push(renderPriceCell('ВинЛаб', row.winelab));
        if (f === 'all' || f === 'kb') cells.push(renderPriceCell('Красное и Белое', row.kb));
        if (f === 'all' || f === 'bristol') cells.push(renderPriceCell('Бристоль', row.bristol));
        return `
          <div class="card-ed p-4 sm:p-5 space-y-3.5">
            <div class="flex items-center justify-between gap-2">
              <button type="button" data-open-detail="${l.id}" class="flex items-center gap-2.5 text-left group">
                <span class="w-3 h-3 rounded-full" style="background:${l.accent};"></span>
                <span class="font-serif-ed text-2xl font-semibold group-hover:underline">${row.name}</span>
              </button>
              <span class="text-[11px] text-[#6B655E]">${row.checkedDate || PRICE_CHECK_DATE}</span>
            </div>
            <div class="grid ${f === 'all' ? 'md:grid-cols-3' : 'grid-cols-1'} gap-3">
              ${cells.join('')}
            </div>
          </div>`;
      }).join('');
    }

    // ==================== GUIDE RECOMMENDER ====================
    const GUIDE_TASKS = {
      cocktails: {
        pick: 'cointreau',
        alt: 'bols-triple-sec',
        headline: 'Ваш выбор №1 — Cointreau L’Unique',
        text: 'Если вы хотите готовить дома настоящие Margarita, Cosmopolitan, Sidecar и White Lady, Cointreau незаменим благодаря 40% крепости и чистейшему апельсиновому маслу. Bols Triple Sec (38%) — достойная альтернатива, но берите его только если найдёте дешевле Cointreau.'
      },
      aperitif: {
        pick: 'aperol',
        alt: 'bols-cassis',
        headline: 'Ваш выбор №1 — Aperol (или Bols Crème de Cassis для Kir Royale)',
        text: 'Aperol (11% ABV) идеален перед ужином или для дневных встреч — 2 части Aperol, 3 части Prosecco и сплеш содовой. Для более ягодного и элегантного французского аперитива возьмите Bols Crème de Cassis к сухому шампанскому.'
      },
      dessert: {
        pick: 'baileys',
        alt: 'cointreau',
        headline: 'Ваш выбор №1 — Baileys Original Irish Cream',
        text: 'Безоговорочный лидер для десертов, эспрессо, мороженого и неспешного вечера со льдом. Мягкие 17% ABV, свежие ирландские сливки и какао-ванильный шлейф.'
      },
      digestif: {
        pick: 'jagermeister',
        alt: 'cointreau',
        headline: 'Ваш выбор №1 — Jägermeister Original',
        text: '56 растительных компонентов, выдержка в дубе и минимальный сахар (13,2 г/100 мл) делают его идеальным дижестивом после сытного ужина и лучшим ледяным шотом (-18 °C).'
      },
      party: {
        pick: 'passoa',
        alt: 'jagermeister',
        headline: 'Ваш выбор №1 — Passoã Passion Fruit',
        text: 'Мгновенно превращает домашнюю вечеринку в коктейльный бар: Pornstar Martini и Passion Spritz любят почти все за яркую маракуйю, рубиновый цвет и живую кислинку.'
      }
    };

    function renderGuideTask(taskKey) {
      state.guideTask = taskKey;
      document.querySelectorAll('.guide-task-btn').forEach(b => {
        const active = b.dataset.task === taskKey;
        b.classList.toggle('bg-[#1A1816]', active);
        b.classList.toggle('text-white', active);
        b.classList.toggle('bg-[#F2ECE1]', !active);
        b.classList.toggle('text-[#1A1816]', !active);
      });
      const g = GUIDE_TASKS[taskKey];
      const l = getLiqueur(g.pick);
      document.getElementById('guideTaskResult').innerHTML = `
        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <img loading="lazy" decoding="async" src="${l.img}" alt="${l.name}" class="w-full sm:w-36 aspect-[4/3] rounded-xl object-cover shrink-0" />
          <div class="space-y-2">
            <h4 class="font-serif-ed text-2xl font-semibold" style="color:${l.accent};">${g.headline}</h4>
            <p class="text-xs sm:text-sm text-[#4A453F] leading-relaxed">${g.text}</p>
            <button type="button" data-open-detail="${l.id}" class="text-xs font-semibold underline underline-offset-4">Открыть полный обзор ${l.shortName} →</button>
          </div>
        </div>`;
    }

    // ==================== LIGHTBOX & SCROLL REVEAL ====================
    function openLightbox(src, caption) {
      document.getElementById('lightboxImg').src = src;
      document.getElementById('lightboxCaption').textContent = caption || '';
      const m = document.getElementById('lightboxModal');
      m.classList.remove('hidden');
      m.classList.add('flex');
      if (window.__LENIS__) window.__LENIS__.stop();
    }
    function closeLightbox() {
      const m = document.getElementById('lightboxModal');
      if (!m) return;
      m.classList.add('hidden');
      m.classList.remove('flex');
      if (window.__LENIS__) window.__LENIS__.start();
    }

    let revealObserver = null;
    function setupReveals() {
      if (revealObserver) revealObserver.disconnect();
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
      }, { threshold: 0.08 });
      document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
    }
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeCocktailModal();
        closeLightbox();
      }
    });

        
