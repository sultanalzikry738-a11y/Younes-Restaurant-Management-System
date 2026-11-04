import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Trash2,
} from 'lucide-react'

import './DailyExpenses.css'

type ExpenseRecord = {
  id: number
  date: string
  itemName: string
  amount: string
  note: string
}

const initialExpenseTypes = [
  'لحم',
  'موكا',
  'ثلج',
  'خبز',
  'وايت',
  'كوثر',
  'روتي يمني',
  'خضرة',
]

const TYPES_STORAGE_KEY =
  'younes_expense_types'

const RECORDS_STORAGE_KEY =
  'younes_expense_records'

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

function normalizeDigits(
  value: string
) {
  const arabicDigits =
    '٠١٢٣٤٥٦٧٨٩'

  const persianDigits =
    '۰۱۲۳۴۵۶۷۸۹'

  let result =
    value

  result =
    result.replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          arabicDigits.indexOf(
            digit
          )
        )
    )

  result =
    result.replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          persianDigits.indexOf(
            digit
          )
        )
    )

  return result
}

function cleanMoney(
  value: string
) {
  return normalizeDigits(
    value
  )
    .replace(
      /,/g,
      ''
    )
    .replace(
      /[^\d]/g,
      ''
    )
}

function formatInput(
  value: string
) {
  if (!value) {
    return ''
  }

  const clean =
    cleanMoney(
      value
    )

  if (!clean) {
    return ''
  }

  return Number(
    clean
  ).toLocaleString(
    'en-US'
  )
}

function formatMoney(
  value: number
) {
  return value.toLocaleString(
    'en-US'
  )
}

function loadExpenseTypes() {
  try {
    const saved =
      localStorage.getItem(
        TYPES_STORAGE_KEY
      )

    if (!saved) {
      return initialExpenseTypes
    }

    const parsed =
      JSON.parse(
        saved
      )

    if (
      !Array.isArray(
        parsed
      )
    ) {
      return initialExpenseTypes
    }

    const validItems =
      parsed.filter(
        (item) =>
          typeof item ===
            'string' &&
          item.trim()
      )

    return Array.from(
      new Set([
        ...initialExpenseTypes,
        ...validItems,
      ])
    )
  } catch {
    return initialExpenseTypes
  }
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

    if (
      !Array.isArray(
        parsed
      )
    ) {
      return []
    }

    return parsed
  } catch {
    return []
  }
}

function DailyExpenses() {
  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getTodayDate()
  )

  const [
    expenseTypes,
    setExpenseTypes,
  ] = useState<string[]>(
    loadExpenseTypes
  )

  const [
    records,
    setRecords,
  ] = useState<
    ExpenseRecord[]
  >(
    loadRecords
  )

  const [
    itemName,
    setItemName,
  ] = useState('')

  const [
    amount,
    setAmount,
  ] = useState('')

  const [
    note,
    setNote,
  ] = useState('')

  const [
    showSuggestions,
    setShowSuggestions,
  ] = useState(false)

  const comboRef =
    useRef<HTMLDivElement | null>(
      null
    )

  useEffect(
    () => {
      function handleOutsideClick(
        event: MouseEvent
      ) {
        if (
          comboRef.current &&
          !comboRef.current.contains(
            event.target as Node
          )
        ) {
          setShowSuggestions(
            false
          )
        }
      }

      function handleKeyDown(
        event: KeyboardEvent
      ) {
        if (
          event.key ===
          'Escape'
        ) {
          setShowSuggestions(
            false
          )
        }
      }

      document.addEventListener(
        'mousedown',
        handleOutsideClick
      )

      document.addEventListener(
        'keydown',
        handleKeyDown
      )

      return () => {
        document.removeEventListener(
          'mousedown',
          handleOutsideClick
        )

        document.removeEventListener(
          'keydown',
          handleKeyDown
        )
      }
    },
    []
  )

  const selectedRecords =
    useMemo(
      () =>
        records.filter(
          (record) =>
            record.date ===
            selectedDate
        ),
      [
        records,
        selectedDate,
      ]
    )

  const filteredTypes =
    useMemo(() => {
      const search =
        itemName
          .trim()
          .toLowerCase()

      if (!search) {
        return expenseTypes
      }

      return expenseTypes.filter(
        (item) =>
          item
            .toLowerCase()
            .includes(
              search
            )
      )
    }, [
      expenseTypes,
      itemName,
    ])

  const exactTypeExists =
    useMemo(() => {
      const search =
        itemName
          .trim()
          .toLowerCase()

      if (!search) {
        return false
      }

      return expenseTypes.some(
        (item) =>
          item
            .trim()
            .toLowerCase() ===
          search
      )
    }, [
      expenseTypes,
      itemName,
    ])

  const dayTotal =
    useMemo(
      () =>
        selectedRecords.reduce(
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
        ),
      [
        selectedRecords,
      ]
    )

  function saveTypes(
    types: string[]
  ) {
    localStorage.setItem(
      TYPES_STORAGE_KEY,
      JSON.stringify(
        types
      )
    )
  }

  function saveRecords(
    newRecords:
      ExpenseRecord[]
  ) {
    setRecords(
      newRecords
    )

    localStorage.setItem(
      RECORDS_STORAGE_KEY,
      JSON.stringify(
        newRecords
      )
    )
  }

  function resetEntryRow() {
    setItemName('')
    setAmount('')
    setNote('')
    setShowSuggestions(
      false
    )
  }

  function chooseType(
    type: string
  ) {
    setItemName(
      type
    )

    setShowSuggestions(
      false
    )
  }

  function addExpense() {
    if (!selectedDate) {
      alert(
        'اختر التاريخ.'
      )

      return
    }

    const cleanName =
      itemName.trim()

    if (!cleanName) {
      alert(
        'اختر أو اكتب نوع الخرج.'
      )

      return
    }

    const cleanAmount =
      cleanMoney(
        amount
      )

    if (!cleanAmount) {
      alert(
        'اكتب المبلغ.'
      )

      return
    }

    const alreadyExists =
      expenseTypes.some(
        (item) =>
          item
            .trim()
            .toLowerCase() ===
          cleanName
            .toLowerCase()
      )

    if (!alreadyExists) {
      const newTypes = [
        ...expenseTypes,
        cleanName,
      ]

      setExpenseTypes(
        newTypes
      )

      saveTypes(
        newTypes
      )
    }

    const newRecord:
      ExpenseRecord = {
      id:
        Date.now(),

      date:
        selectedDate,

      itemName:
        cleanName,

      amount:
        cleanAmount,

      note:
        note.trim(),
    }

    const newRecords = [
      ...records,
      newRecord,
    ]

    saveRecords(
      newRecords
    )

    resetEntryRow()
  }

  function deleteRecord(
    record: ExpenseRecord
  ) {
    const accepted =
      window.confirm(
        `هل تريد حذف "${record.itemName}"؟`
      )

    if (!accepted) {
      return
    }

    const newRecords =
      records.filter(
        (item) =>
          item.id !==
          record.id
      )

    saveRecords(
      newRecords
    )
  }

  return (
    <div
      className="daily-expenses-page"
      dir="rtl"
    >

      <style>{`

        .quick-expense-page {
          margin-top: 18px;
        }

        .quick-expense-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          padding: 22px;
          border: 1px solid #e2d5c8;
          border-radius: 18px;
          background: #fffdf9;
          margin-bottom: 16px;
        }

        .quick-expense-title span {
          color:
            var(--theme-main);
          font-size: 10px;
          font-weight: 900;
        }

        .quick-expense-title h2 {
          margin: 5px 0 0;
          color:
            var(--theme-dark);
          font-size: 25px;
        }

        .quick-date-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #6f625c;
          font-size: 10px;
          font-weight: 900;
        }

        .quick-date-input {
          position: relative;
        }

        .quick-date-input svg {
          position: absolute;
          right: 12px;
          top: 50%;
          transform:
            translateY(-50%);
          color:
            var(--theme-main);
          pointer-events: none;
        }

        .quick-date-input input {
          height: 44px;
          min-width: 190px;
          box-sizing:
            border-box;
          border:
            1px solid #dfd2c5;
          border-radius: 10px;
          background:
            var(--theme-soft-2);
          color:
            var(--theme-dark);
          padding:
            0 40px 0 12px;
          outline: none;
          font-family: inherit;
        }

        .quick-date-input input:focus {
          border-color:
            var(--theme-main);
          box-shadow:
            0 0 0 3px
            var(--theme-soft);
        }

        .quick-day-total {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 16px;
          padding: 16px 18px;
          margin-bottom: 14px;
          border:
            1px solid #e1d1c1;
          border-radius: 13px;
          background:
            var(--theme-soft);
        }

        .quick-day-total div {
          display: flex;
          align-items: center;
          gap: 9px;
          color:
            var(--theme-main);
        }

        .quick-day-total span {
          font-size: 10px;
          font-weight: 900;
        }

        .quick-day-total strong {
          color:
            var(--theme-dark);
          font-size: 20px;
          font-weight: 900;
        }

        .quick-expense-box {
          border:
            1px solid #e2d6ca;
          border-radius: 15px;
          background: white;
          overflow: visible;
        }

        .quick-expense-box-header {
          padding: 17px 18px;
          border-bottom:
            1px solid #eee4da;
        }

        .quick-expense-box-header span {
          color:
            var(--theme-main);
          font-size: 9px;
          font-weight: 900;
        }

        .quick-expense-box-header h3 {
          margin: 4px 0 0;
          color:
            var(--theme-dark);
          font-size: 19px;
        }

        .quick-table-wrapper {
          overflow: visible;
        }

        .quick-table {
          width: 100%;
          min-width: 800px;
          border-collapse:
            collapse;
        }

        .quick-table thead {
          background:
            var(--theme-soft);
        }

        .quick-table th {
          padding: 13px 15px;
          text-align: right;
          color:
            var(--theme-main);
          font-size: 10px;
          font-weight: 900;
          border-bottom:
            1px solid #e7d9cc;
        }

        .quick-table td {
          padding: 12px 15px;
          border-bottom:
            1px solid #eee4da;
          vertical-align: middle;
        }

        .quick-entry-row {
          background:
            var(--theme-soft-2);
        }

        .expense-type-combobox {
          position: relative;
          min-width: 240px;
        }

        .expense-type-input-wrapper {
          position: relative;
        }

        .expense-type-input-wrapper input {
          width: 100%;
          height: 44px;
          box-sizing:
            border-box;
          border:
            1px solid #dfd2c5;
          border-radius: 9px;
          background:
            var(--theme-soft-2);
          color:
            var(--theme-dark);
          padding:
            0 12px 0 40px;
          outline: none;
          font-family: inherit;
        }

        .expense-type-input-wrapper input:focus {
          border-color:
            var(--theme-main);
          box-shadow:
            0 0 0 3px
            var(--theme-soft);
        }

        .expense-type-arrow {
          position: absolute;
          left: 11px;
          top: 50%;
          transform:
            translateY(-50%);
          color:
            var(--theme-main);
          pointer-events: none;
        }

        .expense-type-suggestions {
          position: absolute;
          top:
            calc(100% + 5px);
          right: 0;
          left: 0;
          z-index: 100;
          max-height: 230px;
          overflow-y: auto;
          border:
            1px solid #decfc2;
          border-radius: 10px;
          background: #fffdf9;
          box-shadow:
            0 12px 35px
            var(--theme-shadow);
          padding: 5px;
        }

        .expense-type-option {
          width: 100%;
          min-height: 38px;
          border: none;
          border-radius: 7px;
          background:
            transparent;
          color:
            var(--theme-dark);
          text-align: right;
          padding: 0 10px;
          font-family: inherit;
          cursor: pointer;
        }

        .expense-type-option:hover {
          background:
            var(--theme-soft);
        }

        .expense-new-type {
          padding: 10px;
          color: #7b675f;
          font-size: 9px;
          line-height: 1.7;
        }

        .expense-new-type strong {
          color:
            var(--theme-main);
        }

        .quick-money-field {
          position: relative;
          min-width: 165px;
        }

        .quick-money-field input {
          width: 100%;
          height: 44px;
          box-sizing:
            border-box;
          border:
            1px solid #dfd2c5;
          border-radius: 9px;
          background:
            var(--theme-soft-2);
          color:
            var(--theme-dark);
          outline: none;
          padding:
            0 12px 0 50px;
          font-family: inherit;
        }

        .quick-money-field input:focus {
          border-color:
            var(--theme-main);
          box-shadow:
            0 0 0 3px
            var(--theme-soft);
        }

        .quick-money-field span {
          position: absolute;
          left: 11px;
          top: 50%;
          transform:
            translateY(-50%);
          color: #91827b;
          font-size: 9px;
        }

        .quick-note-input {
          width: 100%;
          min-width: 230px;
          height: 44px;
          box-sizing:
            border-box;
          border:
            1px solid #dfd2c5;
          border-radius: 9px;
          background:
            var(--theme-soft-2);
          color:
            var(--theme-dark);
          padding: 0 12px;
          outline: none;
          font-family: inherit;
        }

        .quick-note-input:focus {
          border-color:
            var(--theme-main);
          box-shadow:
            0 0 0 3px
            var(--theme-soft);
        }

        .quick-add-button {
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 10px;
          background:
            var(--theme-main);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow:
            0 7px 18px
            var(--theme-shadow);
        }

        .quick-add-button:hover {
          background:
            var(--theme-dark);
        }

        .quick-record-name {
          color:
            var(--theme-dark);
          font-weight: 900;
        }

        .quick-record-amount {
          color:
            var(--theme-main);
          font-weight: 900;
          white-space: nowrap;
        }

        .quick-record-note {
          color: #756660;
        }

        .quick-delete-button {
          width: 34px;
          height: 34px;
          border: none;
          border-radius: 9px;
          background: #f9e8e8;
          color: #a33333;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .quick-empty-row td {
          padding: 36px 15px;
          text-align: center;
          color: #938079;
          font-size: 11px;
        }

        @media (
          max-width: 900px
        ) {

          .quick-table-wrapper {
            overflow-x: auto;
          }

        }

      `}</style>

      <div
        className="quick-expense-page"
      >

        <section
          className="quick-expense-header"
        >

          <div
            className="quick-expense-title"
          >

            <span>
              إدارة الخرج
            </span>

            <h2>
              الخرج اليومي
            </h2>

          </div>

          <label
            className="quick-date-field"
          >

            التاريخ

            <div
              className="quick-date-input"
            >

              <CalendarDays
                size={17}
              />

              <input
                type="date"
                value={
                  selectedDate
                }
                onChange={(
                  event
                ) => {
                  setSelectedDate(
                    event.target
                      .value
                  )

                  resetEntryRow()
                }}
              />

            </div>

          </label>

        </section>

        <div
          className="quick-day-total"
        >

          <div>

            <CircleDollarSign
              size={20}
            />

            <span>
              إجمالي خرج هذا اليوم
            </span>

          </div>

          <strong>

            {
              formatMoney(
                dayTotal
              )
            }
            {' '}
            ريال

          </strong>

        </div>

        <section
          className="quick-expense-box"
        >

          <div
            className="quick-expense-box-header"
          >

            <span>
              سجل اليوم
            </span>

            <h3>
              المصاريف المسجلة
            </h3>

          </div>

          <div
            className="quick-table-wrapper"
          >

            <table
              className="quick-table"
            >

              <thead>

                <tr>

                  <th>
                    نوع الخرج
                  </th>

                  <th>
                    المبلغ
                  </th>

                  <th>
                    الملاحظة
                  </th>

                  <th>
                    إضافة
                  </th>

                  <th>
                    حذف
                  </th>

                </tr>

              </thead>

              <tbody>

                <tr
                  className="quick-entry-row"
                >

                  <td>

                    <div
                      ref={
                        comboRef
                      }
                      className="expense-type-combobox"
                    >

                      <div
                        className="expense-type-input-wrapper"
                      >

                        <input
                          type="text"
                          placeholder="اختر أو اكتب نوع الخرج"
                          value={
                            itemName
                          }
                          onFocus={() =>
                            setShowSuggestions(
                              true
                            )
                          }
                          onChange={(
                            event
                          ) => {
                            setItemName(
                              event.target
                                .value
                            )

                            setShowSuggestions(
                              true
                            )
                          }}
                        />

                        <ChevronDown
                          className="expense-type-arrow"
                          size={17}
                        />

                      </div>

                      {showSuggestions && (

                        <div
                          className="expense-type-suggestions"
                        >

                          {filteredTypes.map(
                            (type) => (

                              <button
                                key={
                                  type
                                }
                                type="button"
                                className="expense-type-option"
                                onClick={() =>
                                  chooseType(
                                    type
                                  )
                                }
                              >
                                {type}
                              </button>

                            )
                          )}

                          {itemName.trim() &&
                            !exactTypeExists && (

                            <div
                              className="expense-new-type"
                            >

                              النوع الجديد:
                              {' '}

                              <strong>
                                {
                                  itemName.trim()
                                }
                              </strong>

                              <br />

                              سيُضاف للقائمة
                              بعد الضغط على ✓

                            </div>

                          )}

                        </div>

                      )}

                    </div>

                  </td>

                  <td>

                    <div
                      className="quick-money-field"
                    >

                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        placeholder="0"
                        value={
                          formatInput(
                            amount
                          )
                        }
                        onChange={(
                          event
                        ) =>
                          setAmount(
                            cleanMoney(
                              event.target
                                .value
                            )
                          )
                        }
                      />

                      <span>
                        ريال
                      </span>

                    </div>

                  </td>

                  <td>

                    <input
                      className="quick-note-input"
                      type="text"
                      placeholder="ملاحظة اختيارية"
                      value={
                        note
                      }
                      onChange={(
                        event
                      ) =>
                        setNote(
                          event.target
                            .value
                        )
                      }
                    />

                  </td>

                  <td>

                    <button
                      type="button"
                      className="quick-add-button"
                      onClick={
                        addExpense
                      }
                    >

                      <Check
                        size={20}
                      />

                    </button>

                  </td>

                  <td>
                    —
                  </td>

                </tr>

                {selectedRecords.length ===
                0 ? (

                  <tr
                    className="quick-empty-row"
                  >

                    <td
                      colSpan={5}
                    >
                      لا يوجد خرج مسجل
                      لهذا اليوم
                    </td>

                  </tr>

                ) : (

                  selectedRecords.map(
                    (record) => (

                      <tr
                        key={
                          record.id
                        }
                      >

                        <td
                          className="quick-record-name"
                        >

                          {
                            record.itemName
                          }

                        </td>

                        <td
                          className="quick-record-amount"
                        >

                          {
                            formatMoney(
                              Number(
                                record.amount
                              ) || 0
                            )
                          }
                          {' '}
                          ريال

                        </td>

                        <td
                          className="quick-record-note"
                        >

                          {
                            record.note ||
                            '—'
                          }

                        </td>

                        <td>
                          —
                        </td>

                        <td>

                          <button
                            type="button"
                            className="quick-delete-button"
                            onClick={() =>
                              deleteRecord(
                                record
                              )
                            }
                          >

                            <Trash2
                              size={16}
                            />

                          </button>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>

    </div>
  )
}

export default DailyExpenses