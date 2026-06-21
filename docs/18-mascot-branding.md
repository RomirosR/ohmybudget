# Журнал: маскот-брендинг (тюлень) + favicon

> Маскот сервиса — мультяшный тюлень, пересчитывающий деньги ластами.
> Используется как favicon, иконки PWA/Apple и лого в шапке.

## Источник изображения

Сгенерировано через **Higgsfield CLI** (`@higgsfield/cli`), модель `z_image`
(free-plan, ~0.15 кредита/генерация). Фон убран локально через ImageMagick
(flood-fill белого от углов — внутреннее светлое брюхо защищено чёрным контуром).

Исходники и мастер — в `assets/mascot/`:

```
assets/mascot/
  seal-v3.png        исходник 2048², белый фон (финальная поза «пересчёта»)
  seal-v2.png        альт-вариант (держит купюру)
  mascot-master.png  1024², прозрачный фон — мастер
  icons/             favicon.ico + icon-16..512 + apple-touch (180)
```

Промпт (суть): настоящий тюлень (earless seal, гладкое серое тело в крапинку, усы,
ласты, без ушей), хвост слева / голова справа, обоими ластами пересчитывает купюру,
монеты рядом, плоский вектор, чёткий контур.

## Шаг 1 — favicon, иконки, лого в шапке (коммит: pending)

**Дата:** 2026-06-21

**Что сделано:**
- `frontend/public/` — `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`
  (180), `icon-192.png`, `icon-512.png`, `mascot.png` (лого), `site.webmanifest`;
- `frontend/index.html` — `<link>` favicon/apple-touch/manifest, `theme-color`,
  meta description;
- `frontend/src/App.tsx` — лого `.brand-logo` рядом с `<h1>` в шапке;
- `frontend/src/styles.css` — стили `.brand` / `.brand-logo` (36×36).

**Почему так:** Vite раздаёт `public/` в корень и копирует в `dist`; Dockerfile
берёт `dist` → nginx, поэтому ассеты работают и в dev, и в prod без доп. настройки.

**Как проверить:** `cd frontend && npm run build` (favicon и mascot.png в `dist/`);
`npm run dev` → вкладка показывает тюленя, в шапке — лого.

## Деплой на прод

Изменения в `frontend/**` = **код** → после merge в `main` CI/CD автоматически
пересоберёт и задеплоит на `ohmybudget.by` (см. `docs/15-cicd.md`). Favicon
прорастёт в прод вместе с обычным деплоем.

## Higgsfield (заметки)

- Аккаунт `rr909e610@gmail.com`, **free plan, 10 кредитов** стартово.
- На free доступны не все модели: `nano_banana` и видео-модели требуют платный план
  (`job_minimum_basic_plan_required`); `z_image` — доступна.
- Видео (анимация) стоит 7.5–10+ кредитов → отложено; для «живого» лоадера
  предпочтительнее CSS/SVG-анимация статичного маскота (0 кредитов).
- CLI установлен глобально; вход: `higgsfield auth login` (OAuth в браузере).
