/**
 * Splash de bienvenida nativo para mobile.
 *
 * Equivalente al WelcomeOverlay del web. Aparece superpuesto a la app
 * justo después del login. Saludo dinámico + barra de progreso animada
 * + fade-out. Usa AsyncStorage para mostrarse solo una vez por sesión.
 */
import { useEffect, useRef } from "react"
import { Animated, Easing, StyleSheet, Text, View, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

interface Props {
  userName: string
  onFinish: () => void
  durationMs?: number
}

export default function WelcomeOverlay({ userName, onFinish, durationMs = 2800 }: Props) {
  const opacity   = useRef(new Animated.Value(0)).current   // fade del overlay completo
  const slideY    = useRef(new Animated.Value(20)).current  // entrada del texto
  const progress  = useRef(new Animated.Value(0)).current   // ancho de la barra

  const greeting  = getGreetingByHour()
  const firstName = (userName || "").split(" ")[0] || "Bienvenido"

  useEffect(() => {
    // Fade-in + slide-up del texto en paralelo
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideY,  { toValue: 0, duration: 500, delay: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start()

    // Barra de carga sincronizada con durationMs
    Animated.timing(progress, {
      toValue: 1, duration: durationMs, delay: 200,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start()

    // Fade-out tras la duración
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0, duration: 500, easing: Easing.in(Easing.cubic), useNativeDriver: true,
      }).start(() => onFinish())
    }, durationMs + 300)

    return () => clearTimeout(t)
  }, [durationMs, opacity, slideY, progress, onFinish])

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] })

  return (
    <Animated.View pointerEvents="none" style={[styles.root, { opacity }]}>
      <LinearGradient
        colors={["#6366f1", "#8b5cf6", "#d946ef"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={[styles.center, { transform: [{ translateY: slideY }] }]}>
        {/* Logo */}
        <View style={styles.logoBadge}>
          <View style={styles.logoSquare}><Text style={styles.logoLetter}>M</Text></View>
          <Text style={styles.logoText}>MatchHome</Text>
        </View>

        {/* Saludo */}
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.name}>{firstName} 👋</Text>
        <Text style={styles.subtitle}>Tu próxima casa te está esperando.</Text>

        {/* Barra de carga */}
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth }]} />
        </View>
        <Text style={styles.loadingLabel}>CARGANDO TU ESPACIO…</Text>
      </Animated.View>
    </Animated.View>
  )
}

function getGreetingByHour(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 13)  return "Buenos días"
  if (h >= 13 && h < 21) return "Buenas tardes"
  return "Buenas noches"
}

const { width } = Dimensions.get("window")

const styles = StyleSheet.create({
  root: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100,
    justifyContent: "center", alignItems: "center",
  },
  center: { alignItems: "center", paddingHorizontal: 32 },

  logoBadge: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.25)", borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 16, marginBottom: 32,
  },
  logoSquare: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  logoLetter: { fontSize: 20, fontWeight: "900", color: "#6366f1" },
  logoText:   { fontSize: 18, fontWeight: "900", color: "#fff" },

  greeting: { fontSize: 36, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 4 },
  name:     { fontSize: 36, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 14 },
  subtitle: { fontSize: 15, color: "rgba(237, 233, 254, 0.95)", textAlign: "center", marginBottom: 36 },

  barTrack: {
    width: Math.min(width * 0.7, 280),
    height: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 3,
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 10,
    letterSpacing: 1.5,
    color: "rgba(237, 233, 254, 0.7)",
    fontWeight: "600",
  },
})
