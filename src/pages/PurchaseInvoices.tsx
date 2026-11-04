import {
  useMemo,
  useState,
} from 'react'

import {
  CalendarDays,
  Plus,
  ReceiptText,
  Save,
  Trash2,
} from 'lucide-react'

import './PurchaseInvoices.css'

type PaymentMethod =
  | 'cash'
  | 'credit'

type PurchaseItem = {
  id: number
  name: string
  quantity: string
  unitPrice: string
}

type PurchaseInvoice = {
  id: number
  invoiceNumber: string
  date: string
  paymentMethod:
    PaymentMethod
  items: PurchaseItem[]
  total: number
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

function cleanNumber(
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
    cleanNumber(value)

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

function createEmptyItem():
  PurchaseItem {
  return {
    id: Date.now() +
      Math.floor(
        Math.random() *
        1000
      ),

    name: '',
    quantity: '',
    unitPrice: '',
  }
}

function PurchaseInvoices() {
  const [
    invoiceNumber,
    setInvoiceNumber,
  ] = useState('')

  const [
    date,
    setDate,
  ] = useState(
    getTodayDate()
  )

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<
    PaymentMethod
  >('credit')

  const [
    items,
    setItems,
  ] = useState<
    PurchaseItem[]
  >([
    createEmptyItem(),
  ])

  const [
    invoices,
    setInvoices,
  ] = useState<
    PurchaseInvoice[]
  >([])

  function itemAmount(
    item: PurchaseItem
  ) {
    const quantity =
      Number(
        item.quantity
      ) || 0

    const unitPrice =
      Number(
        item.unitPrice
      ) || 0

    return (
      quantity *
      unitPrice
    )
  }

  const invoiceTotal =
    useMemo(() => {
      return items.reduce(
        (sum, item) =>
          sum +
          itemAmount(
            item
          ),
        0
      )
    }, [
      items,
    ])

  function updateItem(
    id: number,
    field:
      | 'name'
      | 'quantity'
      | 'unitPrice',
    value: string
  ) {
    setItems(
      (current) =>
        current.map(
          (item) =>
            item.id === id
              ? {
                  ...item,

                  [field]:
                    field ===
                      'name'
                      ? value
                      : cleanNumber(
                          value
                        ),
                }
              : item
        )
    )
  }

  function addItem() {
    setItems(
      (current) => [
        ...current,
        createEmptyItem(),
      ]
    )
  }

  function removeItem(
    id: number
  ) {
    if (
      items.length === 1
    ) {
      return
    }

    setItems(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    )
  }

  function resetForm() {
    setInvoiceNumber('')
    setDate(
      getTodayDate()
    )
    setPaymentMethod(
      'credit'
    )
    setItems([
      createEmptyItem(),
    ])
  }

  function saveInvoice() {
    const number =
      invoiceNumber.trim()

    if (!number) {
      alert(
        'اكتب رقم الفاتورة.'
      )

      return
    }

    if (!date) {
      alert(
        'اختر التاريخ.'
      )

      return
    }

    const validItems =
      items.filter(
        (item) =>
          item.name.trim() &&
          Number(
            item.quantity
          ) > 0 &&
          Number(
            item.unitPrice
          ) > 0
      )

    if (
      validItems.length ===
      0
    ) {
      alert(
        'أضف صنفًا واحدًا على الأقل مع الكمية والسعر.'
      )

      return
    }

    const total =
      validItems.reduce(
        (sum, item) =>
          sum +
          itemAmount(
            item
          ),
        0
      )

    const newInvoice:
      PurchaseInvoice = {
        id: Date.now(),

        invoiceNumber:
          number,

        date,

        paymentMethod,

        items:
          validItems,

        total,
      }

    setInvoices(
      (current) => [
        newInvoice,
        ...current,
      ]
    )

    resetForm()

    alert(
      'تم حفظ الفاتورة.'
    )
  }

  function deleteInvoice(
    id: number
  ) {
    const accepted =
      window.confirm(
        'هل تريد حذف هذه الفاتورة؟'
      )

    if (!accepted) {
      return
    }

    setInvoices(
      (current) =>
        current.filter(
          (invoice) =>
            invoice.id !==
            id
        )
    )
  }

  return (
    <div
      className="purchase-invoices-page"
      dir="rtl"
    >

      <section className="purchase-invoice-entry">

        <div className="purchase-invoice-entry-head">

          <div>

            <span>
              فواتير المشتريات
            </span>

            <h2>
              إضافة فاتورة شراء
            </h2>

          </div>

          <ReceiptText
            size={24}
          />

        </div>

        <div className="purchase-invoice-main-fields">

          <label>

            رقم الفاتورة

            <input
              type="text"
              placeholder="مثال: 97"
              value={
                invoiceNumber
              }
              onChange={(
                event
              ) =>
                setInvoiceNumber(
                  event.target
                    .value
                )
              }
            />

          </label>

          <label>

            التاريخ

            <div className="purchase-date-field">

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

          <label>

            طريقة الدفع

            <select
              value={
                paymentMethod
              }
              onChange={(
                event
              ) =>
                setPaymentMethod(
                  event.target
                    .value as
                    PaymentMethod
                )
              }
            >

              <option value="cash">
                نقد
              </option>

              <option value="credit">
                آجل
              </option>

            </select>

          </label>

        </div>

        <div className="purchase-items-head">

          <div>

            <span>
              تفاصيل الفاتورة
            </span>

            <h3>
              الأصناف
            </h3>

          </div>

          <button
            type="button"
            onClick={
              addItem
            }
          >

            <Plus
              size={17}
            />

            إضافة صنف

          </button>

        </div>

        <div className="purchase-items-table-wrapper">

          <table className="purchase-items-table">

            <thead>

              <tr>

                <th>
                  الصنف
                </th>

                <th>
                  الكمية
                </th>

                <th>
                  سعر الوحدة
                </th>

                <th>
                  المبلغ
                </th>

                <th>
                  حذف
                </th>

              </tr>

            </thead>

            <tbody>

              {items.map(
                (item) => (

                  <tr
                    key={
                      item.id
                    }
                  >

                    <td>

                      <input
                        type="text"
                        placeholder="اسم الصنف"
                        value={
                          item.name
                        }
                        onChange={(
                          event
                        ) =>
                          updateItem(
                            item.id,
                            'name',
                            event
                              .target
                              .value
                          )
                        }
                      />

                    </td>

                    <td>

                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        placeholder="0"
                        value={
                          formatInput(
                            item.quantity
                          )
                        }
                        onChange={(
                          event
                        ) =>
                          updateItem(
                            item.id,
                            'quantity',
                            event
                              .target
                              .value
                          )
                        }
                      />

                    </td>

                    <td>

                      <div className="purchase-money-input">

                        <input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          placeholder="0"
                          value={
                            formatInput(
                              item.unitPrice
                            )
                          }
                          onChange={(
                            event
                          ) =>
                            updateItem(
                              item.id,
                              'unitPrice',
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <span>
                          ريال
                        </span>

                      </div>

                    </td>

                    <td className="purchase-item-total">

                      {formatMoney(
                        itemAmount(
                          item
                        )
                      )}
                      {' '}
                      ريال

                    </td>

                    <td>

                      <button
                        type="button"
                        className="remove-purchase-item"
                        onClick={() =>
                          removeItem(
                            item.id
                          )
                        }
                        disabled={
                          items.length ===
                          1
                        }
                      >

                        <Trash2
                          size={16}
                        />

                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

        <div className="purchase-invoice-footer">

          <div className="purchase-invoice-total">

            <span>
              إجمالي الفاتورة
            </span>

            <strong>
              {formatMoney(
                invoiceTotal
              )}
              {' '}
              ريال
            </strong>

          </div>

          <button
            type="button"
            className="save-purchase-invoice"
            onClick={
              saveInvoice
            }
          >

            <Save
              size={18}
            />

            حفظ الفاتورة

          </button>

        </div>

      </section>

      <section className="purchase-invoices-record">

        <div className="purchase-record-title">

          <span>
            السجل
          </span>

          <h2>
            فواتير المشتريات
          </h2>

        </div>

        {invoices.length ===
        0 ? (

          <div className="purchase-invoices-empty">

            <ReceiptText
              size={29}
            />

            <strong>
              لا توجد فواتير مسجلة
            </strong>

          </div>

        ) : (

          <div className="purchase-record-table-wrapper">

            <table className="purchase-record-table">

              <thead>

                <tr>

                  <th>
                    رقم الفاتورة
                  </th>

                  <th>
                    التاريخ
                  </th>

                  <th>
                    طريقة الدفع
                  </th>

                  <th>
                    عدد الأصناف
                  </th>

                  <th>
                    الإجمالي
                  </th>

                  <th>
                    الإجراءات
                  </th>

                </tr>

              </thead>

              <tbody>

                {invoices.map(
                  (invoice) => (

                    <tr
                      key={
                        invoice.id
                      }
                    >

                      <td>
                        {
                          invoice.invoiceNumber
                        }
                      </td>

                      <td>
                        {formatDate(
                          invoice.date
                        )}
                      </td>

                      <td>

                        <span
                          className={
                            invoice.paymentMethod ===
                            'credit'
                              ? 'purchase-payment-badge credit'
                              : 'purchase-payment-badge cash'
                          }
                        >

                          {invoice.paymentMethod ===
                          'credit'
                            ? 'آجل'
                            : 'نقد'}

                        </span>

                      </td>

                      <td>
                        {
                          invoice.items.length
                        }
                      </td>

                      <td className="purchase-record-total">

                        {formatMoney(
                          invoice.total
                        )}
                        {' '}
                        ريال

                      </td>

                      <td>

                        <button
                          type="button"
                          className="delete-purchase-invoice"
                          onClick={() =>
                            deleteInvoice(
                              invoice.id
                            )
                          }
                        >

                          <Trash2
                            size={15}
                          />

                          حذف

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

export default PurchaseInvoices