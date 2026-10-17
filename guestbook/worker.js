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
</style>
</head>
<body>
<canvas id="c"></canvas>
<form id="form">
  <input id="msg" placeholder="leave a message" maxlength="500" autocomplete="off">
  <button id="send" type="submit">post</button>
</form>
<div id="hint">drag to pan &middot; scroll to zoom</div>
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

document.getElementById('form').addEventListener('submit', async function (ev) {
  ev.preventDefault();
  var input = document.getElementById('msg');
  var message = input.value.trim();
  if (!message) return;
  var r = await fetch('/api/entries', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: message })
  });
  if (r.ok) {
    var e = await r.json();
    entries.push(e);
    draw();
    input.value = '';
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
</body>
</html>`;

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    if (url.pathname === "/api/entries") {
      if (request.method === "POST") {
        var body = {};
        try { body = await request.json(); } catch (e) {}
        var message = String(body.message || "").trim();
        if (!message) return Response.json({ error: "empty message" }, { status: 400 });
        if (message.length > 500) return Response.json({ error: "too long" }, { status: 400 });
        var x = Math.round((Math.random() + Math.random() - 1) * 800);
        var y = Math.round((Math.random() + Math.random() - 1) * 800);
        var color = "hsl(" + Math.floor(Math.random() * 360) + ", 100%, 65%)";
        var info = await env.DB.prepare(
          "INSERT INTO entries (name, message, x, y, color) VALUES ('', ?, ?, ?, ?)"
        ).bind(message, x, y, color).run();
        return Response.json({ id: info.meta.last_row_id, message: message, x: x, y: y, color: color });
      }
      var r = await env.DB.prepare(
        "SELECT id, message, x, y, color, created_at FROM entries ORDER BY id"
      ).all();
      return Response.json(r.results);
    }
    if (url.pathname === "/guestbook") {
      return new Response(HTML, { headers: { "content-type": "text/html;charset=utf-8" } });
    }
    return env.ASSETS.fetch(request);
  }
};
