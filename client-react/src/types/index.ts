export interface BalanceInfo {
  balance: number
  customerName: string
}

export interface Receiver {
  Cid: number
  Cname: string
  email: string
  email_hint: string
  raw_name?: string
}

export type TxnType = 'debit' | 'credit'

export interface Transaction {
  type: TxnType
  amount: number
  counterparty: string
  created_at: string
}

export interface TransferResult {
  transfer_amount: number
  new_balance: number
  receiver_name: string
  receiver_id: number
}

export type ChatRole = 'user' | 'bot'

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
}

/** Derived month stats for the dashboard stat cards. */
export interface MonthStats {
  income: number
  spending: number
  savings: number
}

/** A single bar/point in the spending chart. */
export interface SpendingPoint {
  label: string
  spending: number
  income: number
}
