import {
  useMemo,
  useState,
} from 'react'

import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ListChecks,
} from 'lucide-react'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type IncomeRecord = {
  id: number
  date: string
  typeName: string
  amount: string
  note: string
}

type SummaryMode =
  | 'daily'
  | 'monthly'
  | 'yearly'

const RECORDS_STORAGE_KEY =
  'younes_income_records'

const TYPES_STORAGE_KEY =
  'younes_income_types'

const arabicMonths = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

function getTodayDate() {
  const now =
    new Date()

  const year =
    now.getFullYear()

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      '0'
    )

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      '0'
    )

  return `${year}-${month}-${day}`
}

function getCurrentMonth() {
  return getTodayDate().slice(
    0,
    7
  )
}

function getCurrentYear() {
  return getTodayDate().slice(
    0,
    4
  )
}

function getDaysInMonth(
  monthValue: string
) {
  const [
    year,
    month,
  ] =
    monthValue
      .split('-')
      .map(Number)

  if (
    !year ||
    !month
  ) {
    return 31
  }

  return new Date(
    year,
    month,
    0
  ).getDate()
}

function loadRecords():
  IncomeRecord[] {
  try {
    const saved =
      localStorage.getItem(
        RECORDS_STORAGE_KEY
      )

    if (!saved) {
      return []
    }

    const parsed =
      JSON.parse(
        saved
      )

    return Array.isArray(
      parsed
    )
      ? parsed
      : []
  } catch {
    return []
  }
}

function loadTypes():
  string[] {
  try {
    const saved =
      localStorage.getItem(
        TYPES_STORAGE_KEY
      )

    if (!saved) {
      return []
    }

    const parsed =
      JSON.parse(
        saved
      )

    return Array.isArray(
      parsed
    )
      ? parsed.filter(
          (item) =>
            typeof item ===
            'string'
        )
      : []
  } catch {
    return []
  }
}

function formatMoney(
  value: number
) {
  return value.toLocaleString(
    'en-US'
  )
}

function formatDate(
  date: string
) {
  const [
    year,
    month,
    day,
  ] =
    date.split('-')

  return `${Number(day)} ${
    arabicMonths[
      Number(month) - 1
    ] || ''
  } ${year}`
}

function IncomeSummary() {
  const [
    mode,
    setMode,
  ] = useState<
    SummaryMode
  >('monthly')

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getTodayDate()
  )

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    getCurrentMonth()
  )

  const [
    selectedYear,
    setSelectedYear,
  ] = useState(
    getCurrentYear()
  )

  const [
    selectedType,
    setSelectedType,
  ] = useState(
    'الكل'
  )

  const [
    showChart,
    setShowChart,
  ] = useState(false)

  const records =
    useMemo(
      () =>
        loadRecords(),
      []
    )

  const incomeTypes =
    useMemo(() => {
      const savedTypes =
        loadTypes()

      const recordTypes =
        records.map(
          (record) =>
            record.typeName
        )

      return Array.from(
        new Set([
          ...savedTypes,
          ...recordTypes,
        ])
      ).filter(Boolean)
    }, [
      records,
    ])

  const typeFilteredRecords =
    useMemo(() => {
      if (
        selectedType ===
        'الكل'
      ) {
        return records
      }

      return records.filter(
        (record) =>
          record.typeName ===
          selectedType
      )
    }, [
      records,
      selectedType,
    ])

  const dailyRecords =
    useMemo(() => {
      return typeFilteredRecords
        .filter(
          (record) =>
            record.date ===
            selectedDate
        )
        .sort(
          (a, b) =>
            a.typeName.localeCompare(
              b.typeName,
              'ar'
            )
        )
    }, [
      typeFilteredRecords,
      selectedDate,
    ])

  const dailyRows =
    useMemo(() => {
      const map =
        new Map<
          string,
          number
        >()

      dailyRecords.forEach(
        (record) => {
          map.set(
            record.typeName,
            (
              map.get(
                record.typeName
              ) || 0
            ) +
              (
                Number(
                  record.amount
                ) || 0
              )
          )
        }
      )

      return Array.from(
        map.entries()
      )
        .map(
          ([
            typeName,
            total,
          ]) => ({
            typeName,
            total,
          })
        )
        .sort(
          (a, b) =>
            b.total -
            a.total
        )
    }, [
      dailyRecords,
    ])

  const dailyTotal =
    dailyRows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.total,
      0
    )

  const monthlyRows =
    useMemo(() => {
      const map =
        new Map<
          string,
          number
        >()

      typeFilteredRecords
        .filter(
          (record) =>
            record.date.startsWith(
              selectedMonth
            )
        )
        .forEach(
          (record) => {
            map.set(
              record.date,
              (
                map.get(
                  record.date
                ) || 0
              ) +
                (
                  Number(
                    record.amount
                  ) || 0
                )
            )
          }
        )

      return Array.from(
        map.entries()
      )
        .map(
          ([
            date,
            total,
          ]) => ({
            date,
            total,
          })
        )
        .sort(
          (a, b) =>
            a.date.localeCompare(
              b.date
            )
        )
    }, [
      typeFilteredRecords,
      selectedMonth,
    ])

  const monthlyChartData =
    useMemo(() => {
      const daysCount =
        getDaysInMonth(
          selectedMonth
        )

      const rowsMap =
        new Map(
          monthlyRows.map(
            (row) => [
              row.date,
              row.total,
            ]
          )
        )

      return Array.from(
        {
          length:
            daysCount,
        },
        (
          _,
          index
        ) => {
          const day =
            index + 1

          const dayText =
            String(
              day
            ).padStart(
              2,
              '0'
            )

          const date =
            `${selectedMonth}-${dayText}`

          return {
            label:
              String(
                day
              ),

            date,

            total:
              rowsMap.get(
                date
              ) || 0,
          }
        }
      )
    }, [
      monthlyRows,
      selectedMonth,
    ])

  const monthlyTotal =
    monthlyRows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.total,
      0
    )

  const yearlyRows =
    useMemo(() => {
      return arabicMonths.map(
        (
          monthName,
          index
        ) => {
          const monthNumber =
            String(
              index + 1
            ).padStart(
              2,
              '0'
            )

          const prefix =
            `${selectedYear}-${monthNumber}`

          const total =
            typeFilteredRecords
              .filter(
                (record) =>
                  record.date.startsWith(
                    prefix
                  )
              )
              .reduce(
                (
                  sum,
                  record
                ) =>
                  sum +
                  (
                    Number(
                      record.amount
                    ) || 0
                  ),
                0
              )

          return {
            monthName,
            monthNumber,
            total,
          }
        }
      )
    }, [
      typeFilteredRecords,
      selectedYear,
    ])

  const yearlyTotal =
    yearlyRows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.total,
      0
    )

  const currentTotal =
    mode ===
    'daily'
      ? dailyTotal
      : mode ===
        'monthly'
        ? monthlyTotal
        : yearlyTotal

  const chartData =
    mode ===
    'daily'
      ? dailyRows.map(
          (row) => ({
            label:
              row.typeName,

            total:
              row.total,
          })
        )
      : mode ===
        'monthly'
        ? monthlyChartData
        : yearlyRows.map(
            (row) => ({
              label:
                row.monthName,

              total:
                row.total,
            })
          )

  return (
    <div
      className="income-summary-page"
      dir="rtl"
    >

      <style>{`

        .income-summary-page {
          width: 100%;
        }

        /* =========================================
           اليومي / الشهري / السنوي
        ========================================= */

        .income-summary-mode-tabs {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .income-summary-mode-button {
          min-width: 132px;
          min-height: 45px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          padding:
            0 18px;

          border:
            1px solid #dfd2c5;

          border-radius: 11px;

          background:
            #faf6f0;

          color:
            #6f605a;

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

        .income-summary-mode-button:hover {
          color:
            var(--theme-main);

          border-color:
            var(--theme-main);

          background:
            var(--theme-soft);
        }

        .income-summary-mode-button.active {
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

        /* =========================================
           اختيار الفترة
        ========================================= */

        .income-summary-period {
          display: flex;

          align-items:
            flex-end;

          justify-content:
            space-between;

          gap: 20px;

          padding: 18px 20px;

          margin-bottom: 16px;

          border:
            1px solid
            #e2d5c8;

          border-radius: 15px;

          background:
            #ffffff;
        }

        .income-summary-period-title span {
          color:
            var(--theme-main);

          font-size: 9px;

          font-weight: 900;
        }

        .income-summary-period-title h2 {
          margin:
            4px 0 0;

          color:
            var(--theme-dark);

          font-size: 23px;

          font-weight: 900;
        }

        .income-summary-period-controls {
          display: flex;

          align-items:
            flex-end;

          gap: 10px;

          flex-wrap: wrap;
        }

        .income-summary-field {
          display: flex;

          flex-direction:
            column;

          gap: 6px;

          color:
            #6f625c;

          font-size: 10px;

          font-weight: 900;
        }

        .income-summary-input-wrap {
          position: relative;
        }

        .income-summary-input-wrap svg {
          position: absolute;

          right: 11px;

          top: 50%;

          transform:
            translateY(-50%);

          color:
            var(--theme-main);

          pointer-events: none;
        }

        .income-summary-field input,
        .income-summary-field select {
          min-width: 190px;

          height: 44px;

          box-sizing:
            border-box;

          border:
            1px solid
            #dfd2c5;

          border-radius: 10px;

          background:
            var(--theme-soft-2);

          color:
            var(--theme-dark);

          padding:
            0 38px 0 12px;

          font-family:
            inherit;

          outline: none;
        }

        .income-summary-field select {
          padding:
            0 12px;
        }

        .income-summary-field input:focus,
        .income-summary-field select:focus {
          border-color:
            var(--theme-main);

          box-shadow:
            0 0 0 3px
            var(--theme-soft);
        }

        /* =========================================
           الصندوق
        ========================================= */

        .income-summary-box {
          overflow: hidden;

          border:
            1px solid
            #e2d6ca;

          border-radius: 15px;

          background:
            #ffffff;
        }

        .income-summary-box-header {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 20px;

          padding:
            18px 20px;

          border-bottom:
            1px solid
            #eee4da;
        }

        .income-summary-box-title span {
          color:
            var(--theme-main);

          font-size: 9px;

          font-weight: 900;
        }

        .income-summary-box-title h3 {
          margin:
            4px 0 0;

          color:
            var(--theme-dark);

          font-size: 20px;

          font-weight: 900;
        }

        .income-summary-actions {
          display: flex;

          align-items: center;

          gap: 10px;

          flex-wrap: wrap;
        }

        .income-summary-total {
          min-width: 170px;
        }

        .income-summary-total span {
          display: block;

          color:
            #83736c;

          font-size: 9px;

          font-weight: 800;
        }

        /* قيمة الدخل تبقى خضراء */

        .income-summary-total strong {
          display: block;

          margin-top: 3px;

          color:
            #2E7D4F;

          font-size: 19px;

          font-weight: 900;
        }

        .income-chart-button {
          min-height: 40px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 7px;

          padding:
            0 14px;

          border:
            1px solid
            #ddcfc2;

          border-radius: 10px;

          background:
            #faf6f0;

          color:
            #6c5e57;

          font-family:
            inherit;

          font-size: 10px;

          font-weight: 900;

          cursor: pointer;
        }

        .income-chart-button:hover,
        .income-chart-button.active {
          border-color:
            var(--theme-main);

          background:
            var(--theme-soft);

          color:
            var(--theme-main);
        }

        /* =========================================
           الرسم البياني
           اللون الأخضر ثابت
        ========================================= */

        .income-summary-chart-panel {
          padding:
            22px 18px;

          border-bottom:
            1px solid
            #eee4da;

          background:
            #fffdf9;
        }

        .income-summary-chart-title {
          margin-bottom: 17px;
        }

        .income-summary-chart-title span {
          color:
            #2E7D4F;

          font-size: 9px;

          font-weight: 900;
        }

        .income-summary-chart-title h4 {
          margin:
            4px 0 0;

          color:
            #245E3D;

          font-size: 17px;
        }

        .income-summary-chart {
          width: 100%;

          height: 320px;

          direction: ltr;
        }

        /* =========================================
           الجدول
        ========================================= */

        .income-summary-table-wrapper {
          overflow-x: auto;
        }

        .income-summary-table {
          width: 100%;

          min-width: 620px;

          border-collapse:
            collapse;
        }

        .income-summary-table thead {
          background:
            var(--theme-soft);
        }

        .income-summary-table th {
          padding:
            13px 16px;

          text-align: right;

          color:
            var(--theme-main);

          font-size: 10px;

          font-weight: 900;

          border-bottom:
            1px solid
            #e5d9ce;
        }

        .income-summary-table td {
          padding:
            13px 16px;

          color:
            #655851;

          font-size: 11px;

          border-bottom:
            1px solid
            #eee5dd;
        }

        .income-summary-table
        tbody
        tr:last-child
        td {
          border-bottom: none;
        }

        .income-summary-name {
          color:
            var(--theme-dark)
            !important;

          font-weight: 900;
        }

        /* قيم الدخل تبقى خضراء */

        .income-summary-value {
          color:
            #2E7D4F
            !important;

          font-weight: 900;

          white-space: nowrap;
        }

        .income-summary-empty {
          padding:
            45px 20px;

          text-align: center;

          color:
            #8e7c74;

          font-size: 11px;
        }

        @media (
          max-width: 850px
        ) {

          .income-summary-period,
          .income-summary-box-header {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .income-summary-period-controls {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .income-summary-field input,
          .income-summary-field select {
            width: 100%;

            min-width: 0;
          }

          .income-summary-actions {
            justify-content:
              space-between;
          }

        }

        @media (
          max-width: 600px
        ) {

          .income-summary-mode-tabs {
            display: grid;

            grid-template-columns:
              1fr;
          }

          .income-summary-mode-button {
            width: 100%;
          }

        }

      `}</style>

      <div
        className="income-summary-mode-tabs"
      >

        <button
          type="button"
          className={
            mode ===
            'daily'
              ? 'income-summary-mode-button active'
              : 'income-summary-mode-button'
          }
          onClick={() =>
            setMode(
              'daily'
            )
          }
        >

          <CalendarDays
            size={17}
          />

          اليومي

        </button>

        <button
          type="button"
          className={
            mode ===
            'monthly'
              ? 'income-summary-mode-button active'
              : 'income-summary-mode-button'
          }
          onClick={() =>
            setMode(
              'monthly'
            )
          }
        >

          <CalendarRange
            size={17}
          />

          الشهري

        </button>

        <button
          type="button"
          className={
            mode ===
            'yearly'
              ? 'income-summary-mode-button active'
              : 'income-summary-mode-button'
          }
          onClick={() =>
            setMode(
              'yearly'
            )
          }
        >

          <ListChecks
            size={17}
          />

          السنوي

        </button>

      </div>

      <section
        className="income-summary-period"
      >

        <div
          className="income-summary-period-title"
        >

          <span>

            {
              mode ===
              'daily'
                ? 'الملخص اليومي'
                : mode ===
                  'monthly'
                  ? 'الملخص الشهري'
                  : 'الملخص السنوي'
            }

          </span>

          <h2>

            {
              mode ===
              'daily'
                ? 'إجمالي الدخل حسب النوع'
                : mode ===
                  'monthly'
                  ? 'إجمالي كل يوم'
                  : 'إجمالي كل شهر'
            }

          </h2>

        </div>

        <div
          className="income-summary-period-controls"
        >

          {mode ===
            'daily' && (

            <label
              className="income-summary-field"
            >

              التاريخ

              <div
                className="income-summary-input-wrap"
              >

                <CalendarDays
                  size={16}
                />

                <input
                  type="date"
                  value={
                    selectedDate
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedDate(
                      event.target
                        .value
                    )
                  }
                />

              </div>

            </label>

          )}

          {mode ===
            'monthly' && (

            <label
              className="income-summary-field"
            >

              الشهر

              <div
                className="income-summary-input-wrap"
              >

                <CalendarRange
                  size={16}
                />

                <input
                  type="month"
                  value={
                    selectedMonth
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedMonth(
                      event.target
                        .value
                    )
                  }
                />

              </div>

            </label>

          )}

          {mode ===
            'yearly' && (

            <label
              className="income-summary-field"
            >

              السنة

              <div
                className="income-summary-input-wrap"
              >

                <CalendarRange
                  size={16}
                />

                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={
                    selectedYear
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedYear(
                      event.target
                        .value
                    )
                  }
                />

              </div>

            </label>

          )}

          <label
            className="income-summary-field"
          >

            نوع الدخل

            <div
              className="income-summary-input-wrap"
            >

              <ChevronDown
                size={16}
              />

              <select
                value={
                  selectedType
                }
                onChange={(
                  event
                ) =>
                  setSelectedType(
                    event.target
                      .value
                  )
                }
              >

                <option
                  value="الكل"
                >
                  الكل
                </option>

                {incomeTypes.map(
                  (type) => (

                    <option
                      key={
                        type
                      }
                      value={
                        type
                      }
                    >
                      {type}
                    </option>

                  )
                )}

              </select>

            </div>

          </label>

        </div>

      </section>

      <section
        className="income-summary-box"
      >

        <div
          className="income-summary-box-header"
        >

          <div
            className="income-summary-box-title"
          >

            <span>

              {
                mode ===
                'daily'
                  ? 'اليوم'
                  : mode ===
                    'monthly'
                    ? 'الشهر'
                    : 'السنة'
              }

            </span>

            <h3>

              {
                mode ===
                'daily'
                  ? 'إجمالي الدخل حسب النوع'
                  : mode ===
                    'monthly'
                    ? 'إجمالي الدخل حسب اليوم'
                    : 'إجمالي الدخل حسب الشهر'
              }

            </h3>

          </div>

          <div
            className="income-summary-actions"
          >

            <button
              type="button"
              className={
                showChart
                  ? 'income-chart-button active'
                  : 'income-chart-button'
              }
              onClick={() =>
                setShowChart(
                  (current) =>
                    !current
                )
              }
            >

              <BarChart3
                size={16}
              />

              {
                showChart
                  ? 'إخفاء الرسم'
                  : 'الرسم البياني'
              }

            </button>

            <div
              className="income-summary-total"
            >

              <span>
                إجمالي الدخل
              </span>

              <strong>

                {
                  formatMoney(
                    currentTotal
                  )
                }
                {' '}
                ريال

              </strong>

            </div>

          </div>

        </div>

        {showChart && (

          <div
            className="income-summary-chart-panel"
          >

            <div
              className="income-summary-chart-title"
            >

              <span>
                الرسم البياني
              </span>

              <h4>

                {
                  mode ===
                  'daily'
                    ? 'توزيع الدخل لهذا اليوم'
                    : mode ===
                      'monthly'
                      ? 'الدخل خلال أيام الشهر'
                      : 'الدخل خلال أشهر السنة'
                }

              </h4>

            </div>

            {chartData.length ===
              0 ||
            currentTotal ===
              0 ? (

              <div
                className="income-summary-empty"
              >
                لا توجد بيانات
                لعرض الرسم البياني
              </div>

            ) : (

              <div
                className="income-summary-chart"
              >

                <ResponsiveContainer
                  width="100%"
                  height={320}
                >

                  <BarChart
                    data={
                      chartData
                    }
                    margin={{
                      top: 10,
                      right: 5,
                      left: 5,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={
                        false
                      }
                    />

                    <XAxis
                      dataKey="label"
                      interval={
                        mode ===
                        'monthly'
                          ? 0
                          : undefined
                      }
                      tick={{
                        fontSize:
                          mode ===
                          'monthly'
                            ? 8
                            : 10,
                      }}
                      tickLine={
                        false
                      }
                    />

                    <YAxis
                      tick={{
                        fontSize: 9,
                      }}
                      tickFormatter={(
                        value
                      ) => {
                        const number =
                          Number(
                            value
                          )

                        if (
                          number >=
                          1000000
                        ) {
                          return `${(
                            number /
                            1000000
                          ).toFixed(
                            1
                          )}M`
                        }

                        if (
                          number >=
                          1000
                        ) {
                          return `${Math.round(
                            number /
                            1000
                          )}K`
                        }

                        return String(
                          number
                        )
                      }}
                    />

                    <Tooltip
                      formatter={(
                        value
                      ) => [
                        `${formatMoney(
                          Number(
                            value
                          )
                        )} ريال`,
                        'الدخل',
                      ]}
                    />

                    <Bar
                      dataKey="total"

                      fill="#2E7D4F"

                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}

                      maxBarSize={
                        mode ===
                        'monthly'
                          ? 20
                          : 48
                      }
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            )}

          </div>

        )}

        {mode ===
          'daily' && (

          dailyRows.length ===
          0 ? (

            <div
              className="income-summary-empty"
            >
              لا يوجد دخل مسجل
              لهذا اليوم
            </div>

          ) : (

            <div
              className="income-summary-table-wrapper"
            >

              <table
                className="income-summary-table"
              >

                <thead>

                  <tr>

                    <th>
                      نوع الدخل
                    </th>

                    <th>
                      الإجمالي
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {dailyRows.map(
                    (row) => (

                      <tr
                        key={
                          row.typeName
                        }
                      >

                        <td
                          className="income-summary-name"
                        >
                          {
                            row.typeName
                          }
                        </td>

                        <td
                          className="income-summary-value"
                        >

                          {
                            formatMoney(
                              row.total
                            )
                          }
                          {' '}
                          ريال

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )

        )}

        {mode ===
          'monthly' && (

          monthlyRows.length ===
          0 ? (

            <div
              className="income-summary-empty"
            >
              لا يوجد دخل مسجل
              في هذا الشهر
            </div>

          ) : (

            <div
              className="income-summary-table-wrapper"
            >

              <table
                className="income-summary-table"
              >

                <thead>

                  <tr>

                    <th>
                      التاريخ
                    </th>

                    <th>
                      إجمالي دخل اليوم
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {monthlyRows.map(
                    (row) => (

                      <tr
                        key={
                          row.date
                        }
                      >

                        <td
                          className="income-summary-name"
                        >

                          {
                            formatDate(
                              row.date
                            )
                          }

                        </td>

                        <td
                          className="income-summary-value"
                        >

                          {
                            formatMoney(
                              row.total
                            )
                          }
                          {' '}
                          ريال

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )

        )}

        {mode ===
          'yearly' && (

          <div
            className="income-summary-table-wrapper"
          >

            <table
              className="income-summary-table"
            >

              <thead>

                <tr>

                  <th>
                    الشهر
                  </th>

                  <th>
                    إجمالي الدخل
                  </th>

                </tr>

              </thead>

              <tbody>

                {yearlyRows.map(
                  (row) => (

                    <tr
                      key={
                        row.monthNumber
                      }
                    >

                      <td
                        className="income-summary-name"
                      >

                        {
                          row.monthName
                        }

                      </td>

                      <td
                        className="income-summary-value"
                      >

                        {
                          formatMoney(
                            row.total
                          )
                        }
                        {' '}
                        ريال

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  )
}

export default IncomeSummary