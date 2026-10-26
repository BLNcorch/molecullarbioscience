import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Rig, tag, type S } from './Scenes';

type V3 = [number, number, number];
const HCOL = ['#facc15', '#fb7185', '#60a5fa', '#4ade80']; // H2A, H2B, H3, H4
const HNAME = ['H2A', 'H2B', 'H3', 'H4'];

/** Гистон октамері + құйрықтары (Ac жасыл / Me қызыл белгілерімен) */
function Nucleosome({ x, ac, tilt = 0 }: { x: number; ac: number; tilt?: number }) {
  const tails = useMemo(() => {
    const mk = (from: V3, ctrl: V3, to: V3, col: string) => ({ curve: new THREE.QuadraticBezierCurve3(new THREE.Vector3(...from), new THREE.Vector3(...ctrl), new THREE.Vector3(...to)), col });
    return [
      mk([0.15, 0.55, 0.25], [0.7, 1.25, 0.55], [1.25, 1.45, 0.85], HCOL[2]),  // H3 (ұзын құйрық)
      mk([-0.2, 0.5, 0.3], [-0.7, 1.0, 0.5], [-1.15, 1.1, 0.7], HCOL[3]),     // H4
      mk([0.3, -0.5, 0.3], [0.9, -0.95, 0.6], [1.35, -1.05, 0.8], HCOL[0]),   // H2A
      mk([-0.3, -0.5, 0.25], [-0.85, -0.85, 0.5], [-1.25, -0.9, 0.65], HCOL[1]), // H2B
    ];
  }, []);
  const acN = Math.round(ac * 4);
  return (
    <group position={[x, 0, 0]} rotation={[0, tilt, 0]}>
      {[0.3, -0.3].map((y, li) =>
        [0, 1, 2, 3].map((i) => {
          const a = (i * Math.PI) / 2 + (li ? Math.PI / 4 : 0);
          return (
            <mesh key={`${li}-${i}`} position={[Math.cos(a) * 0.48, y, Math.sin(a) * 0.48]} scale={[1, 1.15, 1]} raycast={() => null}>
              <sphereGeometry args={[0.34, 40, 32]} />
              <meshStandardMaterial color={HCOL[i]} roughness={0.5} />
            </mesh>
          );
        })
      )}
      {tails.map((t, ti) => {
        const pts = [0.3, 0.5, 0.7, 0.88].map((f) => t.curve.getPoint(f));
        return (
          <group key={ti}>
            <mesh raycast={() => null}>
              <tubeGeometry args={[t.curve, 48, 0.035, 12, false]} />
              <meshStandardMaterial color={t.col} roughness={0.6} />
            </mesh>
            {pts.map((p, mi) => (
              <mesh key={mi} position={p} raycast={() => null}>
                <sphereGeometry args={[0.075, 20, 16]} />
                <meshStandardMaterial color={mi < acN ? '#4caf50' : '#f44336'} emissive={mi < acN ? '#4caf50' : '#f44336'} emissiveIntensity={0.45} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

export interface EpiProps extends S { epi: { me: number; ac: number } }

export function EpigeneticsScene({ sel, tick, pick, epi }: EpiProps) {
  const { me, ac } = epi;
  const compact = Math.min(1, Math.max(0, 0.55 * me + 0.45 * (1 - ac)));
  const d = 5.6 - compact * 2.6;
  const active = ac - me * 0.5 > 0.12;
  const half = d / 2;

  const curve = useMemo(() => {
    const R = 1.04, turns = Math.PI * 3.3, pts: THREE.Vector3[] = [];
    pts.push(new THREE.Vector3(-half - 2.7, -0.12, 0.35));
    pts.push(new THREE.Vector3(-half - 1.7, -0.24, 0.55));
    for (let i = 0; i <= 36; i++) {
      const th = Math.PI * 0.42 + (i / 36) * turns;
      pts.push(new THREE.Vector3(-half + Math.cos(th) * R, -0.32 + (i / 36) * 0.64, Math.sin(th) * R));
    }
    pts.push(new THREE.Vector3(-half + R * 0.7, 0.34, -R * 0.7));
    pts.push(new THREE.Vector3(0, -0.42 * (1 - compact) - 0.06, 0.62));
    pts.push(new THREE.Vector3(half - R * 0.7, 0.34, -R * 0.7));
    for (let i = 0; i <= 36; i++) {
      const th = Math.PI * 0.58 - (i / 36) * turns;
      pts.push(new THREE.Vector3(half + Math.cos(th) * R, 0.32 - (i / 36) * 0.64, Math.sin(th) * R));
    }
    pts.push(new THREE.Vector3(half + 1.7, -0.24, 0.55));
    pts.push(new THREE.Vector3(half + 2.7, -0.12, 0.35));
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35);
  }, [half, compact]);

  const cpgSites = useMemo(() => {
    const fr = [0.02, 0.08, 0.15, 0.3, 0.38, 0.46, 0.5, 0.54, 0.62, 0.7, 0.85, 0.92, 0.98, 0.24, 0.76, 0.35, 0.65];
    const n = 2 + Math.round(me * (fr.length - 2));
    return fr.slice(0, n).map((f) => curve.getPointAt(f));
  }, [curve, me]);

  const mrna = useMemo(() => {
    const pts: V3[] = [];
    for (let i = 0; i < 10; i++) pts.push([half + 1.6 + i * 0.28, -0.55 - i * 0.1, 0.7 + Math.sin(i * 0.9) * 0.18]);
    return pts;
  }, [half]);

  return (
    <>
      <Rig k={`${sel}-${tick}`} d={10.5} />
      <mesh raycast={() => null}>
        <tubeGeometry args={[curve, 360, 0.085, 16, false]} />
        <meshStandardMaterial color="#22d3ee" roughness={0.45} emissive="#22d4ee" emissiveIntensity={0.12} />
      </mesh>
      <Nucleosome x={-half} ac={ac} tilt={-0.15 * compact} />
      <Nucleosome x={half} ac={ac} tilt={0.35 + 0.2 * compact} />
      {cpgSites.map((p, i) => (
        <mesh key={i} position={p} raycast={() => null}>
          <sphereGeometry args={[0.13, 24, 20]} />
          <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={0.55} />
        </mesh>
      ))}
      {compact > 0.5 && (
        <>
          <mesh position={[-half + 1.15, 0.28, -0.7]} raycast={() => null}><sphereGeometry args={[0.24, 14, 14]} /><meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.4} /></mesh>
          <mesh position={[half - 1.15, 0.28, -0.7]} raycast={() => null}><sphereGeometry args={[0.24, 14, 14]} /><meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.4} /></mesh>
          <Html position={[-half + 1.5, 0.75, -0.7]} center style={tag}><span className="tag yl">H1 гистоны</span></Html>
        </>
      )}
      {active && (
        <>
          {mrna.map((p, i) => (
            <mesh key={i} position={p} raycast={() => null}><sphereGeometry args={[0.09, 10, 10]} /><meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.5} /></mesh>
          ))}
          <Html position={[half + 2.6, -1.6, 0.9]} center style={tag}><span className="tag gn">мРНҚ синтезделуде →</span></Html>
        </>
      )}
      <Html position={[0, 2.5, 0]} center style={tag}>
        <span className={'tag lg ' + (active ? 'gn' : 'rd')}>{active ? 'ГЕН БЕЛСЕНДІ · эухроматин' : 'ГЕН РЕПРЕССИЯЛАНҒАН · гетерохроматин'}</span>
      </Html>
      <Html position={[-half, -1.25, 0.6]} center style={tag}><span className="tag">Гистон октамері ({HNAME.join('·')})</span></Html>
      <Html position={[0, -0.95, 1]} center style={tag}><span className="tag cy">Линкерлік ДНҚ</span></Html>
      <Html position={[-half - 2.2, 1.9, 0]} center style={tag}><span className="tag gn">Ac — ацетил (ашық)</span></Html>
      <Html position={[half + 2.2, 1.9, 0]} center style={tag}><span className="tag rd">Me — метил (жабық)</span></Html>
      {cpgSites.length > 2 && <Html position={[0, -1.5, 0]} center style={tag}><span className="tag" style={{ borderColor: '#c084fc', color: '#c084fc' }}>CpG — 5-метилцитозин</span></Html>}
      <Html position={[half + 1.6, -1.35, 0]} center style={tag}><span className="tag">≈147 н.ж. бір нуклеосомаға</span></Html>
    </>
  );
}
