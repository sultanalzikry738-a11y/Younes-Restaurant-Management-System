import {
  useMemo,
  useState,
} from 'react'

import {
  CalendarDays,
  HandHelping,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'

import './Fazaat.css'

type Fazaa = {
  id: number
  date: string
  name: string
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

function Fazaat() {
  const [
    fazaat,
    setFazaat,
  ] = useState<
    Fazaa[]
  >([])

  const [
    date,
    setDate,
  ] = useState(
    getTodayDate()
  )

  const [
    name,
    setName,
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
    editingFazaa,
    setEditingFazaa,
  ] = useState<
    Fazaa | null
  >(null)

  const filteredFazaat =
    useMemo(() => {
      return fazaat
        .filter(
          (fazaa) =>
            fazaa.date.startsWith(
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
      fazaat,
      selectedMonth,
    ])

  const monthTotal =
    useMemo(() => {
      return filteredFazaat.reduce(
        (sum, fazaa) =>
          sum +
          (
            Number(
              fazaa.amount
            ) || 0
          ),
        0
      )
    }, [
      filteredFazaat,
    ])

  function resetForm() {
    setDate(
      getTodayDate()
    )

    setName('')
    setAmount('')
    setEditingFazaa(null)
  }

  function saveFazaa() {
    const cleanName =
      name.trim()

    const cleanAmount =
      cleanMoney(amount)

    if (!date) {
      alert(
        'اختر التاريخ.'
      )

      return
    }

    if (!cleanName) {
      alert(
        'اكتب اسم الشخص.'
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

    if (
      editingFazaa
    ) {
      setFazaat(
        (current) =>
          current.map(
            (fazaa) =>
              fazaa.id ===
              editingFazaa.id
                ? {
                    ...fazaa,
                    date,
                    name:
                      cleanName,
                    amount:
                      cleanAmount,
                  }
                : fazaa
          )
      )

      resetForm()

      alert(
        'تم تعديل الفزعة.'
      )

      return
    }

    const newFazaa:
      Fazaa = {
        id: Date.now(),
        date,
        name:
          cleanName,
        amount:
          cleanAmount,
      }

    setFazaat(
      (current) => [
        ...current,
        newFazaa,
      ]
    )

    setSelectedMonth(
      date.slice(0, 7)
    )

    resetForm()

    alert(
      'تم حفظ الفزعة.'
    )
  }

  function editFazaa(
    fazaa: Fazaa
  ) {
    setEditingFazaa(
      fazaa
    )

    setDate(
      fazaa.date
    )

    setName(
      fazaa.name
    )

    setAmount(
      fazaa.amount
    )

    window.scrollTo({
      top: 0,
      behavior:
        'smooth',
    })
  }

  function deleteFazaa(
    fazaa: Fazaa
  ) {
    const accepted =
      window.confirm(
        `هل تريد حذف فزعة "${fazaa.name}"؟`
      )

    if (!accepted) {
      return
    }

    setFazaat(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            fazaa.id
        )
    )

    if (
      editingFazaa?.id ===
      fazaa.id
    ) {
      resetForm()
    }
  }

  return (
    <div
      className="fazaat-page"
      dir="rtl"
    >

      <section className="fazaat-header">

        <div>

          <span>
            إدارة الخرج
          </span>

          <h1>
            الفزعات
          </h1>

          <p>
            تسجيل المبالغ التي تُعطى
            للأشخاص الذين يأتون
            للمساعدة
          </p>

        </div>

        <div className="fazaat-header-icon">

          <HandHelping
            size={31}
          />

        </div>

      </section>

      <section className="fazaa-entry">

        <div className="fazaa-entry-header">

          <div>

            <span>
              {editingFazaa
                ? 'تعديل فزعة'
                : 'تسجيل فزعة'}
            </span>

            <h2>
              {editingFazaa
                ? 'تعديل البيانات'
                : 'إضافة فزعة جديدة'}
            </h2>

          </div>

          {editingFazaa && (
            <button
              type="button"
              className="cancel-fazaa-edit"
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

        <div className="fazaa-form">

          <label>
            الاسم

            <input
              type="text"
              placeholder="اكتب اسم الشخص"
              value={name}
              onChange={(
                event
              ) =>
                setName(
                  event.target
                    .value
                )
              }
            />

          </label>

          <label>
            المبلغ

            <div className="fazaa-money-field">

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

            <div className="fazaa-date-field">

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
            className="save-fazaa-button"
            onClick={
              saveFazaa
            }
          >

            {editingFazaa ? (
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

                حفظ الفزعة
              </>
            )}

          </button>

        </div>

      </section>

      <section className="fazaat-record">

        <div className="fazaat-record-header">

          <div>

            <span>
              سجل الفزعات
            </span>

            <h2>
              فزعات الشهر
            </h2>

          </div>

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

        </div>

        <div className="fazaat-summary">

          <div>

            <span>
              عدد الفزعات
            </span>

            <strong>
              {
                filteredFazaat.length
              }
            </strong>

          </div>

          <div className="fazaat-total-card">

            <span>
              إجمالي الفزعات
              لهذا الشهر
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

        {filteredFazaat.length ===
        0 ? (
          <div className="fazaat-empty">

            <HandHelping
              size={31}
            />

            <strong>
              لا توجد فزعات
              مسجلة لهذا الشهر
            </strong>

            <span>
              بعد إضافة فزعة ستظهر
              هنا مباشرة
            </span>

          </div>
        ) : (
          <div className="fazaat-table-wrapper">

            <table className="fazaat-table">

              <thead>

                <tr>

                  <th>
                    التاريخ
                  </th>

                  <th>
                    الاسم
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

                {filteredFazaat.map(
                  (fazaa) => (
                    <tr
                      key={
                        fazaa.id
                      }
                    >

                      <td className="fazaa-date">
                        {formatDate(
                          fazaa.date
                        )}
                      </td>

                      <td className="fazaa-name">
                        {
                          fazaa.name
                        }
                      </td>

                      <td className="fazaa-amount">

                        {formatMoney(
                          Number(
                            fazaa.amount
                          ) || 0
                        )}
                        {' '}
                        ريال

                      </td>

                      <td>

                        <div className="fazaa-actions">

                          <button
                            type="button"
                            className="fazaa-edit-button"
                            onClick={() =>
                              editFazaa(
                                fazaa
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
                            className="fazaa-delete-button"
                            onClick={() =>
                              deleteFazaa(
                                fazaa
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

export default Fazaat