import {
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  BarChart3,
  CalendarRange,
  Download,
  ListChecks,
  Printer,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

type IncomeRecord = {
  id: number
  date: string
  typeName: string
  amount: string
  note: string
}

type ExpenseRecord = {
  id: number
  date: string
  itemName: string
  amount: string
  note: string
  source?: string
}

type ReportMode =
  | 'monthly'
  | 'yearly'

const INCOME_STORAGE_KEY =
  'younes_income_records'

const EXPENSE_STORAGE_KEY =
  'younes_expense_records'

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

function getToday() {
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
  return getToday().slice(
    0,
    7
  )
}

function getCurrentYear() {
  return getToday().slice(
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

function loadIncomeRecords():
  IncomeRecord[] {
  try {
    const saved =
      localStorage.getItem(
        INCOME_STORAGE_KEY
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

function loadExpenseRecords():
  ExpenseRecord[] {
  try {
    const saved =
      localStorage.getItem(
        EXPENSE_STORAGE_KEY
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

function getIssueDate() {
  const now =
    new Date()

  return `${now.getDate()} ${
    arabicMonths[
      now.getMonth()
    ]
  } ${now.getFullYear()}`
}

function FinancialReport() {
  const [
    mode,
    setMode,
  ] = useState<
    ReportMode
  >('monthly')

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
    showChart,
    setShowChart,
  ] = useState(false)

  const [
    isExporting,
    setIsExporting,
  ] = useState(false)

  const exportRef =
    useRef<
      HTMLDivElement | null
    >(null)

  const incomeRecords =
    useMemo(
      () =>
        loadIncomeRecords(),
      []
    )

  const expenseRecords =
    useMemo(
      () =>
        loadExpenseRecords(),
      []
    )

  const monthlyRows =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            income: number
            expense: number
          }
        >()

      incomeRecords
        .filter(
          (record) =>
            record.date.startsWith(
              selectedMonth
            )
        )
        .forEach(
          (record) => {
            const current =
              map.get(
                record.date
              ) || {
                income: 0,
                expense: 0,
              }

            current.income +=
              Number(
                record.amount
              ) || 0

            map.set(
              record.date,
              current
            )
          }
        )

      expenseRecords
        .filter(
          (record) =>
            record.date.startsWith(
              selectedMonth
            )
        )
        .forEach(
          (record) => {
            const current =
              map.get(
                record.date
              ) || {
                income: 0,
                expense: 0,
              }

            current.expense +=
              Number(
                record.amount
              ) || 0

            map.set(
              record.date,
              current
            )
          }
        )

      return Array.from(
        map.entries()
      )
        .map(
          ([
            date,
            values,
          ]) => ({
            date,

            income:
              values.income,

            expense:
              values.expense,

            net:
              values.income -
              values.expense,
          })
        )
        .sort(
          (a, b) =>
            a.date.localeCompare(
              b.date
            )
        )
    }, [
      incomeRecords,
      expenseRecords,
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
              row,
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

          const row =
            rowsMap.get(
              date
            )

          return {
            label:
              String(
                day
              ),

            date,

            income:
              row?.income ||
              0,

            expense:
              row?.expense ||
              0,
          }
        }
      )
    }, [
      monthlyRows,
      selectedMonth,
    ])

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

          const income =
            incomeRecords
              .filter(
                (record) =>
                  record.date.startsWith(
                    prefix
                  )
              )
              .reduce(
                (
                  total,
                  record
                ) =>
                  total +
                  (
                    Number(
                      record.amount
                    ) || 0
                  ),
                0
              )

          const expense =
            expenseRecords
              .filter(
                (record) =>
                  record.date.startsWith(
                    prefix
                  )
              )
              .reduce(
                (
                  total,
                  record
                ) =>
                  total +
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
            income,
            expense,

            net:
              income -
              expense,
          }
        }
      )
    }, [
      incomeRecords,
      expenseRecords,
      selectedYear,
    ])

  const monthlyIncome =
    monthlyRows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.income,
      0
    )

  const monthlyExpense =
    monthlyRows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.expense,
      0
    )

  const monthlyNet =
    monthlyIncome -
    monthlyExpense

  const yearlyIncome =
    yearlyRows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.income,
      0
    )

  const yearlyExpense =
    yearlyRows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.expense,
      0
    )

  const yearlyNet =
    yearlyIncome -
    yearlyExpense

  const currentIncome =
    mode ===
    'monthly'
      ? monthlyIncome
      : yearlyIncome

  const currentExpense =
    mode ===
    'monthly'
      ? monthlyExpense
      : yearlyExpense

  const currentNet =
    mode ===
    'monthly'
      ? monthlyNet
      : yearlyNet

  const chartData =
    mode ===
    'monthly'
      ? monthlyChartData
      : yearlyRows.map(
          (row) => ({
            label:
              row.monthName,

            income:
              row.income,

            expense:
              row.expense,
          })
        )

  const selectedPeriodTitle =
    useMemo(() => {
      if (
        mode ===
        'yearly'
      ) {
        return `تقرير سنة ${selectedYear}`
      }

      const [
        year,
        month,
      ] =
        selectedMonth.split(
          '-'
        )

      const monthName =
        arabicMonths[
          Number(month) - 1
        ] || ''

      return `تقرير شهر ${monthName} ${year}`
    }, [
      mode,
      selectedMonth,
      selectedYear,
    ])

  const fileName =
    useMemo(() => {
      if (
        mode ===
        'yearly'
      ) {
        return `التقرير_المالي_${selectedYear}.pdf`
      }

      const [
        year,
        month,
      ] =
        selectedMonth.split(
          '-'
        )

      const monthName =
        arabicMonths[
          Number(month) - 1
        ] || month

      return `التقرير_المالي_${monthName}_${year}.pdf`
    }, [
      mode,
      selectedMonth,
      selectedYear,
    ])

  async function downloadPDF() {
    const element =
      exportRef.current

    if (!element) {
      alert(
        'تعذر تجهيز التقرير.'
      )

      return
    }

    try {
      setIsExporting(
        true
      )

      if (
        document.fonts?.ready
      ) {
        await document.fonts.ready
      }

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            250
          )
      )

      const canvas =
        await html2canvas(
          element,
          {
            scale: 2,

            backgroundColor:
              '#ffffff',

            useCORS: true,

            logging: false,

            windowWidth:
              794,
          }
        )

      const pdf =
        new jsPDF(
          'p',
          'mm',
          'a4'
        )

      const pageWidth =
        210

      const pageHeight =
        297

      const margin =
        10

      const contentWidth =
        pageWidth -
        margin * 2

      const contentHeight =
        pageHeight -
        margin * 2

      const pixelsPerMm =
        canvas.width /
        contentWidth

      const maxPageHeightPx =
        contentHeight *
        pixelsPerMm

      const elementRect =
        element.getBoundingClientRect()

      const canvasScaleY =
        canvas.height /
        element.scrollHeight

      const breakPoints =
        Array.from(
          element.querySelectorAll(
            '.pdf-break-safe'
          )
        )
          .map(
            (node) => {
              const rect =
                node.getBoundingClientRect()

              return (
                (
                  rect.bottom -
                  elementRect.top
                ) *
                canvasScaleY
              )
            }
          )
          .filter(
            (value) =>
              value > 0 &&
              value <
                canvas.height
          )
          .sort(
            (a, b) =>
              a - b
          )

      let startY =
        0

      let pageIndex =
        0

      while (
        startY <
        canvas.height
      ) {
        const idealEnd =
          Math.min(
            startY +
              maxPageHeightPx,
            canvas.height
          )

        let endY =
          idealEnd

        if (
          idealEnd <
          canvas.height
        ) {
          const minimumUsefulEnd =
            startY +
            maxPageHeightPx *
              0.55

          const candidates =
            breakPoints.filter(
              (point) =>
                point <=
                  idealEnd &&
                point >
                  minimumUsefulEnd
            )

          if (
            candidates.length >
            0
          ) {
            endY =
              candidates[
                candidates.length -
                  1
              ]
          }
        }

        if (
          endY <= startY
        ) {
          endY =
            idealEnd
        }

        const sliceHeight =
          Math.max(
            1,
            Math.floor(
              endY -
              startY
            )
          )

        const pageCanvas =
          document.createElement(
            'canvas'
          )

        pageCanvas.width =
          canvas.width

        pageCanvas.height =
          sliceHeight

        const context =
          pageCanvas.getContext(
            '2d'
          )

        if (context) {
          context.fillStyle =
            '#ffffff'

          context.fillRect(
            0,
            0,
            pageCanvas.width,
            pageCanvas.height
          )

          context.drawImage(
            canvas,

            0,
            Math.floor(
              startY
            ),

            canvas.width,
            sliceHeight,

            0,
            0,

            canvas.width,
            sliceHeight
          )
        }

        if (
          pageIndex > 0
        ) {
          pdf.addPage()
        }

        const imageData =
          pageCanvas.toDataURL(
            'image/jpeg',
            0.96
          )

        const imageHeightMm =
          sliceHeight /
          pixelsPerMm

        pdf.addImage(
          imageData,
          'JPEG',
          margin,
          margin,
          contentWidth,
          imageHeightMm,
          undefined,
          'FAST'
        )

        startY =
          endY

        pageIndex +=
          1
      }

      pdf.save(
        fileName
      )
    } catch (
      error
    ) {
      console.error(
        error
      )

      alert(
        'حدث خطأ أثناء إنشاء ملف PDF.'
      )
    } finally {
      setIsExporting(
        false
      )
    }
  }

  function printReport() {
    const oldTitle =
      document.title

    document.title =
      fileName.replace(
        '.pdf',
        ''
      )

    const restoreTitle =
      () => {
        document.title =
          oldTitle
      }

    window.addEventListener(
      'afterprint',
      restoreTitle,
      {
        once: true,
      }
    )

    window.print()

    setTimeout(
      restoreTitle,
      1500
    )
  }

  return (
    <div
      className="financial-report"
      dir="rtl"
    >

      <style>{`

        .financial-report {
          width: 100%;
        }

        /* =========================
           رأس التقرير
        ========================= */

        .financial-hero {
          padding: 30px;
          margin-bottom: 18px;

          border-radius: 24px;

          color: white;

          background:
            linear-gradient(
              135deg,
              var(--theme-mid),
              var(--theme-dark)
            );

          box-shadow:
            0 16px 34px
            var(--theme-shadow);
        }

        .financial-hero-top {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 20px;
        }

        .financial-hero span {
          font-size: 10px;
          font-weight: 900;

          opacity: .82;
        }

        .financial-hero h1 {
          margin:
            5px 0;

          font-size: 30px;
        }

        .financial-hero p {
          margin: 0;

          font-size: 10px;

          opacity: .78;
        }

        .financial-actions {
          display: flex;

          align-items: center;

          gap: 9px;

          flex-wrap: wrap;
        }

        .financial-action-button {
          min-height: 42px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .35
            );

          border-radius: 11px;

          padding:
            0 15px;

          background:
            rgba(
              255,
              255,
              255,
              .12
            );

          color: white;

          font-family: inherit;

          font-size: 10px;

          font-weight: 900;

          cursor: pointer;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 7px;
        }

        .financial-action-button:hover {
          background:
            rgba(
              255,
              255,
              255,
              .20
            );
        }

        .financial-action-button:disabled {
          opacity: .55;

          cursor: wait;
        }

        /* =========================
           الشهري والسنوي
        ========================= */

        .financial-mode-tabs {
          display: flex;

          gap: 10px;

          flex-wrap: wrap;

          margin-bottom: 16px;
        }

        .financial-mode-tabs button {
          min-width: 135px;
          height: 44px;

          border:
            1px solid
            #dfd2c5;

          border-radius: 11px;

          background:
            #faf5ef;

          color:
            #6f605a;

          font-family: inherit;

          font-weight: 900;

          cursor: pointer;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 7px;
        }

        .financial-mode-tabs
        button.active {
          background:
            var(--theme-main);

          color: white;

          border-color:
            var(--theme-main);

          box-shadow:
            0 8px 20px
            var(--theme-shadow);
        }

        /* =========================
           الفترة
        ========================= */

        .financial-period-box {
          display: flex;

          justify-content:
            space-between;

          align-items:
            flex-end;

          gap: 20px;

          padding: 18px;

          margin-bottom: 14px;

          border:
            1px solid
            #e2d5c8;

          border-radius: 14px;

          background: white;
        }

        .financial-period-title span {
          color:
            var(--theme-main);

          font-size: 9px;

          font-weight: 900;
        }

        .financial-period-title h2 {
          margin:
            4px 0 0;

          color:
            var(--theme-dark);

          font-size: 20px;
        }

        .financial-period-box label {
          display: flex;

          flex-direction:
            column;

          gap: 6px;

          color: #6e6059;

          font-size: 10px;

          font-weight: 900;
        }

        .financial-period-box input {
          min-width: 200px;
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
            0 12px;

          font-family:
            inherit;

          outline: none;
        }

        .financial-period-box input:focus {
          border-color:
            var(--theme-main);

          box-shadow:
            0 0 0 3px
            var(--theme-soft);
        }

        /* =========================
           البطاقات المالية
        ========================= */

        .financial-cards {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              minmax(
                0,
                1fr
              )
            );

          gap: 12px;

          margin-bottom: 14px;
        }

        .financial-card {
          min-height: 110px;

          padding: 18px;

          box-sizing:
            border-box;

          border-radius: 15px;

          background: white;

          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 12px;
        }

        .financial-card.income {
          border:
            1px solid
            #cfe4d6;
        }

        .financial-card.expense {
          border:
            1px solid
            #ead0d0;
        }

        .financial-card.net {
          border:
            1px solid
            #ddd2c7;
        }

        .financial-card-icon {
          width: 44px;
          height: 44px;

          border-radius: 12px;

          display: flex;

          justify-content: center;

          align-items: center;

          flex-shrink: 0;
        }

        .financial-card.income
        .financial-card-icon {
          color: #287447;

          background:
            #e7f4eb;
        }

        .financial-card.expense
        .financial-card-icon {
          color: #a43434;

          background:
            #f8e9e9;
        }

        .financial-card.net
        .financial-card-icon {
          color:
            var(--theme-main);

          background:
            var(--theme-soft);
        }

        .financial-card-content {
          flex: 1;
        }

        .financial-card-content span {
          display: block;

          margin-bottom: 7px;

          color: #83736c;

          font-size: 10px;

          font-weight: 900;
        }

        .financial-card-content strong {
          display: block;

          font-size: 21px;

          font-weight: 900;

          white-space: nowrap;
        }

        .financial-card.income strong {
          color: #287447;
        }

        .financial-card.expense strong {
          color: #a43434;
        }

        .financial-card.net
        strong.positive {
          color: #287447;
        }

        .financial-card.net
        strong.negative {
          color: #a43434;
        }

        .financial-card.net
        strong.zero {
          color:
            var(--theme-main);
        }

        /* =========================
           الجدول والرسم
        ========================= */

        .financial-data-box {
          border:
            1px solid
            #e2d6ca;

          border-radius: 15px;

          background: white;

          overflow: hidden;
        }

        .financial-data-heading {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 20px;

          padding:
            17px 18px;

          border-bottom:
            1px solid
            #eee4da;
        }

        .financial-data-heading span {
          color:
            var(--theme-main);

          font-size: 9px;

          font-weight: 900;
        }

        .financial-data-heading h3 {
          margin:
            4px 0 0;

          color:
            var(--theme-dark);

          font-size: 19px;
        }

        .financial-chart-button {
          min-height: 36px;

          padding:
            0 13px;

          border:
            1px solid
            #ddcfc2;

          border-radius: 9px;

          background:
            #faf6f0;

          color:
            #6b5d56;

          font-family: inherit;

          font-size: 10px;

          font-weight: 900;

          cursor: pointer;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 7px;
        }

        .financial-chart-button.active {
          color:
            var(--theme-main);

          border-color:
            var(--theme-main);

          background:
            var(--theme-soft);
        }

        .financial-chart-panel {
          padding:
            20px 18px;

          border-bottom:
            1px solid
            #eee4da;

          background:
            #fffdf9;
        }

        .financial-chart-head {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 20px;

          margin-bottom: 18px;
        }

        .financial-chart-head span {
          color:
            var(--theme-main);

          font-size: 9px;

          font-weight: 900;
        }

        .financial-chart-head h4 {
          margin:
            4px 0 0;

          color:
            var(--theme-dark);

          font-size: 17px;
        }

        .financial-chart-area {
          width: 100%;

          height: 320px;

          direction: ltr;
        }

        .financial-table-wrapper {
          overflow-x: auto;
        }

        .financial-table {
          width: 100%;

          min-width: 700px;

          border-collapse:
            collapse;
        }

        .financial-table thead {
          background:
            var(--theme-soft);
        }

        .financial-table th {
          padding:
            13px 15px;

          text-align: right;

          color:
            var(--theme-main);

          font-size: 10px;

          font-weight: 900;

          border-bottom:
            1px solid
            #e8dbcf;
        }

        .financial-table td {
          padding:
            13px 15px;

          color:
            #655851;

          font-size: 11px;

          border-bottom:
            1px solid
            #eee5dd;
        }

        .financial-table
        tbody
        tr:last-child
        td {
          border-bottom: none;
        }

        .financial-date {
          color:
            var(--theme-dark) !important;

          font-weight: 900;
        }

        .financial-income {
          color:
            #287447 !important;

          font-weight: 900;

          white-space: nowrap;
        }

        .financial-expense {
          color:
            #a43434 !important;

          font-weight: 900;

          white-space: nowrap;
        }

        .financial-net {
          font-weight: 900;

          white-space: nowrap;
        }

        .financial-net.positive {
          color:
            #287447 !important;
        }

        .financial-net.negative {
          color:
            #a43434 !important;
        }

        .financial-net.zero {
          color:
            #786a63 !important;
        }

        .financial-empty {
          padding:
            45px 20px;

          text-align: center;

          color:
            #907f77;

          font-size: 11px;
        }

        /* =========================================
           PDF والطباعة
           تبقى كما كانت
        ========================================= */

        .financial-export-document {
          position: fixed;

          left:
            -10000px;

          top: 0;

          width: 794px;

          box-sizing:
            border-box;

          padding: 40px;

          background:
            #ffffff;

          color:
            #392e2a;

          direction: rtl;

          font-family: inherit;
        }

        .export-header {
          text-align: center;

          padding-bottom: 20px;

          margin-bottom: 20px;

          border-bottom:
            2px solid
            #6b1f2a;
        }

        .export-logo {
          width: 52px;
          height: 52px;

          margin:
            0 auto 10px;

          border-radius: 14px;

          background:
            #6b1f2a;

          color:
            #ffffff;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 25px;

          font-weight: 900;
        }

        .export-header h1 {
          margin:
            0 0 5px;

          color:
            #4b151d;

          font-size: 26px;
        }

        .export-header h2 {
          margin: 0;

          color:
            #755f58;

          font-size: 15px;
        }

        .export-period {
          display:
            inline-block;

          margin-top: 10px;

          padding:
            7px 16px;

          border-radius: 20px;

          background:
            #f4e9df;

          color:
            #6b1f2a;

          font-size: 12px;

          font-weight: 900;
        }

        .export-summary {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap: 12px;

          margin-bottom: 24px;
        }

        .export-summary-card {
          border:
            1px solid
            #e6ddd5;

          border-radius: 12px;

          padding: 15px;

          text-align: center;

          background:
            #fffdfa;
        }

        .export-summary-card span {
          display: block;

          margin-bottom: 8px;

          color:
            #786963;

          font-size: 11px;

          font-weight: 800;
        }

        .export-summary-card strong {
          display: block;

          font-size: 18px;

          font-weight: 900;
        }

        .export-summary-card.income
        strong {
          color:
            #287447;
        }

        .export-summary-card.expense
        strong {
          color:
            #a43434;
        }

        .export-summary-card.net
        strong.positive {
          color:
            #287447;
        }

        .export-summary-card.net
        strong.negative {
          color:
            #a43434;
        }

        .export-summary-card.net
        strong.zero {
          color:
            #6b1f2a;
        }

        .export-section-title {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          margin-bottom: 12px;
        }

        .export-section-title h3 {
          margin: 0;

          color:
            #4b151d;

          font-size: 16px;
        }

        .export-section-title span {
          color:
            #87746c;

          font-size: 10px;
        }

        .export-chart-box {
          padding: 15px;

          margin-bottom: 24px;

          border:
            1px solid
            #e8ddd4;

          border-radius: 12px;

          background:
            #fffdfa;
        }

        .export-chart {
          width: 100%;

          height: 260px;

          direction: ltr;
        }

        .export-table {
          width: 100%;

          border-collapse:
            collapse;

          margin-top: 8px;

          font-size: 11px;
        }

        .export-table th {
          padding: 10px;

          border:
            1px solid
            #dfd1c5;

          background:
            #f2e5d9;

          color:
            #6b1f2a;

          text-align: right;
        }

        .export-table td {
          padding: 10px;

          border:
            1px solid
            #e7ddd5;

          text-align: right;
        }

        .export-table
        .income-value {
          color:
            #287447;

          font-weight: 900;
        }

        .export-table
        .expense-value {
          color:
            #a43434;

          font-weight: 900;
        }

        .export-table
        .net-positive {
          color:
            #287447;

          font-weight: 900;
        }

        .export-table
        .net-negative {
          color:
            #a43434;

          font-weight: 900;
        }

        .export-table
        .net-zero {
          color:
            #6f615b;

          font-weight: 900;
        }

        .export-empty {
          padding: 30px;

          text-align: center;

          color:
            #87756d;

          border:
            1px solid
            #e7ddd5;

          border-radius: 10px;
        }

        .export-footer {
          margin-top: 22px;

          padding-top: 12px;

          border-top:
            1px solid
            #ded2c8;

          display: flex;

          justify-content:
            space-between;

          align-items: center;

          color:
            #87756d;

          font-size: 9px;
        }

        .pdf-break-safe {
          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }

        @media (
          max-width:
          850px
        ) {

          .financial-hero-top {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .financial-cards {
            grid-template-columns:
              1fr;
          }

          .financial-period-box {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .financial-period-box input {
            width: 100%;
          }

          .financial-data-heading,
          .financial-chart-head {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

        }

        @media print {

          @page {
            size:
              A4 portrait;

            margin: 10mm;
          }

          html,
          body {
            background:
              #ffffff !important;
          }

          body * {
            visibility:
              hidden !important;
          }

          .financial-export-document,
          .financial-export-document * {
            visibility:
              visible !important;
          }

          .financial-export-document {
            position:
              absolute !important;

            left:
              0 !important;

            right:
              0 !important;

            top:
              0 !important;

            width:
              100% !important;

            padding:
              0 !important;

            margin:
              0 !important;

            box-shadow:
              none !important;
          }

          .pdf-break-safe,
          .export-summary-card,
          .export-chart-box,
          .export-table tr {
            break-inside:
              avoid !important;

            page-break-inside:
              avoid !important;
          }

        }

      `}</style>

      <section className="financial-hero">

        <div className="financial-hero-top">

          <div>

            <span>
              الدخل والخرج
            </span>

            <h1>
              التقرير المالي
            </h1>

            <p>
              مقارنة الدخل والخرج
              ومتابعة صافي الحركة المالية
            </p>

          </div>

          <div className="financial-actions">

            <button
              type="button"
              className="financial-action-button"
              onClick={
                downloadPDF
              }
              disabled={
                isExporting
              }
            >

              <Download
                size={17}
              />

              {
                isExporting
                  ? 'جاري تجهيز PDF...'
                  : 'تحميل PDF'
              }

            </button>

            <button
              type="button"
              className="financial-action-button"
              onClick={
                printReport
              }
            >

              <Printer
                size={17}
              />

              طباعة

            </button>

          </div>

        </div>

      </section>

      <div className="financial-mode-tabs">

        <button
          type="button"
          className={
            mode ===
            'monthly'
              ? 'active'
              : ''
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
              ? 'active'
              : ''
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

      <section className="financial-period-box">

        <div className="financial-period-title">

          <span>
            {
              mode ===
              'monthly'
                ? 'التقرير الشهري'
                : 'التقرير السنوي'
            }
          </span>

          <h2>
            مقارنة الدخل والخرج
          </h2>

        </div>

        {mode ===
        'monthly' ? (

          <label>

            الشهر

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

          </label>

        ) : (

          <label>

            السنة

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

          </label>

        )}

      </section>

      <div className="financial-cards">

        <div className="financial-card income">

          <div className="financial-card-content">

            <span>
              إجمالي الدخل
            </span>

            <strong>
              {
                formatMoney(
                  currentIncome
                )
              }
              {' '}
              ريال
            </strong>

          </div>

          <div className="financial-card-icon">

            <TrendingUp
              size={22}
            />

          </div>

        </div>

        <div className="financial-card expense">

          <div className="financial-card-content">

            <span>
              إجمالي الخرج
            </span>

            <strong>
              {
                formatMoney(
                  currentExpense
                )
              }
              {' '}
              ريال
            </strong>

          </div>

          <div className="financial-card-icon">

            <TrendingDown
              size={22}
            />

          </div>

        </div>

        <div className="financial-card net">

          <div className="financial-card-content">

            <span>
              الصافي
            </span>

            <strong
              className={
                currentNet > 0
                  ? 'positive'
                  : currentNet < 0
                    ? 'negative'
                    : 'zero'
              }
            >

              {
                formatMoney(
                  currentNet
                )
              }
              {' '}
              ريال

            </strong>

          </div>

          <div className="financial-card-icon">

            <WalletCards
              size={22}
            />

          </div>

        </div>

      </div>

      <section className="financial-data-box">

        <div className="financial-data-heading">

          <div>

            <span>
              {
                mode ===
                'monthly'
                  ? 'تفاصيل الشهر'
                  : 'تفاصيل السنة'
              }
            </span>

            <h3>
              {
                mode ===
                'monthly'
                  ? 'الدخل والخرج حسب اليوم'
                  : 'الدخل والخرج حسب الشهر'
              }
            </h3>

          </div>

          <button
            type="button"
            className={
              showChart
                ? 'financial-chart-button active'
                : 'financial-chart-button'
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

        </div>

        {showChart && (

          <div className="financial-chart-panel">

            <div className="financial-chart-head">

              <div>

                <span>
                  مقارنة بصرية
                </span>

                <h4>
                  {
                    mode ===
                    'monthly'
                      ? 'الدخل والخرج خلال الشهر'
                      : 'الدخل والخرج خلال السنة'
                  }
                </h4>

              </div>

            </div>

            {currentIncome ===
              0 &&
            currentExpense ===
              0 ? (

              <div className="financial-empty">
                لا توجد بيانات
                لعرض الرسم البياني
              </div>

            ) : (

              <div className="financial-chart-area">

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
                      labelFormatter={(
                        label
                      ) =>
                        mode ===
                        'monthly'
                          ? `اليوم ${label}`
                          : String(
                              label
                            )
                      }
                      formatter={(
                        value,
                        name
                      ) => [
                        `${formatMoney(
                          Number(
                            value
                          )
                        )} ريال`,

                        name ===
                        'income'
                          ? 'الدخل'
                          : 'الخرج',
                      ]}
                    />

                    <Legend
                      formatter={(
                        value
                      ) =>
                        value ===
                        'income'
                          ? 'الدخل'
                          : 'الخرج'
                      }
                    />

                    <Bar
                      dataKey="income"
                      name="income"
                      fill="#2E7D4F"
                      radius={[
                        4,
                        4,
                        0,
                        0,
                      ]}
                      maxBarSize={
                        mode ===
                        'monthly'
                          ? 18
                          : 45
                      }
                    />

                    <Bar
                      dataKey="expense"
                      name="expense"
                      fill="#A13D3D"
                      radius={[
                        4,
                        4,
                        0,
                        0,
                      ]}
                      maxBarSize={
                        mode ===
                        'monthly'
                          ? 18
                          : 45
                      }
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            )}

          </div>

        )}

        {mode ===
        'monthly' ? (

          monthlyRows.length ===
          0 ? (

            <div className="financial-empty">
              لا توجد حركات دخل
              أو خرج في هذا الشهر
            </div>

          ) : (

            <div className="financial-table-wrapper">

              <table className="financial-table">

                <thead>

                  <tr>

                    <th>
                      التاريخ
                    </th>

                    <th>
                      الدخل
                    </th>

                    <th>
                      الخرج
                    </th>

                    <th>
                      الصافي
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

                        <td className="financial-date">
                          {
                            formatDate(
                              row.date
                            )
                          }
                        </td>

                        <td className="financial-income">
                          {
                            formatMoney(
                              row.income
                            )
                          }
                          {' '}
                          ريال
                        </td>

                        <td className="financial-expense">
                          {
                            formatMoney(
                              row.expense
                            )
                          }
                          {' '}
                          ريال
                        </td>

                        <td
                          className={
                            row.net > 0
                              ? 'financial-net positive'
                              : row.net < 0
                                ? 'financial-net negative'
                                : 'financial-net zero'
                          }
                        >
                          {
                            formatMoney(
                              row.net
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

        ) : (

          <div className="financial-table-wrapper">

            <table className="financial-table">

              <thead>

                <tr>

                  <th>
                    الشهر
                  </th>

                  <th>
                    الدخل
                  </th>

                  <th>
                    الخرج
                  </th>

                  <th>
                    الصافي
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

                      <td className="financial-date">
                        {
                          row.monthName
                        }
                      </td>

                      <td className="financial-income">
                        {
                          formatMoney(
                            row.income
                          )
                        }
                        {' '}
                        ريال
                      </td>

                      <td className="financial-expense">
                        {
                          formatMoney(
                            row.expense
                          )
                        }
                        {' '}
                        ريال
                      </td>

                      <td
                        className={
                          row.net > 0
                            ? 'financial-net positive'
                            : row.net < 0
                              ? 'financial-net negative'
                              : 'financial-net zero'
                        }
                      >
                        {
                          formatMoney(
                            row.net
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

      <div
        ref={
          exportRef
        }
        className="financial-export-document"
        id="financial-export-document"
      >

        <header
          className="export-header pdf-break-safe"
        >

          <div className="export-logo">
            Y
          </div>

          <h1>
            نظام السامعي للإدارة
          </h1>

          <h2>
            التقرير المالي
          </h2>

          <div className="export-period">
            {
              selectedPeriodTitle
            }
          </div>

        </header>

        <section
          className="export-summary pdf-break-safe"
        >

          <div className="export-summary-card income">

            <span>
              إجمالي الدخل
            </span>

            <strong>
              {
                formatMoney(
                  currentIncome
                )
              }
              {' '}
              ريال
            </strong>

          </div>

          <div className="export-summary-card expense">

            <span>
              إجمالي الخرج
            </span>

            <strong>
              {
                formatMoney(
                  currentExpense
                )
              }
              {' '}
              ريال
            </strong>

          </div>

          <div className="export-summary-card net">

            <span>
              الصافي
            </span>

            <strong
              className={
                currentNet > 0
                  ? 'positive'
                  : currentNet < 0
                    ? 'negative'
                    : 'zero'
              }
            >
              {
                formatMoney(
                  currentNet
                )
              }
              {' '}
              ريال
            </strong>

          </div>

        </section>

        <section
          className="export-chart-box pdf-break-safe"
        >

          <div className="export-section-title">

            <h3>
              مقارنة الدخل والخرج
            </h3>

            <span>
              الأخضر: الدخل
              {' — '}
              الأحمر: الخرج
            </span>

          </div>

          {currentIncome ===
            0 &&
          currentExpense ===
            0 ? (

            <div className="export-empty">
              لا توجد بيانات
              لعرض الرسم البياني
            </div>

          ) : (

            <div className="export-chart">

              <ResponsiveContainer
                width="100%"
                height={260}
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
                          ? 7
                          : 9,
                    }}
                    tickLine={
                      false
                    }
                  />

                  <YAxis
                    tick={{
                      fontSize: 8,
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

                  <Legend
                    formatter={(
                      value
                    ) =>
                      value ===
                      'income'
                        ? 'الدخل'
                        : 'الخرج'
                    }
                  />

                  <Bar
                    dataKey="income"
                    name="income"
                    fill="#2E7D4F"
                    radius={[
                      3,
                      3,
                      0,
                      0,
                    ]}
                    maxBarSize={
                      mode ===
                      'monthly'
                        ? 12
                        : 35
                    }
                  />

                  <Bar
                    dataKey="expense"
                    name="expense"
                    fill="#A13D3D"
                    radius={[
                      3,
                      3,
                      0,
                      0,
                    ]}
                    maxBarSize={
                      mode ===
                      'monthly'
                        ? 12
                        : 35
                    }
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          )}

        </section>

        <section>

          <div
            className="export-section-title pdf-break-safe"
          >

            <h3>
              {
                mode ===
                'monthly'
                  ? 'تفاصيل الأيام'
                  : 'تفاصيل الأشهر'
              }
            </h3>

            <span>
              {
                selectedPeriodTitle
              }
            </span>

          </div>

          {mode ===
          'monthly' ? (

            monthlyRows.length ===
            0 ? (

              <div className="export-empty pdf-break-safe">
                لا توجد حركات دخل
                أو خرج في هذه الفترة
              </div>

            ) : (

              <table className="export-table">

                <thead>

                  <tr
                    className="pdf-break-safe"
                  >

                    <th>
                      التاريخ
                    </th>

                    <th>
                      الدخل
                    </th>

                    <th>
                      الخرج
                    </th>

                    <th>
                      الصافي
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
                        className="pdf-break-safe"
                      >

                        <td>
                          {
                            formatDate(
                              row.date
                            )
                          }
                        </td>

                        <td className="income-value">
                          {
                            formatMoney(
                              row.income
                            )
                          }
                          {' '}
                          ريال
                        </td>

                        <td className="expense-value">
                          {
                            formatMoney(
                              row.expense
                            )
                          }
                          {' '}
                          ريال
                        </td>

                        <td
                          className={
                            row.net > 0
                              ? 'net-positive'
                              : row.net < 0
                                ? 'net-negative'
                                : 'net-zero'
                          }
                        >
                          {
                            formatMoney(
                              row.net
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

            )

          ) : (

            <table className="export-table">

              <thead>

                <tr
                  className="pdf-break-safe"
                >

                  <th>
                    الشهر
                  </th>

                  <th>
                    الدخل
                  </th>

                  <th>
                    الخرج
                  </th>

                  <th>
                    الصافي
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
                      className="pdf-break-safe"
                    >

                      <td>
                        {
                          row.monthName
                        }
                      </td>

                      <td className="income-value">
                        {
                          formatMoney(
                            row.income
                          )
                        }
                        {' '}
                        ريال
                      </td>

                      <td className="expense-value">
                        {
                          formatMoney(
                            row.expense
                          )
                        }
                        {' '}
                        ريال
                      </td>

                      <td
                        className={
                          row.net > 0
                            ? 'net-positive'
                            : row.net < 0
                              ? 'net-negative'
                              : 'net-zero'
                        }
                      >
                        {
                          formatMoney(
                            row.net
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

          )}

        </section>

        <footer
          className="export-footer pdf-break-safe"
        >

          <span>
            نظام السامعي للإدارة
          </span>

          <span>
            تاريخ إصدار التقرير:
            {' '}
            {
              getIssueDate()
            }
          </span>

        </footer>

      </div>

    </div>
  )
}

export default FinancialReport