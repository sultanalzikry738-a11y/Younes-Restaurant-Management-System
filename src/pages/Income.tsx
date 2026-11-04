import {
  useState,
} from 'react'

import {
  Banknote,
  BarChart3,
} from 'lucide-react'

import DailyIncome from './DailyIncome'
import IncomeSummary from './IncomeSummary'

type IncomeTab =
  | 'daily'
  | 'summary'

function Income() {
  const [
    activeTab,
    setActiveTab,
  ] = useState<IncomeTab>(
    'daily'
  )

  return (
    <div
      className="income-page"
      dir="rtl"
    >

      <style>{`

        .income-page {
          width: 100%;
        }

        /* =========================================
           عنوان صفحة الدخل
        ========================================= */

        .income-header {
          display: flex;

          align-items:
            flex-end;

          justify-content:
            space-between;

          gap: 20px;

          margin-bottom: 18px;
        }

        .income-eyebrow {
          display: block;

          margin-bottom: 5px;

          color:
            var(--theme-main);

          font-size: 10px;

          font-weight: 900;
        }

        .income-header h1 {
          margin: 0;

          color:
            var(--theme-dark);

          font-size: 31px;

          font-weight: 900;
        }

        .income-header p {
          margin:
            5px 0 0;

          color:
            #8a7a72;

          font-size: 10px;
        }

        /* =========================================
           تبويبات الدخل
        ========================================= */

        .income-tabs {
          display: flex;

          align-items: center;

          gap: 8px;

          width: fit-content;

          margin-bottom: 20px;

          padding: 7px;

          border:
            1px solid
            #e2d5c8;

          border-radius: 15px;

          background:
            #f8f1e8;
        }

        .income-tab {
          min-width: 150px;

          min-height: 46px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 8px;

          padding:
            0 18px;

          border:
            1px solid
            transparent;

          border-radius: 11px;

          background:
            transparent;

          color:
            #6f615b;

          font-family:
            inherit;

          font-size: 11px;

          font-weight: 900;

          cursor: pointer;

          transition:
            background .18s ease,
            color .18s ease,
            border-color .18s ease,
            box-shadow .18s ease;
        }

        .income-tab:hover {
          color:
            var(--theme-main);

          background:
            var(--theme-soft);
        }

        .income-tab.active {
          background:
            var(--theme-main);

          border-color:
            var(--theme-main);

          color:
            #ffffff;

          box-shadow:
            0 8px 20px
            var(--theme-shadow);
        }

        .income-content {
          width: 100%;
        }

        @media (
          max-width: 700px
        ) {

          .income-header {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .income-tabs {
            width: 100%;
          }

          .income-tab {
            flex: 1;

            min-width: 0;
          }

        }

      `}</style>

      <header
        className="income-header"
      >

        <div>

          <span
            className="income-eyebrow"
          >
            إدارة الدخل
          </span>

          <h1>
            الدخل
          </h1>

          <p>
            تسجيل ومتابعة جميع
            المبالغ الداخلة
          </p>

        </div>

      </header>

      <div
        className="income-tabs"
      >

        <button
          type="button"
          className={
            activeTab ===
            'daily'
              ? 'income-tab active'
              : 'income-tab'
          }
          onClick={() =>
            setActiveTab(
              'daily'
            )
          }
        >

          <Banknote
            size={18}
          />

          الدخل اليومي

        </button>

        <button
          type="button"
          className={
            activeTab ===
            'summary'
              ? 'income-tab active'
              : 'income-tab'
          }
          onClick={() =>
            setActiveTab(
              'summary'
            )
          }
        >

          <BarChart3
            size={18}
          />

          ملخص الدخل

        </button>

      </div>

      <div
        className="income-content"
      >

        {activeTab ===
          'daily' && (
          <DailyIncome />
        )}

        {activeTab ===
          'summary' && (
          <IncomeSummary />
        )}

      </div>

    </div>
  )
}

export default Income