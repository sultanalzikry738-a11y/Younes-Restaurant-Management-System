
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  Banknote,
  CalendarDays,
  CircleDollarSign,
  Eye,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react'

import './Workers.css'

type Worker = {
  id: number
  name: string
  salary: string
}

type AbsenceType = '' | 'half' | 'full'

type DailyRecord = {
  workerId: number
  date: string
  dailyDraw: string
  absence: AbsenceType
  cashDraw: string
}

type ExpenseRecord = {
  id: number
  date: string
  itemName: string
  amount: string
  note: string
  source?: string
}

type EditingRow = {
  dailyDraw: string
  absence: AbsenceType
  cashDraw: string
}

type ActiveTab = 'workers' | 'draws' | 'summary'

type WorkerSummary = {
  worker: Worker
  salary: number
  dailyDrawTotal: number
  cashDrawTotal: number
  entitlements: number
  fullDays: number
  halfDays: number
  totalAbsence: number
  absenceDeduction: number
  remaining: number
}

const WORKERS_STORAGE_KEY = 'younes_workers'
const WORKER_DRAWS_STORAGE_KEY = 'younes_worker_draws'
const EXPENSE_RECORDS_STORAGE_KEY = 'younes_expense_records'
const WORKERS_DRAWS_EXPENSE_SOURCE = 'workers_draws'

function loadWorkers(): Worker[] {
  try {
    const saved = localStorage.getItem(WORKERS_STORAGE_KEY)
    if (!saved) return []

    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadDailyRecords(): DailyRecord[] {
  try {
    const saved = localStorage.getItem(WORKER_DRAWS_STORAGE_KEY)
    if (!saved) return []

    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadExpenseRecords(): ExpenseRecord[] {
  try {
    const saved = localStorage.getItem(EXPENSE_RECORDS_STORAGE_KEY)
    if (!saved) return []

    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function syncWorkerDrawsToExpenses(
  date: string,
  total: number
) {
  const expenseRecords = loadExpenseRecords()

  const recordsWithoutCurrentDay = expenseRecords.filter(
    (record) =>
      !(
        record.date === date &&
        (
          record.source === WORKERS_DRAWS_EXPENSE_SOURCE ||
          (
            record.itemName === 'سحبيات العمال' &&
            (
              record.note === 'مسجلة تلقائيًا من قسم العمال' ||
              record.note === 'مجمعة من سحبيات العمال اليومية'
            )
          )
        )
      )
  )

  const updatedRecords: ExpenseRecord[] =
    total > 0
      ? [
          ...recordsWithoutCurrentDay,
          {
            id: Date.now(),
            date,
            itemName: 'سحبيات العمال',
            amount: String(total),
            note: 'مجمعة من سحبيات العمال اليومية',
            source: WORKERS_DRAWS_EXPENSE_SOURCE,
          },
        ]
      : recordsWithoutCurrentDay

  localStorage.setItem(
    EXPENSE_RECORDS_STORAGE_KEY,
    JSON.stringify(updatedRecords)
  )
}

function getTodayDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getCurrentMonth() {
  return getTodayDate().slice(0, 7)
}

// حساب عدد أيام الشهر الفعلية، مع دعم السنوات الكبيسة
function getDaysInMonth(monthValue: string) {
  const [year, month] = monthValue.split('-').map(Number)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    year < 1 ||
    month < 1 ||
    month > 12
  ) {
    return 30
  }

  return new Date(year, month, 0).getDate()
}

function normalizeDigits(value: string) {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹'

  return value
    .replace(/[٠-٩]/g, (digit) =>
      String(arabicDigits.indexOf(digit))
    )
    .replace(/[۰-۹]/g, (digit) =>
      String(persianDigits.indexOf(digit))
    )
}

function cleanMoneyValue(value: string) {
  return normalizeDigits(value)
    .replace(/,/g, '')
    .replace(/[^\d]/g, '')
}

function formatMoneyInput(value: string) {
  if (!value) return ''

  const clean = cleanMoneyValue(value)
  if (!clean) return ''

  return Number(clean).toLocaleString('en-US')
}

function formatMoney(value: string | number) {
  return (Number(value) || 0).toLocaleString('en-US')
}

function formatAbsenceType(absence: AbsenceType) {
  if (absence === 'full') return 'يوم كامل'
  if (absence === 'half') return 'نصف يوم'
  return '—'
}

function Workers() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('workers')
  const [workers, setWorkers] = useState<Worker[]>(loadWorkers)
  const [dailyRecords, setDailyRecords] =
    useState<DailyRecord[]>(loadDailyRecords)

  const [selectedDate, setSelectedDate] =
    useState(getTodayDate())

  const [searchText, setSearchText] = useState('')
  const [summaryMonth, setSummaryMonth] =
    useState(getCurrentMonth())

  const [summarySearch, setSummarySearch] = useState('')

  const [editingRows, setEditingRows] = useState<
    Record<number, EditingRow>
  >({})

  const [showModal, setShowModal] = useState(false)
  const [editingWorker, setEditingWorker] =
    useState<Worker | null>(null)

  const [workerName, setWorkerName] = useState('')
  const [workerSalary, setWorkerSalary] = useState('')

  // العامل الذي نعرض تفاصيله
  const [detailsWorkerId, setDetailsWorkerId] =
    useState<number | null>(null)

  const daysInSelectedMonth = useMemo(
    () => getDaysInMonth(summaryMonth),
    [summaryMonth]
  )

  function saveWorkers(newWorkers: Worker[]) {
    setWorkers(newWorkers)

    localStorage.setItem(
      WORKERS_STORAGE_KEY,
      JSON.stringify(newWorkers)
    )
  }

  function saveWorkerRecords(newRecords: DailyRecord[]) {
    setDailyRecords(newRecords)

    localStorage.setItem(
      WORKER_DRAWS_STORAGE_KEY,
      JSON.stringify(newRecords)
    )
  }

  const filteredWorkers = useMemo(() => {
    const search = searchText.trim().toLowerCase()

    if (!search) return workers

    return workers.filter((worker) =>
      worker.name.toLowerCase().includes(search)
    )
  }, [workers, searchText])

  // الملخص الشهري باستخدام أيام الشهر الحقيقية
  const monthlySummary = useMemo<WorkerSummary[]>(() => {
    return workers.map((worker) => {
      const salary = Number(worker.salary) || 0

      const workerRecords = dailyRecords.filter(
        (record) =>
          record.workerId === worker.id &&
          record.date.startsWith(`${summaryMonth}-`)
      )

      let dailyDrawTotal = 0
      let cashDrawTotal = 0
      let fullDays = 0
      let halfDays = 0

      workerRecords.forEach((record) => {
        dailyDrawTotal += Number(record.dailyDraw) || 0
        cashDrawTotal += Number(record.cashDraw) || 0

        if (record.absence === 'full') {
          fullDays += 1
        }

        if (record.absence === 'half') {
          halfDays += 1
        }
      })

      const totalAbsence = fullDays + halfDays * 0.5

      const dayValue = salary / daysInSelectedMonth

      const absenceDeduction = Math.round(
        dayValue * totalAbsence
      )

      const entitlements = dailyDrawTotal + cashDrawTotal

      const remaining =
        salary - entitlements - absenceDeduction

      return {
        worker,
        salary,
        dailyDrawTotal,
        cashDrawTotal,
        entitlements,
        fullDays,
        halfDays,
        totalAbsence,
        absenceDeduction,
        remaining,
      }
    })
  }, [
    workers,
    dailyRecords,
    summaryMonth,
    daysInSelectedMonth,
  ])

  const filteredSummary = useMemo(() => {
    const search = summarySearch.trim().toLowerCase()

    if (!search) return monthlySummary

    return monthlySummary.filter((item) =>
      item.worker.name.toLowerCase().includes(search)
    )
  }, [monthlySummary, summarySearch])

  const summaryTotals = useMemo(() => {
    return monthlySummary.reduce(
      (total, item) => ({
        salaries: total.salaries + item.salary,
        entitlements:
          total.entitlements + item.entitlements,
        deductions:
          total.deductions + item.absenceDeduction,
        remaining: total.remaining + item.remaining,
      }),
      {
        salaries: 0,
        entitlements: 0,
        deductions: 0,
        remaining: 0,
      }
    )
  }, [monthlySummary])

  // تفاصيل العامل للشهر المختار فقط
  const detailsSummary = monthlySummary.find(
    (item) => item.worker.id === detailsWorkerId
  )

  const detailsRecords = useMemo(() => {
    if (detailsWorkerId === null) return []

    return dailyRecords
      .filter(
        (record) =>
          record.workerId === detailsWorkerId &&
          record.date.startsWith(`${summaryMonth}-`)
      )
      .filter(
        (record) =>
          (Number(record.dailyDraw) || 0) > 0 ||
          (Number(record.cashDraw) || 0) > 0 ||
          record.absence !== ''
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [dailyRecords, detailsWorkerId, summaryMonth])

  function openAddWorker() {
    setEditingWorker(null)
    setWorkerName('')
    setWorkerSalary('')
    setShowModal(true)
  }

  function openEditWorker(worker: Worker) {
    setEditingWorker(worker)
    setWorkerName(worker.name)
    setWorkerSalary(worker.salary)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingWorker(null)
    setWorkerName('')
    setWorkerSalary('')
  }

  function saveWorker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanName = workerName.trim()
    const cleanSalary = cleanMoneyValue(workerSalary)

    if (!cleanName) {
      alert('اكتب اسم العامل.')
      return
    }

    if (!cleanSalary) {
      alert('اكتب راتب العامل.')
      return
    }

    if (editingWorker) {
      const updatedWorkers = workers.map((worker) =>
        worker.id === editingWorker.id
          ? {
              ...worker,
              name: cleanName,
              salary: cleanSalary,
            }
          : worker
      )

      saveWorkers(updatedWorkers)
    } else {
      const newWorker: Worker = {
        id: Date.now(),
        name: cleanName,
        salary: cleanSalary,
      }

      saveWorkers([...workers, newWorker])
    }

    closeModal()
  }

  function deleteWorker(worker: Worker) {
    const accepted = window.confirm(
      `هل تريد حذف العامل "${worker.name}"؟`
    )

    if (!accepted) return

    const workerOldRecords = dailyRecords.filter(
      (record) => record.workerId === worker.id
    )

    const affectedDates = Array.from(
      new Set(workerOldRecords.map((record) => record.date))
    )

    const updatedWorkers = workers.filter(
      (current) => current.id !== worker.id
    )

    const updatedDailyRecords = dailyRecords.filter(
      (record) => record.workerId !== worker.id
    )

    saveWorkers(updatedWorkers)
    saveWorkerRecords(updatedDailyRecords)

    affectedDates.forEach((date) => {
      const dateTotal = updatedDailyRecords
        .filter((record) => record.date === date)
        .reduce(
          (total, record) =>
            total +
            (Number(record.dailyDraw) || 0) +
            (Number(record.cashDraw) || 0),
          0
        )

      syncWorkerDrawsToExpenses(date, dateTotal)
    })

    setEditingRows((current) => {
      const copy = { ...current }
      delete copy[worker.id]
      return copy
    })

    if (detailsWorkerId === worker.id) {
      setDetailsWorkerId(null)
    }
  }

  function getSavedRow(workerId: number) {
    return dailyRecords.find(
      (record) =>
        record.workerId === workerId &&
        record.date === selectedDate
    )
  }

  function getRow(workerId: number): EditingRow {
    const editing = editingRows[workerId]

    if (editing) return editing

    const saved = getSavedRow(workerId)

    return {
      dailyDraw: saved?.dailyDraw || '',
      absence: saved?.absence || '',
      cashDraw: saved?.cashDraw || '',
    }
  }

  function updateRow(
    workerId: number,
    field: keyof EditingRow,
    value: string
  ) {
    const current = getRow(workerId)

    let finalValue = value

    if (field === 'dailyDraw' || field === 'cashDraw') {
      finalValue = cleanMoneyValue(value)
    }

    setEditingRows((previous) => ({
      ...previous,
      [workerId]: {
        ...current,
        [field]: finalValue,
      },
    }))
  }

  function changeDate(value: string) {
    setSelectedDate(value)
    setEditingRows({})
  }

  function saveDailyDraws() {
    if (!selectedDate) {
      alert('اختر التاريخ.')
      return
    }

    const newRecords: DailyRecord[] = workers
      .map((worker) => {
        const row = getRow(worker.id)

        return {
          workerId: worker.id,
          date: selectedDate,
          dailyDraw: row.dailyDraw,
          absence: row.absence,
          cashDraw: row.cashDraw,
        }
      })
      .filter(
        (record) =>
          record.dailyDraw !== '' ||
          record.absence !== '' ||
          record.cashDraw !== ''
      )

    const updatedDailyRecords = [
      ...dailyRecords.filter(
        (record) => record.date !== selectedDate
      ),
      ...newRecords,
    ]

    const workersDrawsTotal = newRecords.reduce(
      (total, record) =>
        total +
        (Number(record.dailyDraw) || 0) +
        (Number(record.cashDraw) || 0),
      0
    )

    saveWorkerRecords(updatedDailyRecords)

    syncWorkerDrawsToExpenses(
      selectedDate,
      workersDrawsTotal
    )

    setEditingRows({})

    alert('تم حفظ سحبيات العمال وربطها تلقائيًا بالخرج.')
  }

  const selectedDayTotal = workers.reduce(
    (total, worker) => {
      const row = getRow(worker.id)

      return (
        total +
        (Number(row.dailyDraw) || 0) +
        (Number(row.cashDraw) || 0)
      )
    },
    0
  )

  function formatAbsence(
    fullDays: number,
    halfDays: number
  ) {
    if (fullDays === 0 && halfDays === 0) return '—'

    const parts: string[] = []

    if (fullDays > 0) {
      parts.push(`${fullDays} يوم`)
    }

    if (halfDays > 0) {
      parts.push(`${halfDays} نصف يوم`)
    }

    return parts.join(' + ')
  }

  return (
    <div className="workers-page" dir="rtl">
      <style>{`
        .workers-simple-tabs {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          flex-wrap: wrap;
          padding-bottom: 22px;
          border-bottom: 1px solid #eadfd4;
        }

        .workers-simple-tab {
          min-height: 46px;
          min-width: 145px;
          width: auto;
          padding: 0 18px;
          border: 1px solid #e3d5c7;
          border-radius: 12px;
          background: #f8f1e8;
          color: #6f615b;
          font-family: inherit;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .workers-simple-tab.active {
          background: #7a1f2b;
          color: white;
          border-color: #7a1f2b;
        }

        .worker-salary-value {
          color: #641923;
          font-weight: 900;
          white-space: nowrap;
        }

        .draws-page,
        .workers-summary-page {
          margin-top: 26px;
        }

        .draws-header,
        .workers-summary-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 20px;
        }

        .draws-header span,
        .workers-summary-header > div:first-child > span {
          color: #8a3542;
          font-size: 10px;
          font-weight: 900;
        }

        .draws-header h2,
        .workers-summary-header h2 {
          margin: 4px 0 0;
          color: #4b151d;
          font-size: 24px;
        }

        .draws-controls,
        .workers-summary-controls {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
        }

        .draws-field,
        .summary-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #685b55;
          font-size: 10px;
          font-weight: 800;
        }

        .draws-field input,
        .summary-field input {
          height: 44px;
          min-width: 190px;
          border: 1px solid #dfd2c5;
          border-radius: 10px;
          background: #faf7f1;
          color: #4b151d;
          padding: 0 12px;
          outline: none;
          font-family: inherit;
          box-sizing: border-box;
        }

        .draws-search,
        .summary-search {
          position: relative;
        }

        .draws-search svg,
        .summary-search svg {
          position: absolute;
          right: 12px;
          bottom: 13px;
          color: #907f77;
        }

        .draws-search input,
        .summary-search input {
          padding-right: 38px;
        }

        .draws-total {
          margin-bottom: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 14px 16px;
          border: 1px solid #dfd2c5;
          border-radius: 12px;
          background: #f5eadf;
        }

        .draws-total span {
          color: #7d6b63;
          font-size: 10px;
          font-weight: 800;
        }

        .draws-total strong {
          color: #641923;
          font-size: 17px;
        }

        .draws-table-wrapper,
        .workers-summary-table-wrapper {
          overflow-x: auto;
          border: 1px solid #e1d5c8;
          border-radius: 14px;
          background: white;
        }

        .draws-table,
        .workers-summary-table {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
        }

        .draws-table thead,
        .workers-summary-table thead {
          background: #f2e6da;
        }

        .draws-table th,
        .workers-summary-table th {
          color: #6b1f2a;
          font-size: 10px;
          font-weight: 900;
          text-align: right;
          padding: 13px 14px;
          border-bottom: 1px solid #e6d9cc;
        }

        .draws-table td,
        .workers-summary-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #eee4da;
          vertical-align: middle;
        }

        .draws-table tbody tr:last-child td,
        .workers-summary-table tbody tr:last-child td {
          border-bottom: none;
        }

        .draw-worker-name,
        .summary-worker-name {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #4b151d;
        }

        .draw-worker-avatar,
        .summary-worker-avatar {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #f4e8dc;
          color: #7a1f2b;
          flex-shrink: 0;
        }

        .draw-money-input {
          position: relative;
          min-width: 170px;
        }

        .draw-money-input input {
          width: 100%;
          height: 44px;
          box-sizing: border-box;
          border: 1px solid #dfd2c5;
          border-radius: 9px;
          background: #faf7f1;
          outline: none;
          padding: 0 12px 0 48px;
          font-family: inherit;
          color: #4b151d;
        }

        .draw-money-input span {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #91827b;
          font-size: 9px;
        }

        .draw-absence-select {
          width: 100%;
          min-width: 145px;
          height: 44px;
          border: 1px solid #dfd2c5;
          border-radius: 9px;
          background: #faf7f1;
          color: #4b151d;
          padding: 0 10px;
          outline: none;
          font-family: inherit;
        }

        .draws-empty,
        .workers-summary-empty {
          padding: 45px 20px;
          text-align: center;
          color: #8a7870;
          font-weight: 800;
        }

        .draws-footer {
          margin-top: 18px;
          display: flex;
          justify-content: flex-start;
        }

        .save-draws-button {
          min-height: 46px;
          border: none;
          border-radius: 11px;
          background: #7a1f2b;
          color: white;
          padding: 0 22px;
          font-family: inherit;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .worker-form .worker-salary-field {
          margin-top: 14px;
        }

        .worker-salary-input {
          position: relative;
        }

        .worker-salary-input input {
          padding-left: 55px !important;
        }

        .worker-salary-input span {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #8f817a;
          font-size: 10px;
          pointer-events: none;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .summary-card {
          border: 1px solid #e1d5c8;
          border-radius: 13px;
          background: #fffdf9;
          padding: 15px;
        }

        .summary-card span {
          display: block;
          color: #81716a;
          font-size: 9px;
          font-weight: 800;
          margin-bottom: 7px;
        }

        .summary-card strong {
          color: #5d1822;
          font-size: 17px;
          font-weight: 900;
        }

        .summary-money {
          color: #5d1822;
          font-weight: 900;
          white-space: nowrap;
        }

        .summary-absence {
          color: #6d5e58;
          font-weight: 800;
          white-space: nowrap;
        }

        .summary-deduction {
          color: #9b3b3b;
          font-weight: 900;
          white-space: nowrap;
        }

        .summary-remaining {
          color: #4b151d;
          font-weight: 900;
          white-space: nowrap;
        }

        .summary-remaining.negative {
          color: #b03030;
        }

        .summary-rule-note {
          margin-top: 13px;
          padding: 11px 13px;
          border-radius: 10px;
          background: #f8f0e7;
          color: #806e65;
          font-size: 9px;
          line-height: 1.8;
        }

        /* زر تفاصيل العامل */
        .worker-details-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 36px;
          padding: 0 13px;
          border: 1px solid var(--theme-main);
          border-radius: 9px;
          background: var(--theme-soft-2);
          color: var(--theme-main);
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .worker-details-button:hover {
          background: var(--theme-soft);
        }

        /* نافذة تفاصيل العامل */
        .worker-details-modal {
          width: min(850px, calc(100vw - 36px));
          max-width: 850px;
          max-height: 88vh;
          overflow-y: auto;
          box-sizing: border-box;
        }

        .worker-details-month {
          margin: 16px 0;
          color: var(--theme-main);
          font-size: 13px;
          font-weight: 800;
        }

        .worker-details-cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin: 17px 0;
        }

        .worker-details-card {
          padding: 13px;
          border: 1px solid #e1d5c8;
          border-radius: 11px;
          background: #fffdf9;
          min-width: 0;
        }

        .worker-details-card span {
          display: block;
          font-size: 11px;
          color: #81716a;
          margin-bottom: 7px;
          font-weight: 700;
        }

        .worker-details-card strong {
          color: var(--theme-dark);
          font-size: 16px;
          font-weight: 900;
          overflow-wrap: anywhere;
        }

        .worker-details-title {
          margin: 22px 0 12px;
          color: var(--theme-dark);
          font-size: 17px;
        }

        .worker-details-table-wrapper {
          overflow-x: auto;
          border: 1px solid #e1d5c8;
          border-radius: 12px;
        }

        .worker-details-table {
          width: 100%;
          min-width: 590px;
          border-collapse: collapse;
        }

        .worker-details-table th {
          padding: 13px;
          text-align: right;
          background: var(--theme-soft);
          color: var(--theme-main);
          font-size: 12px;
        }

        .worker-details-table td {
          padding: 13px;
          border-top: 1px solid #eee4da;
          font-size: 12px;
          color: #534b48;
        }

        .worker-details-absence {
          color: #b03030 !important;
          font-weight: 900;
        }

        .worker-details-empty {
          padding: 28px;
          text-align: center;
          color: #81716a;
          font-size: 13px;
        }

        .worker-details-note {
          margin-top: 15px;
          padding: 12px;
          border-radius: 10px;
          background: var(--theme-soft-2);
          color: #685b55;
          font-size: 12px;
          line-height: 1.9;
        }

        @media (max-width: 900px) {
          .summary-cards {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 850px) {
          .draws-header,
          .workers-summary-header {
            flex-direction: column;
            align-items: stretch;
          }

          .draws-controls,
          .workers-summary-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .draws-field input,
          .summary-field input {
            width: 100%;
            min-width: 0;
          }
        }

        @media (max-width: 600px) {
          .workers-simple-tab {
            min-width: 130px;
          }

          .summary-cards {
            grid-template-columns: 1fr;
          }

          .worker-details-cards {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        /* الثيم الديناميكي للمطعم والكافتيريا */

        .workers-page .workers-eyebrow,
        .workers-page .workers-section-header span,
        .workers-page .draws-header span,
        .workers-page
        .workers-summary-header > div:first-child > span,
        .workers-page .worker-modal-header span {
          color: var(--theme-main) !important;
        }

        .workers-page .workers-header h1,
        .workers-page .workers-section-header h2,
        .workers-page .draws-header h2,
        .workers-page .workers-summary-header h2,
        .workers-page .worker-modal-header h2,
        .workers-page .worker-name strong,
        .workers-page .draw-worker-name,
        .workers-page .summary-worker-name,
        .workers-page .worker-salary-value,
        .workers-page .draws-total strong,
        .workers-page .summary-card strong,
        .workers-page .summary-money,
        .workers-page .summary-remaining {
          color: var(--theme-dark) !important;
        }

        .workers-page .workers-simple-tab.active,
        .workers-page .add-worker-button,
        .workers-page .workers-empty > button,
        .workers-page .save-draws-button,
        .workers-page .save-worker-button {
          background: var(--theme-main) !important;
          border-color: var(--theme-main) !important;
          color: #ffffff !important;
          box-shadow:
            0 8px 20px var(--theme-shadow) !important;
        }

        .workers-page
        .workers-simple-tab:not(.active) {
          background: var(--theme-soft-2) !important;
        }

        .workers-page
        .workers-simple-tab:not(.active):hover {
          border-color: var(--theme-main) !important;
          color: var(--theme-main) !important;
        }

        .workers-page .workers-empty-icon,
        .workers-page .worker-avatar,
        .workers-page .draw-worker-avatar,
        .workers-page .summary-worker-avatar {
          background: var(--theme-soft) !important;
          color: var(--theme-main) !important;
        }

        .workers-page .workers-empty h3 {
          color: var(--theme-dark) !important;
        }

        .workers-page .workers-table thead,
        .workers-page .draws-table thead,
        .workers-page .workers-summary-table thead {
          background: var(--theme-soft) !important;
        }

        .workers-page .workers-table th,
        .workers-page .draws-table th,
        .workers-page .workers-summary-table th {
          color: var(--theme-main) !important;
        }

        .workers-page .worker-number {
          color: var(--theme-main) !important;
        }

        .workers-page .worker-edit {
          color: var(--theme-main) !important;
          border-color: var(--theme-main) !important;
        }

        .workers-page .worker-edit:hover {
          background: var(--theme-soft) !important;
        }

        .workers-page .draws-total {
          background: var(--theme-soft-3) !important;
          border-color: var(--theme-soft) !important;
        }

        .workers-page .draws-field input,
        .workers-page .summary-field input,
        .workers-page .draw-money-input input,
        .workers-page .draw-absence-select,
        .workers-page .worker-form input {
          background: var(--theme-soft-2) !important;
          color: var(--theme-dark) !important;
        }

        .workers-page .draws-field input:focus,
        .workers-page .summary-field input:focus,
        .workers-page .draw-money-input input:focus,
        .workers-page .draw-absence-select:focus,
        .workers-page .worker-form input:focus {
          border-color: var(--theme-main) !important;
          box-shadow:
            0 0 0 3px var(--theme-soft) !important;
        }

        .workers-page .summary-card {
          border-color: var(--theme-soft) !important;
        }

        .workers-page .summary-rule-note {
          background: var(--theme-soft-2) !important;
        }

        .workers-page .worker-modal-header {
          border-bottom-color: var(--theme-soft) !important;
        }

        .workers-page .worker-modal-header > button {
          color: var(--theme-main) !important;
        }

        .workers-page .worker-modal-header > button:hover {
          background: var(--theme-soft) !important;
        }

        /* الأحمر للأشياء الخطرة فقط */
        .workers-page .worker-delete,
        .workers-page .summary-deduction,
        .workers-page .summary-remaining.negative {
          color: #b03030 !important;
        }
      `}</style>

      <header className="workers-header">
        <div>
          <span className="workers-eyebrow">
            إدارة العمال
          </span>
          <h1>العمال</h1>
        </div>
      </header>

      <section className="workers-panel">
        <div className="workers-simple-tabs">
          <button
            className={
              activeTab === 'workers'
                ? 'workers-simple-tab active'
                : 'workers-simple-tab'
            }
            onClick={() => setActiveTab('workers')}
          >
            <Users size={18} />
            العمال
          </button>

          <button
            className={
              activeTab === 'draws'
                ? 'workers-simple-tab active'
                : 'workers-simple-tab'
            }
            onClick={() => {
              setActiveTab('draws')
              setSelectedDate(getTodayDate())
              setEditingRows({})
            }}
          >
            <CalendarDays size={18} />
            سحبيات العمال
          </button>

          <button
            className={
              activeTab === 'summary'
                ? 'workers-simple-tab active'
                : 'workers-simple-tab'
            }
            onClick={() => setActiveTab('summary')}
          >
            <CircleDollarSign size={18} />
            ملخص العمال
          </button>
        </div>

        {activeTab === 'workers' && (
          <>
            <div className="workers-section-header">
              <div>
                <span>قائمة العمال</span>
                <h2>العمال</h2>
              </div>

              <button
                className="add-worker-button"
                onClick={openAddWorker}
              >
                <Plus size={18} />
                إضافة عامل
              </button>
            </div>

            {workers.length === 0 ? (
              <div className="workers-empty">
                <div className="workers-empty-icon">
                  <UserRound size={27} />
                </div>

                <h3>لا يوجد عمال مسجلون</h3>

                <button onClick={openAddWorker}>
                  <Plus size={17} />
                  إضافة عامل
                </button>
              </div>
            ) : (
              <div className="workers-table-wrapper">
                <table className="workers-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>اسم العامل</th>
                      <th>الراتب</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {workers.map((worker, index) => (
                      <tr key={worker.id}>
                        <td className="worker-number">
                          {index + 1}
                        </td>

                        <td>
                          <div className="worker-name">
                            <div className="worker-avatar">
                              <UserRound size={18} />
                            </div>
                            <strong>{worker.name}</strong>
                          </div>
                        </td>

                        <td>
                          <div className="worker-salary-value">
                            <Banknote
                              size={15}
                              style={{
                                marginLeft: 6,
                                verticalAlign: 'middle',
                              }}
                            />
                            {formatMoney(worker.salary)} ريال
                          </div>
                        </td>

                        <td>
                          <div className="worker-actions">
                            <button
                              className="worker-edit"
                              onClick={() =>
                                openEditWorker(worker)
                              }
                            >
                              <Pencil size={15} />
                              تعديل
                            </button>

                            <button
                              className="worker-delete"
                              onClick={() =>
                                deleteWorker(worker)
                              }
                            >
                              <Trash2 size={15} />
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'draws' && (
          <div className="draws-page">
            <div className="draws-header">
              <div>
                <span>حركة العمال اليومية</span>
                <h2>سحبيات العمال</h2>
              </div>

              <div className="draws-controls">
                <label className="draws-field">
                  التاريخ
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) =>
                      changeDate(event.target.value)
                    }
                  />
                </label>

                <label className="draws-field draws-search">
                  بحث باسم العامل
                  <Search size={17} />
                  <input
                    type="text"
                    placeholder="اكتب اسم العامل"
                    value={searchText}
                    onChange={(event) =>
                      setSearchText(event.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="draws-total">
              <span>
                إجمالي السحبيات النقدية لهذا اليوم
              </span>
              <strong>
                {formatMoney(selectedDayTotal)} ريال
              </strong>
            </div>

            {workers.length === 0 ? (
              <div className="draws-empty">
                أضف العمال أولًا من تبويب العمال.
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="draws-empty">
                لا يوجد عامل بهذا الاسم.
              </div>
            ) : (
              <div className="draws-table-wrapper">
                <table className="draws-table">
                  <thead>
                    <tr>
                      <th>العامل</th>
                      <th>السحب اليومي</th>
                      <th>الغياب</th>
                      <th>السحب النقدي</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredWorkers.map((worker) => {
                      const row = getRow(worker.id)

                      return (
                        <tr key={worker.id}>
                          <td>
                            <div className="draw-worker-name">
                              <div className="draw-worker-avatar">
                                <UserRound size={17} />
                              </div>
                              <strong>{worker.name}</strong>
                            </div>
                          </td>

                          <td>
                            <div className="draw-money-input">
                              <input
                                type="text"
                                inputMode="numeric"
                                dir="ltr"
                                placeholder="0"
                                value={formatMoneyInput(
                                  row.dailyDraw
                                )}
                                onChange={(event) =>
                                  updateRow(
                                    worker.id,
                                    'dailyDraw',
                                    event.target.value
                                  )
                                }
                              />
                              <span>ريال</span>
                            </div>
                          </td>

                          <td>
                            <select
                              className="draw-absence-select"
                              value={row.absence}
                              onChange={(event) =>
                                updateRow(
                                  worker.id,
                                  'absence',
                                  event.target.value
                                )
                              }
                            >
                              <option value="">—</option>
                              <option value="half">
                                نصف يوم
                              </option>
                              <option value="full">
                                يوم
                              </option>
                            </select>
                          </td>

                          <td>
                            <div className="draw-money-input">
                              <input
                                type="text"
                                inputMode="numeric"
                                dir="ltr"
                                placeholder="0"
                                value={formatMoneyInput(
                                  row.cashDraw
                                )}
                                onChange={(event) =>
                                  updateRow(
                                    worker.id,
                                    'cashDraw',
                                    event.target.value
                                  )
                                }
                              />
                              <span>ريال</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {workers.length > 0 && (
              <div className="draws-footer">
                <button
                  className="save-draws-button"
                  onClick={saveDailyDraws}
                >
                  <Save size={18} />
                  حفظ سحبيات اليوم
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="workers-summary-page">
            <div className="workers-summary-header">
              <div>
                <span>الحساب الشهري</span>
                <h2>ملخص العمال</h2>
              </div>

              <div className="workers-summary-controls">
                <label className="summary-field">
                  الشهر
                  <input
                    type="month"
                    value={summaryMonth}
                    onChange={(event) =>
                      setSummaryMonth(event.target.value)
                    }
                  />
                </label>

                <label className="summary-field summary-search">
                  بحث باسم العامل
                  <Search size={17} />
                  <input
                    type="text"
                    placeholder="اكتب اسم العامل"
                    value={summarySearch}
                    onChange={(event) =>
                      setSummarySearch(event.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="summary-cards">
              <div className="summary-card">
                <span>إجمالي الرواتب</span>
                <strong>
                  {formatMoney(summaryTotals.salaries)} ريال
                </strong>
              </div>

              <div className="summary-card">
                <span>إجمالي المستحقات</span>
                <strong>
                  {formatMoney(summaryTotals.entitlements)} ريال
                </strong>
              </div>

              <div className="summary-card">
                <span>إجمالي خصم الغياب</span>
                <strong>
                  {formatMoney(summaryTotals.deductions)} ريال
                </strong>
              </div>

              <div className="summary-card">
                <span>إجمالي المستحق</span>
                <strong>
                  {formatMoney(summaryTotals.remaining)} ريال
                </strong>
              </div>
            </div>

            {workers.length === 0 ? (
              <div className="workers-summary-empty">
                لا يوجد عمال مسجلون.
              </div>
            ) : filteredSummary.length === 0 ? (
              <div className="workers-summary-empty">
                لا يوجد عامل بهذا الاسم.
              </div>
            ) : (
              <div className="workers-summary-table-wrapper">
                <table className="workers-summary-table">
                  <thead>
                    <tr>
                      <th>اسم العامل</th>
                      <th>الراتب</th>
                      <th>المستحقات</th>
                      <th>الغياب</th>
                      <th>خصم الغياب</th>
                      <th>المستحق</th>
                      <th>التفاصيل</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSummary.map((item) => (
                      <tr key={item.worker.id}>
                        <td>
                          <div className="summary-worker-name">
                            <div className="summary-worker-avatar">
                              <UserRound size={17} />
                            </div>
                            <strong>{item.worker.name}</strong>
                          </div>
                        </td>

                        <td className="summary-money">
                          {formatMoney(item.salary)} ريال
                        </td>

                        <td className="summary-money">
                          {formatMoney(item.entitlements)} ريال
                        </td>

                        <td className="summary-absence">
                          {formatAbsence(
                            item.fullDays,
                            item.halfDays
                          )}
                        </td>

                        <td className="summary-deduction">
                          {formatMoney(
                            item.absenceDeduction
                          )} ريال
                        </td>

                        <td
                          className={
                            item.remaining < 0
                              ? 'summary-remaining negative'
                              : 'summary-remaining'
                          }
                        >
                          {formatMoney(item.remaining)} ريال
                        </td>

                        <td>
                          <button
                            type="button"
                            className="worker-details-button"
                            onClick={() =>
                              setDetailsWorkerId(
                                item.worker.id
                              )
                            }
                          >
                            <Eye size={15} />
                            التفاصيل
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="summary-rule-note">
              قاعدة خصم الغياب: قيمة اليوم = الراتب
              الشهري ÷ عدد أيام الشهر الفعلية
              ({daysInSelectedMonth} يومًا).
              نصف اليوم = نصف قيمة اليوم.
              تُقرّب قيمة الخصم الإجمالية لأقرب ريال.
            </div>
          </div>
        )}
      </section>

      {/* نافذة إضافة أو تعديل العامل */}
      {showModal && (
        <div
          className="worker-modal-backdrop"
          onMouseDown={closeModal}
        >
          <div
            className="worker-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="worker-modal-header">
              <div>
                <span>العمال</span>
                <h2>
                  {editingWorker
                    ? 'تعديل العامل'
                    : 'إضافة عامل'}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="worker-form"
              onSubmit={saveWorker}
            >
              <label>
                اسم العامل
                <input
                  type="text"
                  placeholder="اكتب اسم العامل"
                  value={workerName}
                  onChange={(event) =>
                    setWorkerName(event.target.value)
                  }
                  autoFocus
                />
              </label>

              <label className="worker-salary-field">
                الراتب
                <div className="worker-salary-input">
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="0"
                    value={formatMoneyInput(
                      workerSalary
                    )}
                    onChange={(event) =>
                      setWorkerSalary(
                        cleanMoneyValue(
                          event.target.value
                        )
                      )
                    }
                  />
                  <span>ريال</span>
                </div>
              </label>

              <button
                type="submit"
                className="save-worker-button"
              >
                {editingWorker
                  ? 'حفظ التعديل'
                  : 'إضافة العامل'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل العامل الشهرية */}
      {detailsSummary && (
        <div
          className="worker-modal-backdrop"
          onMouseDown={() =>
            setDetailsWorkerId(null)
          }
        >
          <div
            className="worker-modal worker-details-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="worker-modal-header">
              <div>
                <span>ملخص العمال</span>
                <h2>
                  تفاصيل العامل: {detailsSummary.worker.name}
                </h2>
              </div>

              <button
                type="button"
                aria-label="إغلاق التفاصيل"
                onClick={() =>
                  setDetailsWorkerId(null)
                }
              >
                <X size={19} />
              </button>
            </div>

            <div className="worker-details-month">
              الشهر: {summaryMonth}
              {' — '}
              عدد أيام الشهر: {daysInSelectedMonth}
            </div>

            <div className="worker-details-cards">
              <div className="worker-details-card">
                <span>الراتب الشهري</span>
                <strong>
                  {formatMoney(detailsSummary.salary)} ريال
                </strong>
              </div>

              <div className="worker-details-card">
                <span>السحب اليومي</span>
                <strong>
                  {formatMoney(
                    detailsSummary.dailyDrawTotal
                  )} ريال
                </strong>
              </div>

              <div className="worker-details-card">
                <span>السحب النقدي</span>
                <strong>
                  {formatMoney(
                    detailsSummary.cashDrawTotal
                  )} ريال
                </strong>
              </div>

              <div className="worker-details-card">
                <span>إجمالي الغياب</span>
                <strong>
                  {formatAbsence(
                    detailsSummary.fullDays,
                    detailsSummary.halfDays
                  )}
                </strong>
              </div>

              <div className="worker-details-card">
                <span>خصم الغياب</span>
                <strong>
                  {formatMoney(
                    detailsSummary.absenceDeduction
                  )} ريال
                </strong>
              </div>

              <div className="worker-details-card">
                <span>الراتب المتبقي</span>
                <strong>
                  {formatMoney(
                    detailsSummary.remaining
                  )} ريال
                </strong>
              </div>
            </div>

            <h3 className="worker-details-title">
              سجل الغياب والسحبيات بالتواريخ
            </h3>

            {detailsRecords.length === 0 ? (
              <div className="worker-details-empty">
                لا يوجد غياب أو سحبيات مسجلة
                لهذا العامل خلال الشهر المختار.
              </div>
            ) : (
              <div className="worker-details-table-wrapper">
                <table className="worker-details-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>الغياب</th>
                      <th>السحب اليومي</th>
                      <th>السحب النقدي</th>
                    </tr>
                  </thead>

                  <tbody>
                    {detailsRecords.map((record) => (
                      <tr
                        key={`${record.workerId}-${record.date}`}
                      >
                        <td>{record.date}</td>

                        <td
                          className={
                            record.absence
                              ? 'worker-details-absence'
                              : ''
                          }
                        >
                          {formatAbsenceType(
                            record.absence
                          )}
                        </td>

                        <td>
                          {formatMoney(
                            record.dailyDraw
                          )} ريال
                        </td>

                        <td>
                          {formatMoney(
                            record.cashDraw
                          )} ريال
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="worker-details-note">
              <strong>طريقة الحساب:</strong>
              {' '}
              الراتب المتبقي = الراتب الشهري
              − السحب اليومي
              − السحب النقدي
              − خصم الغياب.
              يتم احتساب الغياب حسب عدد أيام
              الشهر المختار، ويعادل نصف اليوم
              نصف قيمة اليوم الكامل.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Workers
