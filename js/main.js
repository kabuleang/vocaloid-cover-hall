(function () {
  "use strict";

  var EDITORS = window.VS_EDITORS || [];
  var DEFAULTS = { owner: "kabuleang", repo: "vocaloid-cover-hall" };
  var SETTINGS_KEY = "vsong_gh_settings_v1";
  var LIKE_KEY = "vsong_likes_v2";
  var MAX_FILE = 25 * 1024 * 1024; // 25MB
  var RAW_BASE = "https://raw.githubusercontent.com";
  var API_BASE = "https://api.github.com";
  var WORKS_PATH = "works/works.json";

  var state = {
    query: "",
    editor: "all",
    genre: "all",
    sort: "newest",
    likes: loadLikes(),
    settings: loadSettings(),
    works: [],
    editingId: null,
    modalId: null
  };

  var els = {
    grid: document.getElementById("songGrid"),
    search: document.getElementById("searchInput"),
    sort: document.getElementById("sortSelect"),
    editorChips: document.getElementById("editorChips"),
    genreChips: document.getElementById("genreChips"),
    resultCount: document.getElementById("resultCount"),
    empty: document.getElementById("emptyState"),
    noMatch: document.getElementById("noMatchState"),
    resetBtn: document.getElementById("resetBtn"),
    backdrop: document.getElementById("modalBackdrop"),
    modalBody: document.getElementById("modalBody"),
    modalClose: document.getElementById("modalClose"),
    formBackdrop: document.getElementById("formBackdrop"),
    formClose: document.getElementById("formClose"),
    formTitle: document.getElementById("formTitle"),
    workForm: document.getElementById("workForm"),
    fTitle: document.getElementById("fTitle"),
    fOriginal: document.getElementById("fOriginal"),
    fArtist: document.getElementById("fArtist"),
    fEditor: document.getElementById("fEditor"),
    editorList: document.getElementById("editorList"),
    fYear: document.getElementById("fYear"),
    fGenres: document.getElementById("fGenres"),
    fDesc: document.getElementById("fDesc"),
    fCover: document.getElementById("fCover"),
    coverText: document.getElementById("coverText"),
    fAudio: document.getElementById("fAudio"),
    audioText: document.getElementById("audioText"),
    formTip: document.getElementById("formTip"),
    formCancel: document.getElementById("formCancel"),
    formSubmit: document.getElementById("formSubmit"),
    settingsBackdrop: document.getElementById("settingsBackdrop"),
    settingsClose: document.getElementById("settingsClose"),
    settingsForm: document.getElementById("settingsForm"),
    fOwner: document.getElementById("fOwner"),
    fRepo: document.getElementById("fRepo"),
    fToken: document.getElementById("fToken"),
    settingsTest: document.getElementById("settingsTest"),
    settingsCancel: document.getElementById("settingsCancel"),
    settingsStatus: document.getElementById("settingsStatus"),
    header: document.getElementById("siteHeader"),
    navToggle: document.getElementById("navToggle"),
    navLinks: document.getElementById("navLinks"),
    navSettingsBtn: document.getElementById("navSettingsBtn"),
    toast: document.getElementById("toast")
  };

  /* ---------- 本地存储 ---------- */
  function loadLikes() {
    try { return JSON.parse(localStorage.getItem(LIKE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveLikes() {
    try { localStorage.setItem(LIKE_KEY, JSON.stringify(state.likes)); } catch (e) { /* ignore */ }
  }
  function loadSettings() {
    var s = { owner: DEFAULTS.owner, repo: DEFAULTS.repo, token: "" };
    try {
      var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      if (saved.owner) s.owner = saved.owner;
      if (saved.repo) s.repo = saved.repo;
      if (saved.token) s.token = saved.token;
    } catch (e) { /* ignore */ }
    return s;
  }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch (e) { /* ignore */ }
  }

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function fmtDuration(sec) {
    if (!sec || !isFinite(sec) || sec <= 0) return null;
    var m = Math.floor(sec / 60);
    var s = Math.round(sec % 60);
    if (s === 60) { m += 1; s = 0; }
    return m + ":" + pad2(s);
  }
  function fileExt(file) {
    var m = /\.([a-z0-9]+)$/i.exec(file.name || "");
    if (m) return m[1].toLowerCase();
    if (file.type.indexOf("wav") !== -1) return "wav";
    return "mp3";
  }
  function fileToB64(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result).split(",")[1]); };
      fr.onerror = function () { reject(fr.error); };
      fr.readAsDataURL(file);
    });
  }
  function b64EncodeUnicode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64DecodeUnicode(b64) {
    var bin = atob((b64 || "").replace(/\s+/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function genId() {
    return "w_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { els.toast.classList.remove("show"); }, 2800);
  }

  /* ---------- 编辑器 ---------- */
  function editorInfo(name) {
    var n = String(name || "").trim();
    for (var i = 0; i < EDITORS.length; i++) {
      if (EDITORS[i].name.toLowerCase() === n.toLowerCase()) {
        return { name: EDITORS[i].name, c1: EDITORS[i].c1, c2: EDITORS[i].c2 };
      }
    }
    return { name: n || "未命名编辑器", c1: "#94a3b8", c2: "#475569" };
  }

  /* ---------- 封面 ---------- */
  function coverArt(work) {
    var p = editorInfo(work.editor);
    var ch = Array.from(work.title || "♪")[0] || "♪";
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + p.c1 + '"/><stop offset="1" stop-color="' + p.c2 + '"/>' +
      '</linearGradient>' +
      '<radialGradient id="r" cx="0.5" cy="0.32" r="0.75">' +
      '<stop offset="0" stop-color="#ffffff" stop-opacity="0.38"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<rect width="640" height="640" fill="url(#g)"/>' +
      '<circle cx="480" cy="130" r="240" fill="url(#r)"/>' +
      '<circle cx="90" cy="560" r="180" fill="#ffffff" fill-opacity="0.06"/>' +
      '<path d="M0 520 C 160 430, 300 610, 640 470 L 640 640 L 0 640 Z" fill="#06121f" fill-opacity="0.22"/>' +
      '<g fill="#ffffff" fill-opacity="0.14">' +
      '<rect x="70" y="200" width="16" height="46" rx="8"/><rect x="98" y="180" width="16" height="66" rx="8"/>' +
      '<rect x="126" y="210" width="16" height="42" rx="8"/><rect x="154" y="188" width="16" height="56" rx="8"/>' +
      "</g>" +
      '<text x="320" y="392" text-anchor="middle" font-size="250" fill="#ffffff" fill-opacity="0.94" font-family="Georgia, serif">' + ch + "</text>" +
      '<text x="320" y="522" text-anchor="middle" font-size="30" fill="#ffffff" fill-opacity="0.88" font-family="sans-serif" letter-spacing="8">' + esc(p.name) + "</text>" +
      "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ---------- GitHub API ---------- */
  function apiHeaders() {
    var h = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (state.settings.token) h.Authorization = "Bearer " + state.settings.token;
    return h;
  }
  function contentsUrl(path) {
    return API_BASE + "/repos/" + encodeURIComponent(state.settings.owner) + "/" + encodeURIComponent(state.settings.repo) + "/contents/" + path;
  }
  function rawUrl(path) {
    return RAW_BASE + "/" + state.settings.owner + "/" + state.settings.repo + "/main/" + path;
  }

  async function getWorksFile() {
    var r = await fetch(contentsUrl(WORKS_PATH), { headers: apiHeaders() });
    if (r.status === 404) return { sha: null, works: [] };
    if (!r.ok) throw new Error("读取作品列表失败（" + r.status + "）");
    var j = await r.json();
    var parsed = JSON.parse(b64DecodeUnicode(j.content));
    return { sha: j.sha, works: Array.isArray(parsed) ? parsed : [] };
  }

  async function putFile(path, contentB64, sha) {
    var body = { message: "site: update " + path, content: contentB64 };
    if (sha) body.sha = sha;
    var r = await fetch(contentsUrl(path), {
      method: "PUT",
      headers: apiHeaders(),
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      var msg = "";
      try { msg = (await r.json()).message || ""; } catch (e) { /* ignore */ }
      throw new Error("保存 " + path.split("/").pop() + " 失败（" + r.status + (msg ? " " + msg : "") + "）");
    }
    return r.json();
  }

  async function removeFileIfAny(path) {
    if (!path) return;
    try {
      var g = await fetch(contentsUrl(path), { headers: apiHeaders() });
      if (!g.ok) return;
      var j = await g.json();
      var r = await fetch(contentsUrl(path), {
        method: "DELETE",
        headers: apiHeaders(),
        body: JSON.stringify({ message: "site: delete " + path, sha: j.sha })
      });
      if (!r.ok && r.status !== 404) throw new Error("删除 " + path.split("/").pop() + " 失败");
    } catch (e) { /* 尽力而为 */ }
  }

  async function loadWorks() {
    try {
      var f = await getWorksFile();
      state.works = f.works;
    } catch (e) {
      try {
        var url = RAW_BASE + "/" + state.settings.owner + "/" + state.settings.repo + "/main/" + WORKS_PATH + "?t=" + Date.now();
        var r = await fetch(url);
        if (!r.ok) throw new Error("raw " + r.status);
        var list = JSON.parse(await r.text());
        state.works = Array.isArray(list) ? list : [];
      } catch (e2) {
        state.works = [];
      }
    }
  }

  function readDuration(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = function () {
        var d = fmtDuration(a.duration);
        URL.revokeObjectURL(url);
        resolve(d);
      };
      a.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      a.src = url;
    });
  }

  /* ---------- 上传 / 编辑 / 删除管线 ---------- */
  async function saveWork(data, coverFile, audioFile) {
    var f = await getWorksFile();
    var list = f.works.slice();
    var idx = -1;
    for (var i = 0; i < list.length; i++) if (list[i].id === data.id) { idx = i; break; }
    var old = idx >= 0 ? list[idx] : null;

    if (audioFile) {
      var newAudio = "works/" + data.id + "/audio-" + Date.now() + "." + fileExt(audioFile);
      await putFile(newAudio, await fileToB64(audioFile));
      if (old && old.audio && old.audio !== newAudio) removeFileIfAny(old.audio);
      data.audio = newAudio;
    } else if (!old) {
      delete data.audio;
    }

    if (coverFile) {
      var newCover = "works/" + data.id + "/cover-" + Date.now() + "." + fileExt(coverFile);
      await putFile(newCover, await fileToB64(coverFile));
      if (old && old.cover && old.cover !== newCover) removeFileIfAny(old.cover);
      data.cover = newCover;
    } else if (!old) {
      delete data.cover;
    }

    if (idx >= 0) list[idx] = data;
    else list.push(data);

    await putFile(WORKS_PATH, b64EncodeUnicode(JSON.stringify(list)), f.sha);
    return data;
  }

  async function deleteWorkRecord(id) {
    var f = await getWorksFile();
    var target = null;
    for (var i = 0; i < f.works.length; i++) if (f.works[i].id === id) { target = f.works[i]; break; }
    var list = f.works.filter(function (w) { return w.id !== id; });
    if (target) {
      removeFileIfAny(target.cover);
      removeFileIfAny(target.audio);
    }
    await putFile(WORKS_PATH, b64EncodeUnicode(JSON.stringify(list)), f.sha);
  }

  /* ---------- 渲染 ---------- */
  function decorate(work) {
    var e = editorInfo(work.editor);
    work._editor = e;
    work._coverUrl = work.cover ? rawUrl(work.cover) : coverArt(work);
    work._audioUrl = work.audio ? rawUrl(work.audio) : null;
    return work;
  }

  function cardHTML(w) {
    var liked = !!state.likes[w.id];
    var tags = (w.genre || []).map(function (g) { return '<span class="tag">' + esc(g) + "</span>"; }).join("");
    return (
      '<article class="song-card" data-id="' + esc(w.id) + '" tabindex="0" role="button" aria-label="查看作品 ' + esc(w.title) + ' 详情">' +
        '<div class="card-cover">' +
          '<img src="' + w._coverUrl + '" alt="' + esc(w.title) + ' 封面" loading="lazy" />' +
          (w.duration ? '<span class="card-duration">' + esc(w.duration) + "</span>" : "") +
          '<button class="card-like' + (liked ? " on" : "") + '" data-like="' + esc(w.id) + '" aria-label="收藏 ' + esc(w.title) + '">' + (liked ? "♥" : "♡") + "</button>" +
          '<div class="card-hover"><button class="card-play">▶ 查看详情</button></div>' +
        "</div>" +
        '<div class="card-info">' +
          '<h3 class="card-title">' + esc(w.title) + "</h3>" +
          '<p class="card-meta"><span class="card-editor" style="background:linear-gradient(135deg,' + w._editor.c1 + "," + w._editor.c2 + ')">' + esc(w._editor.name) + "</span>" +
          (w.original ? '<span class="card-original">原曲：' + esc(w.originalArtist || "") + "《" + esc(w.original) + "》</span>" : "") + "</p>" +
          '<div class="card-tags">' + tags + "</div>" +
          '<div class="card-foot">' +
            (w.duration ? "<span>时长 " + esc(w.duration) + "</span>" : "<span>暂无音频</span>") +
            '<span class="year">' + (w.year || "—") + "</span>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function getFiltered() {
    var q = state.query.trim().toLowerCase();
    var list = state.works.filter(function (w) {
      if (state.editor !== "all" && (w.editor || "").toLowerCase() !== state.editor) return false;
      if (state.genre !== "all" && (w.genre || []).indexOf(state.genre) === -1) return false;
      if (q) {
        var hay = ((w.title || "") + " " + (w.original || "") + " " + (w.originalArtist || "") + " " + (w.editor || "") + " " + (w.genre || []).join(" ")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      if (state.sort === "title") return String(a.title || "").localeCompare(String(b.title || ""), "zh-Hans-CN");
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    return list;
  }

  function renderGrid() {
    var list = getFiltered();
    els.grid.innerHTML = list.map(cardHTML).join("");
    var hasWorks = state.works.length > 0;
    var hasMatch = list.length > 0;
    els.empty.hidden = hasWorks;
    els.noMatch.hidden = !hasWorks || hasMatch;
    els.resultCount.textContent = "共 " + list.length + " 首作品";
  }

  function renderChips() {
    var editorKeys = {};
    var editorChips = [{ key: "all", label: "全部编辑器" }];
    EDITORS.forEach(function (e) {
      editorKeys[e.name.toLowerCase()] = true;
      editorChips.push({ key: e.name.toLowerCase(), label: e.name });
    });
    state.works.forEach(function (w) {
      var name = String(w.editor || "").trim();
      if (name && !editorKeys[name.toLowerCase()]) {
        editorKeys[name.toLowerCase()] = true;
        editorChips.push({ key: name.toLowerCase(), label: name });
      }
    });

    var genreMap = {};
    state.works.forEach(function (w) { (w.genre || []).forEach(function (g) { genreMap[g] = true; }); });
    var genreChips = [{ key: "all", label: "全部曲风" }].concat(Object.keys(genreMap).map(function (g) { return { key: g, label: g }; }));

    els.editorChips.innerHTML = editorChips.map(function (c) {
      return '<button class="chip' + (state.editor === c.key ? " active" : "") + '" data-editor="' + esc(c.key) + '">' + esc(c.label) + "</button>";
    }).join("");
    els.genreChips.innerHTML = genreChips.map(function (c) {
      return '<button class="chip' + (state.genre === c.key ? " active" : "") + '" data-genre="' + esc(c.key) + '">' + esc(c.label) + "</button>";
    }).join("");
  }

  function renderStats() {
    var editorSet = {}, genreSet = {};
    state.works.forEach(function (w) {
      if (w.editor) editorSet[w.editor.toLowerCase()] = true;
      (w.genre || []).forEach(function (g) { genreSet[g] = true; });
    });
    var favs = 0;
    Object.keys(state.likes).forEach(function (id) {
      if (state.likes[id] && state.works.some(function (w) { return w.id === id; })) favs++;
    });
    countUp(document.querySelector('[data-stat="songs"]'), state.works.length, null);
    countUp(document.querySelector('[data-stat="editors"]'), Object.keys(editorSet).length, null);
    countUp(document.querySelector('[data-stat="genres"]'), Object.keys(genreSet).length, null);
    countUp(document.querySelector('[data-stat="favs"]'), favs, null);
  }

  function countUp(el, target, formatter) {
    if (!el) return;
    var dur = 900, start = null;
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

  /* ---------- 详情弹窗 ---------- */
  function modalHTML(w) {
    var tags = (w.genre || []).map(function (g) { return '<span class="tag">' + esc(g) + "</span>"; }).join("");
    var audio = w._audioUrl
      ? '<audio class="modal-audio" controls preload="metadata" src="' + esc(w._audioUrl) + '"></audio>'
      : '<p class="no-audio">暂无音频，可点击“编辑”上传 MP3/WAV。</p>';
    var hasToken = !!state.settings.token;
    var actions = hasToken
      ? '<div class="modal-actions"><button class="btn btn-primary btn-sm" data-act="edit">✎ 编辑作品</button><button class="btn btn-danger btn-sm" data-act="delete">删除作品</button></div>'
      : '<p class="modal-tip">浏览模式：配置 GitHub 令牌后可编辑或删除作品。</p>';
    return (
      '<div class="modal-cover">' +
        '<img src="' + w._coverUrl + '" alt="' + esc(w.title) + ' 封面" />' +
        (w.duration ? '<span class="modal-duration">' + esc(w.duration) + "</span>" : "") +
      "</div>" +
      '<div class="modal-info">' +
        '<h3 id="modalTitle">' + esc(w.title) + "</h3>" +
        (w.original
          ? '<p class="modal-original">原曲：' + esc(w.originalArtist || "") + "《" + esc(w.original) + "》</p>"
          : '<p class="modal-original">原创 / 无原曲信息</p>') +
        '<div class="card-tags" style="margin-top:12px">' +
          '<span class="card-editor" style="background:linear-gradient(135deg,' + w._editor.c1 + "," + w._editor.c2 + ')">' + esc(w._editor.name) + "</span>" + tags +
        "</div>" +
        (w.desc ? '<p class="modal-desc">' + esc(w.desc) + "</p>" : "") +
        audio +
        '<div class="modal-facts">' +
          "<span>年份：<b>" + (w.year || "—") + "</b></span>" +
          "<span>时长：<b>" + (w.duration || "—") + "</b></span>" +
          "<span>更新：<b>" + new Date(w.updatedAt || w.createdAt || Date.now()).toLocaleDateString("zh-CN") + "</b></span>" +
        "</div>" +
        actions +
        '<p class="modal-tip">* 音频与封面公开存储在 GitHub 仓库中，任何访客均可播放。</p>' +
      "</div>"
    );
  }

  function openModal(id) {
    var w = byId(id);
    if (!w) return;
    state.modalId = id;
    els.modalBody.innerHTML = modalHTML(decorate(w));
    els.backdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    state.modalId = null;
    els.backdrop.hidden = true;
    document.body.style.overflow = "";
  }
  function byId(id) {
    for (var i = 0; i < state.works.length; i++) if (state.works[i].id === id) return state.works[i];
    return null;
  }

  /* ---------- 上传 / 编辑表单 ---------- */
  function openForm(id) {
    state.editingId = id || null;
    var w = id ? byId(id) : null;
    els.formTitle.textContent = w ? "编辑作品" : "上传作品";
    els.formSubmit.textContent = w ? "保存修改" : "保存作品";
    els.fTitle.value = w ? w.title : "";
    els.fOriginal.value = w ? w.original || "" : "";
    els.fArtist.value = w ? w.originalArtist || "" : "";
    els.fEditor.value = w ? w.editor || "" : "";
    els.fYear.value = w && w.year ? w.year : new Date().getFullYear();
    els.fGenres.value = w ? (w.genre || []).join(", ") : "";
    els.fDesc.value = w ? w.desc || "" : "";
    els.fCover.value = "";
    els.fAudio.value = "";
    els.coverText.textContent = w && w.cover ? "当前：已上传封面（可替换）" : "上传封面图片（可选）";
    els.audioText.textContent = w && w.audio ? "当前：已上传音频（可替换）" : "上传音频（MP3 / WAV）";
    els.coverText.parentElement.classList.remove("has-file");
    els.audioText.parentElement.classList.remove("has-file");
    els.formTip.textContent = "";
    els.formBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(function () { els.fTitle.focus(); }, 50);
  }
  function closeForm() {
    state.editingId = null;
    els.formBackdrop.hidden = true;
    document.body.style.overflow = "";
  }
  function setTip(msg) {
    els.formTip.textContent = msg;
  }
  function formData() {
    var year = parseInt(els.fYear.value, 10);
    if (isNaN(year) || year < 2000 || year > 2100) year = new Date().getFullYear();
    return {
      title: els.fTitle.value.trim(),
      original: els.fOriginal.value.trim(),
      originalArtist: els.fArtist.value.trim(),
      editor: els.fEditor.value.trim(),
      genre: els.fGenres.value.split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean),
      year: year,
      desc: els.fDesc.value.trim()
    };
  }
  function validateFiles(coverFile, audioFile) {
    if (coverFile && coverFile.type && coverFile.type.indexOf("image") !== 0) return "封面请选择图片文件";
    if (audioFile && audioFile.type && audioFile.type.indexOf("audio") !== 0) return "音频请选择 MP3 / WAV 文件";
    if (coverFile && coverFile.size > MAX_FILE) return "封面文件超过 25MB 上限";
    if (audioFile && audioFile.size > MAX_FILE) return "音频文件超过 25MB 上限";
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    var title = els.fTitle.value.trim();
    if (!title) { setTip("请填写作品名"); els.fTitle.focus(); return; }
    if (!els.fEditor.value.trim()) { setTip("请填写或选择编辑器"); els.fEditor.focus(); return; }
    if (!state.settings.token) {
      setTip("请先到右上角“设置”中填写 GitHub 访问令牌");
      return;
    }
    var coverFile = els.fCover.files[0] || null;
    var audioFile = els.fAudio.files[0] || null;
    var err = validateFiles(coverFile, audioFile);
    if (err) { setTip(err); return; }

    els.formSubmit.disabled = true;
    setTip("正在上传，请稍候…");
    try {
      var now = Date.now();
      var existing = state.editingId ? byId(state.editingId) : null;
      var data = formData();
      data.id = existing ? existing.id : genId();
      data.createdAt = existing ? existing.createdAt : now;
      data.updatedAt = now;
      if (existing) {
        data.cover = existing.cover;
        data.audio = existing.audio;
        data.duration = existing.duration;
      }
      if (audioFile) data.duration = await readDuration(audioFile);
      var saved = await saveWork(data, coverFile, audioFile);
      toast("作品已保存到 GitHub 仓库");
      closeForm();
      await refresh();
      openModal(saved.id);
    } catch (ex) {
      setTip(ex.message || "上传失败，请重试");
    } finally {
      els.formSubmit.disabled = false;
    }
  }

  async function onDelete(id) {
    var w = byId(id);
    if (!w) return;
    if (!confirm('确定要删除《' + w.title + '》吗？删除后无法恢复。')) return;
    try {
      await deleteWorkRecord(id);
      toast("作品已删除");
      closeModal();
      await refresh();
    } catch (ex) {
      toast("删除失败：" + (ex.message || "未知错误"));
    }
  }

  /* ---------- 设置 ---------- */
  function openSettings() {
    els.fOwner.value = state.settings.owner;
    els.fRepo.value = state.settings.repo;
    els.fToken.value = state.settings.token;
    setSettingsStatus("尚未测试连接", "");
    els.settingsBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeSettings() {
    els.settingsBackdrop.hidden = true;
    document.body.style.overflow = "";
  }
  function setSettingsStatus(msg, cls) {
    els.settingsStatus.textContent = msg;
    els.settingsStatus.className = "settings-status" + (cls ? " " + cls : "");
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    els.search.addEventListener("input", function () { state.query = els.search.value; renderGrid(); });
    els.sort.addEventListener("change", function () { state.sort = els.sort.value; renderGrid(); });

    els.editorChips.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-editor]");
      if (!btn) return;
      state.editor = btn.dataset.editor;
      renderChips(); renderGrid();
    });
    els.genreChips.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-genre]");
      if (!btn) return;
      state.genre = btn.dataset.genre;
      renderChips(); renderGrid();
    });

    document.addEventListener("click", function (e) {
      var up = e.target.closest(".upload-btn");
      if (up) { openForm(null); return; }
      var like = e.target.closest("[data-like]");
      if (like) { toggleLike(like.dataset.like); return; }
      var card = e.target.closest(".song-card");
      if (card) openModal(card.dataset.id);
    });

    els.modalBody.addEventListener("click", function (e) {
      var act = e.target.closest("[data-act]");
      if (!act) return;
      var id = state.modalId;
      if (!id) return;
      if (act.dataset.act === "edit") openForm(id);
      if (act.dataset.act === "delete") onDelete(id);
    });

    els.grid.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        var card = e.target.closest(".song-card");
        if (card) { e.preventDefault(); openModal(card.dataset.id); }
      }
    });

    els.resetBtn.addEventListener("click", function () {
      state.query = ""; state.editor = "all"; state.genre = "all"; state.sort = "newest";
      els.search.value = ""; els.sort.value = "newest";
      renderChips(); renderGrid();
    });

    els.modalClose.addEventListener("click", closeModal);
    els.backdrop.addEventListener("click", function (e) { if (e.target === els.backdrop) closeModal(); });
    els.formClose.addEventListener("click", closeForm);
    els.formCancel.addEventListener("click", closeForm);
    els.formBackdrop.addEventListener("click", function (e) { if (e.target === els.formBackdrop) closeForm(); });
    els.settingsClose.addEventListener("click", closeSettings);
    els.settingsCancel.addEventListener("click", closeSettings);
    els.settingsBackdrop.addEventListener("click", function (e) { if (e.target === els.settingsBackdrop) closeSettings(); });
    els.navSettingsBtn.addEventListener("click", openSettings);

    els.workForm.addEventListener("submit", onSubmit);
    els.settingsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var owner = els.fOwner.value.trim();
      var repo = els.fRepo.value.trim();
      if (!owner || !repo) { setSettingsStatus("请填写 owner 与 repo", "err"); return; }
      state.settings.owner = owner;
      state.settings.repo = repo;
      state.settings.token = els.fToken.value.trim();
      saveSettings();
      setSettingsStatus("已保存（令牌仅存本机浏览器）", "ok");
      toast("设置已保存");
      closeSettings();
      refresh();
    });
    els.settingsTest.addEventListener("click", async function () {
      var owner = els.fOwner.value.trim();
      var repo = els.fRepo.value.trim();
      var token = els.fToken.value.trim();
      if (!owner || !repo) { setSettingsStatus("请先填写 owner 与 repo", "err"); return; }
      setSettingsStatus("测试中…", "");
      try {
        var h = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
        if (token) h.Authorization = "Bearer " + token;
        var r = await fetch(API_BASE + "/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo), { headers: h });
        if (!r.ok) throw new Error("HTTP " + r.status);
        var login = "";
        if (token) {
          var u = await fetch(API_BASE + "/user", { headers: h });
          if (u.ok) login = "（登录：" + (await u.json()).login + "）";
        }
        setSettingsStatus("连接成功" + login + (token ? "，可尝试写入" : "；未填令牌，只能浏览"), token ? "ok" : "");
      } catch (ex) {
        setSettingsStatus("连接失败：" + ex.message, "err");
      }
    });

    els.fCover.addEventListener("change", function () {
      var f = els.fCover.files[0];
      els.coverText.textContent = f ? "已选择：" + f.name : "上传封面图片（可选）";
      els.coverText.parentElement.classList.toggle("has-file", !!f);
    });
    els.fAudio.addEventListener("change", function () {
      var f = els.fAudio.files[0];
      els.audioText.textContent = f ? "已选择：" + f.name + (f.size > MAX_FILE ? "（超过 25MB！）" : "") : "上传音频（MP3 / WAV）";
      els.audioText.parentElement.classList.toggle("has-file", !!f);
    });

    els.navToggle.addEventListener("click", function () {
      var open = els.navLinks.classList.toggle("open");
      els.navToggle.classList.toggle("open", open);
      els.navToggle.setAttribute("aria-expanded", open);
    });
    els.navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A" || e.target.tagName === "BUTTON") {
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
    }
    renderStats();
  }

  /* ---------- 装饰动画 ---------- */
  function initHeroDecor() {
    var eq = document.getElementById("heroEq");
    var notes = document.getElementById("floatNotes");
    var bars = "";
    for (var i = 0; i < 26; i++) {
      var h = 40 + Math.round(Math.random() * 80);
      bars += '<i style="height:' + h + "px;animation-duration:" + (0.9 + Math.random() * 0.8).toFixed(2) + "s;animation-delay:-" + (Math.random() * 1.2).toFixed(2) + 's"></i>';
    }
    eq.innerHTML = bars;

    var chars = ["♪", "♫", "♬", "♩", "♪", "♫", "♬", "♩"];
    var html = "";
    for (var j = 0; j < chars.length; j++) {
      var left = 6 + Math.random() * 88;
      var size = 15 + Math.random() * 18;
      var dur = 12 + Math.random() * 12;
      html += '<span style="left:' + left + "vw;font-size:" + size.toFixed(1) + "px;animation-duration:" + dur.toFixed(1) + "s;animation-delay:-" + (Math.random() * 12).toFixed(1) + 's">' + chars[j] + "</span>";
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

  /* ---------- 启动 ---------- */
  function buildEditorList() {
    els.editorList.innerHTML = EDITORS.map(function (e) { return '<option value="' + esc(e.name) + '"></option>'; }).join("");
  }

  async function refresh() {
    await loadWorks();
    state.works.forEach(decorate);
    renderChips();
    renderGrid();
    renderStats();
  }

  function init() {
    if (!els.grid) return;
    buildEditorList();
    bindEvents();
    initHeroDecor();
    initReveal();
    refresh();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
