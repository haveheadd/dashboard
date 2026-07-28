import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, ChevronsUpDown,
  LayoutDashboard, ListFilter, MoreHorizontal, PanelLeftClose, Plus, Search,
  SlidersHorizontal, Sparkles, Upload, Users, X,
} from 'lucide-react';

type Status = 'Не начато' | 'В работе' | 'Готово' | 'Просрочено' | 'Заблокировано';
type Task = { id: number; title: string; stage: string; owner: string; deadline: string; status: Status; progress: number; start: number; span: number };

const stageColors: Record<string, string> = {
  'Концепт и механика': '#7557ed', Тексты: '#f2b938', Визуалы: '#ff6e73', Контент: '#25b884',
  Дизайн: '#f45f76', PR: '#a564e8', ASO: '#4f8df7', Аналитика: '#33a5c7',
  'Менеджерские дела': '#ef9144', 'Разработка и верстка': '#4f8df7',
  'Запуск и продвижение': '#25b884', 'Итоги и ретро': '#34313c',
};

const rawTasks: Array<[string, string, string, string?]> = [
  ['Концепт и механика', 'Финальный даббл чек спецпроекта', 'Саша, Света и Лёля'],
  ['Тексты', 'Написание текстов заданий', 'Лёля и Данич'], ['Тексты', 'Написание текстов на лендинге', ''],
  ['Тексты', 'Написание текстов для Маркета', ''], ['Тексты', 'Написание текстов для WN', ''],
  ['Тексты', 'Написание текстов для ивента в сторах', ''], ['Визуалы', 'Создание KV', 'Вера'],
  ['Визуалы', 'Создание лендинга', ''], ['Визуалы', 'Ивентная иконка', ''],
  ['Визуалы', 'Создание видеоинструкций', 'Даня I'], ['Визуалы', "Создание What's New", 'Лёля, Данич, Вера'],
  ['Визуалы', 'Стикеры, подарок и хвосты под ивент', ''], ['Контент', 'Создание и утверждение идей', 'Лёля'],
  ['Контент', 'Создание ТЗ на дизайн', 'Лёля'], ['Контент', 'Создание описаний', 'Данич'],
  ['Дизайн', 'Хвост 1 (победный, за баллы)', 'Даня I', '2026-07-29'],
  ['Дизайн', 'Хвост 2 (победный, за баллы)', 'Даня I'], ['Дизайн', 'Хвост 3 (победный, за баллы)', 'Даня I'],
  ['Дизайн', 'Стикер 1 (победный, за баллы)', 'Вера'], ['Дизайн', 'Стикер 2 (победный, за баллы)', 'Вера'],
  ['Дизайн', 'Бесплатный стикер зубная паста', 'Вера'], ['Дизайн', 'Подарок Гном за 5+ друзей', 'Вера'],
  ['PR', 'Подбор блогеров для интеграции', 'Мила'], ['PR', 'ТГ-посевы', ''], ['ASO', 'Запуск ивента', 'Саша Луч'],
  ['Менеджерские дела', 'Составление правил акции', 'Света'], ['Менеджерские дела', 'Добыть шаблоны документов для бухгалтерии', ''],
  ['Менеджерские дела', 'Сделать форму сбора данных победителей', ''], ['Менеджерские дела', 'Составление FAQ', ''],
  ['Разработка и верстка', 'Разработка и верстка', 'Ян'], ['Разработка и верстка', 'Тестирование и фиксы', 'Ян'],
  ['Запуск и продвижение', 'Включение точки входа на главной + лендинга', 'Ян'],
  ['Запуск и продвижение', "What's New при первом заходе", 'Ян'], ['Запуск и продвижение', 'Пуш', 'Лёля'],
  ['Запуск и продвижение', 'SMM', 'Лёля'], ['Запуск и продвижение', 'Ивент в сторах', 'Саша'],
  ['Запуск и продвижение', 'Интеграции с блогерами', 'Саша и Света'], ['Запуск и продвижение', 'Посевы в ТГ', 'Мила'],
  ['Запуск и продвижение', 'Подведение итогов', 'Регина'], ['Итоги и ретро', 'Сбор результатов', 'Света и Чумак'],
  ['Итоги и ретро', 'Ретро?', 'Света'],
];

const initialTasks: Task[] = rawTasks.map(([stage, title, owner, deadline], index) => ({
  id: index + 1, title, stage, owner, deadline: deadline ?? '', status: 'Не начато', progress: 0,
  start: index % 18, span: 3 + (index % 4),
}));
const initialPeople = ['Саша', 'Света', 'Лёля', 'Данич', 'Вера', 'Даня I', 'Мила', 'Саша Луч', 'Ян', 'Регина', 'Чумак'];
const days = Array.from({ length: 23 }, (_, i) => ({ d: i + 8, w: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i % 7] }));

export function App() {
  const [tasks, setTasks] = useState<Task[]>(() => load('blink-tasks', initialTasks));
  const [people, setPeople] = useState<string[]>(() => load('blink-people', initialPeople));
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Task | null>(null);
  const [view, setView] = useState('Гант');
  const [page, setPage] = useState<'project' | 'team'>('project');
  const [sidebar, setSidebar] = useState(true);
  const [toast, setToast] = useState('');
  useEffect(() => localStorage.setItem('blink-tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('blink-people', JSON.stringify(people)), [people]);

  const filtered = useMemo(() => tasks.filter(t => `${t.title} ${t.owner} ${t.stage}`.toLowerCase().includes(query.toLowerCase())), [tasks, query]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const updateTask = (patch: Partial<Task>) => {
    if (!active) return;
    const next = { ...active, ...patch };
    setTasks(items => items.map(item => item.id === next.id ? next : item));
    setActive(next); notify('Изменения сохранены');
  };
  const addTask = () => {
    const task: Task = { id: Date.now(), title: 'Новая задача', stage: 'Тексты', owner: '', deadline: '', status: 'Не начато', progress: 0, start: 3, span: 4 };
    setTasks(items => [task, ...items]); setActive(task);
  };
  const importProject = async (file: File) => {
    try {
      let imported: Task[];
      if (file.name.toLowerCase().endsWith('.json')) {
        const parsed: unknown = JSON.parse(await file.text());
        const source = Array.isArray(parsed) ? parsed : (parsed as { tasks?: unknown[] }).tasks;
        if (!Array.isArray(source)) throw new Error('В JSON не найден массив задач');
        imported = objectsToTasks(source);
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        imported = rowsToTasks(parseCsv(await file.text()));
      } else {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        imported = rowsToTasks(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false }));
      }
      if (!imported.length) throw new Error('В файле не найдено задач');
      setTasks(imported);
      setPeople([...new Set(imported.flatMap(task => splitOwners(task.owner)))]);
      setView('Гант');
      notify(`Импортировано задач: ${imported.length}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Не удалось импортировать файл');
    }
  };

  return <div className="app">
    {sidebar && <aside>
      <div className="brand"><div className="brandmark">B</div><span>Blink Camp</span><button className="icon close-side" onClick={() => setSidebar(false)}><PanelLeftClose size={18} /></button></div>
      <nav><p>РАБОЧЕЕ ПРОСТРАНСТВО</p>
        <button className={`nav ${page === 'project' ? 'active' : ''}`} onClick={() => setPage('project')}><LayoutDashboard />План проекта</button>
        <button className={`nav ${page === 'team' ? 'active' : ''}`} onClick={() => setPage('team')}><Users />Команда <span>{people.length}</span></button>
        <button className="nav"><Bell />Уведомления <b>3</b></button>
      </nav>
      <div className="filters"><div className="filter-title">БЫСТРЫЕ ФИЛЬТРЫ <ListFilter size={14} /></div>
        <label><input type="checkbox" /> Только мои</label><label><input type="checkbox" /> Просроченные <i className="red-dot" /></label>
        <label><input type="checkbox" /> Критический путь</label><label><input type="checkbox" /> Ближайшие 3 дня</label>
      </div>
      <div className="project-card"><div><Sparkles size={18} /><b>Общий прогресс</b></div><strong>{progress(tasks)}%</strong><div className="meter"><i style={{ width: `${progress(tasks)}%` }} /></div><small>{tasks.filter(t => t.status === 'Готово').length} из {tasks.length} задач выполнено</small></div>
      <button className="profile"><span>АК</span><div><b>Администратор</b><small>Все изменения сохраняются</small></div><ChevronsUpDown size={15} /></button>
    </aside>}
    <main>{!sidebar && <button className="open-side" onClick={() => setSidebar(true)}>B</button>}
      {page === 'team' ? <Team people={people} setPeople={setPeople} tasks={tasks} notify={notify} /> : <>
        <header><div><div className="crumb">Проекты <b>/</b> Летний лагерь</div><h1>Летний лагерь ‘26 <span>🏕️</span></h1><p>Рабочий план · июль — август</p></div>
          <div className="header-actions"><label className="import-button"><Upload /> Импорт проекта<input type="file" accept=".xlsx,.xls,.csv,.json" onChange={event => { const file = event.target.files?.[0]; if (file) void importProject(file); event.target.value = ''; }} /></label><button className="today"><CalendarDays /> Сегодня</button><button className="primary" onClick={addTask}><Plus /> Новая задача</button></div></header>
        <section className="stats"><Stat label="Всего задач" value={tasks.length} c="purple" /><Stat label="В работе" value={tasks.filter(t => t.status === 'В работе').length} c="blue" /><Stat label="Выполнено" value={tasks.filter(t => t.status === 'Готово').length} c="green" /><Stat label="Просрочено" value={tasks.filter(t => t.status === 'Просрочено').length} c="red" /><Stat label="Команда" value={people.length} c="orange" /></section>
        <section className="workspace"><div className="toolbar"><div className="views">{['Гант', 'Канбан', 'Список', 'По людям'].map(x => <button className={view === x ? 'selected' : ''} onClick={() => setView(x)} key={x}>{x}</button>)}</div>
          <div className="tools"><div className="search"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти задачу..." /></div><button><SlidersHorizontal /> Фильтры</button><button className="icon"><MoreHorizontal /></button></div></div>
          <TaskView view={view} tasks={filtered} onOpen={setActive} />
        </section>
      </>}
    </main>
    {active && <TaskDrawer task={active} people={people} onUpdate={updateTask} onClose={() => setActive(null)} onDelete={() => { setTasks(x => x.filter(t => t.id !== active.id)); setActive(null); notify('Задача удалена'); }} />}
    {toast && <div className="toast"><span>✓</span><div><b>{toast}</b><small>Данные обновлены автоматически</small></div></div>}
  </div>;
}

function TaskView({ view, tasks, onOpen }: { view: string; tasks: Task[]; onOpen: (task: Task) => void }) {
  if (view === 'Канбан') return <div className="kanban">{(['Не начато', 'В работе', 'Готово', 'Заблокировано'] as Status[]).map(status => <div className="kanban-col" key={status}><h3><StatusTag status={status} /><span>{tasks.filter(t => t.status === status).length}</span></h3>{tasks.filter(t => t.status === status).map(t => <TaskCard key={t.id} task={t} onOpen={onOpen} />)}</div>)}</div>;
  if (view === 'Список') return <div className="list-view"><div className="list-head"><span>Задача</span><span>Этап</span><span>Ответственный</span><span>Дедлайн</span><span>Статус</span></div>{tasks.map(t => <button className="list-row" key={t.id} onClick={() => onOpen(t)}><b>{t.title}</b><span>{t.stage}</span><span>{t.owner || 'Не назначен'}</span><span>{formatDate(t.deadline)}</span><StatusTag status={t.status} /></button>)}</div>;
  if (view === 'По людям') { const owners = [...new Set(tasks.flatMap(t => splitOwners(t.owner)))]; return <div className="people-view">{owners.map(owner => <section key={owner}><h3><Avatar name={owner} />{owner}<span>{tasks.filter(t => splitOwners(t.owner).includes(owner)).length} задач</span></h3><div>{tasks.filter(t => splitOwners(t.owner).includes(owner)).map(t => <TaskCard key={t.id} task={t} onOpen={onOpen} />)}</div></section>)}</div>; }
  return <div className="gantt"><div className="gantt-head"><div className="task-col"><span>ЗАДАЧА</span><span>СТАТУС</span></div><div className="dates">{days.map((x, i) => <div className={(i === 7 ? 'today-date ' : '') + (x.w === 'Сб' || x.w === 'Вс' ? 'weekend' : '')} key={i}><b>{x.d}</b><small>{x.w}</small></div>)}</div></div>
    <div className="rows">{tasks.map(t => <div className="row" key={t.id}><div className="task-info" onClick={() => onOpen(t)}><i style={{ background: color(t.stage) }} /><Avatar name={t.owner || '?'} /><div><b>{t.title}</b><small>{t.stage} · {t.owner || 'Не назначен'}</small></div><StatusTag status={t.status} /></div><div className="timeline">{days.map((_, i) => <i className={(i === 7 ? 'today-line ' : '') + (i % 7 > 4 ? 'weekend' : '')} key={i} />)}<button className="bar" onClick={() => onOpen(t)} style={{ left: `calc(${t.start} * 100% / 23 + 5px)`, width: `calc(${t.span} * 100% / 23 - 10px)`, background: color(t.stage) }}><span>{t.title}</span><b>{initials(t.owner)}</b></button></div></div>)}</div>
    <div className="legend"><span><i className="today-legend" />Сегодня</span><span><i className="critical" />Критический путь</span><small>Нажмите задачу, чтобы изменить данные</small></div></div>;
}

function Team({ people, setPeople, tasks, notify }: { people: string[]; setPeople: Dispatch<SetStateAction<string[]>>; tasks: Task[]; notify: (x: string) => void }) {
  const [draft, setDraft] = useState('');
  const add = () => { if (draft.trim() && !people.includes(draft.trim())) { setPeople(x => [...x, draft.trim()]); setDraft(''); notify('Участник добавлен'); } };
  return <><header><div><div className="crumb">Рабочее пространство <b>/</b> Команда</div><h1>Команда проекта <span>👋</span></h1><p>Редактируйте участников и смотрите загрузку</p></div><div className="team-add"><input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Имя участника" /><button className="primary" onClick={add}><Plus /> Добавить</button></div></header>
    <div className="team-grid">{people.map((person, index) => <div className="person-card" key={`${person}-${index}`}><Avatar name={person} /><input value={person} onChange={e => setPeople(items => items.map((x, i) => i === index ? e.target.value : x))} onBlur={() => notify('Имя обновлено')} /><small>{tasks.filter(t => splitOwners(t.owner).includes(person)).length} задач</small><button onClick={() => setPeople(items => items.filter((_, i) => i !== index))}><X /></button></div>)}</div></>;
}

function TaskDrawer({ task, people, onUpdate, onClose, onDelete }: { task: Task; people: string[]; onUpdate: (x: Partial<Task>) => void; onClose: () => void; onDelete: () => void }) {
  return <><div className="scrim" onClick={onClose} /><div className="drawer"><div className="drawer-head"><span style={{ background: color(task.stage) + '20', color: color(task.stage) }}>{task.stage}</span><button className="icon" onClick={onClose}><X /></button></div>
    <label className="field-label">Название</label><input className="task-title" value={task.title} onChange={e => onUpdate({ title: e.target.value })} />
    <div className="edit-form"><label>Этап<select value={task.stage} onChange={e => onUpdate({ stage: e.target.value })}>{Object.keys(stageColors).map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Ответственный<input list="people-list" value={task.owner} onChange={e => onUpdate({ owner: e.target.value })} /><datalist id="people-list">{people.map(x => <option key={x}>{x}</option>)}</datalist></label>
      <label>Дедлайн<input type="date" value={task.deadline} onChange={e => onUpdate({ deadline: e.target.value })} /></label>
      <label>Статус<select value={task.status} onChange={e => onUpdate({ status: e.target.value as Status })}>{['Не начато', 'В работе', 'Готово', 'Просрочено', 'Заблокировано'].map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Прогресс: {task.progress}%<input type="range" min="0" max="100" value={task.progress} onChange={e => onUpdate({ progress: Number(e.target.value) })} /></label>
    </div><div className="autosave"><Check /> Все изменения сохраняются автоматически</div><button className="delete-task" onClick={onDelete}>Удалить задачу</button></div></>;
}

function TaskCard({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) { return <button className="task-card" onClick={() => onOpen(task)}><i style={{ background: color(task.stage) }} /><b>{task.title}</b><small><Avatar name={task.owner || '?'} />{task.owner || 'Не назначен'}</small></button>; }
function Stat({ label, value, c }: { label: string; value: number; c: string }) { return <div className={`stat ${c}`}><div className="stat-icon">↗</div><div><small>{label}</small><strong>{value}</strong><p>Актуальные данные</p></div><ArrowUpRight /></div>; }
function StatusTag({ status }: { status: Status }) { return <span className={`status ${status.replaceAll(' ', '-').toLowerCase()}`}><i />{status}</span>; }
function Avatar({ name }: { name: string }) { return <div className="avatar" style={{ background: color(name) + '22', color: color(name) }}>{initials(name)}</div>; }
function initials(name: string) { return name.split(/[ ,]+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || '?'; }
function color(key: string) { return stageColors[key] ?? ['#7557ed', '#f2b938', '#ff6e73', '#25b884', '#4f8df7'][[...key].reduce((a, c) => a + c.charCodeAt(0), 0) % 5]; }
function splitOwners(owner: string) { return owner.split(/,| и /).map(x => x.trim()).filter(Boolean); }
function formatDate(value: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—'; }
function progress(tasks: Task[]) { return tasks.length ? Math.round(tasks.reduce((a, t) => a + t.progress, 0) / tasks.length) : 0; }
function load<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let value = ''; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(value.trim()); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(value.trim()); if (row.some(Boolean)) rows.push(row); row = []; value = '';
    } else value += char;
  }
  row.push(value.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}

function rowsToTasks(input: unknown[][]): Task[] {
  const rows = input.map(row => row.map(cell => String(cell ?? '').trim())).filter(row => row.some(Boolean));
  if (!rows.length) return [];
  const header = rows[0].map(x => x.toLowerCase());
  const taskIndex = Math.max(0, header.findIndex(x => /задач|назван|этап/.test(x)));
  const ownerIndex = header.findIndex(x => /ответствен/.test(x));
  const deadlineIndex = header.findIndex(x => /дедлайн|срок|окончан/.test(x));
  const statusIndex = header.findIndex(x => /статус/.test(x));
  const stageIndex = header.findIndex(x => x === 'этап');
  const knownStages = new Set(Object.keys(stageColors)); let currentStage = 'Без этапа'; const result: Task[] = [];
  rows.slice(1).forEach((row, index) => {
    const title = row[taskIndex] ?? ''; const owner = ownerIndex >= 0 ? row[ownerIndex] ?? '' : row[1] ?? '';
    const explicitStage = stageIndex >= 0 ? row[stageIndex] ?? '' : '';
    if (knownStages.has(title) && !owner) { currentStage = title; return; }
    if (!title || /^июл|^август|^дата$/i.test(title)) return;
    const stage = explicitStage && explicitStage !== title ? explicitStage : currentStage;
    const statusValue = statusIndex >= 0 ? row[statusIndex] : '';
    result.push({ id: Date.now() + index, title, stage, owner, deadline: normalizeDate(deadlineIndex >= 0 ? row[deadlineIndex] : ''), status: isStatus(statusValue) ? statusValue : 'Не начато', progress: 0, start: index % 18, span: 3 + index % 4 });
  });
  return result;
}

function objectsToTasks(source: unknown[]): Task[] {
  return source.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const value = item as Record<string, unknown>;
    const title = String(value.title ?? value.name ?? value['Задача'] ?? value['Название'] ?? '').trim();
    if (!title) return [];
    const status = String(value.status ?? value['Статус'] ?? 'Не начато');
    return [{ id: Number(value.id) || Date.now() + index, title, stage: String(value.stage ?? value['Этап'] ?? 'Без этапа'), owner: String(value.owner ?? value.assignee ?? value['Ответственный'] ?? ''), deadline: normalizeDate(value.deadline ?? value['Дедлайн']), status: isStatus(status) ? status : 'Не начато', progress: Number(value.progress) || 0, start: Number(value.start) || index % 18, span: Number(value.span) || 4 }];
  });
}

function isStatus(value: string): value is Status { return ['Не начато', 'В работе', 'Готово', 'Просрочено', 'Заблокировано'].includes(value); }
function normalizeDate(value: unknown) {
  const text = String(value ?? '').trim(); if (!text) return '';
  const match = text.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?$/);
  if (match) { const year = match[3] ? (match[3].length === 2 ? `20${match[3]}` : match[3]) : '2026'; return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`; }
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}
