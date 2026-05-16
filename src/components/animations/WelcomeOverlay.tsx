/**
 * WelcomeOverlay v5 — Animación de escritura real del logo MH.
 * 
 * Usa WebView con CSS SVG animation (strokeDashoffset).
 * Es la ÚNICA forma de hacer stroke-drawing en Expo Go.
 * 
 * Instalar: npx expo install react-native-webview
 */
import { useRef } from 'react'
import { StyleSheet, Dimensions } from 'react-native'
import WebView from 'react-native-webview'

const { width: W, height: H } = Dimensions.get('window')

// ─── La animación completa en HTML/CSS ─────────────────────────────
const HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{
  width:100%;height:100%;
  background:#07070f;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  overflow:hidden;
  font-family:-apple-system,sans-serif;
}

/* ── SVG trazos ── */
.logo-wrap{
  position:relative;
  width:260px;height:180px;
  display:flex;align-items:center;justify-content:center;
}

/* Halo detrás */
.halo{
  position:absolute;
  width:220px;height:220px;
  border-radius:110px;
  border:1.5px solid rgba(124,58,237,0.18);
  background:radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%);
  animation:haloIn 0.4s ease-out forwards;
  opacity:0;
}
@keyframes haloIn{to{opacity:1}}

path{
  fill:none;
  stroke-linecap:round;
  stroke-linejoin:round;
}

/* M — único trazo continuo, se dibuja en 1s */
.m{
  stroke:url(#g);
  stroke-width:14;
  pathLength:1;
  stroke-dasharray:1;
  stroke-dashoffset:1;
  animation:draw 0.9s cubic-bezier(0.35,0.0,0.25,1.0) 0.3s forwards;
}

/* H barra izquierda */
.h1{
  stroke:url(#g);
  stroke-width:14;
  pathLength:1;
  stroke-dasharray:1;
  stroke-dashoffset:1;
  animation:draw 0.28s ease-out 1.3s forwards;
}

/* H barra central */
.hb{
  stroke:url(#g);
  stroke-width:14;
  pathLength:1;
  stroke-dasharray:1;
  stroke-dashoffset:1;
  animation:draw 0.18s ease-out 1.58s forwards;
}

/* H barra derecha */
.h2{
  stroke:url(#g2);
  stroke-width:14;
  pathLength:1;
  stroke-dasharray:1;
  stroke-dashoffset:1;
  animation:draw 0.28s ease-out 1.76s forwards;
}

@keyframes draw{to{stroke-dashoffset:0}}

/* Glow pulse después de terminar */
.glow-m,.glow-h1,.glow-hb,.glow-h2{
  fill:none;stroke-linecap:round;stroke-linejoin:round;
  opacity:0;
  animation:glowPulse 0.6s ease-out 2.1s forwards;
}
.glow-m {stroke:#a78bfa;stroke-width:24;pathLength:1;stroke-dasharray:1;stroke-dashoffset:0}
.glow-h1{stroke:#a78bfa;stroke-width:24;pathLength:1;stroke-dasharray:1;stroke-dashoffset:0}
.glow-hb{stroke:#a78bfa;stroke-width:24;pathLength:1;stroke-dasharray:1;stroke-dashoffset:0}
.glow-h2{stroke:#93c5fd;stroke-width:24;pathLength:1;stroke-dasharray:1;stroke-dashoffset:0}
@keyframes glowPulse{
  0%  {opacity:0}
  40% {opacity:0.35}
  100%{opacity:0}
}

/* ── Texto ── */
.brand{
  color:#fff;
  font-size:28px;
  font-weight:900;
  letter-spacing:6px;
  margin-top:28px;
  opacity:0;
  text-shadow:0 0 24px rgba(124,58,237,0.9);
  animation:fadeUp 0.5s ease-out 2.2s forwards;
}

.tagline{
  color:rgba(255,255,255,0.38);
  font-size:13px;
  letter-spacing:3.5px;
  font-weight:300;
  margin-top:10px;
  opacity:0;
  animation:fadeUp 0.4s ease-out 2.7s forwards;
}

.version{
  position:fixed;bottom:44px;
  color:rgba(255,255,255,0.16);
  font-size:11px;letter-spacing:1.5px;
  opacity:0;
  animation:fadeIn 0.4s ease-out 2.8s forwards;
}

@keyframes fadeUp{
  from{opacity:0;transform:translateY(8px)}
  to  {opacity:1;transform:translateY(0)}
}
@keyframes fadeIn{to{opacity:1}}
</style>
</head>
<body>

<div class="logo-wrap">
  <div class="halo"></div>

  <svg width="240" height="160" viewBox="0 0 240 160">
    <defs>
      <!-- Gradiente violeta → azul (igual que el logo) -->
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#7c3aed"/>
        <stop offset="55%"  stop-color="#8b5cf6"/>
        <stop offset="100%" stop-color="#60a5fa"/>
      </linearGradient>
      <linearGradient id="g2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stop-color="#8b5cf6"/>
        <stop offset="100%" stop-color="#60a5fa"/>
      </linearGradient>
    </defs>

    <!-- GLOW (detrás, se activa al final) -->
    <path class="glow-m"
      d="M 27,148 C 27,100 24,52 36,47 C 50,42 63,86 76,106 C 89,86 102,42 116,47 C 128,52 125,100 125,148"/>
    <path class="glow-h1" d="M 144,148 L 144,47"/>
    <path class="glow-hb" d="M 144,97  L 188,97"/>
    <path class="glow-h2" d="M 188,47  L 188,148"/>

    <!-- TRAZO PRINCIPAL -->

    <!-- M: trazo cursivo continuo -->
    <path class="m"
      d="M 27,148 C 27,100 24,52 36,47 C 50,42 63,86 76,106 C 89,86 102,42 116,47 C 128,52 125,100 125,148"/>

    <!-- H: 3 trazos en cascada -->
    <path class="h1" d="M 144,148 L 144,47"/>
    <path class="hb" d="M 144,97  L 188,97"/>
    <path class="h2" d="M 188,47  L 188,148"/>
  </svg>
</div>

<div class="brand">MATCHHOME</div>
<div class="tagline">El alquiler inteligente</div>
<div class="version">v1.0</div>

<script>
  // Avisar a React Native cuando termine (3.5s = fin de todas las animaciones)
  setTimeout(function(){
    try{ window.ReactNativeWebView.postMessage('done') }catch(e){}
  }, 3500);
</script>
</body>
</html>`

interface Props { onFinish: () => void }

export default function WelcomeOverlay({ onFinish }: Props) {
  const webRef = useRef<WebView>(null)

  return (
    <WebView
      ref={webRef}
      source={{ html: HTML }}
      style={StyleSheet.absoluteFill}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      overScrollMode="never"
      bounces={false}
      backgroundColor="#07070f"
      onMessage={(e) => {
        if (e.nativeEvent.data === 'done') onFinish()
      }}
    />
  )
}
