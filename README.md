# Blink Camp Dashboard

Интерактивный PM-дашборд летнего лагеря с диаграммой Ганта.

## Онлайн-версия

После завершения GitHub Actions приложение доступно по постоянному адресу:

**[https://haveheadd.github.io/dashboard/](https://haveheadd.github.io/dashboard/)**

Публикация выполняется автоматически при каждом push в ветку `main`, `master` или `work`.

Если по ссылке отображается ошибка 404, откройте вкладку **Actions** репозитория,
выберите workflow **Deploy dashboard to GitHub Pages** и нажмите **Run workflow**.
Workflow сам активирует GitHub Pages, собирает приложение с путем `/dashboard/`
и публикует готовый каталог `dist` — публиковать исходный `index.html` вручную не нужно.

## Посмотреть локально

```bash
npm install
npm run dev
```

После запуска проект доступен по адресу [http://localhost:5173](http://localhost:5173).

## Production preview

```bash
npm run build
npm run preview
```

Production-сборка будет доступна по адресу [http://localhost:4173](http://localhost:4173).

## Публикация

Репозиторий готов к публикации без дополнительных настроек:

- **Vercel:** импортируйте репозиторий — параметры Vite уже находятся в `vercel.json`.
- **Netlify:** импортируйте репозиторий — команда сборки и каталог публикации заданы в `netlify.toml`.

После первого deploy обе платформы выдадут постоянную публичную ссылку на проект.
