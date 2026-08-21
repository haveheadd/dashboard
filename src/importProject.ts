import * as XLSX from "xlsx";

type Status =
  | "Готово"
  | "В работе"
  | "На согласовании"
  | "Не начато"
  | "Просрочено";
export type ImportedTask = {
  id: number;
  title: string;
  stage: string;
  color: string;
  start: number;
  span: number;
  owner: string;
  initials: string;
  status: Status;
  progress: number;
  deadline?: string;
};

const colors = [
  "#7557ed",
  "#f2b938",
  "#ff6e73",
  "#4f8df7",
  "#a564e8",
  "#25b884",
];
const pick = (row: Record<string, unknown>, names: string[]) => {
  const key = Object.keys(row).find((k) =>
    names.includes(k.trim().toLowerCase()),
  );
  return key ? row[key] : undefined;
};
const number = (value: unknown, fallback: number) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
};
const status = (value: unknown): Status => {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  if (text.includes("готов") || text === "done") return "Готово";
  if (text.includes("согласован") || text.includes("ревью"))
    return "На согласовании";
  if (text.includes("работ") || text.includes("progress")) return "В работе";
  if (text.includes("проср") || text.includes("overdue")) return "Просрочено";
  return "Не начато";
};
const deadline = (value: unknown) => {
  const text = String(value || "").trim();
  return status(text) === "Не начато" && text ? text : undefined;
};
const initials = (owner: string) =>
  owner
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase() || "—";

function normalize(rows: Record<string, unknown>[]): ImportedTask[] {
  const result = rows
    .map((row, index) => {
      const title = String(
        pick(row, ["задача", "название", "task", "title", "name"]) || "",
      ).trim();
      if (!title) return null;
      const owner = String(
        pick(row, ["ответственный", "исполнитель", "owner", "assignee"]) ||
          "Не назначен",
      ).trim();
      const stage = String(
        pick(row, ["этап", "группа", "stage", "phase"]) || "Без этапа",
      ).trim();
      const rawStatus = pick(row, ["статус", "status", "дедлайн / статус"]);
      const rawDeadline =
        pick(row, ["дедлайн", "deadline", "due date"]) ?? rawStatus;
      const normalizedStatus = status(rawStatus);
      const progress = Math.max(
        0,
        Math.min(
          100,
          number(
            pick(row, ["прогресс", "progress", "готовность"]),
            normalizedStatus === "Готово" ? 100 : 0,
          ),
        ),
      );
      return {
        id: index + 1,
        title,
        stage,
        color: colors[index % colors.length],
        start: Math.max(
          0,
          number(pick(row, ["начало", "старт", "start", "start day"]), index),
        ),
        span: Math.max(
          1,
          number(pick(row, ["длительность", "дни", "duration", "span"]), 3),
        ),
        owner,
        initials: initials(owner),
        status: normalizedStatus,
        progress,
        deadline: deadline(rawDeadline),
      };
    })
    .filter(Boolean) as ImportedTask[];
  if (!result.length)
    throw new Error(
      "Не найдены задачи. Добавьте колонку «Задача» или «Название».",
    );
  return result;
}

function normalizeMatrix(rows: unknown[][]): ImportedTask[] {
  const clean = rows
    .map((row) =>
      row.map((value) => (typeof value === "string" ? value.trim() : value)),
    )
    .filter((row) => row.some(Boolean));
  if (String(clean[0]?.[0] || "").toLowerCase() === "этап") {
    let stage = "Без этапа";
    const projectRows: Record<string, unknown>[] = [];
    for (const row of clean.slice(2)) {
      const title = String(row[0] || "").trim();
      const owner = String(row[1] || "").trim();
      const due = String(row[2] || "").trim();
      if (!title) continue;
      if (!owner && !due) {
        stage = title;
        continue;
      }
      projectRows.push({
        Задача: title,
        Этап: stage,
        Ответственный: owner || "Не назначен",
        "Дедлайн / статус": due,
        Начало: projectRows.length,
        Длительность: 3,
        Прогресс: /готово/i.test(due) ? 100 : 0,
      });
    }
    return normalize(projectRows);
  }
  const aliases = ["задача", "название", "task", "title", "name"];
  const headerIndex = clean.findIndex((row) =>
    row.some((value) => aliases.includes(String(value).toLowerCase())),
  );
  if (headerIndex >= 0) {
    const headers = clean[headerIndex].map((value) => String(value));
    return normalize(
      clean
        .slice(headerIndex + 1)
        .map((row) =>
          Object.fromEntries(
            headers.map((header, index) => [header, row[index] ?? ""]),
          ),
        ),
    );
  }
  let stage = "Без этапа";
  const candidates: Record<string, unknown>[] = [];
  for (const row of clean) {
    const values = row.map((value) => String(value ?? "").trim());
    const textCells = values.filter(Boolean);
    if (!textCells.length) continue;
    if (textCells.length === 1) {
      stage = textCells[0];
      continue;
    }
    const title = values[0] || values[1];
    if (
      !title ||
      /дата|понедельник|вторник|среда|четверг|пятница|суббота|воскресенье/i.test(
        title,
      )
    )
      continue;
    candidates.push({
      Задача: title,
      Этап: stage,
      Ответственный: values[1] || "Не назначен",
      Начало: candidates.length,
      Длительность: 3,
    });
  }
  return normalize(candidates);
}

export async function parseProjectFile(file: File): Promise<ImportedTask[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "json") {
    const data = JSON.parse(await file.text());
    return normalize(Array.isArray(data) ? data : data.tasks || []);
  }
  if (!["xlsx", "xls", "csv"].includes(extension || ""))
    throw new Error("Поддерживаются файлы XLSX, XLS, CSV и JSON.");
  if (extension === "csv") {
    const text = new TextDecoder("utf-8")
      .decode(await file.arrayBuffer())
      .replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/).filter(Boolean);
    const delimiter =
      (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length
        ? ";"
        : ",";
    const headers =
      lines
        .shift()
        ?.split(delimiter)
        .map((x) => x.trim().replace(/^"|"$/g, "")) || [];
    return normalize(
      lines.map((line) =>
        Object.fromEntries(
          line
            .split(delimiter)
            .map((value, index) => [
              headers[index],
              value.trim().replace(/^"|"$/g, ""),
            ]),
        ),
      ),
    );
  }
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
    cellStyles: true,
  });
  const sheet =
    workbook.Sheets[
      workbook.SheetNames.find((name) => /гант|gantt/i.test(name)) ||
        workbook.SheetNames[0]
    ];
  if (!sheet) throw new Error("В файле нет листов.");
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });
  return normalizeMatrix(matrix);
}
