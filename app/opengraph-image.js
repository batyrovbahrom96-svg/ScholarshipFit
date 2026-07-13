import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ScholarshipFit — 800 hand-verified scholarships, ranked by fit'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#05070A',
          color: 'white',
          position: 'relative',
          fontFamily: 'sans-serif',
          padding: '72px 80px',
        }}
      >
        {/* Gold radial glow top-left */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            left: -140,
            width: 640,
            height: 640,
            borderRadius: 9999,
            background: 'radial-gradient(closest-side, rgba(212,175,55,0.35), rgba(212,175,55,0))',
            display: 'flex',
          }}
        />
        {/* Subtle cyan glow bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: -160,
            right: -140,
            width: 560,
            height: 560,
            borderRadius: 9999,
            background: 'radial-gradient(closest-side, rgba(34,211,238,0.22), rgba(34,211,238,0))',
            display: 'flex',
          }}
        />

        {/* Top row — brand + pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: 'linear-gradient(135deg, #F0D77A 0%, #D4AF37 55%, #8a6a15 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Simple graduation-cap glyph made from a black diamond */}
              <div style={{
                width: 28, height: 28, background: '#0b0b0d',
                clipPath: 'polygon(50% 0, 100% 45%, 50% 90%, 0 45%)',
                display: 'flex',
              }}/>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.3, display: 'flex' }}>
              Scholarship<span style={{ color: '#F0D77A' }}>fit</span>
            </div>
          </div>
          <div style={{
            border: '1px solid rgba(212,175,55,0.45)',
            background: 'rgba(212,175,55,0.08)',
            padding: '10px 20px',
            borderRadius: 999,
            color: '#F0D77A',
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: 0.5,
            display: 'flex',
          }}>
            AI · Source-linked · Deterministic
          </div>
        </div>

        {/* Middle — main headline */}
        <div style={{ marginTop: 90, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2,
            color: 'white', display: 'flex',
          }}>
            Find scholarships
          </div>
          <div style={{
            fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2,
            background: 'linear-gradient(180deg, #ffffff 0%, #F0D77A 55%, #D4AF37 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            display: 'flex',
          }}>
            that fit your profile.
          </div>
          <div style={{
            marginTop: 26, fontSize: 30, color: 'rgba(255,255,255,0.68)',
            fontWeight: 400, lineHeight: 1.35, maxWidth: 900, display: 'flex',
          }}>
            800 hand-verified premium scholarships. No dead links. No aggregator spam.
          </div>
        </div>

        {/* Bottom — trust strip */}
        <div style={{
          marginTop: 'auto', display: 'flex', gap: 14,
          fontSize: 20, color: 'rgba(255,255,255,0.75)',
          alignItems: 'center', flexWrap: 'wrap',
        }}>
          {['800 hand-verified', 'Ranked by fit', 'AI-assisted', '7-day free trial'].map((t, i) => (
            <div key={i} style={{
              padding: '8px 16px',
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: '#D4AF37', display: 'flex' }}/>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
