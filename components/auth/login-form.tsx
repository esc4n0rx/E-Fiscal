"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserRound, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react'
import { checkUserExists, authenticateUser, createUser, validatePassword } from "@/lib/auth"
import type { User } from "@/types/user"

type LoginFormProps = {
  onSuccess: (user: User) => void
}

type FormStep = 'name' | 'existing-password' | 'new-password'

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [step, setStep] = useState<FormStep>('name')
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmSenha, setConfirmSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleNameSubmit = async () => {
    if (!nome.trim()) {
      setError('Digite seu nome')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { exists } = await checkUserExists(nome)
      
      if (exists) {
        setStep('existing-password')
      } else {
        setStep('new-password')
      }
    } catch (err) {
      setError('Erro ao verificar usuário. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleExistingPasswordSubmit = async () => {
    if (!senha.trim()) {
      setError('Digite sua senha')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await authenticateUser(nome, senha)
      
      if (result.success && result.user) {
        onSuccess(result.user)
      } else {
        setError(result.message || 'Erro na autenticação')
      }
    } catch (err) {
      setError('Erro interno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewPasswordSubmit = async () => {
    if (!senha.trim()) {
      setError('Digite uma senha')
      return
    }

    if (senha !== confirmSenha) {
      setError('As senhas não coincidem')
      return
    }

    const validation = validatePassword(senha)
    if (!validation.valid) {
      setError(validation.message || 'Senha inválida')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await createUser(nome, senha)
      
      if (result.success && result.user) {
        onSuccess(result.user)
      } else {
        setError(result.message || 'Erro ao criar usuário')
      }
    } catch (err) {
      setError('Erro interno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'name') handleNameSubmit()
      else if (step === 'existing-password') handleExistingPasswordSubmit()
      else if (step === 'new-password') handleNewPasswordSubmit()
    }
  }

  const resetForm = () => {
    setStep('name')
    setNome('')
    setSenha('')
    setConfirmSenha('')
    setError('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-neutral-100">
          {step === 'name' && 'Identificação'}
          {step === 'existing-password' && 'Digite sua senha'}
          {step === 'new-password' && 'Criar nova senha'}
        </CardTitle>
        <CardDescription className="text-neutral-400">
          {step === 'name' && 'Digite seu nome para acessar o sistema.'}
          {step === 'existing-password' && `Bem-vindo de volta, ${nome}!`}
          {step === 'new-password' && 'Você é novo aqui. Vamos criar sua senha.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-800/50 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {step === 'name' && (
          <div className="space-y-2">
            <label htmlFor="nome" className="text-sm font-medium text-neutral-300">
              Digite seu Nome
            </label>
            <Input
              id="nome"
              placeholder="Ex.: Maria Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-500"
              disabled={loading}
            />
          </div>
        )}

        {step === 'existing-password' && (
          <div className="space-y-2">
            <label htmlFor="senha" className="text-sm font-medium text-neutral-300">
              Senha
            </label>
            <div className="relative">
              <Input
                id="senha"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-500 pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {step === 'new-password' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nova-senha" className="text-sm font-medium text-neutral-300">
                Nova Senha
              </label>
              <div className="relative">
                <Input
                  id="nova-senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-500 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmar-senha" className="text-sm font-medium text-neutral-300">
                Confirmar Senha
              </label>
              <div className="relative">
                <Input
                  id="confirmar-senha"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite a senha novamente"
                  value={confirmSenha}
                  onChange={(e) => setConfirmSenha(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-500 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          {step !== 'name' && (
            <Button
              variant="ghost"
              onClick={resetForm}
              disabled={loading}
              className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
            >
              Voltar
            </Button>
          )}
          
          <Button
            onClick={
              step === 'name' 
                ? handleNameSubmit 
                : step === 'existing-password' 
                ? handleExistingPasswordSubmit 
                : handleNewPasswordSubmit
            }
            disabled={loading || !nome.trim() || (step !== 'name' && !senha.trim())}
            className="bg-neutral-100 text-neutral-900 hover:bg-white disabled:opacity-50 ml-auto"
          >
            {loading ? 'Aguarde...' : 'Confirmar'}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}