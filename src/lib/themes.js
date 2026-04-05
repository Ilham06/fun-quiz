const THEMES = {
  default: {
    bg: 'from-[#1a1308] via-[#1f1a0a] to-[#141005]',
    accent: 'from-amber-500 to-yellow-500',
    accentColor: '#f59e0b',
    highlight: 'amber',
  },
  ocean: {
    bg: 'from-[#0c1929] via-[#0e2a4a] to-[#071320]',
    accent: 'from-cyan-500 to-blue-600',
    accentColor: '#06b6d4',
    highlight: 'cyan',
  },
  sunset: {
    bg: 'from-[#2a1015] via-[#3a1520] to-[#1a0a0e]',
    accent: 'from-orange-500 to-rose-600',
    accentColor: '#f97316',
    highlight: 'orange',
  },
  forest: {
    bg: 'from-[#0a1f15] via-[#0e2a1e] to-[#06140d]',
    accent: 'from-emerald-500 to-teal-600',
    accentColor: '#10b981',
    highlight: 'emerald',
  },
  midnight: {
    bg: 'from-[#18181b] via-[#1f1f23] to-[#09090b]',
    accent: 'from-slate-500 to-zinc-600',
    accentColor: '#64748b',
    highlight: 'slate',
  },
  candy: {
    bg: 'from-[#2a1030] via-[#351540] to-[#1a0a20]',
    accent: 'from-pink-500 to-violet-600',
    accentColor: '#ec4899',
    highlight: 'pink',
  },
}

export function getThemeConfig(name) {
  return THEMES[name] || THEMES.default
}
