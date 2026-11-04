
import { useEffect, useMemo, useState } from 'react'

import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Eye,
  History,
  PackageCheck,
  PackagePlus,
  PackageX,
  Plus,
  Save,
  Search,
  Scale,
  ShoppingBasket,
  Store,
  Trash2,
  X,
} from 'lucide-react'

import './Inventory.css'

export type SectionType = 'restaurant' | 'cafeteria'

type InventoryProps = {
  section: SectionType
}

type TrackingMode = 'count' | 'weight'
type StockFilter = 'all' | 'low' | 'available' | 'empty'
type InventoryTab = 'stock' | 'daily-withdrawal' | 'display' | 'summary'
type SummaryMode = 'daily' | 'monthly' | 'yearly'
type DisplayAction = 'consume' | 'discard'
type ExpiryStatus = 'unknown' | 'good' | 'near' | 'expired'

type InventoryItem = {
  id: string
  name: string
  mode: TrackingMode
  purchaseUnit: string
  baseUnit: string
  conversionToBase: number
  quantityBase: number
  lowStockBase: number
  createdAt: number
}

type InventoryMovement = {
  id: string
  itemId: string
  itemName: string
  type: 'in' | 'out' | 'adjustment'
  deltaBase: number
  quantityText: string
  date: string
  reason: string
  note: string
  createdAt: number
}

type StockBatch = {
  id: string
  itemId: string
  receivedDate: string
  expiryDate: string
  warehouseBase: number
  displayBase: number
  createdAt: number
  legacy?: boolean
}

type DisplayMovement = {
  id: string
  batchId: string
  itemId: string
  itemName: string
  type: 'to_display' | 'consume' | 'discard'
  amountBase: number
  quantityText: string
  date: string
  expiryDate: string
  createdAt: number
}

const EPS = 0.000001

const storageKey = (section: SectionType, suffix: string) =>
  `alsamai_inventory_${section}_${suffix}`

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

function todayDate() {
  const date = new Date()

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function localTime() {
  const date = new Date()

  return (
    `${String(date.getHours()).padStart(2, '0')}:` +
    `${String(date.getMinutes()).padStart(2, '0')}`
  )
}

function formatNumber(value: number) {
  return Number(value.toFixed(3)).toLocaleString('en-US')
}

function formatTime(value: number) {
  return new Date(value).toLocaleTimeString('ar', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function readArray<T>(key: string): T[] {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function writeArray(
  section: SectionType,
  suffix: string,
  rows: unknown[]
) {
  localStorage.setItem(
    storageKey(section, suffix),
    JSON.stringify(rows)
  )
}

const loadItems = (section: SectionType) =>
  readArray<InventoryItem>(storageKey(section, 'items'))

const loadMovements = (section: SectionType) =>
  readArray<InventoryMovement>(storageKey(section, 'movements'))

const loadDisplayMovements = (section: SectionType) =>
  readArray<DisplayMovement>(
    storageKey(section, 'display_movements')
  )

function loadBatches(
  section: SectionType,
  items: InventoryItem[]
) {
  const saved = readArray<StockBatch>(
    storageKey(section, 'batches')
  )

  const result = [...saved]
  let changed = false

  for (const item of items) {
    const tracked = result
      .filter((batch) => batch.itemId === item.id)
      .reduce(
        (total, batch) => total + batch.warehouseBase,
        0
      )

    const difference = item.quantityBase - tracked

    if (difference > EPS) {
      result.push({
        id: makeId('old-stock'),
        itemId: item.id,
        receivedDate: '',
        expiryDate: '',
        warehouseBase: difference,
        displayBase: 0,
        createdAt: Date.now(),
        legacy: true,
      })

      changed = true
    }
  }

  if (changed) {
    writeArray(section, 'batches', result)
  }

  return result
}

function formatStock(
  item: InventoryItem,
  amount = item.quantityBase
) {
  const quantity = Math.max(0, amount)
  const ratio = item.conversionToBase

  if (item.mode === 'count') {
    if (ratio > 1) {
      const complete = Math.floor(
        quantity / ratio + EPS
      )

      const rest = Math.max(
        0,
        quantity - complete * ratio
      )

      if (complete && rest > EPS) {
        return (
          `${formatNumber(complete)} ${item.purchaseUnit} + ` +
          `${formatNumber(rest)} ${item.baseUnit}`
        )
      }

      if (complete) {
        return `${formatNumber(complete)} ${item.purchaseUnit}`
      }
    }

    return `${formatNumber(quantity)} ${item.baseUnit}`
  }

  const weight = (grams: number) =>
    grams >= 1000
      ? `${formatNumber(grams / 1000)} كجم`
      : `${formatNumber(grams)} جرام`

  if (ratio > 1000) {
    const complete = Math.floor(
      quantity / ratio + EPS
    )

    const rest = Math.max(
      0,
      quantity - complete * ratio
    )

    if (complete && rest > EPS) {
      return (
        `${formatNumber(complete)} ${item.purchaseUnit} + ` +
        weight(rest)
      )
    }

    if (complete) {
      return `${formatNumber(complete)} ${item.purchaseUnit}`
    }
  }

  return weight(quantity)
}

function formatAmount(
  item: InventoryItem,
  amount: number
) {
  return Math.abs(amount) < EPS
    ? '—'
    : formatStock(item, Math.abs(amount))
}

function isLow(item: InventoryItem) {
  return (
    item.quantityBase > EPS &&
    item.lowStockBase > EPS &&
    item.quantityBase <= item.lowStockBase
  )
}

function unitOptions(item: InventoryItem) {
  if (item.mode === 'count') {
    const options = [
      { value: 'base', label: item.baseUnit },
    ]

    if (
      item.conversionToBase !== 1 ||
      item.purchaseUnit !== item.baseUnit
    ) {
      options.push({
        value: 'purchase',
        label: item.purchaseUnit,
      })
    }

    return options
  }

  return [
    { value: 'kg', label: 'كيلو' },
    { value: 'gram', label: 'جرام' },
    { value: 'purchase', label: item.purchaseUnit },
  ]
}

function unitLabel(
  item: InventoryItem,
  unit: string
) {
  if (unit === 'purchase') {
    return item.purchaseUnit
  }

  if (item.mode === 'count') {
    return item.baseUnit
  }

  return unit === 'kg' ? 'كيلو' : 'جرام'
}

function baseQuantity(
  item: InventoryItem,
  quantity: number,
  unit: string
) {
  if (
    !Number.isFinite(quantity) ||
    quantity < 0
  ) {
    return 0
  }

  if (unit === 'purchase') {
    return quantity * item.conversionToBase
  }

  if (item.mode === 'count') {
    return quantity
  }

  return unit === 'kg'
    ? quantity * 1000
    : quantity
}

function defaultUnit(item?: InventoryItem) {
  return item?.mode === 'weight'
    ? 'kg'
    : 'base'
}

function validQuantity(
  item: InventoryItem,
  value: string
) {
  const number = Number(value)

  if (
    !value.trim() ||
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return false
  }

  return (
    item.mode !== 'count' ||
    Number.isInteger(number)
  )
}

function addMonths(
  dateText: string,
  months: number
) {
  const [year, month, day] = dateText
    .split('-')
    .map(Number)

  const first = new Date(
    year,
    month - 1 + months,
    1
  )

  const lastDay = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0
  ).getDate()

  return [
    first.getFullYear(),
    String(first.getMonth() + 1).padStart(2, '0'),
    String(Math.min(day, lastDay)).padStart(2, '0'),
  ].join('-')
}

function expiryStatus(
  expiry: string,
  today: string
): ExpiryStatus {
  if (!expiry) return 'unknown'
  if (expiry < today) return 'expired'
  if (expiry <= addMonths(today, 2)) return 'near'
  return 'good'
}

function expiryLabel(
  expiry: string,
  today: string
) {
  if (!expiry) return 'غير مسجلة'
  if (expiry < today) return 'منتهي الصلاحية'
  if (expiry === today) return 'ينتهي اليوم'

  return expiryStatus(expiry, today) === 'near'
    ? 'قريب الانتهاء'
    : 'سليم'
}

function sortByExpiry(
  a: StockBatch,
  b: StockBatch
) {
  const expiry = (
    a.expiryDate || '9999-12-31'
  ).localeCompare(
    b.expiryDate || '9999-12-31'
  )

  return (
    expiry ||
    (
      a.receivedDate || '9999-12-31'
    ).localeCompare(
      b.receivedDate || '9999-12-31'
    ) ||
    a.createdAt - b.createdAt
  )
}

type Allocation = {
  batch: StockBatch
  amount: number
}

function allocate(
  batches: StockBatch[],
  itemId: string,
  amount: number,
  location: 'warehouse' | 'display',
  today: string,
  action: 'normal' | 'discard' | 'audit' = 'normal'
): Allocation[] | null {
  const field =
    location === 'warehouse'
      ? 'warehouseBase'
      : 'displayBase'

  const available = batches
    .filter((batch) => {
      if (
        batch.itemId !== itemId ||
        batch[field] <= EPS
      ) {
        return false
      }

      if (action !== 'normal') {
        return true
      }

      return (
        expiryStatus(
          batch.expiryDate,
          today
        ) !== 'expired'
      )
    })
    .sort((a, b) => {
      if (action === 'discard') {
        const priority = (batch: StockBatch) =>
          expiryStatus(batch.expiryDate, today) ===
          'expired'
            ? 0
            : 1

        const diff = priority(a) - priority(b)

        if (diff) {
          return diff
        }
      }

      return sortByExpiry(a, b)
    })

  let remaining = amount
  const parts: Allocation[] = []

  for (const batch of available) {
    if (remaining <= EPS) {
      break
    }

    const take = Math.min(
      batch[field],
      remaining
    )

    parts.push({
      batch,
      amount: take,
    })

    remaining -= take
  }

  return remaining > EPS
    ? null
    : parts
}

function applyAllocation(
  batches: StockBatch[],
  allocation: Allocation[],
  location: 'warehouse' | 'display',
  destination: 'display' | 'none' = 'none'
) {
  const amounts = new Map(
    allocation.map((part) => [
      part.batch.id,
      part.amount,
    ])
  )

  return batches.map((batch) => {
    const amount = amounts.get(batch.id) || 0

    if (!amount) {
      return batch
    }

    if (location === 'warehouse') {
      return {
        ...batch,

        warehouseBase: Math.max(
          0,
          batch.warehouseBase - amount
        ),

        displayBase:
          batch.displayBase +
          (
            destination === 'display'
              ? amount
              : 0
          ),
      }
    }

    return {
      ...batch,

      displayBase: Math.max(
        0,
        batch.displayBase - amount
      ),
    }
  })
}

function periodRange(
  mode: SummaryMode,
  day: string,
  month: string,
  year: string
) {
  if (mode === 'daily') {
    return {
      start: day,
      end: day,
    }
  }

  if (mode === 'monthly') {
    const [y, m] = month
      .split('-')
      .map(Number)

    const last = new Date(
      y,
      m,
      0
    ).getDate()

    return {
      start: `${month}-01`,
      end:
        `${month}-${String(last).padStart(2, '0')}`,
    }
  }

  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  }
}

function Inventory({
  section,
}: InventoryProps) {
  const [items, setItems] = useState<
    InventoryItem[]
  >(
    () => loadItems(section)
  )

  const [movements, setMovements] = useState<
    InventoryMovement[]
  >(
    () => loadMovements(section)
  )

  const [batches, setBatches] = useState<
    StockBatch[]
  >(
    () =>
      loadBatches(
        section,
        loadItems(section)
      )
  )

  const [
    displayMovements,
    setDisplayMovements,
  ] = useState<DisplayMovement[]>(
    () => loadDisplayMovements(section)
  )

  const [activeTab, setActiveTab] =
    useState<InventoryTab>('stock')

  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] =
    useState<StockFilter>('all')

  const [showItemModal, setShowItemModal] =
    useState(false)

  const [editingItemId, setEditingItemId] =
    useState('')

  const [itemName, setItemName] = useState('')
  const [itemMode, setItemMode] =
    useState<TrackingMode>('count')

  const [purchaseUnit, setPurchaseUnit] =
    useState('كرتون')

  const [conversion, setConversion] =
    useState('24')

  const [lowAmount, setLowAmount] =
    useState('2')

  const [lowUnit, setLowUnit] =
    useState('purchase')

  const [
    initialStockAmount,
    setInitialStockAmount,
  ] = useState('')

  const [
    initialStockExpiry,
    setInitialStockExpiry,
  ] = useState('')

  const [showQuantityModal, setShowQuantityModal] =
    useState(false)

  const [quantityItemId, setQuantityItemId] =
    useState('')

  const [quantityAmount, setQuantityAmount] =
    useState('')

  const [quantityUnit, setQuantityUnit] =
    useState('purchase')

  const [quantityDate, setQuantityDate] =
    useState(todayDate())

  const [
    quantityExpiryDate,
    setQuantityExpiryDate,
  ] = useState('')

  // السحب اليومي
  const [withdrawalItemId, setWithdrawalItemId] =
    useState('')

  const [
    withdrawalProductSearch,
    setWithdrawalProductSearch,
  ] = useState('')

  const [withdrawalAmount, setWithdrawalAmount] =
    useState('')

  const [withdrawalUnit, setWithdrawalUnit] =
    useState('base')

  const [withdrawalDate, setWithdrawalDate] =
    useState(todayDate())

  const [withdrawalTime, setWithdrawalTime] =
    useState(localTime())

  const [
    withdrawalMessage,
    setWithdrawalMessage,
  ] = useState('')

  const [showAudit, setShowAudit] =
    useState(false)

  const [auditItemId, setAuditItemId] =
    useState('')

  const [auditAmount, setAuditAmount] =
    useState('')

  const [auditUnit, setAuditUnit] =
    useState('purchase')

  const [batchItemId, setBatchItemId] =
    useState('')

  const [editBatchId, setEditBatchId] =
    useState('')

  const [
    batchReceivedDate,
    setBatchReceivedDate,
  ] = useState('')

  const [batchExpiryDate, setBatchExpiryDate] =
    useState('')

  // منتجات العرض
  const [transferItemId, setTransferItemId] =
    useState('')

  const [
    transferProductSearch,
    setTransferProductSearch,
  ] = useState('')

  const [transferUnit, setTransferUnit] =
    useState('base')

  const [transferAmount, setTransferAmount] =
    useState('')

  const [transferDate, setTransferDate] =
    useState(todayDate())

  const [displayItemId, setDisplayItemId] =
    useState('')

  const [displayAction, setDisplayAction] =
    useState<DisplayAction>('consume')

  const [displayUnit, setDisplayUnit] =
    useState('base')

  const [displayAmount, setDisplayAmount] =
    useState('')

  const [displayDate, setDisplayDate] =
    useState(todayDate())

  const [
    showDisplayHistory,
    setShowDisplayHistory,
  ] = useState(false)

  const [summaryMode, setSummaryMode] =
    useState<SummaryMode>('daily')

  const [summaryDay, setSummaryDay] =
    useState(todayDate())

  const [summaryMonth, setSummaryMonth] =
    useState(todayDate().slice(0, 7))

  const [summaryYear, setSummaryYear] =
    useState(
      String(new Date().getFullYear())
    )

  const [summaryItemId, setSummaryItemId] =
    useState('all')

  const [
    summaryDetailItemId,
    setSummaryDetailItemId,
  ] = useState('')

  useEffect(() => {
    const nextItems = loadItems(section)

    setItems(nextItems)
    setMovements(loadMovements(section))
    setBatches(
      loadBatches(section, nextItems)
    )
    setDisplayMovements(
      loadDisplayMovements(section)
    )

    setActiveTab('stock')
    setSearch('')
    setStockFilter('all')

    setShowItemModal(false)
    setShowQuantityModal(false)
    setShowAudit(false)

    setBatchItemId('')
    setEditBatchId('')

    setTransferItemId('')
    setTransferAmount('')

    setDisplayItemId('')
    setDisplayAmount('')
    setShowDisplayHistory(false)

    setWithdrawalItemId('')
    setWithdrawalAmount('')
    setWithdrawalUnit('base')
    setWithdrawalDate(todayDate())
    setWithdrawalTime(localTime())
    setWithdrawalMessage('')

    setSummaryItemId('all')
    setSummaryDetailItemId('')
  }, [section])

  const updateItems = (next: InventoryItem[]) => {
    setItems(next)
    writeArray(section, 'items', next)
  }

  const updateMovements = (
    next: InventoryMovement[]
  ) => {
    setMovements(next)
    writeArray(section, 'movements', next)
  }

  const updateBatches = (next: StockBatch[]) => {
    setBatches(next)
    writeArray(section, 'batches', next)
  }

  const updateDisplayMovements = (
    next: DisplayMovement[]
  ) => {
    setDisplayMovements(next)
    writeArray(
      section,
      'display_movements',
      next
    )
  }

  const today = todayDate()

  const sectionName =
    section === 'restaurant'
      ? 'المطعم'
      : 'كافتيريا السامعي'

  const quantityItem = items.find(
    (item) => item.id === quantityItemId
  )

  const withdrawalItem = items.find(
    (item) => item.id === withdrawalItemId
  )

  const auditItem = items.find(
    (item) => item.id === auditItemId
  )

  const batchItem = items.find(
    (item) => item.id === batchItemId
  )

  const transferItem = items.find(
    (item) => item.id === transferItemId
  )

  const displayItem = items.find(
    (item) => item.id === displayItemId
  )

  const lowStockItems = items.filter(isLow)

  const availableItems = items.filter(
    (item) =>
      item.quantityBase > EPS &&
      !isLow(item)
  )

  const emptyItems = items.filter(
    (item) => item.quantityBase <= EPS
  )

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (
          !item.name
            .toLowerCase()
            .includes(
              search.trim().toLowerCase()
            )
        ) {
          return false
        }

        if (stockFilter === 'low') {
          return isLow(item)
        }

        if (stockFilter === 'available') {
          return (
            item.quantityBase > EPS &&
            !isLow(item)
          )
        }

        if (stockFilter === 'empty') {
          return item.quantityBase <= EPS
        }

        return true
      }),
    [items, search, stockFilter]
  )

  // السحوبات في التاريخ المختار
  const selectedWithdrawals = useMemo(
    () =>
      movements
        .filter(
          (movement) =>
            movement.type === 'out' &&
            movement.reason !== 'نقل إلى العرض' &&
            movement.date === withdrawalDate
        )
        .sort(
          (a, b) =>
            b.createdAt - a.createdAt
        ),
    [movements, withdrawalDate]
  )

  const withdrawnItemsCount = new Set(
    selectedWithdrawals.map(
      (movement) => movement.itemId
    )
  ).size

  const displayRows = useMemo(
    () =>
      items
        .map((item) => {
          const itemBatches = batches
            .filter(
              (batch) =>
                batch.itemId === item.id &&
                batch.displayBase > EPS
            )
            .sort(sortByExpiry)

          const total = itemBatches.reduce(
            (sum, batch) =>
              sum + batch.displayBase,
            0
          )

          const dated = itemBatches.filter(
            (batch) => batch.expiryDate
          )

          const firstExpiry =
            dated[0]?.expiryDate || ''

          const statuses = itemBatches.map(
            (batch) =>
              expiryStatus(
                batch.expiryDate,
                today
              )
          )

          const status: ExpiryStatus =
            statuses.includes('expired')
              ? 'expired'
              : statuses.includes('near')
              ? 'near'
              : statuses.includes('unknown')
              ? 'unknown'
              : 'good'

          return {
            item,
            total,
            itemBatches,
            firstExpiry,
            status,
          }
        })
        .filter(
          (row) => row.total > EPS
        ),
    [items, batches, today]
  )

  const displayAlerts = batches
    .filter(
      (batch) =>
        batch.displayBase > EPS &&
        ['near', 'expired'].includes(
          expiryStatus(
            batch.expiryDate,
            today
          )
        )
    )
    .sort(sortByExpiry)

  const displayEligible = displayItem
    ? batches
        .filter(
          (batch) =>
            batch.itemId === displayItem.id &&
            batch.displayBase > EPS &&
            (
              displayAction === 'discard' ||
              expiryStatus(
                batch.expiryDate,
                today
              ) !== 'expired'
            )
        )
        .reduce(
          (sum, batch) =>
            sum + batch.displayBase,
          0
        )
    : 0

  const period = useMemo(
    () =>
      periodRange(
        summaryMode,
        summaryDay,
        summaryMonth,
        summaryYear
      ),
    [
      summaryMode,
      summaryDay,
      summaryMonth,
      summaryYear,
    ]
  )

  const summaryMovements = useMemo(
    () =>
      movements.filter(
        (movement) =>
          movement.date >= period.start &&
          movement.date <= period.end &&
          (
            summaryItemId === 'all' ||
            movement.itemId === summaryItemId
          )
      ),
    [
      movements,
      period,
      summaryItemId,
    ]
  )

  const summaryDisplayMovements = useMemo(
    () =>
      displayMovements.filter(
        (movement) =>
          movement.date >= period.start &&
          movement.date <= period.end &&
          (
            summaryItemId === 'all' ||
            movement.itemId === summaryItemId
          )
      ),
    [
      displayMovements,
      period,
      summaryItemId,
    ]
  )

  const summaryRows = useMemo(
    () =>
      items
        .filter(
          (item) =>
            summaryItemId === 'all' ||
            item.id === summaryItemId
        )
        .map((item) => {
          const within = movements.filter(
            (movement) =>
              movement.itemId === item.id &&
              movement.date >= period.start &&
              movement.date <= period.end
          )

          const after = movements.filter(
            (movement) =>
              movement.itemId === item.id &&
              movement.date > period.end
          )

          const end =
            item.quantityBase -
            after.reduce(
              (sum, movement) =>
                sum + movement.deltaBase,
              0
            )

          const delta = within.reduce(
            (sum, movement) =>
              sum + movement.deltaBase,
            0
          )

          const sumType = (
            type: InventoryMovement['type']
          ) =>
            within
              .filter(
                (movement) =>
                  movement.type === type
              )
              .reduce(
                (sum, movement) =>
                  sum +
                  (
                    type === 'out'
                      ? Math.abs(
                          movement.deltaBase
                        )
                      : movement.deltaBase
                  ),
                0
              )

          const transferred = within
            .filter(
              (movement) =>
                movement.reason ===
                'نقل إلى العرض'
            )
            .reduce(
              (sum, movement) =>
                sum +
                Math.abs(
                  movement.deltaBase
                ),
              0
            )

          const usedDisplay =
            summaryDisplayMovements
              .filter(
                (movement) =>
                  movement.itemId === item.id &&
                  movement.type === 'consume'
              )
              .reduce(
                (sum, movement) =>
                  sum + movement.amountBase,
                0
              )

          const displayedNow = batches
            .filter(
              (batch) =>
                batch.itemId === item.id
            )
            .reduce(
              (sum, batch) =>
                sum + batch.displayBase,
              0
            )

          return {
            item,
            start: Math.max(
              0,
              end - delta
            ),
            end: Math.max(0, end),
            added: sumType('in'),
            withdrawn:
              sumType('out') - transferred,
            transferred,
            usedDisplay,
            displayedNow,
            adjusted: sumType('adjustment'),
            movements: within,
          }
        }),
    [
      items,
      movements,
      batches,
      period,
      summaryItemId,
      summaryDisplayMovements,
    ]
  )

  const summaryDetails = summaryRows.find(
    (row) =>
      row.item.id === summaryDetailItemId
  )

  const detailMovements = useMemo(() => {
    if (!summaryDetails) {
      return []
    }

    let balance = summaryDetails.start

    return [...summaryDetails.movements]
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.createdAt - b.createdAt
      )
      .map((movement) => {
        balance += movement.deltaBase

        return {
          ...movement,
          balanceAfter: Math.max(
            0,
            balance
          ),
        }
      })
  }, [summaryDetails])

  const detailDisplay =
    summaryDisplayMovements
      .filter(
        (movement) =>
          movement.itemId ===
          summaryDetailItemId
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.createdAt - b.createdAt
      )

  function saveItem() {
    const name = itemName.trim()
    const ratio = Number(conversion)
    const low = Number(lowAmount)

    const old = items.find(
      (item) =>
        item.id === editingItemId
    )

    if (!name) {
      alert('اكتب اسم الصنف.')
      return
    }

    if (
      items.some(
        (item) =>
          item.id !== editingItemId &&
          item.name.trim().toLowerCase() ===
            name.toLowerCase()
      )
    ) {
      alert('هذا الصنف موجود بالفعل.')
      return
    }

    if (
      !Number.isFinite(ratio) ||
      ratio <= 0 ||
      (
        itemMode === 'count' &&
        !Number.isInteger(ratio)
      )
    ) {
      alert(
        'اكتب عدد الحبات أو الوزن بشكل صحيح.'
      )
      return
    }

    if (
      !Number.isFinite(low) ||
      low < 0
    ) {
      alert('اكتب حد تنبيه صحيح.')
      return
    }

    if (
      old &&
      old.mode !== itemMode &&
      (
        old.quantityBase > EPS ||
        batches.some(
          (batch) =>
            batch.itemId === old.id &&
            batch.displayBase > EPS
        )
      )
    ) {
      alert(
        'لا يمكن تغيير نوع الصنف مع وجود كميات.'
      )
      return
    }

    let firstStockBase = 0

    if (!old) {
      const firstAmount =
        Number(initialStockAmount)

      if (
        !initialStockAmount.trim() ||
        !Number.isFinite(firstAmount) ||
        firstAmount <= 0 ||
        !Number.isInteger(firstAmount)
      ) {
        alert(
          'اكتب عدد وحدات التخزين الموجودة عند البداية بشكل صحيح.'
        )
        return
      }

      if (!initialStockExpiry) {
        alert(
          'حدد تاريخ انتهاء الصلاحية للصنف.'
        )
        return
      }

      if (
        initialStockExpiry < todayDate()
      ) {
        alert(
          'تاريخ انتهاء الصلاحية لا يمكن أن يكون قبل اليوم.'
        )
        return
      }

      firstStockBase =
        itemMode === 'count'
          ? firstAmount * ratio
          : firstAmount *
            ratio *
            1000
    }

    let correctedQuantity =
      old?.quantityBase ?? 0

    let correctedBatches =
      batches

    let conversionCorrection = 0
    let conversionWasCorrected = false

    if (
      old &&
      old.mode === 'count' &&
      itemMode === 'count' &&
      Math.abs(
        old.conversionToBase - ratio
      ) > EPS
    ) {
      const oldRatio =
        old.conversionToBase

      const newRatio =
        ratio

      const correctAmount = (
        amount: number
      ) => {
        const complete =
          Math.floor(
            amount / oldRatio + EPS
          )

        const loose =
          Math.max(
            0,
            amount -
              complete * oldRatio
          )

        return (
          complete * newRatio +
          loose
        )
      }

      correctedQuantity =
        correctAmount(
          old.quantityBase
        )

      conversionCorrection =
        correctedQuantity -
        old.quantityBase

      correctedBatches =
        batches.map((batch) =>
          batch.itemId === old.id
            ? {
                ...batch,
                warehouseBase:
                  correctAmount(
                    batch.warehouseBase
                  ),
                displayBase:
                  correctAmount(
                    batch.displayBase
                  ),
              }
            : batch
        )

      conversionWasCorrected = true
    }

    const newItem: InventoryItem = {
      id: old?.id || makeId('inventory-item'),
      name,
      mode: itemMode,
      purchaseUnit,
      baseUnit:
        itemMode === 'count'
          ? old?.baseUnit || 'حبة'
          : 'جرام',
      conversionToBase:
        itemMode === 'count'
          ? ratio
          : ratio * 1000,
      quantityBase:
        old
          ? correctedQuantity
          : firstStockBase,
      lowStockBase: 0,
      createdAt:
        old?.createdAt ?? Date.now(),
    }

    newItem.lowStockBase = baseQuantity(
      newItem,
      low,
      lowUnit
    )

    updateItems(
      old
        ? items.map((item) =>
            item.id === old.id
              ? newItem
              : item
          )
        : [...items, newItem]
    )

    if (
      old &&
      conversionWasCorrected
    ) {
      updateBatches(
        correctedBatches
      )

      if (
        Math.abs(
          conversionCorrection
        ) > EPS
      ) {
        updateMovements([
          {
            id: makeId('movement'),
            itemId: newItem.id,
            itemName: newItem.name,
            type: 'adjustment',
            deltaBase:
              conversionCorrection,
            quantityText:
              formatAmount(
                newItem,
                conversionCorrection
              ),
            date: todayDate(),
            reason:
              'تصحيح عدد الحبات داخل وحدة التخزين',
            note:
              `تم تصحيح ${old.purchaseUnit} من ${
                old.conversionToBase
              } إلى ${
                newItem.conversionToBase
              } ${newItem.baseUnit}`,
            createdAt: Date.now(),
          },
          ...movements,
        ])
      }
    }

    if (
      !old &&
      firstStockBase > EPS
    ) {
      const now = Date.now()
      const receivedDate =
        todayDate()

      const initialBatch: StockBatch = {
        id: makeId('batch'),
        itemId: newItem.id,
        receivedDate,
        expiryDate:
          initialStockExpiry,
        warehouseBase:
          firstStockBase,
        displayBase: 0,
        createdAt: now,
      }

      const initialMovement:
        InventoryMovement = {
        id: makeId('movement'),
        itemId: newItem.id,
        itemName: newItem.name,
        type: 'in',
        deltaBase:
          firstStockBase,
        quantityText:
          `${formatNumber(
            Number(initialStockAmount)
          )} ${purchaseUnit}`,
        date: receivedDate,
        reason: 'إضافة كمية',
        note: initialStockExpiry
          ? `الصلاحية: ${initialStockExpiry}`
          : 'بدون صلاحية مسجلة',
        createdAt: now,
      }

      updateBatches([
        ...batches,
        initialBatch,
      ])

      updateMovements([
        initialMovement,
        ...movements,
      ])
    }

    setShowItemModal(false)
  }

  function openItem(
    item?: InventoryItem
  ) {
    if (item) {
      setEditingItemId(item.id)
      setItemName(item.name)
      setItemMode(item.mode)
      setPurchaseUnit(
        item.purchaseUnit
      )

      setConversion(
        String(
          item.mode === 'count'
            ? item.conversionToBase
            : item.conversionToBase / 1000
        )
      )

      setLowAmount(
        String(
          Number(
            (
              item.lowStockBase /
              item.conversionToBase
            ).toFixed(3)
          )
        )
      )
    } else {
      setEditingItemId('')
      setItemName('')
      setItemMode('count')
      setPurchaseUnit('كرتون')
      setConversion('24')
      setLowAmount('2')
      setInitialStockAmount('')
      setInitialStockExpiry('')
    }

    setLowUnit('purchase')
    setShowItemModal(true)
  }


  function deleteInventoryItem(
    item: InventoryItem
  ) {
    const itemBatches = batches.filter(
      (batch) => batch.itemId === item.id
    )

    const hasQuantity =
      item.quantityBase > EPS ||
      itemBatches.some(
        (batch) =>
          batch.warehouseBase > EPS ||
          batch.displayBase > EPS
      )

    const hasHistory =
      movements.some(
        (movement) =>
          movement.itemId === item.id
      ) ||
      displayMovements.some(
        (movement) =>
          movement.itemId === item.id
      )

    if (hasQuantity || hasHistory) {
      alert(
        'لا يمكن حذف هذا الصنف لأنه يحتوي على كمية أو حركات سابقة. إذا كانت الكمية أُضيفت بالغلط، احذف الدفعة الخاطئة أولًا من تواريخ الصلاحية.'
      )
      return
    }

    const approved = window.confirm(
      `هل تريد حذف الصنف «${item.name}» نهائيًا؟`
    )

    if (!approved) {
      return
    }

    updateItems(
      items.filter(
        (current) =>
          current.id !== item.id
      )
    )

    updateBatches(
      batches.filter(
        (batch) =>
          batch.itemId !== item.id
      )
    )
  }

  function deleteInventoryBatch(
    batch: StockBatch
  ) {
    const item = items.find(
      (current) =>
        current.id === batch.itemId
    )

    if (!item) {
      return
    }

    const addition = movements.find(
      (movement) =>
        movement.itemId === batch.itemId &&
        movement.type === 'in' &&
        movement.reason === 'إضافة كمية' &&
        movement.createdAt === batch.createdAt
    )

    const usedInDisplay =
      displayMovements.some(
        (movement) =>
          movement.batchId === batch.id
      )

    const remaining =
      batch.warehouseBase +
      batch.displayBase

    const untouched =
      addition &&
      Math.abs(
        addition.deltaBase - remaining
      ) <= EPS

    if (
      batch.legacy ||
      !addition ||
      !untouched ||
      usedInDisplay ||
      batch.displayBase > EPS
    ) {
      alert(
        'لا يمكن حذف هذه الدفعة لأنها مستخدمة أو لها حركات سابقة. الحذف مسموح فقط للدفعة التي أُضيفت بالغلط ولم يتم السحب أو النقل منها.'
      )
      return
    }

    const approved = window.confirm(
      `حذف دفعة «${item.name}»؟\nالكمية: ${formatStock(
        item,
        batch.warehouseBase
      )}\nسيتم خصمها من المخزون وإلغاء عملية إضافتها.`
    )

    if (!approved) {
      return
    }

    updateItems(
      items.map((current) =>
        current.id === item.id
          ? {
              ...current,
              quantityBase: Math.max(
                0,
                current.quantityBase -
                  batch.warehouseBase
              ),
            }
          : current
      )
    )

    updateBatches(
      batches.filter(
        (current) =>
          current.id !== batch.id
      )
    )

    updateMovements(
      movements.filter(
        (movement) =>
          movement.id !== addition.id
      )
    )

    if (editBatchId === batch.id) {
      setEditBatchId('')
    }
  }

  function openQuantity(
    item: InventoryItem
  ) {
    setQuantityItemId(item.id)
    setQuantityAmount('')
    setQuantityUnit('purchase')
    setQuantityDate(todayDate())
    setQuantityExpiryDate('')
    setShowQuantityModal(true)
  }

  function saveQuantity() {
    if (!quantityItem) return

    if (
      !validQuantity(
        quantityItem,
        quantityAmount
      )
    ) {
      alert(
        'اكتب كمية صحيحة. الحبات والكراتين بأعداد صحيحة.'
      )
      return
    }

    if (!quantityDate) {
      alert(
        'تعذر تحديد تاريخ الدخول.'
      )
      return
    }

    if (!quantityExpiryDate) {
      alert(
        'حدد تاريخ انتهاء الصلاحية للكمية الجديدة.'
      )
      return
    }

    if (
      quantityExpiryDate < quantityDate
    ) {
      alert(
        'تاريخ انتهاء الصلاحية لا يمكن أن يسبق تاريخ الدخول.'
      )
      return
    }

    const amount = baseQuantity(
      quantityItem,
      Number(quantityAmount),
      quantityUnit
    )

    const now = Date.now()

    const batch: StockBatch = {
      id: makeId('batch'),
      itemId: quantityItem.id,
      receivedDate: quantityDate,
      expiryDate: quantityExpiryDate,
      warehouseBase: amount,
      displayBase: 0,
      createdAt: now,
    }

    const movement: InventoryMovement = {
      id: makeId('movement'),
      itemId: quantityItem.id,
      itemName: quantityItem.name,
      type: 'in',
      deltaBase: amount,
      quantityText:
        `${formatNumber(
          Number(quantityAmount)
        )} ${unitLabel(
          quantityItem,
          quantityUnit
        )}`,
      date: quantityDate,
      reason: 'إضافة كمية',
      note: quantityExpiryDate
        ? `الصلاحية: ${quantityExpiryDate}`
        : 'بدون صلاحية مسجلة',
      createdAt: now,
    }

    updateItems(
      items.map((item) =>
        item.id === quantityItem.id
          ? {
              ...item,
              quantityBase:
                item.quantityBase + amount,
            }
          : item
      )
    )

    updateBatches([
      ...batches,
      batch,
    ])

    updateMovements([
      movement,
      ...movements,
    ])

    setShowQuantityModal(false)
  }

  // حفظ سحب واحد بضغطة صح
  function saveWithdrawal() {
    if (!withdrawalItem) {
      alert('اختر المنتج أولًا.')
      return
    }

    if (
      !validQuantity(
        withdrawalItem,
        withdrawalAmount
      )
    ) {
      alert(
        withdrawalItem.mode === 'count'
          ? 'اكتب عددًا صحيحًا من الحبات أو الكراتين.'
          : 'اكتب كمية صحيحة.'
      )
      return
    }

    if (!withdrawalDate) {
      alert('اختر التاريخ.')
      return
    }

    if (!withdrawalTime) {
      alert('اختر الوقت.')
      return
    }

    const recordedAt = new Date(
      `${withdrawalDate}T${withdrawalTime}:00`
    ).getTime()

    if (
      !Number.isFinite(recordedAt)
    ) {
      alert(
        'التاريخ أو الوقت غير صحيح.'
      )
      return
    }

    const amount = baseQuantity(
      withdrawalItem,
      Number(withdrawalAmount),
      withdrawalUnit
    )

    if (
      amount <= EPS ||
      amount >
        withdrawalItem.quantityBase + EPS
    ) {
      alert(
        'الكمية المطلوبة أكبر من رصيد المخزون أو غير صحيحة.'
      )
      return
    }

    const parts = allocate(
      batches,
      withdrawalItem.id,
      amount,
      'warehouse',
      today
    )

    if (!parts) {
      alert(
        'الكمية الصالحة في المستودع غير كافية. راجع تواريخ الصلاحية.'
      )
      return
    }

    const quantityText =
      `${formatNumber(
        Number(withdrawalAmount)
      )} ${unitLabel(
        withdrawalItem,
        withdrawalUnit
      )}`

    const productName =
      withdrawalItem.name

    updateBatches(
      applyAllocation(
        batches,
        parts,
        'warehouse'
      )
    )

    updateItems(
      items.map((item) =>
        item.id === withdrawalItem.id
          ? {
              ...item,
              quantityBase: Math.max(
                0,
                item.quantityBase - amount
              ),
            }
          : item
      )
    )

    updateMovements([
      {
        id: makeId('movement'),
        itemId: withdrawalItem.id,
        itemName: withdrawalItem.name,
        type: 'out',
        deltaBase: -amount,
        quantityText,
        date: withdrawalDate,
        reason: 'سحب يومي',
        note: '',
        createdAt: recordedAt,
      },
      ...movements,
    ])

    // تجهيز الصف للسحب التالي
    setWithdrawalItemId('')
    setWithdrawalAmount('')
    setWithdrawalUnit('base')
    setWithdrawalTime(localTime())

    setWithdrawalMessage(
      `تم تسجيل سحب ${quantityText} من ${productName}.`
    )
  }

  function saveAudit() {
    if (!auditItem) return

    if (
      auditAmount === '' ||
      Number(auditAmount) < 0 ||
      !Number.isFinite(
        Number(auditAmount)
      ) ||
      (
        auditItem.mode === 'count' &&
        !Number.isInteger(
          Number(auditAmount)
        )
      )
    ) {
      alert('اكتب كمية صحيحة.')
      return
    }

    const actual = baseQuantity(
      auditItem,
      Number(auditAmount),
      auditUnit
    )

    const difference =
      actual -
      auditItem.quantityBase

    let newBatches = batches

    if (difference < -EPS) {
      const parts = allocate(
        batches,
        auditItem.id,
        -difference,
        'warehouse',
        today,
        'audit'
      )

      if (!parts) {
        alert(
          'تعذّر مطابقة الدفعات.'
        )
        return
      }

      newBatches = applyAllocation(
        batches,
        parts,
        'warehouse'
      )
    } else if (
      difference > EPS
    ) {
      newBatches = [
        ...batches,
        {
          id: makeId('audit-batch'),
          itemId: auditItem.id,
          receivedDate: today,
          expiryDate: '',
          warehouseBase: difference,
          displayBase: 0,
          createdAt: Date.now(),
        },
      ]
    }

    updateItems(
      items.map((item) =>
        item.id === auditItem.id
          ? {
              ...item,
              quantityBase: actual,
            }
          : item
      )
    )

    if (
      Math.abs(difference) > EPS
    ) {
      updateBatches(newBatches)

      updateMovements([
        {
          id: makeId('movement'),
          itemId: auditItem.id,
          itemName: auditItem.name,
          type: 'adjustment',
          deltaBase: difference,
          quantityText: formatAmount(
            auditItem,
            difference
          ),
          date: today,
          reason:
            'جرد / مطابقة المخزون',
          note:
            difference > 0
              ? 'زيادة بعد الجرد'
              : 'نقص بعد الجرد',
          createdAt: Date.now(),
        },
        ...movements,
      ])
    }

    setShowAudit(false)
  }

  function saveBatchDates() {
    if (
      batchExpiryDate &&
      batchReceivedDate &&
      batchExpiryDate <
        batchReceivedDate
    ) {
      alert(
        'تاريخ الصلاحية لا يمكن أن يسبق تاريخ الدخول.'
      )
      return
    }

    updateBatches(
      batches.map((batch) =>
        batch.id === editBatchId
          ? {
              ...batch,
              receivedDate:
                batchReceivedDate,
              expiryDate:
                batchExpiryDate,
              legacy: false,
            }
          : batch
      )
    )

    setEditBatchId('')
  }

  // نقل المنتجات للعرض
  function saveTransfer() {
    if (
      section !== 'cafeteria'
    ) {
      return
    }

    if (!transferItem) {
      alert('اختر المنتج.')
      return
    }

    if (
      !validQuantity(
        transferItem,
        transferAmount
      )
    ) {
      alert(
        'اكتب الكمية بشكل صحيح. لا تستخدم الكسور للحبات أو الكراتين.'
      )
      return
    }

    if (!transferDate) {
      alert('اختر التاريخ.')
      return
    }

    const amount = baseQuantity(
      transferItem,
      Number(transferAmount),
      transferUnit
    )

    if (
      amount <= EPS ||
      amount >
        transferItem.quantityBase + EPS
    ) {
      alert(
        'الكمية المطلوبة غير صحيحة أو أكبر من الموجود في المستودع.'
      )
      return
    }

    const datedAvailable =
      batches
        .filter(
          (batch) =>
            batch.itemId === transferItem.id &&
            batch.warehouseBase > EPS &&
            Boolean(batch.expiryDate) &&
            expiryStatus(
              batch.expiryDate,
              today
            ) !== 'expired'
        )
        .reduce(
          (sum, batch) =>
            sum + batch.warehouseBase,
          0
        )

    if (
      amount >
      datedAvailable + EPS
    ) {
      alert(
        'لا يمكن نقل هذه الكمية إلى العرض لأن بعض الدفعات لا تحتوي على تاريخ انتهاء صلاحية. سجل الصلاحية أولًا من تواريخ الصلاحية.'
      )
      return
    }

    const parts = allocate(
      batches,
      transferItem.id,
      amount,
      'warehouse',
      today
    )

    if (!parts) {
      alert(
        'لا توجد كمية كافية صالحة للنقل. تحقق من المخزون وتواريخ الصلاحية.'
      )
      return
    }

    const now = Date.now()

    const quantityText =
      `${formatNumber(
        Number(transferAmount)
      )} ${unitLabel(
        transferItem,
        transferUnit
      )}`

    updateBatches(
      applyAllocation(
        batches,
        parts,
        'warehouse',
        'display'
      )
    )

    updateItems(
      items.map((item) =>
        item.id === transferItem.id
          ? {
              ...item,
              quantityBase: Math.max(
                0,
                item.quantityBase - amount
              ),
            }
          : item
      )
    )

    updateMovements([
      {
        id: makeId('movement'),
        itemId: transferItem.id,
        itemName: transferItem.name,
        type: 'out',
        deltaBase: -amount,
        quantityText,
        date: transferDate,
        reason: 'نقل إلى العرض',
        note:
          'نقل داخلي من المستودع للعرض',
        createdAt: now,
      },
      ...movements,
    ])

    const records: DisplayMovement[] =
      parts.map((part) => ({
        id: makeId('display-movement'),
        batchId: part.batch.id,
        itemId: transferItem.id,
        itemName: transferItem.name,
        type: 'to_display',
        amountBase: part.amount,
        quantityText: formatAmount(
          transferItem,
          part.amount
        ),
        date: transferDate,
        expiryDate:
          part.batch.expiryDate,
        createdAt: now,
      }))

    updateDisplayMovements([
      ...records,
      ...displayMovements,
    ])

    setTransferAmount('')
    setTransferItemId('')
    setTransferUnit('base')
  }

  function openDisplayAction(
    item: InventoryItem,
    action: DisplayAction
  ) {
    setDisplayItemId(item.id)
    setDisplayAction(action)
    setDisplayUnit(
      defaultUnit(item)
    )
    setDisplayAmount('')
    setDisplayDate(todayDate())
  }

  function saveDisplayAction() {
    if (
      section !== 'cafeteria' ||
      !displayItem
    ) {
      return
    }

    if (
      !validQuantity(
        displayItem,
        displayAmount
      )
    ) {
      alert('اكتب كمية صحيحة.')
      return
    }

    if (!displayDate) {
      alert('اختر التاريخ.')
      return
    }

    const amount = baseQuantity(
      displayItem,
      Number(displayAmount),
      displayUnit
    )

    if (amount <= EPS) {
      alert('الكمية غير صحيحة.')
      return
    }

    const parts = allocate(
      batches,
      displayItem.id,
      amount,
      'display',
      today,
      displayAction === 'discard'
        ? 'discard'
        : 'normal'
    )

    if (!parts) {
      alert(
        displayAction === 'consume'
          ? 'الكمية الصالحة للاستخدام غير كافية. المنتجات المنتهية يجب إتلافها.'
          : 'الكمية المطلوبة أكبر من الموجود في العرض.'
      )
      return
    }

    updateBatches(
      applyAllocation(
        batches,
        parts,
        'display'
      )
    )

    const now = Date.now()

    const records: DisplayMovement[] =
      parts.map((part) => ({
        id: makeId('display-movement'),
        batchId: part.batch.id,
        itemId: displayItem.id,
        itemName: displayItem.name,
        type: displayAction,
        amountBase: part.amount,
        quantityText: formatAmount(
          displayItem,
          part.amount
        ),
        date: displayDate,
        expiryDate:
          part.batch.expiryDate,
        createdAt: now,
      }))

    updateDisplayMovements([
      ...records,
      ...displayMovements,
    ])

    // لا نخصم المستودع مرة ثانية
    setDisplayItemId('')
    setDisplayAmount('')
  }

  const quantityPreview = quantityItem
    ? quantityItem.quantityBase +
      baseQuantity(
        quantityItem,
        Number(quantityAmount) || 0,
        quantityUnit
      )
    : 0

  const auditDifference = auditItem
    ? baseQuantity(
        auditItem,
        Number(auditAmount) || 0,
        auditUnit
      ) -
      auditItem.quantityBase
    : 0

  const transferPreview = transferItem
    ? baseQuantity(
        transferItem,
        Number(transferAmount) || 0,
        transferUnit
      )
    : 0

  const batchItemRows = batches
    .filter(
      (batch) =>
        batch.itemId === batchItemId
    )
    .sort(sortByExpiry)

  const withdrawalAvailable = withdrawalItem
    ? batches
        .filter(
          (batch) =>
            batch.itemId === withdrawalItem.id &&
            batch.warehouseBase > EPS &&
            expiryStatus(
              batch.expiryDate,
              today
            ) !== 'expired'
        )
        .reduce(
          (sum, batch) =>
            sum + batch.warehouseBase,
          0
        )
    : 0

  return (
    <div
      className="inventory-page"
      dir="rtl"
    >
      <style>{`
        .display-simple-panel {
          background: #fff;
          border: 1px solid #e5dcd5;
          border-radius: 15px;
          padding: 22px;
          margin: 16px 0;
        }

        .display-simple-panel h2 {
          margin: 0 0 7px;
          color: var(--theme-dark);
          font-size: 21px;
        }

        .display-simple-muted {
          font-size: 12px;
          color: #82766e;
          line-height: 1.8;
        }

        .display-simple-stats {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 13px;
          margin: 16px 0;
        }

        .display-simple-stat {
          background: #fff;
          border: 1px solid #e5dcd5;
          border-radius: 13px;
          padding: 17px;
        }

        .display-simple-stat small {
          display: block;
          color: #786c64;
          margin-bottom: 8px;
        }

        .display-simple-stat strong {
          color: var(--theme-dark);
          font-size: 24px;
          font-weight: 900;
        }

        .display-simple-scroll {
          overflow-x: auto;
          border: 1px solid #e6ddd6;
          border-radius: 11px;
          margin-top: 14px;
        }

        .display-simple-table {
          width: 100%;
          min-width: 690px;
          border-collapse: collapse;
        }

        .display-simple-table th {
          background: var(--theme-soft);
          color: var(--theme-main);
          padding: 13px;
          text-align: right;
          font-size: 12px;
        }

        .display-simple-table td {
          padding: 12px;
          border-top: 1px solid #eee7e1;
          font-size: 12px;
          vertical-align: middle;
        }

        .display-simple-table input,
        .display-simple-table select,
        .display-simple-input {
          width: 100%;
          min-width: 0;
          height: 43px;
          padding: 0 10px;
          border-radius: 9px;
          border: 1px solid #ded3cb;
          background: white;
          color: #332b29;
          box-sizing: border-box;
          font: inherit;
          outline: none;
        }

        .display-simple-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 0;
          border-radius: 9px;
          padding: 12px 17px;
          background: var(--theme-main);
          color: white;
          font-family: inherit;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .display-simple-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 12px;
          border-radius: 9px;
          border: 1px solid var(--theme-main);
          background: var(--theme-soft-2);
          color: var(--theme-main);
          font-family: inherit;
          font-weight: 800;
          cursor: pointer;
        }

        .display-simple-danger {
          border-color: #b63535;
          background: #fff3f3;
          color: #a82424;
        }

        .display-simple-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .display-simple-alert {
          background: #fff6e5;
          color: #8a510d;
          border: 1px solid #eed5a7;
          border-radius: 12px;
          padding: 13px 15px;
          margin: 14px 0;
          line-height: 2;
          font-size: 13px;
        }

        .display-simple-badge {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 8px;
          background: #eaf6ed;
          color: #28743d;
          font-size: 11px;
          font-weight: 900;
        }

        .display-simple-badge.near {
          background: #fff2d8;
          color: #96610e;
        }

        .display-simple-badge.expired {
          background: #ffeded;
          color: #ab2525;
        }

        .display-simple-badge.unknown {
          background: #f0f0f2;
          color: #666;
        }

        .display-simple-fields {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin: 15px 0;
        }

        .display-simple-fields label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          color: #625650;
          font-size: 12px;
          font-weight: 800;
        }

        .display-simple-note {
          background: var(--theme-soft-2);
          padding: 12px;
          border-radius: 10px;
          margin: 13px 0;
          line-height: 1.9;
          font-size: 12px;
          color: #625650;
        }

        .display-simple-empty {
          text-align: center;
          color: #86796e;
          padding: 32px 15px;
          font-size: 13px;
        }

        .display-simple-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* ======================================
           التصميم الجديد للسحب اليومي
        ====================================== */

        .daily-quick-page {
          margin-top: 18px;
        }

        .daily-quick-panel {
          background: #ffffff;
          border: 1px solid #e5dcd5;
          border-radius: 15px;
          padding: 21px;
          margin-bottom: 17px;
        }

        .daily-quick-heading {
          margin-bottom: 17px;
        }

        .daily-quick-heading h2 {
          margin: 0 0 6px;
          font-size: 21px;
          color: var(--theme-dark);
        }

        .daily-quick-heading p {
          margin: 0;
          color: #81746b;
          font-size: 12px;
          line-height: 1.8;
        }

        .daily-quick-scroll {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #e7ded7;
          border-radius: 12px;
        }

        .daily-quick-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .daily-quick-table thead {
          background: var(--theme-soft);
        }

        .daily-quick-table th {
          padding: 13px 11px;
          font-size: 12px;
          color: var(--theme-main);
          font-weight: 900;
          text-align: right;
        }

        .daily-quick-table td {
          padding: 11px;
          border-top: 1px solid #eee5df;
          vertical-align: middle;
        }

        .daily-quick-table input,
        .daily-quick-table select {
          width: 100%;
          height: 46px;
          min-width: 0;
          box-sizing: border-box;
          border: 1px solid #ded3cb;
          background: #fff;
          border-radius: 9px;
          padding: 0 10px;
          color: #423730;
          font-family: inherit;
          font-size: 13px;
          outline: none;
        }

        .daily-quick-table input:focus,
        .daily-quick-table select:focus {
          border-color: var(--theme-main);
          box-shadow:
            0 0 0 3px var(--theme-soft);
        }

        .daily-quick-table input:disabled,
        .daily-quick-table select:disabled {
          background: #f5f3f1;
          color: #9d948c;
        }

        .daily-quick-check {
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 10px;
          background: var(--theme-main);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .daily-quick-check:hover {
          opacity: 0.88;
        }

        .daily-quick-check:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .daily-quick-help {
          background: var(--theme-soft-2);
          color: #6f625a;
          font-size: 12px;
          line-height: 1.9;
          padding: 11px 13px;
          border-radius: 10px;
          margin-top: 13px;
        }

        .daily-quick-success {
          display: flex;
          align-items: center;
          gap: 9px;
          background: #edf8ef;
          border: 1px solid #bfdfc6;
          color: #246b38;
          border-radius: 10px;
          padding: 12px 14px;
          margin-top: 12px;
          font-size: 13px;
          font-weight: 800;
        }

        .daily-quick-cards {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 17px;
        }

        .daily-quick-card {
          background: #fffdfb;
          border: 1px solid #e5dcd5;
          border-radius: 12px;
          padding: 16px;
        }

        .daily-quick-card small {
          display: block;
          color: #796f67;
          font-size: 12px;
          margin-bottom: 8px;
        }

        .daily-quick-card strong {
          color: var(--theme-dark);
          font-size: 23px;
          font-weight: 900;
        }

        .daily-quick-history {
          width: 100%;
          border-collapse: collapse;
          min-width: 560px;
        }

        .daily-quick-history thead {
          background: var(--theme-soft);
        }

        .daily-quick-history th {
          padding: 13px;
          text-align: right;
          color: var(--theme-main);
          font-size: 12px;
        }

        .daily-quick-history td {
          padding: 13px;
          border-top: 1px solid #eee5df;
          font-size: 13px;
          color: #4b413a;
        }

        .daily-quick-history tbody tr:first-child {
          background: #fbf8f5;
        }

        .daily-quick-history .quantity {
          color: var(--theme-dark);
          font-weight: 900;
        }

        .daily-quick-empty {
          text-align: center;
          padding: 38px 15px;
          color: #81756c;
          font-size: 13px;
        }

        .daily-quick-empty svg {
          display: block;
          margin: 0 auto 12px;
          color: #9b8e83;
        }

        @media (max-width: 850px) {
          .display-simple-stats {
            grid-template-columns: 1fr;
          }

          .display-simple-fields {
            grid-template-columns: 1fr;
          }

          .daily-quick-cards {
            grid-template-columns: 1fr;
          }

          .daily-quick-panel {
            padding: 14px;
          }
        }
      `}</style>

      <header className="inventory-header">
        <span className="inventory-eyebrow">
          إدارة المخزون
        </span>

        <h1>
          مخزون {sectionName}
        </h1>

        <p>
          متابعة الأصناف والكميات والسحب وملخص المخزون
        </p>
      </header>

      <div className="inventory-tabs">
        <button
          type="button"
          className={
            activeTab === 'stock'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab('stock')
          }
        >
          <Boxes size={18} />
          المخزون
        </button>

        <button
          type="button"
          className={
            activeTab === 'daily-withdrawal'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab('daily-withdrawal')
          }
        >
          <ShoppingBasket size={18} />
          السحب اليومي
        </button>

        {section === 'cafeteria' && (
          <button
            type="button"
            className={
              activeTab === 'display'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveTab('display')
            }
          >
            <Store size={18} />
            منتجات العرض
          </button>
        )}

        <button
          type="button"
          className={
            activeTab === 'summary'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab('summary')
          }
        >
          <BarChart3 size={18} />
          ملخص المخزون
        </button>
      </div>

      {/* ==============================
          المخزون
      ============================== */}

      {activeTab === 'stock' && (
        <>
          <div className="inventory-summary-grid">
            {[
              {
                key: 'all',
                title: 'إجمالي الأصناف',
                value: items.length,
              },
              {
                key: 'low',
                title: 'مخزون منخفض',
                value: lowStockItems.length,
              },
              {
                key: 'available',
                title: 'أصناف متوفرة',
                value: availableItems.length,
              },
              {
                key: 'empty',
                title: 'نفد من المخزون',
                value: emptyItems.length,
              },
            ].map((card) => (
              <button
                key={card.key}
                type="button"
                className={`inventory-summary-card inventory-summary-button ${
                  stockFilter === card.key
                    ? 'selected'
                    : ''
                }`}
                onClick={() =>
                  setStockFilter(
                    card.key as StockFilter
                  )
                }
              >
                <span className="inventory-summary-icon">
                  {card.key === 'low' ? (
                    <AlertTriangle size={21} />
                  ) : card.key === 'empty' ? (
                    <PackageX size={21} />
                  ) : card.key === 'available' ? (
                    <PackageCheck size={21} />
                  ) : (
                    <Boxes size={21} />
                  )}
                </span>

                <div>
                  <small>
                    {card.title}
                  </small>

                  <strong>
                    {card.value}
                  </strong>
                </div>
              </button>
            ))}
          </div>

          <section className="inventory-panel">
            <div className="inventory-panel-header">
              <div className="inventory-panel-title">
                <h2>
                  المخزون الحالي
                </h2>

                <p>
                  جميع الأصناف المسجلة في المستودع
                </p>
              </div>

              <div className="inventory-stock-tools">
                <div className="inventory-search">
                  <Search size={18} />

                  <input
                    type="text"
                    placeholder="بحث عن صنف..."
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                  />
                </div>

                <button
                  type="button"
                  className="inventory-add-item-button"
                  onClick={() =>
                    openItem()
                  }
                >
                  <Plus size={18} />
                  إضافة صنف
                </button>
              </div>
            </div>

            {stockFilter !== 'all' && (
              <div className="inventory-filter-notice">
                يتم عرض الأصناف حسب الفلتر المحدد.

                <button
                  type="button"
                  onClick={() =>
                    setStockFilter('all')
                  }
                >
                  عرض الكل
                </button>
              </div>
            )}

            {filteredItems.length === 0 ? (
              <div className="inventory-empty">
                <Boxes size={40} />

                <h3>
                  لا توجد أصناف
                </h3>
              </div>
            ) : (
              <div className="inventory-table-wrap">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>الصنف</th>
                      <th>طريقة التخزين</th>
                      <th>الموجود الآن</th>
                      <th>حد التنبيه</th>
                      <th>الحالة</th>
                      <th>العمليات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredItems.map((item) => {
                      const empty =
                        item.quantityBase <= EPS

                      const low = isLow(item)

                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="inventory-item-name">
                              <span>
                                {item.mode === 'count' ? (
                                  <Boxes size={19} />
                                ) : (
                                  <Scale size={19} />
                                )}
                              </span>

                              <strong>
                                {item.name}
                              </strong>
                            </div>
                          </td>

                          <td>
                            {item.mode === 'count'
                              ? `${item.purchaseUnit} — ${formatNumber(
                                  item.conversionToBase
                                )} ${item.baseUnit}`
                              : `${item.purchaseUnit} — ${formatNumber(
                                  item.conversionToBase / 1000
                                )} كجم`}
                          </td>

                          <td>
                            <strong className="inventory-current-stock">
                              {formatStock(item)}
                            </strong>
                          </td>

                          <td>
                            {item.lowStockBase <= 0
                              ? 'بدون تنبيه'
                              : formatAmount(
                                  item,
                                  item.lowStockBase
                                )}
                          </td>

                          <td>
                            <span
                              className={`inventory-status ${
                                empty
                                  ? 'empty'
                                  : low
                                  ? 'low'
                                  : 'good'
                              }`}
                            >
                              {empty ? (
                                <>
                                  <PackageX size={15} />
                                  نفد
                                </>
                              ) : low ? (
                                <>
                                  <AlertTriangle size={15} />
                                  منخفض
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={15} />
                                  جيد
                                </>
                              )}
                            </span>
                          </td>

                          <td>
                            <div className="inventory-row-actions">
                              <button
                                type="button"
                                className="add-quantity"
                                onClick={() =>
                                  openQuantity(item)
                                }
                              >
                                <PackagePlus size={14} />
                                إضافة كمية
                              </button>

                              <button
                                type="button"
                                className="edit"
                                onClick={() =>
                                  openItem(item)
                                }
                              >
                                <Edit3 size={14} />
                                تعديل
                              </button>

                              <button
                                type="button"
                                className="audit"
                                style={{ display: 'none' }}
                              onClick={() => {
                                  setAuditItemId(item.id)
                                  setAuditAmount('')
                                  setAuditUnit('purchase')
                                  setShowAudit(true)
                                }}
                              >
                                <ClipboardCheck size={14} />
                                جرد
                              </button>

                              <button
                                type="button"
                                className="audit"
                                onClick={() => {
                                  setBatchItemId(item.id)
                                  setEditBatchId('')
                                }}
                              >
                                <CalendarDays size={14} />
                                تواريخ الصلاحية
                              </button>

                              <button
                                type="button"
                                className="delete-item"
                                onClick={() =>
                                  deleteInventoryItem(item)
                                }
                              >
                                <Trash2 size={14} />
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* ==============================
          السحب اليومي - التصميم الجديد
      ============================== */}

      {activeTab === 'daily-withdrawal' && (
        <div className="daily-quick-page">
          <div className="daily-quick-cards">
            <div className="daily-quick-card">
              <small>
                عمليات السحب في التاريخ المحدد
              </small>

              <strong>
                {selectedWithdrawals.length}
              </strong>
            </div>

            <div className="daily-quick-card">
              <small>
                أصناف تم سحبها في التاريخ المحدد
              </small>

              <strong>
                {withdrawnItemsCount}
              </strong>
            </div>
          </div>

          <section className="daily-quick-panel">
            <div className="daily-quick-heading">
              <h2>
                تسجيل سحب من المخزون
              </h2>

              <p>
                اختر المنتج والوحدة والكمية والتوقيت،
                ثم اضغط علامة الصح لحفظ السحب مباشرة.
              </p>
            </div>

            <div className="daily-quick-scroll">
              <table className="daily-quick-table">
                <colgroup>
                  <col style={{ width: '24%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '19%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '9%' }} />
                </colgroup>

                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الوحدة</th>
                    <th>الكمية</th>
                    <th>التاريخ</th>
                    <th>الوقت</th>
                    <th>حفظ</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>
                      <div className="inventory-single-product-picker">
                        <input
                          type="text"
                          list="withdrawal-products-list"
                          value={withdrawalProductSearch}
                          placeholder="اختر أو اكتب اسم المنتج..."
                          onChange={(event) => {
                            const value =
                              event.target.value

                            setWithdrawalProductSearch(
                              value
                            )

                            const item =
                              items.find(
                                (current) =>
                                  current.name
                                    .trim()
                                    .toLowerCase() ===
                                  value
                                    .trim()
                                    .toLowerCase()
                              )

                            setWithdrawalItemId(
                              item?.id || ''
                            )

                            setWithdrawalUnit(
                              defaultUnit(item)
                            )

                            setWithdrawalAmount('')
                            setWithdrawalMessage('')
                          }}
                        />

                        <datalist id="withdrawal-products-list">
                          {items.map((item) => (
                            <option
                              key={item.id}
                              value={item.name}
                            />
                          ))}
                        </datalist>
                      </div>
                    </td>

                    <td>
                      <select
                        aria-label="الوحدة"
                        value={withdrawalUnit}
                        disabled={!withdrawalItem}
                        onChange={(event) => {
                          setWithdrawalUnit(
                            event.target.value
                          )
                          setWithdrawalAmount('')
                          setWithdrawalMessage('')
                        }}
                      >
                        {!withdrawalItem ? (
                          <option value="base">
                            اختر المنتج
                          </option>
                        ) : (
                          unitOptions(
                            withdrawalItem
                          ).map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))
                        )}
                      </select>
                    </td>

                    <td>
                      <input
                        type="number"
                        aria-label="الكمية المسحوبة"
                        min={
                          withdrawalItem?.mode === 'count'
                            ? '1'
                            : '0.001'
                        }
                        step={
                          withdrawalItem?.mode === 'count'
                            ? '1'
                            : '0.001'
                        }
                        placeholder="مثال: 10"
                        value={withdrawalAmount}
                        disabled={!withdrawalItem}
                        onChange={(event) => {
                          setWithdrawalAmount(
                            event.target.value
                          )
                          setWithdrawalMessage('')
                        }}
                      />
                    </td>

                    <td>
                      <input
                        type="date"
                        aria-label="تاريخ السحب"
                        value={withdrawalDate}
                        onChange={(event) => {
                          setWithdrawalDate(
                            event.target.value
                          )
                          setWithdrawalMessage('')
                        }}
                      />
                    </td>

                    <td>
                      <input
                        type="time"
                        aria-label="وقت السحب"
                        value={withdrawalTime}
                        onChange={(event) => {
                          setWithdrawalTime(
                            event.target.value
                          )
                          setWithdrawalMessage('')
                        }}
                      />
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        title="تسجيل السحب"
                        aria-label="تسجيل السحب"
                        className="daily-quick-check"
                        onClick={saveWithdrawal}
                      >
                        <Check
                          size={23}
                          strokeWidth={3}
                        />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {withdrawalItem && (
              <div className="daily-quick-help">
                <strong>
                  {withdrawalItem.name}
                </strong>

                {' — '}
                الموجود في المستودع:
                {' '}
                <strong>
                  {formatStock(withdrawalItem)}
                </strong>

                {' — '}
                المتاح غير منتهي الصلاحية:
                {' '}
                <strong>
                  {formatStock(
                    withdrawalItem,
                    withdrawalAvailable
                  )}
                </strong>
              </div>
            )}

            {withdrawalMessage && (
              <div
                className="daily-quick-success"
                role="status"
              >
                <CheckCircle2 size={19} />
                {withdrawalMessage}
              </div>
            )}
          </section>

          <section className="daily-quick-panel">
            <div className="daily-quick-heading">
              <h2>
                سجل السحوبات
              </h2>

              <p>
                السحوبات المسجلة بتاريخ
                {' '}
                <strong>
                  {withdrawalDate || '—'}
                </strong>
                .
                كل عملية محفوظة تظهر هنا مباشرة.
              </p>
            </div>

            {selectedWithdrawals.length === 0 ? (
              <div className="daily-quick-empty">
                <ShoppingBasket size={35} />

                لا توجد سحوبات مسجلة لهذا التاريخ.
              </div>
            ) : (
              <div className="daily-quick-scroll">
                <table className="daily-quick-history">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>المنتج</th>
                      <th>الكمية المسحوبة</th>
                      <th>التاريخ</th>
                      <th>الوقت</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedWithdrawals.map(
                      (movement, index) => (
                        <tr key={movement.id}>
                          <td>
                            {index + 1}
                          </td>

                          <td>
                            <strong>
                              {movement.itemName}
                            </strong>
                          </td>

                          <td className="quantity">
                            − {movement.quantityText}
                          </td>

                          <td>
                            {movement.date}
                          </td>

                          <td>
                            {formatTime(
                              movement.createdAt
                            )}
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
      )}

      {/* ==============================
          منتجات العرض
      ============================== */}

      {activeTab === 'display' &&
        section === 'cafeteria' && (
          <div>
            <div className="display-simple-stats">
              <div className="display-simple-stat">
                <small>
                  أصناف موجودة في العرض
                </small>

                <strong>
                  {displayRows.length}
                </strong>
              </div>

              <div className="display-simple-stat">
                <small>
                  دفعات قريبة الانتهاء
                </small>

                <strong>
                  {
                    displayAlerts.filter(
                      (batch) =>
                        expiryStatus(
                          batch.expiryDate,
                          today
                        ) === 'near'
                    ).length
                  }
                </strong>
              </div>

              <div className="display-simple-stat">
                <small>
                  دفعات منتهية الصلاحية
                </small>

                <strong>
                  {
                    displayAlerts.filter(
                      (batch) =>
                        expiryStatus(
                          batch.expiryDate,
                          today
                        ) === 'expired'
                    ).length
                  }
                </strong>
              </div>
            </div>

            {displayAlerts.length > 0 && (
              <div className="display-simple-alert">
                <strong>
                  <AlertTriangle size={17} />
                  تنبيهات الصلاحية
                </strong>

                {displayAlerts.map((batch) => {
                  const item = items.find(
                    (current) =>
                      current.id === batch.itemId
                  )

                  return (
                    <div key={batch.id}>
                      {item?.name ||
                        'منتج غير معروف'}

                      {': '}

                      {item
                        ? formatAmount(
                            item,
                            batch.displayBase
                          )
                        : ''}

                      {' — '}

                      الصلاحية
                      {' '}
                      {batch.expiryDate}

                      {' — '}

                      {expiryLabel(
                        batch.expiryDate,
                        today
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <section className="display-simple-panel">
              <h2>
                نقل منتج من المخزن إلى العرض
              </h2>

              <p className="display-simple-muted">
                اختر المنتج، ثم الوحدة، ثم الكمية.
                النظام يختار الدفعات الأقرب
                لانتهاء الصلاحية تلقائيًا.
              </p>

              <div className="display-simple-scroll">
                <table className="display-simple-table">
                  <thead>
                    <tr>
                      <th>1. المنتج</th>
                      <th>2. الوحدة</th>
                      <th>3. الكمية</th>
                      <th>4. التاريخ</th>
                      <th>العملية</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>
                        <div className="inventory-single-product-picker">
                        <input
                          type="text"
                          list="transfer-products-list"
                          value={transferProductSearch}
                          placeholder="اختر أو اكتب اسم المنتج..."
                          onChange={(event) => {
                            const value =
                              event.target.value

                            setTransferProductSearch(
                              value
                            )

                            const item =
                              items.find(
                                (current) =>
                                  current.quantityBase >
                                    EPS &&
                                  current.name
                                    .trim()
                                    .toLowerCase() ===
                                  value
                                    .trim()
                                    .toLowerCase()
                              )

                            setTransferItemId(
                              item?.id || ''
                            )

                            setTransferUnit(
                              defaultUnit(item)
                            )

                            setTransferAmount('')
                          }}
                        />

                        <datalist id="transfer-products-list">
                          {items
                            .filter(
                              (item) =>
                                item.quantityBase > EPS
                            )
                            .map((item) => (
                              <option
                                key={item.id}
                                value={item.name}
                              />
                            ))}
                        </datalist>
                      </div>
                      </td>

                      <td>
                        <select
                          value={transferUnit}
                          disabled={!transferItem}
                          onChange={(event) => {
                            setTransferUnit(
                              event.target.value
                            )
                            setTransferAmount('')
                          }}
                        >
                          {!transferItem ? (
                            <option value="base">
                              اختر المنتج
                            </option>
                          ) : (
                            unitOptions(
                              transferItem
                            ).map((option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ))
                          )}
                        </select>
                      </td>

                      <td>
                        <input
                          type="number"
                          min="1"
                          step={
                            transferItem?.mode === 'count'
                              ? '1'
                              : '0.001'
                          }
                          value={transferAmount}
                          disabled={!transferItem}
                          placeholder="مثال: 10"
                          onChange={(event) =>
                            setTransferAmount(
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="date"
                          value={transferDate}
                          onChange={(event) =>
                            setTransferDate(
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <button
                          type="button"
                          className="display-simple-button"
                          onClick={saveTransfer}
                        >
                          <Plus size={17} />
                          نقل إلى العرض
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {transferItem && (
                <div className="display-simple-note">
                  <strong>
                    {transferItem.name}
                  </strong>

                  {' — '}
                  الموجود في المستودع:
                  {' '}
                  {formatStock(transferItem)}

                  {' — '}
                  الكمية المطلوبة:
                  {' '}
                  {transferAmount || '0'}
                  {' '}
                  {unitLabel(
                    transferItem,
                    transferUnit
                  )}

                  {transferPreview > EPS &&
                    ` — المتبقي بعد النقل: ${formatStock(
                      transferItem,
                      transferItem.quantityBase -
                        transferPreview
                    )}`}
                </div>
              )}

              {items.length === 0 && (
                <div className="display-simple-note">
                  أضف الأصناف أولًا من تبويب المخزون.
                </div>
              )}
            </section>

            <section className="display-simple-panel">
              <h2>
                المنتجات الموجودة في العرض
              </h2>

              <p className="display-simple-muted">
                كل صنف يظهر مرة واحدة بإجمالي
                الكمية الموجودة في العرض.
              </p>

              {displayRows.length === 0 ? (
                <div className="display-simple-empty">
                  <Store size={36} />

                  <p>
                    لا توجد منتجات في العرض حاليًا.
                  </p>

                  <p>
                    استخدم الجدول الموجود بالأعلى
                    لإضافة أول منتج.
                  </p>
                </div>
              ) : (
                <div className="display-simple-scroll">
                  <table className="display-simple-table">
                    <thead>
                      <tr>
                        <th>المنتج</th>
                        <th>الكمية الموجودة في العرض</th>
                        <th>أقرب تاريخ انتهاء</th>
                        <th>حالة الصلاحية</th>
                        <th>العمليات</th>
                      </tr>
                    </thead>

                    <tbody>
                      {displayRows.map((row) => (
                        <tr key={row.item.id}>
                          <td>
                            <strong>
                              {row.item.name}
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {formatStock(
                                row.item,
                                row.total
                              )}
                            </strong>
                          </td>

                          <td>
                            {row.firstExpiry ||
                              'غير مسجل'}
                          </td>

                          <td>
                            <span
                              className={`display-simple-badge ${row.status}`}
                            >
                              {row.status === 'expired'
                                ? 'توجد بضاعة منتهية'
                                : row.status === 'near'
                                ? 'قريب الانتهاء'
                                : row.status === 'unknown'
                                ? 'صلاحية غير مسجلة'
                                : 'سليم'}
                            </span>
                          </td>

                          <td>
                            <div className="display-simple-actions">
                              <button
                                type="button"
                                className="display-simple-secondary"
                                onClick={() =>
                                  openDisplayAction(
                                    row.item,
                                    'consume'
                                  )
                                }
                              >
                                <ShoppingBasket size={14} />
                                استخدام
                              </button>

                              <button
                                type="button"
                                className="display-simple-secondary display-simple-danger"
                                onClick={() =>
                                  openDisplayAction(
                                    row.item,
                                    'discard'
                                  )
                                }
                              >
                                <Trash2 size={14} />
                                إتلاف
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {displayItem && (
              <section className="display-simple-panel">
                <div className="display-simple-heading">
                  <h2>
                    {displayAction === 'consume'
                      ? 'سحب منتج للاستخدام في الكافتيريا'
                      : 'تسجيل إتلاف منتج'}
                  </h2>

                  <button
                    type="button"
                    className="display-simple-secondary"
                    onClick={() =>
                      setDisplayItemId('')
                    }
                  >
                    <X size={16} />
                    إغلاق
                  </button>
                </div>

                <div className="display-simple-note">
                  المنتج:
                  {' '}
                  <strong>
                    {displayItem.name}
                  </strong>

                  {' — '}
                  المتاح لهذه العملية:
                  {' '}
                  {formatStock(
                    displayItem,
                    displayEligible
                  )}

                  <p>
                    سيُنقص النظام الكمية من العرض
                    فقط، ولن يتكرر الخصم من المخزن.
                  </p>
                </div>

                <div className="display-simple-fields">
                  <label>
                    الوحدة

                    <select
                      className="display-simple-input"
                      value={displayUnit}
                      onChange={(event) => {
                        setDisplayUnit(
                          event.target.value
                        )
                        setDisplayAmount('')
                      }}
                    >
                      {unitOptions(
                        displayItem
                      ).map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    الكمية

                    <input
                      className="display-simple-input"
                      type="number"
                      min="1"
                      step={
                        displayItem.mode === 'count'
                          ? '1'
                          : '0.001'
                      }
                      value={displayAmount}
                      onChange={(event) =>
                        setDisplayAmount(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    التاريخ

                    <input
                      className="display-simple-input"
                      type="date"
                      value={displayDate}
                      onChange={(event) =>
                        setDisplayDate(
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className="display-simple-button"
                  onClick={saveDisplayAction}
                >
                  <Save size={17} />

                  {displayAction === 'consume'
                    ? 'حفظ الاستخدام'
                    : 'حفظ الإتلاف'}
                </button>
              </section>
            )}

            <button
              type="button"
              className="display-simple-secondary"
              onClick={() =>
                setShowDisplayHistory(
                  !showDisplayHistory
                )
              }
            >
              <History size={17} />

              {showDisplayHistory
                ? 'إخفاء سجل الحركات'
                : 'عرض سجل حركات العرض'}

              {' '}
              ({displayMovements.length})
            </button>

            {showDisplayHistory && (
              <section className="display-simple-panel">
                <h2>
                  سجل حركات العرض
                </h2>

                {displayMovements.length === 0 ? (
                  <div className="display-simple-empty">
                    لا توجد حركات.
                  </div>
                ) : (
                  <div className="display-simple-scroll">
                    <table className="display-simple-table">
                      <thead>
                        <tr>
                          <th>التاريخ</th>
                          <th>الوقت</th>
                          <th>المنتج</th>
                          <th>العملية</th>
                          <th>الكمية</th>
                          <th>الصلاحية</th>
                        </tr>
                      </thead>

                      <tbody>
                        {displayMovements.map(
                          (movement) => (
                            <tr key={movement.id}>
                              <td>
                                {movement.date}
                              </td>

                              <td>
                                {formatTime(
                                  movement.createdAt
                                )}
                              </td>

                              <td>
                                {movement.itemName}
                              </td>

                              <td>
                                {movement.type ===
                                'to_display'
                                  ? 'نقل للعرض'
                                  : movement.type ===
                                    'consume'
                                  ? 'استخدام'
                                  : 'إتلاف'}
                              </td>

                              <td>
                                {movement.quantityText}
                              </td>

                              <td>
                                {movement.expiryDate ||
                                  'غير مسجلة'}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

      {/* ==============================
          ملخص المخزون
      ============================== */}

      {activeTab === 'summary' && (
        <div className="inventory-summary-page">
          <section className="stock-summary-panel">
            <div className="stock-summary-header">
              <div>
                <h2>
                  ملخص المخزون
                </h2>

                <p>
                  حركة المخزون اليومية والشهرية والسنوية
                </p>
              </div>

              <div className="stock-summary-period-tabs">
                {(
                  [
                    'daily',
                    'monthly',
                    'yearly',
                  ] as const
                ).map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    className={
                      summaryMode === mode
                        ? 'active'
                        : ''
                    }
                    onClick={() => {
                      setSummaryMode(mode)
                      setSummaryDetailItemId('')
                    }}
                  >
                    {mode === 'daily'
                      ? 'يومي'
                      : mode === 'monthly'
                      ? 'شهري'
                      : 'سنوي'}
                  </button>
                ))}
              </div>
            </div>

            <div className="stock-summary-controls">
              <label>
                <span>
                  {summaryMode === 'daily'
                    ? 'اليوم'
                    : summaryMode === 'monthly'
                    ? 'الشهر'
                    : 'السنة'}
                </span>

                {summaryMode === 'daily' ? (
                  <input
                    type="date"
                    value={summaryDay}
                    onChange={(event) => {
                      setSummaryDay(
                        event.target.value
                      )
                      setSummaryDetailItemId('')
                    }}
                  />
                ) : summaryMode === 'monthly' ? (
                  <input
                    type="month"
                    value={summaryMonth}
                    onChange={(event) => {
                      setSummaryMonth(
                        event.target.value
                      )
                      setSummaryDetailItemId('')
                    }}
                  />
                ) : (
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={summaryYear}
                    onChange={(event) => {
                      setSummaryYear(
                        event.target.value
                      )
                      setSummaryDetailItemId('')
                    }}
                  />
                )}
              </label>

              <label>
                <span>
                  الصنف
                </span>

                <select
                  value={summaryItemId}
                  onChange={(event) => {
                    setSummaryItemId(
                      event.target.value
                    )
                    setSummaryDetailItemId('')
                  }}
                >
                  <option value="all">
                    كل الأصناف
                  </option>

                  {items.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <div className="stock-summary-cards">
            {[
              [
                'عمليات الإضافة',
                summaryMovements.filter(
                  (movement) =>
                    movement.type === 'in'
                ).length,
              ],
              [
                'عمليات السحب',
                summaryMovements.filter(
                  (movement) =>
                    movement.type === 'out' &&
                    movement.reason !==
                      'نقل إلى العرض'
                ).length,
              ],
              
              [
                'أصناف تحركت',
                new Set([
                  ...summaryMovements.map(
                    (movement) =>
                      movement.itemId
                  ),
                  ...summaryDisplayMovements.map(
                    (movement) =>
                      movement.itemId
                  ),
                ]).size,
              ],
            ].map(([label, value], index) => (
              <div
                key={String(label)}
                className={`stock-summary-card ${
                  [
                    'additions',
                    'withdrawals',
                    'audits',
                    'active-items',
                  ][index]
                }`}
              >
                <span>
                  <BarChart3 size={21} />
                </span>

                <div>
                  <small>
                    {label}
                  </small>

                  <strong>
                    {value}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          <section className="stock-summary-table-panel">
            <div className="stock-summary-table-heading">
              <div>
                <h3>
                  حركة الأصناف خلال الفترة
                </h3>

                <p>
                  من {period.start}
                  {' '}
                  إلى {period.end}
                </p>
              </div>
            </div>

            {summaryRows.length === 0 ? (
              <div className="stock-summary-empty">
                <BarChart3 size={38} />

                <strong>
                  لا توجد أصناف
                </strong>
              </div>
            ) : (
              <div className="inventory-table-wrap">
                <table className="stock-summary-table">
                  <thead>
                    <tr>
                      <th>الصنف</th>
                      <th>بداية الفترة</th>
                      <th>الإضافات</th>
                      <th>السحوبات</th>

                      {section === 'cafeteria' && (
                        <>
                          <th>نقل إلى العرض</th>
                          <th>استخدام من العرض</th>
                        </>
                      )}

                      
                      <th>نهاية الفترة</th>

                      {section === 'cafeteria' && (
                        <th>في العرض حاليًا</th>
                      )}

                      <th>التفاصيل</th>
                    </tr>
                  </thead>

                  <tbody>
                    {summaryRows.map((row) => (
                      <tr key={row.item.id}>
                        <td>
                          <strong>
                            {row.item.name}
                          </strong>
                        </td>

                        <td>
                          {formatStock(
                            row.item,
                            row.start
                          )}
                        </td>

                        <td className="summary-positive">
                          {formatAmount(
                            row.item,
                            row.added
                          )}
                        </td>

                        <td className="summary-negative">
                          {formatAmount(
                            row.item,
                            row.withdrawn
                          )}
                        </td>

                        {section === 'cafeteria' && (
                          <>
                            <td>
                              {formatAmount(
                                row.item,
                                row.transferred
                              )}
                            </td>

                            <td>
                              {formatAmount(
                                row.item,
                                row.usedDisplay
                              )}
                            </td>
                          </>
                        )}

                        

                        <td>
                          <strong>
                            {formatStock(
                              row.item,
                              row.end
                            )}
                          </strong>
                        </td>

                        {section === 'cafeteria' && (
                          <td>
                            {formatStock(
                              row.item,
                              row.displayedNow
                            )}
                          </td>
                        )}

                        <td>
                          <button
                            type="button"
                            className="summary-details-button"
                            onClick={() =>
                              setSummaryDetailItemId(
                                summaryDetailItemId ===
                                  row.item.id
                                  ? ''
                                  : row.item.id
                              )
                            }
                          >
                            <Eye size={15} />

                            {summaryDetailItemId ===
                            row.item.id
                              ? 'إخفاء'
                              : 'تفاصيل'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {summaryDetails && (
            <section className="stock-summary-details-panel">
              <div className="stock-summary-details-header">
                <div>
                  <small>
                    تفاصيل الصنف
                  </small>

                  <h3>
                    {summaryDetails.item.name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSummaryDetailItemId('')
                  }
                >
                  <X size={18} />
                </button>
              </div>

              <div className="inventory-table-wrap">
                <table className="stock-summary-details-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>الوقت</th>
                      <th>الحركة</th>
                      <th>الكمية</th>
                      <th>رصيد المستودع بعدها</th>
                    </tr>
                  </thead>

                  <tbody>
                    {detailMovements.map(
                      (movement) => (
                        <tr key={movement.id}>
                          <td>
                            {movement.date}
                          </td>

                          <td>
                            {formatTime(
                              movement.createdAt
                            )}
                          </td>

                          <td>
                            {movement.reason}
                          </td>

                          <td>
                            {movement.quantityText}
                          </td>

                          <td>
                            {formatStock(
                              summaryDetails.item,
                              movement.balanceAfter
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {section === 'cafeteria' &&
                detailDisplay.length > 0 && (
                  <div className="display-simple-scroll">
                    <table className="display-simple-table">
                      <thead>
                        <tr>
                          <th>التاريخ</th>
                          <th>حركة العرض</th>
                          <th>الكمية</th>
                        </tr>
                      </thead>

                      <tbody>
                        {detailDisplay.map(
                          (movement) => (
                            <tr key={movement.id}>
                              <td>
                                {movement.date}
                              </td>

                              <td>
                                {movement.type ===
                                'to_display'
                                  ? 'نقل للعرض'
                                  : movement.type ===
                                    'consume'
                                  ? 'استخدام'
                                  : 'إتلاف'}
                              </td>

                              <td>
                                {movement.quantityText}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
            </section>
          )}
        </div>
      )}

      {/* ==============================
          نافذة إضافة أو تعديل صنف
      ============================== */}

      {showItemModal && (
        <div
          className="inventory-modal-backdrop"
          onMouseDown={() =>
            setShowItemModal(false)
          }
        >
          <div
            className="inventory-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="inventory-modal-header">
              <div>
                <small>
                  إدارة الأصناف
                </small>

                <h2>
                  {editingItemId
                    ? 'تعديل الصنف'
                    : 'إضافة صنف جديد'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowItemModal(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="inventory-modal-body">
              <div className="inventory-first-row">
                <label>
                  <span>
                    اسم الصنف
                  </span>

                  <input
                    type="text"
                    value={itemName}
                    autoFocus
                    placeholder="مثال: فاصوليا"
                    onChange={(event) =>
                      setItemName(
                        event.target.value
                      )
                    }
                  />
                </label>

                <div className="inventory-type-field">
                  <span>
                    النوع
                  </span>

                  <div className="inventory-type-toggle">
                    <button
                      type="button"
                      className={
                        itemMode === 'count'
                          ? 'active'
                          : ''
                      }
                      onClick={() => {
                        setItemMode('count')
                        setPurchaseUnit('كرتون')
                        setConversion('24')
                      }}
                    >
                      <Boxes size={17} />
                      عدد
                    </button>

                    <button
                      type="button"
                      className={
                        itemMode === 'weight'
                          ? 'active'
                          : ''
                      }
                      onClick={() => {
                        setItemMode('weight')
                        setPurchaseUnit('كيس')
                        setConversion('25')
                      }}
                    >
                      <Scale size={17} />
                      وزن
                    </button>
                  </div>
                </div>
              </div>

              <div className="inventory-details-row">
                <label>
                  <span>
                    وحدة التخزين
                  </span>

                  <select
                    value={purchaseUnit}
                    onChange={(event) =>
                      setPurchaseUnit(
                        event.target.value
                      )
                    }
                  >
                    {itemMode === 'count' ? (
                      <>
                        <option value="كرتون">
                          كرتون
                        </option>

                        <option value="باكيت">
                          باكيت
                        </option>

                        <option value="حبة">
                          حبة
                        </option>
                      </>
                    ) : (
                      <>
                        <option value="كيس">
                          كيس
                        </option>

                        <option value="كيلو">
                          كيلو
                        </option>
                      </>
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    {itemMode === 'count'
                      ? `كم حبة داخل ${purchaseUnit}؟`
                      : `وزن ${purchaseUnit} بالكيلو`}
                  </span>

                  <div className="inventory-conversion-box">
                    <input
                      type="number"
                      min="1"
                      step={
                        itemMode === 'count'
                          ? '1'
                          : '0.001'
                      }
                      value={conversion}
                      onChange={(event) =>
                        setConversion(
                          event.target.value
                        )
                      }
                    />

                    <small>
                      {itemMode === 'count'
                        ? 'حبة'
                        : 'كجم'}
                    </small>
                  </div>
                </label>
              </div>

                            {!editingItemId && (
                <div className="inventory-initial-entry">

                  <div className="inventory-initial-entry-title">
                    <PackagePlus size={18} />

                    <div>
                      <strong>
                        الكمية عند البداية
                      </strong>

                      <small>
                        كم {purchaseUnit} موجود الآن؟
                        تاريخ الدخول يُسجل تلقائيًا اليوم.
                      </small>
                    </div>
                  </div>

                  <label>
                    <span>
                      عدد {purchaseUnit}
                    </span>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="مثال: 5"
                      value={
                        initialStockAmount
                      }
                      onChange={(event) =>
                        setInitialStockAmount(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      انتهاء الصلاحية
                      {' '}
                      (إجباري)
                    </span>

                    <input
                      type="date"
                      min={todayDate()}
                      value={
                        initialStockExpiry
                      }
                      onChange={(event) =>
                        setInitialStockExpiry(
                          event.target.value
                        )
                      }
                    />
                  </label>

                </div>
              )}

<div className="inventory-low-setting">
                <div className="inventory-low-setting-title">
                  <AlertTriangle size={19} />

                  <div>
                    <strong>
                      تنبيه النقص
                    </strong>

                    <small>
                      نبهني إذا وصل المخزون إلى
                    </small>
                  </div>
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={lowAmount}
                  onChange={(event) =>
                    setLowAmount(
                      event.target.value
                    )
                  }
                />

                <select
                  value={lowUnit}
                  onChange={(event) =>
                    setLowUnit(
                      event.target.value
                    )
                  }
                >
                  <option value="purchase">
                    {purchaseUnit}
                  </option>

                  {itemMode === 'count' ? (
                    <option value="base">
                      حبة
                    </option>
                  ) : (
                    <>
                      <option value="kg">
                        كيلو
                      </option>

                      <option value="gram">
                        جرام
                      </option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="inventory-modal-actions">
              <button
                type="button"
                className="cancel"
                onClick={() =>
                  setShowItemModal(false)
                }
              >
                إلغاء
              </button>

              <button
                type="button"
                className="save"
                onClick={saveItem}
              >
                <Save size={18} />
                حفظ الصنف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================
          نافذة إضافة كمية للمخزون
      ============================== */}

      {showQuantityModal && quantityItem && (
        <div
          className="inventory-modal-backdrop"
          onMouseDown={() =>
            setShowQuantityModal(false)
          }
        >
          <div
            className="inventory-modal inventory-quantity-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="inventory-modal-header">
              <div>
                <small>
                  إضافة للمخزون
                </small>

                <h2>
                  إضافة كمية
                </h2>

                <p>
                  {quantityItem.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowQuantityModal(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="inventory-quantity-current">
              <span>
                الموجود الآن
              </span>

              <strong>
                {formatStock(quantityItem)}
              </strong>
            </div>

            <div className="inventory-modal-body">
              <div className="inventory-quantity-fields">

                <label>
                  <span>
                    الوحدة
                  </span>

                  <select
                    value={quantityUnit}
                    onChange={(event) =>
                      setQuantityUnit(
                        event.target.value
                      )
                    }
                  >
                    {unitOptions(
                      quantityItem
                    ).map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>
                    الكمية الجديدة
                  </span>

                  <input
                    type="number"
                    min="1"
                    step={
                      quantityItem.mode ===
                      'count'
                        ? '1'
                        : '0.001'
                    }
                    value={quantityAmount}
                    onChange={(event) =>
                      setQuantityAmount(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    تاريخ انتهاء الصلاحية
                    {' '}
                    (اختياري)
                  </span>

                  <input
                    type="date"
                    min={quantityDate}
                    value={
                      quantityExpiryDate
                    }
                    onChange={(event) =>
                      setQuantityExpiryDate(
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              {quantityAmount && (
                <div className="inventory-quantity-preview">
                  <PackagePlus size={21} />

                  <div>
                    <small>
                      بعد الإضافة
                    </small>

                    <strong>
                      {formatStock(
                        quantityItem,
                        quantityPreview
                      )}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            <div className="inventory-modal-actions">
              <button
                type="button"
                className="cancel"
                onClick={() =>
                  setShowQuantityModal(false)
                }
              >
                إلغاء
              </button>

              <button
                type="button"
                className="save"
                onClick={saveQuantity}
              >
                <PackagePlus size={18} />
                حفظ الكمية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================
          نافذة الجرد
      ============================== */}

      {showAudit && auditItem && (
        <div
          className="inventory-modal-backdrop"
          onMouseDown={() =>
            setShowAudit(false)
          }
        >
          <div
            className="inventory-modal inventory-audit-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="inventory-modal-header">
              <div>
                <small>
                  جرد المخزون
                </small>

                <h2>
                  {auditItem.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAudit(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="inventory-audit-system-value">
              <span>
                الموجود حسب النظام
              </span>

              <strong>
                {formatStock(auditItem)}
              </strong>
            </div>

            <div className="inventory-modal-body">
              <div className="inventory-audit-fields">
                <label>
                  <span>
                    الموجود فعليًا
                  </span>

                  <input
                    type="number"
                    min="0"
                    step={
                      auditItem.mode === 'count'
                        ? '1'
                        : '0.001'
                    }
                    value={auditAmount}
                    onChange={(event) =>
                      setAuditAmount(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    الوحدة
                  </span>

                  <select
                    value={auditUnit}
                    onChange={(event) =>
                      setAuditUnit(
                        event.target.value
                      )
                    }
                  >
                    {unitOptions(
                      auditItem
                    ).map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {auditAmount !== '' && (
                <div className="inventory-audit-result">
                  <ClipboardCheck size={21} />

                  <strong>
                    {Math.abs(
                      auditDifference
                    ) < EPS
                      ? 'مطابق تمامًا'
                      : auditDifference < 0
                      ? `نقص: ${formatAmount(
                          auditItem,
                          auditDifference
                        )}`
                      : `زيادة: ${formatAmount(
                          auditItem,
                          auditDifference
                        )}`}
                  </strong>
                </div>
              )}
            </div>

            <div className="inventory-modal-actions">
              <button
                type="button"
                className="cancel"
                onClick={() =>
                  setShowAudit(false)
                }
              >
                إلغاء
              </button>

              <button
                type="button"
                className="save"
                onClick={saveAudit}
              >
                <Save size={18} />
                حفظ الجرد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================
          نافذة تفاصيل الدفعات
      ============================== */}

      {batchItem && (
        <div
          className="inventory-modal-backdrop"
          onMouseDown={() =>
            setBatchItemId('')
          }
        >
          <div
            className="inventory-modal"
            style={{
              width: 'min(780px, 95vw)',
              maxWidth: '780px',
              maxHeight: '88vh',
              overflowY: 'auto',
            }}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="inventory-modal-header">
              <div>
                <small>
                  دفعات المخزون
                </small>

                <h2>
                  {batchItem.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setBatchItemId('')
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="inventory-modal-body">
              <div className="display-simple-note">
                يُحفظ تاريخ دخول وصلاحية
                كل دفعة على حدة.
                البيانات القديمة بدون تاريخ
                يمكن تحديثها من هنا.
              </div>

              <div className="display-simple-scroll">
                <table className="display-simple-table">
                  <thead>
                    <tr>
                      <th>تاريخ الدخول</th>
                      <th>الصلاحية</th>
                      <th>المستودع</th>

                      {section === 'cafeteria' && (
                        <th>العرض</th>
                      )}

                      <th>العملية</th>
                    </tr>
                  </thead>

                  <tbody>
                    {batchItemRows.map(
                      (batch) => (
                        <tr key={batch.id}>
                          <td>
                            {batch.receivedDate ||
                              'غير معروف'}
                          </td>

                          <td>
                            {batch.expiryDate ||
                              'غير مسجلة'}
                          </td>

                          <td>
                            {formatStock(
                              batchItem,
                              batch.warehouseBase
                            )}
                          </td>

                          {section === 'cafeteria' && (
                            <td>
                              {formatStock(
                                batchItem,
                                batch.displayBase
                              )}
                            </td>
                          )}

                          <td>
                            <button
                              type="button"
                              className="display-simple-secondary"
                              onClick={() => {
                                setEditBatchId(
                                  batch.id
                                )
                                setBatchReceivedDate(
                                  batch.receivedDate
                                )
                                setBatchExpiryDate(
                                  batch.expiryDate
                                )
                              }}
                            >
                              <Edit3 size={14} />
                              تعديل التواريخ
                            </button>

                              <button
                                type="button"
                                className="display-simple-secondary display-simple-danger"
                                onClick={() =>
                                  deleteInventoryBatch(batch)
                                }
                              >
                                <Trash2 size={14} />
                                حذف
                              </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {editBatchId && (
                <div className="display-simple-note">
                  <div className="display-simple-fields">
                    <label>
                      تاريخ الدخول

                      <input
                        className="display-simple-input"
                        type="date"
                        value={batchReceivedDate}
                        onChange={(event) =>
                          setBatchReceivedDate(
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      تاريخ الصلاحية (اختياري)

                      <input
                        className="display-simple-input"
                        type="date"
                        value={batchExpiryDate}
                        onChange={(event) =>
                          setBatchExpiryDate(
                            event.target.value
                          )
                        }
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="display-simple-button"
                    onClick={saveBatchDates}
                  >
                    <Save size={17} />
                    حفظ التواريخ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
