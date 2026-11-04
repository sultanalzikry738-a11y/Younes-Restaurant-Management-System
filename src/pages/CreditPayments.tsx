import {
  useMemo,
  useState,
} from 'react'

import {
  CalendarDays,
  CreditCard,
  Save,
  Trash2,
} from 'lucide-react'

import './CreditPayments.css'

type CreditInvoice = {
  invoiceNumber: string
  total: number
}

type CreditPayment = {
  id: number
  invoiceNumber: string
  date: string
  amount: number
}

const sampleInvoices: CreditInvoice[] = [
  {
    invoiceNumber: '97',
    total: 374000,
  },
]

function getTodayDate() {
  const now = new Date()

  const year = now.getFullYear()

  const month = String(
    now.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    now.getDate()
  ).padStart(2, '0')

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
    .replace(/,/g, '')
    .replace(/[^\d]/g, '')
}

function formatInput(
  value: string
) {
  const clean =
    cleanMoney(value)

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

function CreditPayments() {
  const [
    selectedInvoiceNumber,
    setSelectedInvoiceNumber,
  ] = useState('97')

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState('')

  const [
    paymentDate,
    setPaymentDate,
  ] = useState(
    getTodayDate()
  )

  const [
    payments,
    setPayments,
  ] = useState<
    CreditPayment[]
  >([])

  const selectedInvoice =
    sampleInvoices.find(
      (invoice) =>
        invoice.invoiceNumber ===
        selectedInvoiceNumber
    )

  const previousPaid =
    useMemo(() => {
      return payments
        .filter(
          (payment) =>
            payment.invoiceNumber ===
            selectedInvoiceNumber
        )
        .reduce(
          (sum, payment) =>
            sum +
            payment.amount,
          0
        )
    }, [
      payments,
      selectedInvoiceNumber,
    ])

  const remaining =
    Math.max(
      0,
      (
        selectedInvoice?.total ||
        0
      ) -
        previousPaid
    )

  function savePayment() {
    if (!selectedInvoice) {
      alert(
        'اختر الفاتورة.'
      )
      return
    }

    const amount =
      Number(
        cleanMoney(
          paymentAmount
        )
      )

    if (
      !amount ||
      amount <= 0
    ) {
      alert(
        'اكتب مبلغ السداد.'
      )
      return
    }

    if (
      amount >
      remaining
    ) {
      alert(
        'مبلغ السداد أكبر من المبلغ المتبقي.'
      )
      return
    }

    if (!paymentDate) {
      alert(
        'اختر تاريخ السداد.'
      )
      return
    }

    const newPayment:
      CreditPayment = {
        id: Date.now(),
        invoiceNumber:
          selectedInvoiceNumber,
        date:
          paymentDate,
        amount,
      }

    setPayments(
      (current) => [
        newPayment,
        ...current,
      ]
    )

    setPaymentAmount('')

    alert(
      'تم حفظ السداد.'
    )
  }

  function deletePayment(
    id: number
  ) {
    const accepted =
      window.confirm(
        'هل تريد حذف عملية السداد؟'
      )

    if (!accepted) {
      return
    }

    setPayments(
      (current) =>
        current.filter(
          (payment) =>
            payment.id !== id
        )
    )
  }

  const invoicePayments =
    payments.filter(
      (payment) =>
        payment.invoiceNumber ===
        selectedInvoiceNumber
    )

  return (
    <div
      className="credit-payments-page"
      dir="rtl"
    >
      <section className="credit-payment-entry">

        <div className="credit-payment-head">
          <div>
            <span>
              المشتريات الآجلة
            </span>

            <h2>
              سداد الآجل
            </h2>

            <p>
              تسجيل المبالغ التي تم دفعها من الفواتير الآجلة
            </p>
          </div>

          <CreditCard
            size={25}
          />
        </div>

        <div className="credit-invoice-selector">
          <label>
            رقم الفاتورة

            <select
              value={
                selectedInvoiceNumber
              }
              onChange={(
                event
              ) =>
                setSelectedInvoiceNumber(
                  event.target.value
                )
              }
            >
              {sampleInvoices.map(
                (invoice) => (
                  <option
                    key={
                      invoice.invoiceNumber
                    }
                    value={
                      invoice.invoiceNumber
                    }
                  >
                    فاتورة رقم{' '}
                    {
                      invoice.invoiceNumber
                    }
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <div className="credit-payment-summary">

          <div>
            <span>
              إجمالي الفاتورة
            </span>

            <strong>
              {formatMoney(
                selectedInvoice?.total ||
                  0
              )}{' '}
              ريال
            </strong>
          </div>

          <div>
            <span>
              المدفوع سابقًا
            </span>

            <strong>
              {formatMoney(
                previousPaid
              )}{' '}
              ريال
            </strong>
          </div>

          <div className="credit-remaining-card">
            <span>
              المتبقي
            </span>

            <strong>
              {formatMoney(
                remaining
              )}{' '}
              ريال
            </strong>
          </div>

        </div>

        <div className="credit-payment-form">

          <label>
            مبلغ السداد

            <div className="credit-money-field">
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                placeholder="0"
                value={
                  formatInput(
                    paymentAmount
                  )
                }
                onChange={(
                  event
                ) =>
                  setPaymentAmount(
                    cleanMoney(
                      event.target.value
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

            <div className="credit-date-field">
              <CalendarDays
                size={17}
              />

              <input
                type="date"
                value={
                  paymentDate
                }
                onChange={(
                  event
                ) =>
                  setPaymentDate(
                    event.target.value
                  )
                }
              />
            </div>
          </label>

          <button
            type="button"
            className="save-credit-payment"
            onClick={
              savePayment
            }
            disabled={
              remaining === 0
            }
          >
            <Save
              size={18}
            />

            حفظ السداد
          </button>

        </div>

      </section>

      <section className="credit-payments-record">

        <div className="credit-record-title">
          <span>
            السجل
          </span>

          <h2>
            سجل سداد الفاتورة
          </h2>
        </div>

        {invoicePayments.length ===
        0 ? (
          <div className="credit-payments-empty">

            <CreditCard
              size={29}
            />

            <strong>
              لا توجد عمليات سداد لهذه الفاتورة
            </strong>

          </div>
        ) : (
          <div className="credit-record-table-wrapper">

            <table className="credit-record-table">

              <thead>
                <tr>
                  <th>
                    التاريخ
                  </th>

                  <th>
                    رقم الفاتورة
                  </th>

                  <th>
                    مبلغ السداد
                  </th>

                  <th>
                    حذف
                  </th>
                </tr>
              </thead>

              <tbody>
                {invoicePayments.map(
                  (payment) => (
                    <tr
                      key={
                        payment.id
                      }
                    >
                      <td>
                        {formatDate(
                          payment.date
                        )}
                      </td>

                      <td>
                        {
                          payment.invoiceNumber
                        }
                      </td>

                      <td className="credit-payment-amount">
                        {formatMoney(
                          payment.amount
                        )}{' '}
                        ريال
                      </td>

                      <td>
                        <button
                          type="button"
                          className="delete-credit-payment"
                          onClick={() =>
                            deletePayment(
                              payment.id
                            )
                          }
                        >
                          <Trash2
                            size={15}
                          />
                        </button>
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

export default CreditPayments