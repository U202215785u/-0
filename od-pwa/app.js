
/* ══════════════════════════════════════════════════════════════════════
   菜谱库快照。真实菜谱库为 1193+ 道只读数据；原型内置全部 1193 道：直接来自 app/src/generated/catalog.json（只读真实目录）。
   用料: [名称, 数量(null = 文字量), 单位, 组 1主料/2辅料/3调料, 采购分类]
        采购分类 pantry = 油盐酱醋等常备调料，默认不进采购清单
   步骤: [文字, 计时分钟(0 = 无), 本步相关用料]
   ══════════════════════════════════════════════════════════════════════ */
let RECIPES = [];
let BY_ID = {};

function transformRecipes(raw) {
  return raw.map(function (r) {
    return {
      id: r[0], name: r[1], py: r[2], pyi: r[3], alias: r[4], method: r[5], tags: r[6],
      time: r[7], kcal: r[8], p: r[9], c: r[10], f: r[11], lean: r[12],
      ing: r[13].map(function (i) { return { n: i[0], q: i[1], u: i[2], g: i[3], c: i[4] }; }),
      steps: r[14].map(function (s) { return { t: s[0], timer: s[1], ing: s[2] }; }),
      src: r[15]
    };
  });
}

function buildById(recipes) {
  var map = {};
  recipes.forEach(function (r) { map[r.id] = r; });
  return map;
}

function loadRecipes() {
  return fetch('recipes.json')
    .then(function (res) { return res.json(); })
    .then(function (raw) {
      RECIPES = transformRecipes(raw);
      BY_ID = buildById(RECIPES);
      return RECIPES;
    });
}



const METHODS = ["炒", "炖", "蒸", "煮", "烤", "凉拌", "煎", "炸"];
const GROUPS = { 1: "主料", 2: "辅料", 3: "调料" };
const CATS = [["veg", "蔬菜"], ["meat", "肉类"], ["sea", "水产"], ["tofu", "豆制品"], ["mush", "菌菇"], ["other", "其他"]];
const CAT_NAME = {};
CATS.forEach(function (c) { CAT_NAME[c[0]] = c[1]; });
const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const MEALS = [["lunch", "午餐"], ["dinner", "晚餐"], ["breakfast", "早餐"], ["snack", "加餐"]];
/* ══════════════════════════════════════════════════════════════════════
   图标：统一内联 SVG 线条，1.6 描边，无 emoji
   ══════════════════════════════════════════════════════════════════════ */
const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M20.4 20.4 16.2 16.2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  list: '<path d="M4 6.5h9M4 12h9M4 17.5h5"/><path d="M14.5 17l2.2 2.2L21 15"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"/>',
  heart: '<path d="M12 20.2C10.4 19 4.8 15.3 4.8 11.2A3.9 3.9 0 0 1 12 8.6a3.9 3.9 0 0 1 7.2 2.6c0 4.1-5.6 7.8-7.2 9z"/>',
  heartOn: '<path d="M12 20.2C10.4 19 4.8 15.3 4.8 11.2A3.9 3.9 0 0 1 12 8.6a3.9 3.9 0 0 1 7.2 2.6c0 4.1-5.6 7.8-7.2 9z" fill="currentColor"/>',
  send: '<path d="M20.5 3.5 3.5 10.2l6.6 2.7 2.7 6.6z"/><path d="M20.5 3.5 10.1 12.9"/>',
  pan: '<circle cx="10.2" cy="12" r="5.6"/><path d="M15.8 12H21"/>',
  back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  minus: '<path d="M5.5 12h13"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  check: '<path d="M5.4 12.4l4.3 4.3L18.6 7.6"/>',
  clock: '<circle cx="12" cy="12" r="7.8"/><path d="M12 7.6V12l3.2 2"/>',
  timer: '<circle cx="12" cy="13.2" r="6.8"/><path d="M12 9.8v3.4l2.4 1.6M9.5 3.2h5"/>',
  play: '<path d="M8.6 5.4 18.4 12l-9.8 6.6z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M9.4 5.4v13.2M14.6 5.4v13.2" stroke-width="2.4"/>',
  reset: '<path d="M2.6 5.2v5.4H8"/><path d="M4.8 15.4a8 8 0 1 0 1.8-8.3L2.6 10.6"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2.4"/><path d="M5.5 14.6V6.4A1.9 1.9 0 0 1 7.4 4.5h8.2"/>',
  info: '<circle cx="12" cy="12" r="8.2"/><path d="M12 11v5M12 8.2v.2"/>',
  lock: '<rect x="5" y="10.2" width="14" height="9.6" rx="2.4"/><path d="M8.4 10.2V7.6a3.6 3.6 0 0 1 7.2 0v2.6"/>',
  down: '<path d="M6.5 9.5 12 15l5.5-5.5"/>',
  right: '<path d="M9.5 6.5 15 12l-5.5 5.5"/>',
  inbox: '<path d="M4 13.5 6.4 5.6A1.6 1.6 0 0 1 8 4.5h8a1.6 1.6 0 0 1 1.6 1.1L20 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z"/><path d="M4 13.5h4l1 2h6l1-2h4"/>'
};
function icon(n, cls) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
    (cls ? ' class="' + cls + '"' : '') + '>' + P[n] + '</svg>';
}

/* ══════════════════════════════════════════════════════════════════════
   状态（全部在内存中，按 brief 要求不做真实持久化）
   ══════════════════════════════════════════════════════════════════════ */
const NAV_COOK = [["find", "找菜", "search"], ["menu", "菜单", "calendar"], ["shop", "采购", "list"], ["settings", "设置", "gear"]];
const NAV_PICK = [["find", "找菜", "search"], ["want", "想吃", "heart"], ["order", "点菜", "send"]];
const TITLES = { find: "找菜", menu: "一周菜单", shop: "采购清单", settings: "设置", want: "想吃", order: "点菜", detail: "" };

const state = {
  mode: "cook",
  screen: "find",
  backTo: "find",
  query: "",
  win: {},          /* 每个列表自己的窗口：找菜 / 想吃 各记一份 */
  scroll: {},       /* 每屏离开时的滚动位置 */
  filters: { methods: [], time: "all", kcal: "all", protein: "all", lean: false },
  fav: [],
  servings: 2,
  detailId: null,
  orderTab: "gen",
  importText: "",
  importResult: null,
  pending: [],
  menu: { lunch: [[], [], [], [], [], [], []], dinner: [[], [], [], [], [], [], []], breakfast: [[], [], [], [], [], [], []], snack: [[], [], [], [], [], [], []] },
  shopChecked: {},
  shopCustom: [],
  extrasOpen: { breakfast: false, snack: false },
  shopInput: "",
  genCode: null,
  sheet: null,
  cook: null
};

function navItems() { return state.mode === "cook" ? NAV_COOK : NAV_PICK; }
function navIds() { return navItems().map(function (n) { return n[0]; }); }
function isNav(s) { return navIds().indexOf(s) >= 0; }
function inPick() { return state.mode === "pick"; }
function favLabel() { return inPick() ? "想吃" : "收藏"; }

/* ── 小工具 ─────────────────────────────────────────────────────────── */
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function fmtNum(n) {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
function thousands(n) { return n.toLocaleString("zh-CN"); }
function scaleQty(q) { return scaleQtyFor(q, state.servings); }
/* 同时做几道菜时，每道菜记着自己的份量，不能共用页面上那一个 */
function scaleQtyFor(q, servings) { return q === null ? null : (q * servings) / 2; }
function fmtQty(q, u) { return q === null ? u : fmtNum(q) + " " + u; }
function todayIndex() { return (new Date().getDay() + 6) % 7; }
function mmss(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
}
function toast(msg) {
  const host = document.getElementById("toast-host");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  host.appendChild(el);
  window.setTimeout(function () { el.remove(); }, 2200);
}

/* ── 检索 ───────────────────────────────────────────────────────────── */
function matches(r, q) {
  if (r.name.indexOf(q) >= 0 || r.py.indexOf(q) >= 0 || r.pyi.indexOf(q) >= 0) return true;
  if (r.method === q) return true;
  for (let i = 0; i < r.alias.length; i++) if (r.alias[i].indexOf(q) >= 0) return true;
  for (let i = 0; i < r.tags.length; i++) if (r.tags[i].indexOf(q) >= 0) return true;
  for (let i = 0; i < r.ing.length; i++) if (r.ing[i].n.indexOf(q) >= 0) return true;
  return false;
}
function filtered() {
  const q = state.query.trim().toLowerCase();
  const f = state.filters;
  return RECIPES.filter(function (r) {
    if (f.methods.length && f.methods.indexOf(r.method) < 0) return false;
    if (f.lean && !r.lean) return false;
    if (f.time !== "all" && r.time > f.time) return false;
    if (f.kcal === "low" && !(r.kcal !== null && r.kcal <= 200)) return false;
    if (f.kcal === "high" && !(r.kcal !== null && r.kcal >= 400)) return false;
    if (f.protein === "high" && !(r.p !== null && r.p >= 25)) return false;
    if (q && !matches(r, q)) return false;
    return true;
  });
}
const TIME_STEPS = [["all", "时长"], [15, "15 分钟内"], [30, "30 分钟内"], [60, "1 小时内"]];
const KCAL_STEPS = [["all", "热量"], ["low", "低热量"], ["high", "高热量"]];
const PROTEIN_STEPS = [["all", "蛋白"], ["high", "高蛋白"]];
function cycle(list, cur) {
  const i = list.findIndex(function (x) { return x[0] === cur; });
  return list[(i + 1) % list.length][0];
}
function stepLabel(list, cur) {
  for (let i = 0; i < list.length; i++) if (list[i][0] === cur) return list[i][1];
  return list[0][1];
}
function hasFilters() {
  const f = state.filters;
  return !!(f.methods.length || f.lean || f.time !== "all" || f.kcal !== "all" || f.protein !== "all" || state.query);
}

/* ── 菜谱卡片 ───────────────────────────────────────────────────────── */
function recipeCard(r) {
  const fav = state.fav.indexOf(r.id) >= 0;
  const meta = r.kcal === null
    ? '<span class="num">' + r.time + " 分钟</span><span>暂无估算</span>"
    : '<span class="num">' + r.time + " 分钟</span><span class=\"num\">" + r.kcal + " 千卡</span><span class=\"num\">蛋白 " + r.p + " g</span>";
  let tags = '<span class="tag tag-solid">' + r.method + "</span>";
  r.tags.slice(0, 2).forEach(function (t) { tags += '<span class="tag">' + esc(t) + "</span>"; });
  if (r.lean) tags += '<span class="tag tag-lean">减脂友好</span>';
  return '<article class="rc" data-od-id="recipe-card-' + r.id + '">' +
    '<button class="rc-open" data-act="open:' + r.id + '" aria-label="查看' + esc(r.name) + '的做法">' +
      '<span class="rc-name">' + esc(r.name) + "</span>" +
      '<span class="rc-meta">' + meta + "</span>" +
      '<span class="rc-tags">' + tags + "</span>" +
    "</button>" +
    '<button class="icon-btn" data-act="fav:' + r.id + '" aria-pressed="' + fav + '" ' +
      'aria-label="' + (fav ? "取消" : "") + favLabel() + esc(r.name) + '">' + icon(fav ? "heartOn" : "heart") + "</button>" +
    "</article>";
}
/* 找菜 / 想吃共用的结果集。1193 道一次铺满会把首屏压垮，所以分批 */
const FIND_PAGE = 60;
function findList() {
  const base = filtered();
  if (state.screen !== "want") return base;
  return base.filter(function (r) { return state.fav.indexOf(r.id) >= 0; });
}
/* 查询或筛选一变，窗口就收回第一批 —— 否则换了条件还停在「已显示 600 道」 */
function findSignature() {
  const f = state.filters;
  return [state.query, f.methods.slice().sort().join(","), f.time, f.kcal, f.protein, f.lean].join("|");
}
/* 找菜和想吃各记一份窗口 —— 在两边来回切，不该把对方已经加载的批次冲掉 */
function findWindow(key) {
  const k = key || (state.screen === "want" ? "want" : "find");
  if (!state.win[k]) state.win[k] = { shown: 0, key: "" };
  return state.win[k];
}
function syncFindWindow() {
  const w = findWindow();
  const sig = findSignature();
  if (sig !== w.key) {
    const first = w.key === "";
    w.key = sig;
    w.shown = FIND_PAGE;
    /* 列表内容换了，这一屏之前记下的滚动位置也就没有意义了 */
    state.scroll[state.screen] = 0;
    /* 换了条件等于换了一份列表，回到顶部重新看 —— 否则在列表深处用吸顶的
       筛选行改完条件，看到的还是新结果中间那一段。第一次进入这一屏不算换条件。 */
    if (!first) window.scrollTo(0, 0);
  }
  return w;
}
function cardList(list) {
  if (!list.length) {
    return '<div class="empty" data-od-id="empty-result"><h3>没有找到菜谱</h3>' +
      "<p>换个说法试试，比如「豆腐」「清蒸」，或者直接输入拼音首字母 hsr。</p>" +
      (hasFilters() ? '<button class="btn btn-secondary" data-act="reset-filters">清空筛选条件</button>' : "") + "</div>";
  }
  const shown = Math.min(findWindow().shown, list.length);
  let h = '<div class="rc-grid">' + list.slice(0, shown).map(recipeCard).join("") + "</div>";
  if (shown < list.length) {
    h += '<div class="load-more" id="load-more" data-od-id="load-more">' +
      '<button class="btn btn-secondary" data-act="load-more" aria-label="加载更多，还有 ' + (list.length - shown) + ' 道">加载更多</button>' +
      '<span class="meta num">已显示 ' + shown + " / " + list.length + "</span></div>";
  } else if (list.length > FIND_PAGE) {
    h += '<p class="list-end" data-od-id="list-end">已经到底了 · 共 ' + list.length + " 道</p>";
  }
  return h;
}
function loadMore() {
  const w = findWindow();
  const list = findList();
  if (w.shown >= list.length) return;
  const active = document.activeElement;
  const hadFocus = !!(active && active.getAttribute && active.getAttribute("data-act") === "load-more");
  w.shown += FIND_PAGE;
  paintFindResults();
  if (hadFocus) {
    const btn = document.querySelector('[data-act="load-more"]');
    if (btn) btn.focus({ preventScroll: true });
  }
}
/* 只重画结果区：搜索框的焦点和光标位置不受影响 */
function paintFindResults() {
  const box = document.getElementById("find-results");
  if (!box) return;
  syncFindWindow();
  const want = state.screen === "want";
  const list = findList();
  box.innerHTML = resultHead(want, list) + (want && !state.fav.length ? emptyWant() : cardList(list));
  syncLoadMore();
}
function emptyWant() {
  return '<div class="empty"><h3>还没有想吃的菜</h3><p>在菜谱列表点一下心形，就会收进这里。之后可以生成点菜码，发给做饭的人。</p>' +
    '<button class="btn btn-secondary" data-act="go:find">去挑几道菜</button></div>';
}
/* 滚到底自动续一批。按钮始终留在 DOM 里，键盘和读屏用户不靠滚动也能用 */
let moreObserver = null;
function syncLoadMore() {
  if (moreObserver) { moreObserver.disconnect(); moreObserver = null; }
  const el = document.getElementById("load-more");
  if (!el || typeof IntersectionObserver !== "function") return;
  moreObserver = new IntersectionObserver(function (entries) {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) {
        moreObserver.disconnect();
        moreObserver = null;
        loadMore();
        return;
      }
    }
  }, { rootMargin: "240px 0px" });
  moreObserver.observe(el);
}

/* ══════════════════════════════════════════════════════════════════════
   界面：找菜
   ══════════════════════════════════════════════════════════════════════ */
function screenFind() {
  syncFindWindow();
  const want = state.screen === "want";
  const list = findList();
  const body = want && !state.fav.length ? emptyWant() : cardList(list);
  return '<section class="screen" data-od-id="' + (want ? "screen-want" : "screen-find") + '">' +
    '<div class="sticky-bar" data-od-id="find-filters">' + searchBar() + filterBar() + "</div>" +
    '<div id="find-results">' + resultHead(want, list) + body + "</div></section>";
}
function resultHead(want, list) {
  return '<div class="result-head"><h2>' + (want ? "想吃的菜" : "菜谱") + "</h2>" +
    '<span class="meta num">' + list.length + " 道</span></div>";
}
function searchBar() {
  return '<div class="searchbar">' + icon("search", "search-icon") +
    '<input id="q" type="search" value="' + esc(state.query) + '" autocomplete="off" ' +
    'placeholder="搜菜名、食材或做法，也支持拼音首字母" aria-label="搜索菜谱" />' +
    '<button class="icon-btn search-clear" data-act="clear-q"' + (state.query ? "" : " hidden") +
    ' aria-label="清空搜索">' + icon("close") + "</button>" +
    "</div>";
}
function filterBar() {
  const f = state.filters;
  let h = '<div class="filterbar" role="group" aria-label="筛选">';
  METHODS.forEach(function (m) {
    const on = f.methods.indexOf(m) >= 0;
    h += '<button class="chip" data-act="m:' + m + '" aria-pressed="' + on + '">' + m + "</button>";
  });
  h += '<span class="filter-sep" aria-hidden="true"></span>';
  h += '<button class="chip" data-act="cyc-time" aria-pressed="' + (f.time !== "all") + '">' + stepLabel(TIME_STEPS, f.time) + icon("down") + "</button>";
  h += '<button class="chip" data-act="cyc-kcal" aria-pressed="' + (f.kcal !== "all") + '">' + stepLabel(KCAL_STEPS, f.kcal) + icon("down") + "</button>";
  h += '<button class="chip" data-act="cyc-protein" aria-pressed="' + (f.protein !== "all") + '">' + stepLabel(PROTEIN_STEPS, f.protein) + icon("down") + "</button>";
  h += '<button class="chip" data-act="toggle-lean" aria-pressed="' + f.lean + '">减脂友好</button>';
  return h + "</div>";
}

/* ══════════════════════════════════════════════════════════════════════
   界面：菜谱详情
   ══════════════════════════════════════════════════════════════════════ */
function detailNutrition(r) {
  if (r.kcal === null) {
    return '<div class="card" data-od-id="detail-nutrition"><h3 class="card-title">营养估算</h3>' +
      '<p class="nut-empty">这道菜暂时没有营养估算数据。</p>' +
      '<p class="card-note">菜谱库里有一部分来自手写记录，没有留下营养成分。排菜单时它会单独标注出来，不会计入合计。</p></div>';
  }
  const k = state.servings / 2;
  return '<div class="card" data-od-id="detail-nutrition"><h3 class="card-title">营养估算 · ' + state.servings + " 人份</h3>" +
    '<div class="nut-grid">' +
      nutItem(thousands(Math.round(r.kcal * k)), "千卡", "热量") +
      nutItem(fmtNum(r.p * k), "g", "蛋白质") +
      nutItem(fmtNum(r.c * k), "g", "碳水") +
      nutItem(fmtNum(r.f * k), "g", "脂肪") +
    "</div>" +
    '<p class="card-note">整道菜的估值，随上面的份量一起变。菜谱原始数据按 2 人份记录，仅供参考。</p></div>';
}
function nutItem(v, u, k) {
  return '<div class="nut-item"><span class="nut-val num">' + v + '</span><span class="nut-unit">' + u + '</span><span class="nut-label">' + k + "</span></div>";
}
function screenDetail() {
  const r = BY_ID[state.detailId];
  if (!r) return '<section class="screen" data-od-id="screen-detail"></section>';
  const fav = state.fav.indexOf(r.id) >= 0;

  let head = '<header class="detail-head"><h2 class="detail-title">' + esc(r.name) + "</h2>" +
    '<div class="detail-tags"><span class="tag tag-solid">' + r.method + "</span>";
  r.tags.forEach(function (t) { head += '<span class="tag">' + esc(t) + "</span>"; });
  if (r.lean) head += '<span class="tag tag-lean">减脂友好</span>';
  head += "</div>";
  const k = state.servings / 2;
  head += '<div class="detail-stats">' +
    statBox(r.time + " 分钟", "时长") +
    statBox(r.kcal === null ? "暂无估算" : thousands(Math.round(r.kcal * k)), r.kcal === null ? "热量" : "千卡 · " + state.servings + " 人份") +
    statBox(r.p === null ? "暂无估算" : fmtNum(r.p * k) + " g", r.p === null ? "蛋白质" : "蛋白质 · " + state.servings + " 人份") +
    "</div></header>";

  const byGroup = { 1: [], 2: [], 3: [] };
  r.ing.forEach(function (i) { byGroup[i.g].push(i); });
  let ing = '<div class="block" data-od-id="detail-ingredients">' +
    '<div class="block-head"><h3 class="block-title">用料</h3>' +
    '<div class="stepper" role="group" aria-label="份量">' +
      '<button data-act="serv-" aria-label="减少份量"' + (state.servings <= 1 ? " disabled" : "") + ">" + icon("minus") + "</button>" +
      '<span class="stepper-val num" aria-live="polite">' + state.servings + "</span>" +
      '<span class="stepper-unit">人份</span>' +
      '<button data-act="serv+" aria-label="增加份量"' + (state.servings >= 8 ? " disabled" : "") + ">" + icon("plus") + "</button>" +
    "</div></div>";
  [1, 2, 3].forEach(function (g) {
    if (!byGroup[g].length) return;
    ing += '<div class="ing-group"><h4 class="ing-group-title">' + GROUPS[g] + '</h4><ul class="ing-list">';
    byGroup[g].forEach(function (i) {
      const q = scaleQty(i.q);
      ing += '<li class="ing-row"><span class="ing-name">' + esc(i.n) + '</span>' +
        '<span class="ing-qty num' + (q === null ? " is-text" : "") + '">' + fmtQty(q, i.u) + "</span></li>";
    });
    ing += "</ul></div>";
  });
  ing += "</div>";

  let steps = '<div class="block" data-od-id="detail-steps"><div class="block-head"><h3 class="block-title">步骤</h3>' +
    '<span class="meta num">共 ' + r.steps.length + " 步</span></div><ol class=\"steps\">";
  r.steps.forEach(function (s, i) {
    steps += '<li class="step"><span class="step-no num">' + (i + 1) + "</span>" +
      '<div class="step-body"><p class="step-text">' + esc(s.t) + "</p>" +
      '<div class="step-foot">' +
      (s.timer ? '<span class="step-timer">' + icon("timer") + "约 " + s.timer + " 分钟</span>" : "") +
      s.ing.map(function (n) { return '<span class="tag">' + esc(n) + "</span>"; }).join("") +
      "</div></div></li>";
  });
  steps += "</ol></div>";

  let side = detailNutrition(r);
  if (r.src) {
    side += '<div class="card" data-od-id="detail-source"><h3 class="card-title">来源</h3>' +
      '<p class="src-line">' + esc(r.src[0]) + ' <span class="src-author">· ' + esc(r.src[1]) + "</span></p></div>";
  }
  side += '<div class="actionbar" data-od-id="detail-actions"><div class="actionbar-in">' +
    '<div class="actionbar-row">' +
      '<button class="btn btn-secondary" data-act="add-meal:lunch">加入午餐</button>' +
      '<button class="btn btn-secondary" data-act="add-meal:dinner">加入晚餐</button>' +
    "</div>" +
    '<button class="btn btn-primary btn-block" data-act="start-cook">' + icon("pan") + cookBtnLabel(r.id) + "</button>" +
    "</div></div>";

  return '<section class="screen" data-od-id="screen-detail"><div class="detail-grid">' +
    '<div class="detail-main">' + head + ing + steps + "</div>" +
    '<aside class="detail-side">' + side + "</aside></div></section>";
}
function statBox(v, k) {
  return '<div class="detail-stat"><span class="v num">' + v + '</span><span class="k">' + k + "</span></div>";
}
/* 已经在同时做，主按钮就别说「开始」了 */
function cookBtnLabel(id) {
  if (!state.cook || !state.cook.dishes.length) return "开始烹饪";
  const on = state.cook.dishes.some(function (d) { return d.id === id; });
  return on ? "回到同时烹饪" : "同时做这道菜";
}

/* ══════════════════════════════════════════════════════════════════════
   界面：一周菜单
   ══════════════════════════════════════════════════════════════════════ */
function slotHtml(meal, day) {
  const ids = state.menu[meal][day];
  let h = '<div class="slot-body">';
  ids.forEach(function (id) {
    const r = BY_ID[id];
    h += '<span class="dish-chip"><button class="dish-chip-open" data-act="open:' + id + '">' + esc(r.name) + "</button>" +
      '<button class="dish-chip-x" data-act="rm:' + meal + ":" + day + ":" + id + '" aria-label="移除' + esc(r.name) + '">' + icon("close") + "</button></span>";
  });
  h += '<button class="slot-add" data-act="add:' + meal + ":" + day + '" aria-label="往' + DAYS[day] + MEAL_LABEL[meal] + '加菜">' + icon("plus") + "</button>";
  return h + "</div>";
}
const MEAL_LABEL = { lunch: "午餐", dinner: "晚餐", breakfast: "早餐", snack: "加餐" };

function menuTotals() {
  let kcal = 0, p = 0, c = 0, f = 0, count = 0, missing = 0;
  MEALS.forEach(function (m) {
    state.menu[m[0]].forEach(function (ids) {
      ids.forEach(function (id) {
        const r = BY_ID[id];
        count++;
        if (r.kcal === null) { missing++; return; }
        kcal += r.kcal; p += r.p; c += r.c; f += r.f;
      });
    });
  });
  return { kcal: kcal, p: p, c: c, f: f, count: count, missing: missing };
}

function screenMenu() {
  const t = menuTotals();
  const pending = state.pending.length
    ? '<div class="card" data-od-id="pending-orders" style="margin-bottom:16px">' +
        '<div class="row-between"><h3 class="card-title" style="color:var(--fg)">收到 ' + state.pending.length + " 道点菜</h3>" +
        '<button class="link" data-act="pending-clear" style="font-size:var(--text-sm)">忽略</button></div>' +
        '<div class="step-foot" style="margin-top:10px">' +
        state.pending.map(function (id) { return '<span class="tag tag-solid">' + esc(BY_ID[id].name) + "</span>"; }).join("") +
        "</div>" +
        '<div class="actionbar-row" style="margin-top:16px">' +
        '<button class="btn btn-secondary" data-act="go-order-import">看完整点菜码</button>' +
        '<button class="btn btn-secondary" data-act="pending-schedule">排进本周空位</button>' +
        "</div></div>"
    : "";

  let h = '<section class="screen" data-od-id="screen-menu">' + pending;
  h += '<div class="card" data-od-id="menu-summary">' +
    '<div class="row-between"><h3 class="card-title" style="color:var(--fg)">本周菜单合计</h3>' +
    '<span class="meta num">7 天 · ' + t.count + " 道</span></div>" +
    '<div class="summary-grid">' +
      sumItem(t.kcal ? thousands(t.kcal) : "0", "千卡") +
      sumItem(t.p ? fmtNum(t.p) : "0", "蛋白质 g") +
      sumItem(t.c ? fmtNum(t.c) : "0", "碳水 g") +
      sumItem(t.f ? fmtNum(t.f) : "0", "脂肪 g") +
    "</div>" +
    (t.missing ? '<p class="card-note">其中 ' + t.missing + " 道菜暂无营养估算，合计只按有数据的菜计算。</p>" : "") +
    "</div>";

  h += '<div class="week" data-od-id="menu-week">';
  DAYS.forEach(function (d, i) {
    h += '<div class="day" data-od-id="menu-day-' + (i + 1) + '"><div class="day-name">' + d + "</div>";
    h += '<div class="day-slot"><span class="slot-label">午餐</span>' + slotHtml("lunch", i) + "</div>";
    h += '<div class="day-slot"><span class="slot-label">晚餐</span>' + slotHtml("dinner", i) + "</div>";
    h += "</div>";
  });
  h += "</div>";

  ["breakfast", "snack"].forEach(function (meal) {
    const open = state.extrasOpen[meal];
    const n = state.menu[meal].reduce(function (a, x) { return a + x.length; }, 0);
    h += '<button class="disclosure" data-act="extra:' + meal + '" aria-expanded="' + open + '">' +
      "<span>" + MEAL_LABEL[meal] + "</span>" +
      '<span class="disclosure-sub">' + (n ? "已排 " + n + " 道" : "还没有安排") + "</span>" + icon("down") + "</button>";
    h += '<div class="extra-body"' + (open ? "" : " hidden") + '><div class="week">';
    DAYS.forEach(function (d, i) {
      h += '<div class="day"><div class="day-name">' + d + '</div><div class="day-slot">' + slotHtml(meal, i) + "</div></div>";
    });
    h += "</div></div>";
  });

  if (!t.count) {
    h += '<div class="notice" style="margin-top:16px">' + icon("info") +
      "<span>菜单还是空的。点任意格子的加号就能往里排菜，排完再去采购清单，用料会自动汇总。</span></div>";
  }
  return h + "</section>";
}
function sumItem(v, k) {
  return '<div class="summary-item"><span class="v num">' + v + '</span><span class="k">' + k + "</span></div>";
}

/* ══════════════════════════════════════════════════════════════════════
   界面：采购清单
   ══════════════════════════════════════════════════════════════════════ */
function shopItems() {
  const map = {};
  const order = [];
  function add(n, q, u, c) {
    const key = n + "|" + u + "|" + c;
    if (!map[key]) { map[key] = { key: key, n: n, u: u, c: c, q: null, text: false }; order.push(key); }
    if (q === null) map[key].text = true;
    else map[key].q = (map[key].q || 0) + q;
  }
  MEALS.forEach(function (m) {
    state.menu[m[0]].forEach(function (ids) {
      ids.forEach(function (id) {
        BY_ID[id].ing.forEach(function (i) { if (i.c !== "pantry") add(i.n, i.q, i.u, i.c); });
      });
    });
  });
  state.shopCustom.forEach(function (item) {
    const key = item.n + "|" + item.u + "|" + item.c;
    map[key] = { key: key, n: item.n, u: item.u, c: item.c, q: item.q, text: item.q === null, custom: true };
    if (order.indexOf(key) < 0) order.push(key);
  });
  return order.map(function (k) { return map[k]; });
}
function screenShop() {
  const items = shopItems();
  const doneCount = items.filter(function (i) { return state.shopChecked[i.key]; }).length;
  const left = items.length - doneCount;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  let h = '<section class="screen screen-narrow" data-od-id="screen-shop">';

  /* 标题已经在顶栏上了，这里只留进度 —— 站在货架前抬眼就知道还剩多少 */
  h += '<div class="sticky-bar shop-bar" data-od-id="shop-progress" data-done="' +
    (items.length > 0 && left === 0) + '">' +
    '<div class="shop-bar-row">' +
      '<span class="shop-bar-count">' + (items.length === 0 ? "清单是空的" : left === 0 ? "都买齐了" : "还剩 " + left + " 项") + "</span>" +
      (items.length ? '<span class="meta num">已买 ' + doneCount + " / " + items.length + "</span>" : "") +
    "</div>" +
    '<div class="shop-bar-track"><i style="width:' + pct + '%"></i></div></div>';

  h += '<p class="shop-note" data-od-id="shop-note">按本周菜单自动汇总，已排除油、盐、酱、醋等常备调料。勾选后会自动沉到分组底部。</p>';

  if (!items.length) {
    h += '<div class="empty" data-od-id="shop-empty"><h3>还没有要买的东西</h3>' +
      "<p>先去一周菜单排几道菜，用料会自动汇总到这里。也可以直接在下面手动添加。</p>" +
      '<button class="btn btn-secondary" data-act="go:menu">去排一周菜单</button></div>';
  } else {
    CATS.forEach(function (cat) {
      const group = items.filter(function (i) { return i.c === cat[0]; });
      if (!group.length) return;
      const rest = group.filter(function (i) { return !state.shopChecked[i.key]; });
      const done = group.filter(function (i) { return state.shopChecked[i.key]; });
      h += '<div class="shop-group" data-od-id="shop-group-' + cat[0] + '">' +
        '<div class="shop-group-title"><span>' + cat[1] + "</span><span class=\"num\">" +
        (done.length ? done.length + " / " + group.length : group.length) + "</span></div>" +
        '<div class="shop-list">' + rest.concat(done).map(shopRow).join("") + "</div></div>";
    });
  }

  h += '<form class="shop-add" data-act="shop-add" data-od-id="shop-add">' +
    '<input class="input" id="shop-input" value="' + esc(state.shopInput) + '" ' +
    'placeholder="添加采购项，例如：香菜 2 把" aria-label="手动添加采购项" />' +
    '<button class="btn btn-secondary shop-add-btn" type="submit" aria-label="添加这一项">' + icon("plus") + "</button></form>";
  return h + "</section>";
}
function shopRow(i) {
  const checked = !!state.shopChecked[i.key];
  const qty = i.q === null ? (i.text ? "适量" : "") : fmtNum(i.q) + " " + i.u;
  return '<label class="shop-row" data-checked="' + checked + '">' +
    '<input type="checkbox" data-act="check:' + esc(i.key) + '"' + (checked ? " checked" : "") + " />" +
    '<span class="shop-box">' + icon("check") + "</span>" +
    '<span class="shop-name">' + esc(i.n) + "</span>" +
    '<span class="shop-qty num">' + esc(qty) + "</span></label>";
}

/* ══════════════════════════════════════════════════════════════════════
   界面：点菜（生成 / 导入）
   ══════════════════════════════════════════════════════════════════════ */
function buildCode() { return "家宴点菜: " + JSON.stringify({ recipeIds: state.fav.slice() }); }
function parseCode(text) {
  const t = (text || "").trim();
  if (!t) return { error: "先粘贴一段点菜码，再点识别。" };
  if (t.indexOf("家宴点菜") !== 0) return { error: "这看起来不是家宴的点菜码。整段复制过来就行，开头应该是「家宴点菜:」。" };
  const m = t.match(/^家宴点菜\s*[:：]\s*(\{[\s\S]*\})\s*$/);
  if (!m) return { error: "点菜码里的内容不完整，可能复制的时候断了一截。重新复制完整的一段再试。" };
  let data;
  try { data = JSON.parse(m[1]); }
  catch (e) { return { error: "点菜码里的内容不完整，可能复制的时候断了一截。重新复制完整的一段再试。" }; }
  if (!data || !Array.isArray(data.recipeIds)) return { error: "点菜码里没有菜品清单，确认一下复制的是完整的一段。" };
  const ok = [], unknown = [];
  data.recipeIds.forEach(function (id) {
    if (typeof id === "string" && BY_ID[id]) { if (ok.indexOf(BY_ID[id]) < 0) ok.push(BY_ID[id]); }
    else unknown.push(String(id));
  });
  if (!ok.length) return { error: "读到了点菜码，但里面的菜谱不在本机菜谱库里，没有可加入的菜。" };
  return { ok: ok, unknown: unknown };
}

function screenOrder() {
  const gen = state.orderTab === "gen";
  let h = '<section class="screen screen-narrow" data-od-id="screen-order">';
  h += '<div class="seg-wrap"><div class="segmented" role="group" aria-label="点菜方式">' +
    '<button data-act="tab:gen" aria-pressed="' + gen + '">生成点菜码</button>' +
    '<button data-act="tab:imp" aria-pressed="' + !gen + '">导入点菜码</button></div></div>';

  if (gen) {
    const favs = state.fav.map(function (id) { return BY_ID[id]; });
    h += '<div class="card" data-od-id="order-generate"><h3 class="card-title" style="color:var(--fg)">想吃清单</h3>';
    if (!favs.length) {
      h += '<p class="card-note" style="font-size:var(--text-sm);margin-top:10px">清单是空的。回找菜页点几道菜的心形，再回来生成点菜码。</p></div>';
      return h + "</section>";
    }
    h += '<div class="pick-list" style="margin-top:14px">' + favs.map(function (r) {
      return '<div class="pick-row"><span class="pick-name">' + esc(r.name) +
        '<span class="meta num">' + r.time + " 分钟 · " + (r.kcal === null ? "暂无估算" : r.kcal + " 千卡") + "</span></span>" +
        '<button class="icon-btn" data-act="fav:' + r.id + '" aria-label="移除' + esc(r.name) + '">' + icon("close") + "</button></div>";
    }).join("") + "</div>";
    h += '<button class="btn btn-primary btn-block" style="margin-top:16px" data-act="gen-code">生成点菜码</button>';
    if (state.genCode) {
      h += '<p class="card-note" style="margin-top:20px">把下面这段整段发给做饭的人，对方粘贴到「导入点菜码」就能收下。</p>' +
        '<div class="code-out" data-od-id="order-code">' + esc(state.genCode) + "</div>" +
        '<button class="btn btn-secondary btn-block" style="margin-top:12px" data-act="copy-code">' + icon("copy") + "复制点菜码</button>";
    }
    return h + "</div></section>";
  }

  h += '<div class="card" data-od-id="order-import"><h3 class="card-title" style="color:var(--fg)">粘贴点菜码</h3>' +
    '<p class="card-note" style="font-size:var(--text-sm);margin-top:8px">把对方发来的整段文字粘进来，识别成功后可以一次加进待办。</p>' +
    '<label class="field-label" for="import-text" style="margin-top:16px">点菜码</label>' +
    '<textarea class="textarea textarea-code" id="import-text" placeholder="家宴点菜: {&quot;recipeIds&quot;:[&quot;red-cooked-pork-belly&quot;]}">' + esc(state.importText) + "</textarea>" +
    '<div class="actionbar-row" style="margin-top:12px">' +
      '<button class="btn btn-secondary" data-act="sample-code">填入示例</button>' +
      '<button class="btn btn-secondary" data-act="parse-code">识别</button>' +
    "</div>";

  const res = state.importResult;
  if (res && res.error) {
    h += '<div class="notice notice-danger" style="margin-top:16px" data-od-id="order-error">' + icon("info") +
      "<span>" + esc(res.error) + " 原有数据和菜单都没有改动。</span></div>";
  }
  if (res && res.ok) {
    h += '<div style="margin-top:20px" data-od-id="order-result"><h4 class="ing-group-title" style="margin-bottom:8px">识别到 ' + res.ok.length + " 道菜</h4>" +
      '<div class="pick-list">' + res.ok.map(function (r) {
        return '<div class="pick-row"><span class="pick-name">' + esc(r.name) +
          '<span class="meta">' + r.method + " · " + r.time + " 分钟</span></span>" +
          '<span class="meta num">' + (r.kcal === null ? "暂无估算" : r.kcal + " 千卡") + "</span></div>";
      }).join("") + "</div>";
    if (res.unknown.length) {
      h += '<p class="card-note" style="margin-top:12px">另有 ' + res.unknown.length + " 项没有对上本机菜谱库，已跳过。</p>";
    }
    h += '<button class="btn btn-primary btn-block" style="margin-top:16px" data-act="add-pending">加入待办</button></div>';
  }
  return h + "</div></section>";
}

/* ══════════════════════════════════════════════════════════════════════
   界面：设置
   ══════════════════════════════════════════════════════════════════════ */
function screenSettings() {
  const cook = state.mode === "cook";
  return '<section class="screen screen-narrow" data-od-id="screen-settings">' +
    '<div class="card" data-od-id="settings-mode"><h3 class="card-title" style="color:var(--fg)">设备模式</h3>' +
    '<p class="card-note" style="margin-top:8px;font-size:var(--text-sm)">两台设备用同一个菜谱库，分工不同。切换后底部导航会跟着变。</p>' +
    '<div class="mode-card" style="margin-top:16px">' +
      '<button class="mode-opt" data-act="mode:cook" aria-pressed="' + cook + '">' +
        '<span class="mo-mark">' + icon("pan") + "</span><span><h4>烹饪设备</h4>" +
        "<p>找菜、排一周菜单、生成采购清单。以做饭为主，能找到用料和步骤，也能导入别人点的菜。</p></span></button>" +
      '<button class="mode-opt" data-act="mode:pick" aria-pressed="' + !cook + '">' +
        '<span class="mo-mark">' + icon("heart") + "</span><span><h4>选择设备</h4>" +
        "<p>浏览菜谱、把想吃的收进清单，生成一段点菜码发给烹饪设备。不排菜单，也不生成采购清单。</p></span></button>" +
    "</div></div>" +

    '<div class="card" style="margin-top:16px" data-od-id="settings-data">' +
      '<div class="row-between"><h3 class="card-title" style="color:var(--fg)">数据</h3>' + icon("lock") + "</div>" +
      '<p class="src-line" style="margin-top:10px">所有菜单、收藏和采购记录都只保存在这台设备上，不上传、不联网、没有账号。</p>' +
      '<div class="set-row"><span class="set-label">收藏 / 想吃</span><span class="set-value num">' + state.fav.length + " 道</span></div>" +
      '<div class="set-row"><span class="set-label">本周已排</span><span class="set-value num">' + menuTotals().count + " 道</span></div>" +
      '<div class="set-row"><span class="set-label">采购清单</span><span class="set-value num">' + shopItems().length + " 项</span></div>" +
      '<button class="btn btn-secondary btn-block" style="margin-top:16px" data-act="reset-all">清空本机演示数据</button>' +
    "</div>" +

    '<div class="card" style="margin-top:16px" data-od-id="settings-about">' +
      '<h3 class="card-title" style="color:var(--fg)">关于</h3>' +
      '<div class="set-row"><span class="set-label">版本</span><span class="set-value num">0.9.2（原型）</span></div>' +
      '<div class="set-row"><span class="set-label">菜谱库</span><span class="set-value num">1193 道 · 只读</span></div>' +
      '<div class="set-row"><span class="set-label">营养数据</span><span class="set-value">部分菜品暂无估算</span></div>' +
      '<p class="card-note">家宴是一个本地优先的家庭菜谱工具，为两个人一起决定吃什么、怎么做而做。</p>' +
    "</div></section>";
}

/* ══════════════════════════════════════════════════════════════════════
   外壳渲染
   ══════════════════════════════════════════════════════════════════════ */
function renderSidebar() {
  const cur = state.screen;
  let h = '<div class="sb-brand"><span class="sb-mark">宴</span><div>' +
    '<div class="sb-brand-name">家宴</div><div class="sb-brand-sub">家庭菜谱</div></div></div>';
  h += '<nav class="sb-nav" aria-label="主导航">';
  navItems().forEach(function (n) {
    h += '<button data-act="go:' + n[0] + '"' + (cur === n[0] ? ' aria-current="page"' : "") + ">" +
      icon(n[2]) + "<span>" + n[1] + "</span></button>";
  });
  if (state.mode === "cook") {
    h += '<button data-act="go-order-import">' + icon("inbox") + "<span>导入点菜码" +
      (state.pending.length ? " · " + state.pending.length : "") + "</span></button>";
  }
  h += "</nav>";
  h += '<div class="sb-mode"><button class="sb-mode-chip" data-act="go:settings">' +
    "<span>" + (state.mode === "cook" ? "烹饪设备" : "选择设备") + "</span>" + icon("right") + "</button></div>";
  h += '<p class="sb-foot">菜谱库 1193 道<br />数据仅保存在本机</p>';
  document.getElementById("sidebar").innerHTML = h;
}

function renderAppbar() {
  const s = state.screen;
  let title = TITLES[s] || "家宴";
  let back = false;
  if (s === "detail" && BY_ID[state.detailId]) { title = BY_ID[state.detailId].name; back = true; }
  if (!isNav(s)) back = true;
  if (s === "want") title = "想吃";
  const el = document.getElementById("appbar");
  el.innerHTML = '<div class="appbar-in">' +
    (back ? '<button class="icon-btn" data-act="back" aria-label="返回">' + icon("back") + "</button>" : "") +
    "<h1>" + esc(title) + "</h1>" +
    '<button class="mode-chip" data-act="go:settings">' + (state.mode === "cook" ? "烹饪设备" : "选择设备") + icon("down") + "</button>" +
    "</div>";
  paintShellMetrics();
}
/* 吸顶条要知道顶栏多高，底部的添加栏要知道标签栏多高。
   渲染完量一次写进 CSS 变量，比在样式里写死像素稳 ——
   顶栏多个返回按钮、标签栏在桌面藏起来，都不会错位。 */
function paintShellMetrics() {
  const bar = document.getElementById("appbar");
  const h = bar && bar.offsetHeight;
  if (h) document.documentElement.style.setProperty("--appbar-h", h + "px");
  const tabs = document.getElementById("tabbar");
  const th = tabs && tabs.offsetHeight;
  if (th) document.documentElement.style.setProperty("--tabbar-h", th + "px");
}

function renderTabbar() {
  const cur = state.screen;
  const el = document.getElementById("tabbar");
  el.innerHTML = navItems().map(function (n) {
    return '<button data-act="go:' + n[0] + '"' + (cur === n[0] ? ' aria-current="page"' : "") + ">" +
      icon(n[2]) + "<span>" + n[1] + "</span></button>";
  }).join("");
}

function renderScreen() {
  const el = document.getElementById("screen");
  let html, hasBar = false;
  const hasSticky = state.screen === "find" || state.screen === "want" || state.screen === "shop";
  const hasAddbar = state.screen === "shop";
  switch (state.screen) {
    case "find": html = screenFind(); break;
    case "want": html = screenFind(); break;
    case "menu": html = screenMenu(); break;
    case "shop": html = screenShop(); break;
    case "order": html = screenOrder(); break;
    case "settings": html = screenSettings(); break;
    case "detail": html = screenDetail(); hasBar = true; break;
    default: html = screenFind();
  }
  el.className = "content" + (hasBar ? " has-actionbar" : "") + (hasSticky ? " has-sticky" : "") + (hasAddbar ? " has-addbar" : "");
  el.innerHTML = html;
  document.body.classList.toggle("no-tabs", hasBar);
  renderSidebar();
  renderTabbar();
  paintShellMetrics();
  syncLoadMore();
}

function render() {
  renderAppbar();
  renderScreen();
  renderSheet();
  renderCook();
}

/* ══════════════════════════════════════════════════════════════════════
   浮层：菜品选择抽屉
   ══════════════════════════════════════════════════════════════════════ */
function openPicker(meal, day) {
  state.sheet = { type: "picker", meal: meal, day: day, q: "" };
  renderSheet();
}
/* 抽屉里一次铺多少道：1193 道全渲染会把手机卡住 */
const PICK_SHOWN = 40;
function openDishPicker() {
  state.sheet = { type: "dish", q: "" };
  renderSheet();
}
function dishPickerRows(q) {
  const query = (q || "").trim().toLowerCase();
  const c = state.cook;
  const used = c ? c.dishes.map(function (d) { return d.id; }) : [];
  const all = RECIPES.filter(function (r) { return !query || matches(r, query); });
  if (!all.length) return '<div class="empty"><h3>没有匹配的菜</h3><p>换个关键词试试。</p></div>';
  const shown = all.slice(0, PICK_SHOWN);
  let h = '<div class="pick-list">' + shown.map(function (r) {
    const on = used.indexOf(r.id) >= 0;
    return '<div class="pick-row"><span class="pick-name">' + esc(r.name) +
      '<span class="meta">' + r.method + " · " + r.time + " 分钟 · " + (r.kcal === null ? "暂无估算" : r.kcal + " 千卡") + "</span></span>" +
      '<button class="icon-btn" data-act="dish-add:' + r.id + '" aria-label="' +
      (on ? "切到" + esc(r.name) : "把" + esc(r.name) + "加进同时烹饪") + '">' +
      icon(on ? "check" : "plus") + "</button></div>";
  }).join("") + "</div>";
  const rest = all.length - shown.length;
  if (rest > 0) {
    h += '<p class="sheet-more">' +
      (query ? "还有 " + rest + " 道，再打几个字缩小范围" : "菜谱库共 " + all.length + " 道，打关键词找更快") +
      "</p>";
  }
  return h;
}
function renderDishSheet(root) {
  const c = state.cook;
  const cur = c ? c.dishes : [];
  let h = '<div class="sheet-head"><h2>加一道菜</h2>' +
    '<button class="icon-btn" data-act="sheet-close" aria-label="关闭">' + icon("close") + "</button></div>" +
    '<div class="sheet-body stack-3">';
  if (cur.length) {
    h += '<div><h4 class="ing-group-title">正在做</h4><div class="pick-list">' +
      cur.map(function (d) {
        const r = BY_ID[d.id];
        return '<div class="pick-row"><span class="pick-name">' + esc(r.name) +
          '<span class="meta">第 ' + (d.step + 1) + " / " + r.steps.length + " 步 · " + d.servings + " 人份</span></span>" +
          '<button class="icon-btn" data-act="dish-remove:' + d.key + '" aria-label="把' + esc(r.name) + '拿掉">' +
          icon("close") + "</button></div>";
      }).join("") + "</div></div>";
  }
  h += '<div class="searchbar">' + icon("search", "search-icon") +
    '<input id="dish-q" type="search" autocomplete="off" placeholder="搜菜名、食材或做法" aria-label="搜索菜谱" /></div>' +
    '<div id="dish-list">' + dishPickerRows("") + "</div></div>";
  root.hidden = false;
  root.innerHTML = '<div class="sheet-backdrop" data-act="sheet-close"></div>' +
    '<div class="sheet" role="dialog" aria-modal="true" aria-label="加一道菜">' + h + "</div>";
  const input = document.getElementById("dish-q");
  if (input) {
    input.addEventListener("input", function () {
      document.getElementById("dish-list").innerHTML = dishPickerRows(input.value);
    });
  }
}
function addDishFromPicker(id) {
  const c = state.cook;
  if (!c) { closeSheet(); startCook(id, state.servings); return; }
  const existing = c.dishes.filter(function (d) { return d.id === id; })[0];
  if (existing) {
    c.active = c.dishes.indexOf(existing);
    closeSheet();
    ensureStepTimers();
    renderCook();
    return;
  }
  addDish(id);
  closeSheet();
  ensureStepTimers();
  renderCook();
  toast("已加入同时烹饪 · " + BY_ID[id].name);
}
function pickerRows(q) {
  const query = (q || "").trim().toLowerCase();
  const list = RECIPES.filter(function (r) { return !query || matches(r, query); });
  if (!list.length) return '<div class="empty"><h3>没有匹配的菜</h3><p>换个关键词试试。</p></div>';
  const shown = list.slice(0, PICK_SHOWN);
  let h = '<div class="pick-list">' + shown.map(function (r) {
    const already = state.menu[state.sheet.meal][state.sheet.day].indexOf(r.id) >= 0;
    return '<div class="pick-row"><span class="pick-name">' + esc(r.name) +
      '<span class="meta">' + r.method + " · " + r.time + " 分钟 · " + (r.kcal === null ? "暂无估算" : r.kcal + " 千卡") + "</span></span>" +
      '<button class="icon-btn" data-act="pick-add:' + r.id + '" aria-label="把' + esc(r.name) + '加进来">' +
      icon(already ? "check" : "plus") + "</button></div>";
  }).join("") + "</div>";
  /* 1193 道全铺进抽屉会把手机卡住，先给一批，靠搜索缩小 */
  const rest = list.length - shown.length;
  if (rest > 0) {
    h += '<p class="sheet-more">' +
      (query ? "还有 " + rest + " 道，再打几个字缩小范围" : "菜谱库共 " + list.length + " 道，打关键词找更快") +
      "</p>";
  }
  return h;
}
function renderSheet() {
  const root = document.getElementById("sheet-root");
  const s = state.sheet;
  if (!s) { root.hidden = true; root.innerHTML = ""; return; }
  if (s.type === "dish") { renderDishSheet(root); return; }
  const title = "添加到 " + DAYS[s.day] + " · " + MEAL_LABEL[s.meal];
  root.hidden = false;
  root.innerHTML = '<div class="sheet-backdrop" data-act="sheet-close"></div>' +
    '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + title + '">' +
      '<div class="sheet-head"><h2>' + title + "</h2>" +
      '<button class="icon-btn" data-act="sheet-close" aria-label="关闭">' + icon("close") + "</button></div>" +
      '<div class="sheet-body stack-3">' +
        '<div class="searchbar">' + icon("search", "search-icon") +
        '<input id="picker-q" type="search" autocomplete="off" placeholder="搜菜名、食材或做法" aria-label="搜索菜谱" /></div>' +
        '<div id="picker-list">' + pickerRows("") + "</div>" +
      "</div></div>";
  const input = document.getElementById("picker-q");
  if (input) {
    input.addEventListener("input", function () {
      document.getElementById("picker-list").innerHTML = pickerRows(input.value);
    });
  }
}
function closeSheet() { state.sheet = null; renderSheet(); }

/* ══════════════════════════════════════════════════════════════════════
   全屏同时烹饪
   一次可以同时做几道菜：每道菜各自记着走到第几步、自己的份量和计时器；
   计时跨菜共用一条提示条，切换步骤或切换菜都不会把计时打断。
   ══════════════════════════════════════════════════════════════════════ */
const TIMER_PRESETS = [1, 3, 5, 10, 15];

function activeDish() {
  const c = state.cook;
  if (!c || !c.dishes.length) return null;
  if (c.active < 0 || c.active >= c.dishes.length) {
    c.active = Math.max(0, Math.min(c.dishes.length - 1, c.active));
  }
  return c.dishes[c.active];
}
function findDish(key) {
  const c = state.cook;
  if (!c) return null;
  for (let i = 0; i < c.dishes.length; i++) if (c.dishes[i].key === key) return c.dishes[i];
  return null;
}
function addDish(id, servings) {
  const c = state.cook;
  const a = activeDish();
  c.seq += 1;
  const d = {
    key: "d" + c.seq, id: id, step: 0, timers: [], dismissed: {},
    servings: servings || (a ? a.servings : state.servings)
  };
  c.dishes.push(d);
  c.active = c.dishes.length - 1;
  return d;
}
/* 详情页的「开始烹饪 / 同时做这道菜」：没有会话就开一个，已经在做就切过去 */
function startCook(id, servings) {
  if (!state.cook) {
    state.cook = { dishes: [], active: 0, seq: 0, tseq: 0, handle: null };
    document.documentElement.style.overflow = "hidden";
  }
  const c = state.cook;
  let d = null;
  for (let i = 0; i < c.dishes.length; i++) if (c.dishes[i].id === id) d = c.dishes[i];
  if (d) c.active = c.dishes.indexOf(d);
  else d = addDish(id, servings);
  ensureStepTimers();
  renderCook();
  return d;
}
function exitCook() {
  stopTicker();
  state.cook = null;
  document.documentElement.style.overflow = "";
  renderCook();
}
/* 走完最后一步 = 这道菜下桌，剩下的继续做 */
function finishDish(key) {
  const c = state.cook;
  const d = findDish(key);
  if (!d) return;
  const name = BY_ID[d.id].name;
  c.dishes = c.dishes.filter(function (x) { return x.key !== key; });
  if (!c.dishes.length) { exitCook(); toast(name + " 做好了，上桌吧"); return; }
  if (c.active >= c.dishes.length) c.active = c.dishes.length - 1;
  ensureStepTimers();
  renderCook();
  syncTicker();
  toast(name + " 做好了，接着做下一道");
}
function removeDish(key) {
  const c = state.cook;
  const d = findDish(key);
  if (!d) return;
  const name = BY_ID[d.id].name;
  c.dishes = c.dishes.filter(function (x) { return x.key !== key; });
  if (!c.dishes.length) { closeSheet(); exitCook(); toast("同时烹饪已清空"); return; }
  if (c.active >= c.dishes.length) c.active = c.dishes.length - 1;
  ensureStepTimers();
  closeSheet();
  renderCook();
  syncTicker();
  toast("已把「" + name + "」拿掉");
}
function switchDish(key) {
  const c = state.cook;
  const i = c.dishes.map(function (d) { return d.key; }).indexOf(key);
  if (i < 0) return;
  c.active = i;
  ensureStepTimers();
  renderCook();
}

function mkTimer(label, meta, seconds, step, own) {
  const c = state.cook;
  c.tseq += 1;
  return { id: "t" + c.tseq, label: label, meta: meta, total: seconds, left: seconds, running: false, done: false, step: step, own: !!own };
}
/* 进入某一步时，把菜谱标注的计时补进这道菜；手动删过的就不再补 */
function ensureStepTimers(dish) {
  const d = dish || activeDish();
  if (!d) return;
  const s = BY_ID[d.id].steps[d.step];
  if (!s.timer || d.dismissed[d.step]) return;
  const has = d.timers.some(function (t) { return t.own && t.step === d.step; });
  if (has) return;
  d.timers.push(mkTimer("本步计时", "菜谱标注 · " + s.timer + " 分钟", s.timer * 60, d.step, true));
}
function stepTimers() {
  const d = activeDish();
  return d ? d.timers.filter(function (t) { return t.step === d.step; }) : [];
}
/* 当前这一屏之外的计时都算：别的步骤、别的菜 */
function otherTimers() {
  const c = state.cook;
  const a = activeDish();
  const out = [];
  if (!c || !a) return out;
  c.dishes.forEach(function (d) {
    d.timers.forEach(function (t) {
      if (d.key === a.key && t.step === a.step) return;
      if (t.running || t.done) out.push({ dish: d, timer: t });
    });
  });
  return out;
}
function alertInfo() {
  const list = otherTimers();
  if (!list.length) return null;
  const done = list.filter(function (x) { return x.timer.done; });
  const pick = done.length
    ? done[0]
    : list.slice().sort(function (a, b) { return a.timer.left - b.timer.left; })[0];
  return {
    state: done.length ? "done" : "run",
    name: BY_ID[pick.dish.id].name,
    label: pick.timer.label,
    time: done.length ? "时间到" : mmss(pick.timer.left),
    extra: (done.length ? done.length : list.length) - 1,
    dishKey: pick.dish.key,
    step: pick.timer.step
  };
}

function stopTicker() {
  if (state.cook && state.cook.handle) { window.clearInterval(state.cook.handle); state.cook.handle = null; }
}
function syncTicker() {
  const c = state.cook;
  if (!c) return;
  const running = c.dishes.some(function (d) {
    return d.timers.some(function (t) { return t.running; });
  });
  if (running) {
    if (!c.handle) c.handle = window.setInterval(tickTimers, 1000);
  } else {
    stopTicker();
  }
}
function tickTimers() {
  const c = state.cook;
  if (!c) { stopTicker(); return; }
  let fired = null;
  c.dishes.forEach(function (d) {
    d.timers.forEach(function (t) {
      if (!t.running) return;
      t.left = Math.max(0, t.left - 1);
      if (t.left === 0) { t.running = false; t.done = true; fired = { dish: d, timer: t }; }
    });
  });
  if (fired) {
    renderCook();
    toast("「" + BY_ID[fired.dish.id].name + " · " + fired.timer.label + "」时间到");
  } else {
    paintTimers();
  }
  syncTicker();
}
/* 每秒只改文本与进度条宽度，不整体重绘，避免打断悬停和焦点 */
function paintTimers() {
  const c = state.cook;
  if (!c) return;
  c.dishes.forEach(function (d) {
    d.timers.forEach(function (t) {
      const clock = document.getElementById("clock-" + t.id);
      const fill = document.getElementById("fill-" + t.id);
      if (clock) clock.textContent = mmss(t.left);
      if (fill) fill.style.width = (t.total ? (t.left / t.total) * 100 : 0) + "%";
    });
  });
  paintCookAlert();
}
function paintCookAlert() {
  const el = document.getElementById("cook-alert");
  if (!el) return;
  const info = alertInfo();
  if (!info) { el.hidden = true; return; }
  el.hidden = false;
  el.setAttribute("data-state", info.state);
  const text = document.getElementById("alert-text");
  const time = document.getElementById("alert-time");
  const more = document.getElementById("alert-more");
  if (text) text.textContent = info.name + " · " + info.label;
  if (time) time.textContent = info.time;
  if (more) { more.hidden = info.extra <= 0; more.textContent = info.extra > 0 ? "+" + info.extra : ""; }
}

function findTimer(id) {
  const c = state.cook;
  if (!c) return null;
  for (let i = 0; i < c.dishes.length; i++) {
    const t = c.dishes[i].timers.filter(function (x) { return x.id === id; })[0];
    if (t) return { dish: c.dishes[i], timer: t };
  }
  return null;
}
function addTimer(min) {
  const d = activeDish();
  if (!d) return;
  const t = mkTimer(min + " 分钟", "手动添加", min * 60, d.step, false);
  t.running = true;
  d.timers.push(t);
  renderCook();
  syncTicker();
  toast(min + " 分钟计时已开始");
}
function toggleTimer(id) {
  const f = findTimer(id);
  if (!f) return;
  const t = f.timer;
  if (t.done) { t.done = false; t.left = t.total; t.running = true; }
  else if (t.running) { t.running = false; }
  else if (t.left > 0) { t.running = true; }
  renderCook();
  syncTicker();
}
function resetTimer(id) {
  const f = findTimer(id);
  if (!f) return;
  f.timer.left = f.timer.total; f.timer.done = false; f.timer.running = false;
  renderCook();
  syncTicker();
}
function removeTimer(id) {
  const f = findTimer(id);
  if (!f) return;
  if (f.timer.own) f.dish.dismissed[f.timer.step] = true;
  f.dish.timers = f.dish.timers.filter(function (x) { return x.id !== id; });
  renderCook();
  syncTicker();
}
/* 「同时起」：把这一步还没结束的计时一起开始 / 一起暂停 */
function toggleAllTimers() {
  const list = stepTimers().filter(function (t) { return !t.done; });
  if (!list.length) return;
  const pause = list.some(function (t) { return t.running; });
  list.forEach(function (t) { t.running = !pause; });
  renderCook();
  syncTicker();
  toast(pause ? "已全部暂停" : "已同时开始 " + list.length + " 个计时");
}
function jumpToTimer() {
  const info = alertInfo();
  const c = state.cook;
  if (!info || !c) return;
  const i = c.dishes.map(function (d) { return d.key; }).indexOf(info.dishKey);
  if (i < 0) return;
  c.active = i;
  c.dishes[i].step = info.step;
  ensureStepTimers();
  renderCook();
}

function cookGo(delta) {
  const d = activeDish();
  if (!d) return;
  const r = BY_ID[d.id];
  const next = d.step + delta;
  if (next < 0) return;
  if (next >= r.steps.length) { finishDish(d.key); return; }
  d.step = next;
  ensureStepTimers();
  renderCook();
}

/* 这道菜身上有没有在跑的计时、有没有刚响过的。
   刚响过的优先显示 —— 计时结束时圆点不该跟着消失，那正是最该看一眼的时候。 */
function dishTimerState(d) {
  let running = 0, done = 0;
  d.timers.forEach(function (t) { if (t.running) running++; else if (t.done) done++; });
  return { running: running, done: done, flag: done ? "done" : running ? "run" : "" };
}
/* 同时做的那几道菜：一行可横滑的切换 chip，末尾是「加一道菜」 */
function dishTabs() {
  const c = state.cook;
  let h = '<div class="cook-dishes" id="cook-dishes" data-od-id="cook-dishes">';
  c.dishes.forEach(function (d, i) {
    const name = BY_ID[d.id].name;
    const st = dishTimerState(d);
    const note = st.done ? "，计时结束" : st.running ? "，" + st.running + " 个计时进行中" : "";
    h += '<button class="chip" data-act="dish:' + d.key + '" aria-pressed="' + (i === c.active) + '"' +
      (st.flag ? ' data-timer="' + st.flag + '"' : "") +
      ' aria-label="' + esc(name + note) + '">' + esc(name) +
      (st.flag ? '<i class="dish-dot" aria-hidden="true"></i>' : "") +
      "</button>";
  });
  return h + '<button class="chip chip-add" data-act="add-dish">' + icon("plus") + "加一道菜</button></div>";
}
/* 切到别的菜之后，把它带回可视范围。不用 scrollIntoView —— 那个会顶飞预览 */
function keepActiveChipInView() {
  const row = document.getElementById("cook-dishes");
  if (!row || typeof row.querySelector !== "function") return;
  const el = row.querySelector('[aria-pressed="true"]');
  if (!el || typeof el.offsetLeft !== "number") return;
  /* offsetLeft 是相对最近的定位祖先算的，换成相对这一行，免得以后行不再贴左边就失准 */
  const x = el.offsetLeft - (row.offsetLeft || 0);
  const pad = 20;
  const width = row.clientWidth || 0;
  if (x - pad < row.scrollLeft) row.scrollLeft = Math.max(0, x - pad);
  else if (x + el.offsetWidth + pad > row.scrollLeft + width) {
    row.scrollLeft = Math.max(0, x + el.offsetWidth + pad - width);
  }
}

function timerRow(t) {
  const st = t.done ? "done" : t.running ? "running" : "paused";
  const pct = t.total ? (t.left / t.total) * 100 : 0;
  const toggleLabel = (t.running ? "暂停 " : t.done ? "重新开始 " : "开始 ") + t.label;
  return '<li class="timer-row" data-state="' + st + '" data-od-id="timer-' + t.id + '">' +
    '<span class="timer-clock num" id="clock-' + t.id + '">' + mmss(t.left) + "</span>" +
    '<span class="timer-main"><span class="timer-label">' + esc(t.label) + "</span>" +
    '<span class="timer-meta">' + (t.done ? "时间到" : esc(t.meta)) + "</span></span>" +
    '<span class="timer-acts">' +
      '<button class="timer-btn" data-act="timer-toggle:' + t.id + '" aria-label="' + esc(toggleLabel) + '">' + icon(t.running ? "pause" : "play") + "</button>" +
      '<button class="timer-btn" data-act="timer-reset:' + t.id + '" aria-label="重置 ' + esc(t.label) + '">' + icon("reset") + "</button>" +
      '<button class="timer-btn" data-act="timer-remove:' + t.id + '" aria-label="移除 ' + esc(t.label) + '">' + icon("close") + "</button>" +
    "</span>" +
    '<i class="timer-fill" id="fill-' + t.id + '" style="width:' + pct + '%" aria-hidden="true"></i></li>';
}
function timerBlock() {
  const list = stepTimers();
  const anyRun = list.some(function (t) { return t.running; });
  let h = '<div class="cook-timers" data-od-id="cook-timers">' +
    '<div class="cook-timers-head"><h3>计时</h3>' +
    (list.length
      ? '<button class="btn btn-secondary" data-act="timers-toggle-all">' + (anyRun ? "全部暂停" : "全部开始") + "</button>"
      : '<span class="meta">这一步没有标计时，可以随手加一个</span>') +
    "</div>";
  if (list.length) h += '<ul class="timer-list">' + list.map(timerRow).join("") + "</ul>";
  h += '<div class="timer-add"><span class="timer-add-label">加计时</span>' +
    TIMER_PRESETS.map(function (m) {
      return '<button class="chip" data-act="timer-add:' + m + '">' + m + " 分钟</button>";
    }).join("") + "</div></div>";
  return h;
}

/* 计时到点会整块重绘。同一道菜同一步重绘时，把步骤区的滚动位置放回去 ——
   否则正要按「暂停」的时候屏幕被拽回顶部，按钮从手指底下溜走。
   换菜或换步骤时不清零反而是错的，所以只有画面没变才保留。 */
let cookViewKey = "";

function renderCook() {
  const root = document.getElementById("cook-root");
  const c = state.cook;
  const d = activeDish();
  if (!c || !d) { root.hidden = true; root.innerHTML = ""; cookViewKey = ""; return; }
  const r = BY_ID[d.id];
  const s = r.steps[d.step];
  const total = r.steps.length;
  const pct = Math.round(((d.step + 1) / total) * 100);
  const last = d.step === total - 1;
  const alert = alertInfo();
  const many = c.dishes.length > 1;
  const view = d.key + ":" + d.step;
  const before = document.querySelector(".cook-body");
  const keepTop = view === cookViewKey && before ? before.scrollTop : 0;

  const railIng = '<div class="cook-rail" data-od-id="cook-ingredients"><h3>' + esc(r.name) + " · " + d.servings + " 人份</h3>" +
    r.ing.map(function (i) {
      const q = scaleQtyFor(i.q, d.servings);
      return '<div class="ing-row"><span class="ing-name">' + esc(i.n) + '</span><span class="ing-qty num">' + fmtQty(q, i.u) + "</span></div>";
    }).join("") + "</div>";

  root.hidden = false;
  root.innerHTML = '<div class="cook"><header class="cook-top">' +
    '<button class="icon-btn" data-act="cook-exit" aria-label="' + (many ? "退出同时烹饪" : "退出烹饪模式") + '">' + icon("close") + "</button>" +
    '<div class="cook-progress"><span class="cook-step-label">第 ' + (d.step + 1) + " 步，共 " + total + " 步</span>" +
    '<div class="cook-bar"><i style="width:' + pct + '%"></i></div></div></header>' +
    dishTabs() +
    '<button class="cook-alert" id="cook-alert" data-act="cook-jump" data-state="' + (alert ? alert.state : "run") + '"' +
      (alert ? "" : " hidden") + ">" + icon("timer") +
      '<span class="cook-alert-text" id="alert-text">' + (alert ? esc(alert.name + " · " + alert.label) : "") + "</span>" +
      '<span class="cook-alert-more" id="alert-more"' + (alert && alert.extra > 0 ? "" : " hidden") + ">" +
      (alert && alert.extra > 0 ? "+" + alert.extra : "") + "</span>" +
      '<span class="cook-alert-time num" id="alert-time">' + (alert ? esc(alert.time) : "") + "</span>" +
      icon("right") + "</button>" +
    '<div class="cook-body">' + railIng +
      '<section class="cook-step"><div class="cook-stepnum num" aria-hidden="true">' + (d.step + 1) + "</div>" +
      '<p class="cook-text">' + esc(s.t) + "</p>" +
      '<div class="cook-chips">' + s.ing.map(function (n) { return '<span class="tag tag-solid">' + esc(n) + "</span>"; }).join("") + "</div>" +
      timerBlock() +
      "</section></div>" +
    '<footer class="cook-foot">' +
      '<button class="btn btn-secondary" data-act="cook-prev"' + (d.step === 0 ? " disabled" : "") + ">上一步</button>" +
      '<button class="btn btn-primary" data-act="cook-next">' + (last ? "这道菜做好了" : "下一步") + "</button>" +
    "</footer></div>";
  paintTimers();
  keepActiveChipInView();
  if (keepTop) {
    const after = document.querySelector(".cook-body");
    if (after) after.scrollTop = keepTop;
  }
  cookViewKey = view;
}

/* ══════════════════════════════════════════════════════════════════════
   导航与动作
   ══════════════════════════════════════════════════════════════════════ */
/* 离开一屏时记下位置，回到这一屏时放回原处。
   详情永远从头看起 —— 换了道菜还停在上次的位置是错的。 */
function rememberScroll() {
  if (state.screen === "detail") return;
  state.scroll[state.screen] = window.scrollY || 0;
}
function restoreScroll(screen) {
  if (screen === "detail") { window.scrollTo(0, 0); return; }
  const y = state.scroll[screen];
  window.scrollTo(0, typeof y === "number" ? y : 0);
}
function go(screen, opts) {
  opts = opts || {};
  rememberScroll();
  if (!isNav(screen) && isNav(state.screen)) state.backTo = state.screen;
  state.screen = screen;
  if (opts.detailId) state.detailId = opts.detailId;
  if (opts.orderTab) state.orderTab = opts.orderTab;
  if (screen !== "order") state.importResult = null;
  state.sheet = null;
  render();
  restoreScroll(screen);
}
function openRecipe(id) {
  state.servings = 2;
  state.importResult = null;
  go("detail", { detailId: id });
}
function toggleFav(id) {
  const i = state.fav.indexOf(id);
  if (i >= 0) { state.fav.splice(i, 1); toast("已从" + favLabel() + "里移除"); }
  else { state.fav.push(id); toast(inPick() ? "已加入想吃，去点菜页就能发给对方" : "已收藏"); }
  state.genCode = null;
  render();
}
function addToMeal(meal) {
  const d = todayIndex();
  state.menu[meal][d].push(state.detailId);
  toast("已加入 " + DAYS[d] + MEAL_LABEL[meal]);
}

function handle(act) {
  if (act.indexOf("go:") === 0) { go(act.slice(3)); return; }
  if (act.indexOf("open:") === 0) { openRecipe(act.slice(5)); return; }
  if (act.indexOf("fav:") === 0) { toggleFav(act.slice(4)); return; }
  if (act === "back") {
    let target = state.backTo;
    if (state.screen === "settings" && inPick()) target = "find";
    if (!isNav(target)) target = navIds()[0];
    go(target);
    return;
  }
  if (act.indexOf("m:") === 0) {
    const m = act.slice(2);
    const arr = state.filters.methods;
    const i = arr.indexOf(m);
    if (i >= 0) arr.splice(i, 1); else arr.push(m);
    renderScreen();
    return;
  }
  if (act === "cyc-time") { state.filters.time = cycle(TIME_STEPS, state.filters.time); renderScreen(); return; }
  if (act === "cyc-kcal") { state.filters.kcal = cycle(KCAL_STEPS, state.filters.kcal); renderScreen(); return; }
  if (act === "cyc-protein") { state.filters.protein = cycle(PROTEIN_STEPS, state.filters.protein); renderScreen(); return; }
  if (act === "toggle-lean") { state.filters.lean = !state.filters.lean; renderScreen(); return; }
  if (act === "load-more") { loadMore(); return; }
  if (act === "clear-q") { state.query = ""; renderScreen(); const i = document.getElementById("q"); if (i) i.focus(); return; }
  if (act === "reset-filters") {
    state.query = "";
    state.filters = { methods: [], time: "all", kcal: "all", protein: "all", lean: false };
    renderScreen();
    return;
  }
  if (act === "serv-" || act === "serv+") {
    state.servings = Math.min(8, Math.max(1, state.servings + (act === "serv+" ? 1 : -1)));
    renderScreen();
    return;
  }
  if (act === "start-cook") { startCook(state.detailId, state.servings); return; }
  if (act === "cook-exit") { exitCook(); return; }
  if (act === "add-dish") { openDishPicker(); return; }
  if (act.indexOf("dish-add:") === 0) { addDishFromPicker(act.slice(9)); return; }
  if (act.indexOf("dish-remove:") === 0) { removeDish(act.slice(12)); return; }
  if (act.indexOf("dish:") === 0) { switchDish(act.slice(5)); return; }
  if (act === "cook-prev") { cookGo(-1); return; }
  if (act === "cook-next") { cookGo(1); return; }
  if (act === "timers-toggle-all") { toggleAllTimers(); return; }
  if (act.indexOf("timer-add:") === 0) { addTimer(Number(act.slice(10))); return; }
  if (act.indexOf("timer-toggle:") === 0) { toggleTimer(act.slice(13)); return; }
  if (act.indexOf("timer-reset:") === 0) { resetTimer(act.slice(12)); return; }
  if (act.indexOf("timer-remove:") === 0) { removeTimer(act.slice(13)); return; }
  if (act === "cook-jump") { jumpToTimer(); return; }
  if (act.indexOf("add:") === 0) { const p = act.split(":"); openPicker(p[1], Number(p[2])); return; }
  if (act.indexOf("rm:") === 0) {
    const p = act.split(":");
    const arr = state.menu[p[1]][Number(p[2])];
    arr.splice(arr.indexOf(p[3]), 1);
    renderScreen();
    return;
  }
  if (act.indexOf("add-meal:") === 0) { addToMeal(act.slice(9)); return; }
  if (act.indexOf("pick-add:") === 0) {
    const id = act.slice(9);
    const s = state.sheet;
    if (s && state.menu[s.meal][s.day].indexOf(id) < 0) state.menu[s.meal][s.day].push(id);
    toast("已加入 " + DAYS[s.day] + MEAL_LABEL[s.meal]);
    closeSheet();
    renderScreen();
    return;
  }
  if (act === "sheet-close") { closeSheet(); return; }
  if (act.indexOf("extra:") === 0) { const k = act.slice(6); state.extrasOpen[k] = !state.extrasOpen[k]; renderScreen(); return; }
  if (act.indexOf("check:") === 0) {
    const k = act.slice(6);
    if (state.shopChecked[k]) delete state.shopChecked[k]; else state.shopChecked[k] = true;
    renderScreen();
    return;
  }
  if (act === "tab:gen") { state.orderTab = "gen"; state.importResult = null; renderScreen(); return; }
  if (act === "tab:imp") { state.orderTab = "imp"; renderScreen(); return; }
  if (act === "gen-code") { state.genCode = buildCode(); renderScreen(); toast("点菜码已生成"); return; }
  if (act === "copy-code") { copyText(state.genCode || buildCode()); return; }
  if (act === "sample-code") {
    state.importText = '家宴点菜: {"recipeIds":["red-cooked-pork-belly","xf-264051","xf-11151"]}';
    state.importResult = null;
    renderScreen();
    return;
  }
  if (act === "parse-code") {
    const el = document.getElementById("import-text");
    state.importText = el ? el.value : state.importText;
    const res = parseCode(state.importText);
    state.importResult = res;
    renderScreen();
    if (res.error) toast("没有识别成功，数据未改动");
    return;
  }
  if (act === "add-pending") {
    state.importResult.ok.forEach(function (r) { if (state.pending.indexOf(r.id) < 0) state.pending.push(r.id); });
    if (state.mode === "cook") {
      toast("已加入待办，共 " + state.pending.length + " 道");
      go("menu");
    } else {
      state.importResult = null;
      state.importText = "";
      state.orderTab = "gen";
      renderScreen();
      toast("已加入待办，共 " + state.pending.length + " 道");
    }
    return;
  }
  if (act === "pending-clear") { state.pending = []; renderScreen(); return; }
  if (act === "pending-schedule") { schedulePending(); renderScreen(); return; }
  if (act === "go-order-import") { state.orderTab = "imp"; state.importResult = null; go("order"); return; }
  if (act.indexOf("mode:") === 0) {
    const m = act.slice(5);
    if (m !== state.mode) {
      state.mode = m;
      state.screen = "find";
      state.backTo = "find";
      render();
      toast(m === "cook" ? "已切换到烹饪设备" : "已切换到选择设备");
    }
    return;
  }
  if (act === "reset-all") {
    state.fav = []; state.pending = []; state.genCode = null;
    state.shopChecked = {}; state.shopCustom = [];
    state.menu = { lunch: [[], [], [], [], [], [], []], dinner: [[], [], [], [], [], [], []], breakfast: [[], [], [], [], [], [], []], snack: [[], [], [], [], [], [], []] };
    render();
    toast("演示数据已清空");
    return;
  }
}
function schedulePending() {
  const ids = state.pending.slice();
  const slots = [];
  for (let d = 0; d < 7; d++) { slots.push(["lunch", d]); slots.push(["dinner", d]); }
  let placed = 0;
  for (let i = 0; i < slots.length && ids.length; i++) {
    const s = slots[i];
    if (state.menu[s[0]][s[1]].length === 0) { state.menu[s[0]][s[1]].push(ids.shift()); placed++; }
  }
  state.pending = ids;
  toast(placed ? "已排进 " + placed + " 个空位" : "本周午餐晚餐都排满了");
}
function copyText(text) {
  const done = function () { toast("已复制，粘贴发给对方就行"); };
  const fail = function () { toast("复制没成功，长按选中那段文字手动复制"); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(function () { legacyCopy(text) ? done() : fail(); });
  } else {
    legacyCopy(text) ? done() : fail();
  }
}
function legacyCopy(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) { return false; }
}

/* ══════════════════════════════════════════════════════════════════════
   事件绑定
   ══════════════════════════════════════════════════════════════════════ */
document.addEventListener("click", function (e) {
  const el = e.target.closest ? e.target.closest("[data-act]") : null;
  if (!el) return;
  const act = el.getAttribute("data-act");
  if (act === "shop-add") return;
  if (el.tagName === "INPUT" && el.type === "checkbox") e.preventDefault();
  handle(act);
});
document.addEventListener("submit", function (e) {
  const form = e.target.closest ? e.target.closest('[data-act="shop-add"]') : null;
  if (!form) return;
  e.preventDefault();
  const input = document.getElementById("shop-input");
  const raw = (input.value || "").trim();
  if (!raw) return;
  const m = raw.match(/^(.*?)[\s　]*([0-9]+(?:\.[0-9]+)?)[\s　]*([^\s　0-9]*)$/);
  let name, qty, unit;
  if (m) {
    name = m[1].trim() || raw;
    qty = parseFloat(m[2]);
    unit = (m[3] || "").trim() || "份";
  } else {
    name = raw; qty = 1; unit = "份";
  }
  state.shopCustom.push({ n: name, q: qty, u: unit, c: "other" });
  state.shopInput = "";
  renderScreen();
  toast("已添加：" + name);
  const again = document.getElementById("shop-input");
  if (again) again.focus();
});
document.addEventListener("input", function (e) {
  /* 底部的添加栏常驻，勾选别的项会触发重绘，先把手上打的字记下来 */
  if (e.target.id === "shop-input") { state.shopInput = e.target.value; return; }
  if (e.target.id !== "q") return;
  state.query = e.target.value;
  paintFindResults();
  const clear = document.querySelector(".search-clear");
  if (clear) clear.hidden = !state.query;
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (state.sheet) { closeSheet(); return; }
    if (state.cook) { exitCook(); return; }
  }
  if (state.cook && !state.sheet) {
    if (e.key === "ArrowRight") { cookGo(1); }
    if (e.key === "ArrowLeft") { cookGo(-1); }
  }
});

/* ── 演示起点 ───────────────────────────────────────────────────────────
   预置一段「已经用了一周」的真实状态，这样打开就能看到排好的菜单、
   汇总好的营养和采购清单。设置页的「清空本机演示数据」可以一键回到空白。
   原型不写入任何存储，刷新即回到这里。                                    */
function seedDemo() {
  state.fav = ["red-cooked-pork-belly", "xf-264051", "xf-11151", "xf-104116894"];
  const m = state.menu;
  m.lunch[0] = ["xf-1012917", "xf-107651597"];
  m.dinner[0] = ["xf-264051", "smashed-cucumber-salad"];
  m.lunch[1] = ["xf-11151"];
  m.dinner[1] = ["xf-100285641"];
  m.lunch[2] = ["mapo-tofu"];
  m.dinner[2] = ["xf-104052945"];
  m.lunch[3] = ["xf-92561"];
  m.dinner[3] = ["beef-chow-fun"];
  m.dinner[4] = ["xf-104116894"];
  m.lunch[5] = ["red-cooked-pork-belly", "xf-106775922"];
  m.dinner[6] = ["xf-35632"];
  m.breakfast[1] = ["xf-106683465"];
  state.extrasOpen.breakfast = true;
}

/* 换断点时顶栏高度会变（桌面端收起模式 chip），重新量一次 */
window.addEventListener("resize", paintShellMetrics);

/* ══════════════════════════════════════════════════════════════════════
   持久化：把用户状态写入 localStorage，刷新/重新打开后保留。
   菜谱数据只读，不写入存储。
   ══════════════════════════════════════════════════════════════════════ */
const LS_KEY = "jiayan_state_v1";
function saveState() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      mode: state.mode,
      fav: state.fav,
      pending: state.pending,
      genCode: state.genCode,
      shopChecked: state.shopChecked,
      shopCustom: state.shopCustom,
      menu: state.menu,
      extrasOpen: state.extrasOpen,
      query: state.query,
      filters: state.filters,
      sort: state.sort
    }));
  } catch (e) { /* 隐私模式或不支持时静默失败 */ }
}
function loadState() {
  try {
    var saved = localStorage.getItem(LS_KEY);
    if (!saved) return;
    var parsed = JSON.parse(saved);
    if (parsed.mode) state.mode = parsed.mode;
    if (parsed.fav) state.fav = parsed.fav;
    if (parsed.pending) state.pending = parsed.pending;
    if (parsed.genCode !== undefined) state.genCode = parsed.genCode;
    if (parsed.shopChecked) state.shopChecked = parsed.shopChecked;
    if (parsed.shopCustom) state.shopCustom = parsed.shopCustom;
    if (parsed.menu) state.menu = parsed.menu;
    if (parsed.extrasOpen) state.extrasOpen = parsed.extrasOpen;
    if (parsed.query !== undefined) state.query = parsed.query;
    if (parsed.filters) state.filters = parsed.filters;
    if (parsed.sort) state.sort = parsed.sort;
  } catch (e) { /* 忽略损坏的数据 */ }
}
function hasAnyUserData() {
  if (state.fav && state.fav.length) return true;
  if (state.pending && state.pending.length) return true;
  if (state.shopCustom && state.shopCustom.length) return true;
  for (var i = 0; i < 7; i++) {
    if (state.menu.lunch[i].length) return true;
    if (state.menu.dinner[i].length) return true;
    if (state.menu.breakfast[i].length) return true;
    if (state.menu.snack[i].length) return true;
  }
  return false;
}

/* ── Service Worker 注册 ────────────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(function (err) {
    console.error('SW registration failed:', err);
  });
}

/* ── 启动 ───────────────────────────────────────────────────────────── */
loadRecipes().then(function () {
  loadState();
  if (!hasAnyUserData()) seedDemo();
  render();
  window.addEventListener("beforeunload", saveState);
  setInterval(saveState, 2000);
}).catch(function (err) {
  console.error("Failed to load recipes:", err);
  document.body.innerHTML = "<div style='padding:24px;text-align:center;color:#1c1a17;'>加载菜谱数据失败，请检查网络连接后刷新重试。</div>";
});

