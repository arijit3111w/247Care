// Chat session storage with 24h expiry
// Data shape:
// export interface StoredChatMessage { id: string; type: 'user' | 'bot'; content: string; timestamp: number }
// export interface StoredChatSession { id: string; createdAt: number; messages: StoredChatMessage[]; title?: string }

const STORAGE_KEY = 'chat_sessions_v1';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function now() { return Date.now(); }

function readRaw() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeRaw(sessions) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // ignore quota errors
  }
}

export function pruneExpired(sessions) {
  const cutoff = now() - EXPIRY_MS;
  return sessions.filter(s => s.createdAt >= cutoff);
}

export function loadSessions() {
  const sessions = pruneExpired(readRaw());
  // Persist pruning results if any removed
  writeRaw(sessions);
  return sessions;
}

export function saveSessions(sessions) {
  writeRaw(pruneExpired(sessions));
}

export function createSession() {
  return { id: crypto.randomUUID(), createdAt: now(), messages: [], title: undefined };
}

export function getSession(id) {
  return loadSessions().find(s => s.id === id);
}

export function upsertSession(session) {
  const sessions = loadSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session; else sessions.push(session);
  saveSessions(sessions);
  return sessions;
}

export function appendMessage(sessionId, message) {
  const existing = getSession(sessionId) || { id: sessionId, createdAt: now(), messages: [] };
  existing.messages.push(message);
  upsertSession(existing);
  return existing;
}

export function replaceMessages(sessionId, messages) {
  const existing = getSession(sessionId) || { id: sessionId, createdAt: now(), messages: [] };
  existing.messages = messages;
  upsertSession(existing);
  return existing;
}

export function setSessionTitle(sessionId, title) {
  const sessions = loadSessions();
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx === -1) return undefined;
  if (!sessions[idx].title) { // only set if not already set
    sessions[idx].title = title;
    saveSessions(sessions);
  }
  return sessions[idx];
}
