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

type ExpenseRecord = {
  id: number
  date: string
  itemName: string
  amount: string
  note: string
  source?: string
}

type SummaryMode =
  | 'daily'
  | 'monthly'
  | 'yearly'

const RECORDS_STORAGE_KEY =
  'younes_expense_records'

const TYPES_STORAGE_KEY =
  'younes_expense_types'

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
  ExpenseRecord[] {
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

function ExpensesSummary() {
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

  const expenseTypes =
    useMemo(() => {
      const savedTypes =
        loadTypes()

      const recordTypes =
        records.map(
          (record) =>
            record.itemName
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
          record.itemName ===
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
            a.itemName.localeCompare(
              b.itemName,
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
            record.itemName,
            (
              map.get(
                record.itemName
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
            itemName,
            total,
          ]) => ({
            itemName,
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
              row.itemName,

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
      className="expenses-summary-page"
      dir="rtl"
    >

      <style>{`

        .expenses-summary-page {
          width: 100%;
        }

        .expense-summary-mode-tabs {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .expense-summary-mode-button {
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

        .expense-summary-mode-button:hover {
          color:
            var(--theme-main);

          border-color:
            var(--theme-main);

          background:
            var(--theme-soft);
        }

        .expense-summary-mode-button.active {
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

        .expense-summary-period {
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

          background: #ffffff;
        }

        .expense-summary-period-title span {
          color:
            var(--theme-main);

          font-size: 9px;

          font-weight: 900;
        }

        .expense-summary-period-title h2 {
          margin:
            4px 0 0;

          color:
            var(--theme-dark);

          font-size: 23px;

          font-weight: 900;
        }

        .expense-summary-period-controls {
          display: flex;

          align-items:
            flex-end;

          gap: 10px;

          flex-wrap: wrap;
        }

        .expense-summary-field {
          display: flex;

          flex-direction:
            column;

          gap: 6px;

          color:
            #6f625c;

          font-size: 10px;

          font-weight: 900;
        }

        .expense-summary-input-wrap {
          position: relative;
        }

        .expense-summary-input-wrap svg {
          position: absolute;

          right: 11px;

          top: 50%;

          transform:
            translateY(-50%);

          color:
            var(--theme-main);

          pointer-events:
            none;
        }

        .expense-summary-field input,
        .expense-summary-field select {
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

        .expense-summary-field select {
          padding:
            0 12px;
        }

        .expense-summary-field input:focus,
        .expense-summary-field select:focus {
          border-color:
            var(--theme-main);

          box-shadow:
            0 0 0 3px
            var(--theme-soft);
        }

        .expense-summary-box {
          overflow: hidden;

          border:
            1px solid
            #e2d6ca;

          border-radius: 15px;

          background: #ffffff;
        }

        .expense-summary-box-header {
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

        .expense-summary-box-title span {
          color:
            var(--theme-main);

          font-size: 9px;

          font-weight: 900;
        }

        .expense-summary-box-title h3 {
          margin:
            4px 0 0;

          color:
            var(--theme-dark);

          font-size: 20px;

          font-weight: 900;
        }

        .expense-summary-actions {
          display: flex;

          align-items: center;

          gap: 10px;

          flex-wrap: wrap;
        }

        .expense-summary-total {
          min-width: 170px;
        }

        .expense-summary-total span {
          display: block;

          color:
            #83736c;

          font-size: 9px;

          font-weight: 800;
        }

        .expense-summary-total strong {
          display: block;

          margin-top: 3px;

          color:
            #A13D3D;

          font-size: 19px;

          font-weight: 900;
        }

        .expense-chart-button {
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

        .expense-chart-button:hover,
        .expense-chart-button.active {
          border-color:
            var(--theme-main);

          background:
            var(--theme-soft);

          color:
            var(--theme-main);
        }

        .expense-summary-chart-panel {
          padding:
            22px 18px;

          border-bottom:
            1px solid
            #eee4da;

          background:
            #fffdf9;
        }

        .expense-summary-chart-title {
          margin-bottom: 17px;
        }

        .expense-summary-chart-title span {
          color:
            #A13D3D;

          font-size: 9px;

          font-weight: 900;
        }

        .expense-summary-chart-title h4 {
          margin:
            4px 0 0;

          color:
            #7F2F2F;

          font-size: 17px;
        }

        .expense-summary-chart {
          width: 100%;

          height: 320px;

          direction: ltr;
        }

        .expense-summary-table-wrapper {
          overflow-x: auto;
        }

        .expense-summary-table {
          width: 100%;

          min-width: 620px;

          border-collapse:
            collapse;
        }

        .expense-summary-table thead {
          background:
            var(--theme-soft);
        }

        .expense-summary-table th {
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

        .expense-summary-table td {
          padding:
            13px 16px;

          color:
            #655851;

          font-size: 11px;

          border-bottom:
            1px solid
            #eee5dd;
        }

        .expense-summary-table
        tbody
        tr:last-child
        td {
          border-bottom: none;
        }

        .expense-summary-name {
          color:
            var(--theme-dark)
            !important;

          font-weight: 900;
        }

        .expense-summary-value {
          color:
            #A13D3D
            !important;

          font-weight: 900;

          white-space: nowrap;
        }

        .expense-summary-empty {
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

          .expense-summary-period,
          .expense-summary-box-header {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .expense-summary-period-controls {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .expense-summary-field input,
          .expense-summary-field select {
            width: 100%;

            min-width: 0;
          }

          .expense-summary-actions {
            justify-content:
              space-between;
          }

        }

        @media (
          max-width: 600px
        ) {

          .expense-summary-mode-tabs {
            display: grid;

            grid-template-columns:
              1fr;
          }

          .expense-summary-mode-button {
            width: 100%;
          }

        }

      `}</style>

      <div
        className="expense-summary-mode-tabs"
      >

        <button
          type="button"
          className={
            mode ===
            'daily'
              ? 'expense-summary-mode-button active'
              : 'expense-summary-mode-button'
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
              ? 'expense-summary-mode-button active'
              : 'expense-summary-mode-button'
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
              ? 'expense-summary-mode-button active'
              : 'expense-summary-mode-button'
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
        className="expense-summary-period"
      >

        <div
          className="expense-summary-period-title"
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
                ? 'إجمالي الخرج حسب الصنف'
                : mode ===
                  'monthly'
                  ? 'إجمالي كل يوم'
                  : 'إجمالي كل شهر'
            }

          </h2>

        </div>

        <div
          className="expense-summary-period-controls"
        >

          {mode ===
            'daily' && (

            <label
              className="expense-summary-field"
            >

              التاريخ

              <div
                className="expense-summary-input-wrap"
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
              className="expense-summary-field"
            >

              الشهر

              <div
                className="expense-summary-input-wrap"
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
              className="expense-summary-field"
            >

              السنة

              <div
                className="expense-summary-input-wrap"
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
            className="expense-summary-field"
          >

            نوع الخرج

            <div
              className="expense-summary-input-wrap"
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

                {expenseTypes.map(
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
        className="expense-summary-box"
      >

        <div
          className="expense-summary-box-header"
        >

          <div
            className="expense-summary-box-title"
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
                  ? 'إجمالي الخرج حسب الصنف'
                  : mode ===
                    'monthly'
                    ? 'إجمالي الخرج حسب اليوم'
                    : 'إجمالي الخرج حسب الشهر'
              }

            </h3>

          </div>

          <div
            className="expense-summary-actions"
          >

            <button
              type="button"
              className={
                showChart
                  ? 'expense-chart-button active'
                  : 'expense-chart-button'
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
              className="expense-summary-total"
            >

              <span>
                إجمالي الخرج
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
            className="expense-summary-chart-panel"
          >

            <div
              className="expense-summary-chart-title"
            >

              <span>
                الرسم البياني
              </span>

              <h4>

                {
                  mode ===
                  'daily'
                    ? 'توزيع الخرج لهذا اليوم'
                    : mode ===
                      'monthly'
                      ? 'الخرج خلال أيام الشهر'
                      : 'الخرج خلال أشهر السنة'
                }

              </h4>

            </div>

            {chartData.length ===
              0 ||
            currentTotal ===
              0 ? (

              <div
                className="expense-summary-empty"
              >
                لا توجد بيانات
                لعرض الرسم البياني
              </div>

            ) : (

              <div
                className="expense-summary-chart"
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
                        'الخرج',
                      ]}
                    />

                    <Bar
                      dataKey="total"
                      fill="#A13D3D"
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
              className="expense-summary-empty"
            >
              لا يوجد خرج مسجل
              لهذا اليوم
            </div>

          ) : (

            <div
              className="expense-summary-table-wrapper"
            >

              <table
                className="expense-summary-table"
              >

                <thead>

                  <tr>

                    <th>
                      نوع الخرج
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
                          row.itemName
                        }
                      >

                        <td
                          className="expense-summary-name"
                        >
                          {
                            row.itemName
                          }
                        </td>

                        <td
                          className="expense-summary-value"
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
              className="expense-summary-empty"
            >
              لا يوجد خرج مسجل
              في هذا الشهر
            </div>

          ) : (

            <div
              className="expense-summary-table-wrapper"
            >

              <table
                className="expense-summary-table"
              >

                <thead>

                  <tr>

                    <th>
                      التاريخ
                    </th>

                    <th>
                      إجمالي خرج اليوم
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
                          className="expense-summary-name"
                        >

                          {
                            formatDate(
                              row.date
                            )
                          }

                        </td>

                        <td
                          className="expense-summary-value"
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
            className="expense-summary-table-wrapper"
          >

            <table
              className="expense-summary-table"
            >

              <thead>

                <tr>

                  <th>
                    الشهر
                  </th>

                  <th>
                    إجمالي الخرج
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
                        className="expense-summary-name"
                      >

                        {
                          row.monthName
                        }

                      </td>

                      <td
                        className="expense-summary-value"
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

export default ExpensesSummary