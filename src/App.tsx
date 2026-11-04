import {
  type FormEvent,
  useState,
} from 'react'

import {
  ArrowLeft,
  Banknote,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Coffee,
  Eye,
  EyeOff,
  LayoutGrid,
  LockKeyhole,
  LogIn,
  LogOut,
  Plus,
  Store,
  Trash2,
  UserRound,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react'

import Workers from './pages/Workers'
import Expenses from './pages/Expenses'
import Income from './pages/Income'
import FinancialReport from './pages/FinancialReport'
import Inventory from './pages/Inventory'

import './App.css'

type SectionType =
  | 'restaurant'
  | 'cafeteria'

type PageType =
  | 'inventory'
  | 'workers'
  | 'expenses'
  | 'income'
  | 'financial-report'

type Branch = {
  id: string
  name: string
  type: SectionType
}

const LOGIN_KEY =
  'alsamai_demo_logged_in'

const EXTRA_BRANCHES_KEY =
  'alsamai_extra_branches'

const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'restaurant',
    name: 'المطعم',
    type: 'restaurant',
  },
  {
    id: 'cafeteria',
    name: 'كافتيريا السامعي',
    type: 'cafeteria',
  },
]

const PUBLIC_UI_STYLES = `
  /* =========================================
     الواجهات العامة فقط:
     تسجيل الدخول + اختيار الفرع + نافذة الفرع
     لا تؤثر على صفحات النظام الداخلية
  ========================================= */

  .login-page,
  .entry-page {
    font-family: inherit;
    box-sizing: border-box;
  }

  .login-page *,
  .entry-page * {
    box-sizing: border-box;
  }

  /* =========================================
     تسجيل الدخول
  ========================================= */

  .login-page {
    min-height: 100vh !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 36px 20px !important;
    position: relative !important;
    overflow: hidden !important;
    background:
      radial-gradient(
        circle at 10% 15%,
        rgba(36, 58, 90, 0.08) 0,
        rgba(36, 58, 90, 0.08) 150px,
        transparent 151px
      ),
      radial-gradient(
        circle at 90% 85%,
        rgba(107, 31, 42, 0.06) 0,
        rgba(107, 31, 42, 0.06) 190px,
        transparent 191px
      ),
      #f2f5f8 !important;
  }

  .login-card {
    width: min(430px, 100%) !important;
    padding: 0 0 25px !important;
    overflow: hidden !important;
    position: relative !important;
    border: 1px solid #dbe2ea !important;
    border-radius: 27px !important;
    background: #ffffff !important;
    box-shadow:
      0 30px 80px rgba(24, 42, 67, 0.13),
      0 6px 20px rgba(24, 42, 67, 0.05) !important;
  }

  .login-hero {
    height: 185px;
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(
        145deg,
        #182a43 0%,
        #243a5a 60%,
        #2d486d 100%
      );
  }

  .login-hero::before {
    content: '';
    position: absolute;
    width: 390px;
    height: 160px;
    left: -120px;
    bottom: -84px;
    border-radius: 50%;
    background: #ffffff;
    transform: rotate(-6deg);
    opacity: 0.98;
  }

  .login-hero::after {
    content: '';
    position: absolute;
    width: 390px;
    height: 150px;
    right: -160px;
    bottom: -90px;
    border-radius: 50%;
    background: #eef2f6;
    transform: rotate(8deg);
    opacity: 0.95;
  }

  .login-brand {
    position: absolute;
    top: 24px;
    right: 28px;
    z-index: 4;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #ffffff;
  }

  .login-brand-logo {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 13px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(6px);
  }

  .login-brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.25;
  }

  .login-brand-text strong {
    font-size: 15px;
    font-weight: 900;
  }

  .login-brand-text span {
    margin-top: 2px;
    color: rgba(255, 255, 255, 0.72);
    font-size: 10px;
  }

  .login-hero-decoration {
    position: absolute;
    top: 71px;
    left: 50%;
    z-index: 3;
    width: 96px;
    height: 96px;
    transform: translateX(-50%);
  }

  .login-hero-decoration span {
    position: absolute;
    display: block;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .login-hero-decoration span:nth-child(1) {
    width: 60px;
    height: 37px;
    top: 8px;
    left: 4px;
    transform: rotate(-8deg);
  }

  .login-hero-decoration span:nth-child(2) {
    width: 59px;
    height: 42px;
    top: 41px;
    right: 4px;
    background: rgba(255, 255, 255, 0.1);
    transform: rotate(7deg);
  }

  .login-heading {
    padding: 4px 31px 0 !important;
    margin: 0 !important;
    text-align: right !important;
  }

  .login-heading span {
    display: inline-block;
    margin-bottom: 6px;
    color: #243a5a !important;
    font-size: 11px !important;
    font-weight: 900 !important;
  }

  .login-heading h1 {
    margin: 0 !important;
    color: #1f2937 !important;
    font-size: 28px !important;
    line-height: 1.3 !important;
    font-weight: 900 !important;
  }

  .login-heading p {
    margin: 8px 0 0 !important;
    color: #7a8797 !important;
    font-size: 12px !important;
    line-height: 1.8 !important;
  }

  .login-form {
    display: flex !important;
    flex-direction: column !important;
    gap: 15px !important;
    padding: 21px 31px 0 !important;
  }

  .login-field {
    display: flex !important;
    flex-direction: column !important;
    gap: 7px !important;
  }

  .login-field > span {
    color: #374151 !important;
    font-size: 11px !important;
    font-weight: 900 !important;
  }

  .login-input-box {
    height: 51px !important;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    padding: 0 13px !important;
    border: 1px solid #d7dee7 !important;
    border-radius: 12px !important;
    background: #f8fafc !important;
    color: #718096 !important;
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      background 0.18s ease !important;
  }

  .login-input-box:focus-within {
    border-color: #243a5a !important;
    background: #ffffff !important;
    box-shadow: 0 0 0 3px rgba(36, 58, 90, 0.08) !important;
  }

  .login-input-box input {
    width: 100% !important;
    height: 100% !important;
    padding: 0 !important;
    border: none !important;
    outline: none !important;
    background: transparent !important;
    color: #202936 !important;
    font-family: inherit !important;
    font-size: 13px !important;
  }

  .login-input-box input::placeholder {
    color: #a1aab6 !important;
  }

  .login-password-toggle {
    width: 35px !important;
    height: 35px !important;
    flex: 0 0 35px !important;
    display: grid !important;
    place-items: center !important;
    padding: 0 !important;
    border: none !important;
    border-radius: 8px !important;
    background: transparent !important;
    color: #7a8797 !important;
    cursor: pointer !important;
  }

  .login-password-toggle:hover {
    background: #edf2f7 !important;
    color: #243a5a !important;
  }

  .login-error {
    padding: 10px 12px !important;
    border: 1px solid #edc8cc !important;
    border-radius: 10px !important;
    background: #fff3f4 !important;
    color: #8f2f3c !important;
    font-size: 11px !important;
    font-weight: 800 !important;
  }

  .login-submit {
    height: 50px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    margin-top: 2px !important;
    border: none !important;
    border-radius: 12px !important;
    background:
      linear-gradient(
        135deg,
        #243a5a 0%,
        #182a43 100%
      ) !important;
    color: #ffffff !important;
    font-family: inherit !important;
    font-size: 13px !important;
    font-weight: 900 !important;
    cursor: pointer !important;
    box-shadow: 0 10px 24px rgba(36, 58, 90, 0.18) !important;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease !important;
  }

  .login-submit:hover {
    transform: translateY(-1px);
    box-shadow: 0 13px 28px rgba(36, 58, 90, 0.22) !important;
  }

  .login-footer {
    margin: 20px 31px 0 !important;
    padding-top: 15px !important;
    border-top: 1px solid #edf0f4 !important;
    color: #98a2ae !important;
    text-align: center !important;
    font-size: 10px !important;
  }

  /* =========================================
     اختيار الفرع
  ========================================= */

  .entry-page {
    min-height: 100vh !important;
    position: relative !important;
    overflow-x: hidden !important;
    padding: 45px 24px 95px !important;
    background: #f2f5f8 !important;
    color: #1f2937 !important;
  }

  .entry-page::before,
  .entry-page::after {
    content: none !important;
  }

  .entry-shape {
    position: fixed !important;
    pointer-events: none !important;
    border-radius: 50% !important;
    z-index: 0 !important;
  }

  .entry-shape-one {
    width: 440px !important;
    height: 440px !important;
    top: -220px !important;
    right: -170px !important;
    background: rgba(36, 58, 90, 0.055) !important;
  }

  .entry-shape-two {
    width: 360px !important;
    height: 360px !important;
    bottom: -220px !important;
    left: -130px !important;
    background: rgba(107, 31, 42, 0.045) !important;
  }

  .entry-container {
    width: min(1020px, 100%) !important;
    margin: 0 auto !important;
    position: relative !important;
    z-index: 2 !important;
  }

  .entry-logo {
    width: 66px !important;
    height: 66px !important;
    display: grid !important;
    place-items: center !important;
    margin: 0 auto 18px !important;
    border: 1px solid #d6dee8 !important;
    border-radius: 19px !important;
    background: #ffffff !important;
    color: #243a5a !important;
    box-shadow: 0 10px 28px rgba(24, 42, 67, 0.07) !important;
  }

  .entry-title {
    text-align: center !important;
    margin-bottom: 38px !important;
  }

  .entry-title span {
    display: block !important;
    margin-bottom: 7px !important;
    color: #526276 !important;
    font-size: 11px !important;
    font-weight: 900 !important;
  }

  .entry-title h1 {
    margin: 0 !important;
    color: #1d2939 !important;
    font-size: clamp(31px, 4vw, 43px) !important;
    line-height: 1.25 !important;
    font-weight: 900 !important;
  }

  .entry-title p {
    margin: 8px 0 0 !important;
    color: #7d8998 !important;
    font-size: 12px !important;
  }

  .section-grid {
    display: grid !important;
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      ) !important;
    gap: 24px !important;
    align-items: stretch !important;
  }

  .section-card {
    min-height: 300px !important;
    position: relative !important;
    display: flex !important;
    flex-direction: column !important;
    padding: 31px 31px 25px !important;
    overflow: hidden !important;
    border: 1px solid #dce3eb !important;
    border-radius: 23px !important;
    background: #ffffff !important;
    box-shadow: 0 18px 45px rgba(24, 42, 67, 0.075) !important;
    cursor: pointer !important;
    outline: none !important;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease !important;
  }

  .section-card::before {
    content: '' !important;
    position: absolute !important;
    top: 0 !important;
    right: 0 !important;
    left: 0 !important;
    height: 5px !important;
  }

  .section-card.restaurant-card::before {
    background: #243a5a !important;
  }

  .section-card.cafeteria-card::before {
    background: #6b1f2a !important;
  }

  .section-card:hover {
    transform: translateY(-4px) !important;
    box-shadow: 0 24px 54px rgba(24, 42, 67, 0.12) !important;
  }

  .section-card.restaurant-card:hover {
    border-color: #bdc9d8 !important;
  }

  .section-card.cafeteria-card:hover {
    border-color: #d7bec2 !important;
  }

  .section-card-icon {
    width: 70px !important;
    height: 70px !important;
    display: grid !important;
    place-items: center !important;
    margin-bottom: 25px !important;
    border-radius: 19px !important;
  }

  .restaurant-card .section-card-icon {
    background: #e9eef5 !important;
    color: #243a5a !important;
  }

  .cafeteria-card .section-card-icon {
    background: #f5e8ea !important;
    color: #6b1f2a !important;
  }

  .section-card-body {
    flex: 1 !important;
  }

  .section-card-body > span {
    display: block !important;
    margin-bottom: 7px !important;
    font-size: 11px !important;
    font-weight: 900 !important;
  }

  .restaurant-card .section-card-body > span {
    color: #526b8c !important;
  }

  .cafeteria-card .section-card-body > span {
    color: #914653 !important;
  }

  .section-card-body h2 {
    margin: 0 !important;
    color: #1f2937 !important;
    font-size: 27px !important;
    line-height: 1.35 !important;
    font-weight: 900 !important;
  }

  .section-card-body p {
    max-width: 420px !important;
    margin: 10px 0 0 !important;
    color: #778391 !important;
    font-size: 12px !important;
    line-height: 1.9 !important;
  }

  .section-card-action {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    margin-top: 28px !important;
    padding-top: 18px !important;
    border-top: 1px solid #edf0f4 !important;
    font-size: 12px !important;
    font-weight: 900 !important;
  }

  .restaurant-card .section-card-action {
    color: #243a5a !important;
  }

  .cafeteria-card .section-card-action {
    color: #6b1f2a !important;
  }

  .branch-delete-button {
    position: absolute !important;
    top: 18px !important;
    left: 18px !important;
    z-index: 8 !important;
    width: 40px !important;
    height: 40px !important;
    display: grid !important;
    place-items: center !important;
    padding: 0 !important;
    border: 1px solid #efd1d5 !important;
    border-radius: 11px !important;
    background: #fff5f6 !important;
    color: #a13d3d !important;
    cursor: pointer !important;
    transition:
      background 0.15s ease,
      transform 0.15s ease !important;
  }

  .branch-delete-button:hover {
    background: #fbe8ea !important;
    transform: scale(1.04) !important;
  }

  .entry-footer {
    margin-top: 27px !important;
    color: #929ca8 !important;
    text-align: center !important;
    font-size: 10px !important;
  }

  /* زر إضافة الفرع - أسفل يسار */

  .add-branch-fixed {
    position: fixed !important;
    left: 28px !important;
    bottom: 27px !important;
    z-index: 40 !important;
    min-height: 48px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 9px !important;
    padding: 0 17px !important;
    border: none !important;
    border-radius: 13px !important;
    background:
      linear-gradient(
        135deg,
        #243a5a,
        #182a43
      ) !important;
    color: #ffffff !important;
    font-family: inherit !important;
    font-size: 12px !important;
    font-weight: 900 !important;
    cursor: pointer !important;
    box-shadow: 0 12px 30px rgba(24, 42, 67, 0.2) !important;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease !important;
  }

  .add-branch-fixed:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 15px 34px rgba(24, 42, 67, 0.25) !important;
  }

  .add-branch-fixed-icon {
    width: 27px !important;
    height: 27px !important;
    display: grid !important;
    place-items: center !important;
    border-radius: 8px !important;
    background: rgba(255, 255, 255, 0.12) !important;
  }

  .entry-logout-button {
    position: fixed !important;
    top: 22px !important;
    left: 25px !important;
    z-index: 40 !important;
    height: 43px !important;
    display: flex !important;
    align-items: center !important;
    gap: 7px !important;
    padding: 0 14px !important;
    border: 1px solid #d7dee7 !important;
    border-radius: 11px !important;
    background: rgba(255, 255, 255, 0.92) !important;
    color: #4f5d6c !important;
    font-family: inherit !important;
    font-size: 11px !important;
    font-weight: 900 !important;
    cursor: pointer !important;
    box-shadow: 0 7px 20px rgba(24, 42, 67, 0.05) !important;
    backdrop-filter: blur(8px) !important;
  }

  .entry-logout-button:hover {
    color: #243a5a !important;
    border-color: #bbc7d6 !important;
  }

  /* =========================================
     نافذة إضافة فرع
  ========================================= */

  .branch-modal-backdrop {
    position: fixed !important;
    inset: 0 !important;
    z-index: 2000 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 22px !important;
    background: rgba(15, 23, 42, 0.48) !important;
    backdrop-filter: blur(6px) !important;
  }

  .branch-modal {
    width: min(520px, 100%) !important;
    overflow: hidden !important;
    border: 1px solid #dce3eb !important;
    border-radius: 22px !important;
    background: #ffffff !important;
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.2) !important;
  }

  .branch-modal-header {
    display: flex !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    gap: 20px !important;
    padding: 22px 23px 19px !important;
    border-bottom: 1px solid #edf0f4 !important;
  }

  .branch-modal-header small {
    display: block !important;
    margin-bottom: 4px !important;
    color: #526b8c !important;
    font-size: 10px !important;
    font-weight: 900 !important;
  }

  .branch-modal-header h2 {
    margin: 0 !important;
    color: #1f2937 !important;
    font-size: 22px !important;
    font-weight: 900 !important;
  }

  .branch-modal-header p {
    margin: 6px 0 0 !important;
    color: #7b8795 !important;
    font-size: 11px !important;
  }

  .branch-modal-close {
    width: 37px !important;
    height: 37px !important;
    flex: 0 0 37px !important;
    display: grid !important;
    place-items: center !important;
    padding: 0 !important;
    border: 1px solid #dce3eb !important;
    border-radius: 10px !important;
    background: #f8fafc !important;
    color: #5e6b79 !important;
    cursor: pointer !important;
  }

  .branch-form {
    padding: 21px 23px 23px !important;
  }

  .branch-form-field {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    margin-bottom: 17px !important;
  }

  .branch-form-field > span {
    color: #374151 !important;
    font-size: 11px !important;
    font-weight: 900 !important;
  }

  .branch-form-field > input {
    width: 100% !important;
    height: 49px !important;
    padding: 0 13px !important;
    border: 1px solid #d7dee7 !important;
    border-radius: 11px !important;
    outline: none !important;
    background: #f8fafc !important;
    color: #1f2937 !important;
    font-family: inherit !important;
  }

  .branch-form-field > input:focus {
    border-color: #243a5a !important;
    background: #ffffff !important;
    box-shadow: 0 0 0 3px rgba(36, 58, 90, 0.08) !important;
  }

  .branch-type-options {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 10px !important;
  }

  .branch-type-option {
    min-height: 75px !important;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    padding: 12px 13px !important;
    border: 1px solid #dce3eb !important;
    border-radius: 12px !important;
    background: #f8fafc !important;
    color: #52606f !important;
    text-align: right !important;
    font-family: inherit !important;
    cursor: pointer !important;
  }

  .branch-type-option > div {
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
  }

  .branch-type-option strong {
    font-size: 12px !important;
  }

  .branch-type-option small {
    color: #8a95a3 !important;
    font-size: 9px !important;
  }

  .branch-type-option.active {
    border-color: #243a5a !important;
    background: #edf2f7 !important;
    color: #243a5a !important;
    box-shadow: 0 0 0 2px rgba(36, 58, 90, 0.06) !important;
  }

  .branch-modal-actions {
    display: flex !important;
    justify-content: flex-end !important;
    gap: 9px !important;
    margin-top: 22px !important;
    padding-top: 17px !important;
    border-top: 1px solid #edf0f4 !important;
  }

  .branch-cancel-button,
  .branch-save-button {
    min-height: 43px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 7px !important;
    padding: 0 17px !important;
    border-radius: 10px !important;
    font-family: inherit !important;
    font-size: 11px !important;
    font-weight: 900 !important;
    cursor: pointer !important;
  }

  .branch-cancel-button {
    border: 1px solid #d7dee7 !important;
    background: #ffffff !important;
    color: #667281 !important;
  }

  .branch-save-button {
    border: none !important;
    background: #243a5a !important;
    color: #ffffff !important;
  }

  @media (max-width: 760px) {
    .entry-page {
      padding:
        85px
        17px
        100px !important;
    }

    .section-grid {
      grid-template-columns:
        1fr !important;
    }

    .section-card {
      min-height: 265px !important;
    }

    .entry-logout-button {
      top: 17px !important;
      left: 17px !important;
    }

    .add-branch-fixed {
      left: 17px !important;
      bottom: 17px !important;
    }

    .login-card {
      border-radius: 22px !important;
    }

    .login-heading,
    .login-form {
      padding-right: 22px !important;
      padding-left: 22px !important;
    }

    .login-footer {
      margin-right: 22px !important;
      margin-left: 22px !important;
    }
  }

  @media (max-width: 480px) {
    .branch-type-options {
      grid-template-columns:
        1fr !important;
    }

    .section-card {
      padding:
        26px
        22px
        22px !important;
    }

    .entry-title h1 {
      font-size: 31px !important;
    }
  }
`

function loadExtraBranches(): Branch[] {
  try {
    const saved =
      localStorage.getItem(
        EXTRA_BRANCHES_KEY
      )

    if (!saved) {
      return []
    }

    const parsed =
      JSON.parse(saved)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (branch) =>
        branch &&
        typeof branch.id ===
          'string' &&
        typeof branch.name ===
          'string' &&
        (
          branch.type ===
            'restaurant' ||
          branch.type ===
            'cafeteria'
        )
    )
  } catch {
    return []
  }
}

function App() {
  const [
    isLoggedIn,
    setIsLoggedIn,
  ] =
    useState(
      () =>
        sessionStorage.getItem(
          LOGIN_KEY
        ) === 'true'
    )

  const [
    username,
    setUsername,
  ] =
    useState('')

  const [
    password,
    setPassword,
  ] =
    useState('')

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false)

  const [
    loginError,
    setLoginError,
  ] =
    useState('')

  const [
    section,
    setSection,
  ] =
    useState<
      SectionType | null
    >(null)

  const [
    selectedBranchName,
    setSelectedBranchName,
  ] =
    useState('')

  const [
    activePage,
    setActivePage,
  ] =
    useState<PageType>(
      'workers'
    )

  const [
    extraBranches,
    setExtraBranches,
  ] =
    useState<Branch[]>(
      () =>
        loadExtraBranches()
    )

  const [
    showAddBranch,
    setShowAddBranch,
  ] =
    useState(false)

  const [
    newBranchName,
    setNewBranchName,
  ] =
    useState('')

  const [
    newBranchType,
    setNewBranchType,
  ] =
    useState<SectionType>(
      'restaurant'
    )

  function handleLogin(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (
      username.trim() ===
        'admin' &&
      password ===
        '1234'
    ) {
      sessionStorage.setItem(
        LOGIN_KEY,
        'true'
      )

      setIsLoggedIn(
        true
      )

      setLoginError('')

      return
    }

    setLoginError(
      'اسم المستخدم أو كلمة المرور غير صحيحة.'
    )
  }

  function logout() {
    sessionStorage.removeItem(
      LOGIN_KEY
    )

    setIsLoggedIn(
      false
    )

    setSection(
      null
    )

    setSelectedBranchName(
      ''
    )

    setUsername('')
    setPassword('')
  }

  function chooseSection(
    selectedBranch:
      Branch
  ) {
    setSection(
      selectedBranch.type
    )

    setSelectedBranchName(
      selectedBranch.name
    )

    setActivePage(
      'workers'
    )
  }

  function changeSection() {
    setSection(
      null
    )

    setSelectedBranchName(
      ''
    )

    setActivePage(
      'workers'
    )
  }

  function openAddBranch() {
    setNewBranchName('')
    setNewBranchType(
      'restaurant'
    )

    setShowAddBranch(
      true
    )
  }

  function closeAddBranch() {
    setShowAddBranch(
      false
    )

    setNewBranchName('')
    setNewBranchType(
      'restaurant'
    )
  }

  function addBranch(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const cleanName =
      newBranchName.trim()

    if (!cleanName) {
      alert(
        'اكتب اسم الفرع.'
      )

      return
    }

    const allBranches = [
      ...DEFAULT_BRANCHES,
      ...extraBranches,
    ]

    const duplicate =
      allBranches.some(
        (branch) =>
          branch.name
            .trim()
            .toLowerCase() ===
          cleanName.toLowerCase()
      )

    if (duplicate) {
      alert(
        'يوجد فرع بهذا الاسم بالفعل.'
      )

      return
    }

    const newBranch:
      Branch = {
      id:
        `branch-${Date.now()}`,

      name:
        cleanName,

      type:
        newBranchType,
    }

    const updatedBranches = [
      ...extraBranches,
      newBranch,
    ]

    setExtraBranches(
      updatedBranches
    )

    localStorage.setItem(
      EXTRA_BRANCHES_KEY,
      JSON.stringify(
        updatedBranches
      )
    )

    closeAddBranch()
  }

  function deleteBranch(
    branch:
      Branch
  ) {
    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف فرع "${branch.name}"؟`
      )

    if (!confirmed) {
      return
    }

    const updatedBranches =
      extraBranches.filter(
        (item) =>
          item.id !==
          branch.id
      )

    setExtraBranches(
      updatedBranches
    )

    localStorage.setItem(
      EXTRA_BRANCHES_KEY,
      JSON.stringify(
        updatedBranches
      )
    )
  }

  function getPageTitle() {
    if (
      activePage ===
      'workers'
    ) {
      return 'العمال'
    }

    if (
      activePage ===
      'expenses'
    ) {
      return 'الخرج'
    }

    if (
      activePage ===
      'income'
    ) {
      return 'الدخل'
    }

    if (
      activePage ===
      'financial-report'
    ) {
      return 'التقرير المالي'
    }

    return 'المخزون'
  }

  function renderPage() {
    if (!section) {
      return null
    }

    if (
      activePage ===
      'workers'
    ) {
      return <Workers />
    }

    if (
      activePage ===
      'expenses'
    ) {
      return <Expenses />
    }

    if (
      activePage ===
      'income'
    ) {
      return <Income />
    }

    if (
      activePage ===
      'financial-report'
    ) {
      return (
        <FinancialReport />
      )
    }

    return (
      <Inventory
        section={section}
      />
    )
  }

  if (!isLoggedIn) {
    return (
      <div
        className="login-page"
        dir="rtl"
      >
        <style>
          {PUBLIC_UI_STYLES}
        </style>

        <div
          className="login-card"
        >

          <div
            className="login-hero"
          >

            <div
              className="login-brand"
            >
              <div
                className="login-brand-logo"
              >
                <Store
                  size={22}
                />
              </div>

              <div
                className="login-brand-text"
              >
                <strong>
                  السامعي
                </strong>

                <span>
                  نظام الإدارة
                </span>
              </div>
            </div>

            <div
              className="login-hero-decoration"
              aria-hidden="true"
            >
              <span />
              <span />
            </div>

          </div>

          <div
            className="login-heading"
          >
            <span>
              نظام السامعي للإدارة
            </span>

            <h1>
              تسجيل الدخول
            </h1>

            <p>
              أدخل بيانات حسابك للوصول إلى لوحة الإدارة
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={
              handleLogin
            }
          >

            <label
              className="login-field"
            >
              <span>
                اسم المستخدم
              </span>

              <div
                className="login-input-box"
              >
                <UserRound
                  size={18}
                />

                <input
                  type="text"
                  value={
                    username
                  }
                  onChange={(
                    event
                  ) =>
                    setUsername(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="أدخل اسم المستخدم"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </label>

            <label
              className="login-field"
            >
              <span>
                كلمة المرور
              </span>

              <div
                className="login-input-box"
              >
                <LockKeyhole
                  size={18}
                />

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="أدخل كلمة المرور"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'إخفاء كلمة المرور'
                      : 'إظهار كلمة المرور'
                  }
                >
                  {showPassword ? (
                    <EyeOff
                      size={18}
                    />
                  ) : (
                    <Eye
                      size={18}
                    />
                  )}
                </button>
              </div>
            </label>

            {loginError && (
              <div
                className="login-error"
              >
                {
                  loginError
                }
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
            >
              متابعة

              <LogIn
                size={18}
              />
            </button>

          </form>

          <div
            className="login-footer"
          >
            نظام السامعي للإدارة
          </div>

        </div>

      </div>
    )
  }

  if (!section) {
    return (
      <div
        className="entry-page"
        dir="rtl"
      >
        <style>
          {PUBLIC_UI_STYLES}
        </style>

        <div
          className="entry-shape entry-shape-one"
        />

        <div
          className="entry-shape entry-shape-two"
        />

        <div
          className="entry-container"
        >

          <div
            className="entry-logo"
          >
            <LayoutGrid
              size={27}
            />
          </div>

          <div
            className="entry-title"
          >
            <span>
              نظام السامعي للإدارة
            </span>

            <h1>
              اختر الفرع
            </h1>

            <p>
              اختر الفرع الذي تريد الدخول إليه
            </p>
          </div>

          <div
            className="section-grid"
          >

            <div
              className="section-card restaurant-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                chooseSection(
                  DEFAULT_BRANCHES[0]
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                    'Enter' ||
                  event.key ===
                    ' '
                ) {
                  chooseSection(
                    DEFAULT_BRANCHES[0]
                  )
                }
              }}
            >

              <div
                className="section-card-icon"
              >
                <UtensilsCrossed
                  size={35}
                />
              </div>

              <div
                className="section-card-body"
              >
                <span>
                  مطعم
                </span>

                <h2>
                  المطعم
                </h2>

                <p>
                  إدارة المطعم والعمال والخرج والدخل والمخزون
                </p>
              </div>

              <div
                className="section-card-action"
              >
                دخول الفرع

                <ArrowLeft
                  size={18}
                />
              </div>

            </div>

            <div
              className="section-card cafeteria-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                chooseSection(
                  DEFAULT_BRANCHES[1]
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                    'Enter' ||
                  event.key ===
                    ' '
                ) {
                  chooseSection(
                    DEFAULT_BRANCHES[1]
                  )
                }
              }}
            >

              <div
                className="section-card-icon"
              >
                <Coffee
                  size={35}
                />
              </div>

              <div
                className="section-card-body"
              >
                <span>
                  كافتيريا
                </span>

                <h2>
                  كافتيريا السامعي
                </h2>

                <p>
                  إدارة الكافتيريا والعمال والخرج والدخل والمخزون
                </p>
              </div>

              <div
                className="section-card-action"
              >
                دخول الفرع

                <ArrowLeft
                  size={18}
                />
              </div>

            </div>

            {extraBranches.map(
              (
                branch
              ) => (

                <div
                  key={
                    branch.id
                  }
                  className={`section-card ${
                    branch.type ===
                    'restaurant'
                      ? 'restaurant-card'
                      : 'cafeteria-card'
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    chooseSection(
                      branch
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                        'Enter' ||
                      event.key ===
                        ' '
                    ) {
                      chooseSection(
                        branch
                      )
                    }
                  }}
                >

                  <button
                    type="button"
                    className="branch-delete-button"
                    title="حذف الفرع"
                    aria-label={`حذف ${branch.name}`}
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation()

                      deleteBranch(
                        branch
                      )
                    }}
                  >
                    <Trash2
                      size={17}
                    />
                  </button>

                  <div
                    className="section-card-icon"
                  >
                    {branch.type ===
                    'restaurant' ? (
                      <UtensilsCrossed
                        size={35}
                      />
                    ) : (
                      <Coffee
                        size={35}
                      />
                    )}
                  </div>

                  <div
                    className="section-card-body"
                  >
                    <span>
                      {branch.type ===
                      'restaurant'
                        ? 'مطعم'
                        : 'كافتيريا'}
                    </span>

                    <h2>
                      {
                        branch.name
                      }
                    </h2>

                    <p>
                      {branch.type ===
                      'restaurant'
                        ? 'إدارة فرع المطعم والعمال والخرج والدخل والمخزون'
                        : 'إدارة فرع الكافتيريا والعمال والخرج والدخل والمخزون'}
                    </p>
                  </div>

                  <div
                    className="section-card-action"
                  >
                    دخول الفرع

                    <ArrowLeft
                      size={18}
                    />
                  </div>

                </div>

              )
            )}

          </div>

          <div
            className="entry-footer"
          >
            اختر الفرع للمتابعة
          </div>

        </div>

        <button
          type="button"
          className="add-branch-fixed"
          onClick={
            openAddBranch
          }
        >
          <span
            className="add-branch-fixed-icon"
          >
            <Plus
              size={18}
            />
          </span>

          إضافة فرع
        </button>

        <button
          type="button"
          className="entry-logout-button"
          onClick={
            logout
          }
        >
          <LogOut
            size={17}
          />

          تسجيل الخروج
        </button>

        {showAddBranch && (

          <div
            className="branch-modal-backdrop"
            onMouseDown={
              closeAddBranch
            }
          >

            <div
              className="branch-modal"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >

              <div
                className="branch-modal-header"
              >

                <div>
                  <small>
                    إدارة الفروع
                  </small>

                  <h2>
                    إضافة فرع جديد
                  </h2>

                  <p>
                    أدخل اسم الفرع وحدد نوعه
                  </p>
                </div>

                <button
                  type="button"
                  className="branch-modal-close"
                  onClick={
                    closeAddBranch
                  }
                >
                  <X
                    size={20}
                  />
                </button>

              </div>

              <form
                className="branch-form"
                onSubmit={
                  addBranch
                }
              >

                <label
                  className="branch-form-field"
                >
                  <span>
                    اسم الفرع
                  </span>

                  <input
                    type="text"
                    value={
                      newBranchName
                    }
                    onChange={(
                      event
                    ) =>
                      setNewBranchName(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="مثال: مطعم السبعين"
                    autoFocus
                  />
                </label>

                <div
                  className="branch-form-field"
                >
                  <span>
                    نوع الفرع
                  </span>

                  <div
                    className="branch-type-options"
                  >

                    <button
                      type="button"
                      className={`branch-type-option ${
                        newBranchType ===
                        'restaurant'
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        setNewBranchType(
                          'restaurant'
                        )
                      }
                    >
                      <UtensilsCrossed
                        size={20}
                      />

                      <div>
                        <strong>
                          مطعم
                        </strong>

                        <small>
                          هوية المطعم
                        </small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`branch-type-option ${
                        newBranchType ===
                        'cafeteria'
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        setNewBranchType(
                          'cafeteria'
                        )
                      }
                    >
                      <Coffee
                        size={20}
                      />

                      <div>
                        <strong>
                          كافتيريا
                        </strong>

                        <small>
                          هوية الكافتيريا
                        </small>
                      </div>
                    </button>

                  </div>
                </div>

                <div
                  className="branch-modal-actions"
                >

                  <button
                    type="button"
                    className="branch-cancel-button"
                    onClick={
                      closeAddBranch
                    }
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="branch-save-button"
                  >
                    <Plus
                      size={18}
                    />

                    إضافة الفرع
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </div>
    )
  }

  return (
    <div
      className={`system-layout ${
        section ===
        'restaurant'
          ? 'restaurant-theme'
          : 'cafeteria-theme'
      }`}
      dir="rtl"
    >

      <aside
        className="system-sidebar"
      >

        <div
          className="system-brand"
        >
          <div
            className="system-brand-logo"
          >
            <Store
              size={23}
            />
          </div>

          <div>
            <strong>
              نظام السامعي
            </strong>

            <span>
              للإدارة
            </span>
          </div>
        </div>

        <div
          className="current-section-card"
        >
          {section ===
          'restaurant' ? (
            <UtensilsCrossed
              size={22}
            />
          ) : (
            <Coffee
              size={22}
            />
          )}

          <div>
            <small>
              الفرع الحالي
            </small>

            <strong>
              {
                selectedBranchName
              }
            </strong>
          </div>
        </div>

        <nav
          className="system-menu"
        >

          <button
            type="button"
            className={`system-menu-item ${
              activePage ===
              'workers'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActivePage(
                'workers'
              )
            }
          >
            <Users
              size={19}
            />

            العمال
          </button>

          <button
            type="button"
            className={`system-menu-item ${
              activePage ===
              'expenses'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActivePage(
                'expenses'
              )
            }
          >
            <CircleDollarSign
              size={19}
            />

            الخرج
          </button>

          <button
            type="button"
            className={`system-menu-item ${
              activePage ===
              'income'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActivePage(
                'income'
              )
            }
          >
            <Banknote
              size={19}
            />

            الدخل
          </button>

          <button
            type="button"
            className={`system-menu-item ${
              activePage ===
              'financial-report'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActivePage(
                'financial-report'
              )
            }
          >
            <BarChart3
              size={19}
            />

            التقرير المالي
          </button>

          <button
            type="button"
            className={`system-menu-item ${
              activePage ===
              'inventory'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActivePage(
                'inventory'
              )
            }
          >
            <Boxes
              size={19}
            />

            المخزون
          </button>

        </nav>

        <div
          className="system-sidebar-bottom"
        >

          <button
            type="button"
            className="change-section-button"
            onClick={
              changeSection
            }
          >
            <LayoutGrid
              size={18}
            />

            تغيير الفرع
          </button>

          <button
            type="button"
            className="change-section-button"
            onClick={
              logout
            }
          >
            <LogOut
              size={18}
            />

            تسجيل الخروج
          </button>

        </div>

      </aside>

      <main>

        <header
          className="system-content-top"
        >
          <div>
            <small>
              {
                selectedBranchName
              }
            </small>

            <strong>
              {
                getPageTitle()
              }
            </strong>
          </div>
        </header>

        <div
          className="system-page-content"
        >
          {renderPage()}
        </div>

      </main>

    </div>
  )
}
export default App