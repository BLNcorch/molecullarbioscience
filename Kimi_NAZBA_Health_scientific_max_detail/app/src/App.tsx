import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { NODES, PARENT, ELEMENTS, BASES, type Id } from './data/science';
import { CellScene, MembraneScene, NucleusScene, ChromatinScene, DnaScene, NucleotideScene, MitoScene, ChloroScene, ChromosomeScene, RnaScene } from './scenes/Scenes';
import { type BandFocus } from './data/cytobands';
import { KaryotypeScene } from './scenes/Karyotype';
import { EpigeneticsScene } from './scenes/Epigenetics';
import { MutationLab } from './MutationLab';

const IcoSearch = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
const IcoHome = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>;
const IcoBack = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>;
const IcoReset = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>;
const IcoMenu = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>;

export default function App() {
  const init = (() => { try { const v = new URLSearchParams(location.search).get('n'); return v && NODES[v] ? v : 'cell'; } catch { return 'cell'; } })();
  const [sel, setSel] = useState<Id>(init);
  const [atom, setAtom] = useState<string | null>(null);
  const [plant, setPlant] = useState(false);
  const [long, setLong] = useState(true);
  const [cond, setCond] = useState(0.4);
  const [opt, setOpt] = useState({ backbone: true, bonds: true });
  const [tick, setTick] = useState(0);
  const [dup, setDup] = useState(true);
  const [karXX, setKarXX] = useState(false);
  const [epi, setEpi] = useState({ me: 0.7, ac: 0.15 });
  const [q, setQ] = useState('');
  const [selectedBand, setSelectedBand] = useState<BandFocus | null>(null);
  const [menuVisible, setMenuVisible] = useState(true);
  const [sections, setSections] = useState<Record<string, boolean>>({ cell: true, rna: false, karyotype: false, epigenetics: false, mutations: false });
  const [treeExpanded, setTreeExpanded] = useState<Record<string, boolean>>({ cell: true });
  const node = NODES[sel];
  const vis = (id: Id) => (plant || !NODES[id].plantOnly) && !(plant && NODES[id].animalOnly);

  const pick = (id: Id, a: string | null = null) => {
    setSel(id); setAtom(a); setSelectedBand(null);
    if (id === 'chromosome') setCond(1); else if (id === 'chromatin') setCond(0.4); else if (id === 'nucleosome') setCond(0);
  };
  const chain: Id[] = []; for (let i: Id | undefined = sel; i; i = PARENT[i]) chain.unshift(i);
  const found = q.trim() ? Object.keys(NODES).filter((id) => vis(id) && (NODES[id].kk + NODES[id].en).toLowerCase().includes(q.trim().toLowerCase())) : [];
  const el = atom ? ELEMENTS[atom[0]] : null;
  const sceneProps = { sel, tick, pick, selectBand: (band: BandFocus) => setSelectedBand(band) };
  const toggleSection = (id: string) => setSections((v) => ({ ...v, [id]: !v[id] }));

  const Tree = ({ id, d }: { id: Id; d: number }) => {
    const kids = NODES[id].kids?.filter(vis) ?? [];
    const expanded = !!treeExpanded[id];
    return <>
      <div className="tree-row">
        <button className={'tree' + (sel === id ? ' on' : '')} style={{ paddingLeft: 5 + d * 9 }} onClick={() => pick(id)} title={NODES[id].en}>
          <span className="tree-label">{NODES[id].kk}{NODES[id].ownDna ? ' ◆' : ''}</span>
        </button>
        {kids.length > 0 && <button type="button" className="tree-toggle" aria-expanded={expanded} aria-label={expanded ? 'Ішкі бөлімді жию' : 'Ішкі бөлімді ашу'} title={expanded ? 'Ішкі бөлімді жию' : 'Ішкі бөлімді ашу'} onClick={() => setTreeExpanded((v) => ({ ...v, [id]: !expanded }))}>{expanded ? '−' : '+'}</button>}
      </div>
      {expanded && kids.map((k) => <Tree key={k} id={k} d={d + 1} />)}
    </>;
  };

  return (
    <div className={'app' + (!menuVisible ? ' menu-hidden' : '')}>
      <header>
        <div className="brand" onClick={() => pick('cell')}>
          <b>NAZBA <span>Health</span></b>
          <small>Молекулалық биология · 3D зертхана</small>
        </div>
        <div className="search">
          {IcoSearch}
          <input placeholder="Іздеу: ДНҚ, аденин, кариотип, метилдену…" value={q} onChange={(e) => setQ(e.target.value)} />
          {found.length > 0 && <div className="results">{found.map((id) => <button key={id} onClick={() => { pick(id); setQ(''); }}>{NODES[id].kk} <small>{NODES[id].en}</small></button>)}</div>}
          {q.trim() && found.length === 0 && <div className="results"><small>Ештеңе табылмады. Қазір {Object.keys(NODES).length} нысан бар.</small></div>}
        </div>
        <div className="hbtns">
          <button onClick={() => setMenuVisible(!menuVisible)}>{IcoMenu} {menuVisible ? 'Менюны жию' : 'Меню'}</button>
          <button onClick={() => pick('cell')}>{IcoHome} Басты бет</button>
          <button onClick={() => PARENT[sel] && pick(PARENT[sel])} disabled={!PARENT[sel]}>{IcoBack} Артқа</button>
          <button onClick={() => setTick(tick + 1)}>{IcoReset} Камера</button>
        </div>
      </header>

      {menuVisible && <aside>
        <div className="sec">
          <div className="seg">
            <button className={!plant ? 'on' : ''} onClick={() => { setPlant(false); pick('cell'); }}>Жануар</button>
            <button className={plant ? 'on' : ''} onClick={() => { setPlant(true); pick('cell'); }}>Өсімдік</button>
          </div>
          <button className="sec-title sec-toggle" onClick={() => toggleSection('cell')}>Жасуша құрылымы <span>{sections.cell ? '−' : '+'}</span></button>
          {sections.cell && <Tree id="cell" d={0} />}
        </div>
        <div className="sec">
          <button className="sec-title sec-toggle" onClick={() => toggleSection('rna')}>РНҚ әлемі <span>{sections.rna ? '−' : '+'}</span></button>
          {sections.rna && <Tree id="rna" d={0} />}
        </div>
        <div className="sec">
          <button className="sec-title sec-toggle" onClick={() => toggleSection('karyotype')}>Кариотип · A–G топтары <span>{sections.karyotype ? '−' : '+'}</span></button>
          {sections.karyotype && <Tree id="karyotype" d={0} />}
        </div>
        <div className="sec">
          <button className="sec-title sec-toggle" onClick={() => toggleSection('epigenetics')}>Эпигенетика <span>{sections.epigenetics ? '−' : '+'}</span></button>
          {sections.epigenetics && <Tree id="epigenetics" d={0} />}
        </div>
        <div className="sec">
          <button className="sec-title sec-toggle" onClick={() => toggleSection('mutations')}>Мутациялар зертханасы <span>{sections.mutations ? '−' : '+'}</span></button>
          {sections.mutations && <Tree id="mutations" d={0} />}
        </div>
        <p className="legend"><b>◆</b> — өз ДНҚ-сы бар нысан</p>
      </aside>}

      <main>
        <nav className="crumbs">
          {chain.map((id, i) => (
            <span key={id}>
              {i > 0 && <span className="sep">/</span>}
              <button className={i === chain.length - 1 ? 'cur' : ''} onClick={() => pick(id)}>{NODES[id].kk}</button>
            </span>
          ))}
        </nav>
        {node.scene === 'lab' ? (
          <div className="labscroll"><MutationLab kind={sel} /></div>
        ) : (
          <Canvas camera={{ position: [2, 3, 9], fov: 45 }} dpr={[1, 2]}>
            <color attach="background" args={['#101014']} />
            <ambientLight intensity={0.75} /><directionalLight position={[5, 6, 5]} intensity={1.35} />
            <Suspense fallback={null}>
              {node.scene === 'cell' && <CellScene {...sceneProps} plant={plant} />}
              {node.scene === 'membrane' && <MembraneScene {...sceneProps} />}
              {node.scene === 'nucleus' && <NucleusScene {...sceneProps} />}
              {node.scene === 'mito' && <MitoScene {...sceneProps} />}
              {node.scene === 'rna' && <RnaScene {...sceneProps} />}
              {node.scene === 'chromosome' && <ChromosomeScene {...sceneProps} dup={dup} />}
              {node.scene === 'chloro' && <ChloroScene {...sceneProps} />}
              {node.scene === 'chromatin' && <ChromatinScene {...sceneProps} cond={cond} />}
              {node.scene === 'dna' && <DnaScene {...sceneProps} opt={opt} />}
              {node.scene === 'nucleotide' && <NucleotideScene {...sceneProps} atom={atom} />}
              {node.scene === 'karyotype' && <KaryotypeScene {...sceneProps} counts={karXX ? { X: 2, Y: 0 } : {}} />}
              {node.scene === 'epi' && <EpigeneticsScene {...sceneProps} epi={epi} />}
            </Suspense>
          </Canvas>
        )}
        {node.scene !== 'lab' && <div className="hint">Айналдыру: тышқан/саусақ · Үлкейту: дөңгелек · Объектіні басыңыз</div>}
      </main>

      <section className="panel">
        <div className="p-head">
          <h2>{node.kk}</h2>
          <p className="en">{node.en}</p>
          <div className="badges">
            {node.ownDna && <span className="badge own">◆ ӨЗ ДНҚ-СЫ БАР</span>}
            <span className="badge sc">{Object.keys(NODES).length} нысан · ғылыми дереккөздермен</span>
          </div>
        </div>

        {(node.scene === 'membrane' || node.scene === 'chromatin' || node.scene === 'dna' || node.scene === 'nucleotide' || node.scene === 'chromosome' || node.scene === 'cell' || node.scene === 'karyotype' || node.scene === 'epi') && (
          <div className="tools">
            {node.scene === 'chromatin' && <div className="tl-row"><label>Тығыздалу деңгейі</label>
              <input type="range" min={0} max={1} step={0.01} value={cond} onChange={(e) => setCond(+e.target.value)} />
              <span className="tl-val">{cond < 0.24 ? '≈10–11 нм нуклеосомалық жіп' : cond < 0.53 ? 'Жоғары ретті бүктелу' : cond < 0.8 ? 'Ілмекті домендер' : 'Митоздық хроматиданың силуэті'}</span></div>}
            {node.scene === 'dna' && <>
              <div className="tl-row">
                <label><input type="checkbox" checked={opt.backbone} onChange={(e) => setOpt({ ...opt, backbone: e.target.checked })} /> Қант–фосфат қаңқа</label>
                <label><input type="checkbox" checked={opt.bonds} onChange={(e) => setOpt({ ...opt, bonds: e.target.checked })} /> Сутектік байланыстар</label>
              </div>
              <span className="tl-note">A жасыл · T қызыл · G сары · C көк. ДНҚ-ны басыңыз → нуклеотид моделі.</span></>}
            {node.scene === 'nucleotide' && <>
              <div className="tl-row basebtns">{BASES.map((x) => <button key={x} className={sel === x ? 'on' : ''} onClick={() => pick(x)}>{NODES[x].kk}</button>)}</div>
              <span className="tl-note">Қызғылт-сары — пурин, бірюза — пиримидин. Схемалық 2D, сутек жоқ. Атомды басыңыз.</span></>}
            {node.scene === 'chromosome' && <>
              <div className="tl-row"><label><input type="checkbox" checked={dup} onChange={(e) => setDup(e.target.checked)} /> Репликациядан кейін: екі сіңлілі хроматида</label></div>
              <span className="tl-note">Бір хроматида — репликациядан кейінгі екі сіңлілі хроматидамен салыстыруға арналған схема. Геометриялық өлшемдер нақты нанометрлік масштабта емес.</span></>}
            {node.scene === 'cell' && <span className="tl-note">Жасушаның жалпы көрінісі. Өлшемдер салыстырмалы және масштабта емес; органоидтің ішкі құрылымын сол жақтан таңдаңыз.</span>}
            {node.scene === 'membrane' && <span className="tl-note">Үлкейтілген мембрана кесіндісі: полярлы бастар су фазаларына, гидрофобты құйрықтар бір-біріне қарайды. Элементтердің биіктігі схемалық түрде үлкейтілген.</span>}
            {node.scene === 'karyotype' && <>
              <div className="tl-row basebtns">
                <button className={!karXX ? 'on' : ''} onClick={() => setKarXX(false)}>46,XY (еркек)</button>
                <button className={karXX ? 'on' : ''} onClick={() => setKarXX(true)}>46,XX (әйел)</button>
              </div>
              <span className="tl-note">Хромосома биіктігі шамаланған Мб ұзындығына пропорционал; жолақ үлгісі оқу схемасы. Жолақты басыңыз → цитогенетикалық белгі мен шартты орны көрсетіледі.</span></>}
            {node.scene === 'epi' && <>
              <div className="tl-row"><label>ДНҚ метилденуі</label>
                <input type="range" min={0} max={1} step={0.01} value={epi.me} onChange={(e) => setEpi({ ...epi, me: +e.target.value })} />
                <span className="tl-val">{Math.round(epi.me * 100)}% CpG</span></div>
              <div className="tl-row"><label>Гистон ацетилденуі</label>
                <input type="range" min={0} max={1} step={0.01} value={epi.ac} onChange={(e) => setEpi({ ...epi, ac: +e.target.value })} />
                <span className="tl-val">{epi.ac < 0.3 ? 'төмен' : epi.ac < 0.7 ? 'орташа' : 'жоғары'}</span></div>
              <span className="tl-note">Метилдену жоғары + ацетилдену төмен болса — хроматин тығыздалып, ген үнсіз қалады; керісінше — ашылып, транскрипция жүреді.</span></>}
          </div>
        )}

        {selectedBand && <div className="p-sec coordinate-card">
          <h4>Таңдалған хромосома жолағы · координатасы</h4>
          <div className="coordinate-id">{selectedBand.cytoband}</div>
          <table><tbody>
            <tr><td>Хромосома</td><td>{selectedBand.chromosome}</td></tr>
            <tr><td>Иық</td><td>{selectedBand.arm}</td></tr>
            <tr><td>Идеограммадағы орны</td><td>{selectedBand.position}</td></tr>
            <tr><td>Координата түрі</td><td>Цитогенетикалық жолақ</td></tr>
            {selectedBand.genomicCoordinates && <tr><td>Геномдық координаталар</td><td className="genomic-coords">{selectedBand.genomicCoordinates}</td></tr>}
          </tbody></table>
          <p className="coordinate-note">{selectedBand.note}</p>
          <button className="link" onClick={() => setSelectedBand(null)}>Жолақты тазарту</button>
        </div>}

        {el && <div className="p-sec"><div className="atom"><b>{el.sym}</b> — {el.kk}, атомдық нөмірі {el.z}. Атом: {atom}. {el.role}</div></div>}

        <div className="p-sec">
          <h4>Сипаттама</h4>
          <p style={{ fontWeight: 600 }}>{node.short}</p>
          {long && <p>{node.text}</p>}
          <button className="link" onClick={() => setLong(!long)}>{long ? 'Жасыру ↑' : 'Толық сипаттама ↓'}</button>
        </div>

        {node.table && <div className="p-sec"><h4>Параметрлер</h4><table><tbody>{node.table.map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}</tbody></table></div>}
        {node.formula && <div className="p-sec"><h4>Формула</h4><div className="formula">{node.formula}{node.mass ? ` · ${node.mass}` : ''}</div></div>}
        {long && node.parts && <div className="p-sec"><h4>Құрамдас бөліктері</h4><ul>{node.parts.map((p) => <li key={p}>{p}</li>)}</ul></div>}
        {long && node.fact && <div className="p-sec"><div className="fact"><b>Қызықты дерек</b>{node.fact}</div></div>}
        {node.kids?.filter(vis).length ? (
          <div className="p-sec"><h4>Ішкі құрылымын зерттеу</h4><div className="kids">{node.kids.filter(vis).map((k) => <button key={k} onClick={() => pick(k)}>{NODES[k].kk}</button>)}</div></div>
        ) : null}
        <div className="p-sec"><h4>Дереккөздер</h4><ul className="src">{node.src.map((s) => <li key={s}>{s}</li>)}</ul></div>
      </section>
    </div>
  );
}
