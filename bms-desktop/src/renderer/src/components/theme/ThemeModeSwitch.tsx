import { Moon, Monitor, Sun } from 'lucide-react'
import { useThemeStore, type ThemeMode } from '../../stores/useThemeStore'

const modes: Array<{
  label: string
  value: ThemeMode
  Icon: typeof Monitor
}> = [
  { label: 'System', value: 'system', Icon: Monitor },
  { label: 'Light', value: 'light', Icon: Sun },
  { label: 'Dark', value: 'dark', Icon: Moon }
]

function ThemeModeSwitch() {
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)

  return (
    <div className="flex rounded-md border border-emerald-100/80 bg-white/50 p-1 shadow-sm backdrop-blur-xl dark:border-emerald-900/60 dark:bg-white/10">
      {modes.map(({ label, value, Icon }) => (
        <button
          key={value}
          aria-label={label}
          title={label}
          className={[
            'grid h-8 w-8 place-items-center rounded text-xs font-medium transition',
            mode === value
              ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950'
              : 'text-slate-600 hover:text-emerald-800 dark:text-slate-300 dark:hover:text-emerald-200'
          ].join(' ')}
          type="button"
          onClick={() => setMode(value)}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  )
}

export default ThemeModeSwitch
