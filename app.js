const TOPICS = ["cwally-port", "cwally-flow", "cwally-ops"];
const $ = (id) => document.getElementById(id);

function kst(ts) {
  if (!ts) return "";
  const d = new Date(Number(ts) * 1000);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}
function prefixOf(title) {
  const m = String(title || "").match(/^\[[^\]]+\]/);
  return m ? m[0] : "";
}
function escapeHtml(s) {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
async function pollTopic(topic) {
  const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=48h`);
  if (!res.ok) return [];
  const text = await res.text();
  const out = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (!msg.message && !msg.title) continue;
      out.push({
        id: String(msg.id || `${topic}-${msg.time}`),
        topic,
        title: msg.title || "",
        message: msg.message || "",
        time: msg.time,
      });
    } catch {}
  }
  return out;
}
function render(items) {
  const q = $("q").value.trim().toLowerCase();
  const topic = $("topic").value;
  const filtered = items.filter((x) => {
    if (topic && x.topic !== topic) return false;
    if (!q) return true;
    return `${x.title} ${x.message} ${x.topic}`.toLowerCase().includes(q);
  });
  const root = $("list");
  if (!filtered.length) {
    root.innerHTML = '<div class="empty">표시할 알림이 없습니다.</div>';
    return;
  }
  root.innerHTML = filtered
    .map(
      (x) => `<article class="card">
        <div class="row">
          <span class="tag">${prefixOf(x.title) || x.topic}</span>
          <span class="tag">${x.topic}</span>
          <span class="title">${escapeHtml(x.title || "(제목 없음)")}</span>
          <span class="time">${kst(x.time)}</span>
        </div>
        <pre>${escapeHtml(x.message || "")}</pre>
      </article>`
    )
    .join("");
}
let cache = [];
async function refresh() {
  $("status").textContent = "불러오는 중";
  const lives = await Promise.all(TOPICS.map(pollTopic));
  cache = lives.flat().sort((a, b) => (b.time || 0) - (a.time || 0));
  $("status").textContent = `표시 ${cache.length}건 · ntfy 최근 48h`;
  render(cache);
}
$("q").addEventListener("input", () => render(cache));
$("topic").addEventListener("change", () => render(cache));
$("reload").addEventListener("click", refresh);
refresh();
