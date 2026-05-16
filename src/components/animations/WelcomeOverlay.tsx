/**
 * WelcomeOverlay v4 — Intro animada 100% compatible con Expo Go.
 * NO usa SVG ni strokeDashoffset (incompatibles con Expo Go sin build nativa).
 *
 * Secuencia:
 *  0.0s  → fondo negro
 *  0.2s  → círculo de fondo escala (spring)
 *  0.4s  → logo escala desde 0 + fade (spring)
 *  1.1s  → "MATCHHOME" se escribe letra a letra
 *  1.8s  → tagline aparece
 *  2.6s  → fade out global → onFinish()
 */
import { useEffect, useRef, useState } from 'react'
import {
  View, Text, Animated, StyleSheet, Dimensions, Easing,
  Image as RNImage,
} from 'react-native'

const { width: W, height: H } = Dimensions.get('window')

// ── Efecto "escribir" letra a letra ──────────────────────────────
function Typewriter({ text, startDelay, style, onDone }: {
  text: string; startDelay: number; style?: any; onDone?: () => void
}) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    let i = 0
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) { clearInterval(interval); onDone?.() }
      }, 65)
      return () => clearInterval(interval)
    }, startDelay)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={style}>{displayed}</Text>
      {/* Cursor parpadeante */}
      {displayed.length < text.length && displayed.length > 0 && (
        <BlinkCursor style={style} />
      )}
    </View>
  )
}

function BlinkCursor({ style }: { style?: any }) {
  const opacity = useRef(new Animated.Value(1)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ])
    ).start()
  }, [])
  return <Animated.Text style={[style, { opacity }]}>|</Animated.Text>
}

// ── Componente principal ─────────────────────────────────────────
interface Props { onFinish: () => void; userName?: string }

export default function WelcomeOverlay({ onFinish }: Props) {
  /* Animaciones */
  const bgOpacity    = useRef(new Animated.Value(0)).current
  const circleScale  = useRef(new Animated.Value(0)).current
  const logoScale    = useRef(new Animated.Value(0)).current
  const logoOpacity  = useRef(new Animated.Value(0)).current
  const glowOpacity  = useRef(new Animated.Value(0)).current
  const taglineA     = useRef(new Animated.Value(0)).current
  const rootOpacity  = useRef(new Animated.Value(1)).current

  const [showText,    setShowText]    = useState(false)
  const [showTagline, setShowTagline] = useState(false)

  useEffect(() => {
    Animated.sequence([
      // 1. Fondo aparece
      Animated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),

      // 2. Círculo halo (spring)
      Animated.spring(circleScale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),

      // 3. Logo escala con spring + glow
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.6, duration: 600, useNativeDriver: true }),
      ]),

      // 4. "Escribir" el texto — activar después de 200ms
      Animated.delay(200),
    ]).start(() => setShowText(true))
  }, [])

  const handleTextDone = () => {
    // Tagline aparece 400ms después de que acabe el texto
    setTimeout(() => {
      Animated.timing(taglineA, { toValue: 1, duration: 400, useNativeDriver: true })
        .start(() => {
          setShowTagline(true)
          // Hold 1 segundo y hacer fade out
          setTimeout(() => {
            Animated.timing(rootOpacity, { toValue: 0, duration: 600, useNativeDriver: true })
              .start(() => onFinish())
          }, 1000)
        })
    }, 400)
  }

  return (
    <Animated.View style={[ss.root, { opacity: rootOpacity }]}>
      {/* Fondo oscuro */}
      <Animated.View style={[ss.bg, { opacity: bgOpacity }]} />

      {/* Halo detrás del logo */}
      <Animated.View style={[ss.halo, { transform: [{ scale: circleScale }] }]} />

      {/* Glow difuso */}
      <Animated.View style={[ss.glow, { opacity: glowOpacity }]} />

      {/* Logo */}
      <Animated.View style={[ss.logoWrap, {
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
      }]}>
        {/* Usamos la imagen del logo — asegúrate de tenerla en assets/ */}
        <RNImage
          source={require('../../../assets/logo.png')}
          style={ss.logoImg}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Texto MATCHHOME (typewriter) */}
      <View style={ss.textWrap}>
        {showText && (
          <Typewriter
            text="MATCHHOME"
            startDelay={0}
            onDone={handleTextDone}
            style={ss.brand}
          />
        )}
      </View>

      {/* Tagline */}
      <Animated.View style={{ opacity: taglineA }}>
        <Text style={ss.tagline}>El alquiler inteligente</Text>
      </Animated.View>

      {/* Versión */}
      <Animated.View style={[ss.versionWrap, { opacity: taglineA }]}>
        <Text style={ss.version}>v1.0</Text>
      </Animated.View>
    </Animated.View>
  )
}

const ss = StyleSheet.create({
  root: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  },
  bg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0a0a18',
  },

  /* Círculo halo detrás del logo */
  halo: {
    position: 'absolute',
    width: W * 0.60, height: W * 0.60,
    borderRadius: W * 0.30,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.18)',
  },

  /* Glow difuso violeta */
  glow: {
    position: 'absolute',
    width: W * 0.80, height: W * 0.80,
    borderRadius: W * 0.40,
    backgroundColor: 'rgba(99,102,241,0.06)',
  },

  logoWrap: { marginBottom: 28 },
  logoImg:  { width: W * 0.40, height: W * 0.40 },

  textWrap: { height: 46, justifyContent: 'center' },
  brand: {
    fontSize: 29, fontWeight: '900', color: '#ffffff',
    letterSpacing: 7,
    textShadowColor: 'rgba(124,58,237,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 13, color: 'rgba(255,255,255,0.45)',
    letterSpacing: 3.5, marginTop: 10, fontWeight: '300',
    textAlign: 'center',
  },

  versionWrap: { position: 'absolute', bottom: 52 },
  version: { fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: 1.5 },
})
