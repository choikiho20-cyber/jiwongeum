import store from "../../data/notices.json";
import NoticeBoard from "./NoticeBoard";

export type Region = { code: string; name: string; parent: string | null };

export type Notice = {
  id: string;
  title: string;
  summary: string;
  target: string;
  applyMethod: string;
  contact: string;
  applyUrl: string;
  org: string;
  field: string;
  regionCode: string;
  regionName: string;
  startAt: string | null;
  endAt: string | null;
  deadlineNote: string;
  url: string;
  firstSeen: string;
};

function daysLeft(endAt: string | null, today: string) {
  if (!endAt) return null;
  const ms = new Date(endAt).getTime() - new Date(today).getTime();
  return Math.round(ms / 86400000);
}

export default function Home() {
  // 정적 생성이라 빌드 시점 기준으로 D-day를 굳힌다. 매일 아침 수집 후 재빌드하면 항상 맞는다.
  const today = new Date().toISOString().slice(0, 10);

  const notices = (store.notices as Notice[])
    .map((n) => ({ ...n, dday: daysLeft(n.endAt, today) }))
    .filter((n) => n.dday === null || n.dday >= 0);

  return (
    <NoticeBoard
      notices={notices}
      regions={store.regions}
      updatedAt={store.updatedAt}
      today={today}
    />
  );
}
