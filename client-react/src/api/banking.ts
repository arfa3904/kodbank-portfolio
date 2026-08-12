import { api } from './client'
import type { BalanceInfo, Receiver, Transaction, TransferResult } from '../types'

export async function checkBalance(): Promise<BalanceInfo> {
  const data = await api.get<{ balance: number; customer_name: string }>('/api/banking/balance')
  return { balance: data.balance, customerName: data.customer_name }
}

export async function getReceivers(): Promise<Receiver[]> {
  const data = await api.get<{ receivers: Receiver[] }>('/api/banking/receivers')
  return data.receivers ?? []
}

export async function getTransactions(): Promise<Transaction[]> {
  const data = await api.get<{ transactions: Transaction[] }>('/api/banking/transactions')
  return data.transactions ?? []
}

export async function transfer(receiver: string, amount: number): Promise<TransferResult> {
  const isEmail = receiver.includes('@')
  const data = await api.post<{
    transfer_amount: number
    new_balance: number
    receiver_name: string
    receiver_id: number
  }>('/api/banking/transfer', {
    receiver_id: isEmail ? undefined : receiver,
    receiver_email: isEmail ? receiver : undefined,
    amount,
  })
  return {
    transfer_amount: data.transfer_amount,
    new_balance: data.new_balance,
    receiver_name: data.receiver_name,
    receiver_id: data.receiver_id,
  }
}
