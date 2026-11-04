import {
  useState,
} from 'react'

import {
  CalendarDays,
  CircleDollarSign,
} from 'lucide-react'

import DailyExpenses from './DailyExpenses'
import ExpensesSummary from './ExpensesSummary'

import './Expenses.css'

type ExpenseTab =
  | 'daily'
  | 'summary'

function Expenses() {
  const [
    activeTab,
    setActiveTab,
  ] = useState<ExpenseTab>(
    'daily'
  )

  return (
    <div
      className="expenses-page"
      dir="rtl"
    >

      <header className="expenses-header">

        <div>

          <span className="expenses-eyebrow">
            إدارة المصروفات
          </span>

          <h1>
            الخرج
          </h1>

          <p>
            تسجيل ومتابعة جميع المبالغ الخارجة
          </p>

        </div>

      </header>

      <div className="expenses-tabs">

        <button
          type="button"
          className={
            activeTab ===
            'daily'
              ? 'expenses-tab active'
              : 'expenses-tab'
          }
          onClick={() =>
            setActiveTab(
              'daily'
            )
          }
        >

          <CalendarDays
            size={18}
          />

          الخرج اليومي

        </button>

        <button
          type="button"
          className={
            activeTab ===
            'summary'
              ? 'expenses-tab active'
              : 'expenses-tab'
          }
          onClick={() =>
            setActiveTab(
              'summary'
            )
          }
        >

          <CircleDollarSign
            size={18}
          />

          ملخص الخرج

        </button>

      </div>

      <div className="expenses-content">

        {activeTab ===
          'daily' && (
          <DailyExpenses />
        )}

        {activeTab ===
          'summary' && (
          <ExpensesSummary />
        )}

      </div>

    </div>
  )
}

export default Expenses