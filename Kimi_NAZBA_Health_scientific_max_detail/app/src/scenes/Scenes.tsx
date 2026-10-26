import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { buildModel } from '../data/molecule';
import { BASES, type Id } from '../data/science';
import { CHR3_P_BANDS, CHR3_Q_BANDS, GRCH38_CHR3_COORDS, makeBandFocus, type BandFocus, type Arm } from '../data/cytobands';

type V3 = [number, number, number];
export interface S { sel: Id; tick: number; pick: (id: Id, atom?: string | null) => void; selectBand?: (band: BandFocus) => void }
export const hov = (on: boolean) => () => { document.body.style.cursor = on ? 'pointer' : 'auto'; };
export const noRay = () => null;
export const tag = { pointerEvents: 'none' as const };

/** Камера: нысан ауысканда кадрды бірден қояды (кейін OrbitControls басқарады). */
export function Rig({ at = [0, 0, 0], d = 9, k }: { at?: V3; d?: number; k: string }) {
  const ctl = useRef<any>(null);
  const camera = useThree((s) => s.camera);
  const g = useRef({ t: new THREE.Vector3(), p: new THREE.Vector3(), snap: 2 });
  useEffect(() => {
    g.current.t.set(...at);
    g.current.p.copy(g.current.t).add(new THREE.Vector3(0.25, 0.3, 1).normalize().multiplyScalar(d));
    g.current.snap = 3;
  }, [k]); // eslint-disable-line
  useFrame(() => {
    const c = ctl.current, r = g.current;
    if (!r.snap || !c) return;
    r.snap--;
    c.target.copy(r.t); camera.position.copy(r.p); c.update();
  });
  return <OrbitControls ref={ctl} makeDefault enableDamping minDistance={1} maxDistance={80} />;
}

export function Rod({ a, b, r = 0.07, color = '#cbd5e1', o = 1 }: { a: V3; b: V3; r?: number; color?: string; o?: number }) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), dv = B.clone().sub(A), len = dv.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dv.clone().normalize());
  return (
    <mesh position={A.clone().add(B).multiplyScalar(0.5)} quaternion={q} raycast={noRay}>
      <cylinderGeometry args={[r, r, len, 32, 1]} /><meshStandardMaterial color={color} transparent={o < 1} opacity={o} />
    </mesh>
  );
}

/** Smooth tube helper used for folded membranes and filaments. */
export function TubePath({ points, radius, color, opacity = 1 }: { points: V3[]; radius: number; color: string; opacity?: number }) {
  const key = JSON.stringify(points);
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
    return new THREE.TubeGeometry(curve, Math.max(32, points.length * 8), radius, 10, false);
  }, [key, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}>
    <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={0.42} metalness={0.02} />
  </mesh>;
}

/** Dedicated membrane cutaway. Dimensions are intentionally magnified relative to a whole cell. */
export function MembraneScene({ sel, tick, pick }: S) {
  const phospholipids = useMemo(() => Array.from({ length: 19 }, (_, i) => ({ x: (i - 9) * 0.43, i })), []);
  const chol = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ x: (i - 4.5) * 0.72 + (i % 2 ? 0.12 : -0.12), z: i % 2 ? 0.13 : -0.13 })), []);
  return <>
    <Rig k={`${sel}-${tick}`} d={10} />
    {/* Hydrophilic phosphate heads face the aqueous phases; hydrophobic chains face one another. */}
    {phospholipids.map(({ x, i }) => <group key={i}>
      <mesh position={[x, 0, 0.48]} onClick={(e) => { e.stopPropagation(); pick('membrane'); }}><sphereGeometry args={[0.13, 24, 20]} /><meshStandardMaterial color="#60a5fa" roughness={0.28} /></mesh>
      <mesh position={[x - 0.045, 0, 0.24]} rotation={[Math.PI / 2, 0, -0.08]}><cylinderGeometry args={[0.032, 0.04, 0.5, 12]} /><meshStandardMaterial color="#fbbf24" roughness={0.5} /></mesh>
      <mesh position={[x + 0.045, 0, 0.24]} rotation={[Math.PI / 2, 0, 0.08]}><cylinderGeometry args={[0.032, 0.04, 0.5, 12]} /><meshStandardMaterial color="#f59e0b" roughness={0.5} /></mesh>
      <mesh position={[x, 0, -0.48]} onClick={(e) => { e.stopPropagation(); pick('membrane'); }}><sphereGeometry args={[0.13, 24, 20]} /><meshStandardMaterial color="#60a5fa" roughness={0.28} /></mesh>
      <mesh position={[x - 0.045, 0, -0.24]} rotation={[Math.PI / 2, 0, -0.08]}><cylinderGeometry args={[0.032, 0.04, 0.5, 12]} /><meshStandardMaterial color="#fbbf24" roughness={0.5} /></mesh>
      <mesh position={[x + 0.045, 0, -0.24]} rotation={[Math.PI / 2, 0, 0.08]}><cylinderGeometry args={[0.032, 0.04, 0.5, 12]} /><meshStandardMaterial color="#f59e0b" roughness={0.5} /></mesh>
    </group>)}
    {/* Cholesterol is intercalated among fatty-acid tails, not a free external bead. */}
    {chol.map((c, i) => <mesh key={i} position={[c.x, 0, c.z]} rotation={[Math.PI / 2, 0, i % 2 ? 0.12 : -0.12]}><capsuleGeometry args={[0.075, 0.19, 4, 12]} /><meshStandardMaterial color="#eab308" roughness={0.32} /></mesh>)}
    {/* Integral channel protein traverses the bilayer; the pore is visible through the centre. */}
    <group position={[0.1, 0, 0]} onClick={(e) => { e.stopPropagation(); pick('membrane'); }}>
      <mesh scale={[0.32, 0.38, 1.15]}><sphereGeometry args={[1, 36, 28]} /><meshStandardMaterial color="#c084fc" roughness={0.3} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}><cylinderGeometry args={[0.11, 0.11, 0.86, 24]} /><meshStandardMaterial color="#312e81" /></mesh>
      <mesh position={[0, 0, 0.53]}><torusGeometry args={[0.15, 0.045, 12, 32]} /><meshStandardMaterial color="#ddd6fe" /></mesh>
    </group>
    {/* Peripheral receptor and a glycosylated protein on the extracellular side. */}
    <mesh position={[-2.65, 0.12, 0.7]} scale={[0.22, 0.28, 0.18]}><sphereGeometry args={[1, 28, 24]} /><meshStandardMaterial color="#34d399" /></mesh>
    <group position={[2.8, 0, 0.45]}>
      <mesh><sphereGeometry args={[0.18, 24, 20]} /><meshStandardMaterial color="#fb7185" /></mesh>
      <TubePath points={[[0,0,0.1],[0.1,0.05,0.35],[-0.02,0.12,0.58],[0.12,0.2,0.8]]} radius={0.035} color="#f9a8d4" />
      <mesh position={[0.12, 0.2, 0.8]}><sphereGeometry args={[0.085, 16, 12]} /><meshStandardMaterial color="#fde68a" /></mesh>
    </group>
    <Html position={[-3.55, 1.2, 0]} center style={tag}><span className="tag">Сыртқы орта</span></Html>
    <Html position={[-3.55, -1.2, 0]} center style={tag}><span className="tag">Цитозоль</span></Html>
    <Html position={[0.1, 1.25, 0]} center style={tag}><span className="tag yl">Интегралды канал-ақуыз</span></Html>
    <Html position={[-2.65, 0.62, 0.1]} center style={tag}><span className="tag gn">Рецептор</span></Html>
    <Html position={[2.8, 1.15, 0.1]} center style={tag}><span className="tag rd">Гликопротеин</span></Html>
    <Html position={[0, -1.25, 0]} center style={tag}><span className="tag">Фосфолипидті қос қабат · шамамен 7–10 нм</span></Html>
  </>;
}


function Blob({ id, p, s, c, o = 1, sel, pick }: { id: Id; p: V3; s: V3; c: string; o?: number } & Pick<S, 'sel' | 'pick'>) {
  return (
    <mesh position={p} scale={s} onClick={(e) => { e.stopPropagation(); pick(id); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
      <sphereGeometry args={[1, 64, 48]} />
      <meshStandardMaterial color={c} emissive={sel === id ? c : '#000000'} emissiveIntensity={0.7} transparent={o < 1} opacity={o} roughness={0.32} metalness={0.04} />
    </mesh>
  );
}

/* ---------------- 1. ЖАСУША ---------------- */
const rnd = (i: number) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };

/** Mitochondrion in the cell overview: smooth outer contour with folded inner membrane. */
function MitoUnit({ p, sel, pick }: { p: V3 } & Pick<S, 'sel' | 'pick'>) {
  const on = sel === 'mitochondrion';
  const folds: V3[][] = [
    [[-0.38,-0.02,0],[-0.28,0.14,0.08],[-0.12,-0.12,0.1],[0.02,0.12,-0.08],[0.18,-0.13,0],[0.34,0.02,0.03]],
    [[-0.32,0.04,-0.08],[-0.18,-0.12,-0.04],[-0.01,0.13,0.08],[0.15,-0.1,0.08],[0.3,0.03,-0.06]]
  ];
  return <group position={p} rotation={[0.3, rnd(p[0] * 7) * 2, 0.4]} onClick={(e) => { e.stopPropagation(); pick('mitochondrion'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
    <mesh scale={[0.62, 0.36, 0.34]}><sphereGeometry args={[1, 96, 64]} /><meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={on ? 0.35 : 0.06} roughness={0.38} /></mesh>
    <mesh scale={[0.54, 0.29, 0.27]}><sphereGeometry args={[1, 80, 56]} /><meshStandardMaterial color="#7c2d12" roughness={0.7} /></mesh>
    {folds.map((pts, i) => <TubePath key={i} points={pts} radius={0.025} color={i ? '#fed7aa' : '#fdba74'} />)}
    {[[0.08,0.07,0.12],[-0.13,-0.06,-0.09],[0.24,0.04,-0.1]].map((q, i) => <mesh key={i} position={q as V3} raycast={noRay}><sphereGeometry args={[0.025, 16, 12]} /><meshStandardMaterial color="#e2e8f0" /></mesh>)}
  </group>;
}

/** Chloroplast: double envelope, stacked thylakoid discs and connecting lamellae. */
function ChloroUnit({ p, sel, pick }: { p: V3 } & Pick<S, 'sel' | 'pick'>) {
  const on = sel === 'chloroplast' || sel === 'plastid';
  return <group position={p} rotation={[0.2, rnd(p[1] * 9) * 2, 0.2]} onClick={(e) => { e.stopPropagation(); pick('chloroplast'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
    <mesh scale={[0.78, 0.42, 0.38]}><sphereGeometry args={[1, 80, 56]} /><meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={on ? 0.35 : 0.06} roughness={0.45} /></mesh>
    <mesh scale={[0.72, 0.36, 0.32]}><sphereGeometry args={[1, 72, 48]} /><meshStandardMaterial color="#166534" roughness={0.7} /></mesh>
    {[-0.34,0,0.34].map((x, i) => <group key={i} position={[x,0,0]}>
      {[-0.18,-0.1,-0.02,0.06,0.14,0.22].map((y,j) => <mesh key={j} position={[0,y,0]} scale={[1,0.85,0.75]} raycast={noRay}><cylinderGeometry args={[0.18,0.18,0.035,32,1]} /><meshStandardMaterial color={i===1 ? '#4ade80' : '#15803d'} emissive={on ? '#22c55e' : '#000000'} emissiveIntensity={on ? 0.15 : 0} roughness={0.35} /></mesh>)}
    </group>)}
    <TubePath points={[[-0.48,-0.1,-0.04],[-0.2,-0.02,-0.03],[0.1,0.04,0.03],[0.46,0.12,0.02]]} radius={0.025} color="#86efac" />
    <TubePath points={[[-0.48,0.2,0.08],[-0.1,0.16,0.08],[0.24,0.08,0.08],[0.48,-0.1,0.08]]} radius={0.02} color="#86efac" />
  </group>;
}

export function CellScene({ sel, tick, pick, plant }: S & { plant: boolean }) {
  const nuc: V3 = plant ? [-1.4, 0.9, 0] : [0, 0, 0];
  const mito: V3[] = [[1.8, 1.5, 0.8], [-0.6, -1.9, 1.2], [1.2, -1.2, -1.6]];
  const chl: V3[] = [[-1.9, -0.6, 1.0], [0.4, 1.9, 1.2], [-1.2, -1.5, -1.2]];
  const vac: V3 = [1.2, -0.2, -0.4], golgi: V3 = [-1.2, -1.7, 1.5];
  const lyso: V3[] = [[2.0, -0.2, 1.3], [-2.2, 0.4, -1.2], [0.5, -2.2, -0.6], [-0.4, 2.3, -0.8]];
  const ribo = useMemo<V3[]>(() => Array.from({ length: 36 }, (_, i) => {
    const u = rnd(i) * 2 - 1, a = rnd(i + 50) * 6.283, r = Math.sqrt(1 - u * u), d = 1.3 + rnd(i + 99) * 1.3;
    return [r * Math.cos(a) * d, u * d, r * Math.sin(a) * d];
  }), []);
  // Мембраналық ақуыздар: сыртқы бетке бекітілген түйреуіштер
  const mprot = useMemo<V3[]>(() => Array.from({ length: 22 }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / 22, r = Math.sqrt(1 - y * y), a = i * 2.39996;
    return [Math.cos(a) * r * 3, y * 3, Math.sin(a) * r * 3];
  }), []);
  // Цитоскелет: центросомадан тараған микротүтікшелер
  // Екі липидті қабаттың сызбалық фосфолипидтері: бастары су ортасына,
  // гидрофобты құйрықтары мембрананың ішіне бағытталған.
  const lipids = useMemo(() => Array.from({ length: 144 }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / 144, r = Math.sqrt(1 - y * y), a = i * 2.399963;
    const n = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).normalize();
    return { n, i };
  }), []);
  const mtubes = useMemo<V3[]>(() => Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * 6.283, el = Math.sin(i * 1.7) * 0.7;
    return [Math.cos(a) * Math.cos(el) * 2.8, Math.sin(el) * 2.8, Math.sin(a) * Math.cos(el) * 2.8];
  }), []);
  const cent: V3 = [-2, 1.2, -0.8];
  const F: Record<string, V3> = { peroxisome: [0.2, 2.2, -1.4], centrosome: cent, nucleus: nuc, plastid: chl[0], vacuole: vac, er: nuc, golgi, lysosome: lyso[0], ribosome: ribo[0], cytoskeleton: cent };
  const P = { sel, pick };
  return (
    <>
      <Rig k={`${sel}-${tick}`} at={F[sel] ?? [0, 0, 0]} d={sel === 'cell' ? 9 : 4.5} />
      {/* Плазмалық мембрана: екі фосфолипидті моноқабат (схемалық сфералық кескін) */}
      <mesh raycast={noRay} onClick={(e) => { e.stopPropagation(); pick('membrane'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
        <sphereGeometry args={[3.02, 96, 72]} /><meshStandardMaterial color="#38bdf8" transparent opacity={sel === 'membrane' ? 0.12 : 0.035} depthWrite={false} side={THREE.DoubleSide} roughness={0.65} />
      </mesh>
      {lipids.map(({ n, i }) => {
        const outer = n.clone().multiplyScalar(3.02);
        const inner = n.clone().multiplyScalar(2.82);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
        const tailQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n.clone().negate());
        return <group key={'lipid'+i}>
          <mesh position={outer} quaternion={q} raycast={noRay}><sphereGeometry args={[0.055, 12, 10]} /><meshStandardMaterial color={sel === 'membrane' ? '#fde047' : '#7dd3fc'} roughness={0.45} /></mesh>
          <mesh position={inner} quaternion={tailQ} raycast={noRay}><sphereGeometry args={[0.055, 12, 10]} /><meshStandardMaterial color={sel === 'membrane' ? '#fde047' : '#7dd3fc'} roughness={0.45} /></mesh>
          <mesh position={n.clone().multiplyScalar(2.94)} quaternion={q} raycast={noRay}><cylinderGeometry args={[0.012, 0.012, 0.17, 6]} /><meshStandardMaterial color="#fbbf24" /></mesh>
          <mesh position={n.clone().multiplyScalar(2.88)} quaternion={q} rotation={[0.2, i * 0.2, 0]} raycast={noRay}><cylinderGeometry args={[0.009, 0.009, 0.12, 6]} /><meshStandardMaterial color="#f59e0b" /></mesh>
        </group>;
      })}
      {/* Интегральные белки и шартты түрде көрсетілген арна */}
      {mprot.map((p, i) => {
        const n = new THREE.Vector3(...p).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
        return <mesh key={'mp'+i} position={n.clone().multiplyScalar(2.92)} quaternion={q} scale={[1, 2.0, 1]} raycast={noRay}>
          <sphereGeometry args={[0.085, 16, 12]} /><meshStandardMaterial color={sel === 'membrane' ? '#fef08a' : '#38bdf8'} roughness={0.35} metalness={0.02} />
        </mesh>;
      })}
      <mesh position={[0.4, 0.2, 2.91]} raycast={noRay}>
        <cylinderGeometry args={[0.095, 0.095, 0.34, 20]} /><meshStandardMaterial color="#f472b6" roughness={0.32} />
      </mesh>
      {plant && <mesh raycast={noRay}><sphereGeometry args={[3.2, 32, 32]} /><meshBasicMaterial color="#4ade80" wireframe transparent opacity={0.25} /></mesh>}
      {/* Ядро: қабықша + ядрошық */}
      <group position={nuc} scale={plant ? 0.7 : 1} onClick={(e) => { e.stopPropagation(); pick('nucleus'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
        <mesh><sphereGeometry args={[1, 64, 48]} /><meshStandardMaterial color="#8b5cf6" transparent opacity={0.55} emissive="#8b5cf6" emissiveIntensity={sel === 'nucleus' ? 0.7 : 0.1} roughness={0.35} /></mesh>
        <mesh raycast={noRay}><sphereGeometry args={[1.04, 24, 24]} /><meshBasicMaterial color="#c4b5fd" wireframe transparent opacity={0.14} /></mesh>
        <mesh position={[0.3, 0.25, 0.4]} raycast={noRay}><sphereGeometry args={[0.3, 16, 16]} /><meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={0.25} /></mesh>
        <group position={[-0.2, -0.3, -0.2]} raycast={noRay}><TubePath points={[[-0.45,-0.1,0],[-0.2,0.28,0.08],[0.12,0.36,0.1],[0.4,0.08,-0.03],[0.2,-0.24,-0.08],[-0.18,-0.3,0.02],[-0.38,-0.04,0.12]]} radius={0.035} color="#2dd4bf" /></group>
      </group>
      {/* Endoplasmic reticulum: branching membrane cisternae/tubules around the nucleus, not a torus knot. */}
      <group position={nuc} scale={plant ? 0.78 : 1} onClick={(e) => { e.stopPropagation(); pick('er'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
        {[
          [[1.35,0.25,0.05],[1.12,0.85,0.08],[0.45,1.28,0.04],[-0.35,1.22,0.08],[-1.1,0.68,0.05],[-1.25,-0.12,0.04],[-0.76,-1.0,0.03],[0.1,-1.24,0.05],[0.88,-0.85,0.08],[1.28,-0.2,0.05]],
          [[1.58,0.18,0.34],[1.32,0.86,0.34],[0.65,1.48,0.31],[-0.2,1.42,0.32],[-1.13,0.88,0.31],[-1.52,0.15,0.34],[-1.12,-0.75,0.31],[-0.32,-1.42,0.32],[0.58,-1.34,0.34],[1.42,-0.72,0.32]],
          [[0.75,1.46,-0.34],[0.2,1.8,-0.32],[-0.45,1.66,-0.34],[-1.52,0.8,-0.34],[-1.8,0.15,-0.32],[-1.3,-0.95,-0.31],[-0.6,-1.66,-0.34],[0.2,-1.78,-0.32],[1.22,-1.28,-0.34],[1.72,-0.45,-0.32]]
        ].map((pts, i) => <TubePath key={i} points={pts as V3[]} radius={i === 1 ? 0.055 : 0.045} color={sel === 'er' ? '#a7f3d0' : '#2dd4bf'} opacity={0.93} />)}
        {[[0.6,1.0,0.13],[0.95,0.68,0.15],[-0.65,1.0,0.13],[-1.0,0.45,0.13],[0.65,-1.0,0.13],[-0.65,-1.0,0.13],[1.22,-0.5,0.13],[-1.2,-0.45,0.13]].map((v,i) => <mesh key={i} position={v as V3} raycast={noRay}><sphereGeometry args={[0.045,12,10]}/><meshStandardMaterial color="#e2e8f0"/></mesh>)}
      </group>
      {/* Golgi stacks: curved, flattened cisternae plus transport vesicles. */}
      <group position={golgi} onClick={(e) => { e.stopPropagation(); pick('golgi'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
        {Array.from({length:6},(_,i) => <mesh key={i} position={[Math.sin(i*0.6)*0.12,(i-2.5)*0.14,Math.cos(i*0.5)*0.06]} rotation={[0,Math.sin(i*0.4)*0.08,Math.sin(i*0.3)*0.1]} scale={[0.62-i*0.025,0.085,0.32-i*0.012]}><sphereGeometry args={[1,48,32]}/><meshStandardMaterial color={i%2?'#f9a8d4':'#f472b6'} emissive={sel==='golgi'?'#f472b6':'#000000'} emissiveIntensity={sel==='golgi'?0.15:0} roughness={0.42}/></mesh>)}
        {[[0.7,0.35,0.05],[-0.68,-0.25,-0.04],[0.62,-0.34,0.02]].map((v,i)=><mesh key={i} position={v as V3}><sphereGeometry args={[0.1,20,16]}/><meshStandardMaterial color="#fbcfe8"/></mesh>)}
      </group>
      {lyso.map((p, i) => <Blob key={i} id="lysosome" p={p} s={[0.17, 0.17, 0.17]} c="#ef4444" {...P} />)}
      {ribo.map((p, i) => <Blob key={i} id="ribosome" p={p} s={[0.06, 0.06, 0.06]} c="#e2e8f0" {...P} />)}
      {[[0.2, 2.2, -1.4], [-2.3, -1.2, 0.2], [2.2, -1.9, 0.4]].map((p, i) => <Blob key={i} id="peroxisome" p={p as V3} s={[0.2, 0.2, 0.2]} c="#facc15" {...P} />)}
      {!plant && (
        <group position={cent} onClick={(e) => { e.stopPropagation(); pick('centrosome'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
          <mesh><cylinderGeometry args={[0.1, 0.1, 0.4, 12]} /><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={sel === 'centrosome' ? 0.7 : 0.1} /></mesh>
          <mesh position={[0.22, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.1, 0.1, 0.4, 12]} /><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={sel === 'centrosome' ? 0.7 : 0.1} /></mesh>
        </group>
      )}
      {!plant && mtubes.map((p, i) => <Rod key={i} a={cent} b={p} r={0.022} color={sel === 'cytoskeleton' || sel === 'centrosome' ? '#67e8f9' : '#3d5a80'} o={0.8} />)}
      {plant && <Blob id="vacuole" p={vac} s={[1.2, 1.2, 1.2]} c="#22d3ee" o={0.45} {...P} />}
      {mito.map((p, i) => <MitoUnit key={i} p={p} sel={sel} pick={pick} />)}
      {plant && chl.map((p, i) => <ChloroUnit key={i} p={p} sel={sel} pick={pick} />)}
    </>
  );
}

/* ---------------- 2. ЯДРО ---------------- */
export function NucleusScene({ sel, tick, pick }: S) {
  const pores = useMemo(() => Array.from({ length: 24 }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / 24, r = Math.sqrt(1 - y * y), a = i * 2.39996;
    return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
  }), []);
  return (
    <>
      <Rig k={`${sel}-${tick}`} d={7} />
      {[2.4, 2.3].map((r) => (
        <mesh key={r} raycast={noRay}><sphereGeometry args={[r, 48, 48]} /><meshStandardMaterial color="#6366f1" transparent opacity={0.14} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      ))}
      {pores.map((v, i) => (
        <mesh key={i} position={v.clone().multiplyScalar(2.4)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), v)} onClick={(e) => { e.stopPropagation(); pick('npc'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
          <torusGeometry args={[0.12, 0.04, 16, 32]} /><meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={sel === 'npc' ? 0.8 : 0.15} />
        </mesh>
      ))}
      <mesh position={[0.6, 0.4, 0.5]} onClick={(e) => { e.stopPropagation(); pick('nucleolus'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}><sphereGeometry args={[0.5, 24, 24]} /><meshStandardMaterial color="#c084fc" /></mesh>
      <group onClick={(e) => { e.stopPropagation(); pick('chromosome'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
        {[
          [[-1.55,-0.45,-0.3],[-1.15,0.45,-0.18],[-0.35,0.75,0.06],[0.35,0.35,0.18],[0.85,-0.3,0.05],[1.35,-0.2,-0.1]],
          [[-1.2,0.8,0.25],[-0.6,0.2,0.35],[0.15,-0.05,0.3],[0.8,0.6,0.26],[1.25,1.05,0.18]],
          [[-0.95,-0.9,0.2],[-0.2,-0.45,0.28],[0.35,-0.9,0.24],[0.98,-1.05,0.2]],
          [[-0.8,0.12,-0.35],[-0.25,0.95,-0.32],[0.4,1.12,-0.3],[0.92,0.35,-0.32],[0.55,-0.45,-0.35],[-0.05,-0.72,-0.32]]
        ].map((pts,i)=><TubePath key={i} points={pts as V3[]} radius={0.055} color={sel==='chromatin'||sel==='chromosome'?'#5eead4':'#2dd4bf'} />)}
      </group>
      <Html position={[0, 2.6, 0]} center style={tag}><span className="tag">Ядролық қабықша (қос мембрана)</span></Html>
      <Html position={pores[3].clone().multiplyScalar(2.5).toArray() as V3} center style={tag}><span className="tag">Ядролық саңылау</span></Html>
      <Html position={[0.6, 1.1, 0.5]} center style={tag}><span className="tag">Ядрошық</span></Html>
      <Html position={[-1.6, -1.2, 0.8]} center style={tag}><span className="tag">Хроматин</span></Html>
    </>
  );
}

/* ---------------- 3. ХРОМАТИН / НУКЛЕОСОМА ---------------- */
export function ChromatinScene({ sel, tick, pick, cond }: S & { cond: number }) {
  const stage = cond < 0.24 ? 0 : cond < 0.53 ? 1 : cond < 0.8 ? 2 : 3;
  const N = stage === 0 ? 28 : 64;
  const pts: V3[] = useMemo(() => {
    const out: V3[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      if (stage === 0) {
        // A bead-on-string fibre with spaced histone cores; dimensions remain pedagogical.
        out.push([(t - 0.5) * 8.6, Math.sin(i * 1.12) * 0.36, Math.cos(i * 1.12) * 0.32]);
      } else {
        // A compact zig-zag fold illustrates variable higher-order packing, not a universal 30-nm fibre.
        const a = i * 0.58;
        out.push([(t - 0.5) * 4.2, Math.cos(a) * 0.72, Math.sin(a) * 0.72]);
      }
    }
    return out;
  }, [N, stage]);
  // DNA wraps around each histone core as a short superhelix (visual approximation of ~1.65 turns).
  const dnaWrap: V3[] = useMemo(() => Array.from({ length: 40 }, (_, i) => {
    const t = i / 39, a = t * Math.PI * 2 * 1.65;
    return [0.19 * Math.cos(a), 0.15 * Math.sin(a), 0.055 * Math.sin(a * 0.5)] as V3;
  }), []);
  const wrapStart = dnaWrap[0], wrapEnd = dnaWrap[dnaWrap.length - 1];
  const loops: V3[][] = useMemo(() => Array.from({ length: 5 }, (_, l) =>
    Array.from({ length: 49 }, (_, j) => {
      const a = (j / 48) * Math.PI * 2;
      return [(l - 2) * 0.85 + Math.cos(a) * 0.52, Math.sin(a) * 1.22, Math.sin(a * 2) * 0.28] as V3;
    })), []);
  const chromosomePaths: V3[][] = useMemo(() => [0, 1].map((strand) =>
    Array.from({ length: 45 }, (_, i) => {
      const t = i / 44;
      const y = 3.15 - t * 6.3;
      const spread = 0.12 + Math.abs(t - 0.5) * 0.88;
      const x = (strand === 0 ? -1 : 1) * spread + Math.sin(t * Math.PI * 2) * 0.04;
      const z = Math.cos(t * Math.PI * 2 + strand) * 0.07;
      return [x, y, z] as V3;
    })), []);
  const on = sel === 'nucleosome';
  const label = stage === 0 ? 'Нуклеосомалық жіп · диаметрі шамамен 10–11 нм' : stage === 1 ? 'Жоғары ретті бүктелу · өзгермелі конфигурация' : stage === 2 ? 'Хроматиннің ілмекті домендері · схема' : 'Митоздық хромосома · екі сіңлілі хроматида';
  return <>
    <Rig k={`${sel}-${tick}-${stage}`} d={stage >= 2 ? 7 : stage === 1 ? 8 : 10} />
    {stage <= 1 && <>
      {stage === 1 && pts.slice(1).map((p, i) => <Rod key={`fold-link-${i}`} a={pts[i]} b={p} r={0.026} color="#94a3b8" />)}
      {stage === 0 && pts.slice(1).map((p, i) => {
        const a = pts[i].map((v, k) => v + wrapEnd[k]) as V3;
        const b = p.map((v, k) => v + wrapStart[k]) as V3;
        return <Rod key={`linker-dna-${i}`} a={a} b={b} r={0.022} color="#22d3ee" />;
      })}
      {pts.map((p, i) => <group key={`nuc-${i}`} position={p} onClick={(e) => { e.stopPropagation(); pick('nucleosome'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
        {stage === 0 ? <>
          {/* Flattened histone octamer core with wrapped DNA: a nucleosome is not a bare sphere. */}
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.15, 0.15, 0.12, 32, 1]} /><meshStandardMaterial color="#8b5cf6" emissive={on ? '#6d28d9' : '#000000'} emissiveIntensity={on ? 0.28 : 0.03} roughness={0.5} /></mesh>
          <TubePath points={dnaWrap} radius={0.022} color="#22d3ee" />
        </> : <>
          <mesh scale={[0.8, 0.8, 0.68]}><sphereGeometry args={[0.19, 32, 24]} /><meshStandardMaterial color="#64748b" emissive={on ? '#a855f7' : '#000000'} emissiveIntensity={on ? 0.3 : 0.04} roughness={0.42} /></mesh>
          <mesh rotation={[0.2, 0.3, 0]}><torusGeometry args={[0.22, 0.025, 10, 28]} /><meshStandardMaterial color="#cbd5e1" roughness={0.42} /></mesh>
        </>}
      </group>)}
    </>}
    {stage === 2 && <>
      <Rod a={[0, -1.55, -0.2]} b={[0, 1.55, -0.2]} r={0.08} color="#fbbf24" />
      {loops.map((path, i) => <group key={`loop-${i}`}>
        <TubePath points={path} radius={0.045} color={i % 2 ? '#a855f7' : '#22d3ee'} />
        {path.filter((_, j) => j % 6 === 0).map((p, j) => <mesh key={j} position={p} onClick={(e) => { e.stopPropagation(); pick('nucleosome'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}><sphereGeometry args={[0.075, 16, 12]} /><meshStandardMaterial color={i % 2 ? '#c084fc' : '#67e8f9'} /></mesh>)}
      </group>)}
      <Html position={[0, -2.1, 0]} center style={tag}><span className="tag">Ілмектердің өлшемі және реттелуі жасушаға тәуелді</span></Html>
    </>}
    {stage === 3 && <>
      {chromosomePaths.map((path, i) => <group key={`chromatid-${i}`}>
        <TubePath points={path} radius={0.105} color={i ? '#b7c2d0' : '#d3dbe4'} />
        {path.filter((_, j) => j % 5 === 2).map((p, j) => <mesh key={j} position={p} scale={[0.16, 0.13, 0.14]} onClick={(e) => { e.stopPropagation(); pick('chromosome'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
          <sphereGeometry args={[1, 24, 18]} /><meshStandardMaterial color={j % 2 ? '#475569' : '#e2e8f0'} roughness={0.44} />
        </mesh>)}
      </group>)}
      <mesh position={[0, 0, 0]} scale={[0.19, 0.22, 0.15]}><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color="#fbbf24" emissive="#b45309" emissiveIntensity={0.22} /></mesh>
      <Html position={[0, 3.75, 0]} center style={tag}><span className="tag">Центромера</span></Html>
      <Html position={[0, -3.75, 0]} center style={tag}><span className="tag">Схематическая геометрия · не в масштабе</span></Html>
    </>}
    <Html position={[0, stage === 3 ? 4.2 : 2.5, 0]} center style={tag}><span className="tag cy">{label}</span></Html>
    {stage === 1 && <Html position={[0, -2.6, 0]} center style={tag}><span className="tag">30-нм талшық барлық тірі жасушаларға ортақ міндетті саты емес</span></Html>}
  </>;
}

/* ---------------- 4. ДНҚ ---------------- */
const SEQ = 'ATGCGCTAGCTAATCGGATCGTAC', COMP: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
const BC: Record<string, string> = { A: '#4ade80', T: '#f87171', G: '#fbbf24', C: '#60a5fa' };
export function DnaScene({ sel, tick, pick, opt }: S & { opt: { backbone: boolean; bonds: boolean } }) {
  const N = SEQ.length, th = (2 * Math.PI) / 10.5, off = 2.4, rise = 0.4;
  const p1 = (i: number): V3 => [Math.cos(i * th), (i - N / 2) * rise, Math.sin(i * th)];
  const p2 = (i: number): V3 => [Math.cos(i * th + off), (i - N / 2) * rise, Math.sin(i * th + off)];
  const mid = (i: number): V3 => p1(i).map((v, k) => (v + p2(i)[k]) / 2) as V3;
  return (
    <group onClick={(e) => { e.stopPropagation(); pick('nucleotide'); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
      <Rig k={`${sel}-${tick}`} d={13} />
      {opt.backbone && [0, 1].map((strand) => {
        const points = Array.from({ length: N }, (_, i) => new THREE.Vector3(...(strand === 0 ? p1(i) : p2(i))));
        const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
        return <mesh key={'backbone'+strand} raycast={noRay}><tubeGeometry args={[curve, N * 12, 0.055, 12, false]} /><meshStandardMaterial color={strand === 0 ? '#8b5cf6' : '#22d3ee'} roughness={0.38} /></mesh>;
      })}
      {Array.from({ length: N }, (_, i) => {
        const m = mid(i), a = p1(i), b = p2(i), nb = SEQ[i] === 'A' || SEQ[i] === 'T' ? 2 : 3;
        return (
          <group key={i}>
            <Rod a={a} b={m} r={0.055} color={BC[SEQ[i]]} />
            <Rod a={m} b={b} r={0.055} color={BC[COMP[SEQ[i]]]} />
            {opt.bonds && Array.from({ length: nb }, (_, j) => {
              const offY = (j - (nb - 1) / 2) * 0.11;
              const aa: V3 = [a[0], a[1] + offY, a[2]], bb: V3 = [b[0], b[1] + offY, b[2]];
              return <Rod key={j} a={aa} b={bb} r={0.018} color="#f8fafc" o={0.95} />;
            })}
          </group>
        );
      })}
      <Html position={[p1(0)[0], p1(0)[1] - 0.5, 0]} center style={tag}><span className="tag">5′ (қызыл-күлгін тізбек)</span></Html>
      <Html position={[p1(N - 1)[0], p1(N - 1)[1] + 0.5, 0]} center style={tag}><span className="tag">3′</span></Html>
      <Html position={[p2(0)[0] + 1, p2(0)[1] - 0.2, 0]} center style={tag}><span className="tag">3′ (екінші тізбек)</span></Html>
      <Html position={[0, p1(0)[1] - 1.1, 0]} center style={tag}><span className="tag cy">Тізбек: {SEQ} ({N} н.ж.)</span></Html>
      <Html position={[1.6, 0.8, 0]} center style={tag}><span className="tag">Үлкен ойық</span></Html>
      <Html position={[-1.6, 0.2, 0]} center style={tag}><span className="tag">Кіші ойық</span></Html>
    </group>
  );
}

/* ---------------- 5. НУКЛЕОТИД ---------------- */
const EC: Record<string, string> = { C: '#94a3b8', N: '#4f7cff', O: '#ff5d5d', P: '#ffa94d' };
const ER: Record<string, number> = { C: 0.3, N: 0.3, O: 0.3, P: 0.4 };
export function NucleotideScene({ sel, tick, pick, atom }: S & { atom: string | null }) {
  const last = useRef('adenine');
  if (BASES.includes(sel)) last.current = sel;
  const bs = last.current, M = buildModel(bs);
  const grp = sel === 'phosphate' || sel === 'sugar' ? sel : sel === 'base' || BASES.includes(sel) ? 'base' : null;
  const pos = (id: string): V3 => { const a = M.atoms.find((x) => x[0] === id); return a ? [a[2] - 1.6, a[3] + M.dy, a[4] ?? 0] : [0, 0, 0]; };
  const at = atom && M.atoms.some((x) => x[0] === atom) ? atom : null;
  return (
    <>
      <Rig k={`${sel}-${tick}`} d={10} />
      {M.rings.map(([x, y, n, rot], i) => (
        <mesh key={i} position={[x - 1.6, y + M.dy, -0.1]} rotation={[0, 0, rot]} raycast={noRay}>
          <circleGeometry args={[n === 6 ? 0.92 : 0.78, n]} /><meshBasicMaterial color={M.col} transparent opacity={grp && grp !== 'base' ? 0.12 : 0.4} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      {M.bonds.map(([a, b]) => <Rod key={a + b} a={pos(a)} b={pos(b)} />)}
      {M.atoms.map(([id, g]) => {
        const e = id[0], dim = grp !== null && g !== grp, chosen = at === id;
        return (
          <mesh key={id} position={pos(id)} scale={chosen ? 1.35 : 1}
            onClick={(ev) => { ev.stopPropagation(); pick(g === 'base' ? bs : g, id); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
            <sphereGeometry args={[ER[e], 20, 20]} />
            <meshStandardMaterial color={EC[e]} transparent opacity={dim ? 0.25 : 1} emissive={EC[e]} emissiveIntensity={chosen ? 0.8 : 0} />
          </mesh>
        );
      })}
      {at && <Html position={pos(at)} center style={tag}><span className="tag">{at}</span></Html>}
      <Html position={[M.lab[0] - 1.6, M.lab[1] + M.dy, 0]} center style={tag}><span className="tag" style={{ borderColor: M.col }}>{M.cls}</span></Html>
      <Html position={[0.8, -3.6, 0]} center style={tag}><span className="tag">{M.sugar}</span></Html>
      <Html position={[3.4, 1.5, 0]} center style={tag}><span className="tag">Фосфат тобы</span></Html>
      <Html position={[0.8, -4.4, 0]} center style={tag}><span className="tag">{M.formula}</span></Html>
    </>
  );
}

/* ---------------- 6. МИТОХОНДРИЯНЫҢ ІШІ ---------------- */
function Shell({ s, c, o }: { s: V3; c: string; o: number }) {
  return <mesh scale={s} raycast={noRay}><sphereGeometry args={[1, 48, 32]} /><meshStandardMaterial color={c} transparent opacity={o} depthWrite={false} side={THREE.DoubleSide} /></mesh>;
}
const Ring = ({ p, c, on, onClick }: { p: V3; c: string; on: boolean; onClick: () => void }) => (
  <mesh position={p} rotation={[1.2, 0.4, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
    <torusGeometry args={[0.4, 0.06, 16, 64]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={on ? 0.9 : 0.25} />
  </mesh>
);
export function MitoScene({ sel, tick, pick }: S) {
  // Cristae are represented as continuous, curved folds of the inner membrane, not vertical bars.
  const cristae = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const x = -1.72 + i * 0.69;
    return [
      [x, -0.66, -0.16], [x - 0.13, -0.38, 0.02], [x + 0.12, -0.08, 0.18],
      [x - 0.11, 0.2, 0.17], [x + 0.12, 0.46, 0.02], [x, 0.66, -0.16]
    ] as V3[];
  }), []);
  return <>
    <Rig k={`${sel}-${tick}`} d={8} />
    <Shell s={[3, 1.4, 1.4]} c="#fb923c" o={0.13} />
    <Shell s={[2.76, 1.18, 1.18]} c="#f97316" o={0.25} />
    {cristae.map((path, i) => <group key={`crista-${i}`}>
      <TubePath points={path} radius={0.052} color={sel === 'mitochondrion' ? '#ffedd5' : i % 2 ? '#fed7aa' : '#fdba74'} />
      {/* Small F1-like heads are illustrative markers on the matrix-facing inner membrane. */}
      {[1, 3, 4].map((idx, j) => <group key={j} position={path[idx]} rotation={[0.2, 0.4, 0]}>
        <mesh position={[0.015, 0, 0.09]} raycast={noRay}><sphereGeometry args={[0.045, 16, 12]} /><meshStandardMaterial color="#fde68a" /></mesh>
        <Rod a={[0.015, 0, 0.02]} b={[0.015, 0, 0.08]} r={0.012} color="#fde68a" />
      </group>)}
    </group>)}
    {[[ -1.1, 0.05, 0.5 ], [0.9, -0.1, -0.4], [1.5, 0.05, 0.4], [-0.3, 0.1, -0.5]].map((p, i) => <mesh key={`rib-${i}`} position={p as V3} raycast={noRay}><sphereGeometry args={[0.065, 12, 12]} /><meshStandardMaterial color="#e2e8f0" roughness={0.65} /></mesh>)}
    <Ring p={[0.3, 0, 0.2]} c="#fde047" on={sel === 'mtdna'} onClick={() => pick('mtdna')} />
    <Html position={[0, 1.6, 0]} center style={tag}><span className="tag">Сыртқы мембрана</span></Html>
    <Html position={[0, -1.35, 0]} center style={tag}><span className="tag">Ішкі мембрана</span></Html>
    <Html position={[-1.2, 0.9, 0.3]} center style={tag}><span className="tag">Криста</span></Html>
    <Html position={[2.1, 0.9, 0.4]} center style={tag}><span className="tag yl">АТФ-синтаза · схема</span></Html>
    <Html position={[1.8, -0.2, 0]} center style={tag}><span className="tag">Матрикс · рибосомалар</span></Html>
    <Html position={[0.3, 0.55, 0.2]} center style={tag}><span className="tag">мтДНҚ (органелла геномы)</span></Html>
  </>;
}

/* ---------------- 7. ХЛОРОПЛАСТТЫҢ ІШІ ---------------- */
export function ChloroScene({ sel, tick, pick }: S) {
  const gr: V3[] = [[-1.6, 0.3, 0.3], [-0.4, -0.2, 0.5], [0.9, 0.4, -0.2], [-0.9, 0.5, -0.6], [0.2, -0.4, -0.7]];
  const lamellae: V3[][] = [
    [[-1.2,0.28,0.34],[-0.85,0.42,0.28],[-0.5,0.15,0.42],[-0.15,-0.08,0.49]],
    [[-0.1,-0.05,0.45],[0.25,0.03,0.24],[0.6,0.28,0.02],[0.82,0.38,-0.1]],
    [[-0.75,0.42,-0.55],[-0.35,0.2,-0.5],[0.05,-0.08,-0.62],[0.3,-0.3,-0.65]]
  ];
  return <>
    <Rig k={`${sel}-${tick}`} d={8} />
    <Shell s={[3, 1.7, 1.7]} c="#22c55e" o={0.12} />
    <Shell s={[2.84, 1.55, 1.55]} c="#16a34a" o={0.17} />
    {gr.map((p, i) => <group key={`granum-${i}`} position={p}>
      {Array.from({ length: 6 }, (_, j) => <mesh key={j} position={[0, (j - 2.5) * 0.105, 0]} scale={[0.38 - (Math.abs(j - 2.5) * 0.012), 0.055, 0.29 - (Math.abs(j - 2.5) * 0.01)]} rotation={[0.05 * i, 0.09 * (i % 2 ? 1 : -1), 0.04 * j]} raycast={noRay}>
        <sphereGeometry args={[1, 40, 24]} /><meshStandardMaterial color={sel === 'chloroplast' ? (j % 2 ? '#4ade80' : '#86efac') : (j % 2 ? '#15803d' : '#22c55e')} emissive={sel === 'chloroplast' ? '#22c55e' : '#000000'} emissiveIntensity={sel === 'chloroplast' ? 0.18 : 0.02} roughness={0.48} />
      </mesh>)}
    </group>)}
    {lamellae.map((path, i) => <TubePath key={`lamella-${i}`} points={path} radius={0.055} color="#86efac" opacity={0.9} />)}
    <mesh position={[-2, -0.8, 0]} raycast={noRay}><sphereGeometry args={[0.22, 24, 20]} /><meshStandardMaterial color="#f1f5f9" roughness={0.55} /></mesh>
    <Ring p={[1.7, -0.7, 0.5]} c="#fde047" on={sel === 'ctdna'} onClick={() => pick('ctdna')} />
    <Html position={[0, 1.9, 0]} center style={tag}><span className="tag">Қос мембраналы қабықша</span></Html>
    <Html position={[-1.6, 0.9, 0.3]} center style={tag}><span className="tag">Грана · тилакоид дискілері</span></Html>
    <Html position={[0.4, -1.1, 0.5]} center style={tag}><span className="tag">Строма</span></Html>
    <Html position={[1.7, -0.1, 0.5]} center style={tag}><span className="tag">Пластид ДНҚ-сы · схема</span></Html>
    <Html position={[-2, -1.2, 0]} center style={tag}><span className="tag">Крахмал түйіршігі</span></Html>
  </>;
}

/* ---------------- 8. ХРОМОСОМА (метафаза, схема) ---------------- */
export function ChromosomeScene({ sel, tick, pick, dup, selectBand }: S & { dup: boolean }) {
  // Detailed educational idiogram of chromosome 3. Cytoband names are real nomenclature;
  // their lengths and 3D positions are schematic, not exact GRCh38 base-pair coordinates.
  const centY = 0.25, pTop = 3.05;
  const pLen = pTop - centY;
  const centBp = 90_900_000, chrEndBp = 198_295_559;
  // Arm lengths are proportional to the GRCh38 chromosome-3 cytoband intervals.
  const qLen = pLen * (chrEndBp - centBp) / centBp;
  const qBottom = centY - qLen;
  const selected = useRef<string>('');
  const chromatids = dup ? [-1,1] : [0];
  const bandData = useMemo(() => {
    const make = (labels: string[], arm: Arm) => labels.map((label, i) => {
      const coord = GRCH38_CHR3_COORDS[label];
      // Every chromosome-3 band is mapped by its inclusive interval, not by equal-sized tiles.
      const midBp = (coord.start + coord.end) / 2;
      const armStart = arm === 'p' ? 1 : centBp + 1;
      const armEnd = arm === 'p' ? centBp : chrEndBp;
      const armLengthBp = armEnd - armStart + 1;
      const fraction = (midBp - armStart) / armLengthBp;
      const armTop = arm === 'p' ? pTop : centY;
      const armLength = arm === 'p' ? pLen : qLen;
      const y = armTop - fraction * armLength;
      const h = ((coord.end - coord.start + 1) / armLengthBp) * armLength;
      // Giemsa shades are illustrative; positional intervals and band labels use GRCh38.
      const dark = ([0,2,4,7,10,13,15,18,21,24,26].includes(i) !== (arm === 'q'));
      return { label, arm, y, h, fraction, dark };
    });
    return [...make(CHR3_P_BANDS, 'p'), ...make(CHR3_Q_BANDS, 'q')];
  }, [pTop, pLen, centY, qLen]);
  const on = sel === 'chromosome';
  return <>
    <Rig k={`${sel}-${tick}-${dup}`} d={10} />
    {chromatids.map((side, chromatidIndex) => <group key={side}>
      {bandData.map((b,i)=>{
        const armMax=b.arm==='p'?pLen:qLen;
        const distance=Math.abs(b.y-centY)/armMax;
        const x=side===0?0:side*(0.12+distance*0.36);
        const width=(b.arm==='p'?0.19:0.205)*(1-Math.exp(-distance*7)*0.04);
        const isSelected=selected.current===b.label;
        const color=b.dark?'#242934':'#c5cbd2';
        return <mesh key={`${side}-${b.label}`} position={[x,b.y,side*0.035]} scale={[width,b.h*0.58,width*0.82]} rotation={[0,0,side===0?0:side*distance*0.13]}
          onClick={(e)=>{e.stopPropagation();selected.current=b.label;selectBand?.(makeBandFocus('3',b.label,b.arm,b.fraction));}}
          onPointerOver={hov(true)} onPointerOut={hov(false)}>
          <sphereGeometry args={[1,40,28]}/><meshStandardMaterial color={isSelected?'#fbbf24':color} emissive={isSelected?'#fbbf24':color} emissiveIntensity={isSelected?0.35:on?0.08:0.015} roughness={0.52}/>
        </mesh>;
      })}
      {/* Centromeric constriction is shared by sister chromatids, rather than a floating torus. */}
      <mesh position={[side*(dup?0.1:0),centY,side*0.04]} scale={[0.13,0.24,0.14]}><sphereGeometry args={[1,40,28]}/><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={sel==='centromere'?0.55:0.18}/></mesh>
      {[[pTop, 'p'], [qBottom, 'q']].map(([y, end],i)=> <mesh key={`tel-${side}-${end}`} position={[side*(dup?0.48:0), Number(y), side*0.04]} scale={[0.09,0.11,0.08]} raycast={noRay}><sphereGeometry args={[1,24,18]}/><meshStandardMaterial color="#fde047"/></mesh>)}
    </group>)}
    <mesh position={[0,centY,0]} scale={[0.16,0.27,0.17]}><sphereGeometry args={[1,48,32]}/><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={sel==='centromere'?0.65:0.2}/></mesh>
    {/* A few cytoband labels like the reference idiogram; click any band for its name in the side panel. */}
    {bandData.filter((_,i)=>i%3===0).map((b)=> <Html key={b.label} position={[0.95,b.y,0]} center style={tag}>
      <span className="tag" style={{fontSize:10,padding:'2px 5px'}}>{b.label}</span>
    </Html>)}
    <Html position={[0,3.7,0]} center style={tag}><span className="tag cy">3-хромосома · G-жолақты идеограмма</span></Html>
    <Html position={[-1.15,1.6,0]} center style={tag}><span className="tag">p — қысқа иық</span></Html>
    <Html position={[-1.15,-1.9,0]} center style={tag}><span className="tag">q — ұзын иық</span></Html>
    {dup&&<Html position={[-1.15,0.25,0]} center style={tag}><span className="tag yl">Сіңлілі хроматидтер</span></Html>}
    <Html position={[0,-3.72,0]} center style={tag}><span className="tag">Жолақ номенклатурасы — цитогенетикалық орын; модель ұзындығы шартты</span></Html>
  </>;
}

/* ---------------- 9. РНҚ: шашақ-ілмек (стебель-петля), схема ---------------- */
const RC: Record<string, string> = { A: '#4ade80', U: '#c084fc', G: '#fbbf24', C: '#60a5fa' };
export function RnaScene({ sel, tick, pick }: S) {
  const A = 'GGAUCGC', B = 'CCUAGCG', th = (2 * Math.PI) / 11, rise = 0.4;
  const p1 = (i: number): V3 => [Math.cos(i * th), i * rise, Math.sin(i * th)];
  const p2 = (i: number): V3 => [Math.cos(i * th + 2.5), i * rise, Math.sin(i * th + 2.5)];
  const top = 6, a = p1(top), b = p2(top), m = a.map((v, k) => (v + b[k]) / 2) as V3;
  const loop = 'GAAA'.split('').map((c, k): [string, V3] => {
    const f = (Math.PI * (k + 1)) / 5;
    return [c, [m[0] + (a[0] - m[0]) * Math.cos(f), m[1] + Math.sin(f) * 1.1 + 0.2, m[2] + (a[2] - m[2]) * Math.cos(f)]];
  });
  const click = (e: { stopPropagation: () => void }) => { e.stopPropagation(); pick('rna'); };
  const dot = (c: string, p: V3, k: string) => <mesh key={k} position={p} onClick={click} onPointerOver={hov(true)} onPointerOut={hov(false)}><sphereGeometry args={[0.17, 14, 14]} /><meshStandardMaterial color={RC[c]} /></mesh>;
  return (
    <>
      <Rig k={`${sel}-${tick}`} at={[0, 1.4, 0]} d={9} />
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i}>
          <Rod a={p1(i)} b={p2(i)} r={0.05} color="#94a3b8" />
          {dot(A[i], p1(i), 'a' + i)}{dot(B[i], p2(i), 'b' + i)}
          {i > 0 && <><Rod a={p1(i - 1)} b={p1(i)} r={0.04} color="#c084fc" /><Rod a={p2(i - 1)} b={p2(i)} r={0.04} color="#c084fc" /></>}
        </group>
      ))}
      {loop.map(([c, p], k) => (
        <group key={k}>{dot(c, p, 'l' + k)}<Rod a={k === 0 ? a : loop[k - 1][1]} b={p} r={0.04} color="#c084fc" />{k === 3 && <Rod a={p} b={b} r={0.04} color="#c084fc" />}</group>
      ))}
      <Html position={[p1(0)[0] - 0.4, -0.4, 0]} center style={tag}><span className="tag">5′</span></Html>
      <Html position={[p2(0)[0] + 0.4, -0.4, 0]} center style={tag}><span className="tag">3′</span></Html>
      <Html position={[1.9, 1.2, 0]} center style={tag}><span className="tag">Шашақ: A–U, G–C жұптары</span></Html>
      <Html position={[0, 4, 0]} center style={tag}><span className="tag">Ілмек (GAAA тетралуп)</span></Html>
    </>
  );
}
