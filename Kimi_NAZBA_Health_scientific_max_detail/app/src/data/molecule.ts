// Нуклеотид монофосфаттарының шартты 3D-моделі (ауыр атомдар, сутек көрсетілмеген).
// Азотты негіз жазық; қант сақинасы сәл бүктелген, фосфаттың оттектері кеңістікте таралған.
// Координаталар қолмен жасалған оқу геометриясы, атомдық құрылымдар базасынан алынбаған.
export type Atom = [id: string, group: 'base' | 'sugar' | 'phosphate', x: number, y: number, z?: number];
type Bond = [string, string];
const b = (id: string, x: number, y: number): Atom => [id, 'base', x, y, 0];
const PUR: Atom[] = [b('N1', 0, 1), b('C2', 0.866, 0.5), b('N3', 0.866, -0.5), b('C4', 0, -1), b('C5', -0.866, -0.5),
  b('C6', -0.866, 0.5), b('N7', -1.609, -1.169), b('C8', -1.203, -2.083), b('N9', -0.208, -1.978)];
const PUR_B: Bond[] = [['N1', 'C2'], ['C2', 'N3'], ['N3', 'C4'], ['C4', 'C5'], ['C5', 'C6'], ['C6', 'N1'], ['C5', 'N7'], ['N7', 'C8'], ['C8', 'N9'], ['N9', 'C4'], ['N9', "C1'"]];
const PYR: Atom[] = [b('N1', -0.208, -1.978), b('C2', -0.382, -1), b('N3', -1.322, -0.651), b('C4', -2.088, -1.294), b('C5', -1.914, -2.279), b('C6', -0.974, -2.621)];
const PYR_B: Bond[] = [['N1', 'C2'], ['C2', 'N3'], ['N3', 'C4'], ['C4', 'C5'], ['C5', 'C6'], ['C6', 'N1'], ['N1', "C1'"]];
const SUG: Atom[] = [["C1'", 'sugar', 0.732, -2.32, 0.08], ["O4'", 'sugar', 1.562, -1.761, 0.34], ["C4'", 'sugar', 2.35, -2.376, 0.48], ["C3'", 'sugar', 2.008, -3.317, 0.12],
  ["C2'", 'sugar', 1.008, -3.282, -0.2], ["O3'", 'sugar', 2.567, -4.146, 0.08], ["C5'", 'sugar', 3.311, -2.1, 0.82], ["O5'", 'phosphate', 3.811, -1.234, 1.02],
  ['P', 'phosphate', 4.677, -0.734, 1.12], ['OP1', 'phosphate', 4.177, 0.132, 1.58], ['OP2', 'phosphate', 5.543, -0.234, 0.57], ['OP3', 'phosphate', 5.177, -1.6, 0.93]];
const SUG_B: Bond[] = [["C1'", "O4'"], ["O4'", "C4'"], ["C4'", "C3'"], ["C3'", "C2'"], ["C2'", "C1'"], ["C3'", "O3'"], ["C4'", "C5'"], ["C5'", "O5'"], ["O5'", 'P'], ['P', 'OP1'], ['P', 'OP2'], ['P', 'OP3']];
const O2: Atom = b('O2', 0.384, -0.357), O4: Atom = b('O4', -3.028, -0.952);
const EXTRA: Record<string, [Atom[], Bond[]]> = {
  adenine: [[b('N6', -1.732, 1)], [['C6', 'N6']]],
  guanine: [[b('O6', -1.732, 1), b('N2', 1.732, 1)], [['C6', 'O6'], ['C2', 'N2']]],
  cytosine: [[O2, b('N4', -3.028, -0.952)], [['C2', 'O2'], ['C4', 'N4']]],
  thymine: [[O2, O4, b('C7', -2.68, -2.922)], [['C2', 'O2'], ['C4', 'O4'], ['C5', 'C7']]],
  uracil: [[O2, O4], [['C2', 'O2'], ['C4', 'O4']]],
};
const FORM: Record<string, string> = { adenine: 'dAMP · C₁₀H₁₄N₅O₆P', guanine: 'dGMP · C₁₀H₁₄N₅O₇P', cytosine: 'dCMP · C₉H₁₄N₃O₇P', thymine: 'dTMP · C₁₀H₁₅N₂O₈P', uracil: 'UMP · C₉H₁₃N₂O₉P' };

export function buildModel(base: string) {
  const pur = base === 'adenine' || base === 'guanine', rna = base === 'uracil';
  const [ea, eb] = EXTRA[base] ?? EXTRA.adenine;
  const atoms: Atom[] = [...(pur ? PUR : PYR), ...ea, ...SUG, ...(rna ? [["O2'", 'sugar', 0.392, -4.07, 0.05] as Atom] : [])];
  const bonds: Bond[] = [...(pur ? PUR_B : PYR_B), ...eb, ...SUG_B, ...(rna ? [["C2'", "O2'"] as Bond] : [])];
  return {
    atoms, bonds, pur,
    rings: (pur ? [[0, 0, 6, Math.PI / 6], [-0.777, -1.346, 5, 0.419]] : [[-1.148, -1.636, 6, 0.698]]) as [number, number, number, number][],
    cls: pur ? 'Пурин: 2 сақина (6+5)' : 'Пиримидин: 1 сақина (6)', col: pur ? '#f59e0b' : '#14b8a6',
    dy: pur ? 1.6 : 2.2, lab: (pur ? [-0.5, 2.1] : [-1.8, 0.3]) as [number, number],
    sugar: rna ? 'Рибоза (2′-OH бар)' : 'Дезоксирибоза (2′-H)', formula: FORM[base] ?? FORM.adenine,
  };
}
