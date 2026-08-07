// 기업마당 hashtags에는 광역 태그(충북, 강원 …)만 들어온다.
// 전국 공고는 16개 광역이 전부 붙어 나오므로 태그 개수로 전국 여부를 가른다.
// 시군은 태그에 없어서 소관기관명·공고명에서 따로 뽑는다.

const AREA_TAGS = [
  "서울", "부산", "대구", "인천", "전남광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "경북", "경남", "제주",
];

// 태그가 이 개수 이상이면 특정 지역 사업이 아니라 전국 사업으로 본다
const NATIONWIDE_THRESHOLD = 15;

// 우리가 다루는 광역
const OURS = {
  충북: { code: "chungbuk", name: "충청북도" },
  강원: { code: "gangwon", name: "강원특별자치도" },
};

const SIGUN = [
  { code: "cheongju", name: "청주시", parent: "충청북도", keyword: "청주" },
  { code: "chungju", name: "충주시", parent: "충청북도", keyword: "충주" },
  { code: "jecheon", name: "제천시", parent: "충청북도", keyword: "제천" },
  { code: "boeun", name: "보은군", parent: "충청북도", keyword: "보은" },
  { code: "okcheon", name: "옥천군", parent: "충청북도", keyword: "옥천" },
  { code: "yeongdong", name: "영동군", parent: "충청북도", keyword: "영동" },
  { code: "jeungpyeong", name: "증평군", parent: "충청북도", keyword: "증평" },
  { code: "jincheon", name: "진천군", parent: "충청북도", keyword: "진천" },
  { code: "goesan", name: "괴산군", parent: "충청북도", keyword: "괴산" },
  { code: "eumseong", name: "음성군", parent: "충청북도", keyword: "음성" },
  { code: "danyang", name: "단양군", parent: "충청북도", keyword: "단양" },
  { code: "chuncheon", name: "춘천시", parent: "강원특별자치도", keyword: "춘천" },
  { code: "wonju", name: "원주시", parent: "강원특별자치도", keyword: "원주" },
  { code: "gangneung", name: "강릉시", parent: "강원특별자치도", keyword: "강릉" },
  { code: "donghae", name: "동해시", parent: "강원특별자치도", keyword: "동해" },
  { code: "sokcho", name: "속초시", parent: "강원특별자치도", keyword: "속초" },
  { code: "samcheok", name: "삼척시", parent: "강원특별자치도", keyword: "삼척" },
  { code: "taebaek", name: "태백시", parent: "강원특별자치도", keyword: "태백" },
  { code: "yeongwol", name: "영월군", parent: "강원특별자치도", keyword: "영월" },
  { code: "jeongseon", name: "정선군", parent: "강원특별자치도", keyword: "정선" },
  { code: "pyeongchang", name: "평창군", parent: "강원특별자치도", keyword: "평창" },
  { code: "hongcheon", name: "홍천군", parent: "강원특별자치도", keyword: "홍천" },
  { code: "hoengseong", name: "횡성군", parent: "강원특별자치도", keyword: "횡성" },
  { code: "cheorwon", name: "철원군", parent: "강원특별자치도", keyword: "철원" },
  { code: "hwacheon", name: "화천군", parent: "강원특별자치도", keyword: "화천" },
  { code: "yanggu", name: "양구군", parent: "강원특별자치도", keyword: "양구" },
  { code: "inje", name: "인제군", parent: "강원특별자치도", keyword: "인제" },
  { code: "goseong", name: "고성군", parent: "강원특별자치도", keyword: "고성" },
  { code: "yangyang", name: "양양군", parent: "강원특별자치도", keyword: "양양" },
];

export const NATIONWIDE = { code: "nationwide", name: "전국", parent: null };

// 우리 대상이 아니면 null을 돌려준다 (서울·경기 등 남의 지역 공고는 저장하지 않는다)
export function classifyRegion(item) {
  const tags = String(item.hashtags ?? "").split(",").map((s) => s.trim());
  const areas = AREA_TAGS.filter((a) => tags.includes(a));

  if (areas.length === 0 || areas.length >= NATIONWIDE_THRESHOLD) return NATIONWIDE;

  const mine = areas.map((a) => OURS[a]).filter(Boolean);
  if (!mine.length) return null;

  const haystack = [item.jrsdInsttNm, item.excInsttNm, item.pblancNm].filter(Boolean).join(" ");
  const sigun = SIGUN.find((s) => s.parent === mine[0].name && haystack.includes(s.keyword));
  return sigun ?? mine[0];
}

// 화면에서 쓰는 지역 트리
export const REGION_TREE = [
  { code: "chungbuk", name: "충청북도", parent: null },
  ...SIGUN.filter((s) => s.parent === "충청북도").map(({ code, name, parent }) => ({ code, name, parent })),
  { code: "gangwon", name: "강원특별자치도", parent: null },
  ...SIGUN.filter((s) => s.parent === "강원특별자치도").map(({ code, name, parent }) => ({ code, name, parent })),
  NATIONWIDE,
];
