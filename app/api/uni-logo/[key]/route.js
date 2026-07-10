import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

// Server-side proxy for the university logos in /public/logos/.
// This exists as a defensive backup in case the deploy target does not serve
// static /public/logos/*.png files (as observed on scholarshipfit.com prod).
// Files are read from the filesystem at runtime and returned with long-lived
// caching headers.

const ALLOWED = new Set([
  'harvard', 'yale', 'princeton', 'columbia', 'upenn', 'brown',
  'dartmouth', 'cornell', 'stanford', 'mit', 'oxford', 'cambridge',
  'imperial', 'ethz', 'nus',
])

export const dynamic = 'force-static'

export async function GET(_request, { params }) {
  const p = await params
  const key = (p?.key || '').toLowerCase().replace(/\.png$/, '')
  if (!ALLOWED.has(key)) {
    return NextResponse.json({ error: 'unknown logo key' }, { status: 404 })
  }
  try {
    const file = path.join(process.cwd(), 'public', 'logos', `${key}.png`)
    const buf = await readFile(file)
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Logo-Source': 'server-fs',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'logo not found', key }, { status: 404 })
  }
}
