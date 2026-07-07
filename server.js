const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./db');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const HOST = process.env.HOST || '127.0.0.1';
const JWT_SECRET = process.env.JWT_SECRET || 'alw2-explore-secret-change-me';
const COOKIE = 'alw2_token';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function signToken(user) {
  return jwt.sign({ id: user.id, u: user.username }, JWT_SECRET, { expiresIn: '30d' });
}
function auth(req, res, next) {
  const token = req.cookies[COOKIE];
  if (!token) return res.status(401).json({ error: 'not logged in' });
  try {
    const p = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(p.id);
    if (!user) return res.status(401).json({ error: 'user not found' });
    req.user = user;
    next();
  } catch { return res.status(401).json({ error: 'invalid token' }); }
}

// Auth
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !/^[A-Za-z0-9_\u4e00-\u9fa5]{2,16}$/.test(username))
      return res.status(400).json({ error: '用户名需 2-16 位字母/数字/下划线/中文' });
    if (!password || password.length < 4 || password.length > 64)
      return res.status(400).json({ error: '密码需 4-64 位' });
    if (db.findUserByUsername(username))
      return res.status(409).json({ error: '该用户名已被注册' });
    const hash = await bcrypt.hash(password, 10);
    const user = db.createUser({ username, password_hash: hash });
    res.json({ ok: true, user: { id: user.id, username: user.username } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'server error' }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: '缺少参数' });
    const user = db.findUserByUsername(username);
    if (!user) return res.status(401).json({ error: '用户名或密码错误' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: '用户名或密码错误' });
    db.recordLogin(user.id);
    res.cookie(COOKIE, signToken(user), { httpOnly: true, sameSite: 'lax', maxAge: 30*24*3600*1000 });
    res.json({ ok: true, user: { id: user.id, username: user.username } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'server error' }); }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

// Game data - load all user data
app.get('/api/me', auth, (req, res) => {
  const u = req.user;
  const stats = db.getStats(u.id);
  let pets = [];
  try { pets = JSON.parse(stats.pets || '[]'); } catch {}
  res.json({
    user: { id: u.id, username: u.username, login_count: u.login_count },
    save: db.getSave(u.id),
    progress: db.getProgress(u.id),
    placed: db.getPlacedBlocks(u.id),
    achievements: db.getAchievements(u.id),
    xp: Number(stats.xp) || 0,
    level: Number(stats.level) || 1,
    pets: pets,
  });
});

// Save position & tool state
app.post('/api/save', auth, (req, res) => {
  const d = req.body || {};
  db.upsertSave(req.user.id, {
    pos_x: Number(d.pos_x) || 0, pos_y: Number(d.pos_y) || 0, pos_z: Number(d.pos_z) || 0,
    yaw: Number(d.yaw) || 0, pitch: Number(d.pitch) || 0,
    hotbar_slot: Number(d.hotbar_slot) || 0, cur_tool: Number(d.cur_tool) || 0,
  });
  res.json({ ok: true });
});

// Save course progress
app.post('/api/progress', auth, (req, res) => {
  const { course_ids } = req.body || {};
  if (Array.isArray(course_ids)) db.setProgressBatch(req.user.id, course_ids);
  res.json({ ok: true });
});

// Save placed blocks
app.post('/api/blocks', auth, (req, res) => {
  const { blocks } = req.body || {};
  if (Array.isArray(blocks)) db.savePlacedBlocks(req.user.id, blocks);
  res.json({ ok: true });
});

// Save achievements
app.post('/api/achievements', auth, (req, res) => {
  const { achv_ids } = req.body || {};
  if (Array.isArray(achv_ids)) db.saveAchievementsBatch(req.user.id, achv_ids);
  res.json({ ok: true });
});

// Save XP, level, pets
app.post('/api/stats', auth, (req, res) => {
  const { xp, level, pets } = req.body || {};
  db.updateStats(req.user.id, { xp, level, pets });
  res.json({ ok: true });
});

// Root redirect
app.get('/', (req, res) => {
  const token = req.cookies[COOKIE];
  if (!token) return res.redirect('/login.html');
  try { jwt.verify(token, JWT_SECRET); } catch { return res.redirect('/login.html'); }
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

app.listen(PORT, HOST, () => console.log(`[AI学习世界-探索版] http://${HOST}:${PORT}`));
