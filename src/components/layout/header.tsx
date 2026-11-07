import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Flame,
  LogOut,
  Music2,
  Palette,
  Settings,
  TrendingUp,
  UserRound,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { PencilDoodle } from '@/components/shared/doodles'
import { Avatar, AvatarFallback } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store/useAppStore'
import { useMusicStore } from '@/store/useMusicStore'
import { computeStreak } from '@/services/plannerService'
import { greetingKey, initials, longDate } from '@/lib/utils'
import { isThemeId, THEMES, themeMeta } from '@/lib/themes'

export function Header() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const profile = useAppStore((state) => state.profile)
  const session = useAppStore((state) => state.session)
  const slots = useAppStore((state) => state.slots)
  const logout = useAppStore((state) => state.logout)
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)
  const pushToast = useAppStore((state) => state.pushToast)
  const musicPlaying = useMusicStore((state) => state.playing)
  const musicBusy = useMusicStore((state) => state.busy)
  const musicVolume = useMusicStore((state) => state.volume)
  const toggleMusic = useMusicStore((state) => state.toggle)
  const setMusicVolume = useMusicStore((state) => state.setVolume)
  const streak = useMemo(() => computeStreak(slots), [slots])
  const currentTheme = themeMeta(theme)
  const VolumeIcon = musicVolume === 0 ? VolumeX : musicVolume < 50 ? Volume1 : Volume2
  const firstName = profile?.name?.split(' ')[0] ?? 'there'
  const language = (i18n.language as 'en' | 'hi') || 'en'

  async function handleMusic() {
    const wasPlaying = musicPlaying
    const started = await toggleMusic(theme)
    if (!wasPlaying && !started) {
      pushToast('Soundtrack unavailable', 'Your browser blocked audio. Check site sound permissions.', 'warning')
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b-2 border-foreground/80 bg-background/95 backdrop-blur-sm">
      <div className="flex h-[68px] items-center gap-2 px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg leading-tight sm:text-xl">
            {t(greetingKey())}, {firstName}{' '}
            <PencilDoodle className="inline size-4 -translate-y-0.5 text-foreground" aria-hidden />
          </p>
          <p className="mt-0.5 hidden text-sm text-muted-foreground xs:block">
            {longDate(new Date(), language)}
          </p>
        </div>

        <div
          className="flex h-9 items-center gap-1.5 rounded-[4px_11px_6px_9px] border-2 border-foreground bg-accent/60 px-2.5 text-accent-foreground shadow-[2px_2px_0_hsl(var(--foreground)/0.2)]"
          title={`${t('streak.current')}: ${streak.current} · ${t('streak.best')}: ${streak.best}`}
        >
          <Flame className="size-4" strokeWidth={2.2} />
          <span className="text-base font-bold tabular-nums">{streak.current}</span>
          <span className="hidden text-sm sm:inline">{t('streak.label')}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={`Theme: ${currentTheme.name}`}
              aria-label={`Theme: ${currentTheme.name}. Choose a notebook theme`}
              className="flex size-9 shrink-0 items-center justify-center rounded-[4px_11px_6px_9px] border-2 border-foreground bg-card text-foreground shadow-[2px_2px_0_hsl(var(--foreground)/0.2)] transition-transform hover:-translate-y-0.5"
            >
              <Palette className="size-4" strokeWidth={2.2} aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[17.5rem]">
            <DropdownMenuLabel>Notebook theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(value) => {
                if (isThemeId(value)) setTheme(value)
              }}
            >
              {THEMES.map((option) => (
                <DropdownMenuRadioItem key={option.id} value={option.id} title={option.blurb}>
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 flex-col justify-end gap-[3px] rounded-[2px_7px_3px_5px] border-2 border-foreground p-1"
                    style={{ backgroundColor: option.swatch[0] }}
                  >
                    <span
                      className="h-1 w-full rounded-full"
                      style={{ backgroundColor: option.swatch[2] }}
                    />
                    <span
                      className="h-1 w-full rounded-full opacity-70"
                      style={{ backgroundColor: option.swatch[1] }}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{option.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {option.music}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="group/music relative shrink-0">
          <button
            type="button"
            onClick={handleMusic}
            disabled={musicBusy}
            aria-pressed={musicPlaying}
            aria-label={
              musicPlaying ? `Pause study music: ${currentTheme.music}` : `Play study music: ${currentTheme.music}`
            }
            title={musicPlaying ? `Pause ${currentTheme.music}` : `Play ${currentTheme.music}`}
            className="flex size-9 shrink-0 items-center justify-center rounded-[4px_11px_6px_9px] border-2 border-foreground bg-card text-foreground shadow-[2px_2px_0_hsl(var(--foreground)/0.2)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {musicPlaying ? (
              <span aria-hidden className="music-bars">
                <span />
                <span />
                <span />
              </span>
            ) : (
              <Music2 className="size-4" strokeWidth={2.2} aria-hidden />
            )}
          </button>
          <div className="pointer-events-none absolute right-0 top-full z-50 w-48 translate-y-1 pt-2 opacity-0 transition-[opacity,transform] duration-150 group-focus-within/music:pointer-events-auto group-focus-within/music:translate-y-0 group-focus-within/music:opacity-100 group-hover/music:pointer-events-auto group-hover/music:translate-y-0 group-hover/music:opacity-100">
            <div
              role="group"
              aria-label={`Study music volume for ${currentTheme.music}`}
              className="rounded-[4px_12px_6px_10px] border-2 border-foreground bg-card p-3 text-card-foreground shadow-[3px_3px_0_hsl(var(--foreground)/0.25)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <VolumeIcon className="size-3.5" aria-hidden />
                  Volume
                </span>
                <span className="text-xs font-bold tabular-nums">{musicVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={musicVolume}
                onChange={(event) => setMusicVolume(Number(event.target.value))}
                aria-label="Study music volume"
                aria-valuetext={`${musicVolume}%`}
                className="mt-2 h-1.5 w-full cursor-pointer accent-[hsl(var(--foreground))]"
              />
              <p className="mt-1.5 truncate text-[11px] font-medium text-muted-foreground">
                {currentTheme.music}
              </p>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Open account menu"
            >
              <Avatar className="size-9 border-2 border-foreground">
                <AvatarFallback>{initials(profile?.name ?? 'Student')}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="normal-case tracking-normal">
              <p className="text-sm font-semibold text-foreground">{profile?.name}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{session?.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                {session?.guest ? (
                  <Badge variant="accent">{t('common.demo')}</Badge>
                ) : (
                  <Badge variant="success">{profile?.course || t('common.welcome')}</Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="size-4" />
                {t('nav.settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/progress">
                <TrendingUp className="size-4" />
                {t('nav.progress')}
              </Link>
            </DropdownMenuItem>
            {session?.guest && (
              <DropdownMenuItem asChild>
                <Link to="/auth?mode=signup">
                  <UserRound className="size-4" />
                  {t('settings.createAccount')}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async () => {
                await logout()
                navigate('/')
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              {t('common.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
