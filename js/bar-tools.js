// ==================== LIQUEUR & SPIRITS ATLAS — BAR TOOLS, FX & STAGE 5–7 (js/bar-tools.js) ====================
// ==================== STAGE 1 + 3: MY HOME BAR (МОЙ БАР · 15 НАПИТКОВ) ====================
    const BAR_STORAGE_KEY = 'liqueur_atlas_mybar_v2';

    const BAR_PANTRY_GROUPS = [
      {
        title: 'Дополнительная крепкая база',
        items: [
          { id: 'gin', label: 'Джин', match: ['джин'] },
          { id: 'rum', label: 'Ром (белый / пряный / кокосовый)', match: ['ром'] },
          { id: 'cognac', label: 'Коньяк', match: ['коньяк'] },
          { id: 'kahlua', label: 'Кофейный ликёр (Kahlúa)', match: ['кофейный ликёр', 'kahlúa'] },
          { id: 'tequila', label: 'Другая текила', match: ['текила'] },
          { id: 'vodka', label: 'Другая водка', match: ['водка'] },
          { id: 'whiskey', label: 'Другой виски / бурбон', match: ['виски', 'бурбон'] }
        ]
      },
      {
        title: 'Игристое, вино и миксеры',
        items: [
          { id: 'prosecco', label: 'Просекко / Шампанское', match: ['просекко', 'prosecco', 'шампанское', 'брют'] },
          { id: 'white_wine', label: 'Белое сухое вино', match: ['белое вино'] },
          { id: 'vermouth', label: 'Вермут / Lillet', match: ['вермут', 'lillet'] },
          { id: 'soda', label: 'Содовая (газировка)', match: ['содовая', 'газированная вода'] },
          { id: 'tonic', label: 'Тоник', match: ['тоник'] },
          { id: 'ginger_beer', label: 'Имбирное пиво / эль', match: ['имбирное пиво', 'имбирный эль'] },
          { id: 'cola', label: 'Кола', match: ['кола'] }
        ]
      },
      {
        title: 'Свежие ингредиенты и кофе',
        items: [
          { id: 'lime', label: 'Лайм', match: ['лайм'] },
          { id: 'lemon', label: 'Лимон', match: ['лимон'] },
          { id: 'espresso', label: 'Эспрессо / Кофе', match: ['эспрессо'] },
          { id: 'mint', label: 'Свежая мята', match: ['мята'] },
          { id: 'syrup', label: 'Сахарный / ванильный / агавовый сироп', match: ['сироп'] },
          { id: 'juices', label: 'Соки и пюре (клюква, апельсин, ананас, грейпфрут, яблоко, маракуйя)', match: ['клюквенный', 'апельсиновый сок', 'ананасовый', 'грейпфрут', 'яблочный', 'пюре маракуйи'] },
          { id: 'cream_ice', label: 'Сливки / пломбир', match: ['сливки', 'пломбир'] }
        ]
      }
    ];

    const ALL_PANTRY_ITEMS = BAR_PANTRY_GROUPS.flatMap(g => g.items);

    const LIQUEUR_MATCH_MAP = {
      cointreau: ['cointreau'],
      baileys: ['baileys'],
      passoa: ['passoã', 'passoa'],
      aperol: ['aperol'],
      jagermeister: ['jägermeister', 'jagermeister'],
      'bols-triple-sec': ['bols triple sec'],
      'bols-cassis': ['bols crème de cassis', 'crème de cassis'],
      'olmeca-silver': ['olmeca silver', 'olmeca blanco'],
      'olmeca-gold': ['olmeca gold'],
      'espolon-blanco': ['espolòn', 'espolon'],
      'absolut-vodka': ['absolut'],
      'jim-beam-bourbon': ['jim beam white', 'jim beam original', 'jim beam bourbon'],
      'jim-beam-apple': ['jim beam apple'],
      'jim-beam-honey': ['jim beam honey'],
      'jack-daniels': ['jack daniel'],
      'beefeater-gin': ['beefeater', 'джин'],
      'havana-club-3': ['havana club', 'ром'],
      'martini-rosso': ['martini rosso', 'красный вермут', 'сладкий вермут'],
      'campari': ['campari', 'кампари']
    };

    function loadMyBarState() {
      const defaults = {
        liqueurs: ['jagermeister', 'cointreau', 'aperol', 'olmeca-silver', 'jack-daniels'],
        pantry: ['lime', 'lemon', 'soda', 'tonic', 'prosecco', 'syrup', 'cola']
      };
      try {
        const raw = localStorage.getItem(BAR_STORAGE_KEY) || localStorage.getItem('liqueur_atlas_mybar_v1');
        if (!raw) return defaults;
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.liqueurs) && Array.isArray(parsed.pantry)) {
          return parsed;
        }
      } catch (e) { /* sandbox storage fallback */ }
      return defaults;
    }

    function saveMyBarState() {
      try {
        localStorage.setItem(BAR_STORAGE_KEY, JSON.stringify(state.myBar));
      } catch (e) { /* ignore */ }
    }

    function hasCategorySpiritInBar(ownedLiq, category) {
      return LIQUEURS.some(l => l.category === category && ownedLiq.has(l.id));
    }

    function evaluateCocktailForBar(c) {
      const ownedLiq = new Set(state.myBar.liqueurs);
      const ownedPantry = new Set(state.myBar.pantry);
      const missing = [];

      const hasTequila = ownedPantry.has('tequila') || hasCategorySpiritInBar(ownedLiq, 'tequila');
      const hasVodka = ownedPantry.has('vodka') || hasCategorySpiritInBar(ownedLiq, 'vodka');
      const hasWhiskey = ownedPantry.has('whiskey') || ownedLiq.has('jim-beam-bourbon') || ownedLiq.has('jack-daniels');

      for (const ing of c.ingredients) {
        const low = ing.name.toLowerCase();
        if (low.includes('лёд') || low.includes('опц') || low.includes('белок') || low.includes('биттер') || low.includes('цедра') || low.includes('абсент') || low.includes('соль') || low.includes('корица')) {
          continue;
        }

        // 1. Check specific bottle from our 15-bottle atlas
        let matchedLiqueurKey = null;
        for (const [k, kws] of Object.entries(LIQUEUR_MATCH_MAP)) {
          if (kws.some(kw => low.includes(kw))) {
            matchedLiqueurKey = k;
            break;
          }
        }
        if (matchedLiqueurKey) {
          if (low.includes('cointreau') && low.includes('bols triple sec')) {
            if (!ownedLiq.has('cointreau') && !ownedLiq.has('bols-triple-sec')) {
              missing.push('Cointreau или Bols Triple Sec');
            }
          } else if (!ownedLiq.has(matchedLiqueurKey)) {
            missing.push(getLiqueur(matchedLiqueurKey).shortName);
          }
          continue;
        }

        // 2. Check generic tequila / vodka / whiskey satisfied by atlas bottles OR pantry
        if (low.includes('текила')) {
          if (!hasTequila) missing.push(ing.name.split('(')[0].trim());
          continue;
        }
        if (low.includes('водка')) {
          if (!hasVodka) missing.push(ing.name.split('(')[0].trim());
          continue;
        }
        if (low.includes('виски') || low.includes('бурбон')) {
          if (!hasWhiskey) missing.push(ing.name.split('(')[0].trim());
          continue;
        }

        // 3. Check remaining pantry items
        let matchedPantry = null;
        for (const p of ALL_PANTRY_ITEMS) {
          if (p.match.some(kw => low.includes(kw))) {
            matchedPantry = p;
            break;
          }
        }
        if (matchedPantry) {
          if (!ownedPantry.has(matchedPantry.id)) {
            missing.push(ing.name.split('(')[0].trim());
          }
        } else {
          missing.push(ing.name.split('(')[0].trim());
        }
      }

      return { missing, canMakeNow: missing.length === 0, almostReady: missing.length === 1 };
    }

    function renderMyBar() {
      const ownedLiq = new Set(state.myBar.liqueurs);
      const ownedPantry = new Set(state.myBar.pantry);
      const totalBottles = LIQUEURS.length;

      const badge = document.getElementById('myBarHeaderCount');
      if (badge) badge.textContent = `${ownedLiq.size}/${totalBottles}`;
      if (typeof renderMyBarShelf === 'function') renderMyBarShelf(ownedLiq);

      // 1. Bottles selector grouped by category
      const liqBox = document.getElementById('myBarLiqueursGrid');
      if (liqBox) {
        const groups = [
          { cat: 'liqueur', label: 'Ликёры (7)' },
          { cat: 'tequila', label: 'Текила (3)' },
          { cat: 'vodka', label: 'Водка (1)' },
          { cat: 'whiskey', label: 'Виски и Бурбон (4)' },
          { cat: 'gin', label: 'Джин (1)' },
          { cat: 'rum', label: 'Ром (1)' },
          { cat: 'aperitif', label: 'Вермут и Биттер (2)' }
        ];
        liqBox.className = 'space-y-4';
        liqBox.innerHTML = groups.map(g => {
          const items = LIQUEURS.filter(l => l.category === g.cat);
          return `
            <div class="space-y-2">
              <div class="text-[11px] uppercase tracking-[0.14em] text-[#6B655E] font-medium">${g.label}</div>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                ${items.map(l => {
                  const has = ownedLiq.has(l.id);
                  return `
                    <button type="button" data-bar-liq="${l.id}" class="p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${has ? 'bg-white shadow-sm' : 'bg-[#FAF7F2] border-[#E5DDD0] opacity-75 hover:opacity-100'}" style="${has ? `border-color:${l.accent}; box-shadow:0 0 0 1px ${l.accent};` : ''}">
                      <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${has ? 'text-white' : 'bg-[#E5DDD0] text-[#6B655E]'}" style="${has ? `background:${l.accent};` : ''}">
                        ${has ? '✓' : '+'}
                      </span>
                      <div class="min-w-0">
                        <div class="font-semibold text-xs sm:text-sm truncate">${l.shortName}</div>
                        <div class="text-[10px] text-[#6B655E] truncate">${l.general.abv}% · ${has ? 'В баре' : 'Нет дома'}</div>
                      </div>
                    </button>`;
                }).join('')}
              </div>
            </div>`;
        }).join('');
      }

      // 2. Pantry selector
      const pantryBox = document.getElementById('myBarPantryBox');
      if (pantryBox) {
        pantryBox.innerHTML = BAR_PANTRY_GROUPS.map(grp => `
          <div class="space-y-2">
            <div class="text-[11px] uppercase tracking-[0.14em] text-[#6B655E] font-medium">${grp.title}</div>
            <div class="flex flex-wrap gap-2">
              ${grp.items.map(item => {
                const has = ownedPantry.has(item.id);
                return `
                  <button type="button" data-bar-pantry="${item.id}" class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${has ? 'bg-[#1A1816] text-white border-[#1A1816]' : 'bg-white text-[#524C46] border-[#D7CEC0] hover:border-[#1A1816]'}">
                    ${has ? '✓ ' : '+ '}${item.label}
                  </button>`;
              }).join('')}
            </div>
          </div>`).join('');
      }

      // 3. Evaluate all cocktails
      const evaluated = COCKTAILS.map(c => ({ c, eval: evaluateCocktailForBar(c) }));
      const readyNow = evaluated.filter(x => x.eval.canMakeNow);
      const almost = evaluated.filter(x => x.eval.almostReady);
      if (typeof renderSmartShoppingList === 'function') renderSmartShoppingList(almost);

      const summaryEl = document.getElementById('myBarSummaryStats');
      if (summaryEl) {
        summaryEl.innerHTML = `
          <div class="p-3.5 rounded-2xl bg-[#EEF6F2] border border-[#C6E0D3]">
            <div class="text-[10px] uppercase tracking-wider text-[#1B4D3E]">Можно сделать сейчас</div>
            <div class="font-serif-ed text-3xl font-bold text-[#1B4D3E] mt-0.5">${readyNow.length}</div>
          </div>
          <div class="p-3.5 rounded-2xl bg-[#FBF5E6] border border-[#E7D3A3]">
            <div class="text-[10px] uppercase tracking-wider text-[#855A0C]">Не хватает 1 ингредиента</div>
            <div class="font-serif-ed text-3xl font-bold text-[#855A0C] mt-0.5">${almost.length}</div>
          </div>
          <div class="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD0]">
            <div class="text-[10px] uppercase tracking-wider text-[#6B655E]">В вашем баре</div>
            <div class="font-serif-ed text-3xl font-bold text-[#1A1816] mt-0.5">${ownedLiq.size} / ${totalBottles}</div>
          </div>`;
      }

      const readyGrid = document.getElementById('myBarReadyGrid');
      if (readyGrid) {
        if (!readyNow.length) {
          readyGrid.innerHTML = `<div class="col-span-full p-6 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD0] text-center text-xs text-[#6B655E]">Пока нет полных совпадений — отметьте хотя бы 1–2 бутылки и базовые миксеры (содовая, лайм, просекко, кола).</div>`;
        } else {
          readyGrid.innerHTML = readyNow.map(({ c }) => `
            <article class="card-ed p-4 flex items-center gap-3.5 cursor-pointer hover:border-[#1B4D3E]" data-open-cocktail="${c.id}">
              <img loading="lazy" decoding="async" src="${c.img}" alt="${c.name}" class="w-16 h-16 rounded-xl object-cover shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="text-[10px] font-semibold text-[#1B4D3E] uppercase">✓ Все ингредиенты есть</div>
                <div class="font-serif-ed text-xl font-semibold truncate">${c.name}</div>
                <div class="text-[11px] text-[#6B655E] truncate">${c.method} · ~${c.abv}% ABV · ${c.glass}</div>
              </div>
              <span class="text-xs font-semibold text-[#1A1816] shrink-0">→</span>
            </article>`).join('');
        }
      }

      const almostGrid = document.getElementById('myBarAlmostGrid');
      if (almostGrid) {
        if (!almost.length) {
          almostGrid.innerHTML = `<div class="col-span-full p-5 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD0] text-center text-xs text-[#6B655E]">Нет коктейлей с нехваткой ровно одного ингредиента.</div>`;
        } else {
          almostGrid.innerHTML = almost.map(({ c, eval: ev }) => `
            <article class="card-ed p-4 flex items-center gap-3.5 cursor-pointer hover:border-[#C48A1C]" data-open-cocktail="${c.id}">
              <img loading="lazy" decoding="async" src="${c.img}" alt="${c.name}" class="w-16 h-16 rounded-xl object-cover shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="text-[10px] font-semibold text-[#9A5B13]">+ Докупить: ${ev.missing[0]}</div>
                <div class="font-serif-ed text-xl font-semibold truncate">${c.name}</div>
                <div class="text-[11px] text-[#6B655E] truncate">${c.method} · ~${c.abv}% ABV</div>
              </div>
              <span class="text-xs font-semibold text-[#1A1816] shrink-0">→</span>
            </article>`).join('');
        }
      }
    }


        // ==================== STAGE 2 + 3: QUICK MOOD PICKER (15 НАПИТКОВ) ====================
    const PICKER_STEPS = [
      {
        key: 'mood',
        title: 'Какое сегодня настроение?',
        subtitle: 'Шаг 1 из 3 · Выберите формат вечера',
        options: [
          { value: 'aperitif', icon: 'sun', label: 'Лёгкий аперитив', desc: 'Перед ужином, на террасе или для долгой беседы' },
          { value: 'party', icon: 'sparkles', label: 'Вечеринка и коктейли', desc: 'Яркие миксы в шейкере, текила и эффектная подача' },
          { value: 'cozy', icon: 'coffee', label: 'Уют, кофе и десерт', desc: 'Мягко, бархатно, к сладкому или со льдом' },
          { value: 'digestif', icon: 'flame', label: 'Дижестив / Характер', desc: 'После ужина, виски на камнях, сложные травы или шот' }
        ]
      },
      {
        key: 'flavor',
        title: 'Какой вкус сейчас ближе?',
        subtitle: 'Шаг 2 из 3 · Выберите доминирующую ноту',
        options: [
          { value: 'citrus', icon: 'citrus', label: 'Свежий цитрус и яблоко', desc: 'Апельсиновая цедра, лайм или хрустящее зелёное яблоко' },
          { value: 'fruity', icon: 'cherry', label: 'Тропики, ягоды и мёд', desc: 'Маракуйя, чёрная смородина или цветочный мёд с бурбоном' },
          { value: 'bitter', icon: 'leaf', label: 'Горечь и травы', desc: 'Итальянский биттер или 56 пряных ботаникалов' },
          { value: 'creamy', icon: 'cup-soda', label: 'Сливки и шоколад', desc: 'Какао, ваниль, карамель и нежная текстура' },
          { value: 'spirits', icon: 'flame', label: 'Агава, дуб и чистое зерно', desc: 'Мексиканская текила, бурбон, теннесси-виски или водка' }
        ]
      },
      {
        key: 'strength',
        title: 'Какая крепость комфортнее?',
        subtitle: 'Шаг 3 из 3 · Последний штрих',
        options: [
          { value: 'light', icon: 'feather', label: 'Лёгкий (до 12% ABV)', desc: 'Спритцы с просекко, тоником или содовой' },
          { value: 'medium', icon: 'gauge', label: 'Средний (13–20% ABV)', desc: 'Сбалансированная классика в коктейльном бокале' },
          { value: 'strong', icon: 'zap', label: 'Крепкий (20%+) или соло', desc: 'Выраженная структура, рокс со льдом или чистый шот' }
        ]
      }
    ];

    function scoreLiqueurForPicker(l, ans) {
      let s = 38;
      const moodMap = {
        aperitif: { aperol: 34, 'bols-cassis': 26, cointreau: 18, passoa: 16, 'jim-beam-apple': 22, 'espolon-blanco': 16 },
        party: { passoa: 30, cointreau: 28, 'olmeca-silver': 34, 'olmeca-gold': 30, 'espolon-blanco': 30, 'absolut-vodka': 32, 'bols-triple-sec': 24, jagermeister: 24, 'jim-beam-apple': 24 },
        cozy: { baileys: 38, 'jim-beam-honey': 34, 'jack-daniels': 26, 'jim-beam-bourbon': 24, cointreau: 18, 'bols-cassis': 16 },
        digestif: { jagermeister: 38, 'jack-daniels': 34, 'jim-beam-bourbon': 32, 'espolon-blanco': 26, 'jim-beam-honey': 22, cointreau: 20, baileys: 16 }
      };
      const flavMap = {
        citrus: { cointreau: 36, 'bols-triple-sec': 32, 'jim-beam-apple': 34, aperol: 18, 'espolon-blanco': 16 },
        fruity: { passoa: 36, 'bols-cassis': 34, 'jim-beam-honey': 30, 'jim-beam-apple': 26 },
        bitter: { jagermeister: 36, aperol: 34 },
        creamy: { baileys: 40, 'jim-beam-honey': 22 },
        spirits: { 'espolon-blanco': 38, 'jack-daniels': 38, 'jim-beam-bourbon': 36, 'absolut-vodka': 35, 'olmeca-silver': 33, 'olmeca-gold': 32 }
      };
      const strMap = {
        light: { aperol: 26, passoa: 20, 'bols-cassis': 20, 'jim-beam-apple': 18, baileys: 16 },
        medium: { cointreau: 22, passoa: 22, baileys: 22, 'bols-triple-sec': 20, 'absolut-vodka': 20, 'olmeca-silver': 20, 'jim-beam-apple': 20, 'jim-beam-honey': 20, aperol: 18 },
        strong: { 'jack-daniels': 26, 'jim-beam-bourbon': 26, 'espolon-blanco': 26, cointreau: 24, jagermeister: 24, 'absolut-vodka': 22, 'olmeca-gold': 22, 'olmeca-silver': 20, 'jim-beam-honey': 18 }
      };
      s += (moodMap[ans.mood] && moodMap[ans.mood][l.id]) || 0;
      s += (flavMap[ans.flavor] && flavMap[ans.flavor][l.id]) || 0;
      s += (strMap[ans.strength] && strMap[ans.strength][l.id]) || 0;
      return Math.min(99, s);
    }

    function pickBestCocktails(liqueurId, ans) {
      let pool = COCKTAILS.filter(c => c.liqueurs.includes(liqueurId));
      // Fallback for new spirits before Stage 4 adds their 40 dedicated cocktails
      if (!pool.length) {
        const l = getLiqueur(liqueurId);
        const catKw = { tequila: 'текила', vodka: 'водка', whiskey: 'виски' }[l.category];
        if (catKw) {
          pool = COCKTAILS.filter(c => c.ingredients.some(i => i.name.toLowerCase().includes(catKw) || (l.category === 'whiskey' && i.name.toLowerCase().includes('бурбон'))));
        }
        if (!pool.length) pool = COCKTAILS.slice(0, 6);
      }
      const scored = pool.map(c => {
        let sc = 0;
        if (c.strengthTag === ans.strength) sc += 30;
        if (c.flavorTag === ans.flavor) sc += 25;
        if (ans.flavor === 'bitter' && (c.flavorTag === 'bitter' || c.flavorTag === 'herbal')) sc += 22;
        if (evaluateCocktailForBar(c).canMakeNow) sc += 15;
        return { c, sc };
      }).sort((a, b) => b.sc - a.sc);
      return scored.slice(0, 2).map(x => x.c);
    }

function renderQuickPicker() {
      const box = document.getElementById('quickPickerWidget');
      if (!box) return;
      const p = state.picker;

      if (p.step < 3) {
        const cur = PICKER_STEPS[p.step];
        box.innerHTML = `
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-[11px] uppercase tracking-[0.16em] text-[#6B655E]">${cur.subtitle}</div>
                <h3 class="font-serif-ed text-2xl sm:text-3xl font-semibold mt-0.5">${cur.title}</h3>
              </div>
              <button type="button" id="pickerRandomBtn" class="px-3 py-1.5 rounded-full bg-[#F2ECE1] hover:bg-[#1A1816] hover:text-white text-xs font-medium transition-colors shrink-0">
                🎲 Удиви меня
              </button>
            </div>
            <!-- Progress bar -->
            <div class="grid grid-cols-3 gap-1.5">
              ${[0, 1, 2].map(i => `<div class="h-1.5 rounded-full transition-all ${i <= p.step ? 'bg-[#1A1816]' : 'bg-[#E5DDD0]'}"></div>`).join('')}
            </div>
            <!-- Options -->
            <div class="grid sm:grid-cols-2 gap-3 pt-1">
              ${cur.options.map(opt => `
                <button type="button" data-pick-opt="${opt.value}" class="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD0] hover:border-[#1A1816] hover:bg-white text-left transition-all group">
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-semibold text-sm text-[#1A1816]">${opt.label}</span>
                    <span class="text-xs text-[#6B655E] group-hover:text-[#1A1816]">→</span>
                  </div>
                  <p class="text-xs text-[#6B655E] mt-1 leading-relaxed">${opt.desc}</p>
                </button>`).join('')}
            </div>
            ${p.step > 0 ? `<button type="button" id="pickerBackBtn" class="text-xs text-[#6B655E] hover:text-[#1A1816] underline underline-offset-4">← Назад к предыдущему шагу</button>` : ''}
          </div>`;
      } else {
        // Compute result
        const ranked = LIQUEURS.map(l => ({ l, score: scoreLiqueurForPicker(l, p.answers) })).sort((a, b) => b.score - a.score);
        const winner = p.forcedIdx != null ? ranked[p.forcedIdx % ranked.length] : ranked[0];
        const l = winner.l;
        const cocktails = pickBestCocktails(l.id, p.answers);
        const inMyBar = state.myBar.liqueurs.includes(l.id);

        box.innerHTML = `
          <div class="space-y-5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white" style="background:${l.accent};">
                <span>Совпадение ${winner.score}%</span>
                ${inMyBar ? '<span>· Есть в вашем баре ✓</span>' : ''}
              </div>
              <div class="flex gap-2">
                <button type="button" id="pickerNextAltBtn" class="px-3 py-1.5 rounded-full bg-[#F2ECE1] hover:bg-[#E5DDD0] text-xs font-medium">Другой вариант ↻</button>
                <button type="button" id="pickerRestartBtn" class="px-3 py-1.5 rounded-full border border-[#D7CEC0] hover:border-[#1A1816] text-xs font-medium">Пройти заново</button>
              </div>
            </div>

            <div class="grid md:grid-cols-12 gap-4 items-center p-4 sm:p-5 rounded-2xl border" data-soft-bg="1" style="background:${l.accentSoft}; border-color:${l.accent}33;">
              <img loading="lazy" decoding="async" src="${l.img}" alt="${l.name}" class="md:col-span-5 w-full aspect-[4/3] rounded-xl object-cover" />
              <div class="md:col-span-7 space-y-2.5">
                <div class="text-[11px] uppercase tracking-[0.14em]" style="color:${l.accentDark};">Идеальный выбор на сегодня</div>
                <h3 class="font-serif-ed text-3xl sm:text-4xl font-semibold">${l.name}</h3>
                <p class="text-xs sm:text-sm text-[#4A453F] leading-relaxed">${l.taste.mainProfile}</p>
                <div class="text-xs text-[#524C46]"><b>Подача:</b> ${l.serving.temp} · ${l.general.abv}% ABV · от ${l.general.priceNum.toLocaleString('ru-RU')} ₽</div>
                <div class="flex flex-wrap gap-2 pt-1">
                  <button type="button" data-open-detail="${l.id}" class="px-4 py-2 rounded-full text-xs font-medium text-white" style="background:${l.accent};">Открыть 3D и обзор →</button>
                  <button type="button" data-nav="prices" class="px-4 py-2 rounded-full text-xs font-medium bg-white border border-[#D7CEC0]">Цены во Владивостоке</button>
                </div>
              </div>
            </div>

            <div class="space-y-2.5">
              <div class="text-xs uppercase tracking-[0.14em] text-[#6B655E] font-semibold">2 лучших коктейля под ваш запрос</div>
              <div class="grid sm:grid-cols-2 gap-3">
                ${cocktails.map(c => {
                  const canNow = evaluateCocktailForBar(c).canMakeNow;
                  return `
                    <article class="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD0] hover:border-[#1A1816] flex items-center gap-3 cursor-pointer transition-colors" data-open-cocktail="${c.id}">
                      <img loading="lazy" decoding="async" src="${c.img}" alt="${c.name}" class="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div class="min-w-0 flex-1">
                        <div class="text-[10px] font-semibold ${canNow ? 'text-[#1B4D3E]' : 'text-[#6B655E]'}">${canNow ? '✓ Можно сделать из вашего бара' : c.method + ' · ~' + c.abv + '% ABV'}</div>
                        <div class="font-serif-ed text-xl font-semibold truncate">${c.name}</div>
                        <div class="text-[11px] text-[#6B655E] truncate">${c.flavor}</div>
                      </div>
                      <span class="text-xs font-semibold">→</span>
                    </article>`;
                }).join('')}
              </div>
            </div>
          </div>`;
      }

      // Wire dynamic buttons
      box.querySelectorAll('[data-pick-opt]').forEach(btn => {
        btn.addEventListener('click', () => {
          const curKey = PICKER_STEPS[state.picker.step].key;
          state.picker.answers[curKey] = btn.dataset.pickOpt;
          state.picker.step += 1;
          state.picker.forcedIdx = null;
          renderQuickPicker();
        });
      });
      const backBtn = document.getElementById('pickerBackBtn');
      if (backBtn) backBtn.onclick = () => { state.picker.step = Math.max(0, state.picker.step - 1); renderQuickPicker(); };

      const randBtn = document.getElementById('pickerRandomBtn');
      if (randBtn) randBtn.onclick = () => {
        const moods = ['aperitif', 'party', 'cozy', 'digestif'];
        const flavs = ['citrus', 'fruity', 'bitter', 'creamy'];
        const strs = ['light', 'medium', 'strong'];
        state.picker.answers = {
          mood: moods[Math.floor(Math.random() * moods.length)],
          flavor: flavs[Math.floor(Math.random() * flavs.length)],
          strength: strs[Math.floor(Math.random() * strs.length)]
        };
        state.picker.step = 3;
        state.picker.forcedIdx = Math.floor(Math.random() * LIQUEURS.length);
        renderQuickPicker();
      };

      const altBtn = document.getElementById('pickerNextAltBtn');
      if (altBtn) altBtn.onclick = () => {
        state.picker.forcedIdx = ((state.picker.forcedIdx || 0) + 1) % LIQUEURS.length;
        renderQuickPicker();
      };

      const resBtn = document.getElementById('pickerRestartBtn');
      if (resBtn) resBtn.onclick = () => {
        state.picker = { step: 0, answers: {}, forcedIdx: null };
        renderQuickPicker();
      };
    }


        // ==================== STAGE 3: PORTION & COST CALCULATOR ====================
    // Verified promo prices per 700 ml bottle (Winelab / Bristol, 19.11.2026) -> RUB per ml
    const LIQUEUR_RUB_PER_ML = {
      cointreau: 1700 / 700,
      baileys: 1490 / 700,
      passoa: 2300 / 700,
      aperol: 1700 / 700,
      jagermeister: 1390 / 700,
      'bols-triple-sec': 2000 / 700,
      'bols-cassis': 1400 / 700,
      'olmeca-silver': 1480 / 700,
      'olmeca-gold': 1650 / 700,
      'espolon-blanco': 2900 / 750,
      'absolut-vodka': 1490 / 700,
      'jim-beam-bourbon': 1400 / 700,
      'jim-beam-apple': 1450 / 700,
      'jim-beam-honey': 1600 / 700,
      'jack-daniels': 1830 / 700,
      'beefeater-gin': 2290 / 700,
      'havana-club-3': 1990 / 700,
      'martini-rosso': 1390 / 750,
      'campari': 2290 / 700
    };

    // Approximate RF retail reference rates for non-liqueur bar ingredients (RUB per ml or per unit)
    const BASE_ING_RATES = [
      { keys: ['мескаль'], rubPerMl: 5.0 },
      { keys: ['шартрез', 'chartreuse'], rubPerMl: 7.5 },
      { keys: ['amaro', 'амаро'], rubPerMl: 4.5 },
      { keys: ['коньяк'], rubPerMl: 3.6 },
      { keys: ['текила'], rubPerMl: 2.8 },
      { keys: ['виски', 'бурбон'], rubPerMl: 2.6 },
      { keys: ['кофейный ликёр', 'kahlúa'], rubPerMl: 2.5 },
      { keys: ['джин'], rubPerMl: 2.0 },
      { keys: ['ром'], rubPerMl: 2.0 },
      { keys: ['lillet', 'вермут'], rubPerMl: 1.6 },
      { keys: ['водка'], rubPerMl: 1.2 },
      { keys: ['шампанское'], rubPerMl: 2.8 },
      { keys: ['просекко', 'prosecco', 'брют'], rubPerMl: 1.35 },
      { keys: ['белое вино'], rubPerMl: 1.0 },
      { keys: ['имбирное пиво'], rubPerMl: 0.45 },
      { keys: ['тоник'], rubPerMl: 0.25 },
      { keys: ['содовая', 'газированная вода'], rubPerMl: 0.12 },
      { keys: ['кола'], rubPerMl: 0.16 },
      { keys: ['пюре маракуйи'], rubPerMl: 0.9 },
      { keys: ['эспрессо'], rubPerMl: 0.7 },
      { keys: ['сок лайма', 'лимонный сок'], rubPerMl: 0.55 },
      { keys: ['апельсиновый сок', 'ананасовый сок', 'клюквенный'], rubPerMl: 0.28 },
      { keys: ['сироп'], rubPerMl: 0.55 },
      { keys: ['сливки'], rubPerMl: 0.45 },
      { keys: ['пломбир'], rubPerMl: 0.55 },
      { keys: ['абсент'], rubPerMl: 4.0 },
      { keys: ['белок', 'аквафаба'], rubPerMl: 0.3 },
      { keys: ['кампари', 'campari'], rubPerMl: 3.1 },
      { keys: ['амаретто', 'amaretto'], rubPerMl: 2.2 },
      { keys: ['трипл-сек'], rubPerMl: 2.4 },
      { keys: ['красное вино'], rubPerMl: 1.1 },
      { keys: ['грейпфрутов', 'томатный', 'яблочный'], rubPerMl: 0.28 },
      { keys: ['имбирный эль', 'лимонно-лайм'], rubPerMl: 0.22 },
      { keys: ['минеральн', 'вода'], rubPerMl: 0.08 },
      { keys: ['чай'], rubPerMl: 0.1 },
      { keys: ['гренадин', 'агав', 'мёд', 'медов'], rubPerMl: 0.65 }
    ];

    function parseAmount(amountStr) {
      const s = String(amountStr).trim();
      const rangeMatch = s.match(/^(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)\s*(.*)$/);
      if (rangeMatch) {
        return {
          type: 'range',
          min: parseFloat(rangeMatch[1].replace(',', '.')),
          max: parseFloat(rangeMatch[2].replace(',', '.')),
          unit: rangeMatch[3].trim()
        };
      }
      const singleMatch = s.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
      if (singleMatch) {
        return {
          type: 'single',
          val: parseFloat(singleMatch[1].replace(',', '.')),
          unit: singleMatch[2].trim()
        };
      }
      return { type: 'raw', raw: s, val: 0, unit: '' };
    }

    function formatScaledAmount(amountStr, mult) {
      const p = parseAmount(amountStr);
      if (p.type === 'range') {
        const a = Math.round(p.min * mult * 10) / 10;
        const b = Math.round(p.max * mult * 10) / 10;
        return `${a}–${b} ${p.unit}`.trim();
      }
      if (p.type === 'single') {
        const v = Math.round(p.val * mult * 10) / 10;
        let u = p.unit;
        if (u === 'мл' && typeof state !== 'undefined' && state.unitMode === 'oz') {
          return `${(v / 29.5735).toFixed(2).replace(/\.00$/, '')} oz`;
        }
        if (u === 'мл' && typeof state !== 'undefined' && state.unitMode === 'jigger') {
          const j = v / 45;
          return `${j >= 1 ? j.toFixed(1).replace(/\.0$/, '') : j.toFixed(2).replace(/0$/, '')} джиг.`;
        }
        if (u === 'дэша' || u === 'дэш') {
          u = v === 1 ? 'дэш' : (v >= 2 && v <= 4 ? 'дэша' : 'дэшей');
        } else if (u === 'полоска') {
          u = v === 1 ? 'полоска' : (v >= 2 && v <= 4 ? 'полоски' : 'полосок');
        }
        return `${v} ${u}`.trim();
      }
      return amountStr;
    }

    function estimateIngredientCost(ing, mult) {
      const low = ing.name.toLowerCase();
      const p = parseAmount(ing.amount);
      if (low.includes('лёд')) return 0;
      if (low.includes('биттер')) return Math.round(12 * mult);
      if (low.includes('мята') || low.includes('цедра')) return Math.round(15 * mult);

      const qty = p.type === 'single' ? p.val : (p.type === 'range' ? (p.min + p.max) / 2 : 0);
      if (!qty) return 0;

      // Check our 7 liqueurs first (verified prices!)
      for (const [k, kws] of Object.entries(LIQUEUR_MATCH_MAP)) {
        if (kws.some(kw => low.includes(kw))) {
          return Math.round(qty * LIQUEUR_RUB_PER_ML[k] * mult);
        }
      }
      // Fallback to RF retail reference rates
      for (const r of BASE_ING_RATES) {
        if (r.keys.some(kw => low.includes(kw))) {
          return Math.round(qty * r.rubPerMl * mult);
        }
      }
      return Math.round(qty * 0.5 * mult);
    }

    function calcCocktailCostAndVolume(c, servings) {
      let totalCost = 0;
      let totalMl = 0;
      for (const ing of c.ingredients) {
        totalCost += estimateIngredientCost(ing, servings);
        const p = parseAmount(ing.amount);
        if (p.type === 'single' && p.unit === 'мл') {
          totalMl += p.val * servings;
        }
      }
      return { totalCost, perGlassCost: Math.round(totalCost / Math.max(1, servings)), totalMl: Math.round(totalMl) };
    }

    function showToast(msg) {
      let t = document.getElementById('atlasToast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'atlasToast';
        t.className = 'fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#1A1816] text-[#FAF7F2] text-xs font-medium shadow-xl transition-opacity duration-300';
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.style.opacity = '1';
      clearTimeout(t._timer);
      t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2400);
    }

    function copyTextSafe(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast('Список ингредиентов скопирован ✓')).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    }
    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('Список ингредиентов скопирован ✓'); } catch (e) { showToast('Не удалось скопировать'); }
      document.body.removeChild(ta);
    }

    function renderCocktailModalContent(c, servings, activeStep) {
      const totalSteps = c.steps.length;
      const curStep = (typeof activeStep === 'number' && activeStep >= 1 && activeStep <= totalSteps) ? activeStep : totalSteps;
      const badgeColor = c.mainLiqueur === 'multi' ? '#1A1816' : getLiqueur(c.mainLiqueur).accent;
      const calc = calcCocktailCostAndVolume(c, servings);
      const volText = calc.totalMl >= 1000 ? `${(calc.totalMl / 1000).toFixed(2)} л` : `${calc.totalMl} мл`;

      document.getElementById('cocktailModalBody').innerHTML = `
        <div class="relative aspect-[16/10] bg-[#EFE9DF]">
          <img loading="lazy" decoding="async" src="${c.img}" alt="${c.name}" class="w-full h-full object-cover" />
          <button type="button" id="shareCocktailBtn" aria-label="Поделиться ссылкой на коктейль" title="Поделиться рецептом" class="absolute top-3 right-14 w-10 h-10 rounded-full bg-[#1A1816]/75 text-white flex items-center justify-center hover:bg-[#1A1816] backdrop-blur-sm">
            <i data-lucide="share-2" class="w-4 h-4"></i>
          </button>
          <button type="button" id="closeCocktailModalBtn" aria-label="Закрыть рецепт" class="absolute top-3 right-3 w-10 h-10 rounded-full bg-[#1A1816]/80 text-white flex items-center justify-center">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
          <span class="absolute bottom-3 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white" style="background:${badgeColor};">${c.status}</span>
        </div>
        <div class="p-5 sm:p-7 space-y-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-serif-ed text-3xl font-semibold">${c.name}</h3>
              <p class="text-xs text-[#6B655E] mt-1">${c.flavor}</p>
            </div>
            <button type="button" id="openBartenderModeBtn" class="px-3.5 py-2 rounded-full bg-[#1A1816] text-[#FAF7F2] text-xs font-semibold hover:opacity-90 shrink-0 inline-flex items-center gap-1.5">
              <span>Бармен ⏱</span>
            </button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div class="p-2.5 rounded-xl bg-white border border-[#E5DDD0]"><div class="text-[10px] text-[#6B655E]">Метод</div><div class="font-semibold">${c.method}</div></div>
            <div class="p-2.5 rounded-xl bg-white border border-[#E5DDD0]"><div class="text-[10px] text-[#6B655E]">Крепость</div><div class="font-semibold">~${c.abv}% ABV</div></div>
            <div class="p-2.5 rounded-xl bg-white border border-[#E5DDD0]"><div class="text-[10px] text-[#6B655E]">Сложность</div><div class="font-semibold">${c.difficulty}</div></div>
            <div class="p-2.5 rounded-xl bg-white border border-[#E5DDD0]"><div class="text-[10px] text-[#6B655E]">Бокал</div><div class="font-semibold">${c.glass}</div></div>
          </div>

          <!-- STAGE 3: Portion & Cost Calculator Box -->
          <div class="p-4 rounded-2xl bg-white border border-[#E5DDD0] space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="text-xs uppercase tracking-wider font-semibold text-[#6B655E]">Калькулятор порций и стоимости</div>
              <div class="flex items-center gap-1">
                ${[1, 2, 4, 6, 8].map(n => `
                  <button type="button" data-serv-set="${n}" class="w-8 h-8 rounded-full text-xs font-semibold transition-colors ${servings === n ? 'bg-[#1A1816] text-white' : 'bg-[#F2ECE1] text-[#524C46] hover:bg-[#E5DDD0]'}">${n}</button>
                `).join('')}
                <button type="button" id="servMinusBtn" class="w-8 h-8 rounded-full border border-[#D7CEC0] text-xs font-bold hover:border-[#1A1816]">−</button>
                <span class="w-7 text-center text-xs font-bold">${servings}</span>
                <button type="button" id="servPlusBtn" class="w-8 h-8 rounded-full border border-[#D7CEC0] text-xs font-bold hover:border-[#1A1816]">+</button>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2 pt-1">
              <div class="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]">
                <div class="text-[10px] text-[#6B655E]">За 1 бокал</div>
                <div class="font-serif-ed text-xl font-bold text-[#1A1816]">~${calc.perGlassCost} ₽</div>
              </div>
              <div class="p-2.5 rounded-xl bg-[#EEF6F2] border border-[#C6E0D3]">
                <div class="text-[10px] text-[#1B4D3E]">Итого (${servings} порц.)</div>
                <div class="font-serif-ed text-xl font-bold text-[#1B4D3E]">~${calc.totalCost.toLocaleString('ru-RU')} ₽</div>
              </div>
              <div class="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]">
                <div class="text-[10px] text-[#6B655E]">Объём жидкости</div>
                <div class="font-serif-ed text-xl font-bold text-[#1A1816]">${volText}</div>
              </div>
            </div>
            <p class="text-[10px] text-[#6B655E] leading-snug">Ликёры рассчитаны по акционным ценам ВинЛаб/Бристоль (19.11.2026), базовые ингредиенты — ориентир розницы РФ.</p>
          </div>

          ${c.multiNote ? `<div class="p-3.5 rounded-xl bg-[#FBF5E6] border border-[#E7D3A3] text-xs text-[#5C4516]"><b>Почему сочетание работает:</b> ${c.multiNote}</div>` : ''}
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <div class="text-xs uppercase tracking-wider font-semibold text-[#6B655E]">Ингредиенты на ${servings} ${servings === 1 ? 'порцию' : (servings < 5 ? 'порции' : 'порций')}</div>
              <div class="flex items-center gap-1">
                <button type="button" data-unit-set="ml" class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${(state.unitMode||'ml')==='ml' ? 'bg-[#1A1816] text-white' : 'bg-[#F2ECE1] text-[#524C46]'}">мл</button>
                <button type="button" data-unit-set="oz" class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${state.unitMode==='oz' ? 'bg-[#1A1816] text-white' : 'bg-[#F2ECE1] text-[#524C46]'}">oz</button>
                <button type="button" data-unit-set="jigger" class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${state.unitMode==='jigger' ? 'bg-[#1A1816] text-white' : 'bg-[#F2ECE1] text-[#524C46]'}">джиггер</button>
                <button type="button" id="copyRecipeListBtn" class="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F2ECE1] hover:bg-[#1A1816] hover:text-white transition-colors ml-1">Копия</button>
              </div>
            </div>
            ${typeof renderDilutionCard === 'function' ? renderDilutionCard(c) : ''}
            <div id="animatedGlassHolder">${buildStepAwareGlassSVG(c, curStep, totalSteps)}</div>
            ${renderCocktailIngredientTiles(c, servings)}
          </div>
          <div class="space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <div class="text-xs uppercase tracking-wider font-semibold text-[#6B655E]">Пошаговое приготовление · шаг ${curStep}/${totalSteps}</div>
              <div class="flex items-center gap-1.5">
                <button type="button" id="stepPrevBtn" class="px-2.5 py-1 rounded-full bg-[#F2ECE1] text-[11px] font-medium hover:bg-[#E5DDD0] disabled:opacity-40" ${curStep <= 1 ? 'disabled' : ''}>← Шаг</button>
                <button type="button" id="stepNextBtn" class="px-2.5 py-1 rounded-full bg-[#1A1816] text-white text-[11px] font-medium hover:opacity-90 disabled:opacity-40" ${curStep >= totalSteps ? 'disabled' : ''}>Шаг →</button>
              </div>
            </div>
            <ol class="space-y-2 text-xs sm:text-sm text-[#3E3934] leading-relaxed">
              ${c.steps.map((s, idx) => {
                const n = idx + 1;
                const isActive = n === curStep;
                const isDone = n < curStep;
                return `<li data-pour-step="${n}" class="recipe-step-item p-2.5 rounded-xl border ${isActive ? 'active-step font-medium' : 'border-[#EDE6DA] bg-white/60'} flex items-start gap-2.5">
                  <span class="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${isActive ? 'bg-[#1A1816] text-white' : (isDone ? 'bg-[#1B4D3E] text-white' : 'bg-[#F2ECE1] text-[#6B655E]')}">${isDone ? '✓' : n}</span>
                  <span>${s}</span>
                </li>`;
              }).join('')}
            </ol>
          </div>
          ${typeof renderJournalModalBox === 'function' ? renderJournalModalBox(c.id) : ''}
        </div>`;

      document.getElementById('closeCocktailModalBtn').onclick = () => closeCocktailModal();
      const shareCockBtn = document.getElementById('shareCocktailBtn');
      if (shareCockBtn) {
        shareCockBtn.onclick = () => {
          if (typeof shareAtlasLink === 'function') shareAtlasLink(c.name + ' — LIQUEUR ATLAS', 'Рецепт коктейля ' + c.name, '#cocktail/' + c.id);
        };
      }
      const bmBtn = document.getElementById('openBartenderModeBtn');
      if (bmBtn && typeof openBartenderMode === 'function') bmBtn.onclick = () => openBartenderMode(c, servings);
      document.querySelectorAll('[data-unit-set]').forEach(b => {
        b.onclick = () => { state.unitMode = b.dataset.unitSet; renderCocktailModalContent(c, servings, curStep); };
      });
      if (typeof bindJournalModalEvents === 'function') bindJournalModalEvents(c, servings, curStep);
      document.querySelectorAll('[data-serv-set]').forEach(btn => {
        btn.onclick = () => renderCocktailModalContent(c, parseInt(btn.dataset.servSet, 10), curStep);
      });
      document.getElementById('servMinusBtn').onclick = () => renderCocktailModalContent(c, Math.max(1, servings - 1), curStep);
      document.getElementById('servPlusBtn').onclick = () => renderCocktailModalContent(c, Math.min(24, servings + 1), curStep);
      document.querySelectorAll('[data-pour-step]').forEach(li => {
        li.onclick = () => renderCocktailModalContent(c, servings, parseInt(li.dataset.pourStep, 10));
      });
      const prevBtn = document.getElementById('stepPrevBtn');
      const nextBtn = document.getElementById('stepNextBtn');
      if (prevBtn) prevBtn.onclick = () => renderCocktailModalContent(c, servings, Math.max(1, curStep - 1));
      if (nextBtn) nextBtn.onclick = () => renderCocktailModalContent(c, servings, Math.min(totalSteps, curStep + 1));
      const replayBtn = document.getElementById('replayPourBtn');
      if (replayBtn) {
        replayBtn.onclick = () => renderCocktailModalContent(c, servings, 1);
      }
      document.getElementById('copyRecipeListBtn').onclick = () => {
        const lines = [
          `${c.name} (${servings} порц. · ~${calc.totalCost} ₽)`,
          ...c.ingredients.map(i => `• ${i.name}: ${formatScaledAmount(i.amount, servings)}`),
          `Украшение: ${c.garnish}`
        ];
        copyTextSafe(lines.join('\n'));
      };
      if (window.lucide) lucide.createIcons();
    }


        // ==================== EDITORIAL ILLUSTRATIONS: ANIMATED GLASS POUR, BIG INGREDIENT GRAPHICS & SECTION WATERMARKS ====================

    const ING_VISUALS = {
      orange: {
        bg: '#FDF1E6', stroke: '#D96B27',
        svg: `<svg viewBox="0 0 64 64" class="w-12 h-12" fill="none"><circle cx="32" cy="34" r="21" fill="#F4A261" fill-opacity="0.25" stroke="#D96B27" stroke-width="2"/><circle cx="32" cy="34" r="15" stroke="#D96B27" stroke-width="1.3" stroke-dasharray="3 2"/><path d="M32 19v30M17 34h30M21.4 23.4l21.2 21.2M42.6 23.4L21.4 44.6" stroke="#D96B27" stroke-width="1.2" opacity="0.7"/><path d="M32 13c2-5 7-7 11-5-2 4-6 6-11 5z" fill="#4F772D" fill-opacity="0.45" stroke="#2D4A18" stroke-width="1.4"/></svg>`
      },
      lime: {
        bg: '#EFF7E8', stroke: '#4A7C2C',
        svg: `<svg viewBox="0 0 64 64" class="w-12 h-12" fill="none"><path d="M12 42a22 22 0 0 1 40-12L12 42z" fill="#84B84E" fill-opacity="0.28" stroke="#4A7C2C" stroke-width="2"/><path d="M16 39a17 17 0 0 1 31-9" stroke="#4A7C2C" stroke-width="1.3"/><path d="M32 36l-8-14M32 36l4-16M32 36l13-10" stroke="#4A7C2C" stroke-width="1.2" opacity="0.7"/></svg>`
      },
      lemon: {
        bg: '#FEF9E2', stroke: '#B88914',
        svg: `<svg viewBox="0 0 64 64" class="w-12 h-12" fill="none"><ellipse cx="32" cy="34" rx="22" ry="16" transform="rotate(-18 32 34)" fill="#F4D35E" fill-opacity="0.32" stroke="#B88914" stroke-width="2"/><circle cx="24" cy="34" r="2" fill="#B88914" opacity="0.5"/><circle cx="38" cy="30" r="1.8" fill="#B88914" opacity="0.5"/><path d="M48 22c3-4 6-3 7 0" stroke="#B88914" stroke-width="1.8" stroke-linecap="round"/></svg>`
      },
      passionfruit: {
        bg: '#FCEEF3', stroke: '#C8235D',
        svg: `<svg viewBox="0 0 64 64" class="w-12 h-12" fill="none"><circle cx="32" cy="32" r="22" fill="#7A173B" fill-opacity="0.18" stroke="#87133B" stroke-width="2"/><circle cx="32" cy="32" r="16" fill="#F8B932" fill-opacity="0.45" stroke="#C8235D" stroke-width="1.4"/><circle cx="27" cy="27" r="2.2" fill="#2A1810"/><circle cx="36" cy="26" r="2.2" fill="#2A1810"/><circle cx="31" cy="33" r="2.2" fill="#2A1810"/><circle cx="26" cy="37" r="2" fill="#2A1810"/><circle cx="37" cy="36" r="2.2" fill="#2A1810"/><circle cx="32" cy="40" r="1.9" fill="#2A1810"/></svg>`
      },
      cassis: {
        bg: '#F6EEF4', stroke: '#5B1F4A',
        svg: `<svg viewBox="0 0 64 64" class="w-12 h-12" fill="none"><path d="M18 16c10 4 18 12 24 22" stroke="#4F772D" stroke-width="1.8" stroke-linecap="round"/><circle cx="25" cy="33" r="7.5" fill="#5B1F4A" fill-opacity="0.35" stroke="#5B1F4A" stroke-width="1.8"/><circle cx="38" cy="30" r="7" fill="#5B1F4A" fill-opacity="0.45" stroke="#5B1F4A" stroke-width="1.8"/><circle cx="34" cy="43" r="8" fill="#5B1F4A" fill-opacity="0.55" stroke="#3A112F" stroke-width="1.8"/><circle cx="22" cy="44" r="6" fill="#5B1F4A" fill-opacity="0.3" stroke="#5B1F4A" stroke-width="1.6"/></svg>`
      },
      coffee: {
        bg: '#F4ECE6', stroke: '#6E4528',
        svg: `<svg viewBox="0 0 64 64" class="w-12 h-12" fill="none"><ellipse cx="26" cy="34" rx="11" ry="15" transform="rotate(-22 26 34)" fill="#8B5E3C" fill-opacity="0.3" stroke="#593A22" stroke-width="2"/><path d="M21 22c4 7 4 15 9 23" stroke="#593A22" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="42" cy="30" rx="9" ry="12" transform="rotate(24 42 30)" fill="#8B5E3C" fill-opacity="0.22" stroke="#593A22" stroke-width="1.8"/><path d="M45 20c-3 6-3 12-6 19" stroke="#593A22" stroke-width="1.4" stroke-linecap="round"/></svg>`
      },
      cream: {
        bg: '#FAF3E8', stroke: '#9E744B',
        svg: `<svg viewBox="0 0 64 64" class="w-12 h-12" fill="none"><path d="M32 12c9 14 16 22 16 31a16 16 0 1 1-32 0c0-9 7-17 16-31z" fill="#D6B898" fill-opacity="0.35" stroke="#8B5E3C" stroke-width="2"/><path d="M24 41c1 4 5 7 9 7" stroke="#8B5E3C" stroke-width="1.8" stroke-linecap="round"/></svg>`
      },
      herbs: {
        bg: '#EBF3F0', stroke: '#1B4D3E',
        svg: `<svg viewBox="0 0 64 64" class="w-12 h-12" fill="none"><path d="M32 52V14" stroke="#1B4D3E" stroke-width="2" stroke-linecap="round"/><path d="M32 38c-10-2-15-9-15-16 8 0 14 5 15 16zM32 32c10-2 15-9 15-16-8 0-14 5-15 16zM32 46c-8-1-12-6-12-11 6 0 10 4 12 11z" fill="#1B4D3E" fill-opacity="0.22" stroke="#1B4D3E" stroke-width="1.7"/></svg>`
      },
      spice: {
        bg: '#F8EFE6', stroke: '#8E4B1E',
        svg: `<svg viewBox="0 0 64 64" class="w-12 h-12" fill="none"><path d="M32 12l4 13 13-3-8 10 10 9-13-1-2 12-6-11-11 6 6-12-11-6 13-2z" fill="#C97B28" fill-opacity="0.28" stroke="#8E4B1E" stroke-width="1.8" stroke-linejoin="round"/><circle cx="32" cy="33" r="4" fill="#8E4B1E"/></svg>`
      },
      sparkling: {
        bg: '#FBF7E8', stroke: '#B68D2C',
        svg: `<svg viewBox="0 0 64 64" class="w-12 h-12" fill="none"><path d="M24 12h16l-2 22a6 6 0 0 1-12 0l-2-22z" fill="#F2D479" fill-opacity="0.3" stroke="#9E761A" stroke-width="2"/><path d="M32 40v14M24 54h16" stroke="#9E761A" stroke-width="2" stroke-linecap="round"/><circle cx="30" cy="24" r="1.5" fill="#9E761A"/><circle cx="35" cy="19" r="1.3" fill="#9E761A"/><circle cx="32" cy="30" r="1.2" fill="#9E761A"/></svg>`
      },
      spirit: {
        bg: '#F4F1EC', stroke: '#4A453F',
        svg: `<svg viewBox="0 0 64 64" class="w-12 h-12" fill="none"><path d="M27 10h10v8l6 7v27a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3V25l6-7v-8z" fill="#D7CEC0" fill-opacity="0.35" stroke="#4A453F" stroke-width="2" stroke-linejoin="round"/><rect x="25" y="31" width="14" height="12" rx="1.5" fill="#FFFFFF" stroke="#4A453F" stroke-width="1.3"/></svg>`
      },
      soda: {
        bg: '#EEF5FA', stroke: '#3B6E8C',
        svg: `<svg viewBox="0 0 64 64" class="w-12 h-12" fill="none"><circle cx="24" cy="38" r="9" fill="#8ECAE6" fill-opacity="0.28" stroke="#3B6E8C" stroke-width="1.8"/><circle cx="39" cy="26" r="11" fill="#8ECAE6" fill-opacity="0.22" stroke="#3B6E8C" stroke-width="1.8"/><circle cx="42" cy="44" r="5" fill="#8ECAE6" fill-opacity="0.35" stroke="#3B6E8C" stroke-width="1.5"/></svg>`
      }
    };

    function pickIngredientVisual(name) {
      const low = name.toLowerCase();
      if (low.includes('апельсин') || low.includes('грейпфрут') || low.includes('cointreau') || low.includes('aperol') || low.includes('triple sec') || low.includes('трипл-сек') || low.includes('кампари') || low.includes('campari')) return ING_VISUALS.orange;
      if (low.includes('лайм') || low.includes('яблоч') || low.includes('apple')) return ING_VISUALS.lime;
      if (low.includes('лимон')) return ING_VISUALS.lemon;
      if (low.includes('маракуй') || low.includes('passo')) return ING_VISUALS.passionfruit;
      if (low.includes('смородин') || low.includes('cassis') || low.includes('клюкв') || low.includes('гренадин') || low.includes('томат') || low.includes('красное вино')) return ING_VISUALS.cassis;
      if (low.includes('эспрессо') || low.includes('кофе') || low.includes('kahlúa')) return ING_VISUALS.coffee;
      if (low.includes('baileys') || low.includes('сливк') || low.includes('пломбир') || low.includes('белок')) return ING_VISUALS.cream;
      if (low.includes('jägermeister') || low.includes('мят') || low.includes('трав') || low.includes('вермут') || low.includes('шартрез') || low.includes('абсент')) return ING_VISUALS.herbs;
      if (low.includes('имбир') || low.includes('кориц') || low.includes('анис') || low.includes('биттер') || low.includes('прян') || low.includes('мёд') || low.includes('медов') || low.includes('агав') || low.includes('халапеньо') || low.includes('табаско') || low.includes('вустер') || low.includes('амаретто')) return ING_VISUALS.spice;
      if (low.includes('просекко') || low.includes('prosecco') || low.includes('шампан') || low.includes('вино') || low.includes('брют')) return ING_VISUALS.sparkling;
      if (low.includes('содов') || low.includes('тоник') || low.includes('газир') || low.includes('кол') || low.includes('лёд') || low.includes('минеральн') || low.includes('вода')) return ING_VISUALS.soda;
      return ING_VISUALS.spirit;
    }

    const LIQUEUR_BOTANICALS = {
      'beefeater-gin': [
        { title: 'Можжевельник', note: 'Чистая хвойно-смолистая база', vis: 'herbs' },
        { title: 'Севильский апельсин', note: 'Яркая сухая цитрусовая цедра', vis: 'orange' },
        { title: 'Лимон и кориандр', note: 'Свежая пряная искристость', vis: 'lemon' },
        { title: '24 ч мацерация', note: 'Медная дистилляция в Лондоне', vis: 'spirit' }
      ],
      'havana-club-3': [
        { title: 'Сахарный тростник', note: 'Кубинская меласса, 0 г сахара', vis: 'herbs' },
        { title: 'Белый дуб (3 года)', note: 'Мягкая ваниль и лёгкий дуб', vis: 'spice' },
        { title: 'Свежий лайм', note: 'Идеальный партнёр для Mojito', vis: 'lime' },
        { title: 'Угольная фильтрация', note: 'Светлый оттенок и питкость', vis: 'spirit' }
      ],
      'martini-rosso': [
        { title: 'Итальянское вино', note: 'Свежая винная основа 15% ABV', vis: 'sparkling' },
        { title: 'Полынь и 40 трав', note: 'Благородная аперитивная горечь', vis: 'herbs' },
        { title: 'Натуральная карамель', note: 'Глубокий рубиновый цвет и мягкость', vis: 'coffee' },
        { title: 'Цедра и специи', note: 'Идеальный мост в Negroni и Manhattan', vis: 'orange' }
      ],
      'campari': [
        { title: 'Горькие коренья', note: 'Эталонная сухая горечь 9/10', vis: 'herbs' },
        { title: 'Красный апельсин', note: 'Яркий цитрусовый взрыв', vis: 'orange' },
        { title: 'Хинная кора и специи', note: 'Долгое сухое послевкусие', vis: 'spice' },
        { title: 'Рубиновый цвет', note: 'Сердце Negroni и Boulevardier', vis: 'cassis' }
      ],
      cointreau: [
        { title: 'Сладкий апельсин', note: 'Сочные фруктовые и цветочные ноты', vis: 'orange' },
        { title: 'Горький апельсин', note: 'Сухая цедра, мята и пряный кардамон', vis: 'spice' },
        { title: 'Медная дистилляция', note: 'Кристальная чистота 40% ABV', vis: 'spirit' },
        { title: 'Эфирные масла', note: 'Опалесценция на крупном льду', vis: 'soda' }
      ],
      baileys: [
        { title: 'Ирландские сливки', note: 'Бархатистая плотность и мягкость', vis: 'cream' },
        { title: 'Ирландский виски', note: 'Тёплая выдержанная основа 17%', vis: 'spirit' },
        { title: 'Какао и шоколад', note: 'Насыщенный десертный букет', vis: 'coffee' },
        { title: 'Стручковая ваниль', note: 'Сливочно-карамельное послевкусие', vis: 'spice' }
      ],
      passoa: [
        { title: 'Бразильская маракуйя', note: 'Яркий тропический кисло-сладкий сок', vis: 'passionfruit' },
        { title: 'Цедра грейпфрута', note: 'Живая освежающая кислинка', vis: 'orange' },
        { title: 'Лёгкий спирт 17%', note: 'Питкость и всего ~160 ккал/100 мл', vis: 'soda' },
        { title: 'Лаймовый баланс', note: 'Идеален в паре с просекко', vis: 'lime' }
      ],
      aperol: [
        { title: 'Горький апельсин', note: 'Солнечный итальянский цитрус', vis: 'orange' },
        { title: 'Ревень и горечавка', note: 'Деликатная аперитивная горчинка', vis: 'herbs' },
        { title: 'Хинная кора', note: 'Сухое травяное послевкусие', vis: 'spice' },
        { title: 'Лёгкий градус 11%', note: 'Создан для спритцев с Prosecco', vis: 'sparkling' }
      ],
      jagermeister: [
        { title: '56 ботаникалов', note: 'Травы, коренья, цветы и плоды', vis: 'herbs' },
        { title: 'Бадьян и корица', note: 'Мощный пряный аромат', vis: 'spice' },
        { title: 'Цитрусовая цедра', note: 'Освежает травяной каркас', vis: 'orange' },
        { title: 'Выдержка в дубе', note: '12 мес. в бочках, минимум сахара', vis: 'spirit' }
      ],
      'bols-triple-sec': [
        { title: 'Апельсин Кюрасао', note: 'Зелёная кожура на пике аромата', vis: 'orange' },
        { title: 'Лимон и лайм', note: 'Свежие оттенки белой цедры', vis: 'lemon' },
        { title: 'Пряный нюанс', note: 'Лёгкий мармеладный шлейф', vis: 'spice' },
        { title: 'Барные 38% ABV', note: 'Держит структуру классических миксов', vis: 'spirit' }
      ],
      'bols-cassis': [
        { title: 'Чёрная смородина', note: 'Ягоды из Бургундии (близ Дижона)', vis: 'cassis' },
        { title: 'Смородиновый лист', note: 'Тонкая свежая зелёная нотка', vis: 'herbs' },
        { title: 'Густой Crème', note: 'Сиропная плотность (≥450 г/л)', vis: 'cream' },
        { title: 'Пара к шампанскому', note: 'Классическая основа Kir Royale', vis: 'sparkling' }
      ],
      'olmeca-silver': [
        { title: 'Голубая агава (≥51%)', note: 'Высокогорье Лос-Альтос де Халиско', vis: 'herbs' },
        { title: 'Зелёный перец', note: 'Свежая перечно-травянистая нота', vis: 'spice' },
        { title: 'Лайм и морская соль', note: 'Классический шот кабаллито', vis: 'lime' },
        { title: '0 г сахара', note: 'Чистый сухой профиль 35% ABV', vis: 'soda' }
      ],
      'olmeca-gold': [
        { title: 'Агава миксто', note: 'Основа из Лос-Альтос де Халиско', vis: 'herbs' },
        { title: 'Карамель и дуб', note: 'Мягкий тёплый золотистый тон', vis: 'spice' },
        { title: 'Апельсин и корица', note: 'Фирменный ритуал подачи', vis: 'orange' },
        { title: '0 г сахара', note: '191 ккал на 100 мл (35% ABV)', vis: 'spirit' }
      ],
      'espolon-blanco': [
        { title: '100% голубая агава', note: 'Ручной сбор, без тростникового сахара', vis: 'herbs' },
        { title: 'Ананас и лимон', note: 'Тропические и цитрусовые оттенки', vis: 'lemon' },
        { title: 'Белый перец', note: 'Живая пряная искра 40% ABV', vis: 'spice' },
        { title: 'Идеал для Paloma', note: 'Свежий розовый грейпфрут и содовая', vis: 'orange' }
      ],
      'absolut-vodka': [
        { title: 'Озимая пшеница', note: 'Выращена на юге Швеции (Охус)', vis: 'spice' },
        { title: 'Артезианская вода', note: 'Глубокие скважины >100 м', vis: 'soda' },
        { title: 'Непрерывная перегонка', note: 'Чистота и мягкое зерновое тело', vis: 'spirit' },
        { title: '0 г сахара · 40%', note: 'Универсальный холст для коктейлей', vis: 'lemon' }
      ],
      'jim-beam-bourbon': [
        { title: 'Кукурузное сусло', note: 'Традиционный рецепт Кентукки', vis: 'spice' },
        { title: 'Обожжённый дуб', note: 'Честная выдержка 4 года в новых бочках', vis: 'spirit' },
        { title: 'Ваниль и карамель', note: 'Классический аромат бурбона', vis: 'cream' },
        { title: 'Известняковая вода', note: 'Чистая родниковая вода Кентукки', vis: 'soda' }
      ],
      'jim-beam-apple': [
        { title: 'Зелёное яблоко', note: 'Хрустящая кисло-сладкая свежесть', vis: 'lime' },
        { title: '4-летний бурбон', note: 'Тёплая ванильно-дубовая база', vis: 'spirit' },
        { title: 'Мягкие 32,5% ABV', note: 'Лёгкий вход, 11,8 г сахара/100 мл', vis: 'cream' },
        { title: 'Хайбол с содовой', note: 'Освежающий лонг-дринк с лимоном', vis: 'soda' }
      ],
      'jim-beam-honey': [
        { title: 'Натуральный мёд', note: 'Тёплая цветочная бархатистость', vis: 'cream' },
        { title: '4-летний бурбон', note: 'Дуб, карамель и ваниль Кентукки', vis: 'spirit' },
        { title: 'Мягкие 32,5% ABV', note: 'Уютный дижестив без резкости', vis: 'spice' },
        { title: 'Идеал с лимоном', note: 'Баланс в Gold Rush и Hot Toddy', vis: 'lemon' }
      ],
      'jack-daniels': [
        { title: '80% кукурузы', note: '8% ржи и 12% соложёного ячменя', vis: 'spice' },
        { title: 'Кленовый уголь', note: 'Фильтрация через 3 м угля (Lincoln County)', vis: 'coffee' },
        { title: 'Обожжённый белый дуб', note: 'Карамель, ваниль и сухофрукты', vis: 'spirit' },
        { title: 'Вода Cave Spring', note: 'Без железа · 0 г сахара · 40% ABV', vis: 'soda' }
      ]
    };

    function renderLiqueurBotanicalCards(l) {
      const items = LIQUEUR_BOTANICALS[l.id] || [];
      if (!items.length) return '';
      return `
        <div class="pt-2 space-y-2.5">
          <div class="text-[11px] uppercase tracking-[0.16em] text-[#6B655E] font-semibold">Ключевые ингредиенты — графическая палитра</div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            ${items.map(it => {
              const v = ING_VISUALS[it.vis] || ING_VISUALS.spirit;
              return `
                <div class="p-3.5 rounded-2xl border border-[#EDE6DA] flex flex-col items-center text-center gap-2 transition-transform hover:-translate-y-0.5" data-soft-bg="1" style="background:${v.bg};">
                  <div class="w-14 h-14 rounded-2xl bg-white/80 border border-black/5 flex items-center justify-center shadow-xs">${v.svg}</div>
                  <div>
                    <div class="font-semibold text-xs text-[#1A1816]">${it.title}</div>
                    <div class="text-[11px] text-[#524C46] leading-snug mt-0.5">${it.note}</div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }

    function getCocktailLiquidColors(c) {
      if (c.id === 'b52-layered') return { layered: true, layers: ['#2A1508', '#D9B996', '#F4A24E'] };
      if (c.mainLiqueur === 'aperol') return { c1: '#FF6B2B', c2: '#E84414', fizz: c.method === 'Build' };
      if (c.mainLiqueur === 'baileys') return { c1: '#D9BC9B', c2: '#8B5E3C', fizz: false };
      if (c.mainLiqueur === 'passoa') return { c1: '#EE3B6B', c2: '#B81847', fizz: c.method === 'Build' };
      if (c.mainLiqueur === 'bols-cassis') return { c1: '#8C2368', c2: '#4A0E38', fizz: c.id.includes('kir') || c.id === 'el-diablo' };
      if (c.mainLiqueur === 'jagermeister') return { c1: '#6E3616', c2: '#2C1206', fizz: c.method === 'Build' };
      if (c.id === 'cosmopolitan') return { c1: '#E55A7A', c2: '#C22B51', fizz: false };
      if (c.id === 'olmeca-tequila-sunrise') return { c1: '#FFB347', c2: '#D92638', fizz: false };
      if (c.id === 'absolut-bloody-mary') return { c1: '#C83228', c2: '#8A1A14', fizz: false };
      if (c.id === 'absolut-espresso-martini') return { c1: '#4A2B18', c2: '#1F1008', fizz: false };
      if (c.id === 'absolut-white-russian') return { c1: '#E8D8C3', c2: '#9E7451', fizz: false };
      if (c.id === 'absolut-vodka-martini' || c.id === 'olmeca-ranch-water') return { c1: '#E6F0F5', c2: '#C7DCE6', fizz: c.method === 'Build' };
      if (c.id === 'olmeca-paloma' || c.id === 'espolon-paloma-fresca' || c.id === 'espolon-cantarito' || c.id === 'espolon-siesta') return { c1: '#F7A1A8', c2: '#E36474', fizz: c.method === 'Build' };
      if (c.id === 'jd-jack-coke' || c.id === 'olmeca-batanga' || c.id === 'olmeca-gold-brave-bull') return { c1: '#5C2C14', c2: '#240E05', fizz: c.method === 'Build' };
      if (c.id === 'jb-boulevardier' || c.id === 'jd-new-york-sour') return { c1: '#B8322A', c2: '#6E1418', fizz: false };
      if (c.mainLiqueur === 'jim-beam-apple') return { c1: '#DCE69E', c2: '#B5C963', fizz: c.method === 'Build' };
      if (c.mainLiqueur === 'jim-beam-honey') return { c1: '#F2C15A', c2: '#C98223', fizz: c.method === 'Build' };
      if (c.mainLiqueur === 'jim-beam-bourbon' || c.mainLiqueur === 'jack-daniels') return { c1: '#D9822B', c2: '#8F4310', fizz: c.method === 'Build' };
      if (c.mainLiqueur === 'olmeca-silver' || c.mainLiqueur === 'espolon-blanco' || c.mainLiqueur === 'absolut-vodka') return { c1: '#E8EFC2', c2: '#C8D68B', fizz: c.method === 'Build' };
      if (c.mainLiqueur === 'olmeca-gold') return { c1: '#F0C46B', c2: '#C78A28', fizz: c.method === 'Build' };
      if (c.id === 'margarita' || c.id === 'white-lady' || c.id === 'kamikaze' || c.id === 'corpse-reviver-2') {
        return { c1: '#ECEFBE', c2: '#D4DB8F', fizz: false };
      }
      return { c1: '#F3B664', c2: '#D97B29', fizz: c.method === 'Build' };
    }

    function detectGlassType(glassStr) {
      const g = (glassStr || '').toLowerCase();
      if (g.includes('шот')) return 'shot';
      if (g.includes('флюте')) return 'flute';
      if (g.includes('винн')) return 'wine';
      if (g.includes('хайбол') || g.includes('кружк') || g.includes('харрикейн') || g.includes('коллинз') || g.includes('айриш')) return 'highball';
      if (g.includes('рокс') || g.includes('джулеп')) return 'rocks';
      return 'coupe';
    }

    function buildAnimatedGlassSVG(c) {
      const gType = detectGlassType(c.glass);
      const col = getCocktailLiquidColors(c);
      const uid = 'g_' + c.id.replace(/[^a-z0-9]/gi, '') + '_' + Math.floor(Math.random() * 9999);

      let clipPath = '', glassOutline = '', pourX = 110, fillY = 82, fillH = 85, streamH = 115, hasIce = false;
      if (gType === 'coupe') {
        clipPath = `<path d="M54 78 C54 128 84 138 110 138 C136 138 166 128 166 78 Z"/>`;
        glassOutline = `<path d="M52 75 C52 130 83 141 110 141 C137 141 168 130 168 75" fill="none" stroke="#1A1816" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="110" y1="141" x2="110" y2="205" stroke="#1A1816" stroke-width="2.4"/>
          <ellipse cx="110" cy="206" rx="34" ry="5" fill="#1A1816" fill-opacity="0.08" stroke="#1A1816" stroke-width="2"/>`;
        fillY = 84; fillH = 56; streamH = 112;
      } else if (gType === 'wine') {
        clipPath = `<path d="M68 58 C64 112 78 144 110 144 C142 144 156 112 152 58 Z"/>`;
        glassOutline = `<path d="M66 54 C62 114 77 147 110 147 C143 147 158 114 154 54" fill="none" stroke="#1A1816" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="110" y1="147" x2="110" y2="205" stroke="#1A1816" stroke-width="2.4"/>
          <ellipse cx="110" cy="206" rx="32" ry="5" fill="#1A1816" fill-opacity="0.08" stroke="#1A1816" stroke-width="2"/>`;
        fillY = 72; fillH = 74; streamH = 118; hasIce = true;
      } else if (gType === 'flute') {
        clipPath = `<path d="M88 46 L94 140 C95 148 125 148 126 140 L132 46 Z"/>`;
        glassOutline = `<path d="M86 42 L92 141 C93 151 127 151 128 141 L134 42" fill="none" stroke="#1A1816" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="110" y1="149" x2="110" y2="205" stroke="#1A1816" stroke-width="2.3"/>
          <ellipse cx="110" cy="206" rx="28" ry="4.5" fill="#1A1816" fill-opacity="0.08" stroke="#1A1816" stroke-width="2"/>`;
        fillY = 56; fillH = 92; streamH = 122;
      } else if (gType === 'highball') {
        clipPath = `<rect x="74" y="48" width="72" height="148" rx="4"/>`;
        glassOutline = `<path d="M72 44 L72 196 C72 202 77 206 83 206 L137 206 C143 206 148 202 148 196 L148 44" fill="none" stroke="#1A1816" stroke-width="2.3" stroke-linecap="round"/>
          <line x1="74" y1="194" x2="146" y2="194" stroke="#1A1816" stroke-width="1.3" opacity="0.35"/>`;
        fillY = 64; fillH = 132; streamH = 148; hasIce = true;
      } else if (gType === 'shot') {
        clipPath = `<path d="M82 96 L88 186 L132 186 L138 96 Z"/>`;
        glassOutline = `<path d="M80 92 L86 196 C87 202 91 205 97 205 L123 205 C129 205 133 202 134 196 L140 92" fill="none" stroke="#1A1816" stroke-width="2.4" stroke-linecap="round"/>
          <line x1="88" y1="186" x2="132" y2="186" stroke="#1A1816" stroke-width="1.5" opacity="0.4"/>`;
        fillY = 104; fillH = 82; streamH = 146;
      } else {
        // rocks
        clipPath = `<rect x="64" y="96" width="92" height="96" rx="4"/>`;
        glassOutline = `<path d="M62 92 L62 194 C62 201 68 206 75 206 L145 206 C152 206 158 201 158 194 L158 92" fill="none" stroke="#1A1816" stroke-width="2.4" stroke-linecap="round"/>
          <line x1="64" y1="188" x2="156" y2="188" stroke="#1A1816" stroke-width="1.5" opacity="0.35"/>`;
        fillY = 114; fillH = 78; streamH = 152; hasIce = true;
      }

      let liquidMarkup = '';
      if (col.layered) {
        const lh = Math.round(fillH / 3);
        liquidMarkup = `
          <rect x="40" y="${fillY + lh * 2}" width="140" height="${lh + 6}" fill="${col.layers[0]}" class="pour-layer-1"/>
          <rect x="40" y="${fillY + lh}" width="140" height="${lh + 2}" fill="${col.layers[1]}" class="pour-layer-2"/>
          <rect x="40" y="${fillY}" width="140" height="${lh + 2}" fill="${col.layers[2]}" class="pour-layer-3"/>`;
      } else {
        liquidMarkup = `
          <g class="pour-rise">
            <rect x="40" y="${fillY}" width="140" height="${fillH + 20}" fill="url(#${uid}_grad)"/>
            <path d="M40 ${fillY} Q75 ${fillY - 6} 110 ${fillY} T180 ${fillY} L180 ${fillY + 14} L40 ${fillY + 14} Z" fill="${col.c1}" opacity="0.7" class="liquid-wave"/>
          </g>`;
      }

      const iceMarkup = hasIce ? `
        <g opacity="0.52" class="ice-float">
          <rect x="86" y="${fillY + 14}" width="26" height="24" rx="5" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1.2" transform="rotate(-10 99 ${fillY + 26})"/>
          <rect x="108" y="${fillY + 28}" width="24" height="22" rx="5" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1.2" transform="rotate(14 120 ${fillY + 39})"/>
        </g>` : '';

      const bubblesMarkup = col.fizz ? `
        <g fill="#FFFFFF" opacity="0.75">
          <circle cx="96" cy="${fillY + fillH - 12}" r="2.2" class="bubble-rise-1"/>
          <circle cx="114" cy="${fillY + fillH - 22}" r="1.8" class="bubble-rise-2"/>
          <circle cx="122" cy="${fillY + fillH - 8}" r="2.5" class="bubble-rise-3"/>
          <circle cx="104" cy="${fillY + fillH - 16}" r="1.5" class="bubble-rise-2"/>
        </g>` : '';

      const streamColor = col.layered ? col.layers[2] : col.c1;

      return `
        <div class="relative rounded-2xl bg-gradient-to-b from-[#FAF7F2] to-[#F1EAE0] border border-[#E5DDD0] p-4 flex flex-col sm:flex-row items-center gap-4 overflow-hidden">
          <div class="relative shrink-0 w-[180px] h-[190px] flex items-center justify-center">
            <svg viewBox="0 0 220 220" class="w-full h-full overflow-visible">
              <defs>
                <clipPath id="${uid}_clip">${clipPath}</clipPath>
                <linearGradient id="${uid}_grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="${col.layered ? col.layers[2] : col.c1}"/>
                  <stop offset="100%" stop-color="${col.layered ? col.layers[0] : col.c2}"/>
                </linearGradient>
              </defs>
              <!-- Soft shadow under glass -->
              <ellipse cx="110" cy="208" rx="46" ry="7" fill="#1A1816" opacity="0.08"/>
              <!-- Animated Pouring Stream -->
              <rect x="${pourX - 2.5}" y="2" width="5" height="${streamH}" rx="2.5" fill="${streamColor}" class="pour-stream"/>
              <!-- Liquid & Ice clipped inside glass -->
              <g clip-path="url(#${uid}_clip)">
                ${liquidMarkup}
                ${iceMarkup}
                ${bubblesMarkup}
              </g>
              <!-- Glass specular highlight -->
              <path d="M78 ${fillY + 6} L78 ${fillY + fillH - 12}" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
              <!-- Crisp editorial glass outline -->
              ${glassOutline}
            </svg>
          </div>
          <div class="flex-1 text-center sm:text-left space-y-2">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#E5DDD0] text-[10px] uppercase tracking-[0.14em] text-[#6B655E]">
              <span>Подача · ${c.glass}</span>
            </div>
            <div class="text-xs sm:text-sm text-[#3E3934] leading-relaxed">
              <b>Украшение:</b> ${c.garnish}
            </div>
            <button type="button" id="replayPourBtn" class="px-3 py-1.5 rounded-full bg-white border border-[#D7CEC0] hover:border-[#1A1816] text-xs font-medium transition-colors inline-flex items-center gap-1.5">
              <span>Повторить налив ↻</span>
            </button>
          </div>
        </div>`;
    }

    function renderCocktailIngredientTiles(c, servings) {
      return `
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          ${c.ingredients.map(i => {
            const vis = pickIngredientVisual(i.name);
            const scaled = formatScaledAmount(i.amount, servings);
            const cost = estimateIngredientCost(i, servings);
            return `
              <div class="soft-bg-tile p-3 rounded-2xl border border-[#EDE6DA] flex flex-col justify-between gap-2" style="background:${vis.bg};">
                <div class="flex items-start justify-between gap-1">
                  <div class="w-11 h-11 rounded-xl bg-white/85 border border-black/5 flex items-center justify-center shrink-0">${vis.svg}</div>
                  <div class="text-right">
                    <div class="font-bold text-xs sm:text-sm text-[#1A1816]">${scaled}</div>
                    ${cost > 0 ? `<div class="text-[10px] text-[#6B655E]">~${cost} ₽</div>` : ''}
                  </div>
                </div>
                <div class="text-[11px] font-medium text-[#2E2A26] leading-tight">${i.name}</div>
              </div>`;
          }).join('')}
        </div>`;
    }


    // ==================== GLOBAL EVENT DELEGATION ====================
    document.addEventListener('click', e => {
      const navBtn = e.target.closest('[data-nav]');
      if (navBtn) { navigateTo(navBtn.dataset.nav); return; }

      const detBtn = e.target.closest('[data-open-detail]');
      if (detBtn) { navigateTo('detail', detBtn.dataset.openDetail); return; }

      const cockBtn = e.target.closest('[data-open-cocktail]');
      if (cockBtn) { openCocktailModal(cockBtn.dataset.openCocktail); return; }

      const zoomImg = e.target.closest('.img-zoomable');
      if (zoomImg) { openLightbox(zoomImg.src, zoomImg.dataset.zoomCaption || zoomImg.alt); return; }

      const catBtn = e.target.closest('[data-cat-filter]');
      if (catBtn) {
        state.catalogCategory = catBtn.dataset.catFilter;
        renderHomeAndCatalog();
        return;
      }

      const storeBtn = e.target.closest('[data-store-filter]');
      if (storeBtn) {
        state.storeFilter = storeBtn.dataset.storeFilter;
        document.querySelectorAll('.store-filter-btn').forEach(b => {
          const active = b.dataset.storeFilter === state.storeFilter;
          b.classList.toggle('bg-[#1A1816]', active);
          b.classList.toggle('text-white', active);
          b.classList.toggle('bg-white', !active);
        });
        renderPrices();
        return;
      }

      const taskBtn = e.target.closest('[data-task]');
      if (taskBtn) { renderGuideTask(taskBtn.dataset.task); return; }

      const chip = e.target.closest('[data-ing-chip]');
      if (chip) {
        document.getElementById('fIngredient').value = chip.dataset.ingChip;
        renderCocktails();
        return;
      }

      const barLiqBtn = e.target.closest('[data-bar-liq]');
      if (barLiqBtn) {
        const id = barLiqBtn.dataset.barLiq;
        if (state.myBar.liqueurs.includes(id)) state.myBar.liqueurs = state.myBar.liqueurs.filter(x => x !== id);
        else state.myBar.liqueurs.push(id);
        saveMyBarState();
        renderMyBar();
        return;
      }

      const barPanBtn = e.target.closest('[data-bar-pantry]');
      if (barPanBtn) {
        const id = barPanBtn.dataset.barPantry;
        if (state.myBar.pantry.includes(id)) state.myBar.pantry = state.myBar.pantry.filter(x => x !== id);
        else state.myBar.pantry.push(id);
        saveMyBarState();
        renderMyBar();
        return;
      }
    });

    // Parallax on Hero
    window.addEventListener('scroll', () => {
      if (state.view !== 'home') return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const img = document.getElementById('heroParallaxImg');
      if (img) img.style.transform = `translateY(${Math.min(28, window.scrollY * 0.08)}px) scale(1.04)`;
    }, { passive: true });

    // Init
    window.addEventListener('atlas-ready', () => {
      renderHomeAndCatalog();
      renderGuideTask('cocktails');

      state.myBar = loadMyBarState();
      renderMyBar();

      document.getElementById('barPresetStarter').addEventListener('click', () => {
        state.myBar = { liqueurs: ['cointreau', 'aperol'], pantry: ['prosecco', 'soda', 'lime', 'lemon', 'tequila', 'syrup'] };
        saveMyBarState(); renderMyBar();
      });
      document.getElementById('barPresetAllLiq').addEventListener('click', () => {
        state.myBar.liqueurs = LIQUEURS.map(l => l.id);
        saveMyBarState(); renderMyBar();
      });
      document.getElementById('barPresetClear').addEventListener('click', () => {
        state.myBar = { liqueurs: [], pantry: [] };
        saveMyBarState(); renderMyBar();
      });
      document.getElementById('fOnlyMyBarBtn').addEventListener('click', () => {
        state.onlyMyBar = !state.onlyMyBar;
        const b = document.getElementById('fOnlyMyBarBtn');
        b.classList.toggle('bg-[#1B4D3E]', state.onlyMyBar);
        b.classList.toggle('text-white', state.onlyMyBar);
        b.classList.toggle('bg-[#EEF6F2]', !state.onlyMyBar);
        b.classList.toggle('text-[#1B4D3E]', !state.onlyMyBar);
        renderCocktails();
      });
      document.getElementById('compareSelectAllBtn').addEventListener('click', () => {
        state.selectedCompare = LIQUEURS.map(l => l.id);
        renderCompare();
      });
      document.getElementById('compareCitrusDuelBtn').addEventListener('click', () => {
        state.selectedCompare = ['cointreau', 'bols-triple-sec'];
        renderCompare();
      });
      const teqDuel = document.getElementById('compareTequilaDuelBtn');
      if (teqDuel) teqDuel.addEventListener('click', () => {
        state.selectedCompare = ['olmeca-silver', 'espolon-blanco'];
        renderCompare();
      });
      const whDuel = document.getElementById('compareWhiskeyDuelBtn');
      if (whDuel) whDuel.addEventListener('click', () => {
        state.selectedCompare = ['jim-beam-bourbon', 'jack-daniels'];
        renderCompare();
      });
      document.querySelectorAll('.cmp-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.compareCat = btn.dataset.cmpCat;
          document.querySelectorAll('.cmp-cat-btn').forEach(b => {
            const on = b.dataset.cmpCat === state.compareCat;
            b.className = 'cmp-cat-btn px-3 py-1 rounded-full text-xs font-medium ' + (on ? 'bg-[#1A1816] text-white' : 'bg-[#F2ECE1] text-[#524C46]');
          });
          renderCompareTable();
        });
      });
      document.querySelectorAll('.price-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.priceCat = btn.dataset.priceCat;
          document.querySelectorAll('.price-cat-btn').forEach(b => {
            const on = b.dataset.priceCat === state.priceCat;
            b.className = 'price-cat-btn px-3 py-1 rounded-full text-xs font-medium ' + (on ? 'bg-[#1A1816] text-white' : 'bg-[#F2ECE1] text-[#524C46]');
          });
          renderPrices();
        });
      });
      document.getElementById('barMetricSelect').addEventListener('change', () => {
        renderCompareCharts(LIQUEURS.filter(l => state.selectedCompare.includes(l.id)));
      });

      ['fLiqueur', 'fFlavor', 'fStrength', 'fDifficulty', 'fMethod'].forEach(id => {
        document.getElementById(id).addEventListener('change', renderCocktails);
      });
      document.getElementById('fIngredient').addEventListener('input', renderCocktails);
      document.getElementById('resetCocktailFilters').addEventListener('click', () => {
        ['fLiqueur', 'fFlavor', 'fStrength', 'fDifficulty', 'fMethod'].forEach(id => document.getElementById(id).value = 'all');
        document.getElementById('fIngredient').value = '';
        state.onlyMyBar = false;
        state.onlyFavorites = false;
        const b = document.getElementById('fOnlyMyBarBtn');
        if (b) { b.classList.remove('bg-[#1B4D3E]', 'text-white'); b.classList.add('bg-[#EEF6F2]', 'text-[#1B4D3E]'); }
        const fb = document.getElementById('fOnlyFavBtn');
        if (fb) { fb.classList.remove('bg-[#B8292F]', 'text-white'); fb.classList.add('bg-[#FDF2F2]', 'text-[#B8292F]'); }
        renderCocktails();
      });

      document.getElementById('cocktailModal').addEventListener('click', e => {
        if (e.target.id === 'cocktailModal') closeCocktailModal();
      });
      const lbClose = document.getElementById('lightboxClose');
      if (lbClose) lbClose.addEventListener('click', e => { e.stopPropagation(); closeLightbox(); });
      const lbModal = document.getElementById('lightboxModal');
      if (lbModal) lbModal.addEventListener('click', e => {
        if (e.target.id === 'lightboxModal' || e.target.id === 'lightboxInner') closeLightbox();
      });

      navigateTo('home');
    });

    // ==================== STAGE 5: GRAPHICS, SHELF, STEP POUR, 2D TASTE MAP, SPEAKEASY & PNG MENU ====================

    // 1. Illuminated Bar Shelf Showcase in "My Bar"
    function buildShelfBottleSVG(l) {
      const b = l.bottle3d || { shape: 'round', glassColor: l.accent, liquidColor: l.accent, capColor: '#1A1816', labelBg: '#FAF7F2', labelText: l.shortName };
      const glass = b.glassColor || l.accent;
      const liq = b.liquidColor || l.accent;
      const cap = b.capColor || '#1A1816';
      const lblBg = b.labelBg || '#FAF7F2';
      const isDarkLbl = ['#121214', '#231A15', '#1E4E8C', '#7C1D1A', '#E63950'].includes(lblBg);
      const txtCol = isDarkLbl ? '#FAF7F2' : '#1A1816';
      const isWide = b.shape === 'square' || b.shape === 'flask';
      const bodyW = isWide ? 36 : 28;
      const bodyX = (60 - bodyW) / 2;
      const bodyH = b.shape === 'tall' ? 74 : 66;
      const bodyY = 112 - bodyH;
      return `
        <svg viewBox="0 0 60 116" class="w-12 sm:w-14 h-24 sm:h-28 overflow-visible">
          <defs>
            <linearGradient id="sh_${l.id}" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32"/>
              <stop offset="28%" stop-color="#ffffff" stop-opacity="0.06"/>
              <stop offset="100%" stop-color="#000000" stop-opacity="0.28"/>
            </linearGradient>
          </defs>
          <!-- Cap & Neck -->
          <rect x="24" y="10" width="12" height="10" rx="2" fill="${cap}"/>
          <path d="M25 20 L25 34 Q25 40 ${bodyX} ${bodyY + 8} L${bodyX + bodyW} ${bodyY + 8} Q35 40 35 34 L35 20 Z" fill="${glass}" opacity="0.92"/>
          <!-- Body + Liquid -->
          <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${isWide ? 4 : 8}" fill="${glass}" opacity="0.94"/>
          <rect x="${bodyX + 2}" y="${bodyY + 8}" width="${bodyW - 4}" height="${bodyH - 12}" rx="${isWide ? 3 : 6}" fill="${liq}" opacity="0.65"/>
          <!-- Label -->
          <rect x="${bodyX + 3}" y="${bodyY + 18}" width="${bodyW - 6}" height="28" rx="2.5" fill="${lblBg}" stroke="${l.accent}" stroke-width="1"/>
          <text x="30" y="${bodyY + 35}" text-anchor="middle" font-size="6.2" font-weight="700" font-family="Inter, sans-serif" fill="${txtCol}">${(l.shortName || l.name).slice(0, 9).toUpperCase()}</text>
          <!-- Specular sheen -->
          <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${isWide ? 4 : 8}" fill="url(#sh_${l.id})"/>
          <line x1="${bodyX + 5}" y1="${bodyY + 6}" x2="${bodyX + 5}" y2="${bodyY + bodyH - 8}" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.45"/>
        </svg>`;
    }

    function renderMyBarShelf(ownedLiq) {
      const box = document.getElementById('myBarShelfBottles');
      const cnt = document.getElementById('shelfCountBadge');
      if (!box) return;
      const owned = LIQUEURS.filter(l => ownedLiq.has(l.id));
      if (cnt) {
        const n = owned.length;
        cnt.textContent = `${n} ${n === 1 ? 'бутылка' : (n >= 2 && n <= 4 ? 'бутылки' : 'бутылок')}`;
      }
      if (!owned.length) {
        box.innerHTML = `<div class="w-full text-center py-6 text-xs text-[#C7B9A6]">Полка пока пуста — отметьте бутылки ниже, и они появятся на витрине с подсветкой.</div>`;
        return;
      }
      box.innerHTML = owned.map(l => `
        <button type="button" data-open-detail="${l.id}" title="Открыть обзор ${l.name}" class="shelf-bottle-btn flex flex-col items-center gap-1 shrink-0 group">
          <div class="relative">
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-2.5 rounded-full blur-md opacity-70" style="background:${l.accent};"></div>
            ${buildShelfBottleSVG(l)}
          </div>
          <span class="text-[10px] font-medium text-[#EBDCC8] group-hover:text-white truncate max-w-[66px]">${l.shortName}</span>
        </button>`).join('');
    }

    // 2. Step-by-step Interactive Glass Pouring SVG
    function buildStepAwareGlassSVG(c, curStep, totalSteps) {
      const baseHtml = buildAnimatedGlassSVG(c);
      const ratio = Math.max(0.22, Math.min(1, curStep / Math.max(1, totalSteps)));
      const stepText = (c.steps[curStep - 1] || '').toLowerCase();
      const showGarnish = curStep === totalSteps;
      const garnishLow = (c.garnish || '').toLowerCase();
      let garnishSvg = '';
      if (showGarnish) {
        if (garnishLow.includes('лайм') || garnishLow.includes('мят') || garnishLow.includes('яблок')) {
          garnishSvg = `<g class="ice-float"><circle cx="144" cy="54" r="14" fill="#84B84E" fill-opacity="0.35" stroke="#4A7C2C" stroke-width="2"/><path d="M144 40v28M130 54h28" stroke="#4A7C2C" stroke-width="1.2"/></g>`;
        } else if (garnishLow.includes('апельсин') || garnishLow.includes('грейпфрут') || garnishLow.includes('лимон')) {
          garnishSvg = `<g class="ice-float"><circle cx="144" cy="54" r="15" fill="#F4A261" fill-opacity="0.4" stroke="#D96B27" stroke-width="2"/><path d="M144 39v30M129 54h30" stroke="#D96B27" stroke-width="1.2"/></g>`;
        } else if (garnishLow.includes('вишн') || garnishLow.includes('ягод') || garnishLow.includes('маракуй')) {
          garnishSvg = `<g class="ice-float"><circle cx="138" cy="56" r="8" fill="#A41623" stroke="#590D16" stroke-width="1.5"/><path d="M138 48 Q144 34 156 30" fill="none" stroke="#4A7C2C" stroke-width="1.8" stroke-linecap="round"/></g>`;
        } else {
          garnishSvg = `<g class="ice-float"><path d="M134 48 Q146 38 156 46" fill="none" stroke="#D98B2B" stroke-width="3" stroke-linecap="round"/></g>`;
        }
      }
      // Patch SVG outline class for dark mode + scale liquid rise smoothly by step ratio + inject garnish on final step
      let out = baseHtml.replace(/stroke="#1A1816"/g, 'stroke="#1A1816" class="svg-glass-stroke"');
      out = out.replace('class="pour-rise"', `class="pour-rise" style="transform:scaleY(${ratio.toFixed(2)});"`);
      if (garnishSvg) {
        out = out.replace('</svg>', garnishSvg + '</svg>');
      }
      out = out.replace(
        '<span>Повторить налив ↻</span>',
        `<span>Шаг 1 → ${totalSteps} (налив ${Math.round(ratio * 100)}%) ↻</span>`
      );
      return out;
    }

    // 3. Interactive 2D Taste Map Atlas
    let selectedTasteMapId = 'aperol';
    function renderTasteMap() {
      const svg = document.getElementById('tasteMapSvg');
      const info = document.getElementById('tasteMapInfo');
      const axisSel = document.getElementById('tasteMapAxisSelect');
      if (!svg || !info || !axisSel) return;

      const mode = axisSel.value || 'sweet_bitter';
      const isDark = document.documentElement.classList.contains('speakeasy-mode');
      const axisCol = isDark ? '#5C5349' : '#CFC5B6';
      const txtCol = isDark ? '#ACA296' : '#6B655E';
      const labelCol = isDark ? '#F5EFE6' : '#1A1816';
      const pad = { l: 54, r: 28, t: 28, b: 44 };
      const W = 600, H = 360;
      const plotW = W - pad.l - pad.r;
      const plotH = H - pad.t - pad.b;

      let xLabel, yLabel, getX, getY, xMin, xMax, yMin, yMax, quads;
      if (mode === 'abv_intensity') {
        xLabel = 'Крепость (% ABV) →';
        yLabel = 'Насыщенность вкуса ↑';
        xMin = 8; xMax = 44; yMin = 4; yMax = 10;
        getX = l => l.general.abv;
        getY = l => l.taste.scores.flavorIntensity;
        quads = ['Лёгкие и яркие', 'Крепкие и насыщенные', 'Лёгкие и мягкие', 'Крепкие и чистые'];
      } else if (mode === 'sweet_acidity') {
        xLabel = 'Сладость (1–10) →';
        yLabel = 'Кислотность (1–10) ↑';
        xMin = 0; xMax = 10; yMin = 0; yMax = 10;
        getX = l => l.taste.scores.sweetness;
        getY = l => l.taste.scores.acidity;
        quads = ['Сухие и свежие', 'Кисло-сладкие фруктовые', 'Сухие крепкие', 'Сладкие и плотные'];
      } else {
        xLabel = 'Сладость (1–10) →';
        yLabel = 'Горечь (1–10) ↑';
        xMin = 0; xMax = 10; yMin = 0; yMax = 10;
        getX = l => l.taste.scores.sweetness;
        getY = l => l.taste.scores.bitterness;
        quads = ['Сухие и травяные', 'Горько-сладкие биттеры', 'Чистые крепкие', 'Десертные и сладкие'];
      }

      const mapX = v => pad.l + ((v - xMin) / (xMax - xMin)) * plotW;
      const mapY = v => pad.t + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

      const midX = pad.l + plotW / 2;
      const midY = pad.t + plotH / 2;

      const dots = LIQUEURS.map((l, idx) => {
        // Tiny deterministic jitter so identical coords never completely hide each other
        const jx = ((idx % 3) - 1) * 4;
        const jy = (Math.floor(idx / 5) - 1) * 4;
        const cx = Math.max(pad.l + 10, Math.min(W - pad.r - 10, mapX(getX(l)) + jx));
        const cy = Math.max(pad.t + 10, Math.min(H - pad.b - 10, mapY(getY(l)) + jy));
        const r = 6 + (l.general.abv / 45) * 6;
        const isSel = l.id === selectedTasteMapId;
        return `
          <g class="taste-dot ${isSel ? 'selected-dot' : ''}" data-taste-dot="${l.id}">
            ${isSel ? `<circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="${l.accent}" opacity="0.24"/>` : ''}
            <circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${l.accent}" stroke="${isSel ? labelCol : '#ffffff'}" stroke-width="${isSel ? 2.5 : 1.5}"/>
            <text x="${cx}" y="${cy - r - 4}" text-anchor="middle" font-size="9.5" font-weight="${isSel ? '700' : '600'}" fill="${labelCol}" font-family="Inter, sans-serif">${l.shortName}</text>
          </g>`;
      }).join('');

      svg.innerHTML = `
        <rect x="0" y="0" width="${W}" height="${H}" fill="${isDark ? '#181512' : '#FFFFFF'}"/>
        <!-- Quadrant grid -->
        <line x1="${midX}" y1="${pad.t}" x2="${midX}" y2="${H - pad.b}" stroke="${axisCol}" stroke-dasharray="4 4" stroke-width="1"/>
        <line x1="${pad.l}" y1="${midY}" x2="${W - pad.r}" y2="${midY}" stroke="${axisCol}" stroke-dasharray="4 4" stroke-width="1"/>
        <rect x="${pad.l}" y="${pad.t}" width="${plotW}" height="${plotH}" fill="none" stroke="${axisCol}" stroke-width="1.2"/>
        <!-- Quadrant hints -->
        <text x="${pad.l + 8}" y="${pad.t + 16}" font-size="10" fill="${txtCol}" opacity="0.75">${quads[0]}</text>
        <text x="${W - pad.r - 8}" y="${pad.t + 16}" text-anchor="end" font-size="10" fill="${txtCol}" opacity="0.75">${quads[1]}</text>
        <text x="${pad.l + 8}" y="${H - pad.b - 8}" font-size="10" fill="${txtCol}" opacity="0.75">${quads[2]}</text>
        <text x="${W - pad.r - 8}" y="${H - pad.b - 8}" text-anchor="end" font-size="10" fill="${txtCol}" opacity="0.75">${quads[3]}</text>
        <!-- Axis titles -->
        <text x="${pad.l + plotW / 2}" y="${H - 12}" text-anchor="middle" font-size="11" font-weight="600" fill="${txtCol}">${xLabel}</text>
        <text x="16" y="${pad.t + plotH / 2}" text-anchor="middle" font-size="11" font-weight="600" fill="${txtCol}" transform="rotate(-90 16 ${pad.t + plotH / 2})">${yLabel}</text>
        ${dots}`;

      svg.querySelectorAll('[data-taste-dot]').forEach(g => {
        g.onclick = () => {
          selectedTasteMapId = g.dataset.tasteDot;
          renderTasteMap();
        };
      });

      const cur = getLiqueur(selectedTasteMapId) || LIQUEURS[0];
      const neighbors = LIQUEURS
        .filter(o => o.id !== cur.id)
        .map(o => {
          const s1 = cur.taste.scores, s2 = o.taste.scores;
          const dist = Math.hypot(
            s1.sweetness - s2.sweetness,
            s1.bitterness - s2.bitterness,
            s1.acidity - s2.acidity,
            s1.spiciness - s2.spiciness,
            (cur.general.abv - o.general.abv) / 8
          );
          return { o, dist };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2);

      info.innerHTML = `
        <div class="flex items-center gap-2.5">
          <span class="w-3.5 h-3.5 rounded-full shrink-0" style="background:${cur.accent};"></span>
          <div class="font-serif-ed text-xl font-semibold leading-tight">${cur.name}</div>
        </div>
        <div class="grid grid-cols-3 gap-1.5 text-[11px]">
          <div class="p-2 rounded-lg bg-[#FAF7F2] border border-[#EDE6DA]"><div class="text-[#6B655E]">Крепость</div><b>${cur.general.abv}%</b></div>
          <div class="p-2 rounded-lg bg-[#FAF7F2] border border-[#EDE6DA]"><div class="text-[#6B655E]">Сладость</div><b>${cur.taste.scores.sweetness}/10</b></div>
          <div class="p-2 rounded-lg bg-[#FAF7F2] border border-[#EDE6DA]"><div class="text-[#6B655E]">Горечь</div><b>${cur.taste.scores.bitterness}/10</b></div>
        </div>
        <div class="space-y-1.5 pt-1">
          <div class="text-[10px] uppercase tracking-wider text-[#6B655E] font-semibold">Ближайшие по профилю:</div>
          ${neighbors.map(({ o }) => `
            <button type="button" data-taste-pick="${o.id}" class="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#EDE6DA] flex items-center justify-between hover:border-[#1A1816] text-left">
              <span class="flex items-center gap-1.5 font-medium"><span class="w-2 h-2 rounded-full" style="background:${o.accent};"></span>${o.shortName}</span>
              <span class="text-[10px] text-[#6B655E]">${o.general.abv}% · Сл.${o.taste.scores.sweetness}</span>
            </button>`).join('')}
        </div>
        <button type="button" data-open-detail="${cur.id}" class="w-full py-2 rounded-full bg-[#1A1816] text-[#FAF7F2] text-xs font-semibold hover:opacity-90">Открыть обзор ${cur.shortName} →</button>`;

      info.querySelectorAll('[data-taste-pick]').forEach(b => {
        b.onclick = () => { selectedTasteMapId = b.dataset.tastePick; renderTasteMap(); };
      });
    }

    // 4. Dynamic Ambient Glow
    function setAmbientAccent(hex) {
      const root = document.documentElement;
      if (!hex) {
        const isDark = root.classList.contains('speakeasy-mode');
        root.style.setProperty('--ambient-color', isDark ? 'rgba(217, 155, 82, 0.14)' : 'rgba(184, 99, 47, 0.11)');
        return;
      }
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (m) {
        const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
        const alpha = root.classList.contains('speakeasy-mode') ? 0.22 : 0.15;
        root.style.setProperty('--ambient-color', `rgba(${r}, ${g}, ${b}, ${alpha})`);
      }
    }

    // Wrap navigateTo to sync Ambient Glow with active drink
    window.addEventListener('atlas-navigate', e => {
      const { view, detailId } = e.detail || {};
      if (view === 'detail' && detailId) {
        const l = getLiqueur(detailId);
        setAmbientAccent(l ? l.accent : null);
      } else {
        setAmbientAccent(null);
      }
    });

    // 5. Evening "Speakeasy" Dark Mode Toggle
    const THEME_KEY = 'liqueur_atlas_speakeasy_v1';
    function applySpeakeasyTheme(isDark, rerender) {
      document.documentElement.classList.toggle('speakeasy-mode', isDark);
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', isDark ? '#121110' : '#FAF7F2');
      const lbl = document.getElementById('themeToggleLabel');
      const ico = document.getElementById('themeToggleIcon');
      if (lbl) lbl.textContent = isDark ? 'Журнал' : 'Speakeasy';
      if (ico) ico.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
      if (window.lucide) lucide.createIcons();
      setAmbientAccent(state.view === 'detail' && state.activeLiqueurId ? (getLiqueur(state.activeLiqueurId)?.accent || null) : null);
      if (rerender) {
        if (state.view === 'compare') renderCompare();

      }
    }

    // 6. Guest Bar Menu PNG Generator (1080x1920)
    function renderBarMenuCanvas() {
      const canvas = document.getElementById('barMenuCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = 1080, H = 1920;
      const style = (document.getElementById('barMenuStyleSelect')?.value) || 'speakeasy';
      const title = (document.getElementById('barMenuTitleInput')?.value || 'ДОМАШНИЙ БАР · МЕНЮ ВЕЧЕРА').trim();
      const isDark = style === 'speakeasy';

      const ownedLiq = LIQUEURS.filter(l => state.myBar.liqueurs.includes(l.id));
      const ready = COCKTAILS.filter(c => evaluateCocktailForBar(c).canMakeNow);
      const list = ready.length ? ready.slice(0, 9) : COCKTAILS.filter(c => c.liqueurs.some(id => state.myBar.liqueurs.includes(id))).slice(0, 8);
      const isFallback = ready.length === 0;

      const meta = document.getElementById('barMenuMetaInfo');
      if (meta) meta.textContent = isFallback
        ? `Показаны идеи по вашим бутылкам (${list.length})`
        : `Доступно сейчас: ${ready.length} коктейлей (в карте: ${list.length})`;

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      if (isDark) {
        bgGrad.addColorStop(0, '#181512');
        bgGrad.addColorStop(0.5, '#12100E');
        bgGrad.addColorStop(1, '#1E1712');
      } else {
        bgGrad.addColorStop(0, '#FAF7F2');
        bgGrad.addColorStop(1, '#EFE7DA');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Ambient top glow
      const glow = ctx.createRadialGradient(540, 220, 40, 540, 220, 520);
      glow.addColorStop(0, isDark ? 'rgba(217, 155, 82, 0.20)' : 'rgba(184, 99, 47, 0.10)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Double editorial frame
      ctx.strokeStyle = isDark ? '#D99B52' : '#1A1816';
      ctx.lineWidth = 4;
      ctx.strokeRect(48, 48, W - 96, H - 96);
      ctx.strokeStyle = isDark ? 'rgba(217, 155, 82, 0.35)' : 'rgba(26, 24, 22, 0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(66, 66, W - 132, H - 132);

      // Header
      ctx.textAlign = 'center';
      ctx.fillStyle = isDark ? '#D99B52' : '#B8632F';
      ctx.font = '600 26px Inter, sans-serif';
      ctx.fillText('LIQUEUR & SPIRITS ATLAS', W / 2, 140);

      ctx.fillStyle = isDark ? '#FAF5EC' : '#1A1816';
      ctx.font = 'bold 54px Georgia, serif';
      ctx.fillText(title.slice(0, 34), W / 2, 220);

      ctx.fillStyle = isDark ? '#ACA296' : '#6B655E';
      ctx.font = '500 24px Inter, sans-serif';
      ctx.fillText(isFallback ? 'ПОДБОРКА НА ОСНОВЕ ВАШИХ БУТЫЛОК' : `ДОСТУПНО СЕГОДНЯ · ${ready.length} РЕЦЕПТОВ`, W / 2, 272);

      // Divider
      ctx.strokeStyle = isDark ? 'rgba(217, 155, 82, 0.5)' : '#D7CEC0';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(220, 312); ctx.lineTo(W - 220, 312); ctx.stroke();

      // Cocktails list
      let y = 385;
      const rowStep = list.length > 7 ? 142 : 162;
      ctx.textAlign = 'left';
      list.forEach((c, idx) => {
        const lq = c.mainLiqueur !== 'multi' ? getLiqueur(c.mainLiqueur) : null;
        const dotCol = lq ? lq.accent : '#D99B52';
        ctx.fillStyle = dotCol;
        ctx.beginPath(); ctx.arc(118, y - 12, 9, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = isDark ? '#FAF5EC' : '#1A1816';
        ctx.font = 'bold 38px Georgia, serif';
        ctx.fillText(`${idx + 1}. ${c.name}`, 144, y);

        ctx.textAlign = 'right';
        ctx.fillStyle = isDark ? '#D99B52' : '#B8632F';
        ctx.font = '600 26px Inter, sans-serif';
        ctx.fillText(`~${c.abv}% ABV`, W - 110, y - 4);

        ctx.textAlign = 'left';
        const ingLine = c.ingredients.map(i => i.name.split('(')[0].trim()).slice(0, 4).join(' · ');
        ctx.fillStyle = isDark ? '#C5BBB0' : '#524C46';
        ctx.font = '400 23px Inter, sans-serif';
        ctx.fillText(ingLine.slice(0, 62), 144, y + 36);

        ctx.fillStyle = isDark ? '#8C8378' : '#7A736B';
        ctx.font = 'italic 21px Georgia, serif';
        ctx.fillText(`${c.glass} · ${c.method}`, 144, y + 68);

        if (idx < list.length - 1) {
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,24,22,0.08)';
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(110, y + 96); ctx.lineTo(W - 110, y + 96); ctx.stroke();
        }
        y += rowStep;
      });

      // Footer: bottles in bar
      ctx.textAlign = 'center';
      ctx.strokeStyle = isDark ? 'rgba(217, 155, 82, 0.45)' : '#D7CEC0';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(140, H - 220); ctx.lineTo(W - 140, H - 220); ctx.stroke();

      ctx.fillStyle = isDark ? '#D99B52' : '#B8632F';
      ctx.font = '600 22px Inter, sans-serif';
      ctx.fillText(`НА ПОЛКЕ БАРА (${ownedLiq.length})`, W / 2, H - 175);

      const bottleNames = ownedLiq.length ? ownedLiq.map(l => l.shortName).join(' · ') : 'Выберите бутылки в разделе «Мой бар»';
      ctx.fillStyle = isDark ? '#E5DDD0' : '#3E3934';
      ctx.font = '400 22px Inter, sans-serif';
      ctx.fillText(bottleNames.slice(0, 74), W / 2, H - 132);
      if (bottleNames.length > 74) {
        ctx.fillText(bottleNames.slice(74, 148), W / 2, H - 98);
      }
    }

    function openBarMenuModal() {
      const m = document.getElementById('barMenuModal');
      if (!m) return;
      const sel = document.getElementById('barMenuStyleSelect');
      if (sel) sel.value = document.documentElement.classList.contains('speakeasy-mode') ? 'speakeasy' : 'editorial';
      renderBarMenuCanvas();
      m.classList.remove('hidden');
      m.classList.add('flex');
      if (window.lucide) lucide.createIcons();
    }

    function closeBarMenuModal() {
      const m = document.getElementById('barMenuModal');
      if (!m) return;
      m.classList.add('hidden');
      m.classList.remove('flex');
    }

    // Stage 5 Event Wiring on DOMContentLoaded
    window.addEventListener('atlas-ready', () => {
      // Restore Speakeasy preference
      try {
        if (localStorage.getItem(THEME_KEY) === '1') applySpeakeasyTheme(true, false);
      } catch (e) {}

      const themeBtn = document.getElementById('themeToggleBtn');
      if (themeBtn) {
        themeBtn.addEventListener('click', () => {
          const next = !document.documentElement.classList.contains('speakeasy-mode');
          try { localStorage.setItem(THEME_KEY, next ? '1' : '0'); } catch (e) {}
          applySpeakeasyTheme(next, true);
          showToast(next ? 'Вечерний режим Speakeasy включён' : 'Светлый журнальный режим включён');
        });
      }

      const tasteSel = document.getElementById('tasteMapAxisSelect');
      if (tasteSel) tasteSel.addEventListener('change', renderTasteMap);

      const openMenuBtn = document.getElementById('openBarMenuBtn');
      if (openMenuBtn) openMenuBtn.addEventListener('click', openBarMenuModal);
      const closeMenuBtn = document.getElementById('closeBarMenuBtn');
      if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeBarMenuModal);
      const barMenuModal = document.getElementById('barMenuModal');
      if (barMenuModal) barMenuModal.addEventListener('click', e => { if (e.target.id === 'barMenuModal') closeBarMenuModal(); });
      const titleInp = document.getElementById('barMenuTitleInput');
      if (titleInp) titleInp.addEventListener('input', renderBarMenuCanvas);
      const styleSel = document.getElementById('barMenuStyleSelect');
      if (styleSel) styleSel.addEventListener('change', renderBarMenuCanvas);
      const dlBtn = document.getElementById('downloadBarMenuPngBtn');
      if (dlBtn) {
        dlBtn.addEventListener('click', () => {
          const canvas = document.getElementById('barMenuCanvas');
          if (!canvas) return;
          const a = document.createElement('a');
          a.download = 'liqueur-atlas-bar-menu.png';
          a.href = canvas.toDataURL('image/png');
          a.click();
          showToast('Барная карта PNG сохранена ✓');
        });
      }
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBarMenuModal(); });
    });


    // ==================== STAGE 6: BARTENDER MODE, DILUTION, SHOPPING LIST, PARTY PLANNER, JOURNAL, ROULETTE & PWA ====================
    state.unitMode = 'ml';
    state.onlyFavorites = false;

    // 1. Dilution & Real Served ABV Calculator
    function calcDilutionStats(c) {
      const m = (c.method || 'Build').toLowerCase();
      let dilPct = 14, label = 'Лёд в бокале (Build)';
      if (m.includes('shake')) { dilPct = 28; label = 'Шейк со льдом (~28% воды)'; }
      else if (m.includes('stir')) { dilPct = 20; label = 'Стир в стакане (~20% воды)'; }
      else if (m.includes('blend')) { dilPct = 35; label = 'Блендер со льдом (~35% воды)'; }
      const rawAbv = Number(c.abv) || 15;
      const servedAbv = Math.max(3, Math.round((rawAbv / (1 + dilPct / 100)) * 10) / 10);
      return { rawAbv, dilPct, servedAbv, label };
    }

    function renderDilutionCard(c) {
      const d = calcDilutionStats(c);
      return `
        <div class="p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full bg-white border border-[#D7CEC0] font-semibold">Таяние льда: +${d.dilPct}%</span>
            <span class="text-[#6B655E]">${d.label}</span>
          </div>
          <div class="font-medium text-[#1A1816]">База ~${d.rawAbv}% → В бокале <b>~${d.servedAbv}% ABV</b></div>
        </div>`;
    }

    // 2. Tasting Journal & Favorites (localStorage)
    const JOURNAL_KEY = 'liqueur_atlas_journal_v1';
    let journalData = {};
    try { journalData = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '{}') || {}; } catch (e) { journalData = {}; }
    function saveJournal() { try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(journalData)); } catch (e) {} }
    function getJournal(id) { return journalData[id] || { fav: false, made: false, stars: 0, note: '' }; }
    function isCocktailFav(id) { return !!(journalData[id] && journalData[id].fav); }

    function renderCardJournalBadges(id) {
      const j = getJournal(id);
      const parts = [];
      if (j.fav) parts.push('<span class="text-[#C81E2B] text-xs" title="В избранном">♥</span>');
      if (j.made) parts.push('<span class="text-[#1B4D3E] text-[10px] font-bold" title="Уже готовил">✓</span>');
      if (j.stars > 0) parts.push(`<span class="text-[#D49B1A] text-[10px] font-bold">★${j.stars}</span>`);
      return parts.length ? `<div class="flex items-center gap-1">${parts.join('')}</div>` : '';
    }

    function renderJournalModalBox(id) {
      const j = getJournal(id);
      return `
        <div class="p-4 rounded-2xl bg-white border border-[#E5DDD0] space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-xs uppercase tracking-wider font-semibold text-[#6B655E]">Личный дневник дегустации</div>
            <div class="flex items-center gap-1.5">
              <button type="button" id="jFavBtn" class="px-3 py-1 rounded-full text-xs font-medium border transition-colors ${j.fav ? 'bg-[#C81E2B] text-white border-[#C81E2B]' : 'bg-[#FAF7F2] border-[#D7CEC0]'}">${j.fav ? '♥ В избранном' : '♡ В избранное'}</button>
              <button type="button" id="jMadeBtn" class="px-3 py-1 rounded-full text-xs font-medium border transition-colors ${j.made ? 'bg-[#1B4D3E] text-white border-[#1B4D3E]' : 'bg-[#FAF7F2] border-[#D7CEC0]'}">${j.made ? '✓ Уже готовил' : '+ Отметить'}</button>
            </div>
          </div>
          <div class="flex items-center gap-1.5 text-sm">
            <span class="text-[11px] text-[#6B655E] mr-1">Моя оценка:</span>
            ${[1,2,3,4,5].map(n => `<button type="button" data-j-star="${n}" class="text-lg leading-none ${n <= j.stars ? 'text-[#D49B1A]' : 'text-[#D7CEC0]'}">★</button>`).join('')}
          </div>
          <textarea id="jNoteInput" rows="2" placeholder="Личная заметка (например: меньше сиропа, добавить щепотку соли)..." class="w-full text-xs bg-[#FAF7F2] border border-[#D7CEC0] rounded-xl p-2.5 focus:outline-none focus:border-[#1A1816]">${(j.note || '').replace(/</g, '&lt;')}</textarea>
        </div>`;
    }

    function bindJournalModalEvents(c, servings, curStep) {
      const favBtn = document.getElementById('jFavBtn');
      const madeBtn = document.getElementById('jMadeBtn');
      const noteInp = document.getElementById('jNoteInput');
      if (favBtn) favBtn.onclick = () => {
        const j = { ...getJournal(c.id), fav: !getJournal(c.id).fav };
        journalData[c.id] = j; saveJournal();
        renderCocktailModalContent(c, servings, curStep);
        renderCocktails();
      };
      if (madeBtn) madeBtn.onclick = () => {
        const j = { ...getJournal(c.id), made: !getJournal(c.id).made };
        journalData[c.id] = j; saveJournal();
        renderCocktailModalContent(c, servings, curStep);
        renderCocktails();
      };
      document.querySelectorAll('[data-j-star]').forEach(b => {
        b.onclick = () => {
          const stars = parseInt(b.dataset.jStar, 10);
          journalData[c.id] = { ...getJournal(c.id), stars }; saveJournal();
          renderCocktailModalContent(c, servings, curStep);
          renderCocktails();
        };
      });
      if (noteInp) noteInp.oninput = () => {
        journalData[c.id] = { ...getJournal(c.id), note: noteInp.value }; saveJournal();
      };
    }

    // 3. Bartender Fullscreen Mode + Shake/Stir Timer with Web Audio Chime
    let btTimerInt = null;
    let btSecondsLeft = 12;
    let btRunning = false;

    function playBartenderChime() {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.55);
      } catch (e) {}
    }

    function stopBartenderTimer() {
      if (btTimerInt) { clearInterval(btTimerInt); btTimerInt = null; }
      btRunning = false;
    }

    function openBartenderMode(c, servings) {
      stopBartenderTimer();
      const m = (c.method || 'Shake').toLowerCase();
      btSecondsLeft = m.includes('stir') ? 25 : (m.includes('blend') ? 15 : 12);
      const modal = document.getElementById('bartenderModal');
      const body = document.getElementById('bartenderModalBody');
      if (!modal || !body) return;

      body.innerHTML = `
        <div class="flex items-center justify-between gap-2 border-b border-[#3A332B] pb-4">
          <div>
            <div class="text-[11px] uppercase tracking-[0.18em] text-[#D99B52]">Режим бармена · ${c.method} · ${servings} порц.</div>
            <h3 class="font-serif-ed text-3xl sm:text-4xl font-semibold text-white mt-0.5">${c.name}</h3>
          </div>
          <button type="button" id="closeBartenderBtn" class="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl">✕</button>
        </div>

        <!-- Timer Box -->
        <div class="p-4 sm:p-5 rounded-2xl bg-[#121110] border border-[#D99B52]/35 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="text-center sm:text-left">
            <div class="text-[11px] uppercase tracking-wider text-[#ACA296]">Таймер шейка / стира</div>
            <div id="btTimerDisplay" class="font-serif-ed text-5xl font-bold text-[#F2C572] tabular-nums">00:${String(btSecondsLeft).padStart(2, '0')}</div>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <button type="button" data-bt-preset="12" class="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs">Shake 12с</button>
            <button type="button" data-bt-preset="25" class="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs">Stir 25с</button>
            <button type="button" id="btStartPauseBtn" class="px-5 py-2.5 rounded-full bg-[#D99B52] text-[#141210] text-sm font-bold hover:opacity-90">Старт ▶</button>
            <button type="button" id="btResetBtn" class="px-3.5 py-2.5 rounded-full border border-white/20 text-xs">Сброс</button>
          </div>
        </div>

        <!-- Big Tap-to-Check Ingredients -->
        <div class="space-y-2.5">
          <div class="text-xs uppercase tracking-wider text-[#ACA296] font-semibold">Ингредиенты (нажимайте, чтобы отмечать)</div>
          <div class="grid sm:grid-cols-2 gap-2.5">
            ${c.ingredients.map((ing, i) => `
              <button type="button" data-bt-ing="${i}" class="p-3.5 rounded-2xl bg-[#26221D] border border-[#3A332B] text-left flex items-center justify-between gap-3 transition-all">
                <span class="text-base font-medium text-[#FAF5EC]">${ing.name}</span>
                <span class="text-base font-bold text-[#F2C572] shrink-0">${formatScaledAmount(ing.amount, servings)}</span>
              </button>`).join('')}
          </div>
        </div>

        <!-- Big Steps -->
        <div class="space-y-2.5">
          <div class="text-xs uppercase tracking-wider text-[#ACA296] font-semibold">Шаги приготовления · Бокал: ${c.glass}</div>
          <ol class="space-y-2.5">
            ${c.steps.map((s, idx) => `
              <li class="p-3.5 rounded-2xl bg-[#26221D]/70 border border-[#35302A] text-base leading-relaxed flex gap-3">
                <span class="w-7 h-7 rounded-full bg-[#D99B52] text-[#141210] font-bold text-sm flex items-center justify-center shrink-0">${idx + 1}</span>
                <span>${s}</span>
              </li>`).join('')}
          </ol>
        </div>`;

      const disp = document.getElementById('btTimerDisplay');
      const spBtn = document.getElementById('btStartPauseBtn');
      const syncDisp = () => {
        if (disp) disp.textContent = `00:${String(Math.max(0, btSecondsLeft)).padStart(2, '0')}`;
      };
      document.getElementById('closeBartenderBtn').onclick = () => {
        stopBartenderTimer();
        modal.classList.add('hidden'); modal.classList.remove('flex');
      };
      document.querySelectorAll('[data-bt-preset]').forEach(b => {
        b.onclick = () => {
          stopBartenderTimer();
          btSecondsLeft = parseInt(b.dataset.btPreset, 10);
          syncDisp();
          if (spBtn) spBtn.textContent = 'Старт ▶';
        };
      });
      document.getElementById('btResetBtn').onclick = () => {
        stopBartenderTimer();
        btSecondsLeft = m.includes('stir') ? 25 : 12;
        syncDisp();
        if (spBtn) spBtn.textContent = 'Старт ▶';
      };
      spBtn.onclick = () => {
        if (btRunning) {
          stopBartenderTimer();
          spBtn.textContent = 'Продолжить ▶';
        } else {
          if (btSecondsLeft <= 0) btSecondsLeft = 12;
          btRunning = true;
          spBtn.textContent = 'Пауза ⏸';
          btTimerInt = setInterval(() => {
            btSecondsLeft--;
            syncDisp();
            if (btSecondsLeft <= 0) {
              stopBartenderTimer();
              playBartenderChime();
              spBtn.textContent = 'Готово! ↻';
              showToast('Таймер завершён — можно процеживать! 🍸');
            }
          }, 1000);
        }
      };
      body.querySelectorAll('[data-bt-ing]').forEach(btn => {
        btn.onclick = () => {
          btn.classList.toggle('opacity-45');
          btn.classList.toggle('line-through');
          btn.classList.toggle('border-[#6ED4B0]');
        };
      });

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    // 4. Smart Shopping List (Умный список покупок)
    let checkedShoppingItems = new Set();
    function renderSmartShoppingList(almostList) {
      const grid = document.getElementById('smartShoppingGrid');
      if (!grid) return;
      const counts = {};
      almostList.forEach(({ c, eval: ev }) => {
        const miss = (ev.missing && ev.missing[0]) ? ev.missing[0].trim() : null;
        if (!miss) return;
        if (!counts[miss]) counts[miss] = [];
        counts[miss].push(c.name);
      });
      const ranked = Object.entries(counts).sort((a, b) => b[1].length - a[1].length).slice(0, 9);
      if (!ranked.length) {
        grid.innerHTML = `<div class="col-span-full text-xs text-[#6B655E] p-4 rounded-xl bg-[#FAF7F2] border border-[#EDE6DA]">Отметьте хотя бы пару бутылок выше — здесь появятся самые выгодные покупки, открывающие новые коктейли.</div>`;
        return;
      }
      grid.innerHTML = ranked.map(([item, names]) => {
        const checked = checkedShoppingItems.has(item);
        return `
          <button type="button" data-shop-item="${item.replace(/"/g, '&quot;')}" class="p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${checked ? 'bg-[#EEF6F2] border-[#1B4D3E]' : 'bg-[#FAF7F2] border-[#E5DDD0] hover:border-[#1A1816]'}">
            <span class="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${checked ? 'bg-[#1B4D3E] text-white' : 'bg-white border border-[#D7CEC0]'}">${checked ? '✓' : ''}</span>
            <div class="min-w-0">
              <div class="text-xs font-semibold truncate">${item}</div>
              <div class="text-[11px] text-[#1B4D3E] font-medium">Откроет +${names.length} кокт.</div>
              <div class="text-[10px] text-[#6B655E] truncate">${names.slice(0, 2).join(', ')}</div>
            </div>
          </button>`;
      }).join('');

      grid.querySelectorAll('[data-shop-item]').forEach(btn => {
        btn.onclick = () => {
          const k = btn.dataset.shopItem;
          if (checkedShoppingItems.has(k)) checkedShoppingItems.delete(k);
          else checkedShoppingItems.add(k);
          renderSmartShoppingList(almostList);
        };
      });
    }

    // 5. Party Planner Modal
    let partySelectedIds = ['aperol-spritz', 'negroni-classic', 'mojito-classic', 'margarita'];
    function renderPartyPlanner() {
      const picker = document.getElementById('partyCocktailPicker');
      const out = document.getElementById('partyPlanOutput');
      if (!picker || !out) return;

      const guests = Math.max(2, parseInt(document.getElementById('partyGuests')?.value || '6', 10));
      const hours = Math.max(1, parseInt(document.getElementById('partyHours')?.value || '3', 10));
      const rate = Math.max(0.5, parseFloat(document.getElementById('partyRate')?.value || '1.5'));
      const totalDrinks = Math.round(guests * hours * rate);

      picker.innerHTML = COCKTAILS.map(c => {
        const on = partySelectedIds.includes(c.id);
        return `<button type="button" data-party-cock="${c.id}" class="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${on ? 'bg-[#1A1816] text-white border-[#1A1816]' : 'bg-[#FAF7F2] text-[#524C46] border-[#E5DDD0] hover:border-[#1A1816]'}">${on ? '✓ ' : ''}${c.name}</button>`;
      }).join('');

      picker.querySelectorAll('[data-party-cock]').forEach(b => {
        b.onclick = () => {
          const id = b.dataset.partyCock;
          if (partySelectedIds.includes(id)) {
            if (partySelectedIds.length > 1) partySelectedIds = partySelectedIds.filter(x => x !== id);
          } else if (partySelectedIds.length < 6) {
            partySelectedIds.push(id);
          }
          renderPartyPlanner();
        };
      });

      const chosen = COCKTAILS.filter(c => partySelectedIds.includes(c.id));
      const perCock = Math.max(1, Math.round(totalDrinks / Math.max(1, chosen.length)));
      const iceKg = Math.max(1, Math.round((totalDrinks * 0.18 + guests * 0.25) * 10) / 10);

      const ingTotals = {};
      let estCost = 0;
      chosen.forEach(c => {
        const calc = calcCocktailCostAndVolume(c, perCock);
        estCost += calc.totalCost;
        c.ingredients.forEach(ing => {
          const p = parseAmount(ing.amount);
          const key = ing.name.split('(')[0].trim();
          if (p.type === 'single' && p.unit === 'мл') {
            ingTotals[key] = (ingTotals[key] || 0) + Math.round(p.val * perCock);
          }
        });
      });

      const rows = Object.entries(ingTotals).sort((a, b) => b[1] - a[1]);
      out.innerHTML = `
        <div class="grid grid-cols-3 gap-2.5">
          <div class="p-3 rounded-2xl bg-white border border-[#E5DDD0]">
            <div class="text-[10px] uppercase text-[#6B655E]">Всего порций</div>
            <div class="font-serif-ed text-2xl font-bold">${totalDrinks}</div>
            <div class="text-[10px] text-[#6B655E]">~${perCock} на рецепт</div>
          </div>
          <div class="p-3 rounded-2xl bg-[#EEF6F2] border border-[#C6E0D3]">
            <div class="text-[10px] uppercase text-[#1B4D3E]">Лёд (запас)</div>
            <div class="font-serif-ed text-2xl font-bold text-[#1B4D3E]">${iceKg} кг</div>
            <div class="text-[10px] text-[#1B4D3E]">кубики + шейк</div>
          </div>
          <div class="p-3 rounded-2xl bg-[#FBF5E6] border border-[#E7D3A3]">
            <div class="text-[10px] uppercase text-[#855A0C]">Ориентир бюджета</div>
            <div class="font-serif-ed text-2xl font-bold text-[#855A0C]">~${estCost.toLocaleString('ru-RU')} ₽</div>
            <div class="text-[10px] text-[#855A0C]">~${Math.round(estCost / guests)} ₽/гость</div>
          </div>
        </div>
        <div class="p-4 rounded-2xl bg-white border border-[#E5DDD0] space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div class="text-xs font-semibold uppercase tracking-wider text-[#6B655E]">Список закупки по объёму</div>
            <button type="button" id="copyPartyPlanBtn" class="px-3 py-1 rounded-full bg-[#1A1816] text-[#FAF7F2] text-[11px] font-medium">Скопировать план</button>
          </div>
          <div class="divide-y divide-[#EDE6DA] text-xs max-h-48 overflow-y-auto">
            ${rows.map(([name, ml]) => {
              const bottles = Math.ceil(ml / 700);
              const vol = ml >= 1000 ? `${(ml/1000).toFixed(2)} л` : `${ml} мл`;
              return `<div class="py-1.5 flex items-center justify-between gap-2">
                <span class="font-medium">${name}</span>
                <span class="text-[#6B655E]"><b>${vol}</b> (${bottles} бут. 0,7 л)</span>
              </div>`;
            }).join('')}
          </div>
        </div>`;

      const cpBtn = document.getElementById('copyPartyPlanBtn');
      if (cpBtn) cpBtn.onclick = () => {
        const lines = [
          `План вечеринки (${guests} гостей, ${hours} ч · ${totalDrinks} коктейлей · лёд ${iceKg} кг · ~${estCost} ₽)`,
          `Меню: ${chosen.map(c => c.name).join(', ')}`,
          ...rows.map(([n, ml]) => `• ${n}: ${ml} мл (~${Math.ceil(ml/700)} бут. 0,7 л)`)
        ];
        copyTextSafe(lines.join('\n'));
      };
    }

    // 6. Bartender Roulette
    let rouletteScope = 'bar';
    let roulettePicked = null;
    function openRouletteModal() {
      const m = document.getElementById('rouletteModal');
      if (!m) return;
      m.classList.remove('hidden'); m.classList.add('flex');
      if (window.lucide) lucide.createIcons();
    }
    function spinRoulette() {
      const box = document.getElementById('rouletteSlotBox');
      const openBtn = document.getElementById('openRouletteResultBtn');
      let pool = rouletteScope === 'bar'
        ? COCKTAILS.filter(c => evaluateCocktailForBar(c).canMakeNow)
        : COCKTAILS;
      if (!pool.length) {
        pool = COCKTAILS.filter(c => c.liqueurs.some(id => state.myBar.liqueurs.includes(id)));
      }
      if (!pool.length) pool = COCKTAILS;
      if (openBtn) openBtn.classList.add('hidden');

      let step = 0;
      const totalTicks = 14;
      const tick = () => {
        const pick = pool[Math.floor(Math.random() * pool.length)];
        step++;
        if (box) {
          box.innerHTML = `
            <div class="text-[10px] uppercase tracking-wider text-[#B8632F]">${pick.status} · ${pick.method}</div>
            <div class="font-serif-ed text-2xl sm:text-3xl font-bold">${pick.name}</div>
            <div class="text-xs text-[#6B655E]">${pick.flavor}</div>`;
        }
        if (step < totalTicks) {
          setTimeout(tick, 45 + step * 14);
        } else {
          roulettePicked = pick;
          if (openBtn) openBtn.classList.remove('hidden');
        }
      };
      tick();
    }

    // Stage 6 Event Wiring & Service Worker PWA Registration
    window.addEventListener('atlas-ready', () => {
      const favBtn = document.getElementById('fOnlyFavBtn');
      if (favBtn) {
        favBtn.addEventListener('click', () => {
          state.onlyFavorites = !state.onlyFavorites;
          favBtn.classList.toggle('bg-[#B8292F]', state.onlyFavorites);
          favBtn.classList.toggle('text-white', state.onlyFavorites);
          favBtn.classList.toggle('bg-[#FDF2F2]', !state.onlyFavorites);
          favBtn.classList.toggle('text-[#B8292F]', !state.onlyFavorites);
          renderCocktails();
        });
      }

      const cpShop = document.getElementById('copyShoppingListBtn');
      if (cpShop) {
        cpShop.addEventListener('click', () => {
          const items = checkedShoppingItems.size
            ? [...checkedShoppingItems]
            : [...document.querySelectorAll('[data-shop-item]')].slice(0, 5).map(b => b.dataset.shopItem);
          if (!items.length) { showToast('Список покупок пока пуст'); return; }
          copyTextSafe('Список покупок для бара:\n' + items.map(i => `• ${i}`).join('\n'));
        });
      }

      document.querySelectorAll('[data-open-party]').forEach(b => b.addEventListener('click', () => {
        renderPartyPlanner();
        const m = document.getElementById('partyPlannerModal');
        if (m) { m.classList.remove('hidden'); m.classList.add('flex'); if (window.lucide) lucide.createIcons(); }
      }));
      const closePartyModal = () => {
        const m = document.getElementById('partyPlannerModal');
        if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
      };
      const closeParty = document.getElementById('closePartyModalBtn');
      if (closeParty) closeParty.addEventListener('click', closePartyModal);
      const pmEl = document.getElementById('partyPlannerModal');
      if (pmEl) pmEl.addEventListener('click', e => { if (e.target.id === 'partyPlannerModal') closePartyModal(); });
      ['partyGuests', 'partyHours', 'partyRate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', renderPartyPlanner);
      });

      document.querySelectorAll('[data-open-roulette]').forEach(b => b.addEventListener('click', openRouletteModal));
      const closeRouletteModal = () => {
        const m = document.getElementById('rouletteModal');
        if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
      };
      const closeR = document.getElementById('closeRouletteBtn');
      if (closeR) closeR.addEventListener('click', closeRouletteModal);
      const rmEl = document.getElementById('rouletteModal');
      if (rmEl) rmEl.addEventListener('click', e => { if (e.target.id === 'rouletteModal') closeRouletteModal(); });
      const rBar = document.getElementById('rouletteScopeBar');
      const rAll = document.getElementById('rouletteScopeAll');
      if (rBar && rAll) {
        rBar.onclick = () => { rouletteScope = 'bar'; rBar.className = 'px-3 py-1.5 rounded-full font-medium bg-[#1A1816] text-white'; rAll.className = 'px-3 py-1.5 rounded-full font-medium bg-[#F2ECE1] text-[#524C46]'; };
        rAll.onclick = () => { rouletteScope = 'all'; rAll.className = 'px-3 py-1.5 rounded-full font-medium bg-[#1A1816] text-white'; rBar.className = 'px-3 py-1.5 rounded-full font-medium bg-[#F2ECE1] text-[#524C46]'; };
      }
      const spinBtn = document.getElementById('spinRouletteBtn');
      if (spinBtn) spinBtn.addEventListener('click', spinRoulette);
      const openRBtn = document.getElementById('openRouletteResultBtn');
      if (openRBtn) openRBtn.addEventListener('click', () => {
        if (!roulettePicked) return;
        const m = document.getElementById('rouletteModal');
        if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
        openCocktailModal(roulettePicked.id);
      });

      // PWA Service Worker registration (only on http/https, e.g. GitHub Pages)
      if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      }
    });


    // ==================== STAGE 7: WEBGL LIQUID LIGHT SHADER, GSAP + LENIS, VANILLATILT & COCKTAIL PARTICLES ====================

    // 1. WebGL Fragment Shader "Liquid Light" Background
    let glUniformColor = [0.72, 0.39, 0.18];
    let glTargetColor = [0.72, 0.39, 0.18];

    function initWebGLLiquidLight() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const canvas = document.getElementById('webglAmbientCanvas');
      if (!canvas) return;
      const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
      if (!gl) return;

      const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;
      const fs = `
        precision mediump float;
        uniform vec2 u_res;
        uniform float u_time;
        uniform vec3 u_col;
        uniform float u_dark;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }
        float fbm(vec2 p) {
          float v = 0.0; float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = p * 2.02 + vec2(1.7, 9.2);
            a *= 0.5;
          }
          return v;
        }
        void main() {
          vec2 uv = gl_FragCoord.xy / u_res;
          float t = u_time * 0.14;
          vec2 q = vec2(fbm(uv * 2.4 + vec2(t, -t * 0.6)), fbm(uv * 2.4 + vec2(-t * 0.5, t * 0.8)));
          float f = fbm(uv * 2.6 + q * 1.45);
          float caustic = smoothstep(0.32, 0.88, f);
          // Soft warm bokeh orbs
          float b1 = exp(-pow(length(uv - vec2(0.2 + sin(t)*0.08, 0.75 + cos(t*0.8)*0.06)) * 3.4, 2.0));
          float b2 = exp(-pow(length(uv - vec2(0.82 + cos(t*0.7)*0.07, 0.28 + sin(t*0.9)*0.07)) * 3.8, 2.0));
          float lightField = clamp(caustic * 0.72 + (b1 + b2) * 0.55, 0.0, 1.0);
          vec3 base = mix(vec3(0.98, 0.968, 0.949), vec3(0.07, 0.066, 0.062), u_dark);
          vec3 glow = mix(u_col, vec3(0.96, 0.78, 0.46), 0.4);
          float alpha = lightField * mix(0.15, 0.30, u_dark);
          gl_FragColor = vec4(mix(base, glow, lightField), alpha);
        }
      `;
      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prog);
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const uRes = gl.getUniformLocation(prog, 'u_res');
      const uTime = gl.getUniformLocation(prog, 'u_time');
      const uCol = gl.getUniformLocation(prog, 'u_col');
      const uDark = gl.getUniformLocation(prog, 'u_dark');

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
        canvas.width = Math.max(1, Math.floor(window.innerWidth * 0.5 * dpr));
        canvas.height = Math.max(1, Math.floor(window.innerHeight * 0.5 * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
      };
      resize();
      window.addEventListener('resize', resize, { passive: true });

      const start = performance.now();
      let paused = false;
      document.addEventListener('visibilitychange', () => { paused = document.hidden; });

      let lastFrameTs = 0;
      function frame(now) {
        requestAnimationFrame(frame);
        if (paused || now - lastFrameTs < 32) return;
        lastFrameTs = now;
        for (let i = 0; i < 3; i++) glUniformColor[i] += (glTargetColor[i] - glUniformColor[i]) * 0.08;
        const isDark = document.documentElement.classList.contains('speakeasy-mode') ? 1.0 : 0.0;
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, (now - start) * 0.001);
        gl.uniform3f(uCol, glUniformColor[0], glUniformColor[1], glUniformColor[2]);
        gl.uniform1f(uDark, isDark);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      requestAnimationFrame(frame);
    }

    // Sync WebGL shader color with setAmbientAccent
    if (typeof setAmbientAccent === 'function') {
      const _origAmb = setAmbientAccent;
      setAmbientAccent = function(hex) {
        _origAmb(hex);
        const m = hex && /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (m) {
          glTargetColor = [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
        } else {
          glTargetColor = [0.76, 0.45, 0.22];
        }
      };
    }

    // 2. VanillaTilt 3D Glare Cards Helper
    function bindTiltCards() {
      if (typeof VanillaTilt === 'undefined') return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const cards = document.querySelectorAll('#homeLiqueurGrid article, #catalogGrid article, #cocktailsGrid article');
      cards.forEach(card => {
        if (card.vanillaTilt) return;
        card.classList.add('tilt-card');
        VanillaTilt.init(card, {
          max: 6,
          speed: 450,
          glare: true,
          'max-glare': 0.16,
          scale: 1.015,
          gyroscope: false
        });
      });
    }

    // 3. GSAP Staggered Editorial Transitions
    function animateViewWithGSAP(viewId) {
      if (typeof gsap === 'undefined') return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const sec = document.getElementById('view-' + viewId);
      if (!sec) return;
      const items = sec.querySelectorAll('.card-ed, article');
      if (!items.length) return;
      gsap.fromTo(
        Array.from(items).slice(0, 12),
        { y: 18, opacity: 0.01 },
        { y: 0, opacity: 1, duration: 0.42, stagger: 0.03, ease: 'power3.out', clearProps: 'transform,opacity' }
      );
    }

    // 4. Live Cocktail Atmospheric Particles (Sparkling Bokeh / Oak Smoke)
    let cocktailFxRaf = 0;
    function attachCocktailParticles(c) {
      if (cocktailFxRaf) { cancelAnimationFrame(cocktailFxRaf); cocktailFxRaf = 0; }
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const holder = document.getElementById('animatedGlassHolder');
      if (!holder) return;
      const box = holder.firstElementChild;
      if (!box) return;

      const lowIngs = (c.ingredients || []).map(i => i.name.toLowerCase()).join(' ');
      const isSparkling = /просекко|prosecco|шампан|брют|содов|тоник|кола|имбирн|газир/.test(lowIngs);
      const isSmoky = !isSparkling && (c.strengthTag === 'strong' || /виски|бурбон|campari|negroni|manhattan|old fashioned/.test((c.name + ' ' + lowIngs).toLowerCase()));
      if (!isSparkling && !isSmoky) return;

      const cvs = document.createElement('canvas');
      cvs.className = 'absolute inset-0 w-full h-full pointer-events-none z-0';
      box.style.position = 'relative';
      box.insertBefore(cvs, box.firstChild);
      const ctx = cvs.getContext('2d');
      const W = cvs.width = 420;
      const H = cvs.height = 220;

      const parts = Array.from({ length: isSparkling ? 26 : 12 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: isSparkling ? (1.5 + Math.random() * 4.5) : (18 + Math.random() * 34),
        vy: isSparkling ? -(0.35 + Math.random() * 0.75) : -(0.18 + Math.random() * 0.35),
        vx: (Math.random() - 0.5) * 0.35,
        a: isSparkling ? (0.18 + Math.random() * 0.35) : (0.04 + Math.random() * 0.06)
      }));

      function tick() {
        if (!document.body.contains(cvs)) { cocktailFxRaf = 0; return; }
        cocktailFxRaf = requestAnimationFrame(tick);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);
        const isDark = document.documentElement.classList.contains('speakeasy-mode');
        for (const p of parts) {
          p.y += p.vy;
          p.x += p.vx + Math.sin(p.y * 0.04) * 0.15;
          if (p.y < -p.r * 2) { p.y = H + p.r; p.x = Math.random() * W; }
          ctx.beginPath();
          if (isSparkling) {
            ctx.fillStyle = isDark ? `rgba(245, 206, 128, ${p.a})` : `rgba(217, 145, 62, ${p.a * 0.85})`;
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r);
            g.addColorStop(0, isDark ? `rgba(220, 195, 165, ${p.a * 1.4})` : `rgba(120, 95, 70, ${p.a})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      tick();
    }

    // Wrap renderers to auto-bind Tilt, GSAP, and Cocktail Particles
    if (typeof renderHomeAndCatalog === 'function') {
      const _origHC = renderHomeAndCatalog;
      renderHomeAndCatalog = function() { _origHC(); bindTiltCards(); };
    }
    if (typeof renderCocktails === 'function') {
      const _origRC = renderCocktails;
      renderCocktails = function() { _origRC(); bindTiltCards(); };
    }
    if (typeof renderCocktailModalContent === 'function') {
      const _origCM = renderCocktailModalContent;
      renderCocktailModalContent = function(c, servings, activeStep) {
        _origCM(c, servings, activeStep);
        attachCocktailParticles(c);
      };
    }
    window.addEventListener('atlas-navigate', e => {
      const { view } = e.detail || {};
      if (view) animateViewWithGSAP(view);
      setTimeout(bindTiltCards, 60);
    });



    // Stage 7 Boot: WebGL Liquid Light + Lenis Smooth Scroll + GSAP ScrollTrigger
    window.addEventListener('atlas-ready', () => {
      initWebGLLiquidLight();
      setTimeout(bindTiltCards, 120);

      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
      }
      if (typeof Lenis !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        try {
          const lenis = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.2 });
          function rafLenis(time) { lenis.raf(time); requestAnimationFrame(rafLenis); }
          requestAnimationFrame(rafLenis);
          window.__LENIS__ = lenis;
        } catch (e) {}
      }
    });

  
    // Stage 2 Mobile UX: Compact "Инструменты" dropdown in My Bar
    window.addEventListener('atlas-ready', () => {
      const toggle = document.getElementById('barToolsMenuToggle');
      const menu = document.getElementById('barToolsDropdown');
      if (!toggle || !menu) return;
      const closeMenu = () => {
        menu.classList.add('hidden');
        toggle.setAttribute('aria-expanded', 'false');
      };
      toggle.addEventListener('click', e => {
        e.stopPropagation();
        const isHidden = menu.classList.contains('hidden');
        menu.classList.toggle('hidden', !isHidden);
        toggle.setAttribute('aria-expanded', String(isHidden));
      });
      menu.addEventListener('click', () => setTimeout(closeMenu, 40));
      document.addEventListener('click', e => {
        if (!menu.classList.contains('hidden') && !menu.contains(e.target) && e.target !== toggle) closeMenu();
      });
    });

    // Export & Import JSON Backup for My Bar, Journal & Theme
    window.addEventListener('atlas-ready', () => {
      const expBtn = document.getElementById('barExportBackupBtn');
      const impBtn = document.getElementById('barImportBackupBtn');
      const impInput = document.getElementById('barImportBackupInput');
      if (expBtn) {
        expBtn.addEventListener('click', () => {
          const payload = {
            app: 'LIQUEUR & SPIRITS ATLAS',
            version: '2.2',
            exportedAt: new Date().toISOString(),
            storage: {
              myBar: localStorage.getItem('liqueur_atlas_mybar_v1'),
              barV2: typeof BAR_STORAGE_KEY !== 'undefined' ? localStorage.getItem(BAR_STORAGE_KEY) : null,
              journal: typeof JOURNAL_KEY !== 'undefined' ? localStorage.getItem(JOURNAL_KEY) : null,
              theme: typeof THEME_KEY !== 'undefined' ? localStorage.getItem(THEME_KEY) : null
            }
          };
          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'liqueur-atlas-backup.json';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          if (typeof showToast === 'function') showToast('Бэкап сохранён');
        });
      }
      if (impBtn && impInput) {
        impBtn.addEventListener('click', () => impInput.click());
        impInput.addEventListener('change', e => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const data = JSON.parse(String(reader.result || '{}'));
              const st = data.storage || {};
              if (st.myBar) localStorage.setItem('liqueur_atlas_mybar_v1', st.myBar);
              if (st.barV2 && typeof BAR_STORAGE_KEY !== 'undefined') localStorage.setItem(BAR_STORAGE_KEY, st.barV2);
              if (st.journal && typeof JOURNAL_KEY !== 'undefined') localStorage.setItem(JOURNAL_KEY, st.journal);
              if (st.theme && typeof THEME_KEY !== 'undefined') localStorage.setItem(THEME_KEY, st.theme);
              if (typeof showToast === 'function') showToast('Бэкап восстановлен — обновляем...');
              setTimeout(() => location.reload(), 650);
            } catch (err) {
              if (typeof showToast === 'function') showToast('Ошибка чтения файла бэкапа');
            }
          };
          reader.readAsText(file);
          impInput.value = '';
        });
      }
    });

    // ==================== GUEST BAR MENU & ORDER LINK (v2.4) ====================
    const guestState = {
      barIds: null, // null = use host's own state.myBar.liqueurs; array = from shared link
      title: 'Домашний бар · Меню вечера',
      filter: 'all',
      order: [], // [{ id, name, type: 'cocktail'|'neat', subtitle }]
      prefs: [],
      quizFlavor: null,
      quizStrength: null
    };

    function getGuestActiveBottles() {
      if (Array.isArray(guestState.barIds) && guestState.barIds.length) {
        return guestState.barIds;
      }
      return (state.myBar && Array.isArray(state.myBar.liqueurs) && state.myBar.liqueurs.length)
        ? state.myBar.liqueurs
        : LIQUEURS.slice(0, 6).map(l => l.id);
    }

    function getGuestRouteHash() {
      const ids = getGuestActiveBottles().join(',');
      const titleEnc = encodeURIComponent(guestState.title || 'Домашний бар · Меню вечера');
      return `#guest/b=${ids}&t=${titleEnc}`;
    }

    function parseGuestHashParam(paramStr) {
      if (!paramStr) {
        guestState.barIds = null;
        return;
      }
      const params = new URLSearchParams(paramStr);
      const b = params.get('b');
      const t = params.get('t');
      if (b) {
        const validIds = new Set(LIQUEURS.map(l => l.id));
        const parsed = b.split(',').map(s => s.trim()).filter(id => validIds.has(id));
        guestState.barIds = parsed.length ? parsed : null;
      } else {
        guestState.barIds = null;
      }
      if (t) {
        guestState.title = t.slice(0, 60);
      }
    }

    function getGuestAvailableCocktails(bottleIds) {
      const owned = new Set(bottleIds);
      return COCKTAILS.filter(c => c.liqueurs && c.liqueurs.length && c.liqueurs.every(id => owned.has(id)));
    }

    function syncGuestOrderBar() {
      const barEl = document.getElementById('guestOrderBar');
      const lbl = document.getElementById('guestOrderBarLabel');
      if (!barEl || !lbl) return;
      const isGuestView = state.view === 'guest';
      if (isGuestView && guestState.order.length > 0) {
        barEl.classList.remove('hidden');
        barEl.classList.add('flex');
        const n = guestState.order.length;
        const word = n === 1 ? 'напиток' : (n >= 2 && n <= 4 ? 'напитка' : 'напитков');
        lbl.textContent = `Выбрано: ${n} ${word}`;
      } else {
        barEl.classList.add('hidden');
        barEl.classList.remove('flex');
      }
    }

    function toggleGuestOrderItem(item) {
      const idx = guestState.order.findIndex(x => x.id === item.id && x.type === item.type);
      if (idx >= 0) {
        guestState.order.splice(idx, 1);
      } else {
        guestState.order.push(item);
        if (typeof showToast === 'function') showToast(`Добавлено: ${item.name}`);
      }
      syncGuestOrderBar();
      renderGuestMenu();
    }

    function renderGuestQuizResult() {
      const box = document.getElementById('guestQuizResult');
      if (!box) return;
      const bottles = getGuestActiveBottles();
      const pool = getGuestAvailableCocktails(bottles);
      if (!pool.length) {
        box.innerHTML = '<div class="text-xs text-[#6B655E]">Нет доступных коктейлей для подбора.</div>';
        return;
      }
      const scored = pool.map(c => {
        let s = 0;
        if (guestState.quizFlavor && c.flavorTag === guestState.quizFlavor) s += 3;
        if (guestState.quizStrength && c.strengthTag === guestState.quizStrength) s += 2;
        return { c, s };
      }).sort((a, b) => b.s - a.s).slice(0, 2);

      box.innerHTML = scored.map(({ c }) => {
        const picked = guestState.order.some(x => x.id === c.id && x.type === 'cocktail');
        return `
          <div class="p-3 rounded-xl bg-white border border-[#E5DDD0] flex items-center justify-between gap-2">
            <div class="min-w-0">
              <div class="font-serif-ed text-lg font-semibold truncate">${c.name}</div>
              <div class="text-[11px] text-[#6B655E] truncate">${c.flavor} · ~${c.abv}%</div>
            </div>
            <button type="button" data-guest-pick-cocktail="${c.id}" class="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium ${picked ? 'bg-[#1B4D3E] text-white' : 'bg-[#1A1816] text-white'}">
              ${picked ? '✓ Выбрано' : '+ Хочу'}
            </button>
          </div>`;
      }).join('');
    }

    function renderGuestMenu() {
      const bottleIds = getGuestActiveBottles();
      const bottles = LIQUEURS.filter(l => bottleIds.includes(l.id));
      const allCocktails = getGuestAvailableCocktails(bottleIds);

      const titleEl = document.getElementById('guestBarTitle');
      const subEl = document.getElementById('guestBarSubtitle');
      if (titleEl) titleEl.textContent = guestState.title || 'Домашний бар · Меню вечера';
      if (subEl) {
        subEl.textContent = `Сегодня в баре ${bottles.length} напитков и ${allCocktails.length} коктейлей. Выберите, что хочется — заказ отправится бармену в один клик.`;
      }

      // Filter pills state
      document.querySelectorAll('[data-guest-filter]').forEach(btn => {
        const active = btn.dataset.guestFilter === guestState.filter;
        btn.className = `px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active ? 'bg-[#1A1816] text-white' : 'bg-[#F2ECE1] text-[#1A1816]'}`;
      });

      const filtered = allCocktails.filter(c => {
        if (guestState.filter === 'all') return true;
        if (guestState.filter === 'strong') return c.strengthTag === 'strong';
        return c.flavorTag === guestState.filter;
      });

      const cntEl = document.getElementById('guestCocktailsCount');
      if (cntEl) cntEl.textContent = `${filtered.length} из ${allCocktails.length}`;

      const cGrid = document.getElementById('guestCocktailsGrid');
      if (cGrid) {
        if (!filtered.length) {
          cGrid.innerHTML = `<div class="col-span-full card-ed p-6 text-center text-xs text-[#6B655E]">В этой категории пока нет коктейлей из текущей полки — выберите «Все коктейли» или напиток в чистом виде ниже.</div>`;
        } else {
          cGrid.innerHTML = filtered.map(c => {
            const picked = guestState.order.some(x => x.id === c.id && x.type === 'cocktail');
            const liqNames = c.liqueurs.map(id => getLiqueur(id).shortName).join(' + ');
            return `
              <article class="card-ed overflow-hidden flex flex-col">
                <div class="relative aspect-[4/3] overflow-hidden bg-[#EFE9DF] cursor-pointer" data-open-cocktail="${c.id}">
                  <img src="${c.img}" alt="${c.name}" class="w-full h-full object-cover" loading="lazy" decoding="async" />
                  <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FAF7F2]/92 text-[#1A1816]">~${c.abv}% ABV</span>
                </div>
                <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div class="cursor-pointer" data-open-cocktail="${c.id}">
                    <div class="text-[10px] uppercase tracking-[0.14em] text-[#6B655E]">${liqNames}</div>
                    <h4 class="font-serif-ed text-2xl font-semibold mt-0.5 leading-tight">${c.name}</h4>
                    <p class="text-xs text-[#6B655E] mt-1">${c.flavor}</p>
                  </div>
                  <div class="pt-2.5 border-t border-[#EDE6DA] flex items-center justify-between gap-2">
                    <span class="text-[11px] text-[#524C46]">${c.glass}</span>
                    <button type="button" data-guest-pick-cocktail="${c.id}" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${picked ? 'bg-[#1B4D3E] text-white' : 'bg-[#1A1816] text-white hover:opacity-90'}">
                      ${picked ? '✓ В заказе' : '+ Выбрать'}
                    </button>
                  </div>
                </div>
              </article>`;
          }).join('');
        }
      }

      const bCnt = document.getElementById('guestBottlesCount');
      if (bCnt) bCnt.textContent = `${bottles.length} позиций`;
      const bGrid = document.getElementById('guestBottlesGrid');
      if (bGrid) {
        bGrid.innerHTML = bottles.map(l => {
          const picked = guestState.order.some(x => x.id === l.id && x.type === 'neat');
          return `
            <div class="card-ed p-3.5 flex flex-col justify-between gap-2.5">
              <div class="flex items-center gap-2.5">
                <img src="${l.img}" alt="${l.shortName}" class="w-11 h-11 rounded-xl object-cover shrink-0 bg-[#EFE9DF]" loading="lazy" decoding="async" />
                <div class="min-w-0">
                  <div class="font-serif-ed text-lg font-semibold leading-tight truncate">${l.shortName}</div>
                  <div class="text-[10px] text-[#6B655E]">${l.general.abvLabel.split(' ')[0]} · чистым / со льдом</div>
                </div>
              </div>
              <button type="button" data-guest-pick-neat="${l.id}" class="w-full py-1.5 rounded-full text-xs font-medium transition-colors ${picked ? 'bg-[#1B4D3E] text-white' : 'bg-[#F2ECE1] text-[#1A1816] hover:bg-[#E5DDD0]'}">
                ${picked ? '✓ В заказе' : '+ Выбрать'}
              </button>
            </div>`;
        }).join('');
      }

      syncGuestOrderBar();
      if (window.lucide) lucide.createIcons();
    }

    function renderGuestOrderModal() {
      const list = document.getElementById('guestOrderItemsList');
      if (!list) return;
      if (!guestState.order.length) {
        list.innerHTML = '<div class="text-xs text-[#6B655E] py-2">Вы пока ничего не выбрали.</div>';
        return;
      }
      list.innerHTML = guestState.order.map((item, idx) => `
        <div class="px-3.5 py-2.5 rounded-xl bg-white border border-[#E5DDD0] flex items-center justify-between gap-2">
          <div>
            <div class="text-sm font-semibold">${idx + 1}. ${item.name}</div>
            <div class="text-[11px] text-[#6B655E]">${item.subtitle}</div>
          </div>
          <button type="button" data-guest-remove-idx="${idx}" aria-label="Убрать напиток" class="w-7 h-7 rounded-full bg-[#F2ECE1] text-xs flex items-center justify-center">✕</button>
        </div>`).join('');
    }

    window.addEventListener('atlas-navigate', () => syncGuestOrderBar());

    window.addEventListener('atlas-ready', () => {
      // Host: open Guest Share Modal from My Bar
      const openShareBtn = document.getElementById('openGuestShareBtn');
      const shareModal = document.getElementById('guestShareModal');
      const closeShareBtn = document.getElementById('closeGuestShareModalBtn');
      const hostTitleInput = document.getElementById('guestHostTitleInput');
      const sendLinkBtn = document.getElementById('sendGuestLinkBtn');
      const previewBtn = document.getElementById('previewGuestMenuBtn');

      const closeShareModal = () => {
        if (!shareModal) return;
        shareModal.classList.add('hidden');
        shareModal.classList.remove('flex');
      };

      if (openShareBtn && shareModal) {
        openShareBtn.addEventListener('click', () => {
          guestState.barIds = null; // use host's current My Bar
          const ids = getGuestActiveBottles();
          const cocks = getGuestAvailableCocktails(ids);
          const stats = document.getElementById('guestShareStats');
          if (stats) stats.textContent = `В гостевое меню попадут: ${ids.length} бутылок и ${cocks.length} коктейлей из твоего бара.`;
          shareModal.classList.remove('hidden');
          shareModal.classList.add('flex');
        });
      }
      if (closeShareBtn) closeShareBtn.addEventListener('click', closeShareModal);
      if (shareModal) shareModal.addEventListener('click', e => { if (e.target === shareModal) closeShareModal(); });

      if (sendLinkBtn) {
        sendLinkBtn.addEventListener('click', () => {
          guestState.barIds = null;
          guestState.title = (hostTitleInput && hostTitleInput.value.trim()) || 'Домашний бар · Меню вечера';
          const hashPath = getGuestRouteHash();
          if (typeof shareAtlasLink === 'function') {
            shareAtlasLink(guestState.title, 'Выбирай коктейль из моего домашнего бара и присылай заказ!', hashPath);
          }
          closeShareModal();
        });
      }

      if (previewBtn) {
        previewBtn.addEventListener('click', () => {
          guestState.barIds = null;
          guestState.title = (hostTitleInput && hostTitleInput.value.trim()) || 'Домашний бар · Меню вечера';
          closeShareModal();
          navigateTo('guest');
        });
      }

      // Guest: filters, quiz & picking drinks (delegated)
      const guestView = document.getElementById('view-guest');
      if (guestView) {
        guestView.addEventListener('click', e => {
          const fBtn = e.target.closest('[data-guest-filter]');
          if (fBtn) {
            guestState.filter = fBtn.dataset.guestFilter;
            renderGuestMenu();
            return;
          }
          const cBtn = e.target.closest('[data-guest-pick-cocktail]');
          if (cBtn) {
            const c = COCKTAILS.find(x => x.id === cBtn.dataset.guestPickCocktail);
            if (c) toggleGuestOrderItem({ id: c.id, name: c.name, type: 'cocktail', subtitle: `Коктейль · ~${c.abv}% ABV` });
            return;
          }
          const nBtn = e.target.closest('[data-guest-pick-neat]');
          if (nBtn) {
            const l = getLiqueur(nBtn.dataset.guestPickNeat);
            if (l) toggleGuestOrderItem({ id: l.id, name: l.shortName, type: 'neat', subtitle: 'В чистом виде / со льдом' });
            return;
          }
          const qf = e.target.closest('[data-gq-flavor]');
          if (qf) {
            guestState.quizFlavor = qf.dataset.gqFlavor;
            guestView.querySelectorAll('[data-gq-flavor]').forEach(b => {
              const act = b.dataset.gqFlavor === guestState.quizFlavor;
              b.className = `px-3 py-1.5 rounded-full border ${act ? 'bg-[#1A1816] text-white border-[#1A1816]' : 'border-[#D7CEC0] bg-white'}`;
            });
            renderGuestQuizResult();
            return;
          }
          const qs = e.target.closest('[data-gq-strength]');
          if (qs) {
            guestState.quizStrength = qs.dataset.gqStrength;
            guestView.querySelectorAll('[data-gq-strength]').forEach(b => {
              const act = b.dataset.gqStrength === guestState.quizStrength;
              b.className = `px-3 py-1.5 rounded-full border ${act ? 'bg-[#1A1816] text-white border-[#1A1816]' : 'border-[#D7CEC0] bg-white'}`;
            });
            renderGuestQuizResult();
            return;
          }
        });
      }

      const quizToggle = document.getElementById('guestQuizToggleBtn');
      const quizBox = document.getElementById('guestQuizBox');
      const quizClose = document.getElementById('guestQuizCloseBtn');
      if (quizToggle && quizBox) {
        quizToggle.addEventListener('click', () => {
          quizBox.classList.toggle('hidden');
          if (!quizBox.classList.contains('hidden')) renderGuestQuizResult();
        });
      }
      if (quizClose && quizBox) quizClose.addEventListener('click', () => quizBox.classList.add('hidden'));

      // Guest Order Checkout Modal
      const openOrderBtn = document.getElementById('openGuestOrderModalBtn');
      const orderModal = document.getElementById('guestOrderModal');
      const closeOrderBtn = document.getElementById('closeGuestOrderModalBtn');
      const submitOrderBtn = document.getElementById('submitGuestOrderBtn');
      const clearOrderBtn = document.getElementById('clearGuestOrderBtn');

      const closeOrderModal = () => {
        if (!orderModal) return;
        orderModal.classList.add('hidden');
        orderModal.classList.remove('flex');
      };

      if (openOrderBtn && orderModal) {
        openOrderBtn.addEventListener('click', () => {
          renderGuestOrderModal();
          orderModal.classList.remove('hidden');
          orderModal.classList.add('flex');
        });
      }
      if (closeOrderBtn) closeOrderBtn.addEventListener('click', closeOrderModal);
      if (orderModal) {
        orderModal.addEventListener('click', e => {
          if (e.target === orderModal) { closeOrderModal(); return; }
          const rem = e.target.closest('[data-guest-remove-idx]');
          if (rem) {
            guestState.order.splice(Number(rem.dataset.guestRemoveIdx), 1);
            renderGuestOrderModal();
            renderGuestMenu();
            if (!guestState.order.length) closeOrderModal();
            return;
          }
          const pref = e.target.closest('[data-guest-pref]');
          if (pref) {
            const p = pref.dataset.guestPref;
            const i = guestState.prefs.indexOf(p);
            if (i >= 0) guestState.prefs.splice(i, 1);
            else guestState.prefs.push(p);
            pref.className = `px-3 py-1.5 rounded-full text-xs border ${guestState.prefs.includes(p) ? 'bg-[#1A1816] text-white border-[#1A1816]' : 'border-[#D7CEC0] bg-white'}`;
          }
        });
      }

      if (clearOrderBtn) {
        clearOrderBtn.addEventListener('click', () => {
          guestState.order = [];
          guestState.prefs = [];
          closeOrderModal();
          renderGuestMenu();
        });
      }

      if (submitOrderBtn) {
        submitOrderBtn.addEventListener('click', () => {
          if (!guestState.order.length) return;
          const name = (document.getElementById('guestNameInput')?.value || '').trim();
          const comment = (document.getElementById('guestCommentInput')?.value || '').trim();
          const header = name ? `🍸 Заказ в бар от ${name}:` : '🍸 Заказ в бар:';
          const lines = guestState.order.map((it, i) => `${i + 1}. ${it.name} (${it.type === 'neat' ? 'чистым / со льдом' : 'коктейль'})`);
          const extra = [];
          if (guestState.prefs.length) extra.push(`Пожелания: ${guestState.prefs.join(', ')}`);
          if (comment) extra.push(`Комментарий: ${comment}`);
          const msg = [header, ...lines, ...extra].join('\n');

          if (navigator.share) {
            navigator.share({ title: 'Заказ в домашний бар', text: msg }).catch(() => {});
          } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(msg).then(() => {
              if (typeof showToast === 'function') showToast('Заказ скопирован — отправьте в чат бармену!');
            }).catch(() => {});
          }
          closeOrderModal();
        });
      }
    });
