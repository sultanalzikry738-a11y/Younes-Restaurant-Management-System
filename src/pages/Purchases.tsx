import {
  useState,
} from 'react'

import {
  CreditCard,
  ReceiptText,
} from 'lucide-react'

import PurchaseInvoices from './PurchaseInvoices'
import CreditPayments from './CreditPayments'

import './Purchases.css'

type PurchasesTab =
  | 'invoices'
  | 'credit'

function Purchases() {
  const [
    activeTab,
    setActiveTab,
  ] = useState<PurchasesTab>(
    'invoices'
  )

  return (
    <div
      className="purchases-page"
      dir="rtl"
    >

      <section className="purchases-hero">

        <div>

          <span>
            إدارة المشتريات
          </span>

          <h1>
            المشتريات
          </h1>

          <p>
            تسجيل ومتابعة
            فواتير المشتريات
            النقدية والآجلة
          </p>

        </div>

        <div className="purchases-hero-icon">

          <ReceiptText
            size={31}
          />

        </div>

      </section>

      <div className="purchases-tabs">

        <button
          type="button"
          className={
            activeTab ===
            'invoices'
              ? 'purchases-tab active'
              : 'purchases-tab'
          }
          onClick={() =>
            setActiveTab(
              'invoices'
            )
          }
        >

          <ReceiptText
            size={17}
          />

          فواتير المشتريات

        </button>

        <button
          type="button"
          className={
            activeTab ===
            'credit'
              ? 'purchases-tab active'
              : 'purchases-tab'
          }
          onClick={() =>
            setActiveTab(
              'credit'
            )
          }
        >

          <CreditCard
            size={17}
          />

          سداد الآجل

        </button>

      </div>

      <div className="purchases-content">

        {activeTab ===
          'invoices' && (
          <PurchaseInvoices />
        )}

        {activeTab ===
          'credit' && (
          <CreditPayments />
        )}

      </div>

    </div>
  )
}

export default Purchases