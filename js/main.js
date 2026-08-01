(function () {
  "use strict";

  var SONGS = window.VS_SONGS || [];
  var SINGERS = window.VS_SINGERS || {};
  var LIKE_KEY = "vsong_likes_v1";

  var state = {
    query: "",
    singer: "all",
    genre: "all",
    sort: "latest",
    likes: loadLikes()
  };

  var els = {
    grid: document.getElementById("songGrid"),
    search: document.getElementById("searchInput"),
    sort: document.getElementById("sortSelect"),
    singerChips: document.getElementById("singerChips"),
    genreChips: document.getElementById("genreChips"),
    resultCount: document.getElementById("resultCount"),
    empty: document.getElementById("emptyState"),
    resetBtn: document.getElementById("resetBtn"),
    backdrop: document.getElementById("modalBackdrop"),
    modalBody: document.getElementById("modalBody"),
    modalClose: document.getElementById("modalClose"),
    header: document.getElementById("siteHeader"),
    navToggle: document.getElementById("navToggle"),
    navLinks: document.getElementById("navLinks")
  };

  /* ---------- 工具函数 ---------- */
  function loadLikes() {
    try {
      return JSON.parse(localStorage.getItem(LIKE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveLikes() {
    try { localStorage.setItem(LIKE_KEY, JSON.stringify(state.likes)); } catch (e) { /* ignore */ }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmt(n) {
    n = Number(n) || 0;
    if (n >= 10000) {
      var v = (n / 10000).toFixed(1).replace(/\.0$/, "");
      return v + " 万";
    }
    return String(n);
  }

  function searchUrl(song, platform) {
    var kw = encodeURIComponent(song.singerName + " " + song.title + " 翻唱");
    if (platform === "bilibili") return "https://search.bilibili.com/all?keyword=" + kw;
    if (platform === "netease") return "https://music.163.com/#/search/m/?s=" + kw;
    if (platform === "youtube") return "https://www.youtube.com/results?search_query=" + kw;
    return "#";
  }

  /* ---------- 封面生成（内联 SVG） ---------- */
  function coverArt(song) {
    var p = SINGERS[song.singer] || { c1: "#38bdf8", c2: "#0f6fa8" };
    var ch = Array.from(song.title)[0] || "♪";
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">' +
      '<defs>' +
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + p.c1 + '"/><stop offset="1" stop-color="' + p.c2 + '"/>' +
      "</linearGradient>" +
      '<radialGradient id="r" cx="0.5" cy="0.32" r="0.75">' +
      '<stop offset="0" stop-color="#ffffff" stop-opacity="0.38"/>' +
      '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>' +
      "</radialGradient>" +
      "</defs>" +
      '<rect width="640" height="640" fill="url(#g)"/>' +
      '<circle cx="480" cy="130" r="240" fill="url(#r)"/>' +
      '<circle cx="90" cy="560" r="180" fill="#ffffff" fill-opacity="0.06"/>' +
      '<path d="M0 520 C 160 430, 300 610, 640 470 L 640 640 L 0 640 Z" fill="#06121f" fill-opacity="0.22"/>' +
      '<g fill="#ffffff" fill-opacity="0.14">' +
      '<rect x="70" y="200" width="16" height="46" rx="8"/>' +
      '<rect x="98" y="180" width="16" height="66" rx="8"/>' +
      '<rect x="126" y="210" width="16" height="42" rx="8"/>' +
      '<rect x="154" y="188" width="16" height="56" rx="8"/>' +
      "</g>" +
      '<text x="320" y="392" text-anchor="middle" font-size="250" fill="#ffffff" fill-opacity="0.94" font-family="Georgia, serif">' + ch + "</text>" +
      '<text x="320" y="522" text-anchor="middle" font-size="30" fill="#ffffff" fill-opacity="0.88" font-family="sans-serif" letter-spacing="8">' + song.singerName + "</text>" +
      "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ---------- 数据整理 ---------- */
  function decorate(song) {
    var s = SINGERS[song.singer];
    song.singerName = s ? s.name : song.singer;
    song.palette = s || { c1: "#38bdf8", c2: "#0f6fa8" };
    return song;
  }

  var songs = SONGS.map(decorate);

  function uniqueSingers() {
    var seen = {};
    return songs.filter(function (s) { return seen[s.singer] ? false : (seen[s.singer] = true); });
  }

  function uniqueGenres() {
    var map = {};
    songs.forEach(function (s) { s.genre.forEach(function (g) { map[g] = true; }); });
    return Object.keys(map);
  }

  /* ---------- 渲染 ---------- */
  function cardHTML(song) {
    var liked = !!state.likes[song.id];
    var tags = song.genre.map(function (g) { return '<span class="tag">' + esc(g) + "</span>"; }).join("");
    return (
      '<article class="song-card" data-id="' + esc(song.id) + '" tabindex="0" role="button" aria-label="查看作品 ' + esc(song.title) + ' 详情">' +
        '<div class="card-cover">' +
          '<img src="' + coverArt(song) + '" alt="' + esc(song.title) + " - " + esc(song.singerName) + ' 封面" loading="lazy" />' +
          '<span class="card-duration">' + esc(song.duration) + "</span>" +
          '<button class="card-like' + (liked ? " on" : "") + '" data-like="' + esc(song.id) + '" aria-label="收藏 ' + esc(song.title) + '">' + (liked ? "♥" : "♡") + "</button>" +
          '<div class="card-hover">' +
            '<a class="card-play" href="' + searchUrl(song, "bilibili") + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">▶ 去听</a>' +
          "</div>" +
        "</div>" +
        '<div class="card-info">' +
          '<h3 class="card-title">' + esc(song.title) + "</h3>" +
          '<p class="card-meta"><span class="card-singer" style="background:linear-gradient(135deg,' + song.palette.c1 + "," + song.palette.c2 + ')">' + esc(song.singerName) + '</span><span class="card-original">原曲：' + esc(song.originalArtist) + "《" + esc(song.original) + "》</span></p>" +
          '<div class="card-tags">' + tags + "</div>" +
          '<div class="card-foot"><span>▶ ' + fmt(song.views) + "</span><span>♥ " + fmt(song.likes + (liked ? 1 : 0)) + '</span><span class="year">' + song.year + "</span></div>" +
        "</div>" +
      "</article>"
    );
  }

  function modalHTML(song) {
    var liked = !!state.likes[song.id];
    var tags = song.genre.map(function (g) { return '<span class="tag">' + esc(g) + "</span>"; }).join("");
    return (
      '<div class="modal-cover"><img src="' + coverArt(song) + '" alt="' + esc(song.title) + ' 封面" /></div>' +
      '<div class="modal-info">' +
        '<h3 id="modalTitle">' + esc(song.title) + "</h3>" +
        '<p class="modal-original">原曲：' + esc(song.originalArtist) + "《" + esc(song.original) + "》</p>" +
        '<div class="card-tags" style="margin-top:12px">' + tags + "</div>" +
        '<p class="modal-desc">' + esc(song.desc) + "</p>" +
        '<div class="modal-facts">' +
          "<span>歌姬：<b>" + esc(song.singerName) + "</b></span>" +
          "<span>年份：<b>" + song.year + "</b></span>" +
          "<span>时长：<b>" + esc(song.duration) + "</b></span>" +
          "<span>播放：<b>" + fmt(song.views) + "</b></span>" +
          "<span>收藏：<b>" + fmt(song.likes + (liked ? 1 : 0)) + "</b></span>" +
        "</div>" +
        '<div class="modal-links">' +
          '<a class="primary" href="' + searchUrl(song, "bilibili") + '" target="_blank" rel="noopener">▶ B 站收听</a>' +
          '<a href="' + searchUrl(song, "netease") + '" target="_blank" rel="noopener">网易云音乐</a>' +
          '<a href="' + searchUrl(song, "youtube") + '" target="_blank" rel="noopener">YouTube</a>' +
        "</div>" +
        '<p class="modal-tip">* 链接将打开对应平台的搜索结果，选择你喜欢的版本即可收听。</p>' +
      "</div>"
    );
  }

  function renderGrid() {
    var list = getFiltered();
    els.grid.innerHTML = list.map(cardHTML).join("");
    els.empty.hidden = list.length !== 0;
    els.resultCount.textContent = "共 " + list.length + " 首作品";
  }

  function renderChips() {
    var singerChips = [{ key: "all", label: "全部歌姬" }]
      .concat(uniqueSingers().map(function (s) { return { key: s.singer, label: s.singerName }; }));
    var genreChips = [{ key: "all", label: "全部曲风" }]
      .concat(uniqueGenres().map(function (g) { return { key: g, label: g }; }));

    els.singerChips.innerHTML = singerChips.map(function (c) {
      return '<button class="chip' + (state.singer === c.key ? " active" : "") + '" data-singer="' + esc(c.key) + '">' + esc(c.label) + "</button>";
    }).join("");

    els.genreChips.innerHTML = genreChips.map(function (c) {
      return '<button class="chip' + (state.genre === c.key ? " active" : "") + '" data-genre="' + esc(c.key) + '">' + esc(c.label) + "</button>";
    }).join("");
  }

  /* ---------- 筛选与排序 ---------- */
  function getFiltered() {
    var q = state.query.trim().toLowerCase();
    var list = songs.filter(function (s) {
      if (state.singer !== "all" && s.singer !== state.singer) return false;
      if (state.genre !== "all" && s.genre.indexOf(state.genre) === -1) return false;
      if (q) {
        var hay = (s.title + " " + s.original + " " + s.originalArtist + " " + s.singerName + " " + s.genre.join(" ")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    var sorters = {
      latest: function (a, b) { return b.year - a.year; },
      popular: function (a, b) { return b.views - a.views; },
      liked: function (a, b) { return (b.likes + (state.likes[b.id] ? 1 : 0)) - (a.likes + (state.likes[a.id] ? 1 : 0)); }
    };
    return list.slice().sort(sorters[state.sort] || sorters.latest);
  }

  /* ---------- 统计数字 ---------- */
  function initStats() {
    var plays = songs.reduce(function (sum, s) { return sum + (Number(s.views) || 0); }, 0);
    var data = {
      songs: songs.length,
      singers: uniqueSingers().length,
      genres: uniqueGenres().length,
      plays: plays
    };
    Object.keys(data).forEach(function (key) {
      var el = document.querySelector('[data-stat="' + key + '"]');
      if (!el) return;
      countUp(el, data[key], key === "plays" ? fmt : null);
    });
  }

  function countUp(el, target, formatter) {
    var dur = 1100, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(target * eased);
      el.textContent = formatter ? formatter(val) : String(val);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- 装饰动画 ---------- */
  function initHeroDecor() {
    var eq = document.getElementById("heroEq");
    var notes = document.getElementById("floatNotes");
    var bars = "";
    for (var i = 0; i < 26; i++) {
      var h = 40 + Math.round(Math.random() * 80);
      var delay = (Math.random() * 1.2).toFixed(2);
      bars += '<i style="height:' + h + 'px;animation-duration:' + (0.9 + Math.random() * 0.8).toFixed(2) + 's;animation-delay:-' + delay + 's"></i>';
    }
    eq.innerHTML = bars;

    var chars = ["♪", "♫", "♬", "♩", "♪", "♫", "♬", "♩"];
    var html = "";
    for (var j = 0; j < chars.length; j++) {
      var left = 6 + Math.random() * 88;
      var size = 15 + Math.random() * 18;
      var dur = 12 + Math.random() * 12;
      html += '<span style="left:' + left + "vw;font-size:" + size.toFixed(1) + "px;animation-duration:" + dur.toFixed(1) + 's;animation-delay:-' + (Math.random() * 12).toFixed(1) + 's">' + chars[j] + "</span>";
    }
    notes.innerHTML = html;
  }

  function initReveal() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    els.search.addEventListener("input", function () {
      state.query = els.search.value;
      renderGrid();
    });

    els.sort.addEventListener("change", function () {
      state.sort = els.sort.value;
      renderGrid();
    });

    els.singerChips.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-singer]");
      if (!btn) return;
      state.singer = btn.dataset.singer;
      renderChips();
      renderGrid();
    });

    els.genreChips.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-genre]");
      if (!btn) return;
      state.genre = btn.dataset.genre;
      renderChips();
      renderGrid();
    });

    els.grid.addEventListener("click", function (e) {
      var likeBtn = e.target.closest("[data-like]");
      if (likeBtn) {
        e.stopPropagation();
        toggleLike(likeBtn.dataset.like);
        return;
      }
      var card = e.target.closest(".song-card");
      if (card) openModal(card.dataset.id);
    });

    els.grid.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        var card = e.target.closest(".song-card");
        if (card) { e.preventDefault(); openModal(card.dataset.id); }
      }
    });

    els.resetBtn.addEventListener("click", function () {
      state.query = ""; state.singer = "all"; state.genre = "all"; state.sort = "latest";
      els.search.value = ""; els.sort.value = "latest";
      renderChips();
      renderGrid();
    });

    els.modalClose.addEventListener("click", closeModal);
    els.backdrop.addEventListener("click", function (e) {
      if (e.target === els.backdrop) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });

    els.navToggle.addEventListener("click", function () {
      var open = els.navLinks.classList.toggle("open");
      els.navToggle.classList.toggle("open", open);
      els.navToggle.setAttribute("aria-expanded", open);
    });
    els.navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        els.navLinks.classList.remove("open");
        els.navToggle.classList.remove("open");
        els.navToggle.setAttribute("aria-expanded", "false");
      }
    });

    window.addEventListener("scroll", function () {
      els.header.classList.toggle("scrolled", window.scrollY > 10);
    }, { passive: true });
  }

  function toggleLike(id) {
    state.likes[id] = !state.likes[id];
    saveLikes();
    var btn = document.querySelector('[data-like="' + id + '"]');
    if (btn) {
      btn.classList.toggle("on", state.likes[id]);
      btn.textContent = state.likes[id] ? "♥" : "♡";
      var card = btn.closest(".song-card");
      if (card) {
        var song = songs.filter(function (s) { return s.id === id; })[0];
        if (song) card.querySelector(".card-foot").innerHTML =
          "<span>▶ " + fmt(song.views) + "</span><span>♥ " + fmt(song.likes + (state.likes[id] ? 1 : 0)) + '</span><span class="year">' + song.year + "</span>";
      }
    }
  }

  function openModal(id) {
    var song = songs.filter(function (s) { return s.id === id; })[0];
    if (!song) return;
    els.modalBody.innerHTML = modalHTML(song);
    els.backdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    els.backdrop.hidden = true;
    document.body.style.overflow = "";
  }

  /* ---------- 启动 ---------- */
  function init() {
    if (!els.grid || !SONGS.length) return;
    renderChips();
    renderGrid();
    initStats();
    initHeroDecor();
    initReveal();
    bindEvents();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
