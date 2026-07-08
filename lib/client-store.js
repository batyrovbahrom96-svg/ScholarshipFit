'use client'

const PROFILE_KEY = 'sf.profile'
const LATEST_RUN_KEY = 'sf.latestRun'
const SAVED_KEY = 'sf.saved'
const FAV_KEY = 'sf.favorites'
const SEARCHES_KEY = 'sf.recentSearches'
const SESSION_KEY = 'sf.advisorSession'

export const store = {
  getProfile() { if (typeof window==='undefined') return null; try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') } catch { return null } },
  setProfile(p) { if (typeof window==='undefined') return; localStorage.setItem(PROFILE_KEY, JSON.stringify(p)) },
  patchProfile(partial) { const cur = this.getProfile() || {}; this.setProfile({ ...cur, ...partial }) },
  getRun() { if (typeof window==='undefined') return null; try { return JSON.parse(localStorage.getItem(LATEST_RUN_KEY) || 'null') } catch { return null } },
  setRun(r) { if (typeof window==='undefined') return; localStorage.setItem(LATEST_RUN_KEY, JSON.stringify(r)) },
  getSaved() { if (typeof window==='undefined') return {}; try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '{}') } catch { return {} } },
  setSavedStatus(id, status) { if (typeof window==='undefined') return; const s = this.getSaved(); s[id] = status; localStorage.setItem(SAVED_KEY, JSON.stringify(s)) },
  getAdvisorSession() { if (typeof window==='undefined') return null; return localStorage.getItem(SESSION_KEY) },
  setAdvisorSession(s) { if (typeof window==='undefined') return; localStorage.setItem(SESSION_KEY, s) },

  /* ---- Favorites (scholarship cabinet) ---- */
  getFavorites() { if (typeof window==='undefined') return []; try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]') } catch { return [] } },
  isFavorite(id) { return this.getFavorites().includes(id) },
  toggleFavorite(id) {
    if (typeof window==='undefined') return false
    const list = this.getFavorites()
    const i = list.indexOf(id)
    if (i === -1) list.push(id); else list.splice(i, 1)
    localStorage.setItem(FAV_KEY, JSON.stringify(list))
    return list.includes(id)
  },

  /* ---- Recent searches (per-user cabinet) ---- */
  getRecentSearches() { if (typeof window==='undefined') return []; try { return JSON.parse(localStorage.getItem(SEARCHES_KEY) || '[]') } catch { return [] } },
  addSearch(s) {
    if (typeof window==='undefined') return
    const list = this.getRecentSearches().filter(x => JSON.stringify(x) !== JSON.stringify(s))
    list.unshift({ ...s, ts: Date.now() })
    localStorage.setItem(SEARCHES_KEY, JSON.stringify(list.slice(0, 8)))
  },
  clearSearches() { if (typeof window==='undefined') return; localStorage.removeItem(SEARCHES_KEY) },
}
