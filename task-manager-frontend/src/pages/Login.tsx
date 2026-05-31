import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, ClipboardCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { loginUser } from '../services/authService'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailInvalid = emailTouched && !EMAIL_REGEX.test(email)
  const passwordInvalid = passwordTouched && password.length === 0
  const canSubmit = EMAIL_REGEX.test(email) && password.length > 0 && !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailTouched(true)
    setPasswordTouched(true)
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const { token, user } = await loginUser({ email, password })
      setAuth(token, user)
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 flex items-center justify-center sm:p-4">
      <div className="bg-white w-full min-h-screen sm:min-h-0 sm:max-w-md sm:rounded-2xl sm:shadow-2xl flex flex-col justify-center px-8 py-12 sm:px-10">

        <div className="mb-8">
          <div className="w-11 h-11 bg-violet-600 rounded-xl flex items-center justify-center mb-5">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account to continue</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailTouched(true) }}
              onBlur={() => setEmailTouched(true)}
              placeholder="you@example.com"
              autoComplete="email"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                emailInvalid
                  ? 'border-red-300 focus:ring-red-400 bg-red-50 text-red-900 placeholder-red-300'
                  : 'border-gray-300 focus:ring-violet-500'
              }`}
            />
            {emailInvalid && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Enter a valid email address
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordTouched(true) }}
                onBlur={() => setPasswordTouched(true)}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`w-full px-3.5 py-2.5 pr-11 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  passwordInvalid
                    ? 'border-red-300 focus:ring-red-400 bg-red-50'
                    : 'border-gray-300 focus:ring-violet-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordInvalid && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Password is required
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2.5 mt-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-violet-600 font-medium hover:text-violet-700 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
