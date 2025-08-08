import bcrypt from 'bcryptjs'
import { supabase } from './supabase'
import type { User, AuthResponse } from '@/types/user'

/**
 * Verifica se um usuário existe pelo nome
 */
export async function checkUserExists(nome: string): Promise<{ exists: boolean; user?: User }> {
  try {
    const { data, error } = await supabase
      .from('efiscal_user')
      .select('id, nome, role, created_at, updated_at')
      .eq('nome', nome.trim())
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return {
      exists: !!data,
      user: data || undefined
    }
  } catch (error) {
    console.error('Erro ao verificar usuário:', error)
    throw new Error('Erro interno do servidor')
  }
}

/**
 * Autentica um usuário existente
 */
export async function authenticateUser(nome: string, senha: string): Promise<AuthResponse> {
  try {
    const { data: user, error } = await supabase
      .from('efiscal_user')
      .select('id, nome, senha, role, created_at, updated_at')
      .eq('nome', nome.trim())
      .single()

    if (error || !user) {
      return {
        success: false,
        message: 'Usuário não encontrado'
      }
    }

    const senhaValida = await bcrypt.compare(senha, user.senha)
    
    if (!senhaValida) {
      return {
        success: false,
        message: 'Senha incorreta'
      }
    }

    // Remove a senha do objeto retornado
    const { senha: _, ...userWithoutPassword } = user

    return {
      success: true,
      user: userWithoutPassword
    }
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return {
      success: false,
      message: 'Erro interno do servidor'
    }
  }
}

/**
 * Cria um novo usuário
 */
export async function createUser(nome: string, senha: string): Promise<AuthResponse> {
  try {
    // Verifica se o usuário já existe
    const { exists } = await checkUserExists(nome)
    
    if (exists) {
      return {
        success: false,
        message: 'Usuário já existe'
      }
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    // Insere o novo usuário
    const { data: user, error } = await supabase
      .from('efiscal_user')
      .insert({
        nome: nome.trim(),
        senha: senhaHash,
        role: 'user'
      })
      .select('id, nome, role, created_at, updated_at')
      .single()

    if (error || !user) {
      throw error || new Error('Falha ao criar usuário')
    }

    return {
      success: true,
      user
    }
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return {
      success: false,
      message: 'Erro ao criar usuário'
    }
  }
}

/**
 * Valida força da senha
 */
export function validatePassword(senha: string): { valid: boolean; message?: string } {
  if (senha.length < 6) {
    return {
      valid: false,
      message: 'A senha deve ter pelo menos 6 caracteres'
    }
  }

  return { valid: true }
}