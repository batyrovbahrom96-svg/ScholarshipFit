'use client'

const PROFILE_KEY = 'sf.profile'
const LATEST_RUN_KEY = 'sf.latestRun'
const SAVED_KEY = 'sf.saved'
const SESSION_KEY = 'sf.advisorSession'

export const store = {
  getProfile() { if (typeof window==='undefined') return null; try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') } catch { return null } },
  setProfile(p) { if (typeof window==='undefined') return; localStorage.setItem(PROFILE_KEY, JSON.stringify(p)) },
  getRun() { if (typeof window==='undefined') return null; try { return JSON.parse(localStorage.getItem(LATEST_RUN_KEY) || 'null') } catch { return null } },
  setRun(r) { if (typeof window==='undefined') return; localStorage.setItem(LATEST_RUN_KEY, JSON.stringify(r)) },
  getSaved() { if (typeof window==='undefined') return {}; try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '{}') } catch { return {} } },
  setSavedStatus(id, status) { if (typeof window==='undefined') return; const s = this.getSaved(); s[id] = status; localStorage.setItem(SAVED_KEY, JSON.stringify(s)) },
  getAdvisorSession() { if (typeof window==='undefined') return null; return localStorage.getItem(SESSION_KEY) },
  setAdvisorSession(s) { if (typeof window==='undefined') return; localStorage.setItem(SESSION_KEY, s) },
}
