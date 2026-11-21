export const OCEAN_WORDS: string[] = [
  'tide',
  'current',
  'coral',
  'abyss',
  'horizon',
  'lagoon',
  'drift',
  'serene',
  'azure',
  'whisper',
  'stillness',
  'breathe',
  'float',
  'glow',
  'depth',
  'wave',
  'calm',
  'shimmer',
  'dawn',
  'starseed',
  'crystal',
  'harbor',
  'kelp',
  'foam',
  'driftwood',
  'tranquil',
  'ripple',
  'moonlight',
  'resonance',
  'harmony',
  'gentle',
  'ebb',
  'swell',
  'saltwater',
  'reef',
  'plankton',
  'undertow',
  'pearl',
  'anchor',
  'sanctuary',
  'refuge',
  'weightless',
  'buoyant',
  'translucent',
  'luminous',
  'cove',
]

export function pickWord(exclude?: string): string {
  let word = OCEAN_WORDS[Math.floor(Math.random() * OCEAN_WORDS.length)]
  if (exclude && OCEAN_WORDS.length > 1) {
    while (word === exclude) {
      word = OCEAN_WORDS[Math.floor(Math.random() * OCEAN_WORDS.length)]
    }
  }
  return word
}
