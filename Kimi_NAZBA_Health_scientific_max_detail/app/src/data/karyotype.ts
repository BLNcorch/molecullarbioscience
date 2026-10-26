// Адам хромосомаларының деректері (GRCh38 ұзындықтары, Мн.ж.; центромера орны — p иығының үлесі)
export interface ChrInfo { n: string; mb: number; cen: number; group: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'; sat?: boolean; type: string }
export const CHROMS: ChrInfo[] = [
  { n: '1', mb: 249, cen: 0.49, group: 'A', type: 'метацентриктік' },
  { n: '2', mb: 242, cen: 0.39, group: 'A', type: 'субметацентриктік' },
  { n: '3', mb: 198, cen: 0.46, group: 'A', type: 'метацентриктік' },
  { n: '4', mb: 190, cen: 0.30, group: 'B', type: 'субметацентриктік' },
  { n: '5', mb: 181, cen: 0.28, group: 'B', type: 'субметацентриктік' },
  { n: '6', mb: 171, cen: 0.37, group: 'C', type: 'субметацентриктік' },
  { n: '7', mb: 159, cen: 0.39, group: 'C', type: 'субметацентриктік' },
  { n: '8', mb: 146, cen: 0.35, group: 'C', type: 'субметацентриктік' },
  { n: '9', mb: 141, cen: 0.36, group: 'C', type: 'субметацентриктік' },
  { n: '10', mb: 135, cen: 0.34, group: 'C', type: 'субметацентриктік' },
  { n: '11', mb: 135, cen: 0.39, group: 'C', type: 'субметацентриктік' },
  { n: '12', mb: 134, cen: 0.34, group: 'C', type: 'субметацентриктік' },
  { n: '13', mb: 115, cen: 0.16, group: 'D', sat: true, type: 'акроцентриктік' },
  { n: '14', mb: 107, cen: 0.15, group: 'D', sat: true, type: 'акроцентриктік' },
  { n: '15', mb: 102, cen: 0.17, group: 'D', sat: true, type: 'акроцентриктік' },
  { n: '16', mb: 90, cen: 0.45, group: 'E', type: 'метацентриктік' },
  { n: '17', mb: 83, cen: 0.29, group: 'E', type: 'субметацентриктік' },
  { n: '18', mb: 80, cen: 0.24, group: 'E', type: 'субметацентриктік' },
  { n: '19', mb: 59, cen: 0.46, group: 'F', type: 'метацентриктік' },
  { n: '20', mb: 63, cen: 0.42, group: 'F', type: 'метацентриктік' },
  { n: '21', mb: 48, cen: 0.22, group: 'G', sat: true, type: 'акроцентриктік' },
  { n: '22', mb: 51, cen: 0.20, group: 'G', sat: true, type: 'акроцентриктік' },
  { n: 'X', mb: 156, cen: 0.39, group: 'C', type: 'субметацентриктік' },
  { n: 'Y', mb: 57, cen: 0.28, group: 'G', type: 'акроцентриктік' },
];
export const GROUP_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
export const G_BAND_LIGHT = '#aec3de';
export const G_BAND_DARK = '#2c4a75';
// G-бояу жолақтары: детерминирленген оқу үлгісі. Бұл үлгі жекелеген хромосомалардың
// тек жалпы пішінін көрсетуге арналған, ол дерекқордағы нақты cytoband референсі емес.
export function bands(n: string, mb: number): { f: number; dark: boolean }[] {
  const count = Math.max(4, Math.round(mb / 9.5));
  const seed = n.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  // Band width varies smoothly, with runs of dark/light bands instead of a random-looking alternation.
  const motif = [0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0];
  const weights = Array.from({ length: count }, (_, i) => {
    const phase = (i + seed) % motif.length;
    return 0.72 + motif[phase] * 0.45 + (Math.sin((i + seed) * 1.13) + 1) * 0.11;
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w, i) => ({
    f: w / sum,
    dark: Boolean(motif[(i + seed) % motif.length])
  }));
}
