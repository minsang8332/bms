import React from 'react'

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-1 px-5 py-4 border-t border-emerald-100/80 dark:border-emerald-900/60 bg-white/30 dark:bg-slate-950/20">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-100/80 bg-white/70 text-slate-700 transition hover:bg-emerald-50 disabled:opacity-40 disabled:hover:bg-white/70 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-300 dark:hover:bg-emerald-400/10"
      >
        &lt;
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition ${
            currentPage === page
              ? 'bg-emerald-600 text-white shadow-md dark:bg-emerald-500'
              : 'border border-emerald-100/80 bg-white/70 text-slate-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-300 dark:hover:bg-emerald-400/10'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-100/80 bg-white/70 text-slate-700 transition hover:bg-emerald-50 disabled:opacity-40 disabled:hover:bg-white/70 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-300 dark:hover:bg-emerald-400/10"
      >
        &gt;
      </button>
    </div>
  )
}
