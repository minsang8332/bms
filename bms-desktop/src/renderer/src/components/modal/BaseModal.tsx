import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type BaseModalProps = {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  sidebar?: ReactNode
  widthClassName?: string
  heightClassName?: string
  onClose: () => void
}

function BaseModal({
  open,
  title,
  description,
  children,
  sidebar,
  widthClassName = 'max-w-4xl',
  heightClassName = 'h-[560px]',
  onClose
}: BaseModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-6 backdrop-blur-[10px] dark:bg-slate-950/45">
      <div
        className={[
          'glass-panel flex w-full overflow-hidden',
          heightClassName,
          widthClassName
        ].join(' ')}
      >
        {sidebar ? (
          <aside className="w-56 shrink-0 border-r border-emerald-100/70 bg-white/20 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/10">
            {sidebar}
          </aside>
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-emerald-100/70 bg-emerald-100/40 px-5 backdrop-blur-[12px] dark:border-emerald-900/60 dark:bg-emerald-900/35">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                {title}
              </h2>
              {description ? (
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              aria-label="Close modal"
              className="grid h-9 w-9 place-items-center rounded-md text-slate-700 transition hover:bg-slate-200/50 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800/50 dark:hover:text-white"
              type="button"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-auto p-5">{children}</div>
        </section>
      </div>
    </div>
  )
}

export default BaseModal
