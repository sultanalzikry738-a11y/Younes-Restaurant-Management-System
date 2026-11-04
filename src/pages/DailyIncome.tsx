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

type IncomeRecord = {
  id: number
  date: string
  typeName: string
  amount: string
  note: string
}

const DEFAULT_INCOME_TYPE =
  'مبيعات'

const initialIncomeTypes = [
  DEFAULT_INCOME_TYPE,
]

const TYPES_STORAGE_KEY =
  'younes_income_types'

const RECORDS_STORAGE_KEY =
  'younes_income_records'

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
  const arabic =
    '٠١٢٣٤٥٦٧٨٩'

  const persian =
    '۰۱۲۳۴۵۶۷۸۹'

  return value
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          arabic.indexOf(
            digit
          )
        )
    )
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          persian.indexOf(
            digit
          )
        )
    )
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

function loadIncomeTypes():
  string[] {
  try {
    const saved =
      localStorage.getItem(
        TYPES_STORAGE_KEY
      )

    if (!saved) {
      return initialIncomeTypes
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
      return initialIncomeTypes
    }

    return Array.from(
      new Set([
        DEFAULT_INCOME_TYPE,

        ...parsed.filter(
          (item) =>
            typeof item ===
              'string' &&
            item.trim()
        ),
      ])
    )
  } catch {
    return initialIncomeTypes
  }
}

function loadIncomeRecords():
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

function DailyIncome() {
  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getTodayDate()
  )

  const [
    incomeTypes,
    setIncomeTypes,
  ] = useState<string[]>(
    loadIncomeTypes
  )

  const [
    records,
    setRecords,
  ] = useState<
    IncomeRecord[]
  >(
    loadIncomeRecords
  )

  const [
    typeName,
    setTypeName,
  ] = useState(
    DEFAULT_INCOME_TYPE
  )

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

      function handleEscape(
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
        handleEscape
      )

      return () => {
        document.removeEventListener(
          'mousedown',
          handleOutsideClick
        )

        document.removeEventListener(
          'keydown',
          handleEscape
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
        typeName
          .trim()
          .toLowerCase()

      if (!search) {
        return incomeTypes
      }

      return incomeTypes.filter(
        (item) =>
          item
            .toLowerCase()
            .includes(
              search
            )
      )
    }, [
      incomeTypes,
      typeName,
    ])

  const exactTypeExists =
    useMemo(() => {
      const clean =
        typeName
          .trim()
          .toLowerCase()

      if (!clean) {
        return true
      }

      return incomeTypes.some(
        (item) =>
          item
            .trim()
            .toLowerCase() ===
          clean
      )
    }, [
      incomeTypes,
      typeName,
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
      IncomeRecord[]
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

  function resetEntry() {
    setTypeName(
      DEFAULT_INCOME_TYPE
    )

    setAmount('')
    setNote('')

    setShowSuggestions(
      false
    )
  }

  function chooseType(
    value: string
  ) {
    setTypeName(
      value
    )

    setShowSuggestions(
      false
    )
  }

  function addIncome() {
    if (!selectedDate) {
      alert(
        'اختر التاريخ.'
      )

      return
    }

    const cleanType =
      typeName.trim() ||
      DEFAULT_INCOME_TYPE

    const cleanAmount =
      cleanMoney(
        amount
      )

    if (!cleanAmount) {
      alert(
        'اكتب مبلغ الدخل.'
      )

      return
    }

    const alreadyExists =
      incomeTypes.some(
        (item) =>
          item
            .trim()
            .toLowerCase() ===
          cleanType
            .toLowerCase()
      )

    if (!alreadyExists) {
      const newTypes = [
        ...incomeTypes,
        cleanType,
      ]

      setIncomeTypes(
        newTypes
      )

      saveTypes(
        newTypes
      )
    }

    const newRecord:
      IncomeRecord = {
      id:
        Date.now(),

      date:
        selectedDate,

      typeName:
        cleanType,

      amount:
        cleanAmount,

      note:
        note.trim(),
    }

    saveRecords([
      ...records,
      newRecord,
    ])

    resetEntry()
  }

  function deleteRecord(
    record: IncomeRecord
  ) {
    const accepted =
      window.confirm(
        `هل تريد حذف دخل "${record.typeName}"؟`
      )

    if (!accepted) {
      return
    }

    saveRecords(
      records.filter(
        (item) =>
          item.id !==
          record.id
      )
    )
  }

  return (
    <div
      dir="rtl"
    >

      <style>{`

        .daily-income {
          margin-top: 18px;
        }

        .daily-income-header {
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

        .daily-income-title span {
          color: var(--theme-main);
          font-size: 10px;
          font-weight: 900;
        }

        .daily-income-title h2 {
          margin: 5px 0 0;
          color: var(--theme-dark);
          font-size: 25px;
        }

        .income-date {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #6f625c;
          font-size: 10px;
          font-weight: 900;
        }

        .income-date-box {
          position: relative;
        }

        .income-date-box svg {
          position: absolute;
          right: 12px;
          top: 50%;
          transform:
            translateY(-50%);
          color: var(--theme-main);
          pointer-events: none;
        }

        .income-date-box input {
          height: 44px;
          min-width: 190px;
          box-sizing: border-box;
          border: 1px solid #dfd2c5;
          border-radius: 10px;
          background: var(--theme-soft-2);
          color: var(--theme-dark);
          padding: 0 40px 0 12px;
          outline: none;
          font-family: inherit;
        }

        .income-date-box input:focus,
        .income-type-input input:focus,
        .income-money input:focus,
        .income-note:focus {
          border-color:
            var(--theme-main);

          box-shadow:
            0 0 0 3px
            var(--theme-soft);
        }

        .income-day-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 16px 18px;
          margin-bottom: 14px;
          border: 1px solid #e1d1c1;
          border-radius: 13px;
          background: var(--theme-soft);
        }

        .income-day-total div {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #786860;
        }

        .income-day-total span {
          font-size: 10px;
          font-weight: 900;
        }

        .income-day-total strong {
          color: var(--theme-dark);
          font-size: 20px;
          font-weight: 900;
        }

        .income-records {
          border: 1px solid #e2d6ca;
          border-radius: 15px;
          background: white;
          overflow: visible;
        }

        .income-records-header {
          padding: 17px 18px;
          border-bottom:
            1px solid #eee4da;
        }

        .income-records-header span {
          color: var(--theme-main);
          font-size: 9px;
          font-weight: 900;
        }

        .income-records-header h3 {
          margin: 4px 0 0;
          color: var(--theme-dark);
          font-size: 19px;
        }

        .income-table-wrapper {
          overflow-x: auto;
        }

        .income-table {
          width: 100%;
          min-width: 800px;
          border-collapse: collapse;
        }

        .income-table thead {
          background: var(--theme-soft);
        }

        .income-table th {
          padding: 13px 15px;
          text-align: right;
          color: var(--theme-main);
          font-size: 10px;
          font-weight: 900;
          border-bottom:
            1px solid #e7d9cc;
        }

        .income-table td {
          padding: 12px 15px;
          border-bottom:
            1px solid #eee4da;
          vertical-align: middle;
        }

        .income-entry-row {
          background: var(--theme-soft-2);
        }

        .income-type-combobox {
          position: relative;
          min-width: 240px;
        }

        .income-type-input {
          position: relative;
        }

        .income-type-input input {
          width: 100%;
          height: 44px;
          box-sizing: border-box;
          border: 1px solid #dfd2c5;
          border-radius: 9px;
          background: var(--theme-soft-2);
          color: var(--theme-dark);
          padding: 0 12px 0 40px;
          outline: none;
          font-family: inherit;
        }

        .income-type-input svg {
          position: absolute;
          left: 11px;
          top: 50%;
          transform:
            translateY(-50%);
          color: var(--theme-main);
          pointer-events: none;
        }

        .income-suggestions {
          position: absolute;
          top: calc(100% + 5px);
          right: 0;
          left: 0;
          z-index: 100;
          max-height: 230px;
          overflow-y: auto;
          border: 1px solid #decfc2;
          border-radius: 10px;
          background: #fffdf9;
          box-shadow:
            0 12px 35px
            var(--theme-shadow);
          padding: 5px;
        }

        .income-suggestion {
          width: 100%;
          min-height: 38px;
          border: none;
          border-radius: 7px;
          background: transparent;
          color: var(--theme-dark);
          text-align: right;
          padding: 0 10px;
          font-family: inherit;
          cursor: pointer;
        }

        .income-suggestion:hover {
          background: var(--theme-soft);
        }

        .income-new-type {
          padding: 10px;
          color: #7b675f;
          font-size: 9px;
          line-height: 1.7;
        }

        .income-new-type strong {
          color: var(--theme-main);
        }

        .income-money {
          position: relative;
          min-width: 165px;
        }

        .income-money input {
          width: 100%;
          height: 44px;
          box-sizing: border-box;
          border: 1px solid #dfd2c5;
          border-radius: 9px;
          background: var(--theme-soft-2);
          color: var(--theme-dark);
          outline: none;
          padding: 0 12px 0 50px;
          font-family: inherit;
        }

        .income-money span {
          position: absolute;
          left: 11px;
          top: 50%;
          transform:
            translateY(-50%);
          color: #91827b;
          font-size: 9px;
        }

        .income-note {
          width: 100%;
          min-width: 230px;
          height: 44px;
          box-sizing: border-box;
          border: 1px solid #dfd2c5;
          border-radius: 9px;
          background: var(--theme-soft-2);
          color: var(--theme-dark);
          padding: 0 12px;
          outline: none;
          font-family: inherit;
        }

        .income-add {
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 10px;
          background: var(--theme-main);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
        }

        .income-add:hover {
          background:
            var(--theme-dark);
        }

        .income-row-type {
          color: var(--theme-dark);
          font-weight: 900;
        }

        .income-row-money {
          color: var(--theme-main);
          font-weight: 900;
          white-space: nowrap;
        }

        .income-row-note {
          color: #756660;
        }

        .income-delete {
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

        .income-empty td {
          padding: 36px 15px;
          text-align: center;
          color: #938079;
          font-size: 11px;
        }

      `}</style>

      <div className="daily-income">

        <section className="daily-income-header">

          <div className="daily-income-title">

            <span>
              إدارة الدخل
            </span>

            <h2>
              الدخل اليومي
            </h2>

          </div>

          <label className="income-date">

            التاريخ

            <div className="income-date-box">

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

                  resetEntry()
                }}
              />

            </div>

          </label>

        </section>

        <div className="income-day-total">

          <div>

            <CircleDollarSign
              size={20}
            />

            <span>
              إجمالي دخل هذا اليوم
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

        <section className="income-records">

          <div className="income-records-header">

            <span>
              سجل اليوم
            </span>

            <h3>
              الإيرادات المسجلة
            </h3>

          </div>

          <div className="income-table-wrapper">

            <table className="income-table">

              <thead>

                <tr>

                  <th>
                    نوع الدخل
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

                <tr className="income-entry-row">

                  <td>

                    <div
                      ref={
                        comboRef
                      }
                      className="income-type-combobox"
                    >

                      <div className="income-type-input">

                        <input
                          type="text"
                          placeholder="مبيعات"
                          value={
                            typeName
                          }
                          onFocus={() =>
                            setShowSuggestions(
                              true
                            )
                          }
                          onChange={(
                            event
                          ) => {
                            setTypeName(
                              event.target
                                .value
                            )

                            setShowSuggestions(
                              true
                            )
                          }}
                        />

                        <ChevronDown
                          size={17}
                        />

                      </div>

                      {showSuggestions && (

                        <div className="income-suggestions">

                          {filteredTypes.map(
                            (type) => (

                              <button
                                key={
                                  type
                                }
                                type="button"
                                className="income-suggestion"
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

                          {typeName.trim() &&
                            !exactTypeExists && (

                            <div className="income-new-type">

                              النوع الجديد:
                              {' '}

                              <strong>
                                {
                                  typeName.trim()
                                }
                              </strong>

                              <br />

                              سيُحفظ في القائمة
                              بعد الضغط على ✓

                            </div>

                          )}

                        </div>

                      )}

                    </div>

                  </td>

                  <td>

                    <div className="income-money">

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
                      className="income-note"
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
                      className="income-add"
                      onClick={
                        addIncome
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

                  <tr className="income-empty">

                    <td colSpan={5}>
                      لا يوجد دخل مسجل
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

                        <td className="income-row-type">
                          {
                            record.typeName
                          }
                        </td>

                        <td className="income-row-money">

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

                        <td className="income-row-note">

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
                            className="income-delete"
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

export default DailyIncome