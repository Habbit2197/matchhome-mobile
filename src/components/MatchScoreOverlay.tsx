import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Dimensions, Pressable, Animated, Easing } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'

const { width: W } = Dimensions.get('window')

function Particle({ x, y, delay, color }: { x:number;y:number;delay:number;color:string }) {
  const op = useRef(new Animated.Value(0)).current
  const ty = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.sequence([Animated.delay(delay), Animated.parallel([
      Animated.timing(op, { toValue:1, duration:200, useNativeDriver:true }),
      Animated.timing(ty, { toValue:-80, duration:1200, easing:Easing.out(Easing.cubic), useNativeDriver:true }),
    ]), Animated.timing(op, { toValue:0, duration:400, useNativeDriver:true })]).start()
  }, [])
  return <Animated.View style={[{position:'absolute',left:x,top:y,width:8,height:8,borderRadius:2,backgroundColor:color},{opacity:op,transform:[{translateY:ty}]}]}/>
}

function Ring({ progress, color }: { progress:Animated.Value; color:string }) {
  const R = 72, C = 2*Math.PI*R
  const [offset, setOffset] = useState(C)
  useEffect(() => { progress.addListener(({value})=>setOffset(C*(1-value))) }, [])
  return (
    <Svg width={180} height={180} viewBox="0 0 180 180">
      <Circle cx={90} cy={90} r={R} stroke="#1e293b" strokeWidth={10} fill="transparent"/>
      <Circle cx={90} cy={90} r={R} stroke={color} strokeWidth={10} fill="transparent"
        strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round" rotation="-90" origin="90,90"/>
    </Svg>
  )
}

interface Props { score:number; propertyTitle:string; onDismiss:()=>void; onOpenChat?:()=>void }

export default function MatchScoreOverlay({ score, propertyTitle, onDismiss, onOpenChat }: Props) {
  const bg=useRef(new Animated.Value(0)).current, sc=useRef(new Animated.Value(0.6)).current
  const op=useRef(new Animated.Value(0)).current, prog=useRef(new Animated.Value(0)).current
  const [num,setNum]=useState(0)
  const color=score>=80?'#10b981':score>=60?'#f59e0b':'#ef4444'
  const label=score>=80?'Match excelente!':score>=60?'Buen match':'Match enviado'
  const parts=[{x:W*.15,y:200,color:'#34d399',delay:200},{x:W*.72,y:180,color:'#fbbf24',delay:350},{x:W*.12,y:320,color:'#f472b6',delay:150},{x:W*.78,y:300,color:'#60a5fa',delay:400},{x:W*.48,y:160,color:'#a78bfa',delay:300},{x:W*.38,y:380,color:'#34d399',delay:450}]
  useEffect(() => {
    Animated.parallel([Animated.timing(bg,{toValue:1,duration:300,useNativeDriver:true}),Animated.sequence([Animated.delay(150),Animated.spring(sc,{toValue:1,friction:8,tension:100,useNativeDriver:true})]),Animated.sequence([Animated.delay(150),Animated.timing(op,{toValue:1,duration:250,useNativeDriver:true})])]).start()
    Animated.sequence([Animated.delay(400),Animated.timing(prog,{toValue:score/100,duration:1400,easing:Easing.out(Easing.cubic),useNativeDriver:false})]).start()
    let n=0;const step=score/60;setTimeout(()=>{const iv=setInterval(()=>{n+=step;if(n>=score){setNum(score);clearInterval(iv)}else setNum(Math.floor(n))},23)},400)
    const t=setTimeout(onDismiss,4200);return()=>clearTimeout(t)
  },[])
  return (
    <Animated.View style={[s.overlay,{opacity:bg}]} pointerEvents="box-none">
      {parts.map((p,i)=><Particle key={i} {...p}/>)}
      <Animated.View style={[s.card,{opacity:op,transform:[{scale:sc}]}]}>
        <View style={s.ringWrap}><Ring progress={prog} color={color}/><View style={s.scoreCenter}><Text style={[s.scoreNum,{color}]}>{num}</Text><Text style={s.scorePct}>%</Text></View></View>
        <View style={s.row}><View style={[s.bubble,{backgroundColor:color+"25"}]}><Ionicons name="sparkles" size={20} color={color}/></View><Text style={s.label}>{label}</Text></View>
        <Text style={s.prop} numberOfLines={2}>{propertyTitle}</Text>
        <Text style={s.sub}>El propietario revisara tu perfil.</Text>
        <View style={s.acts}>
          {onOpenChat&&<Pressable style={[s.btn,{backgroundColor:color}]} onPress={onOpenChat}><Ionicons name="chatbubble-ellipses" size={15} color="#fff"/><Text style={s.btnTxt}>Ver matches</Text></Pressable>}
          <Pressable style={s.ghost} onPress={onDismiss}><Text style={s.ghostTxt}>Seguir buscando</Text></Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  )
}
const s=StyleSheet.create({
  overlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(2,6,23,0.88)',alignItems:'center',justifyContent:'center',zIndex:999},
  card:{width:W-48,maxWidth:380,backgroundColor:'#0f172a',borderRadius:28,padding:28,borderWidth:1,borderColor:'#1e293b',alignItems:'center'},
  ringWrap:{width:180,height:180,alignItems:'center',justifyContent:'center',marginBottom:20},
  scoreCenter:{position:'absolute',flexDirection:'row',alignItems:'flex-end'},
  scoreNum:{fontSize:52,fontWeight:'900',lineHeight:56,letterSpacing:-2},
  scorePct:{fontSize:20,fontWeight:'700',color:'#475569',marginBottom:8,marginLeft:2},
  row:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:12},
  bubble:{width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center'},
  label:{fontSize:20,fontWeight:'800',color:'#f8fafc'},
  prop:{fontSize:14,fontWeight:'600',color:'#94a3b8',textAlign:'center',marginBottom:8,lineHeight:22},
  sub:{fontSize:12,color:'#475569',textAlign:'center',lineHeight:18,marginBottom:24},
  acts:{width:'100%',gap:10},
  btn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14,borderRadius:14},
  btnTxt:{color:'#fff',fontSize:15,fontWeight:'700'},
  ghost:{paddingVertical:10},ghostTxt:{color:'#475569',fontSize:14,fontWeight:'600',textAlign:'center'},
})
