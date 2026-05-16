/**
 * OnboardingScreen — Tutorial de primera vez.
 * Se muestra SOLO la primera vez que el usuario abre la app tras registrarse.
 * Se guarda en AsyncStorage para no volver a mostrarlo.
 */
import { useRef, useState } from 'react'
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, Animated, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width: W, height: H } = Dimensions.get('window')

const SLIDES = [
  {
    id: '1',
    icon: 'sparkles' as const,
    iconBg: '#f5f3ff',
    iconColor: '#7c3aed',
    tag: 'Descubre',
    tagColor: '#7c3aed',
    tagBg: '#f5f3ff',
    title: 'Pisos hechos\npara ti',
    desc: 'Nuestro algoritmo analiza 10 factores de tu perfil y te muestra solo los pisos que realmente encajan contigo. Sin ruido, sin perder tiempo.',
    visual: ['🏠', '💜', '✓'],
    gradient: ['#7c3aed', '#6366f1'],
  },
  {
    id: '2',
    icon: 'heart' as const,
    iconBg: '#fef2f2',
    iconColor: '#ef4444',
    tag: 'Match',
    tagColor: '#ef4444',
    tagBg: '#fef2f2',
    title: 'Desliza y\nhaz Match',
    desc: 'Desliza a la derecha si te gusta un piso. El propietario recibirá tu perfil y decidirá si encajáis. Como Tinder, pero para encontrar tu hogar.',
    visual: ['👈', '🏠', '👉'],
    gradient: ['#ef4444', '#f97316'],
  },
  {
    id: '3',
    icon: 'chatbubble-ellipses' as const,
    iconBg: '#ecfdf5',
    iconColor: '#059669',
    tag: 'Habla directamente',
    tagColor: '#059669',
    tagBg: '#ecfdf5',
    title: 'Chat sin\nintermediarios',
    desc: 'Cuando el propietario te acepte, desbloquea el chat por 5€ (pago único). Habla, coordina visitas y negocia directamente, sin agencias ni comisiones.',
    visual: ['💬', '5€', '🔓'],
    gradient: ['#059669', '#0891b2'],
  },
  {
    id: '4',
    icon: 'document-text' as const,
    iconBg: '#fffbeb',
    iconColor: '#d97706',
    tag: 'Todo digital',
    tagColor: '#d97706',
    tagBg: '#fffbeb',
    title: 'Contrato\ndigital seguro',
    desc: 'Firma el contrato de alquiler digitalmente desde la app. Con validez legal según la LAU. Sin papeles, sin notarios, sin estrés.',
    visual: ['📝', '✍️', '✅'],
    gradient: ['#d97706', '#7c3aed'],
  },
]

interface Props { onFinish: () => void }

export default function OnboardingScreen({ onFinish }: Props) {
  const [current, setCurrent] = useState(0)
  const flatRef = useRef<FlatList>(null)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const goTo = (index: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start()
    setCurrent(index)
    flatRef.current?.scrollToIndex({ index, animated: true })
  }

  const next = () => {
    if (current < SLIDES.length - 1) goTo(current + 1)
    else finish()
  }

  const finish = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true')
    onFinish()
  }

  const slide = SLIDES[current]

  return (
    <View style={ss.root}>
      {/* Background suave */}
      <View style={ss.bg} />

      {/* Skip */}
      {current < SLIDES.length - 1 && (
        <TouchableOpacity onPress={finish} style={ss.skipBtn}>
          <Text style={ss.skipTxt}>Saltar</Text>
        </TouchableOpacity>
      )}

      {/* FlatList (horizontal, oculta — solo para scrollToIndex) */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal pagingEnabled scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={s => s.id}
        renderItem={() => null}
        style={{ position: 'absolute', opacity: 0, height: 1 }}
      />

      {/* Contenido animado */}
      <Animated.View style={[ss.content, { opacity: fadeAnim }]}>
        {/* Visual grande */}
        <View style={ss.visual}>
          <View style={[ss.iconCircle, { backgroundColor: slide.iconBg }]}>
            <Ionicons name={slide.icon} size={52} color={slide.iconColor} />
          </View>
          <View style={ss.emojis}>
            {slide.visual.map((e, i) => (
              <View key={i} style={[ss.emojiChip, { transform: [{ rotate: i === 1 ? '0deg' : i === 0 ? '-6deg' : '6deg' }] }]}>
                <Text style={ss.emojiTxt}>{e}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tag */}
        <View style={[ss.tag, { backgroundColor: slide.tagBg }]}>
          <Text style={[ss.tagTxt, { color: slide.tagColor }]}>{slide.tag}</Text>
        </View>

        {/* Título */}
        <Text style={ss.title}>{slide.title}</Text>

        {/* Descripción */}
        <Text style={ss.desc}>{slide.desc}</Text>
      </Animated.View>

      {/* Dots */}
      <View style={ss.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <Animated.View style={[ss.dot, i === current && ss.dotActive,
              i === current && { backgroundColor: slide.iconColor }]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity onPress={next}
        style={[ss.cta, { backgroundColor: slide.iconColor }]}>
        <Text style={ss.ctaTxt}>
          {current < SLIDES.length - 1 ? 'Siguiente' : '¡Empezar ahora!'}
        </Text>
        <Ionicons
          name={current < SLIDES.length - 1 ? 'arrow-forward' : 'checkmark-circle'}
          size={20} color="#fff" />
      </TouchableOpacity>

      {/* Paso X de Y */}
      <Text style={ss.step}>{current + 1} de {SLIDES.length}</Text>
    </View>
  )
}

const ss = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center' },
  bg:     { ...StyleSheet.absoluteFillObject, backgroundColor: '#f8f9ff' },

  skipBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 24, right: 24, zIndex: 10 },
  skipTxt: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },

  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 40 },

  visual:     { alignItems: 'center', marginBottom: 32 },
  iconCircle: { width: 110, height: 110, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  emojis:     { flexDirection: 'row', gap: 12 },
  emojiChip:  { width: 48, height: 48, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  emojiTxt:   { fontSize: 22 },

  tag:    { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 14 },
  tagTxt: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', textAlign: 'center',
    lineHeight: 38, letterSpacing: -0.5, marginBottom: 16 },
  desc:  { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 24, fontWeight: '400' },

  dots:     { flexDirection: 'row', gap: 8, marginBottom: 20 },
  dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e2e8f0' },
  dotActive:{ width: 24 },

  cta:  { flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 32, paddingVertical: 16, borderRadius: 20, marginHorizontal: 24, alignSelf: 'stretch',
    shadowColor: '#7c3aed', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  ctaTxt: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#fff' },

  step: { fontSize: 12, color: '#94a3b8', marginTop: 12, marginBottom: Platform.OS === 'ios' ? 34 : 20 },
})
