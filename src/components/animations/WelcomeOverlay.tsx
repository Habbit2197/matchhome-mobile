/**
 * WelcomeOverlay v2 — Intro animada con el logo MatchHome.
 * Secuencia:
 *  0.0s → círculo escala desde 0
 *  0.4s → icono MH aparece con fade+scale
 *  0.9s → "MATCHHOME" se revela de izquierda a derecha
 *  1.4s → tagline aparece
 *  2.2s → todo hace fade out
 *  2.6s → onFinish()
 */
import { useEffect, useRef } from 'react'
import {
  View, Text, Animated, StyleSheet, Dimensions, Easing,
} from 'react-native'
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, G, Circle } from 'react-native-svg'

const { width: W, height: H } = Dimensions.get('window')

// ── Logo MH como SVG (aproximación del logotipo) ─────────────────
function MHLogo({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <SvgGradient id="mhGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%"   stopColor="#7c3aed" />
          <Stop offset="60%"  stopColor="#6366f1" />
          <Stop offset="100%" stopColor="#60a5fa" />
        </SvgGradient>
      </Defs>

      {/* Letra M */}
      <Path
        d="M 20 155 L 20 55 Q 20 45 30 45 Q 40 45 45 55 L 75 115 L 105 55 Q 110 45 120 45 Q 130 45 130 55 L 130 155"
        stroke="url(#mhGrad)"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Barra vertical H izquierda */}
      <Path
        d="M 145 55 L 145 155"
        stroke="url(#mhGrad)"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />

      {/* Barra central H */}
      <Path
        d="M 145 105 L 185 105"
        stroke="url(#mhGrad)"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />

      {/* Barra vertical H derecha */}
      <Path
        d="M 185 55 L 185 155"
        stroke="#60a5fa"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />

      {/* Punto decorativo (como en el logo original) */}
      <Circle cx="132" cy="50" r="8" fill="#ef4444" />
    </Svg>
  )
}

// ── Texto animado letra a letra ───────────────────────────────────
function AnimatedText({ text, delay, style }: { text: string; delay: number; style?: any }) {
  const letters = text.split('')
  const anims   = letters.map(() => useRef(new Animated.Value(0)).current)

  useEffect(() => {
    const animations = letters.map((_, i) =>
      Animated.timing(anims[i], {
        toValue: 1,
        duration: 60,
        delay: delay + i * 55,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    )
    Animated.stagger(55, animations).start()
  }, [])

  return (
    <View style={ss.letterRow}>
      {letters.map((l, i) => (
        <Animated.Text key={i}
          style={[style, {
            opacity: anims[i],
            transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }]}>
          {l}
        </Animated.Text>
      ))}
    </View>
  )
}

// ── Pantalla principal ────────────────────────────────────────────
interface Props { onFinish: () => void; userName?: string }

export default function WelcomeOverlay({ onFinish, userName }: Props) {
  const bgOpacity     = useRef(new Animated.Value(1)).current
  const circleScale   = useRef(new Animated.Value(0)).current
  const logoOpacity   = useRef(new Animated.Value(0)).current
  const logoScale     = useRef(new Animated.Value(0.6)).current
  const taglineOpacity= useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      // 0.0s: círculo aparece
      Animated.spring(circleScale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),

      // 0.4s: logo fade+scale
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]),

      // 1.4s: tagline
      Animated.delay(200),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),

      // 2.2s: esperar y hacer fade out
      Animated.delay(900),
      Animated.timing(bgOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => onFinish())
  }, [])

  return (
    <Animated.View style={[ss.root, { opacity: bgOpacity }]}>
      {/* Fondo oscuro */}
      <View style={ss.bg} />

      {/* Círculo blanco */}
      <Animated.View style={[ss.circle, { transform: [{ scale: circleScale }] }]} />

      {/* Logo */}
      <Animated.View style={[ss.logoWrap, {
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
      }]}>
        <MHLogo size={130} />
      </Animated.View>

      {/* Texto MATCHHOME */}
      <AnimatedText
        text="MATCHHOME"
        delay={700}
        style={ss.brandTxt}
      />

      {/* Tagline */}
      <Animated.View style={{ opacity: taglineOpacity }}>
        <Text style={ss.tagline}>El alquiler inteligente</Text>
      </Animated.View>

      {/* Versión */}
      <Animated.View style={[ss.versionWrap, { opacity: taglineOpacity }]}>
        <Text style={ss.versionTxt}>v1.0</Text>
      </Animated.View>
    </Animated.View>
  )
}

const ss = StyleSheet.create({
  root:    { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  bg:      { ...StyleSheet.absoluteFillObject, backgroundColor: '#0c0f1e' },

  circle:  {
    position: 'absolute',
    width: W * 0.65, height: W * 0.65,
    borderRadius: W * 0.325,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  logoWrap:{ position: 'absolute', alignItems: 'center', justifyContent: 'center', marginTop: -60 },

  letterRow: { flexDirection: 'row', marginTop: 70 },
  brandTxt:  {
    fontSize: 30, fontWeight: '900', color: '#fff',
    letterSpacing: 5,
    textShadowColor: 'rgba(124,58,237,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  tagline:  { fontSize: 14, color: 'rgba(255,255,255,0.55)', letterSpacing: 2, marginTop: 10, fontWeight: '400' },

  versionWrap: { position: 'absolute', bottom: 48 },
  versionTxt:  { fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 },
})
