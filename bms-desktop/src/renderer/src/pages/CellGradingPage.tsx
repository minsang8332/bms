import PageHeader from '../components/layout/PageHeader'

type CellGradingPageProps = {
  title?: string
  subLabel?: string | null
}

function CellGradingPage({ title = '셀 그레이딩', subLabel }: CellGradingPageProps) {
  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        subLabel={subLabel}
        action={
          <button
            className="h-10 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
            type="button"
          >
            새 셀 추가
          </button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="glass-panel p-5">
          <div className="text-sm text-slate-600 dark:text-slate-300">전체 셀</div>
          <div className="mt-3 text-3xl font-semibold text-emerald-700 dark:text-emerald-300">
            0
          </div>
        </div>
        <div className="glass-panel p-5">
          <div className="text-sm text-slate-600 dark:text-slate-300">대기 중</div>
          <div className="mt-3 text-3xl font-semibold text-emerald-700 dark:text-emerald-300">
            0
          </div>
        </div>
        <div className="glass-panel p-5">
          <div className="text-sm text-slate-600 dark:text-slate-300">완료</div>
          <div className="mt-3 text-3xl font-semibold text-emerald-700 dark:text-emerald-300">
            0
          </div>
        </div>
      </section>

      <section className="glass-panel overflow-hidden">
        <div className="border-b border-emerald-100/80 px-5 py-4 dark:border-emerald-900/60">
          <h2 className="text-base font-semibold text-emerald-950 dark:text-emerald-100">
            등급 리스트
          </h2>
        </div>
        <div className="grid h-64 place-items-center text-sm text-slate-500 dark:text-slate-400">
          데이터가 없습니다.
        </div>
      </section>
    </div>
  )
}

export default CellGradingPage
