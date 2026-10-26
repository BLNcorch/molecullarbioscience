import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Rig, hov, tag, type S } from './Scenes';
import { CHROMS, GROUP_ORDER, G_BAND_LIGHT, G_BAND_DARK, bands, type ChrInfo } from '../data/karyotype';
import { labelForBand, makeBandFocus, type BandFocus, type Arm } from '../data/cytobands';

type V3 = [number, number, number];
const W = 0.46;            // идиограмма ені
const SCALE = 1 / 62;      // Мн.ж. → биіктік
const CEN = '#fbbf24';

/** Бір идиограмма: G-жолақтар + центромера + спутник */
function Idiogram({ info, x, hi, extra, onPick }: { info: ChrInfo; x: number; hi: boolean; extra: boolean; onPick: (band: BandFocus) => void }) {
  const H = info.mb * SCALE;
  const segs = bands(info.n, info.mb);
  const meshes: React.ReactNode[] = [];
  let acc = 0;
  segs.forEach((b, i) => {
    const h = b.f * H;
    const midY = H / 2 - acc - h / 2;
    const isCen = acc < info.cen * H && acc + h >= info.cen * H;
    const fromTop = (acc + h / 2) / H;
    const arm: Arm = fromTop < info.cen ? 'p' : 'q';
    const armFraction = arm === 'p' ? fromTop / Math.max(info.cen, 0.001) : (fromTop - info.cen) / Math.max(1 - info.cen, 0.001);
    const bandName = labelForBand(info.n, arm, armFraction);
    const col = extra ? '#f87171' : b.dark ? G_BAND_DARK : G_BAND_LIGHT;
    meshes.push(
      <mesh key={i} position={[x, midY, 0]} scale={[isCen ? W * 0.42 : W, Math.max(h * 0.68, 0.035), W * 0.39]} onClick={(e) => { e.stopPropagation(); onPick(makeBandFocus(info.n, bandName, arm, armFraction)); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color={isCen ? CEN : col} emissive={isCen ? CEN : col} emissiveIntensity={extra ? 0.5 : hi ? 0.32 : isCen ? 0.4 : 0.06} roughness={0.55} />
      </mesh>
    );
    acc += h;
  });
  return (
    <group>
      {meshes}
      {info.sat && (
        <group onClick={(e) => { e.stopPropagation(); onPick(makeBandFocus(info.n, labelForBand(info.n, 'p', 0), 'p', 0)); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
          <mesh position={[x, H / 2 + 0.14, 0]}><cylinderGeometry args={[0.035, 0.035, 0.22, 20, 2]} /><meshStandardMaterial color={hi ? '#c9d8ec' : '#5a6f8f'} /></mesh>
          <mesh position={[x, H / 2 + 0.33, 0]}><sphereGeometry args={[0.12, 24, 20]} /><meshStandardMaterial color={extra ? '#f87171' : '#9db4d4'} emissive={extra ? '#f87171' : '#9db4d4'} emissiveIntensity={extra ? 0.5 : hi ? 0.3 : 0.06} /></mesh>
        </group>
      )}
    </group>
  );
}

export interface KaryoProps extends Partial<S> { counts?: Record<string, number>; mini?: boolean }

export function KaryotypeScene({ sel = 'karyotype', tick = 0, pick = () => {}, selectBand, counts = {}, mini = false }: KaryoProps & { selectBand?: (band: BandFocus) => void }) {
  const nOf = (n: string) => counts[n] ?? (n === 'X' || n === 'Y' ? 1 : 2);
  const focusGrp = sel.startsWith('grp_') ? sel.slice(4).toUpperCase() : null;

  const rows = useMemo(() => {
    const out: { grp: string; items: { info: ChrInfo; count: number; x: number }[]; width: number; maxH: number; y: number }[] = [];
    let y = 0;
    for (const g of GROUP_ORDER) {
      const infos = CHROMS.filter((c) => c.group === g);
      const items: { info: ChrInfo; count: number; x: number }[] = [];
      let x = 0;
      infos.forEach((info) => {
        const count = nOf(info.n);
        if (count <= 0) return;
        const w = count * (W + 0.16) + 0.55;
        items.push({ info, count, x: x + w / 2 });
        x += w + 0.4;
      });
      const width = Math.max(x - 0.4, 0.5);
      const maxH = Math.max(...items.map((it) => it.info.mb * SCALE), 1);
      out.push({ grp: g, items, width, maxH, y: y + maxH / 2 });
      y += maxH + (mini ? 1.0 : 1.2);
    }
    return { out, totalH: y - (mini ? 1.0 : 1.2) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(counts), mini]);

  const rowY = (r: { y: number }) => rows.totalH / 2 - r.y;
  const focusRow = rows.out.find((r) => r.grp === focusGrp);
  const at: V3 = focusRow ? [0, rowY(focusRow), 0] : [0, 0, 0];
  const d = focusRow ? Math.max(focusRow.width * 1.7, 8) : Math.max(18, rows.totalH * 1.62);

  return (
    <>
      <Rig k={`${sel}-${tick}-${JSON.stringify(counts)}`} at={at} d={d} />
      {rows.out.map((row) => {
        const hi = focusGrp === row.grp;
        const gy = rowY(row);
        return (
          <group key={row.grp} position={[0, gy, 0]}>
            <mesh position={[-row.width / 2 - (mini ? 1.0 : 1.4), 0, 0]}
              onClick={(e) => { e.stopPropagation(); pick(`grp_${row.grp.toLowerCase()}`); }} onPointerOver={hov(true)} onPointerOut={hov(false)}>
              <sphereGeometry args={[0.4, 32, 24]} />
              <meshStandardMaterial color={hi ? CEN : '#33465f'} emissive={hi ? CEN : '#33465f'} emissiveIntensity={hi ? 0.7 : 0.15} transparent opacity={hi ? 1 : 0.85} />
            </mesh>
            {!mini && (
              <Html position={[-row.width / 2 - 1.4, 0, 0]} center style={tag}>
                <span className={'tag lg' + (hi ? ' yl' : '')}>{row.grp}</span>
              </Html>
            )}
            {row.items.map(({ info, count, x }) => {
              const px = x - row.width / 2;
              const base = info.n === 'X' || info.n === 'Y' ? 1 : 2;
              const abnormal = count !== base;
              return (
                <group key={info.n} position={[px, 0, 0]}>
                  {Array.from({ length: count }, (_, k) => (
                    <Idiogram key={k} info={info} x={(k - (count - 1) / 2) * (W + 0.16)} hi={hi} extra={count > base}
                      onPick={(band) => { selectBand?.(band); }} />
                  ))}
                  {!mini && (
                    <Html position={[0, -info.mb * SCALE / 2 - 0.42, 0]} center style={tag}>
                      <span className={'tag' + (abnormal ? ' rd' : '')}>{info.n}{count > 2 ? ` ×${count}` : ''}</span>
                    </Html>
                  )}
                </group>
              );
            })}
          </group>
        );
      })}
    </>
  );
}
