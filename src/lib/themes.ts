import type { ThemeId } from '@/types'

export interface ThemeMeta {
  id: ThemeId
  name: string
  blurb: string
  music: string
  colorScheme: 'light' | 'dark'
  metaColor: string
  swatch: [string, string, string]
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'paper',
    name: 'Paper & Ink',
    blurb: 'Classic cream ruled paper',
    music: 'Rain on Paper',
    colorScheme: 'light',
    metaColor: '#fbfaf4',
    swatch: ['#fbfaf4', '#23325e', '#ffe45c'],
  },
  {
    id: 'forest',
    name: 'Forest Notes',
    blurb: 'Sage paper, pine ink',
    music: 'Forest Birdsong',
    colorScheme: 'light',
    metaColor: '#f3f7ee',
    swatch: ['#f3f7ee', '#22392c', '#d9e8a8'],
  },
  {
    id: 'honey',
    name: 'Honey & Bee',
    blurb: 'Warm honey paper, amber ink',
    music: 'Meadow & Bees',
    colorScheme: 'light',
    metaColor: '#fdf6e2',
    swatch: ['#fdf6e2', '#4a3312', '#ffd45e'],
  },
  {
    id: 'lavender',
    name: 'Lavender Press',
    blurb: 'Soft lilac paper, plum ink',
    music: 'Breeze & Chimes',
    colorScheme: 'light',
    metaColor: '#faf6ff',
    swatch: ['#faf6ff', '#352a5c', '#e3ccff'],
  },
  {
    id: 'ocean',
    name: 'Ocean Notes',
    blurb: 'Cool mist paper, deep tide ink',
    music: 'Ocean Waves',
    colorScheme: 'light',
    metaColor: '#f1f8fa',
    swatch: ['#f1f8fa', '#17394a', '#a9e8e0'],
  },
  {
    id: 'midnight',
    name: 'Midnight Ink',
    blurb: 'Chalk on a blackboard',
    music: 'Night Crickets',
    colorScheme: 'dark',
    metaColor: '#111726',
    swatch: ['#1b2233', '#ece5d3', '#b8324f'],
  },
]

export const DEFAULT_THEME: ThemeId = 'paper'

export function themeMeta(id: ThemeId): ThemeMeta {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0]
}

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value)
}
