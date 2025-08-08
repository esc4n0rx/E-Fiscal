export type User = {
    id: number
    nome: string
    role: 'user' | 'supervisor'
    created_at?: string
    updated_at?: string
  }
  
  export type AuthResponse = {
    success: boolean
    user?: User
    message?: string
    needsPassword?: boolean
  }