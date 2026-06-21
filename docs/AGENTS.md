# Гайд для агентов — OhMyBudget

> Стабильный свод правил и контекста для AI-агентов, работающих над проектом.
> Здесь **только то, что не устаревает**: архитектура, слои, workflow, запуск, деплой.
> Текущее состояние, открытые задачи и «что делать дальше» — **не здесь**, а в
> [`docs/09-session-handoff.md`](09-session-handoff.md) (handoff на старте нового чата).

## 1. Что за проект

Личный бюджет-трекер (веб). Замена Google-таблицы из «семи листов»: планы по
месяцам, операции, сводка, инвестиции, активы, история, графики.

**Стек:**

| Слой | Технологии |
|------|------------|
| Данные | SQLite (dev/pytest) / PostgreSQL (Docker/prod) + SQLAlchemy 2.0 + Alembic |
| Backend | Python 3.11+ (локально 3.14) + FastAPI + Pydantic v2 |
| Frontend | React + TypeScript + Vite + TanStack Query + Recharts |
| Запуск | Docker Compose **и** локально (uvicorn + npm) |

## 2. Архитектура — три изолированных слоя

1. **Данные** (`backend/app/models/` + `repositories/`) — единственные, кто знает про
   SQL. Наружу отдают данные только через репозитории, ORM-детали не утекают выше.
2. **Backend-логика** (`backend/app/services/` — расчёты + `api/routes/` — HTTP).
   Контракт наружу — Pydantic-схемы (`schemas/`). Про SQL не знает.
3. **Frontend** (`frontend/src/`) — общается с бэком только через `src/api/`
   (REST/JSON). Про БД ничего не знает.

**Принципы данных:**
- Хранятся только **факты** (4 сущности: планы, операции, инвестиции, активы) +
  справочники + настройки месяца. Производные показатели (Сводка/История/Графики)
  **не хранятся** — считаются в `services/` по запросу.
- Справочники — таблицы (не константы), наполняются seed-миграцией.
- Доход/Расход — булево `is_income`, не строка (текст резолвится на фронте).
- Период плана — `year + month_id (FK)`, у операций — `date`.
- **Multi-tenant:** JWT Bearer, данные изолированы по `user_id`.

Детали по слоям: `docs/01-data-layer.md`, `docs/02-backend-layer.md`,
`docs/03-frontend-layer.md`. Общая выжимка и индекс журналов — `docs/00-overview.md`.

## 3. Workflow (обязательно)

Полные правила: [`.cursor/rules/git-and-docs-workflow.mdc`](../.cursor/rules/git-and-docs-workflow.mdc)
и [`.cursor/rules/no-secrets.mdc`](../.cursor/rules/no-secrets.mdc).

```
main ──► feature/<имя> ──► локальные тесты ──► атомарные коммиты + docs
                              │
                         PR в main ──► CI (pytest + build, если менялся код)
                              │
                    merge ТОЛЬКО по явному согласию пользователя
                              │
              push в main ──► CI ──► автодеплой (только если менялся код)
```

1. **Ветка** `feature/<краткое-имя>` от актуального `main`. Работа только в ней.
   Влитие в `main` — **только через PR**, не прямым push.
2. **Локальные тесты до PR** — основная проверка:
   `cd backend && pytest`, `cd frontend && npm run build`.
3. **Коммиты** — по ходу работы, атомарно. Один коммит = одна осмысленная часть +
   документация к ней. Не смешивать в одном коммите: backend и frontend; инфру и
   бизнес-логику; миграцию БД и UI; несвязанные изменения.
4. **Формат сообщения коммита:**
   ```
   <type>(<scope>): <краткое описание>

   - что изменилось в коде
   - что добавлено в docs (файл + секция)
   ```
   Типы: `feat`, `fix`, `docs`, `chore`, `test`, `infra`.
   В конце сообщения: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
5. **PR** в `main` с Summary и Test plan. **Merge — только по явному запросу.**
6. **Push в remote** — по запросу пользователя или когда нужен PR/деплой.

Мелкие правки (опечатка, один багфикс) — можно без отдельной ветки, если пользователь
не просит иначе.

## 4. Документация — в каждом коммите с кодом

- **Журнал фичи** — для крупных задач отдельный файл `docs/NN-<имя>.md`. Шаблон секции:
  ```markdown
  ## Шаг N — <название> (коммит: <hash>)
  **Дата:** …  **Что сделано:** …  **Почему так:** …  **Как проверить:** …
  ```
- **Слойные docs** (`docs/00`…`04`, `README.md`) — точечно при изменении архитектуры
  или запуска. Не дублировать детали — ссылаться на журнал.
- Новый журнал — добавить ссылку в индекс `docs/00-overview.md`.

## 5. Секреты — НИКОГДА в git и в логи

- Запрещено коммитить: `.env`, `.env.prod`, `backend/.env`, приватные SSH-ключи
  (`id_*`, `deploy/.github-actions-deploy`), JWT/DB-пароли, API-ключи, `*.pem`,
  `credentials.json`, OAuth/IAM/PAT-токены. В репо — только `*.example` с
  плейсхолдерами (`change-me`).
- Перед коммитом: `git diff --staged` — убедиться, что секретов нет.
- **Не печатать секреты в вывод команд** (логи сессии = утечка). При чтении конфигов
  редактировать чувствительные поля.
- `.gitignore` покрывает prod-секреты и артефакты сборки.

## 6. Локальный запуск

```bash
# Backend
cd backend && source .venv/bin/activate
alembic upgrade head            # схема + seed справочников
uvicorn app.main:app --reload   # http://127.0.0.1:8000 , Swagger /docs

# Frontend
cd frontend && npm install
npm run dev                     # http://127.0.0.1:5173 , проксирует /api → :8000
```

Тесты: `cd backend && pytest`  •  `cd frontend && npx tsc --noEmit && npm run build`.

Docker: `docker compose up --build` (postgres + backend + frontend nginx).
Детали запуска — `docs/04-infra-run.md`.

## 7. CI/CD и деплой в прод

Journal: `docs/15-cicd.md`. Workflow: `.github/workflows/ci-cd.yml`.
Прод: `https://ohmybudget.by` (Yandex Cloud). Хостинг — `docs/12..14`.

| Триггер | Test (pytest+build) | Deploy на прод |
|---------|:---:|:---:|
| PR в `main`, изменён **код** | ✅ | ❌ |
| PR в `main`, только **docs/rules** | пропуск | ❌ |
| Push в `main`, изменён **код** | ✅ | ✅ |
| Push в `main`, только **docs** | пропуск | ❌ |
| **Run workflow** вручную | ✅ | ✅ |

**Код** (триггерит deploy): `backend/**`, `frontend/**`, `docker-compose*.yml`,
`deploy/deploy.sh`, `deploy/nginx/**`. Деплой после merge в `main` — **автоматический**.
Ручной деплой: GitHub → Actions → **CI/CD** → Run workflow.

## 8. Старт новой сессии

Прикрепить `@docs/09-session-handoff.md` (+ `@README.md`) — там актуальное состояние
`main`, что в работе и как запускать. Этот гайд (`docs/AGENTS.md`) — стабильные правила,
читать при любой работе над проектом.
