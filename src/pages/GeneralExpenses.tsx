import {
  useMemo,
  useState,
} from 'react'

import {
  CalendarDays,
  Pencil,
  Plus,
  Save,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react'

import './GeneralExpenses.css'

type GeneralExpense = {
  id: number
  date: string
  reason: string
  amount: string
}

function getTodayDate() {
  const now =
    new Date()

  const year =
    now.getFullYear()

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, '0')

  const day =
    String(
      now.getDate()
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getCurrentMonth() {
  return getTodayDate()
    .slice(0, 7)
}

function normalizeDigits(
  value: string
) {
  const arabicDigits =
    '٠١٢٣٤٥٦٧٨٩'

  const persianDigits =
    '۰۱۲۳۴۵۶۷۸۹'

  return value
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          arabicDigits.indexOf(
            digit
          )
        )
    )
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          persianDigits.indexOf(
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
    .replace(/,/g, '')
    .replace(/[^\d]/g, '')
}

function formatMoneyInput(
  value: string
) {
  const cleaned =
    cleanMoney(value)

  if (!cleaned) {
    return ''
  }

  return Number(
    cleaned
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

function formatDate(
  value: string
) {
  if (!value) {
    return ''
  }

  const [
    year,
    month,
    day,
  ] = value.split('-')

  return `${day}/${month}/${year}`
}

function GeneralExpenses() {
  const [
    expenses,
    setExpenses,
  ] = useState<
    GeneralExpense[]
  >([])

  const [
    date,
    setDate,
  ] = useState(
    getTodayDate()
  )

  const [
    reason,
    setReason,
  ] = useState('')

  const [
    amount,
    setAmount,
  ] = useState('')

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    getCurrentMonth()
  )

  const [
    editingExpense,
    setEditingExpense,
  ] = useState<
    GeneralExpense | null
  >(null)

  const filteredExpenses =
    useMemo(() => {
      return expenses
        .filter(
          (expense) =>
            expense.date.startsWith(
              selectedMonth
            )
        )
        .sort(
          (a, b) =>
            b.date.localeCompare(
              a.date
            )
        )
    }, [
      expenses,
      selectedMonth,
    ])

  const monthTotal =
    useMemo(() => {
      return filteredExpenses.reduce(
        (sum, expense) =>
          sum +
          (
            Number(
              expense.amount
            ) || 0
          ),
        0
      )
    }, [
      filteredExpenses,
    ])

  function resetForm() {
    setDate(
      getTodayDate()
    )

    setReason('')
    setAmount('')
    setEditingExpense(null)
  }

  function saveExpense() {
    const cleanReason =
      reason.trim()

    const cleanAmount =
      cleanMoney(amount)

    if (!date) {
      alert(
        'اختر التاريخ.'
      )

      return
    }

    if (!cleanReason) {
      alert(
        'اكتب سبب الصرف.'
      )

      return
    }

    if (
      !cleanAmount ||
      Number(
        cleanAmount
      ) <= 0
    ) {
      alert(
        'اكتب المبلغ.'
      )

      return
    }

    if (editingExpense) {
      setExpenses(
        (current) =>
          current.map(
            (expense) =>
              expense.id ===
              editingExpense.id
                ? {
                    ...expense,
                    date,
                    reason:
                      cleanReason,
                    amount:
                      cleanAmount,
                  }
                : expense
          )
      )

      resetForm()

      alert(
        'تم تعديل الخرج.'
      )

      return
    }

    const newExpense:
      GeneralExpense = {
        id: Date.now(),
        date,
        reason:
          cleanReason,
        amount:
          cleanAmount,
      }

    setExpenses(
      (current) => [
        ...current,
        newExpense,
      ]
    )

    setSelectedMonth(
      date.slice(0, 7)
    )

    resetForm()

    alert(
      'تم حفظ الخرج.'
    )
  }

  function editExpense(
    expense: GeneralExpense
  ) {
    setEditingExpense(
      expense
    )

    setDate(
      expense.date
    )

    setReason(
      expense.reason
    )

    setAmount(
      expense.amount
    )

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function deleteExpense(
    expense: GeneralExpense
  ) {
    const accepted =
      window.confirm(
        `هل تريد حذف "${expense.reason}"؟`
      )

    if (!accepted) {
      return
    }

    setExpenses(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            expense.id
        )
    )

    if (
      editingExpense?.id ===
      expense.id
    ) {
      resetForm()
    }
  }

  return (
    <div
      className="general-expenses-page"
      dir="rtl"
    >

      <section className="general-expenses-header">

        <div className="general-expenses-title">

          <span>
            إدارة الخرج
          </span>

          <h1>
            الخرج العام
          </h1>

          <p>
            تسجيل المصاريف التي تحدث
            عند الحاجة وليست من الخرج
            اليومي الثابت
          </p>

        </div>

        <div className="general-expenses-header-icon">

          <WalletCards
            size={30}
          />

        </div>

      </section>

      <section className="general-expense-entry">

        <div className="general-expense-entry-title">

          <div>

            <span>
              {editingExpense
                ? 'تعديل خرج'
                : 'تسجيل خرج جديد'}
            </span>

            <h2>
              {editingExpense
                ? 'تعديل العملية'
                : 'إضافة خرج عام'}
            </h2>

          </div>

          {editingExpense && (

            <button
              type="button"
              className="cancel-edit-button"
              onClick={
                resetForm
              }
            >

              <X
                size={16}
              />

              إلغاء التعديل

            </button>

          )}

        </div>

        <div className="general-expense-form">

          <label className="general-reason-field">

            سبب الصرف

            <input
              type="text"
              placeholder="مثال: كهرباء، إصلاح موتور، الصحة..."
              value={reason}
              onChange={(
                event
              ) =>
                setReason(
                  event.target
                    .value
                )
              }
            />

          </label>

          <label>

            المبلغ

            <div className="general-money-field">

              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                placeholder="0"
                value={
                  formatMoneyInput(
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

          </label>

          <label>

            التاريخ

            <div className="general-date-field">

              <CalendarDays
                size={17}
              />

              <input
                type="date"
                value={date}
                onChange={(
                  event
                ) =>
                  setDate(
                    event.target
                      .value
                  )
                }
              />

            </div>

          </label>

          <button
            type="button"
            className="save-general-expense-button"
            onClick={
              saveExpense
            }
          >

            {editingExpense ? (
              <>
                <Save
                  size={18}
                />

                حفظ التعديل
              </>
            ) : (
              <>
                <Plus
                  size={18}
                />

                حفظ الخرج
              </>
            )}

          </button>

        </div>

      </section>

      <section className="general-expenses-record">

        <div className="general-expenses-record-header">

          <div>

            <span>
              السجل
            </span>

            <h2>
              سجل الخرج العام
            </h2>

          </div>

          <label className="general-month-filter">

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

        </div>

        <div className="general-expenses-summary-card">

          <div>

            <span>
              عدد العمليات
            </span>

            <strong>
              {
                filteredExpenses.length
              }
            </strong>

          </div>

          <div className="general-month-total">

            <span>
              إجمالي الخرج العام للشهر
            </span>

            <strong>

              {formatMoney(
                monthTotal
              )}
              {' '}
              ريال

            </strong>

          </div>

        </div>

        {filteredExpenses.length ===
        0 ? (

          <div className="general-expenses-empty">

            <WalletCards
              size={30}
            />

            <strong>
              لا يوجد خرج عام مسجل
              لهذا الشهر
            </strong>

            <span>
              عندما تسجل خرجًا سيظهر
              هنا مباشرة
            </span>

          </div>

        ) : (

          <div className="general-expenses-table-wrapper">

            <table className="general-expenses-table">

              <thead>

                <tr>

                  <th>
                    التاريخ
                  </th>

                  <th>
                    سبب الصرف
                  </th>

                  <th>
                    المبلغ
                  </th>

                  <th>
                    الإجراءات
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredExpenses.map(
                  (expense) => (

                    <tr
                      key={
                        expense.id
                      }
                    >

                      <td className="general-expense-date">

                        {formatDate(
                          expense.date
                        )}

                      </td>

                      <td className="general-expense-reason">

                        {
                          expense.reason
                        }

                      </td>

                      <td className="general-expense-amount">

                        {formatMoney(
                          Number(
                            expense.amount
                          ) || 0
                        )}
                        {' '}
                        ريال

                      </td>

                      <td>

                        <div className="general-expense-actions">

                          <button
                            type="button"
                            className="general-edit-button"
                            onClick={() =>
                              editExpense(
                                expense
                              )
                            }
                          >

                            <Pencil
                              size={15}
                            />

                            تعديل

                          </button>

                          <button
                            type="button"
                            className="general-delete-button"
                            onClick={() =>
                              deleteExpense(
                                expense
                              )
                            }
                          >

                            <Trash2
                              size={15}
                            />

                            حذف

                          </button>

                        </div>

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

export default GeneralExpenses