const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'data.xlsx');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const SCHEMA = {
  users:         ['id','username','password_hash','created_at','login_count','last_login_at'],
  saves:         ['user_id','pos_x','pos_y','pos_z','yaw','pitch','hotbar_slot','cur_tool','updated_at'],
  progress:      ['user_id','course_id','completed_at'],
  placed_blocks: ['user_id','x','y','z','color','glow','glass','ts'],
  achievements:  ['user_id','achv_id','earned_at'],
  stats:         ['user_id','xp','level','pets','updated_at'],
};

const tables = {};

function load() {
  if (fs.existsSync(FILE)) {
    const wb = XLSX.readFile(FILE);
    for (const name of Object.keys(SCHEMA)) {
      tables[name] = wb.SheetNames.includes(name)
        ? XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' })
        : [];
    }
  } else {
    for (const name of Object.keys(SCHEMA)) tables[name] = [];
    flush(true);
  }
}

let flushTimer = null;
let dirty = false;
function flush(sync = false) {
  dirty = true;
  const doFlush = () => {
    const wb = XLSX.utils.book_new();
    for (const [name, cols] of Object.entries(SCHEMA)) {
      const rows = (tables[name] || []).map(r => {
        const o = {};
        for (const c of cols) o[c] = r[c] !== undefined ? r[c] : '';
        return o;
      });
      const ws = XLSX.utils.json_to_sheet(rows, { header: cols });
      XLSX.utils.book_append_sheet(wb, ws, name);
    }
    XLSX.writeFile(wb, FILE);
    dirty = false;
  };
  if (sync) { doFlush(); return; }
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(doFlush, 500);
}

process.on('exit', () => { if (dirty) flush(true); });
process.on('SIGINT', () => { if (dirty) flush(true); process.exit(0); });
process.on('SIGTERM', () => { if (dirty) flush(true); process.exit(0); });

load();

// ===== Users =====
function findUserByUsername(username) {
  return tables.users.find(u => u.username === username) || null;
}
function findUserById(id) {
  return tables.users.find(u => Number(u.id) === Number(id)) || null;
}
function createUser({ username, password_hash }) {
  const id = (tables.users.reduce((m, u) => Math.max(m, Number(u.id) || 0), 0)) + 1;
  const user = { id, username, password_hash, created_at: new Date().toISOString(), login_count: 0, last_login_at: '' };
  tables.users.push(user);
  flush();
  return user;
}
function recordLogin(userId) {
  const u = findUserById(userId);
  if (!u) return;
  u.login_count = (Number(u.login_count) || 0) + 1;
  u.last_login_at = new Date().toISOString();
  flush();
}

// ===== Saves =====
function getSave(userId) {
  return tables.saves.find(s => Number(s.user_id) === Number(userId)) || null;
}
function upsertSave(userId, data) {
  let s = getSave(userId);
  const now = new Date().toISOString();
  if (!s) { s = { user_id: userId, ...data, updated_at: now }; tables.saves.push(s); }
  else Object.assign(s, data, { updated_at: now });
  flush();
  return s;
}

// ===== Progress =====
function getProgress(userId) {
  return tables.progress
    .filter(p => Number(p.user_id) === Number(userId))
    .map(p => p.course_id);
}
function setProgressBatch(userId, courseIds) {
  const existing = new Set(getProgress(userId));
  for (const cid of courseIds) {
    if (!existing.has(cid)) {
      tables.progress.push({ user_id: userId, course_id: cid, completed_at: new Date().toISOString() });
    }
  }
  flush();
}

// ===== Placed blocks =====
function getPlacedBlocks(userId) {
  return tables.placed_blocks
    .filter(b => Number(b.user_id) === Number(userId))
    .map(b => ({ x: Number(b.x), y: Number(b.y), z: Number(b.z), c: Number(b.color), glow: b.glow === true || b.glow === 'true', glass: b.glass === true || b.glass === 'true' }));
}
function savePlacedBlocks(userId, blocks) {
  tables.placed_blocks = tables.placed_blocks.filter(b => Number(b.user_id) !== Number(userId));
  for (const b of blocks) {
    tables.placed_blocks.push({ user_id: userId, x: b.x, y: b.y, z: b.z, color: b.c, glow: b.glow || false, glass: b.glass || false, ts: new Date().toISOString() });
  }
  flush();
}

// ===== Achievements =====
function getAchievements(userId) {
  return tables.achievements
    .filter(a => Number(a.user_id) === Number(userId))
    .map(a => a.achv_id);
}
function saveAchievementsBatch(userId, achvIds) {
  const existing = new Set(getAchievements(userId));
  for (const aid of achvIds) {
    if (!existing.has(aid)) {
      tables.achievements.push({ user_id: userId, achv_id: aid, earned_at: new Date().toISOString() });
    }
  }
  flush();
}

// ===== Stats (XP, Level, Pets) =====
function getStats(userId) {
  let s = tables.stats.find(s => Number(s.user_id) === Number(userId));
  if (!s) {
    s = { user_id: userId, xp: 0, level: 1, pets: '[]', updated_at: new Date().toISOString() };
    tables.stats.push(s);
  }
  return s;
}
function updateStats(userId, { xp, level, pets }) {
  const s = getStats(userId);
  if (xp !== undefined) s.xp = Number(xp) || 0;
  if (level !== undefined) s.level = Number(level) || 1;
  if (pets !== undefined) s.pets = typeof pets === 'string' ? pets : JSON.stringify(pets);
  s.updated_at = new Date().toISOString();
  flush();
  return s;
}

module.exports = {
  findUserByUsername, findUserById, createUser, recordLogin,
  getSave, upsertSave,
  getProgress, setProgressBatch,
  getPlacedBlocks, savePlacedBlocks,
  getAchievements, saveAchievementsBatch,
  getStats, updateStats,
  flushSync: () => flush(true),
};
