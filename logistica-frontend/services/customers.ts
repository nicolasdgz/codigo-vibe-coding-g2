import { apiClient } from '@/lib/axios'
import type {
  Customer,
  CustomerWritePayload,
  PaginatedCustomers,
  CustomerListParams,
} from '@/types/customers'

export async function getCustomers(params: CustomerListParams): Promise<PaginatedCustomers> {
  const { data } = await apiClient.get<PaginatedCustomers>('/customers/', { params })
  return data
}

export async function getCustomer(id: number): Promise<Customer> {
  const { data } = await apiClient.get<Customer>(`/customers/${id}/`)
  return data
}

export async function createCustomer(payload: CustomerWritePayload): Promise<Customer> {
  const { data } = await apiClient.post<Customer>('/customers/', payload)
  return data
}

export async function updateCustomer(
  id: number,
  payload: Partial<CustomerWritePayload>
): Promise<Customer> {
  const { data } = await apiClient.patch<Customer>(`/customers/${id}/`, payload)
  return data
}

export async function deleteCustomer(id: number): Promise<void> {
  await apiClient.delete(`/customers/${id}/`)
}
