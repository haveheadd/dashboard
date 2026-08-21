import JSZip from "jszip";
import mammoth from "mammoth/mammoth.browser";
import type { Asset, WikiPage } from "./hubData";

type DocxProjectData = {
  text: string;
  wiki: WikiPage[];
  assets: Asset[];
  commentCount: number;
};

const NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

function textOf(node: Element) {
  return Array.from(node.getElementsByTagNameNS(NS, "t"))
    .map((x) => x.textContent || "")
    .join("")
    .trim();
}
function ancestor(node: Element, localName: string): Element | null {
  let current: Element | null = node;
  while (current && current.localName !== localName) current = current.parentElement;
  return current;
}
function cleanName(anchor: string, paragraph: string, index: number) {
  const useful =
    anchor.trim() && !/^(figma|ссылка|открыть|здесь)$/i.test(anchor.trim())
      ? anchor.trim()
      : "";
  const context = paragraph
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\bfigma\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return (useful || context || `Материал ${index + 1}`).slice(0, 110);
}
function nameFromDocument(hyperlink: Element, paragraph: Element, index: number) {
  const anchor = textOf(hyperlink).trim();
  const row = ancestor(hyperlink, "tr");
  const linkCell = ancestor(hyperlink, "tc");
  if (!row || !linkCell) return cleanName(anchor, textOf(paragraph), index);
  const cells = Array.from(row.children).filter((node) => node.localName === "tc");
  const cellIndex = cells.indexOf(linkCell);
  const firstCell = textOf(cells[0] || row);
  const currentCell = textOf(linkCell);
  const withoutLink = currentCell
    .replace(anchor, "")
    .replace(/\bfigma\b/gi, "")
    .replace(/\(бэку передадим файлом\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  let base = cellIndex >= 2 ? firstCell : withoutLink || firstCell;
  if (!base || base.length > 120) base = firstCell || cleanName(anchor, textOf(paragraph), index);
  const specificAnchor = anchor && !/^(figma|ссылка|открыть|здесь)$/i.test(anchor);
  if (specificAnchor && !base.toLowerCase().includes(anchor.toLowerCase())) base = `${base} — ${anchor}`;
  return base.slice(0, 140);
}
function assetType(url: string) {
  if (/figma\.com/i.test(url)) return "Figma";
  if (/forms\./i.test(url)) return "Форма";
  if (/presentation|slides/i.test(url)) return "Презентация";
  if (/disk\.|drive\./i.test(url)) return "Файл";
  return "Ссылка";
}

export async function extractDocxProjectData(
  file: File,
  buildWiki: (text: string, offset: number) => WikiPage[],
): Promise<DocxProjectData> {
  const buffer = await file.arrayBuffer();
  const raw = (await mammoth.extractRawText({ arrayBuffer: buffer })).value;
  const zip = await JSZip.loadAsync(buffer);
  const parser = new DOMParser();
  const documentXml = await zip.file("word/document.xml")?.async("string");
  const relsXml = await zip
    .file("word/_rels/document.xml.rels")
    ?.async("string");
  const linkRows: { name: string; url: string }[] = [];
  if (documentXml && relsXml) {
    const doc = parser.parseFromString(documentXml, "application/xml");
    const rels = parser.parseFromString(relsXml, "application/xml");
    const relMap = new Map(
      Array.from(rels.getElementsByTagName("Relationship")).map((node) => [
        node.getAttribute("Id") || "",
        node.getAttribute("Target") || "",
      ]),
    );
    for (const paragraph of Array.from(doc.getElementsByTagNameNS(NS, "p"))) {
      const paragraphText = textOf(paragraph);
      for (const hyperlink of Array.from(
        paragraph.getElementsByTagNameNS(NS, "hyperlink"),
      )) {
        const url = relMap.get(hyperlink.getAttributeNS(R, "id") || "") || "";
        if (url && /^https?:/i.test(url))
          linkRows.push({name:nameFromDocument(hyperlink,paragraph,linkRows.length),url});
      }
    }
  }
  const uniqueLinks = linkRows.filter(
    (item, index, all) => all.findIndex((x) => x.url === item.url) === index,
  );
  const assets: Asset[] = uniqueLinks.map((item, index) => ({
    id: `asset-${Date.now()}-${index}`,
    name: item.name,
    type: assetType(item.url),
    status: "Готово",
    figmaUrl: item.url,
    taskIds: [],
    wikiIds: [],
  }));
  const wiki = buildWiki(raw, 0);
  let commentCount = 0;
  const commentsXml = await zip.file("word/comments.xml")?.async("string");
  if (commentsXml) {
    const commentsDoc = parser.parseFromString(commentsXml, "application/xml");
    const comments = Array.from(
      commentsDoc.getElementsByTagNameNS(NS, "comment"),
    )
      .map((node) => {
        const author =
          node.getAttributeNS(NS, "author") ||
          node.getAttribute("w:author") ||
          "Автор";
        const text = textOf(node);
        return text ? `${author}: ${text}` : "";
      })
      .filter(Boolean);
    commentCount = comments.length;
    if (comments.length)
      wiki.push({
        id: `comments-${Date.now()}`,
        title: "Комментарии из документа",
        content: comments,
      });
  }
  return { text: raw, wiki, assets, commentCount };
}
