import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  professionalId: string
  professionalName: string
  portfolioId: string
  portfolioTitle: string
  portfolioPrice: number
  portfolioImage?: string
  serviceType: string
  projectBrief?: {
    serviceType: string
    landArea: string
    budget: string
    location: string
    style: string
    timeline: string
    description: string
    generatedImage?: string
  }
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateItem: (id: string, updates: Partial<CartItem>) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalWithTaxes: () => number
  getItemCount: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => {
          // Check if item already exists
          const existingIndex = state.items.findIndex(
            (existingItem) => existingItem.id === item.id
          )
          
          if (existingIndex >= 0) {
            // Update existing item
            const updatedItems = [...state.items]
            updatedItems[existingIndex] = item
            return { items: updatedItems }
          } else {
            // Add new item
            return { items: [...state.items, item] }
          }
        })
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id)
        }))
      },
      
      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          )
        }))
      },
      
      clearCart: () => {
        set({ items: [] })
      },
      
      getTotalPrice: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.portfolioPrice, 0)
      },
      
      getTotalWithTaxes: () => {
        const subtotal = get().getTotalPrice()
        const vat = subtotal * 0.12 // 12% VAT
        const transactionFee = subtotal * 0.05 // 5% Transaction Fee
        return subtotal + vat + transactionFee
      },
      
      getItemCount: () => {
        const { items } = get()
        return items.length
      }
    }),
    {
      name: 'legia-cart-storage',
    }
  )
)