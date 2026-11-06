import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'

function effectiveDark(theme: 'light' | 'dark' | 'system') {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useThemeSync() {
  const theme = useAppStore((state) => state.settings.theme)
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    }
    apply()
    if (theme === 'system') {
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
    return undefined
  }, [theme])
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useAppStore((state) => state.settings.theme)
  const setTheme = useAppStore((state) => state.setTheme)
  const [dark, setDark] = useState(() => effectiveDark(theme))

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [theme])

  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      onClick={() => {
        const next = dark ? 'light' : 'dark'
        setTheme(next)
        setDark(!dark)
      }}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </Button>
  )
}
