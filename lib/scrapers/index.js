// Scraper orchestrator.
// Runs every registered scraper, upserts results into MongoDB, and returns
// per-source stats. Idempotent — safe to run every night.
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import * as chevening from './chevening'
import * as daad from './daad'
import * as commonwealth from './commonwealth'

const SCRAPERS = [chevening, daad, commonwealth]

let _client
async function db() {
  if (!_client) {
    _client = new MongoClient(process.env.MONGO_URL)
    await _client.connect()
  }
  return _client.db(process.env.DB_NAME)
}

export async function runAllScrapers({ dryRun = false } = {}) {
  const database = await db()
  const col = database.collection('scholarships')
  await col.createIndex({ dedup_key: 1 }, { unique: false, sparse: true }).catch(() => {})
  await col.createIndex({ slug: 1 }, { unique: true, sparse: true }).catch(() => {})
  await col.createIndex({ scraper_source: 1 }).catch(() => {})

  const startedAt = new Date()
  const perSource = []

  for (const scraper of SCRAPERS) {
    const sStart = Date.now()
    let recs = []
    let error = null
    try {
      recs = await scraper.run()
    } catch (e) {
      error = e?.message || String(e)
      recs = []
    }

    let inserted = 0
    let updated = 0
    if (!dryRun && recs.length) {
      // Bulk upsert by slug (stable identifier). Preserve existing id and
      // created_at; refresh mutable fields.
      const ops = recs.map((r) => ({
        updateOne: {
          filter: { slug: r.slug },
          update: {
            $setOnInsert: {
              id: uuidv4(),
              public_status: 'public',
              verification_status: r.trust_level || 'Source-linked',
              created_at: new Date(),
              first_scraped_at: new Date(),
            },
            $set: {
              ...r,
              last_checked: new Date(),
            },
          },
          upsert: true,
        },
      }))
      const res = await col.bulkWrite(ops, { ordered: false }).catch((e) => {
        error = error || (e?.message || String(e))
        return null
      })
      if (res) {
        inserted = res.upsertedCount || 0
        updated  = res.modifiedCount || 0
      }
    }

    perSource.push({
      source:      scraper.NAME,
      source_name: scraper.SOURCE?.name || scraper.NAME,
      source_url:  scraper.SOURCE?.url || '',
      records_emitted: recs.length,
      inserted,
      updated,
      duration_ms: Date.now() - sStart,
      error,
    })
  }

  const total_count = await col.countDocuments({ public_status: { $ne: 'hidden' } })
  const durationMs = Date.now() - startedAt.getTime()

  // Persist a run history record so /admin/scraping can display trends
  try {
    await database.collection('scraper_runs').insertOne({
      id: uuidv4(),
      started_at: startedAt,
      duration_ms: durationMs,
      dry_run: dryRun,
      per_source: perSource,
      total_scholarships_after: total_count,
      created_at: new Date(),
    })
  } catch (_) { /* ignore */ }

  return {
    ok: true,
    dry_run: dryRun,
    duration_ms: durationMs,
    started_at: startedAt.toISOString(),
    total_scholarships_after: total_count,
    per_source: perSource,
  }
}

export function listScrapers() {
  return SCRAPERS.map((s) => ({ name: s.NAME, source: s.SOURCE }))
}
