const SITEKEY = "0x4AAAAAAFZfRhna4mHDGTkQ";

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>guestbook</title>
<style>
  html, body { margin: 0; height: 100%; background: #000; overflow: hidden; font-family: monospace; }
  canvas { display: block; cursor: grab; }
  #form { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 10; }
  #msg { width: 60vw; max-width: 420px; padding: 8px; background: #111; color: #fff; border: 1px solid #444; font: inherit; }
  #send { padding: 8px 14px; background: #fff; color: #000; border: none; cursor: pointer; }
  #hint { position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%); color: #555; font-size: 12px; pointer-events: none; }
  #turnstile { position: fixed; bottom: 26px; left: 50%; transform: translateX(-50%); z-index: 10; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<form id="form">
  <input id="msg" placeholder="leave a message" maxlength="500" autocomplete="off">
  <button id="send" type="submit">post</button>
</form>
<div id="hint">drag to pan &middot; scroll to zoom</div>
<div id="turnstile"></div>
<script>
var c = document.getElementById('c');
var ctx = c.getContext('2d');
var W = 0, H = 0;
function resize() { W = c.width = innerWidth; H = c.height = innerHeight; draw(); }
addEventListener('resize', resize);

var zoom = 1, ox = 0, oy = 0;
var entries = [];

function toScreen(x, y) { return [(x - ox) * zoom + W / 2, (y - oy) * zoom + H / 2]; }

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  var g;
  for (g = Math.floor((ox - W / (2 * zoom)) / 100) * 100; g <= ox + W / (2 * zoom); g += 100) {
    var sx = toScreen(g, 0)[0];
    ctx.moveTo(sx, 0); ctx.lineTo(sx, H);
  }
  for (g = Math.floor((oy - H / (2 * zoom)) / 100) * 100; g <= oy + H / (2 * zoom); g += 100) {
    var sy = toScreen(0, g)[1];
    ctx.moveTo(0, sy); ctx.lineTo(W, sy);
  }
  ctx.stroke();
  ctx.textBaseline = 'middle';
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    var p = toScreen(e.x, e.y);
    if (p[0] < -600 || p[0] > W + 600 || p[1] < -600 || p[1] > H + 600) continue;
    ctx.fillStyle = e.color;
    ctx.font = Math.max(12, 16 * zoom) + 'px monospace';
    ctx.fillText(e.message, p[0], p[1]);
  }
}

async function load() {
  var r = await fetch('/api/entries');
  entries = await r.json();
  draw();
}

var tsWidgetId = null, tsToken = '';
function initTs() {
  tsWidgetId = window.turnstile.render('#turnstile', {
    sitekey: 'SITEKEY_PLACEHOLDER',
    action: 'guestbook',
    callback: function (t) { tsToken = t; }
  });
}

document.getElementById('form').addEventListener('submit', async function (ev) {
  ev.preventDefault();
  var input = document.getElementById('msg');
  var message = input.value.trim();
  if (!message) return;
  if (!tsToken) { input.value = 'tap the checkbox first'; input.select(); return; }
  var r = await fetch('/api/entries', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: message, token: tsToken })
  });
  if (window.turnstile && tsWidgetId != null) { window.turnstile.reset(tsWidgetId); }
  tsToken = '';
  if (r.ok) {
    var e = await r.json();
    entries.push(e);
    draw();
    input.value = '';
  } else {
    input.value = 'try again';
    input.select();
  }
});

var dragging = false, lastX = 0, lastY = 0;
c.addEventListener('mousedown', function (e) { dragging = true; lastX = e.clientX; lastY = e.clientY; c.style.cursor = 'grabbing'; });
addEventListener('mouseup', function () { dragging = false; c.style.cursor = 'grab'; });
addEventListener('mousemove', function (e) {
  if (!dragging) return;
  ox -= (e.clientX - lastX) / zoom;
  oy -= (e.clientY - lastY) / zoom;
  lastX = e.clientX; lastY = e.clientY;
  draw();
});
c.addEventListener('wheel', function (e) {
  e.preventDefault();
  var factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  var wx = ox + (e.clientX - W / 2) / zoom;
  var wy = oy + (e.clientY - H / 2) / zoom;
  zoom = zoom * factor;
  if (zoom < 0.1) zoom = 0.1;
  if (zoom > 8) zoom = 8;
  ox = wx - (e.clientX - W / 2) / zoom;
  oy = wy - (e.clientY - H / 2) / zoom;
  draw();
}, { passive: false });

resize();
load();
</script>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=initTs&render=explicit" async defer></script>
</body>
</html>`;

const AO3_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Archive of Our Own (beta)</title>
<style>
  body { margin: 0; background: #fff; color: #2a2a2a; font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.45; }
  a { color: #900; text-decoration: none; }
  a:hover { color: #c00; }
  a:visited { color: #900; }
  #hd { background: #900; color: #fff; }
  .hd-inner { max-width: 960px; margin: 0 auto; padding: 14px 16px 10px; position: relative; }
  .logo { font-family: Georgia, 'Times New Roman', serif; font-size: 32px; letter-spacing: 1px; }
  .logo a { color: #fff; }
  .logo .beta { font-family: Verdana, sans-serif; font-size: 11px; border: 1px solid #fff; padding: 0 4px; vertical-align: super; margin-left: 6px; }
  .usernav { position: absolute; top: 12px; right: 16px; font-size: 12px; }
  .usernav a { color: #fff; margin-left: 12px; }
  .tagline { margin: 6px 0 0; font-size: 11px; font-style: italic; color: #f2d9d9; }
  #menu { background: #800000; border-top: 1px solid #600; border-bottom: 1px solid #600; }
  #menu .in { max-width: 960px; margin: 0 auto; }
  ul.m { list-style: none; margin: 0; padding: 0; display: flex; }
  ul.m > li { position: relative; border-right: 1px solid #600; }
  ul.m > li > a { display: block; padding: 9px 18px; color: #fff; }
  ul.m > li > a:hover { background: #900; color: #fff; }
  .sub { display: none; position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #900; border-top: none; min-width: 230px; z-index: 20; padding: 4px 0; box-shadow: 2px 2px 6px rgba(0,0,0,.25); }
  ul.m li:hover .sub { display: block; }
  .sub li { list-style: none; }
  .sub li a { display: block; padding: 6px 16px; color: #900; }
  .sub li a:hover { background: #f4e4e4; color: #c00; text-decoration: none; }
  #searchbar { background: #f7eeee; border-bottom: 1px solid #e2cccc; padding: 12px 16px; }
  .sb-inner { max-width: 960px; margin: 0 auto; }
  .sb-inner label { display: block; font-weight: bold; color: #900; margin-bottom: 5px; }
  .sb-row { display: flex; gap: 6px; max-width: 620px; }
  .sb-row input[type=text] { flex: 1; border: 1px solid #bbb; padding: 7px 9px; font-size: 13px; }
  .sb-row button { background: #900; color: #fff; border: 1px solid #600; padding: 7px 18px; cursor: pointer; }
  .sb-row button:hover { background: #c00; }
  #app { max-width: 960px; margin: 0 auto; padding: 16px; min-height: 60vh; }
  h2.mh { font-size: 18px; color: #900; border-bottom: 1px solid #900; padding-bottom: 3px; margin: 0 0 12px; }
  .cols { display: flex; gap: 20px; }
  .col-main { flex: 1; min-width: 0; }
  .col-side { width: 250px; flex-shrink: 0; }
  .box { border: 1px solid #ddd; padding: 10px 14px; margin-bottom: 10px; background: #fcfcfc; }
  .work { border-left: 4px solid #900; }
  .work h3 { margin: 0; font-size: 15px; }
  .work .author { font-size: 12px; margin: 2px 0; }
  .work .fandom { font-size: 12px; color: #555; }
  .work .tags { font-size: 12px; margin: 4px 0; }
  .work .tags .rating { font-weight: bold; margin-right: 8px; }
  .work .summary { font-size: 12px; color: #444; margin: 4px 0; }
  .work .stats { font-size: 11px; color: #777; border-top: 1px dotted #ccc; margin-top: 6px; padding-top: 4px; }
  .tag { background: #f4e4e4; border: 1px solid #e0c0c0; color: #900; padding: 0 6px; border-radius: 3px; font-size: 12px; margin: 0 3px 3px 0; display: inline-block; }
  .tag a { color: #900; }
  label { font-weight: bold; display: block; margin: 10px 0 3px; }
  input[type=text], input[type=password], textarea, select {
    border: 1px solid #bbb; padding: 7px 9px; font-size: 13px; font-family: inherit; width: 100%; box-sizing: border-box;
  }
  textarea { resize: vertical; }
  button, input[type=submit] { background: #900; color: #fff; border: 1px solid #600; padding: 7px 16px; cursor: pointer; font-size: 13px; }
  button:hover, input[type=submit]:hover { background: #c00; }
  button.secondary { background: #fff; color: #900; }
  .err { color: #c00; font-weight: bold; }
  .statline { border: 1px solid #ddd; padding: 8px 12px; background: #f9f9f9; }
  .statline b { color: #900; }
  .comment { border: 1px solid #eee; border-left: 3px solid #ccc; margin: 8px 0; padding: 8px 10px; background: #fbfbfb; }
  .comment .meta { font-size: 11px; color: #777; }
  .comment.nested { margin-left: 24px; }
  .crumb { font-size: 12px; color: #777; margin-bottom: 12px; }
  .pager { margin-top: 14px; }
  .pager a { margin-right: 12px; }
  #ao3footer { background: #800000; color: #fff; margin-top: 24px; }
  #ao3footer .in { max-width: 960px; margin: 0 auto; padding: 12px 16px; font-size: 12px; display: flex; flex-wrap: wrap; gap: 4px 14px; }
  #ao3footer a { color: #fff; }
  #ao3footer .copy { width: 100%; font-size: 11px; color: #f2d9d9; margin-top: 6px; }
</style>
</head>
<body>
<div id="hd"></div>
<div id="menu"></div>
<div id="searchbar"></div>
<div id="app">loading...</div>
<div id="ao3footer"></div>
<script>
var S = { me: null, q: '' };
var RATINGS = ['Not Rated','General Audiences','Teen And Up Audiences','Mature','Explicit'];
var WARNINGS = ['Choose Not To Use Archive Warnings','No Archive Warnings Apply','Graphic Depictions Of Violence','Major Character Death','Rape/Non-Con','Underage'];
var CATEGORIES = ['F/F','F/M','Gen','M/M','Multi','Other'];

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
async function api(method, path, body) {
  var opt = { method: method, headers: {} };
  if (body) { opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(body); }
  var r = await fetch('/ao3/api' + path, opt);
  var data = {};
  try { data = await r.json(); } catch (e) {}
  if (!r.ok) throw new Error(data.error || ('error ' + r.status));
  return data;
}
function fmtDate(s) { if (!s) return ''; var d = new Date(s.replace(' ', 'T') + 'Z'); if (isNaN(d)) return s; return d.toISOString().slice(0, 16).replace('T', ' '); }

function renderShell() {
  document.getElementById('menu').innerHTML =
    '<div class="in"><ul class="m">' +
    '<li><a href="#/works">Fandoms</a><ul class="sub">' +
    '<li><a href="#/fandoms">All Fandoms</a></li>' +
    '<li><a href="#/works?f=Anime%20%26%20Manga">Anime &amp; Manga</a></li>' +
    '<li><a href="#/works?f=Books%20%26%20Literature">Books &amp; Literature</a></li>' +
    '<li><a href="#/works?f=Cartoons%20%26%20Comics%20%26%20Graphic%20Novels">Cartoons &amp; Comics &amp; Graphic Novels</a></li>' +
    '<li><a href="#/works?f=Celebrities%20%26%20Real%20People">Celebrities &amp; Real People</a></li>' +
    '<li><a href="#/works?f=Movies">Movies</a></li>' +
    '<li><a href="#/works?f=Music%20%26%20Bands">Music &amp; Bands</a></li>' +
    '<li><a href="#/works?f=Other%20Media">Other Media</a></li>' +
    '<li><a href="#/works?f=Theater">Theater</a></li>' +
    '<li><a href="#/works?f=TV%20Shows">TV Shows</a></li>' +
    '<li><a href="#/works?f=Video%20Games">Video Games</a></li>' +
    '<li><a href="#/works?f=Uncategorized%20Fandoms">Uncategorized Fandoms</a></li>' +
    '</ul></li>' +
    '<li><a href="#/works">Browse</a><ul class="sub">' +
    '<li><a href="#/works">Works</a></li>' +
    '<li><a href="#/bookmarks">Bookmarks</a></li>' +
    '<li><a href="#/tags">Tags</a></li>' +
    '</ul></li>' +
    '<li><a href="#/works">Search</a><ul class="sub">' +
    '<li><a href="#/works">Works</a></li>' +
    '<li><a href="#/tags">Tags</a></li>' +
    '</ul></li>' +
    '<li><a href="#/">About</a><ul class="sub">' +
    '<li><a href="#/about">About Us</a></li>' +
    '<li><a href="#/">News</a></li>' +
    '</ul></li>' +
    '</ul></div>';
  document.getElementById('ao3footer').innerHTML =
    '<div class="in">' +
    '<a href="https://eons.gay/ao3#/">Home</a><a href="#/about">About Us</a><a href="#/tos">Terms of Service</a><a href="#/contact">Contact Us</a>' +
    '<div class="copy">not affiliated with the OTW or AO3. this is a section of eons.gay.</div>' +
    '</div>';
}

function renderHeader() {
  var u = S.me;
  var unav = u
    ? '<span style="color:#fff">logged in as <b>' + esc(u.username) + '</b></span> <a href="#/new">Post</a> <a href="#/bookmarks">Bookmarks</a> <a href="#" id="logout">Log Out</a>'
    : '<a href="#/login">Log In</a> <a href="#/register">Sign Up</a>';
  document.getElementById('hd').innerHTML =
    '<div class="hd-inner">' +
    '<div class="logo"><a href="#/">Archive of Our Own<span class="beta">beta</span></a></div>' +
    '<div class="usernav">' + unav + '</div>' +
    '<div class="tagline">a fan-created, fan-run archive for transformative fanworks &mdash; mirror on eons.gay while the real one is down</div>' +
    '</div>';
  document.getElementById('searchbar').innerHTML =
    '<div class="sb-inner"><label for="sbq">Search Works</label>' +
    '<div class="sb-row"><input type="text" id="sbq" placeholder="Any Field" value="' + esc(S.q) + '">' +
    '<button id="sbb">Search</button></div></div>';
  var lg = document.getElementById('logout');
  if (lg) lg.addEventListener('click', function (e) { e.preventDefault(); doLogout(); });
  document.getElementById('sbb').addEventListener('click', function () {
    S.q = document.getElementById('sbq').value.trim();
    location.hash = '#/works';
  });
  document.getElementById('sbq').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { S.q = this.value.trim(); location.hash = '#/works'; }
  });
}

function tagsHtml(list) {
  if (!list) return '';
  var parts = list.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
  if (!parts.length) return '';
  var out = '';
  for (var i = 0; i < parts.length; i++) out += '<span class="tag"><a href="#/works?q=' + encodeURIComponent(parts[i]) + '">' + esc(parts[i]) + '</a></span>';
  return out;
}

function workStatsHtml(w) {
  return 'Language: English &nbsp; Words: ' + (w.words || 0) + ' &nbsp; Comments: ' + (w.comments_count || 0) +
    ' &nbsp; Kudos: ' + (w.kudos_count || 0) + ' &nbsp; Bookmarks: ' + (w.bookmarks_count || 0) + ' &nbsp; Hits: ' + (w.hits || 0);
}

async function viewHome(app) {
  var data = await api('GET', '/works?sort=date&limit=5');
  var works = data.works || [];
  var h = '<div class="cols"><div class="col-main">';
  h += '<h2 class="mh">News</h2>';
  h += '<div class="box"><b>AO3 is down right now, so this exists</b><div style="font-size:11px;color:#777">the real archive returned 418. here is a working mirror on eons.gay.</div></div>';
  h += '<h2 class="mh">Recently Posted</h2>';
  if (!works.length) h += '<p>no works yet. <a href="#/new">post the first one</a>.</p>';
  for (var i = 0; i < works.length; i++) h += workBlurb(works[i]);
  h += '<p><a href="#/works">browse all works</a></p>';
  h += '</div><div class="col-side">';
  h += '<div class="box"><b>Statistics</b><ul style="padding-left:18px;margin:6px 0 0">' +
       '<li>Works: ' + (data.total || 0) + '</li>' +
       '<li>Fandoms: <a href="#/fandoms">browse</a></li>' +
       '<li>Tags: <a href="#/tags">browse</a></li></ul></div>';
  h += '</div></div>';
  app.innerHTML = h;
}

function workBlurb(w) {
  var h = '<div class="box work">';
  h += '<h3><a href="#/works/' + w.id + '">' + esc(w.title) + '</a></h3>';
  h += '<div class="author">by <a href="#/works?q=' + encodeURIComponent(w.author || '') + '">' + esc(w.author || 'anonymous') + '</a></div>';
  if (w.fandom) h += '<div class="fandom">Fandom: <a href="#/works?f=' + encodeURIComponent(w.fandom) + '">' + esc(w.fandom) + '</a></div>';
  var tagline = '<span class="rating">' + esc(w.rating || 'Not Rated') + '</span>';
  if (w.categories) tagline += esc(w.categories);
  if (w.warnings && w.warnings !== 'Choose Not To Use Archive Warnings') tagline += ' &middot; ' + esc(w.warnings);
  h += '<div class="tags">' + tagline + '</div>';
  if (w.summary) h += '<div class="summary">' + esc(w.summary) + '</div>';
  h += '<div class="stats">' + workStatsHtml(w) + '</div>';
  h += '</div>';
  return h;
}

async function viewWorks(app) {
  var hash = location.hash || '#/works';
  var params = {};
  var qi = hash.indexOf('?');
  if (qi >= 0) {
    var qs = hash.slice(qi + 1);
    qs.split('&').forEach(function (kv) { var p = kv.split('='); if (p.length === 2) params[decodeURIComponent(p[0])] = decodeURIComponent(p[1]); });
  }
  var search = params.q != null ? params.q : S.q;
  var fandom = params.f || '';
  var rating = params.rating || '';
  var sort = params.sort || 'date';
  var page = parseInt(params.page || '1', 10) || 1;
  var q = '/works?limit=20&offset=' + ((page - 1) * 20) +
    '&search=' + encodeURIComponent(search || '') +
    '&fandom=' + encodeURIComponent(fandom) +
    '&rating=' + encodeURIComponent(rating) +
    '&sort=' + encodeURIComponent(sort);
  var data = await api('GET', q);
  var works = data.works || [];
  var h = '<div class="crumb">You are here: <a href="#/">Home</a> &raquo; Works</div>';
  h += '<h2 class="mh">Works' + (search ? ' matching \u201c' + esc(search) + '\u201d' : '') + ' (' + (data.total || 0) + ')</h2>';
  h += '<div class="box"><form id="filter">' +
    '<input type="text" id="fq" placeholder="search" value="' + esc(search || '') + '" style="max-width:260px;display:inline-block;margin-right:6px">' +
    '<select id="ff" style="max-width:200px;display:inline-block;margin-right:6px"><option value="">All Fandoms</option>' + await fandomOptions(fandom) + '</select>' +
    '<select id="fr" style="max-width:190px;display:inline-block;margin-right:6px"><option value="">Any Rating</option>' +
    RATINGS.map(function (r) { return '<option value="' + encodeURIComponent(r) + '"' + (r === rating ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('') +
    '</select>' +
    '<select id="fs" style="max-width:150px;display:inline-block"><option value="date"' + (sort === 'date' ? ' selected' : '') + '>Date Updated</option><option value="hits"' + (sort === 'hits' ? ' selected' : '') + '>Hits</option><option value="kudos"' + (sort === 'kudos' ? ' selected' : '') + '>Kudos</option></select>' +
    '</form></div>';
  if (!works.length) h += '<p>no works found. <a href="#/new">post one</a>.</p>';
  for (var i = 0; i < works.length; i++) h += workBlurb(works[i]);
  h += '<div class="pager">';
  if (page > 1) h += '<a href="#/works?page=' + (page - 1) + '&q=' + encodeURIComponent(search || '') + '&f=' + encodeURIComponent(fandom) + '&rating=' + encodeURIComponent(rating) + '&sort=' + encodeURIComponent(sort) + '">&larr; previous</a>';
  if ((data.total || 0) > page * 20) h += '<a href="#/works?page=' + (page + 1) + '&q=' + encodeURIComponent(search || '') + '&f=' + encodeURIComponent(fandom) + '&rating=' + encodeURIComponent(rating) + '&sort=' + encodeURIComponent(sort) + '">next &rarr;</a>';
  h += '</div>';
  app.innerHTML = h;
  document.getElementById('filter').addEventListener('submit', function (e) {
    e.preventDefault();
    var fq = document.getElementById('fq').value.trim();
    var ff = document.getElementById('ff').value;
    var fr = document.getElementById('fr').value;
    var fs = document.getElementById('fs').value;
    S.q = fq;
    location.hash = '#/works?q=' + encodeURIComponent(fq) + '&f=' + encodeURIComponent(ff) + '&rating=' + encodeURIComponent(fr) + '&sort=' + encodeURIComponent(fs);
  });
}

async function fandomOptions(selected) {
  var d = await api('GET', '/fandoms');
  var out = '';
  for (var i = 0; i < (d.fandoms || []).length; i++) {
    var f = d.fandoms[i];
    out += '<option value="' + encodeURIComponent(f) + '"' + (f === selected ? ' selected' : '') + '>' + esc(f) + '</option>';
  }
  return out;
}

function commentHtml(c) {
  var author = c.username || c.guest_name || 'Anonymous';
  var h = '<div class="comment">';
  h += '<div class="meta"><b>' + esc(author) + '</b> &middot; ' + fmtDate(c.created_at) + '</div>';
  h += '<div>' + esc(c.body) + '</div>';
  h += '<div style="font-size:11px"><a href="#/works/' + c.work_id + '/reply/' + c.id + '">reply</a></div>';
  if (c.children && c.children.length) {
    for (var i = 0; i < c.children.length; i++) h += '<div class="nested">' + commentHtml(c.children[i]) + '</div>';
  }
  h += '</div>';
  return h;
}

function buildTree(comments) {
  var byId = {}, roots = [];
  for (var i = 0; i < comments.length; i++) { comments[i].children = []; byId[comments[i].id] = comments[i]; }
  for (var j = 0; j < comments.length; j++) {
    var c = comments[j];
    if (c.parent_id && byId[c.parent_id]) byId[c.parent_id].children.push(c);
    else roots.push(c);
  }
  return roots;
}

async function viewWork(app, id) {
  var data = await api('GET', '/works/' + id);
  var w = data.work;
  var h = '<div class="crumb"><a href="#/">Home</a> &raquo; <a href="#/works">Works</a> &raquo; ' + esc(w.title) + '</div>';
  h += '<h2 class="mh">' + esc(w.title) + '</h2>';
  h += '<p>by <a href="#/works?q=' + encodeURIComponent(w.author || '') + '">' + esc(w.author || 'anonymous') + '</a></p>';
  h += '<div>Posted: ' + fmtDate(w.created_at) + ' &nbsp;&middot;&nbsp; Updated: ' + fmtDate(w.updated_at) + '</div>';
  h += '<div style="margin:8px 0">';
  if (w.fandom) h += '<div class="fandom">Fandom: ' + tagsHtml(w.fandom) + '</div>';
  h += '<div><span class="tag"><a href="#/works?rating=' + encodeURIComponent(w.rating || '') + '">' + esc(w.rating || 'Not Rated') + '</a></span></div>';
  h += '<div>' + tagsHtml(w.warnings) + '</div>';
  h += '<div>' + tagsHtml(w.categories) + '</div>';
  if (w.relationships) h += '<div>' + tagsHtml(w.relationships) + '</div>';
  if (w.characters) h += '<div>' + tagsHtml(w.characters) + '</div>';
  if (w.freeform) h += '<div>' + tagsHtml(w.freeform) + '</div>';
  h += '</div>';
  if (w.summary) h += '<div class="box"><b>Summary:</b><br>' + esc(w.summary) + '</div>';
  h += '<div class="statline">Words: <b>' + (w.words || 0) + '</b> &nbsp; Chapters: <b>1/1</b> &nbsp; Comments: <b>' + (w.comments_count || 0) + '</b> &nbsp; Kudos: <b>' + (w.kudos_count || 0) + '</b> &nbsp; Bookmarks: <b>' + (w.bookmarks_count || 0) + '</b> &nbsp; Hits: <b>' + (w.hits || 0) + '</b></div>';
  h += '<div style="margin:12px 0">';
  h += '<button id="kudosBtn">' + (data.my_kudos ? 'You have left kudos \u2665' : 'Leave Kudos \u2665') + '</button> ';
  h += '<button id="bmBtn">' + (data.my_bookmark ? 'Remove Bookmark' : 'Bookmark') + '</button> ';
  if (data.is_owner) h += '<a href="#/edit/' + w.id + '"><button class="secondary">Edit</button></a> <button id="delBtn" class="secondary">Delete</button>';
  h += '</div>';
  h += '<hr style="border:none;border-top:1px solid #ddd">';
  var paras = (w.body || '').split(/\\n\\s*\\n/).filter(Boolean);
  for (var p = 0; p < paras.length; p++) h += '<p>' + esc(paras[p]).replace(/\\n/g, '<br>') + '</p>';
  if (!paras.length) h += '<p>(no work text)</p>';
  h += '<hr style="border:none;border-top:1px solid #ddd">';
  h += '<h3 style="color:#900">Comments (' + (w.comments_count || 0) + ')</h3>';
  var tree = buildTree(data.comments || []);
  for (var ci = 0; ci < tree.length; ci++) h += commentHtml(tree[ci]);
  h += '<div class="box" style="margin-top:14px"><form id="cmt">';
  if (!S.me) h += '<label>Name (optional)</label><input type="text" id="gname" placeholder="guest name">';
  h += '<textarea id="cbody" rows="3" placeholder="leave a comment"></textarea>';
  h += '<input type="hidden" id="cparent" value="">';
  h += '<div style="margin-top:8px"><button type="submit">Comment</button></div>';
  h += '</form></div>';
  app.innerHTML = h;

  document.getElementById('kudosBtn').addEventListener('click', function () {
    api('POST', '/works/' + id + '/kudos').then(function (r) {
      location.reload();
    }).catch(function (e) { alert(e.message); });
  });
  document.getElementById('bmBtn').addEventListener('click', function () {
    api('POST', '/works/' + id + '/bookmarks').then(function (r) {
      location.reload();
    }).catch(function (e) { alert(e.message); });
  });
  var del = document.getElementById('delBtn');
  if (del) del.addEventListener('click', function () {
    if (!confirm('delete this work?')) return;
    api('DELETE', '/works/' + id).then(function () { location.hash = '#/works'; }).catch(function (e) { alert(e.message); });
  });
  document.getElementById('cmt').addEventListener('submit', function (e) {
    e.preventDefault();
    var body = document.getElementById('cbody').value.trim();
    if (!body) return;
    var payload = { body: body, parent_id: parseInt(document.getElementById('cparent').value || '0', 10) || null };
    var gn = document.getElementById('gname');
    if (gn) payload.guest_name = gn.value.trim();
    api('POST', '/works/' + id + '/comments', payload).then(function () { location.reload(); }).catch(function (err) { alert(err.message); });
  });
}

function viewPost(app) {
  app.innerHTML = postFormHtml(null);
  bindPostForm(app, null);
}

async function viewEdit(app, id) {
  var data = await api('GET', '/works/' + id);
  app.innerHTML = postFormHtml(data.work);
  bindPostForm(app, id);
}

function postFormHtml(w) {
  w = w || {};
  function cv(v) { return esc(v || ''); }
  var warnBoxes = WARNINGS.map(function (x) { return '<label style="font-weight:normal"><input type="checkbox" name="w" value="' + esc(x) + '"> ' + esc(x) + '</label>'; }).join('');
  var catBoxes = CATEGORIES.map(function (x) { return '<label style="font-weight:normal"><input type="checkbox" name="c" value="' + esc(x) + '"> ' + esc(x) + '</label>'; }).join('');
  var ratingOpts = RATINGS.map(function (x) { return '<option value="' + esc(x) + '"' + (w.rating === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('');
  return '<div class="crumb"><a href="#/">Home</a> &raquo; ' + (w.id ? 'Edit Work' : 'Post New Work') + '</div>' +
    '<h2 class="mh">' + (w.id ? 'Edit Work' : 'Post New Work') + '</h2>' +
    '<div class="box"><form id="pf">' +
    '<label>Title</label><input type="text" id="p_title" value="' + cv(w.title) + '">' +
    '<label>Fandom</label><input type="text" id="p_fandom" value="' + cv(w.fandom) + '" placeholder="e.g. Original Work">' +
    '<label>Rating</label><select id="p_rating">' + ratingOpts + '</select>' +
    '<label>Archive Warnings</label><div id="p_warnings">' + warnBoxes + '</div>' +
    '<label>Categories</label><div id="p_categories">' + catBoxes + '</div>' +
    '<label>Relationships</label><input type="text" id="p_rel" value="' + cv(w.relationships) + '" placeholder="comma separated">' +
    '<label>Characters</label><input type="text" id="p_char" value="' + cv(w.characters) + '" placeholder="comma separated">' +
    '<label>Additional Tags</label><input type="text" id="p_free" value="' + cv(w.freeform) + '" placeholder="comma separated">' +
    '<label>Summary</label><textarea id="p_summary" rows="3">' + cv(w.summary) + '</textarea>' +
    '<label>Work Text</label><textarea id="p_body" rows="12">' + cv(w.body) + '</textarea>' +
    '<div style="margin-top:12px"><button type="submit">' + (w.id ? 'Save' : 'Post Work') + '</button></div>' +
    '</form></div>';
}

function bindPostForm(app, id) {
  function checked(name) {
    var boxes = document.querySelectorAll('input[name="' + name + '"]:checked');
    var out = [];
    for (var i = 0; i < boxes.length; i++) out.push(boxes[i].value);
    return out.join(', ');
  }
  document.getElementById('pf').addEventListener('submit', function (e) {
    e.preventDefault();
    var payload = {
      title: document.getElementById('p_title').value.trim(),
      fandom: document.getElementById('p_fandom').value.trim(),
      rating: document.getElementById('p_rating').value,
      warnings: checked('w'),
      categories: checked('c'),
      relationships: document.getElementById('p_rel').value.trim(),
      characters: document.getElementById('p_char').value.trim(),
      freeform: document.getElementById('p_free').value.trim(),
      summary: document.getElementById('p_summary').value.trim(),
      body: document.getElementById('p_body').value
    };
    if (!payload.title) { alert('title is required'); return; }
    if (!payload.body.trim()) { alert('work text is required'); return; }
    var req = id ? api('PUT', '/works/' + id, payload) : api('POST', '/works', payload);
    req.then(function (r) { location.hash = '#/works/' + r.id; }).catch(function (err) { alert(err.message); });
  });
}

function viewLogin(app) {
  app.innerHTML = '<div class="crumb"><a href="#/">Home</a> &raquo; Log In</div><h2 class="mh">Log In</h2>' +
    '<div class="box"><form id="lf">' +
    '<label>Username</label><input type="text" id="lu">' +
    '<label>Password</label><input type="password" id="lp">' +
    '<div style="margin-top:12px"><button type="submit">Log In</button></div>' +
    '<div class="err" id="lerr"></div></form></div>';
  document.getElementById('lf').addEventListener('submit', function (e) {
    e.preventDefault();
    api('POST', '/login', { username: document.getElementById('lu').value.trim(), password: document.getElementById('lp').value })
      .then(function (r) { S.me = r.user; renderHeader(); location.hash = '#/'; })
      .catch(function (err) { document.getElementById('lerr').textContent = err.message; });
  });
}

function viewRegister(app) {
  app.innerHTML = '<div class="crumb"><a href="#/">Home</a> &raquo; Sign Up</div><h2 class="mh">Sign Up</h2>' +
    '<div class="box"><form id="rf">' +
    '<label>Username</label><input type="text" id="ru">' +
    '<label>Password</label><input type="password" id="rp">' +
    '<div style="margin-top:12px"><button type="submit">Sign Up</button></div>' +
    '<div class="err" id="rerr"></div></form></div>';
  document.getElementById('rf').addEventListener('submit', function (e) {
    e.preventDefault();
    api('POST', '/register', { username: document.getElementById('ru').value.trim(), password: document.getElementById('rp').value })
      .then(function (r) { S.me = r.user; renderHeader(); location.hash = '#/'; })
      .catch(function (err) { document.getElementById('rerr').textContent = err.message; });
  });
}

async function viewBookmarks(app) {
  var data = await api('GET', '/bookmarks');
  var ext = await api('GET', '/ext-bookmarks');
  var h = '<div class="crumb"><a href="#/">Home</a> &raquo; Bookmarks</div>';
  h += '<h2 class="mh">External Recs</h2>';
  h += '<div class="box"><form id="extf">' +
    '<label>AO3 link</label><input type="text" id="ex_url" placeholder="https://archiveofourown.org/works/...">' +
    '<label>Title</label><input type="text" id="ex_title" placeholder="title">' +
    '<label>Author</label><input type="text" id="ex_author" placeholder="author">' +
    '<label>Fandom</label><input type="text" id="ex_fandom" placeholder="fandom">' +
    '<label>Notes</label><input type="text" id="ex_notes" placeholder="optional">' +
    '<div style="margin-top:10px"><button type="submit">Add Rec</button></div>' +
    '</form></div>';
  var elist = ext.bookmarks || [];
  if (!elist.length) h += '<p>no saved links yet.</p>';
  for (var i = 0; i < elist.length; i++) {
    var e = elist[i];
    h += '<div class="box work"><h3><a href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(e.title || e.url) + '</a></h3>' +
         '<div class="author">by ' + esc(e.author || 'unknown') + '</div>';
    if (e.fandom) h += '<div class="fandom">Fandom: ' + esc(e.fandom) + '</div>';
    if (e.notes) h += '<div class="summary">' + esc(e.notes) + '</div>';
    h += '<div style="font-size:11px;margin-top:4px"><a href="#" data-del="' + e.id + '">remove</a></div></div>';
  }
  h += '<h2 class="mh">Your Works Bookmarks</h2>';
  var list = data.bookmarks || [];
  if (!list.length) h += '<p>you have no bookmarks on this archive yet.</p>';
  for (var j = 0; j < list.length; j++) {
    var b = list[j];
    h += '<div class="box work"><h3><a href="#/works/' + b.work_id + '">' + esc(b.title) + '</a></h3>' +
         '<div class="author">by ' + esc(b.author || 'anonymous') + '</div>';
    if (b.notes) h += '<div class="summary">notes: ' + esc(b.notes) + '</div>';
    h += '</div>';
  }
  app.innerHTML = h;
  document.getElementById('extf').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var payload = {
      url: document.getElementById('ex_url').value.trim(),
      title: document.getElementById('ex_title').value.trim(),
      author: document.getElementById('ex_author').value.trim(),
      fandom: document.getElementById('ex_fandom').value.trim(),
      notes: document.getElementById('ex_notes').value.trim()
    };
    api('POST', '/ext-bookmarks', payload).then(function () { location.reload(); }).catch(function (err) { alert(err.message); });
  });
  var dels = app.querySelectorAll('[data-del]');
  for (var d = 0; d < dels.length; d++) {
    dels[d].addEventListener('click', function (ev) {
      ev.preventDefault();
      api('DELETE', '/ext-bookmarks/' + this.getAttribute('data-del')).then(function () { location.reload(); });
    });
  }
}

async function viewFandoms(app) {
  var d = await api('GET', '/fandoms');
  var h = '<div class="crumb"><a href="#/">Home</a> &raquo; Fandoms</div><h2 class="mh">Fandoms</h2><ul>';
  for (var i = 0; i < (d.fandoms || []).length; i++) {
    var f = d.fandoms[i];
    h += '<li><a href="#/works?f=' + encodeURIComponent(f) + '">' + esc(f) + '</a></li>';
  }
  h += '</ul>';
  app.innerHTML = h;
}

async function viewTags(app) {
  var d = await api('GET', '/tags');
  var h = '<div class="crumb"><a href="#/">Home</a> &raquo; Tags</div><h2 class="mh">Tags</h2>';
  var t = d.tags || [];
  if (!t.length) h += '<p>no tags yet.</p>';
  else h += '<p>' + tagsHtml(t.join(', ')) + '</p>';
  app.innerHTML = h;
}

async function doLogout() {
  await api('POST', '/logout');
  S.me = null;
  renderHeader();
  location.hash = '#/';
}

function viewAbout(app) {
  app.innerHTML =
    '<div class="crumb"><a href="#/">Home</a> &raquo; About Us</div>' +
    '<h2 class="mh">About Us</h2>' +
    '<div class="box">' +
    '<p>hey. i made this because the real AO3 was down and i wanted somewhere to post. it is a working archive on <a href="https://eons.gay">eons.gay</a> that looks and acts like AO3 &mdash; post works, leave kudos, comment, bookmark.</p>' +
    '<p>it is not affiliated with the Organization for Transformative Works or the real AO3 at archiveofourown.org.</p>' +
    '</div>';
}

function viewContact(app) {
  app.innerHTML =
    '<div class="crumb"><a href="#/">Home</a> &raquo; Contact Us</div>' +
    '<h2 class="mh">Contact Us</h2>' +
    '<div class="box">' +
    '<p>email: <a href="mailto:eonsproton@proton.me">eonsproton@proton.me</a></p>' +
    '</div>';
}

function viewTos(app) {
  app.innerHTML =
    '<div class="crumb"><a href="#/">Home</a> &raquo; Terms of Service</div>' +
    '<h2 class="mh">Terms of Service</h2>' +
    '<div class="box">' +
    '<p><b>1. acceptance.</b> by using this archive you agree to these terms.</p>' +
    '<p><b>2. your content.</b> you keep ownership of the works you post. by posting, you grant this site a license to store and display them. do not post work you did not write or do not have permission to post.</p>' +
    '<p><b>3. rules.</b> no hate, slurs, or harassment. no doxxing or personal info. nothing illegal. rate your works honestly.</p>' +
    '<p><b>4. mature content.</b> mature and explicit fanfiction is allowed, but it must be rated and tagged. you confirm you are old enough to view and post it.</p>' +
    '<p><b>5. moderation.</b> content is filtered automatically and may be removed, and accounts suspended, without notice.</p>' +
    '<p><b>6. copyright.</b> do not repost work that is not yours. to report infringement, email <a href="mailto:eonsproton@proton.me">eonsproton@proton.me</a>.</p>' +
    '<p><b>7. account.</b> passwords are stored hashed, never in plaintext. you are responsible for activity on your account.</p>' +
    '<p><b>8. disclaimer.</b> provided as-is, with no warranty. this site is not affiliated with the Organization for Transformative Works or Archive of Our Own.</p>' +
    '<p><b>9. changes.</b> these terms may change at any time.</p>' +
    '</div>';
}

function viewAuthPrompt(app, msg) {
  app.innerHTML =
    '<div class="box" style="max-width:420px;margin:48px auto;text-align:center">' +
    '<p>' + esc(msg || 'you need an account for that') + '</p>' +
    '<p><a href="#/login"><button>Log In</button></a> <a href="#/register"><button class="secondary">Sign Up</button></a></p>' +
    '</div>';
}

async function route() {
  var app = document.getElementById('app');
  var h = location.hash || '#/';
  var reply = h.match(/^#\\/works\\/(\\d+)\\/reply\\/(\\d+)$/);
  try {
    if (h === '#/') return await viewHome(app);
    if (h === '#/works') return await viewWorks(app);
    if (h === '#/new') { if (!S.me) return viewAuthPrompt(app, 'log in to post a work'); return viewPost(app); }
    if (h === '#/login') return viewLogin(app);
    if (h === '#/register') return viewRegister(app);
    if (h === '#/bookmarks') { if (!S.me) return viewAuthPrompt(app, 'log in to view your bookmarks'); return await viewBookmarks(app); }
    if (h === '#/fandoms') return await viewFandoms(app);
    if (h === '#/tags') return await viewTags(app);
    if (h === '#/about') return viewAbout(app);
    if (h === '#/contact') return viewContact(app);
    if (h === '#/tos') return viewTos(app);
    if (reply) return await viewWork(app, reply[1], reply[2]);
    var edit = h.match(/^#\\/edit\\/(\\d+)$/);
    if (edit) { if (!S.me) return viewAuthPrompt(app, 'log in to edit a work'); return await viewEdit(app, edit[1]); }
    var single = h.match(/^#\\/works\\/(\\d+)$/);
    if (single) return await viewWork(app, single[1]);
    return await viewHome(app);
  } catch (e) {
    app.innerHTML = '<div class="err">' + esc(e.message || 'something went wrong') + '</div><p><a href="#/">go home</a></p>';
  }
}

async function boot() {
  renderShell();
  renderHeader();
  try { var r = await api('GET', '/me'); S.me = r.user; } catch (e) { S.me = null; }
  renderHeader();
  route();
}

window.addEventListener('hashchange', function () { route(); });
boot();
</script>
</body>
</html>`;

function json(data, status) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: {
    "content-type": "application/json;charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer"
  }});
}

async function getBody(req) { try { return await req.json(); } catch (e) { return {}; } }

function randHex(n) {
  var b = new Uint8Array(n); crypto.getRandomValues(b);
  var s = ""; for (var i = 0; i < b.length; i++) s += ("0" + b[i].toString(16)).slice(-2); return s;
}

async function hashPassword(password, salt) {
  var enc = new TextEncoder();
  var key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  var bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, key, 256);
  var arr = new Uint8Array(bits); var s = ""; for (var i = 0; i < arr.length; i++) s += ("0" + arr[i].toString(16)).slice(-2); return s;
}

function cookie(resp, token, clear) {
  var v = clear ? "ao3_session=; Path=/; Max-Age=0" : "ao3_session=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000";
  resp.headers.set("Set-Cookie", v);
  return resp;
}

async function getUser(request, env) {
  var cookie = request.headers.get("Cookie") || "";
  var m = cookie.match(/ao3_session=([^;]+)/);
  if (!m) return null;
  var row = await env.DB.prepare("SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?").bind(m[1]).first();
  return row || null;
}

function hasSlur(text) {
  var norm = String(text || "").toLowerCase()
    .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t")
    .replace(/[^a-z]+/g, "")
    .replace(/([a-z])\1+/g, "$1");
  return /(niger|niga|fag|retard|trany|kike|chink|spic|coon|wetback|dyke|beaner|gook|paki|kaffir)/.test(norm);
}

const RATINGS = ["Not Rated", "General Audiences", "Teen And Up Audiences", "Mature", "Explicit"];

async function ao3Api(request, env, url) {
  const p = url.pathname;
  const route = p.slice("/ao3/api".length);
  const method = request.method;

  if (route === "/me" && method === "GET") {
    return json({ user: await getUser(request, env) });
  }

  if (route === "/register" && method === "POST") {
    const b = await getBody(request);
    const username = String(b.username || "").trim();
    const password = String(b.password || "");
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) return json({ error: "username must be 3-20 letters/numbers" }, 400);
    if (password.length < 6) return json({ error: "password must be at least 6 characters" }, 400);
    const exists = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
    if (exists) return json({ error: "username taken" }, 409);
    const salt = randHex(16);
    const hash = await hashPassword(password, salt);
    const info = await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind(username, salt + ":" + hash).run();
    const userId = info.meta.last_row_id;
    const token = randHex(32);
    await env.DB.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").bind(token, userId).run();
    return cookie(json({ user: { id: userId, username: username } }), token);
  }

  if (route === "/login" && method === "POST") {
    const b = await getBody(request);
    const username = String(b.username || "").trim();
    const password = String(b.password || "");
    const user = await env.DB.prepare("SELECT id, username, password_hash FROM users WHERE username = ?").bind(username).first();
    if (!user) return json({ error: "no such user" }, 401);
    const parts = String(user.password_hash).split(":");
    const hash = await hashPassword(password, parts[0]);
    if (hash !== parts[1]) return json({ error: "wrong password" }, 401);
    const token = randHex(32);
    await env.DB.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").bind(token, user.id).run();
    return cookie(json({ user: { id: user.id, username: user.username } }), token);
  }

  if (route === "/logout" && method === "POST") {
    const cookie = request.headers.get("Cookie") || "";
    const m = cookie.match(/ao3_session=([^;]+)/);
    if (m) await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(m[1]).run();
    return cookie(json({ ok: true }), "", true);
  }

  if (route === "/fandoms" && method === "GET") {
    const r = await env.DB.prepare("SELECT DISTINCT fandom FROM works WHERE fandom != '' ORDER BY fandom").all();
    return json({ fandoms: r.results.map(function (x) { return x.fandom; }) });
  }

  if (route === "/tags" && method === "GET") {
    const r = await env.DB.prepare("SELECT freeform FROM works WHERE freeform != ''").all();
    const set = {};
    r.results.forEach(function (x) { String(x.freeform).split(",").forEach(function (t) { t = t.trim(); if (t) set[t] = 1; }); });
    return json({ tags: Object.keys(set).sort() });
  }

  if (route === "/works" && method === "GET") {
    const search = url.searchParams.get("search") || "";
    const fandom = url.searchParams.get("fandom") || "";
    const rating = url.searchParams.get("rating") || "";
    const sort = url.searchParams.get("sort") || "date";
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const where = []; const args = [];
    if (search) {
      const like = "%" + search.replace(/%/g, "\\%").replace(/_/g, "\\_") + "%";
      const esc = " ESCAPE '\\'";
      where.push("(w.title LIKE ?" + esc + " OR w.fandom LIKE ?" + esc + " OR w.freeform LIKE ?" + esc + " OR w.characters LIKE ?" + esc + " OR w.relationships LIKE ?" + esc + " OR w.summary LIKE ?" + esc + " OR u.username LIKE ?" + esc + ")");
      for (let i = 0; i < 7; i++) args.push(like);
    }
    if (fandom) { where.push("w.fandom LIKE ? ESCAPE '\\'"); args.push("%" + fandom.replace(/%/g, "\\%").replace(/_/g, "\\_") + "%"); }
    if (rating) { where.push("w.rating = ?"); args.push(rating); }
    const ws = where.length ? "WHERE " + where.join(" AND ") : "";
    let order = "w.updated_at DESC";
    if (sort === "hits") order = "w.hits DESC";
    if (sort === "kudos") order = "kudos_count DESC";
    const countRow = await env.DB.prepare("SELECT COUNT(*) AS n FROM works w JOIN users u ON u.id = w.user_id " + ws).bind(...args).first();
    const sql = "SELECT w.*, u.username AS author, " +
      "(SELECT COUNT(*) FROM kudos k WHERE k.work_id = w.id) AS kudos_count, " +
      "(SELECT COUNT(*) FROM comments c WHERE c.work_id = w.id) AS comments_count, " +
      "(SELECT COUNT(*) FROM bookmarks b WHERE b.work_id = w.id) AS bookmarks_count " +
      "FROM works w JOIN users u ON u.id = w.user_id " + ws + " ORDER BY " + order + " LIMIT ? OFFSET ?";
    const rows = await env.DB.prepare(sql).bind(...args, limit, offset).all();
    return json({ works: rows.results, total: countRow.n });
  }

  if (route === "/works" && method === "POST") {
    const user = await getUser(request, env);
    if (!user) return json({ error: "log in to post" }, 401);
    const b = await getBody(request);
    const title = String(b.title || "").trim();
    const body = String(b.body || "").trim();
    const fandom = String(b.fandom || "").trim();
    const relationships = String(b.relationships || "").trim();
    const characters = String(b.characters || "").trim();
    const freeform = String(b.freeform || "").trim();
    const summary = String(b.summary || "").trim();
    if (!title) return json({ error: "title required" }, 400);
    if (!body) return json({ error: "work text required" }, 400);
    if (title.length > 200 || fandom.length > 200 || relationships.length > 500 || characters.length > 500 || freeform.length > 500 || summary.length > 2000) return json({ error: "field too long" }, 400);
    if (body.length > 200000) return json({ error: "work too long" }, 400);
    if (hasSlur(title + "\n" + summary + "\n" + body + "\n" + fandom + "\n" + relationships + "\n" + characters + "\n" + freeform)) return json({ error: "be nice" }, 400);
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM works WHERE user_id = ? AND created_at > datetime('now', '-10 minutes')").bind(user.id).first();
    if (recent.n >= 10) return json({ error: "slow down" }, 429);
    const rating = RATINGS.includes(b.rating) ? b.rating : "Not Rated";
    const words = body.split(/\s+/).filter(Boolean).length;
    const info = await env.DB.prepare(
      "INSERT INTO works (user_id, title, fandom, rating, warnings, categories, relationships, characters, freeform, summary, body, words) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(user.id, title, fandom, rating, String(b.warnings || "").trim(), String(b.categories || "").trim(),
      relationships, characters, freeform, summary, body, words).run();
    return json({ id: info.meta.last_row_id });
  }

  let m = route.match(/^\/works\/(\d+)$/);
  if (m) {
    const id = parseInt(m[1], 10);
    if (method === "GET") {
      const w = await env.DB.prepare(
        "SELECT w.*, u.username AS author, " +
        "(SELECT COUNT(*) FROM kudos k WHERE k.work_id = w.id) AS kudos_count, " +
        "(SELECT COUNT(*) FROM comments c WHERE c.work_id = w.id) AS comments_count, " +
        "(SELECT COUNT(*) FROM bookmarks b WHERE b.work_id = w.id) AS bookmarks_count " +
        "FROM works w JOIN users u ON u.id = w.user_id WHERE w.id = ?").bind(id).first();
      if (!w) return json({ error: "not found" }, 404);
      const user = await getUser(request, env);
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      await env.DB.prepare("UPDATE works SET hits = hits + 1 WHERE id = ?").bind(id).run();
      w.hits = (w.hits || 0) + 1;
      let my_kudos = false;
      if (user) { const k = await env.DB.prepare("SELECT id FROM kudos WHERE work_id = ? AND user_id = ?").bind(id, user.id).first(); my_kudos = !!k; }
      else { const k = await env.DB.prepare("SELECT id FROM kudos WHERE work_id = ? AND ip = ?").bind(id, ip).first(); my_kudos = !!k; }
      let my_bookmark = false;
      if (user) { const bk = await env.DB.prepare("SELECT id FROM bookmarks WHERE work_id = ? AND user_id = ?").bind(id, user.id).first(); my_bookmark = !!bk; }
      const comments = await env.DB.prepare(
        "SELECT c.*, u.username FROM comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.work_id = ? ORDER BY c.id").bind(id).all();
      return json({ work: w, comments: comments.results, my_kudos: my_kudos, my_bookmark: my_bookmark, is_owner: !!(user && user.id === w.user_id) });
    }
    if (method === "PUT") {
      const user = await getUser(request, env);
      if (!user) return json({ error: "log in" }, 401);
      const w = await env.DB.prepare("SELECT * FROM works WHERE id = ?").bind(id).first();
      if (!w) return json({ error: "not found" }, 404);
      if (w.user_id !== user.id) return json({ error: "not yours" }, 403);
      const b = await getBody(request);
      const title = String(b.title != null ? b.title : w.title).trim();
      const body = String(b.body != null ? b.body : w.body);
      const fandom = String(b.fandom != null ? b.fandom : w.fandom).trim();
      const relationships = String(b.relationships != null ? b.relationships : w.relationships).trim();
      const characters = String(b.characters != null ? b.characters : w.characters).trim();
      const freeform = String(b.freeform != null ? b.freeform : w.freeform).trim();
      const summary = String(b.summary != null ? b.summary : w.summary).trim();
      if (!title) return json({ error: "title required" }, 400);
      if (title.length > 200 || fandom.length > 200 || relationships.length > 500 || characters.length > 500 || freeform.length > 500 || summary.length > 2000) return json({ error: "field too long" }, 400);
      if (body.length > 200000) return json({ error: "work too long" }, 400);
      if (hasSlur(title + "\n" + summary + "\n" + body + "\n" + fandom + "\n" + relationships + "\n" + characters + "\n" + freeform)) return json({ error: "be nice" }, 400);
      const words = body.split(/\s+/).filter(Boolean).length;
      const rating = RATINGS.includes(b.rating) ? b.rating : w.rating;
      await env.DB.prepare(
        "UPDATE works SET title=?, fandom=?, rating=?, warnings=?, categories=?, relationships=?, characters=?, freeform=?, summary=?, body=?, words=?, updated_at=datetime('now') WHERE id=?"
      ).bind(title, fandom, rating,
        String(b.warnings != null ? b.warnings : w.warnings).trim(), String(b.categories != null ? b.categories : w.categories).trim(),
        relationships, characters, freeform, summary,
        body, words, id).run();
      return json({ id: id });
    }
    if (method === "DELETE") {
      const user = await getUser(request, env);
      if (!user) return json({ error: "log in" }, 401);
      const w = await env.DB.prepare("SELECT * FROM works WHERE id = ?").bind(id).first();
      if (!w) return json({ error: "not found" }, 404);
      if (w.user_id !== user.id) return json({ error: "not yours" }, 403);
      await env.DB.prepare("DELETE FROM works WHERE id = ?").bind(id).run();
      await env.DB.prepare("DELETE FROM kudos WHERE work_id = ?").bind(id).run();
      await env.DB.prepare("DELETE FROM comments WHERE work_id = ?").bind(id).run();
      await env.DB.prepare("DELETE FROM bookmarks WHERE work_id = ?").bind(id).run();
      return json({ ok: true });
    }
  }

  m = route.match(/^\/works\/(\d+)\/kudos$/);
  if (m && method === "POST") {
    const id = parseInt(m[1], 10);
    const w = await env.DB.prepare("SELECT id FROM works WHERE id = ?").bind(id).first();
    if (!w) return json({ error: "not found" }, 404);
    const user = await getUser(request, env);
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    let exists;
    if (user) exists = await env.DB.prepare("SELECT id FROM kudos WHERE work_id = ? AND user_id = ?").bind(id, user.id).first();
    else exists = await env.DB.prepare("SELECT id FROM kudos WHERE work_id = ? AND ip = ?").bind(id, ip).first();
    if (exists) return json({ error: "you have already left kudos" }, 409);
    await env.DB.prepare("INSERT INTO kudos (work_id, user_id, ip) VALUES (?, ?, ?)").bind(id, user ? user.id : null, ip).run();
    const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM kudos WHERE work_id = ?").bind(id).first();
    return json({ kudos_count: c.n, given: true });
  }

  m = route.match(/^\/works\/(\d+)\/comments$/);
  if (m && method === "POST") {
    const id = parseInt(m[1], 10);
    const w = await env.DB.prepare("SELECT id FROM works WHERE id = ?").bind(id).first();
    if (!w) return json({ error: "not found" }, 404);
    const b = await getBody(request);
    const body = String(b.body || "").trim();
    if (!body) return json({ error: "empty comment" }, 400);
    if (body.length > 5000) return json({ error: "comment too long" }, 400);
    if (hasSlur(body)) return json({ error: "be nice" }, 400);
    const user = await getUser(request, env);
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM comments WHERE work_id = ? AND created_at > datetime('now', '-60 seconds')").bind(id).first();
    if (recent.n >= 10) return json({ error: "slow down" }, 429);
    const parent = parseInt(b.parent_id, 10) || null;
    const guest = user ? "" : String(b.guest_name || "").trim().slice(0, 50);
    const info = await env.DB.prepare("INSERT INTO comments (work_id, user_id, guest_name, parent_id, body) VALUES (?, ?, ?, ?, ?)")
      .bind(id, user ? user.id : null, guest, parent, body).run();
    return json({ id: info.meta.last_row_id });
  }

  m = route.match(/^\/works\/(\d+)\/bookmarks$/);
  if (m && method === "POST") {
    const id = parseInt(m[1], 10);
    const user = await getUser(request, env);
    if (!user) return json({ error: "log in to bookmark" }, 401);
    const w = await env.DB.prepare("SELECT id FROM works WHERE id = ?").bind(id).first();
    if (!w) return json({ error: "not found" }, 404);
    const b = await getBody(request);
    const existing = await env.DB.prepare("SELECT id FROM bookmarks WHERE work_id = ? AND user_id = ?").bind(id, user.id).first();
    if (existing) {
      await env.DB.prepare("DELETE FROM bookmarks WHERE id = ?").bind(existing.id).run();
      return json({ bookmarked: false });
    }
    await env.DB.prepare("INSERT INTO bookmarks (work_id, user_id, private, notes) VALUES (?, ?, ?, ?)")
      .bind(id, user.id, b.private ? 1 : 0, String(b.notes || "").trim().slice(0, 1000)).run();
    return json({ bookmarked: true });
  }

  if (route === "/bookmarks" && method === "GET") {
    const user = await getUser(request, env);
    if (!user) return json({ error: "log in" }, 401);
    const r = await env.DB.prepare(
      "SELECT b.work_id, b.notes, b.private, w.title, u.username AS author FROM bookmarks b JOIN works w ON w.id = b.work_id JOIN users u ON u.id = w.user_id WHERE b.user_id = ? ORDER BY b.id DESC"
    ).bind(user.id).all();
    return json({ bookmarks: r.results });
  }

  if (route === "/ext-bookmarks" && method === "GET") {
    const user = await getUser(request, env);
    if (!user) return json({ error: "log in" }, 401);
    const r = await env.DB.prepare("SELECT id, title, author, fandom, url, notes, created_at FROM ext_bookmarks WHERE user_id = ? ORDER BY id DESC").bind(user.id).all();
    return json({ bookmarks: r.results });
  }

  if (route === "/ext-bookmarks" && method === "POST") {
    const user = await getUser(request, env);
    if (!user) return json({ error: "log in" }, 401);
    const b = await getBody(request);
    const url = String(b.url || "").trim();
    const title = String(b.title || "").trim();
    if (!title) return json({ error: "title required" }, 400);
    if (!/^https?:\/\//.test(url)) return json({ error: "link must start with http(s)" }, 400);
    if (url.length > 2000 || title.length > 300) return json({ error: "too long" }, 400);
    const info = await env.DB.prepare("INSERT INTO ext_bookmarks (user_id, title, author, fandom, url, notes) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(user.id, title, String(b.author || "").trim().slice(0, 100), String(b.fandom || "").trim().slice(0, 200), url, String(b.notes || "").trim().slice(0, 1000)).run();
    return json({ id: info.meta.last_row_id });
  }

  let exm = route.match(/^\/ext-bookmarks\/(\d+)$/);
  if (exm && method === "DELETE") {
    const user = await getUser(request, env);
    if (!user) return json({ error: "log in" }, 401);
    const id = parseInt(exm[1], 10);
    const row = await env.DB.prepare("SELECT id FROM ext_bookmarks WHERE id = ? AND user_id = ?").bind(id, user.id).first();
    if (!row) return json({ error: "not found" }, 404);
    await env.DB.prepare("DELETE FROM ext_bookmarks WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "not found" }, 404);
}

export default {
  async fetch(request, env) {
    var url = new URL(request.url);

    if (url.pathname.startsWith("/ao3/api/")) {
      return await ao3Api(request, env, url);
    }
    if (url.pathname === "/ao3" || url.pathname === "/ao3/") {
      return new Response(AO3_HTML, { headers: {
        "content-type": "text/html;charset=utf-8",
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "no-referrer"
      }});
    }

    if (url.pathname === "/api/entries") {
      if (request.method === "POST") {
        var body = {};
        try { body = await request.json(); } catch (e) {}
        var message = String(body.message || "").trim();
        if (!message) return Response.json({ error: "empty message" }, { status: 400 });
        if (message.length > 500) return Response.json({ error: "too long" }, { status: 400 });
        if (hasSlur(message)) return Response.json({ error: "be nice" }, { status: 400 });
        var token = String(body.token || "");
        if (!token) return Response.json({ error: "forbidden" }, { status: 403 });
        var remoteip = request.headers.get("CF-Connecting-IP") || "";
        var vr = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: remoteip }),
        });
        var v = await vr.json();
        if (!v.success) return Response.json({ error: "forbidden" }, { status: 403 });
        var ip = request.headers.get("CF-Connecting-IP") || "unknown";
        var recent = await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM entries WHERE ip = ? AND created_at > datetime('now', '-60 seconds')"
        ).bind(ip).first();
        if (recent.n >= 5) return Response.json({ error: "slow down" }, { status: 429 });
        var x = Math.round((Math.random() + Math.random() - 1) * 800);
        var y = Math.round((Math.random() + Math.random() - 1) * 800);
        var color = "hsl(" + Math.floor(Math.random() * 360) + ", 100%, 65%)";
        var info = await env.DB.prepare(
          "INSERT INTO entries (name, message, x, y, color, ip) VALUES ('', ?, ?, ?, ?, ?)"
        ).bind(message, x, y, color, ip).run();
        return Response.json({ id: info.meta.last_row_id, message: message, x: x, y: y, color: color });
      }
      var r = await env.DB.prepare(
        "SELECT id, message, x, y, color, created_at FROM entries ORDER BY id"
      ).all();
      return Response.json(r.results);
    }
    if (url.pathname === "/guestbook") {
      return new Response(HTML.replace("SITEKEY_PLACEHOLDER", SITEKEY), { headers: { "content-type": "text/html;charset=utf-8" } });
    }
    return env.ASSETS.fetch(request);
  }
};
