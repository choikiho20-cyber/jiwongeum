"use client";

import { useMemo, useState } from "react";
import type { Notice, Region } from "./page";

type Item = Notice & { dday: number | null };

function ddayStyle(item: Item) {
  if (item.dday === null) {
    // "예산 소진시까지"는 마감일이 없는 게 아니라 먼저 신청한 사람이 가져간다는 뜻이다
    const soji = item.deadlineNote.includes("소진") || item.deadlineNote.includes("선착순");
    return {
      label: item.deadlineNote.replace(/\s*접수$/, "").slice(0, 8) || "기한 미정",
      cls: soji ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600",
    };
  }
  if (item.dday <= 7) return { label: `D-${item.dday}`, cls: "bg-red-50 text-red-700" };
  if (item.dday <= 14) return { label: `D-${item.dday}`, cls: "bg-amber-50 text-amber-700" };
  return { label: `D-${item.dday}`, cls: "bg-emerald-50 text-emerald-700" };
}

function Card({ item, urgent }: { item: Item; urgent?: boolean }) {
  const d = ddayStyle(item);
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-xl bg-white p-4 transition hover:border-gray-300 ${
        urgent ? "border border-red-200" : "border border-gray-200"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className={`rounded px-2 py-0.5 font-medium ${d.cls}`}>{d.label}</span>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">{item.regionName}</span>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">{item.field}</span>
      </div>
      <h3 className="mb-1.5 font-medium leading-snug text-gray-900">{item.title}</h3>
      <p className="text-sm text-gray-500">
        {item.org}
        {item.endAt ? ` · ~${item.endAt.replace(/-/g, ".").slice(5)}` : ""}
        {item.applyMethod ? ` · ${item.applyMethod}` : ""}
      </p>
      {item.target ? (
        <p className="mt-2 border-t border-gray-100 pt-2 text-sm text-gray-500">{item.target}</p>
      ) : null}
    </a>
  );
}

export default function NoticeBoard({
  notices,
  regions,
  updatedAt,
  today,
}: {
  notices: Item[];
  regions: Region[];
  updatedAt: string | null;
  today: string;
}) {
  const [region, setRegion] = useState("all");
  const [field, setField] = useState("all");
  // 80%가 중소기업 대상(수출·기술 사업)이라 소상공인으로 좁혀서 보여준다
  const [target, setTarget] = useState("소상공인");

  const options = useMemo(() => regions.filter((r) => r.name !== "전국"), [regions]);
  const fields = useMemo(
    () => [...new Set(notices.map((n) => n.field))].sort(),
    [notices],
  );
  const targets = useMemo(
    () => [...new Set(notices.map((n) => n.target).filter(Boolean))].sort(),
    [notices],
  );

  // 제천시를 고른 사장님도 충북 광역·전국 공고의 신청 대상이다. 셋을 함께 보여준다.
  const inRegion = (n: Item) => {
    if (region === "all" || n.regionName === "전국" || n.regionName === region) return true;
    return regions.find((r) => r.name === region)?.parent === n.regionName;
  };

  const filtered = notices.filter(
    (n) =>
      inRegion(n) &&
      (field === "all" || n.field === field) &&
      (target === "all" || n.target === target),
  );

  const urgent = filtered.filter((n) => n.dday !== null && n.dday <= 7);
  const fresh = filtered.filter((n) => n.firstSeen === today && !urgent.includes(n));
  const rest = filtered.filter((n) => !urgent.includes(n) && !fresh.includes(n));

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <h1 className="text-lg font-medium">오늘의지원금</h1>
          <p className="text-xs text-gray-500">충북·강원 소상공인 지원사업</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
          >
            <option value="all">전체 대상</option>
            {targets.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
          >
            <option value="all">전체 지역</option>
            {options.map((r) => (
              <option key={r.code} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
          >
            <option value="all">전체 분야</option>
            {fields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </header>

      {urgent.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-red-700">마감 임박</h2>
          <div className="space-y-2">
            {urgent.map((n) => (
              <Card key={n.id} item={n} urgent />
            ))}
          </div>
        </section>
      )}

      {fresh.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-medium">
            오늘 새로 뜬 공고 <span className="text-gray-400">{fresh.length}</span>
          </h2>
          <div className="space-y-2">
            {fresh.map((n) => (
              <Card key={n.id} item={n} />
            ))}
          </div>
        </section>
      )}

      <div className="mb-6 rounded-xl border border-brand-100 bg-brand-50 p-4">
        <p className="mb-1 text-xs text-brand-600">소통마케팅센터</p>
        <p className="font-medium text-brand-900">지원금 받고 나서, 홍보가 막막하시죠?</p>
        <p className="mt-0.5 text-sm text-brand-700">
          블로그·인스타 자동 발행 — 글해줌 창립멤버 모집 →
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium">
          신청 가능한 공고 <span className="text-gray-400">{rest.length}</span>
        </h2>
        <div className="space-y-2">
          {rest.map((n) => (
            <Card key={n.id} item={n} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">
            해당 조건의 공고가 없습니다.
          </p>
        )}
      </section>

      <footer className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
        <p>{updatedAt ? `${updatedAt} 기준` : ""} · 출처: 중소벤처기업부 기업마당</p>
        <p className="mt-1">
          자동 수집된 요약입니다. 최종 조건은 반드시 원문 공고문을 확인하세요.
        </p>
      </footer>
    </main>
  );
}
