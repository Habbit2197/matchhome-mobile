/**
 * WelcomeOverlay v3 — Animación caligráfica estilo Apple "Hello".
 *
 * Secuencia:
 *  0.0s  → fondo oscuro
 *  0.1s  → M se dibuja sola (trazo único, 800ms)
 *  0.9s  → H aparece (3 trazos en cascada, 450ms)
 *  1.4s  → glow pulse en todos los trazos
 *  1.6s  → "MATCHHOME" se desvanece letra a letra
 *  2.0s  → tagline
 *  2.8s  → fade out global → onFinish()
 *
 * Técnica: strokeDashoffset de la longitud del trazo → 0
 * (idéntico al efecto "escribir" de los videos Apple)
 */
import { useEffect, useRef } from 'react'
import {
  View, Text, Animated, StyleSheet, Dimensions, Easing,
} from 'react-native'
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg'

const { width: W } = Dimensions.get('window')

/* ── Longitudes de trazos (líneas rectas: exactas; Bezier: aproximadas) ── */
const M_LEN     = 390   // M cursiva (Bezier)
const H_L_LEN   = 100   // Barra izquierda H
const H_B_LEN   = 44    // Barra horizontal H
const H_R_LEN   = 100   // Barra derecha H

/* ── Componentes animados de SVG ───────────────────────────────────────── */
const AnimPath = Animated.createAnimatedComponent(Path as any)

/* ── Función de easing tipo escritura a mano ───────────────────────────── */
const penEase = Easing.bezier(0.22, 1.0, 0.36, 1.0)

function draw(
  anim: Animated.Value,
  to: number,
  duration: number,
  delay = 0,
): Animated.CompositeAnimation {
  return Animated.timing(anim, {
    toValue: to, duration, delay,
    easing: penEase,
    useNativeDriver: false,   // strokeDashoffset requiere JS driver
  })
}

/* ── Texto letra a letra ────────────────────────────────────────────────── */
function StaggerText({ text, delay, style }: { text: string; delay: number; style?: any }) {
  const anims = useRef(text.split('').map(() => new Animated.Value(0))).current

  useEffect(() => {
    const animations = anims.map((a, i) =>
      Animated.timing(a, {
        toValue: 1, duration: 60, delay: delay + i * 50,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      })
    )
    Animated.stagger(50, animations).start()
  }, [])

  return (
    <View style={{ flexDirection: 'row' }}>
      {text.split('').map((c, i) => (
        <Animated.Text key={i} style={[style, {
          opacity: anims[i],
          transform: [{ translateY: anims[i].interpolate({ inputRange: [0,1], outputRange: [10,0] }) }],
        }]}>{c}</Animated.Text>
      ))}
    </View>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════════════════ */
interface Props { onFinish: () => void; userName?: string }

export default function WelcomeOverlay({ onFinish }: Props) {
  /* Trazos */
  const mDash  = useRef(new Animated.Value(M_LEN)).current
  const h1Dash = useRef(new Animated.Value(H_L_LEN)).current
  const hbDash = useRef(new Animated.Value(H_B_LEN)).current
  const h2Dash = useRef(new Animated.Value(H_R_LEN)).current

  /* Glow y elementos de UI */
  const glowA     = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(1)).current
  const textA     = useRef(new Animated.Value(0)).current
  const tagA      = useRef(new Animated.Value(0)).current
  const rootA     = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.sequence([
      /* 0.1s: aparece el círculo de fondo */
      Animated.delay(100),

      /* DIBUJAR M (800ms) */
      draw(mDash, 0, 800),

      /* DIBUJAR H en cascada (empiezan a solapar con el final de M) */
      Animated.parallel([
        draw(h1Dash, 0, 250),
        draw(hbDash, 0, 180, 180),
        draw(h2Dash, 0, 250, 250),
      ]),

      /* GLOW: pulse suave */
      Animated.parallel([
        Animated.timing(glowA,  { toValue: 0.55, duration: 350, useNativeDriver: false }),
        Animated.spring(logoScale, { toValue: 1.04, friction: 5, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1.00, duration: 400, delay: 200, useNativeDriver: true }),
      ]),

      /* TEXTO "MATCHHOME" */
      Animated.timing(textA, { toValue: 1, duration: 50, useNativeDriver: true }),

      /* TAGLINE */
      Animated.delay(300),
      Animated.timing(tagA, { toValue: 1, duration: 400, useNativeDriver: true }),

      /* ESPERAR */
      Animated.delay(900),

      /* FADE OUT */
      Animated.timing(rootA, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => onFinish())
  }, [])

  return (
    <Animated.View style={[ss.root, { opacity: rootA }]} pointerEvents="none">
      {/* Fondo */}
      <View style={ss.bg} />

      {/* Halo detrás del logo */}
      <View style={ss.halo} />

      {/* ─── Logo SVG ───────────────────────────────────────────────── */}
      <Animated.View style={[ss.logoWrap, { transform: [{ scale: logoScale }] }]}>
        <Svg width={230} height={170} viewBox="0 0 230 170">
          <Defs>
            {/* Gradiente principal */}
            <SvgGrad id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%"    stopColor="#7c3aed" />
              <Stop offset="55%"   stopColor="#6366f1" />
              <Stop offset="100%"  stopColor="#60a5fa" />
            </SvgGrad>
            {/* Gradiente glow (más claro) */}
            <SvgGrad id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%"   stopColor="#a78bfa" />
              <Stop offset="100%" stopColor="#93c5fd" />
            </SvgGrad>
          </Defs>

          {/* ─ M — capa de glow (trazo ancho, semi-opaco) ─ */}
          <AnimPath
            d="M 28,152 C 28,90 26,50 38,47 C 52,43 63,88 76,106 C 89,88 100,43 114,47 C 126,50 124,90 124,152"
            stroke="#a78bfa"
            strokeWidth="28"
            strokeLinecap="round" strokeLinejoin="round" fill="none"
            opacity={glowA}
            strokeDasharray={`${M_LEN}`}
            strokeDashoffset={mDash}
          />
          {/* ─ M — trazo principal ─ */}
          <AnimPath
            d="M 28,152 C 28,90 26,50 38,47 C 52,43 63,88 76,106 C 89,88 100,43 114,47 C 126,50 124,90 124,152"
            stroke="url(#g1)"
            strokeWidth="14"
            strokeLinecap="round" strokeLinejoin="round" fill="none"
            strokeDasharray={`${M_LEN}`}
            strokeDashoffset={mDash}
          />

          {/* ─ H barra izquierda — glow ─ */}
          <AnimPath
            d="M 145,152 L 145,47"
            stroke="#a78bfa" strokeWidth="28" strokeLinecap="round" fill="none"
            opacity={glowA}
            strokeDasharray={`${H_L_LEN}`}
            strokeDashoffset={h1Dash}
          />
          {/* ─ H barra izquierda ─ */}
          <AnimPath
            d="M 145,152 L 145,47"
            stroke="url(#g1)" strokeWidth="14" strokeLinecap="round" fill="none"
            strokeDasharray={`${H_L_LEN}`}
            strokeDashoffset={h1Dash}
          />

          {/* ─ H barra central ─ */}
          <AnimPath
            d="M 145,99 L 189,99"
            stroke="url(#g1)" strokeWidth="14" strokeLinecap="round" fill="none"
            strokeDasharray={`${H_B_LEN}`}
            strokeDashoffset={hbDash}
          />

          {/* ─ H barra derecha — glow ─ */}
          <AnimPath
            d="M 189,47 L 189,152"
            stroke="#93c5fd" strokeWidth="28" strokeLinecap="round" fill="none"
            opacity={glowA}
            strokeDasharray={`${H_R_LEN}`}
            strokeDashoffset={h2Dash}
          />
          {/* ─ H barra derecha ─ */}
          <AnimPath
            d="M 189,47 L 189,152"
            stroke="#60a5fa" strokeWidth="14" strokeLinecap="round" fill="none"
            strokeDasharray={`${H_R_LEN}`}
            strokeDashoffset={h2Dash}
          />
        </Svg>
      </Animated.View>

      {/* ─── Texto MATCHHOME ──────────────────────────────────────── */}
      <View style={ss.textRow}>
        {textA.__getValue() !== undefined && (
          <StaggerText
            text="MATCHHOME"
            delay={1450}
            style={ss.brand}
          />
        )}
        <Animated.Text style={[ss.brand, { opacity: textA }]}>
          MATCHHOME
        </Animated.Text>
      </View>

      {/* ─── Tagline ──────────────────────────────────────────────── */}
      <Animated.Text style={[ss.tagline, { opacity: tagA }]}>
        El alquiler inteligente
      </Animated.Text>

      {/* Versión */}
      <Animated.View style={[ss.versionWrap, { opacity: tagA }]}>
        <Text style={ss.version}>v1.0</Text>
      </Animated.View>
    </Animated.View>
  )
}

const ss = StyleSheet.create({
  root:    { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  bg:      { ...StyleSheet.absoluteFillObject, backgroundColor: '#07070f' },

  /* Halo detrás del logo, como el círculo del logo original */
  halo: {
    position: 'absolute',
    width: W * 0.62, height: W * 0.62,
    borderRadius: W * 0.31,
    backgroundColor: 'rgba(124,58,237,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.12)',
  },

  logoWrap: { marginBottom: 18 },

  /* Fila de texto — se usan DOS enfoques para garantizar que funcione */
  textRow: { position: 'relative', height: 40, justifyContent: 'center' },

  brand: {
    fontSize: 28, fontWeight: '900', color: '#fff',
    letterSpacing: 7,
    textShadowColor: 'rgba(99,102,241,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  tagline: {
    fontSize: 13, color: 'rgba(255,255,255,0.45)',
    letterSpacing: 3.5, marginTop: 10, fontWeight: '300',
  },
  versionWrap: { position: 'absolute', bottom: 44 },
  version: { fontSize: 11, color: 'rgba(255,255,255,0.15)', letterSpacing: 1.5 },
})
