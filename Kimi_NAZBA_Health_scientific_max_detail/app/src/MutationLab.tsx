import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { NODES, type Id } from './data/science';
import { KaryotypeScene } from './scenes/Karyotype';
import { DnaMutScene, ChromMutScene, MitoHetScene, CHROM_OPS } from './scenes/MutScenes';

// Генетикалық код (TCAG реті): индекс = 16·b1 + 4·b2 + b3
const AA = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG', O = 'TCAG';
const aa = (c: string) => AA[16 * O.indexOf(c[0]) + 4 * O.indexOf(c[1]) + O.indexOf(c[2])] ?? '?';
function translate(d: string) {
  const s = d.indexOf('ATG'); if (s < 0) return { s, p: [] as string[], stop: false };
  const p: string[] = []; let stop = false;
  for (let i = s; i + 3 <= d.length; i += 3) { const a = aa(d.slice(i, i + 3)); if (a === '*') { stop = true; break; } p.push(a); }
  return { s, p, stop };
}
const Chips = ({ a, ref_ }: { a: string[]; ref_?: string[] }) => (
  <div className="chips">{a.map((x, i) => <span key={i} className={'chip' + (ref_ && ref_[i] !== x ? ' diff' : '')}>{x}</span>)}</div>
);
const Row = ({ a }: { a: string[] }) => <div className="chips">{a.map((x, i) => <span key={i} className="chip">{x}</span>)}</div>;

const PRESETS: { name: string; hint: string; seq: string; type: 'sub' | 'ins' | 'del'; pos: number; base: string }[] = [
  { name: 'Орақ тәрізді анемия', hint: 'HBB · Glu6Val', seq: 'ATGGTGCACCTGACTCCTGAGGAGAAGTCT', type: 'sub', pos: 17, base: 'T' },
  { name: 'Муковисцидоз ΔF508', hint: 'CFTR · 3 н.ж. дел', seq: 'AATATAATCTTTGGTGTTTCCTAT', type: 'del', pos: 10, base: '3' },
  { name: 'Хантингтон', hint: 'HTT · CAG экспансиясы', seq: 'ATGGCGACCCTGGAGCAGCAGCAGAAG', type: 'ins', pos: 19, base: 'CAGCAGCAG' },
  { name: 'Тэй–Закс', hint: 'HEXA · TATC инсерциясы', seq: 'ATGTATCTATGTCCAGACTGA', type: 'ins', pos: 7, base: 'TATC' },
  { name: 'Дюшенн дистрофиясы', hint: 'DMD · нонсенс', seq: 'ATGCAGAAGGTTGA', type: 'sub', pos: 4, base: 'T' },
];
const PUR = (b: string) => b === 'A' || b === 'G';

function highlight(ref: string, mut: string) {
  let pre = 0; while (pre < Math.min(ref.length, mut.length) && ref[pre] === mut[pre]) pre++;
  let suf = 0; while (suf < Math.min(ref.length, mut.length) - pre && ref[ref.length - 1 - suf] === mut[mut.length - 1 - suf]) suf++;
  const span = (s: string) => (<>{s.slice(0, pre)}<span className="mutbp">{s.slice(pre, s.length - suf) || '·'}</span>{s.slice(s.length - suf)}</>);
  return { ref: span(ref), mut: span(mut) };
}

function Gene() {
  const [seq, setSeq] = useState(PRESETS[0].seq);
  const [type, setType] = useState<'sub' | 'ins' | 'del'>('sub');
  const [pos, setPos] = useState(17);
  const [base, setBase] = useState('T');
  const [activePreset, setActivePreset] = useState<number | null>(0);
  const d = seq.toUpperCase().replace(/[^ACGT]/g, '');
  const p = Math.min(Math.max(pos, 1), Math.max(d.length, 1)) - 1;
  const insStr = base.toUpperCase().replace(/[^ACGT]/g, '').slice(0, 12);
  const delLen = Math.min(Math.max(parseInt(base) || 1, 1), 12);
  const m = type === 'sub' ? d.slice(0, p) + (insStr[0] || 'A') + d.slice(p + 1)
    : type === 'ins' ? d.slice(0, p + 1) + insStr + d.slice(p + 1) : d.slice(0, p) + d.slice(p + delLen);
  const o = translate(d), t = translate(m);
  let kind = 'Өзгеріс жоқ', vc = 'ok';
  if (d.length < 6 || o.s < 0) { kind = 'ATG бастау кодоны табылмады — кемінде 6 нуклеотид пен ATG енгізіңіз'; vc = 'warn'; }
  else if (m !== d) {
    if (type !== 'sub') { kind = (m.length - d.length) % 3 === 0 ? 'Инсерция/делеция: оқу рамасы сақталды (in-frame)' : 'Оқу рамасының ығысуы (frameshift)'; vc = (m.length - d.length) % 3 === 0 ? 'warn' : 'bad'; }
    else if (o.p.join() === t.p.join() && o.stop === t.stop) { kind = 'Үнсіз (синонимдік) мутация немесе кодтаушы емес аймақ'; vc = 'ok'; }
    else if (t.p.length < o.p.length) { kind = 'Нонсенс мутация — мерзімінен бұрын тоқтату кодоны (қысқарған ақуыз)'; vc = 'bad'; }
    else if (t.p.length > o.p.length) { kind = 'Тоқтату кодоны жоғалды (stop-loss, ұзарған ақуыз)'; vc = 'bad'; }
    else { kind = 'Миссенс мутация — аминқышқыл ауысты'; vc = 'warn'; }
  }
  const subClass = type === 'sub' && d[p] && m[p] && d[p] !== m[p]
    ? (PUR(d[p]) === PUR(m[p]) ? 'транзиция (пурин↔пурин немесе пиримидин↔пиримидин)' : 'трансверсия (пурин↔пиримидин)') : null;
  const rna = (x: string) => x.replace(/T/g, 'U');
  const hl = highlight(d, m);
  const apply = (i: number) => { const pr = PRESETS[i]; setSeq(pr.seq); setType(pr.type); setPos(pr.pos); setBase(pr.base); setActivePreset(i); };
  const hp = Math.min(Math.max(pos, 1), Math.max(d.length, 1));
  const hlen = type === 'del' ? delLen : type === 'ins' ? insStr.length : 1;
  return (
    <div className="lab">
      <h3>Гендік (нүктелік) мутация симуляторы</h3>
      <p className="sub">Нақты аурулардың пресетін таңдаңыз немесе өз тізбегіңізді енгізіңіз — салдары ақуыз деңгейінде есептеледі, мутация орны 3D-спиральде көрсетіледі.</p>
      <div className="labgrid">
        <div className="labcol">
          <div className="labbox">
            <h4>Науқас пресеттері</h4>
            <div className="presets">
              {PRESETS.map((pr, i) => (
                <button key={i} className={activePreset === i ? 'on' : ''} onClick={() => apply(i)}>{pr.name}<small>{pr.hint}</small></button>
              ))}
            </div>
          </div>
          <div className="labbox" style={{ marginTop: 14 }}>
            <h4>Мутация параметрлері</h4>
            <label className="fl">Кодтаушы тізбек (5′→3′)
              <input type="text" value={seq} onChange={(e) => { setSeq(e.target.value); setActivePreset(null); }} />
            </label>
            <div className="row">
              <select value={type} onChange={(e) => setType(e.target.value as 'sub' | 'ins' | 'del')}>
                <option value="sub">Субституция</option><option value="ins">Инсерция</option><option value="del">Делеция</option>
              </select>
              <label style={{ fontSize: 13 }}>Орны <input type="number" min={1} max={d.length} value={pos} onChange={(e) => setPos(+e.target.value)} /></label>
              {type === 'sub' && <select value={base} onChange={(e) => setBase(e.target.value)}>{['A', 'C', 'G', 'T'].map((x) => <option key={x}>{x}</option>)}</select>}
              {type === 'ins' && <input type="text" style={{ width: 130 }} placeholder="CAGCAG…" value={base} onChange={(e) => setBase(e.target.value)} />}
              {type === 'del' && <label style={{ fontSize: 13 }}>Ұзындығы <input type="number" min={1} max={12} value={delLen} onChange={(e) => setBase(e.target.value)} /></label>}
            </div>
            <div className={`verdict ${vc}`}>{kind}{subClass ? ` · ${subClass}` : ''}</div>
            <p className="mono" style={{ margin: '6px 0' }}>ДНҚ:&nbsp; {hl.ref}<br />мут.: {hl.mut}</p>
            <p className="mono" style={{ margin: '6px 0' }}>мРНҚ: {rna(d)}</p>
            <p style={{ fontSize: 13, color: 'var(--mut)', margin: '10px 0 2px' }}>Бастапқы ақуыз ({o.p.length} а.қ.):</p><Chips a={o.p} />
            <p style={{ fontSize: 13, color: 'var(--mut)', margin: '6px 0 2px' }}>Мутантты ақуыз ({t.p.length} а.қ.):</p><Chips a={t.p} ref_={o.p} />
            <p className="note">Модель: мРНҚ-ға транскрипцияланған кодтаушы тізбек, бірінші ATG-дан оқылады; сплайсинг пен регуляция ескерілмейді. Пресеттер — оқу мақсатындағы қысқартылған тізбектер; олар клиникалық вариантты түсіндіреді, толық референстік ген тізбегі деп қабылданбауы керек.</p>
          </div>
        </div>
        <div className="labcol">
          <div className="lab3d">
            <span className="corner">3D · мутация орны</span>
            <Canvas camera={{ position: [2, 3, 11], fov: 45 }} dpr={[1, 2]}>
              <color attach="background" args={['#101014']} />
              <ambientLight intensity={0.7} /><directionalLight position={[5, 6, 5]} intensity={1.3} />
              <DnaMutScene type={type} pos={hp} len={hlen} tick={0} sequence={d} mutated={m} />
            </Canvas>
          </div>
          <div className="labbox" style={{ marginTop: 14 }}>
            <h4>Түс коды</h4>
            <Row a={['A — жасыл', 'T — қызыл', 'G — сары', 'C — көк']} />
            <Row a={['қызыл жарқыл — мутация', 'сақина — делеция белгісі', 'күлгін/бірюза — қаңқа']} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Chrom() {
  const [op, setOp] = useState<string>(CHROM_OPS[0]);
  const a = ['A','B','C','D','E','F'];
  const b = ['M','N','O','P','Q','R'];
  const rows: Record<string, {titleA:string; a:string[]; titleB:string; b:string[]; note:string}> = {
    'Қалыпты': { titleA:'Хромосома 1 · бастапқы', a, titleB:'Хромосома 2 · бастапқы', b,
      note:'Екі бастапқы хромосома салыстырылады. Әріптер тек оқытуға арналған шартты сегменттер; олар нақты гендерді немесе цитобэнд координаталарын білдірмейді.' },
    'Делеция': { titleA:'Бастапқы', a, titleB:'Делециядан кейін', b:['A','B','D','E','F'],
      note:'Делецияда хромосоманың бір бөлігі жоғалады. Нақты әсер жоғалған аймақтың ұзындығына, гендерге және дозалық сезімталдыққа тәуелді.' },
    'Дупликация': { titleA:'Бастапқы', a, titleB:'Дупликациядан кейін', b:['A','B','C','C′','D','E','F'],
      note:'Дупликация сегменттің қосымша көшірмесін қосады. Схемада сегменттер шартты; нақты көшірме саны мен көлемі әртүрлі болады.' },
    'Инверсия': { titleA:'Бастапқы', a, titleB:'Инверсиядан кейін', b:['A','B','E′','D′','C′','F'],
      note:'Инверсия сегменттің бағытын өзгертіп, хромосоманың екі нүктесінде үзіліс пен қайта жалғануды қамтиды. Перицентрлік және парацентрлік түрлері болады.' },
    'Транслокация (өзара)': { titleA:'Туынды хромосома 1', a:['A','B','C','P','Q','R'], titleB:'Туынды хромосома 2', b:['M','N','O','D','E','F'],
      note:'Өзара транслокацияда гомологты емес екі хромосома бөліктерімен алмасуы мүмкін. Бұл — тек механиканы түсіндіретін үлгі; нақты клиникалық транслокацияның гендік шекараларын көрсетпейді.' },
    'Робертсондық транслокация': { titleA:'Акроцентрлік хромосомалардың ұзын иықтары', a:['13q','14q','●','біріккен ұзын иықтар'], titleB:'Қысқа иықтар', b:['13p','14p','жиі жоғалуы мүмкін'],
      note:'Робертсондық транслокация адамдағы акроцентрлік хромосомалардың (13, 14, 15, 21, 22) центромера маңында ұзын иықтарының қосылуынан пайда болады. Көрсетілгені — жалпы механизм, нақты кариотип емес.' },
    'Сақиналы хромосома': { titleA:'Бастапқы хромосома', a, titleB:'Сақиналы туынды', b:['ұштық делеция','ұштардың жалғануы','сақина'],
      note:'Сақиналы хромосома көбіне екі ұш аймағының жоғалуы мен қалған ұштардың жалғануы арқылы түзіледі. Механизм мен тұрақтылық хромосомаға байланысты.' },
  };
  const current = rows[op] ?? rows['Қалыпты'];
  return (
    <div className="lab">
      <h3>Хромосомалық мутациялар · құрылымдық қайта құрылулар</h3>
      <p className="sub">3D көрінісінде тұтас, дөңгелектелген хроматидалар көрсетіледі. Түсті сегменттер — механизмді түсіндіретін шартты блоктар, геном картасы емес.</p>
      <div className="opbtns">{CHROM_OPS.map((k) => <button key={k} className={op === k ? 'on' : ''} onClick={() => setOp(k)}>{k}</button>)}</div>
      <div className="labgrid">
        <div className="labcol">
          <div className="labbox">
            <h4>Құрылымның сызбасы</h4>
            <p style={{ fontSize: 13, color: 'var(--mut)', margin: '4px 0 2px' }}>{current.titleA}:</p><Row a={current.a} />
            <p style={{ fontSize: 13, color: 'var(--mut)', margin: '4px 0 2px' }}>{current.titleB}:</p><Row a={current.b} />
            <p className="note">{current.note}</p>
            <p className="note">Ғылыми шектеу: модель нақты цитобэндтердің өлшемдерін, ДНҚ-ның bp координаталарын немесе хромосоманың нақты пациенттік геномын көрсетпейді. Координатамен сәйкес талдау үшін белгілі бір референстік геном және валидтелген breakpoint деректері қажет.</p>
          </div>
        </div>
        <div className="labcol">
          <div className="lab3d">
            <span className="corner">3D · хроматидалар және туынды хромосома</span>
            <Canvas camera={{ position: [0, 1, 9], fov: 45 }} dpr={[1, 2]}>
              <color attach="background" args={['#101014']} />
              <ambientLight intensity={0.8} /><directionalLight position={[5, 6, 5]} intensity={1.2} />
              <ChromMutScene op={op} tick={0} />
            </Canvas>
          </div>
        </div>
      </div>
    </div>
  );
}

const TRIPLO: Record<string, number> = Object.fromEntries([...Array.from({ length: 22 }, (_, i) => [`${i + 1}`, 3]), ['X', 2], ['Y', 1]]);
const GENOME_OPTS: { k: string; counts: Record<string, number>; total: number; note: string }[] = [
  { k: 'Қалыпты 46,XY', counts: {}, total: 46, note: '22 аутосома жұбы + жыныс хромосомалары.' },
  { k: 'Трисомия 21 (Даун)', counts: { '21': 3 }, total: 47, note: '21-хромосома 3 дана — G тобы. Ең жиі кездесетін аутосомалық трисомия.' },
  { k: 'Трисомия 18 (Эдвардс)', counts: { '18': 3 }, total: 47, note: '18-хромосома 3 дана — E тобы.' },
  { k: 'Трисомия 13 (Патау)', counts: { '13': 3 }, total: 47, note: '13-хромосома 3 дана — D тобы.' },
  { k: 'Тернер (45,X)', counts: { X: 1, Y: 0 }, total: 45, note: 'Жалғыз X — моносомия. Жыныс хромосомаларының тірі моносомиясы.' },
  { k: 'Клайнфельтер (47,XXY)', counts: { X: 2 }, total: 47, note: 'Еркекте қосымша X-хромосома.' },
  { k: 'Триплоидия (69,XXY)', counts: TRIPLO, total: 69, note: 'Барлық хромосома 3 данадан. Адамда әдетте өмірге жарамсыз; өсімдіктерде полиплоидия жиі (бидай 6n).' },
];
function Genome() {
  const [i, setI] = useState(0);
  const opt = GENOME_OPTS[i];
  return (
    <div className="lab">
      <h3>Геномдық мутациялар — толық кариотип симуляциясы</h3>
      <p className="sub">Синдромді таңдаңыз: толық 3D-кариотипте артық/жетіспейтін хромосома қызылмен белгіленеді (A–G топтары; ұзындықтары Мб бойынша жуық, жолақтар схемалық).</p>
      <div className="opbtns">{GENOME_OPTS.map((o, j) => <button key={o.k} className={i === j ? 'on' : ''} onClick={() => setI(j)}>{o.k}</button>)}</div>
      <div className="labgrid">
        <div className="labcol">
          <div className="labbox">
            <h4>Қорытынды</h4>
            <div className="count-big">{opt.total}</div>
            <div className="count-cap">хромосома · {opt.k}</div>
            <p style={{ fontSize: 14 }}>{opt.note}</p>
            <p className="note">Анеуплоидия — жеке хромосомалар саны өзгереді (мейоздағы нон-дизъюнкция салдары); полиплоидия — бүкіл жиынтықтың еселенуі. Карточканы басып, кариотипті айналдырып қараңыз.</p>
          </div>
        </div>
        <div className="labcol">
          <div className="lab3d" style={{ height: 520 }}>
            <span className="corner">3D · кариотип ({opt.k})</span>
            <Canvas camera={{ position: [0, 2, 18], fov: 45 }} dpr={[1, 2]}>
              <color attach="background" args={['#101014']} />
              <ambientLight intensity={0.85} /><directionalLight position={[5, 6, 5]} intensity={1.1} />
              <KaryotypeScene counts={opt.counts} />
            </Canvas>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mito() {
  const [v, setV] = useState(40);
  return (
    <div className="lab">
      <h3>Митохондриялық мутация — гетероплазмия симуляциясы</h3>
      <p className="sub">Бір жасушада жүздеген мтДНҚ көшірмесі бар; мутантты үлес шектен асқанда ғана белгілер пайда болады.</p>
      <div className="labgrid">
        <div className="labcol">
          <div className="labbox">
            <h4>Параметр</h4>
            <label className="fl">Мутантты мтДНҚ үлесі
              <div className="tl-row"><input type="range" min={0} max={100} value={v} onChange={(e) => setV(+e.target.value)} /><span className="tl-val">{v}%</span></div>
            </label>
            <div className={`verdict ${v < 30 ? 'ok' : v < 70 ? 'warn' : 'bad'}`}>
              {v < 30 ? 'Төмен гетероплазмия — белгілер әдетте жоқ' : v < 70 ? 'Орташа деңгей — ұлпаға байланысты белгілер мүмкін' : 'Жоғары гетероплазмия — ауыр белгілер ықтимал (LHON/MELAS/MERRF)'}
            </div>
            <div className="chips">{Array.from({ length: 100 }, (_, k) => <span key={k} className={'chip dot' + (k < v ? ' bad' : '')} />)}</div>
            <p className="note">Тұқым қуалауы ана желісі арқылы (Мендель емес): жұмыртқада митохондрия көп, аталық мтДНҚ әдетте жойылады. Схема, нақты клиникалық сан емес.</p>
          </div>
        </div>
        <div className="labcol">
          <div className="lab3d">
            <span className="corner">3D · митохондрия ішіндегі мтДНҚ</span>
            <Canvas camera={{ position: [2, 2, 8], fov: 45 }} dpr={[1, 2]}>
              <color attach="background" args={['#101014']} />
              <ambientLight intensity={0.8} /><directionalLight position={[5, 6, 5]} intensity={1.2} />
              <MitoHetScene v={v} tick={0} />
            </Canvas>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MutationLab({ kind }: { kind: Id }) {
  return (
    <div className="labwrap">
      {kind === 'chrom_mut' ? <Chrom /> : kind === 'genome_mut' ? <Genome /> : kind === 'mito_mut' ? <Mito /> : kind === 'gene_mut' ? <Gene /> : (
        <div className="lab">
          <h3>Мутациялар зертханасы</h3>
          <p className="sub">Сол жақтағы тізімнен мутация түрін таңдаңыз: {['gene_mut', 'chrom_mut', 'genome_mut', 'mito_mut'].map((k) => NODES[k].kk).join(' · ')}.</p>
        </div>
      )}
    </div>
  );
}
