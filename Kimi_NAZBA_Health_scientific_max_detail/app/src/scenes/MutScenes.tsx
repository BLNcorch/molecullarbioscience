import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Rig, Rod, TubePath, hov, noRay, tag } from './Scenes';

type V3 = [number, number, number];
const BC: Record<string, string> = { A: '#4ade80', T: '#f87171', G: '#fbbf24', C: '#60a5fa' };
const COMP: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
const MUT = '#ef4444';

/* ---------- ГЕНДІК МУТАЦИЯ: ДНҚ спиралінде ---------- */
export function DnaMutScene({ type, pos, len, tick, sequence, mutated }: {
  type: 'sub' | 'ins' | 'del'; pos: number; len: number; tick: number; sequence: string; mutated: string;
}) {
  const ref = sequence.toUpperCase().replace(/[^ACGT]/g, '');
  const mut = mutated.toUpperCase().replace(/[^ACGT]/g, '');
  const p = Math.max(0, pos - 1);
  const insertionIndex = pos; // inserted bases are displayed immediately after the 1-based position.
  const wantedStart = type === 'ins' ? insertionIndex - 8 : p - 8;
  const start = Math.min(Math.max(0, wantedStart), Math.max(0, mut.length - 24));
  const view = mut.slice(start, start + 24) || 'ATGC';
  const N = view.length, th = (2 * Math.PI) / 10.5, off = 2.4, rise = 0.34;
  const p1 = (i: number): V3 => [Math.cos(i * th), (i - (N - 1) / 2) * rise, Math.sin(i * th)];
  const p2 = (i: number): V3 => [Math.cos(i * th + off), (i - (N - 1) / 2) * rise, Math.sin(i * th + off)];
  const mid = (i: number): V3 => p1(i).map((v, k) => (v + p2(i)[k]) / 2) as V3;
  const state = (i: number): 'mut' | 'ok' => {
    const absolute = start + i;
    if (type === 'sub') return ref[absolute] !== mut[absolute] ? 'mut' : 'ok';
    if (type === 'ins') return absolute >= insertionIndex && absolute < insertionIndex + len ? 'mut' : 'ok';
    return 'ok';
  };
  const backA = Array.from({ length: N }, (_, i) => p1(i));
  const backB = Array.from({ length: N }, (_, i) => p2(i));
  const rawIndex = (type === 'ins' ? insertionIndex : p) - start;
  const gapIndex = Math.max(1, Math.min(N - 1, rawIndex));
  const currentMid = mid(gapIndex);
  const previousMid = mid(gapIndex - 1);
  const gapPoint: V3 = type === 'del'
    ? currentMid.map((v, k) => (v + previousMid[k]) / 2) as V3
    : currentMid;
  const changeText = type === 'sub'
    ? `Субституция: ${ref[p] ?? '?'}→${mut[p] ?? '?'} · ${pos}-нуклеотид`
    : type === 'ins'
      ? `Инсерция: ${mut.slice(insertionIndex, insertionIndex + len) || 'нуклеотидтер'} · ${pos}-орыннан кейін`
      : `Делеция: ${len} н.ж. · ${pos}-орыннан бастап`;
  return <>
    <Rig k={`${type}-${pos}-${len}-${tick}-${ref}-${mut}`} d={12} />
    <TubePath points={backA} radius={0.045} color="#8b5cf6" />
    <TubePath points={backB} radius={0.045} color="#22d3ee" />
    {Array.from({ length: N }, (_, i) => {
      const st = state(i), m = mid(i), a = p1(i), b = p2(i), base = view[i];
      const c1 = st === 'mut' ? MUT : (BC[base] ?? BC.A);
      const c2 = st === 'mut' ? MUT : (BC[COMP[base] ?? 'T'] ?? BC.T);
      return <group key={`${start}-${i}`}>
        <Rod a={a} b={m} r={0.055} color={c1} />
        <Rod a={m} b={b} r={0.055} color={c2} />
        {st === 'mut' && <mesh position={m} raycast={noRay}><sphereGeometry args={[0.16, 24, 20]} /><meshBasicMaterial color={MUT} transparent opacity={0.78} /></mesh>}
        <mesh position={a} raycast={noRay}><sphereGeometry args={[0.075, 16, 12]} /><meshStandardMaterial color="#a78bfa" /></mesh>
        <mesh position={b} raycast={noRay}><sphereGeometry args={[0.075, 16, 12]} /><meshStandardMaterial color="#67e8f9" /></mesh>
      </group>;
    })}
    {type === 'del' && <>
      <mesh position={gapPoint} rotation={[0.5, 0.4, 0.8]} raycast={noRay}><torusGeometry args={[0.23, 0.035, 8, 24]} /><meshBasicMaterial color={MUT} /></mesh>
      <Html position={[gapPoint[0], gapPoint[1], gapPoint[2] + 1.4]} center style={tag}><span className="tag rd">−{len} н.ж. · жойылған аймақ</span></Html>
    </>}
    <Html position={[gapPoint[0], gapPoint[1] + 1.0, gapPoint[2] + 1.2]} center style={tag}><span className="tag rd">{changeText}</span></Html>
    <Html position={[p1(0)[0], p1(0)[1] - 0.6, 0]} center style={tag}><span className="tag">5′</span></Html>
    <Html position={[p1(N - 1)[0], p1(N - 1)[1] + 0.6, 0]} center style={tag}><span className="tag">3′</span></Html>
    <Html position={[0, -4.4, 0]} center style={tag}><span className="tag">3D-модельде пайдаланылған мутантты тізбек: {view}</span></Html>
  </>;
}

/* ---------- ХРОМОСОМАЛЫҚ МУТАЦИЯ: continuous sister chromatids ---------- */
export const CHROM_OPS = ['Қалыпты', 'Делеция', 'Дупликация', 'Инверсия', 'Транслокация (өзара)', 'Робертсондық транслокация', 'Сақиналы хромосома'] as const;
type Seg = { id: string; source: 0 | 1; reversed?: boolean };
const CHR1 = ['A','B','C','D','E','F'];
const CHR2 = ['M','N','O','P','Q','R'];
const SEG_COLOR: Record<string, string> = {
  A:'#70d6ee', B:'#48b7d5', C:'#3397b6', D:'#78dce8', E:'#4ca5c7', F:'#90e4ed',
  M:'#c3a8ff', N:'#a58ae9', O:'#8870d2', P:'#d0b8ff', Q:'#9e8ae0', R:'#c9b9f7'
};
const makeSegs = (ids: string[], source: 0|1): Seg[] => ids.map((id) => ({ id, source }));

/** Overlapping ellipsoidal band pieces create a continuous, rounded chromatid rather than square tiles. */
function ChromosomePair({ x, y=0, segments, centIndex, height=4.1, label, compact=false }: {
  x:number; y?:number; segments:Seg[]; centIndex:number; height?:number; label:string; compact?:boolean;
}) {
  const n=Math.max(segments.length,1), step=height/n, cenY=y+height/2-step*centIndex;
  const w=compact?0.105:0.16;
  return <group>
    {[-1,1].map((side) => {
      const cenT = centIndex / n;
      const centerline: V3[] = Array.from({ length: Math.max(32, n * 8) }, (_, j) => {
        const t = j / (Math.max(32, n * 8) - 1);
        const spread = 0.055 + Math.abs(t - cenT) * 0.34;
        return [x + side * spread, y + height / 2 - height * t, side * 0.055 + Math.sin(t * Math.PI * 2) * 0.018] as V3;
      });
      return <group key={side}>
      <TubePath points={centerline} radius={w * 0.88} color="#c0cad7" />
      {segments.map((seg,i)=>{
        const t=(i+0.5)/n, cenT=centIndex/n, d=Math.abs(t-cenT);
        const armSpread=0.055+d*0.34;
        const taper=0.82+0.18*Math.sin(Math.PI*t);
        const base=SEG_COLOR[seg.id.replace('′','')] ?? '#a8b4c7';
        const darker=i%3===1;
        return <mesh key={`${side}-${i}`} position={[x+side*armSpread,y+height/2-step*(i+0.5),side*0.055]} scale={[w*taper,step*0.57,w*0.88]} rotation={[0,0,side*(t-cenT)*0.22]} raycast={noRay}>
          <sphereGeometry args={[1,40,28]}/><meshStandardMaterial color={darker ? new THREE.Color(base).multiplyScalar(0.73) : base} roughness={0.43} metalness={0.015}/>
        </mesh>;
      })}
    </group>;
    })}
    {/* Centromere waist and paired kinetochores are placed at the constriction. */}
    <mesh position={[x,cenY,0]} scale={[w*1.03,Math.max(0.12,step*0.38),w*0.78]} raycast={noRay}>
      <sphereGeometry args={[1,36,24]}/><meshStandardMaterial color="#f6c66d" roughness={0.38}/>
    </mesh>
    {[-1,1].map((side)=><mesh key={side} position={[x+side*0.21,cenY,0.06]} scale={[0.09,0.14,0.09]} raycast={noRay}>
      <sphereGeometry args={[1,24,18]}/><meshStandardMaterial color="#fbbf24" emissive="#b45309" emissiveIntensity={0.14}/>
    </mesh>)}
    <Html position={[x,y-height/2-0.42,0]} center style={tag}><span className="tag cy">{label}</span></Html>
  </group>;
}

function RingDerivative({x,segments,label}:{x:number;segments:Seg[];label:string}) {
  const points=useMemo(()=>Array.from({length:segments.length*4+1},(_,i)=>{
    const a=(i/(segments.length*4))*Math.PI*2;
    return [Math.cos(a)*1.28,Math.sin(a)*1.55,Math.sin(a*2)*0.08] as V3;
  }),[segments.length]);
  return <group position={[x,0,0]}>
    <TubePath points={points} radius={0.11} color="#aab5c4" />
    {segments.map((seg,i)=>{
      const a=((i+0.5)/segments.length)*Math.PI*2;
      return <mesh key={seg.id+i} position={[Math.cos(a)*1.28,Math.sin(a)*1.55,0.13]} rotation={[0,0,a+Math.PI/2]} scale={[0.18,0.15,0.12]} raycast={noRay}>
        <sphereGeometry args={[1,32,24]}/><meshStandardMaterial color={SEG_COLOR[seg.id]??'#89a7c9'} roughness={0.4}/>
      </mesh>;
    })}
    <Html position={[0,-2.05,0]} center style={tag}><span className="tag cy">{label}</span></Html>
  </group>;
}

export function ChromMutScene({ op, tick }: { op: string; tick: number }) {
  const left = makeSegs(CHR1,0), right = makeSegs(CHR2,1);
  const rowLeftY=0.2, rowRightY=0.2;
  const normal = op==='Қалыпты';
  const inversion:Seg[]=[...left.slice(0,2),...left.slice(2,5).reverse().map((s)=>({...s,reversed:true})),left[5]];
  const transA:Seg[]=[...makeSegs(['A','B','C'],0),...makeSegs(['P','Q','R'],1)];
  const transB:Seg[]=[...makeSegs(['M','N','O'],1),...makeSegs(['D','E','F'],0)];
  const deletion:Seg[]=left.filter((s)=>s.id!=='C');
  const duplication:Seg[]=left.flatMap((s)=>s.id==='C'?[s,{...s}]:[s]);
  const notes:Record<string,string>={
    'Қалыпты':'Екі шартты хромосома. Әрқайсысы екі сіңлілі хроматидадан тұрады; әріптер геннің нақты орналасуын білдірмейді.',
    'Делеция':'C сегменті жойылғаннан кейін қалған бөліктер тұтас жалғанады. Бұл — генетикалық материал жоғалуының схемасы.',
    'Дупликация':'C сегментінің қосымша көшірмесі пайда болады. Ұзындықтың өсуі схемалық; нақты дупликациялардың мөлшері әртүрлі.',
    'Инверсия':'C–D–E сегменттері кері ретпен орналасқан. Бағыт өзгеруі шекараларда генді үзуі немесе мейозға әсер етуі мүмкін.',
    'Транслокация (өзара)':'Екі хромосома арасындағы сегменттер өзара алмасқан. Бұл түсіндірме геометриялық схема; нақты t(9;22) не басқа клиникалық қайта құрылымның көшірмесі емес.',
    'Робертсондық транслокация':'Екі акроцентрлік хромосоманың ұзын иықтары центромера маңында бірігіп, туынды хромосома құрады. Қысқа иықтар жиі жоғалуы мүмкін; көрсетілім шартты.',
    'Сақиналы хромосома':'Теломерлік ұштардың жоғалуы мен бірігуінен сақина тәрізді туынды хромосома түзілуі мүмкін. Барлық сақиналардың құрылымы бірдей емес.'
  };
  return <>
    <Rig k={`${op}-${tick}`} d={10} />
    {normal && <>
      <ChromosomePair x={-2.05} y={rowLeftY} segments={left} centIndex={2} height={4.0} label="Хромосома 1 · қалыпты"/>
      <ChromosomePair x={2.05} y={rowRightY} segments={right} centIndex={2} height={4.0} label="Хромосома 2 · қалыпты"/>
    </>}
    {op==='Делеция' && <>
      <ChromosomePair x={-2.05} segments={left} centIndex={2} height={4.0} label="Бастапқы"/>
      <ChromosomePair x={2.05} segments={deletion} centIndex={2} height={4.0} label="Делециядан кейін"/>
      <Html position={[2.05,-2.45,0]} center style={tag}><span className="tag rd">C жоқ</span></Html>
    </>}
    {op==='Дупликация' && <>
      <ChromosomePair x={-2.05} segments={left} centIndex={2} height={4.0} label="Бастапқы"/>
      <ChromosomePair x={2.05} segments={duplication} centIndex={3} height={4.0} label="Дупликациядан кейін"/>
      <Html position={[2.05,-2.45,0]} center style={tag}><span className="tag rd">C қосымша көшірме</span></Html>
    </>}
    {op==='Инверсия' && <>
      <ChromosomePair x={-2.05} segments={left} centIndex={2} height={4.0} label="Бастапқы"/>
      <ChromosomePair x={2.05} segments={inversion} centIndex={2} height={4.0} label="Инверсиядан кейін"/>
      <Html position={[2.05,-2.45,0]} center style={tag}><span className="tag rd">C–D–E кері ретпен</span></Html>
    </>}
    {op==='Транслокация (өзара)' && <>
      <ChromosomePair x={-2.05} segments={transA} centIndex={3} height={4.0} label="Туынды chr 1"/>
      <ChromosomePair x={2.05} segments={transB} centIndex={3} height={4.0} label="Туынды chr 2"/>
      <Html position={[0,2.55,0]} center style={tag}><span className="tag rd">Сегмент алмасуы · туынды хромосомалар</span></Html>
    </>}
    {op==='Робертсондық транслокация' && <>
      <ChromosomePair x={-2.65} segments={makeSegs(['A','B','C','D','E'],0)} centIndex={1} height={3.8} label="Акроцентрлік 13"/>
      <ChromosomePair x={-0.8} segments={makeSegs(['M','N','O','P','Q'],1)} centIndex={1} height={3.8} label="Акроцентрлік 14"/>
      <ChromosomePair x={1.65} segments={[...makeSegs(['A','B','C'],0),...makeSegs(['M','N','O'],1)]} centIndex={3} height={4.0} label="Ұзын иықтар қосылған туынды"/>
      <mesh position={[0.05,-2.1,0]} rotation={[0,0,0.1]} scale={[0.26,0.09,0.1]} raycast={noRay}><sphereGeometry args={[1,24,18]}/><meshStandardMaterial color="#7d8897" transparent opacity={0.42}/></mesh>
      <Html position={[0.05,-2.45,0]} center style={tag}><span className="tag">Қысқа иық қалдықтары әдетте жоғалуы мүмкін</span></Html>
    </>}
    {op==='Сақиналы хромосома' && <>
      <ChromosomePair x={-2.1} segments={left} centIndex={2} height={4.0} label="Бастапқы"/>
      <RingDerivative x={2.1} segments={left.slice(1,5)} label="Сақиналы туынды"/>
      <Html position={[2.1,2.0,0]} center style={tag}><span className="tag rd">Теломерлік ұштар бірікті</span></Html>
    </>}
    <Html position={[0,-3.05,0]} center style={tag}><span className="tag">Дөңгелектелген хроматидалар · шартты сегменттер (нақты гендік жолақтар емес)</span></Html>
  </>;
}

/* ---------- МИТОХОНДРИЯЛЫҚ: гетероплазмия ---------- */
export function MitoHetScene({ v, tick }: { v: number; tick: number }) {
  const rings = useMemo(() => Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2, r = 0.75 + (i % 3) * 0.3;
    return [Math.cos(a) * r * 1.8, Math.sin(a) * 0.6, Math.sin(a * 2) * 0.5] as V3;
  }), []);
  const bad = Math.round(v / 10);
  return (
    <>
      <Rig k={`het-${tick}`} d={7} />
      <mesh scale={[3, 1.4, 1.4]} raycast={noRay}><sphereGeometry args={[1, 64, 48]} /><meshStandardMaterial color="#fb923c" transparent opacity={0.14} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      <mesh scale={[2.7, 1.15, 1.15]} raycast={noRay}><sphereGeometry args={[1, 64, 48]} /><meshStandardMaterial color="#f97316" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      {[-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8].map((x, i) => (
        <mesh key={i} position={[x, i % 2 ? 0.55 : -0.55, 0]} scale={[0.05, 0.6, 0.95]} raycast={noRay}><sphereGeometry args={[1, 12, 12]} /><meshStandardMaterial color="#fdba74" /></mesh>
      ))}
      {rings.map((p, i) => (
        <mesh key={i} position={p} rotation={[1.1, 0.3 * i, 0]} raycast={noRay}>
          <torusGeometry args={[0.3, 0.05, 16, 48]} />
          <meshStandardMaterial color={i < bad ? '#ef4444' : '#fde047'} emissive={i < bad ? '#ef4444' : '#fde047'} emissiveIntensity={0.55} />
        </mesh>
      ))}
      <Html position={[0, 1.7, 0]} center style={tag}><span className="tag">Митохондрия — {bad}/10 мтДНҚ мутантты</span></Html>
      <Html position={[0, -1.7, 0]} center style={tag}><span className="tag rd">қызыл — мутантты мтДНҚ</span></Html>
    </>
  );
}
