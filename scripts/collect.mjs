// 기업마당 지원사업정보 API를 받아 data/notices.json에 누적한다.
//   npm run collect          평소 수집
//   npm run collect -- --raw 원본 응답 1건 출력 (필드명 확인용)

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyRegion, REGION_TREE } from "./regions.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STORE = join(ROOT, "data", "notices.json");
const API = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do";

function pickDates(raw) {
  // 절반 이상이 날짜가 아니라 "예산 소진시까지", "상시 접수" 같은 문구로 온다.
  // 날짜가 없으면 원문을 그대로 남긴다 — "예산 소진시까지"는 오히려 서둘러야 하는 공고다.
  const text = String(raw ?? "").trim();
  const found = text.replace(/-/g, "").match(/\d{8}/g);
  if (!found) return { startAt: null, endAt: null, deadlineNote: text || "기한 미정" };

  const iso = (d) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  return {
    startAt: iso(found[0]),
    endAt: found[1] ? iso(found[1]) : null,
    deadlineNote: found[1] ? "" : text,
  };
}

// bsnsSumryCn은 <p> 태그가 섞인 HTML로 온다
function stripHtml(html) {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(item) {
  const region = classifyRegion(item);
  if (!region) return null; // 우리 대상 지역이 아니다

  const { startAt, endAt, deadlineNote } = pickDates(item.reqstBeginEndDe);
  const org = item.jrsdInsttNm || item.excInsttNm || "";

  return {
    id: String(item.pblancId ?? "").trim(),
    title: String(item.pblancNm ?? "").trim(),
    summary: stripHtml(item.bsnsSumryCn),
    target: String(item.trgetNm ?? "").trim(),
    applyMethod: String(item.reqstMthPapersCn ?? "").trim(),
    contact: String(item.refrncNm ?? "").trim(),
    applyUrl: String(item.rceptEngnHmpgUrl ?? "").trim(),
    org,
    field: item.pldirSportRealmLclasCodeNm || item.pldirSportRealmMlsfcCodeNm || "기타",
    regionCode: region.code,
    regionName: region.name,
    startAt,
    endAt,
    deadlineNote,
    url: item.pblancUrl
      ? item.pblancUrl.startsWith("http")
        ? item.pblancUrl
        : `https://www.bizinfo.go.kr${item.pblancUrl}`
      : "",
  };
}

async function fetchNotices(key) {
  // 전체가 1,400건대라 넉넉히 요청한다. 응답의 totCnt로 다 받았는지 확인한다.
  const url = `${API}?crtfcKey=${encodeURIComponent(key)}&dataType=json&searchCnt=3000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`기업마당 API 응답 ${res.status}`);

  const body = await res.json();
  // 응답이 { jsonArray: [...] } 로 오는 것을 기대하되, 형태가 바뀌어도 배열을 찾아낸다
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.jsonArray)) return body.jsonArray;
  const arr = Object.values(body).find(Array.isArray);
  if (arr) return arr;
  throw new Error(`응답에서 목록을 찾지 못했습니다: ${JSON.stringify(body).slice(0, 300)}`);
}

async function loadStore() {
  try {
    return JSON.parse(await readFile(STORE, "utf8"));
  } catch {
    return { updatedAt: null, notices: [] };
  }
}

const key = process.env.BIZINFO_KEY;
if (!key || key.includes("여기에")) {
  console.error(".env 파일에 BIZINFO_KEY를 넣어주세요. (.env.example 참고)");
  process.exit(1);
}

const raw = await fetchNotices(key);
const total = raw[0]?.totCnt;
console.log(`기업마당에서 ${raw.length}건 받았습니다.${total ? ` (전체 ${total}건)` : ""}`);
if (total && raw.length < total) {
  console.warn(`⚠ ${total - raw.length}건을 못 받았습니다. searchCnt를 더 올려야 합니다.`);
}

if (process.argv.includes("--raw")) {
  console.log(JSON.stringify(raw[0], null, 2));
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const store = await loadStore();
const seen = new Map(store.notices.map((n) => [n.id, n]));

let added = 0;
let skipped = 0;
for (const item of raw) {
  const notice = normalize(item);
  if (!notice) {
    skipped += 1;
    continue;
  }
  if (!notice.id || !notice.title) continue;

  const before = seen.get(notice.id);
  seen.set(notice.id, {
    ...notice,
    firstSeen: before?.firstSeen ?? today,
  });
  if (!before) added += 1;
}

const notices = [...seen.values()].sort((a, b) => (a.endAt ?? "9999").localeCompare(b.endAt ?? "9999"));

await mkdir(dirname(STORE), { recursive: true });
await writeFile(
  STORE,
  JSON.stringify({ updatedAt: today, regions: REGION_TREE, notices }, null, 2),
  "utf8",
);

console.log(`신규 ${added}건 / 보관 ${notices.length}건 (타 지역 ${skipped}건 제외) → data/notices.json`);
