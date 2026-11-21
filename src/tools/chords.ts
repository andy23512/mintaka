// Each letter below sits on its own physical switch in CharaChorder's default
// CC1/CC2 layout (tangent-cc-lib's DEFAULT_DEVICE_LAYOUT), so every chord here
// only ever asks for one direction per finger — no letter pair shares a
// switch, which would make it an awkward diagonal (or, for opposite
// directions on the same switch, physically impossible).
export const CHORDS = [
  ['a', 'n', 's'],
  ['t', 'l', 'y'],
  ['e', 'o', 'u'],
  ['r', 'i', 'u'],
  ['g', 'r', 'u'],
  ['d', 'a', 'n'],
  ['h', 't', 's'],
]

export function pickChord(exclude?: string[]) {
  let chord = CHORDS[Math.floor(Math.random() * CHORDS.length)]
  while (exclude && chord === exclude) {
    chord = CHORDS[Math.floor(Math.random() * CHORDS.length)]
  }
  return chord
}
