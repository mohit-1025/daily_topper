import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  key: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { to: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { to: '/subjects', key: 'subjects', icon: GraduationCap },
  { to: '/tasks', key: 'tasks', icon: ListChecks },
  { to: '/plan', key: 'plan', icon: CalendarDays },
  { to: '/progress', key: 'progress', icon: TrendingUp },
  { to: '/quizzes', key: 'quizzes', icon: ClipboardList },
  { to: '/exam', key: 'exam', icon: Sparkles },
  { to: '/settings', key: 'settings', icon: Settings },
]

export const mobileNavItems: NavItem[] = [
  navItems[0],
  navItems[1],
  navItems[2],
  navItems[3],
]
