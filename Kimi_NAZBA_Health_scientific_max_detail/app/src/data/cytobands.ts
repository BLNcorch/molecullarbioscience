/**
 * Cytogenetic band names used by the interactive idiogram.
 * The detailed chromosome-3 label set follows standard human cytoband nomenclature.
 * Chromosome 3 bands have 1-based inclusive GRCh38 intervals and are mapped proportionally.
 * Other chromosome ideograms use coarse labels only and do not claim exact base-pair intervals.
 */
export type Arm = 'p' | 'q';
export interface BandFocus {
  chromosome: string;
  cytoband: string;
  arm: Arm;
  position: string;
  note: string;
  genomicCoordinates?: string;
}

export const CHR3_P_BANDS = [
  '3p26.3','3p26.2','3p26.1','3p25.3','3p25.2','3p25.1','3p24.3','3p24.2','3p24.1',
  '3p23','3p22.3','3p22.2','3p22.1','3p21.33','3p21.32','3p21.31','3p21.2','3p21.1',
  '3p14.3','3p14.2','3p14.1','3p13','3p12.3','3p12.2','3p12.1','3p11.2','3p11.1'
];
export const CHR3_Q_BANDS = [
  '3q11.1','3q11.2','3q12.1','3q12.2','3q12.3','3q13.11','3q13.12','3q13.13','3q13.2',
  '3q13.31','3q13.32','3q13.33','3q21.1','3q21.2','3q21.3','3q22.1','3q22.2',
  '3q22.3','3q23','3q24','3q25.1','3q25.2','3q25.31','3q25.32','3q25.33',
  '3q26.1','3q26.2','3q26.31','3q26.32','3q26.33','3q27.1','3q27.2','3q27.3','3q28','3q29'
];

/**
 * GRCh38 human chromosome 3 cytoband intervals, in 1-based inclusive base-pair coordinates.
 * Source: HGVS cytogenetic-band table based on the UCSC cytoBand file; accession NC_000003.12.
 * The 3D positions use these intervals proportionally. Other chromosomes below intentionally
 * use only coarse labels and must not be interpreted as exact genomic intervals.
 */
export const GRCH38_CHR3_COORDS: Record<string, { start: number; end: number }> = {
  '3p26.3': {start:1,end:2800000}, '3p26.2': {start:2800001,end:4000000}, '3p26.1': {start:4000001,end:8100000},
  '3p25.3': {start:8100001,end:11600000}, '3p25.2': {start:11600001,end:13200000}, '3p25.1': {start:13200001,end:16300000},
  '3p24.3': {start:16300001,end:23800000}, '3p24.2': {start:23800001,end:26300000}, '3p24.1': {start:26300001,end:30800000},
  '3p23': {start:30800001,end:32000000}, '3p22.3': {start:32000001,end:36400000}, '3p22.2': {start:36400001,end:39300000},
  '3p22.1': {start:39300001,end:43600000}, '3p21.33': {start:43600001,end:44100000}, '3p21.32': {start:44100001,end:44200000},
  '3p21.31': {start:44200001,end:50600000}, '3p21.2': {start:50600001,end:52300000}, '3p21.1': {start:52300001,end:54400000},
  '3p14.3': {start:54400001,end:58600000}, '3p14.2': {start:58600001,end:63800000}, '3p14.1': {start:63800001,end:69700000},
  '3p13': {start:69700001,end:74100000}, '3p12.3': {start:74100001,end:79800000}, '3p12.2': {start:79800001,end:83500000},
  '3p12.1': {start:83500001,end:87100000}, '3p11.2': {start:87100001,end:87800000}, '3p11.1': {start:87800001,end:90900000},
  '3q11.1': {start:90900001,end:94000000}, '3q11.2': {start:94000001,end:98600000}, '3q12.1': {start:98600001,end:100300000},
  '3q12.2': {start:100300001,end:101200000}, '3q12.3': {start:101200001,end:103100000}, '3q13.11': {start:103100001,end:106500000},
  '3q13.12': {start:106500001,end:108200000}, '3q13.13': {start:108200001,end:111600000}, '3q13.2': {start:111600001,end:113700000},
  '3q13.31': {start:113700001,end:117600000}, '3q13.32': {start:117600001,end:119300000}, '3q13.33': {start:119300001,end:122200000},
  '3q21.1': {start:122200001,end:124100000}, '3q21.2': {start:124100001,end:126100000}, '3q21.3': {start:126100001,end:129500000},
  '3q22.1': {start:129500001,end:134000000}, '3q22.2': {start:134000001,end:136000000}, '3q22.3': {start:136000001,end:139000000},
  '3q23': {start:139000001,end:143100000}, '3q24': {start:143100001,end:149200000}, '3q25.1': {start:149200001,end:152300000},
  '3q25.2': {start:152300001,end:155300000}, '3q25.31': {start:155300001,end:157300000}, '3q25.32': {start:157300001,end:159300000},
  '3q25.33': {start:159300001,end:161000000}, '3q26.1': {start:161000001,end:167900000}, '3q26.2': {start:167900001,end:171200000},
  '3q26.31': {start:171200001,end:176000000}, '3q26.32': {start:176000001,end:179300000}, '3q26.33': {start:179300001,end:183000000},
  '3q27.1': {start:183000001,end:184800000}, '3q27.2': {start:184800001,end:186300000}, '3q27.3': {start:186300001,end:188200000},
  '3q28': {start:188200001,end:192600000}, '3q29': {start:192600001,end:198295559}
};

// Coarse, standard cytogenetic landmarks for a readable overview of other chromosomes.
// These are labels only; the geometry is an educational ideogram and is not base-pair scaled.
const COARSE: Record<string, { p: string[]; q: string[] }> = {
  '1': {p:['1p36','1p35','1p34','1p33','1p32','1p31','1p22','1p21','1p13','1p12','1p11'],q:['1q11','1q12','1q21','1q22','1q23','1q24','1q25','1q31','1q32','1q41','1q42','1q43','1q44']},
  '2': {p:['2p25','2p24','2p23','2p22','2p21','2p16','2p15','2p14','2p13','2p12','2p11'],q:['2q11','2q12','2q13','2q14','2q21','2q22','2q23','2q24','2q31','2q32','2q33','2q34','2q35','2q36','2q37']},
  '3': {p:CHR3_P_BANDS,q:CHR3_Q_BANDS},
  '4': {p:['4p16','4p15','4p14','4p13','4p12','4p11'],q:['4q11','4q12','4q13','4q21','4q22','4q23','4q24','4q25','4q26','4q27','4q28','4q31','4q32','4q33','4q34','4q35']},
  '5': {p:['5p15','5p14','5p13','5p12','5p11'],q:['5q11','5q12','5q13','5q14','5q15','5q21','5q22','5q23','5q31','5q32','5q33','5q34','5q35']},
  '6': {p:['6p25','6p24','6p23','6p22','6p21','6p12','6p11'],q:['6q11','6q12','6q14','6q15','6q16','6q21','6q22','6q23','6q24','6q25','6q26','6q27']},
  '7': {p:['7p22','7p21','7p15','7p14','7p13','7p12','7p11'],q:['7q11','7q21','7q22','7q31','7q32','7q33','7q34','7q35','7q36']},
  '8': {p:['8p23','8p22','8p21','8p12','8p11'],q:['8q11','8q12','8q13','8q21','8q22','8q23','8q24']},
  '9': {p:['9p24','9p23','9p22','9p21','9p13','9p12','9p11'],q:['9q11','9q12','9q13','9q21','9q22','9q31','9q32','9q33','9q34']},
  '10': {p:['10p15','10p14','10p13','10p12','10p11'],q:['10q11','10q21','10q22','10q23','10q24','10q25','10q26']},
  '11': {p:['11p15','11p14','11p13','11p12','11p11'],q:['11q11','11q12','11q13','11q14','11q21','11q22','11q23','11q24','11q25']},
  '12': {p:['12p13','12p12','12p11'],q:['12q11','12q12','12q13','12q14','12q15','12q21','12q22','12q23','12q24']},
  '13': {p:['13p13','13p12','13p11'],q:['13q11','13q12','13q13','13q14','13q21','13q22','13q31','13q32','13q33','13q34']},
  '14': {p:['14p13','14p12','14p11'],q:['14q11','14q12','14q13','14q21','14q22','14q23','14q24','14q31','14q32']},
  '15': {p:['15p13','15p12','15p11'],q:['15q11','15q12','15q13','15q14','15q15','15q21','15q22','15q23','15q24','15q25','15q26']},
  '16': {p:['16p13','16p12','16p11'],q:['16q11','16q12','16q13','16q21','16q22','16q23','16q24']},
  '17': {p:['17p13','17p12','17p11'],q:['17q11','17q12','17q21','17q22','17q23','17q24','17q25']},
  '18': {p:['18p11'],q:['18q11','18q12','18q21','18q22','18q23']},
  '19': {p:['19p13','19p12','19p11'],q:['19q11','19q12','19q13']},
  '20': {p:['20p13','20p12','20p11'],q:['20q11','20q12','20q13']},
  '21': {p:['21p13','21p12','21p11'],q:['21q11','21q21','21q22']},
  '22': {p:['22p13','22p12','22p11'],q:['22q11','22q12','22q13']},
  'X': {p:['Xp22','Xp21','Xp11'],q:['Xq11','Xq12','Xq13','Xq21','Xq22','Xq23','Xq24','Xq25','Xq26','Xq27','Xq28']},
  'Y': {p:['Yp11'],q:['Yq11','Yq12']}
};

export function labelForBand(chromosome: string, arm: Arm, fraction: number): string {
  const list = (COARSE[chromosome] ?? {p:[`${chromosome}p11`],q:[`${chromosome}q11`]})[arm];
  const i = Math.max(0, Math.min(list.length - 1, Math.floor(Math.max(0, Math.min(0.999, fraction)) * list.length)));
  return list[i];
}

export function makeBandFocus(chromosome: string, cytoband: string, arm?: Arm, fraction = 0.5): BandFocus {
  const inferredArm: Arm = arm ?? (cytoband.includes('p') ? 'p' : 'q');
  const placement = inferredArm === 'p'
    ? 'қысқа иық: теломерадан центромераға қарай'
    : 'ұзын иық: центромерадан теломераға қарай';
  const exact = chromosome === '3' ? GRCH38_CHR3_COORDS[cytoband] : undefined;
  const genomicCoordinates = exact
    ? `GRCh38 / NC_000003.12: chr3:${exact.start.toLocaleString('en-US')}–${exact.end.toLocaleString('en-US')} bp (аралық шекаралары қоса есептелген)`
    : undefined;
  return {
    chromosome, cytoband, arm: inferredArm,
    position: `${placement} · иық ішіндегі шамамен ${(fraction * 100).toFixed(0)}%`,
    ...(genomicCoordinates ? { genomicCoordinates } : {}),
    note: exact
      ? 'Бұл жолақ үшін GRCh38 сілтемелік жинағындағы интервал берілген. Цитогенетикалық жолақ шекаралары микроскопиялық жолақтандыруға негізделген жуықтаулар; жеке варианттың нақты breakpoint-ы емес.'
      : 'Бұл — кариотиптік шолуға арналған ірі цитогенетикалық аймақ белгісі. Осы экрандағы басқа хромосомалар үшін нақты GRCh38 bp аралығы берілмейді.'
  };
}
