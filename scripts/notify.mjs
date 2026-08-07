// 오늘 새로 뜬 공고와 마감이 임박한 공고를 메일로 보낸다.
//   npm run notify        발송
//   npm run notify -- --dry  발송하지 않고 내용만 출력

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STORE = join(ROOT, "data", "notices.json");

// 마감 알림은 D-7, D-3, D-1에만 보낸다. 매일 보내면 같은 공고가 반복돼 메일을 안 보게 된다.
const DEADLINE_DAYS = [7, 3, 1];

function daysLeft(endAt, today) {
  if (!endAt) return null;
  return Math.round((new Date(endAt) - new Date(today)) / 86400000);
}

function row(n) {
  const when = n.endAt ? `~${n.endAt.slice(5).replace("-", ".")}` : "상시";
  const dday = n.dday === null ? "상시" : `D-${n.dday}`;
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee">
        <div style="font-size:12px;color:#666">
          <b style="color:${n.dday !== null && n.dday <= 7 ? "#c0392b" : "#2b7a4b"}">${dday}</b>
          &nbsp;·&nbsp;${n.regionName}&nbsp;·&nbsp;${n.field}
        </div>
        <div style="font-size:15px;margin:4px 0">
          <a href="${n.url}" style="color:#1a1a1a;text-decoration:none">${n.title}</a>
        </div>
        <div style="font-size:13px;color:#666">${n.org} · ${when}${n.target ? ` · ${n.target}` : ""}</div>
      </td>
    </tr>`;
}

function section(title, items) {
  if (!items.length) return "";
  return `
    <h2 style="font-size:15px;margin:24px 0 4px">${title} <span style="color:#999">${items.length}</span></h2>
    <table style="width:100%;border-collapse:collapse">${items.map(row).join("")}</table>`;
}

const today = new Date().toISOString().slice(0, 10);
const store = JSON.parse(await readFile(STORE, "utf8"));

// 수집분의 80%가 중소기업 대상(수출·기술 사업)이라 메일에는 소상공인 것만 담는다
const all = store.notices
  .filter((n) => n.target.includes("소상공인"))
  .map((n) => ({ ...n, dday: daysLeft(n.endAt, today) }));

const urgent = all.filter((n) => DEADLINE_DAYS.includes(n.dday));
const fresh = all.filter(
  (n) => n.firstSeen === today && !urgent.includes(n) && (n.dday === null || n.dday >= 0),
);

if (!urgent.length && !fresh.length) {
  console.log("보낼 내용이 없어 발송하지 않았습니다.");
  process.exit(0);
}

const [, mm, dd] = today.split("-");
const subject = `[지원금] ${+mm}월 ${+dd}일 · 신규 ${fresh.length}건, 마감임박 ${urgent.length}건`;
const html = `
  <div style="max-width:600px;font-family:-apple-system,'Malgun Gothic',sans-serif;color:#1a1a1a">
    ${section("마감 임박 — 오늘 챙기셔야 합니다", urgent)}
    ${section("새로 뜬 공고", fresh)}
    <p style="font-size:12px;color:#999;margin-top:28px;border-top:1px solid #eee;padding-top:12px">
      출처: 중소벤처기업부 기업마당 · 최종 조건은 반드시 원문 공고문을 확인하세요.
    </p>
  </div>`;

if (process.argv.includes("--dry")) {
  console.log(`제목: ${subject}\n`);
  console.log(html);
  process.exit(0);
}

const { GMAIL_USER, GMAIL_APP_PASSWORD, NOTIFY_TO } = process.env;
if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error(".env에 GMAIL_USER와 GMAIL_APP_PASSWORD를 넣어주세요. (.env.example 참고)");
  process.exit(1);
}

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
});

await transport.sendMail({
  from: `오늘의지원금 <${GMAIL_USER}>`,
  to: NOTIFY_TO || GMAIL_USER,
  subject,
  html,
});

console.log(`발송 완료 — 신규 ${fresh.length}건, 마감임박 ${urgent.length}건`);
