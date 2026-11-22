# LIQUEUR & SPIRITS ATLAS — Production Build (v2)

Модульная мобильная веб-энциклопедия **19 напитков** и **99 коктейлей** с 3D-бутылками (Three.js r164 + 4 GLSL-шейдера), вечерним режимом **Speakeasy**, `#hash`-роутингом, режимом бармена и поддержкой PWA на iPhone.

## Структура проекта
- `index.html` — главная страница (67,5 КБ)
- `css/styles.css` — скомпилированные стили (33,8 КБ, без Tailwind Play CDN)
- `data/catalog.json` — база всех 19 напитков, 99 коктейлей и цен Владивостока
- `js/app.js` — ядро, `#hash`-роутинг, кнопка «Поделиться», каталог, обзоры, сравнение, коктейли, цены
- `js/three-studio.js` — Three.js r164, `RoomEnvironment`, `UnrealBloomPass`, 4 GLSL-шейдера, 3D-бутылки и поддержка `.glb`-моделей
- `js/bar-tools.js` — «Мой бар», полка с подсветкой, режим бармена, планировщик вечеринки, рулетка, PNG-меню, фоновый WebGL FBM
- `assets/*.webp` — 39 оптимизированных изображений в формате WebP
- `manifest.json` и `sw.js` (`v14`) — установка на экран «Домой» iPhone и офлайн-кэш

## Как залить на GitHub Pages
1. Распакуйте архив `LIQUEUR-ATLAS-v2-GitHubPages.zip`.
2. Перетащите все файлы и папки (`index.html`, `manifest.json`, `sw.js`, `css/`, `data/`, `js/`, `assets/`) в корень вашего репозитория GitHub через **Add file → Upload files**.
3. Откройте опубликованный сайт в Safari на iPhone и нажмите **«Поделиться → На экран „Домой“»**.

## Как подключить реальную 3D-модель `.glb` (опционально)
Положите файл модели в `assets/models/campari.glb` и добавьте поле `"modelGlb": "./assets/models/campari.glb"` в нужный объект напитка внутри `data/catalog.json` — движок загрузит её автоматически.
