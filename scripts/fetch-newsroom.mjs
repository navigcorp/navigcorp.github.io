// 네이버 블로그(navigcorp) RSS를 읽어 Newsroom용 JSON(data/newsroom.json)으로 저장합니다.
// 외부 패키지 없이 Node 18+ 에서 동작합니다. GitHub Actions(.github/workflows/newsroom.yml)가 주기적으로 실행합니다.
// 로컬 실행: node scripts/fetch-newsroom.mjs

import { writeFile, mkdir, readFile } from "node:fs/promises";

const RSS_URL = "https://rss.blog.naver.com/navigcorp.xml";
const OUT = new URL("../data/newsroom.json", import.meta.url);
const PER_SECTION = 6;

// 블로그 카테고리 -> Newsroom 칸 매핑 (카테고리가 늘면 여기만 고칩니다)
const SECTION_BY_CATEGORY = {
  "나빅소식": "news",
  "인사이트": "insights",
  "비하인드 더 씬": "insights",
  "트렌드 톡": "insights",
};

const unCdata = (s = "") => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
const decode = (s = "") =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? unCdata(m[1]) : "";
};

const res = await fetch(RSS_URL, { headers: { "user-agent": "navigcorp.com newsroom bot" } });
if (!res.ok) throw new Error(`RSS ${res.status}`);
const xml = await res.text();

const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, it]) => {
  const descHtml = decode(tag(it, "description"));
  const img = descHtml.match(/src="([^"]+)"/);
  const text = descHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const category = tag(it, "category");
  const link = tag(it, "link").split("?")[0];
  return {
    section: SECTION_BY_CATEGORY[category] || "insights",
    category,
    title: decode(tag(it, "title")).replace(/\s*\|\s*(제작사 체크리스트|트렌드 톡)$/, ""),
    // 한국 시간 기준 날짜(YYYY-MM-DD)
    date: new Date(new Date(tag(it, "pubDate")).getTime() + 9 * 3600e3).toISOString().slice(0, 10),
    url: link,
    excerpt: text.slice(0, 140),
    image: img ? img[1] : null,
  };
});

const data = {
  source: RSS_URL,
  updated: new Date().toISOString(),
  insights: items.filter((i) => i.section === "insights").slice(0, PER_SECTION),
  news: items.filter((i) => i.section === "news").slice(0, PER_SECTION),
};

// 글 목록이 그대로면 파일을 건드리지 않습니다(불필요한 커밋 방지).
const prev = await readFile(OUT, "utf8").then(JSON.parse).catch(() => null);
if (prev && JSON.stringify([prev.insights, prev.news]) === JSON.stringify([data.insights, data.news])) {
  console.log("newsroom.json: 변경 없음");
  process.exit(0);
}

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(OUT, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`newsroom.json: insights ${data.insights.length}, news ${data.news.length}`);
