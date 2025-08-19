import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import * as api from "../api"
import { useAuth } from "../context/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyEmail() {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef([])
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const handleInputChange = (index, value) => {
    if (value.length > 1) return // Only allow single digit

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto focus next field
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    const verificationToken = sessionStorage.getItem("verificationToken")
    if (!verificationToken) {
      setError("No verification token found. Please signup or login first.")
      return
    }

    const verificationCode = code.join("")
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code")
      return
    }

    setLoading(true)
    try {
      const data = await api.verifyEmail(verificationToken, verificationCode)
      setUser(data.user)
      sessionStorage.removeItem("verificationToken")
      sessionStorage.removeItem("verificationEmail")
      navigate("/")
    } catch (err) {
      setError(err.message || "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = () => {
    // Logic to resend verification code
    console.log("Resending verification code...")
  }

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold text-slate-800">Verify Email</CardTitle>
          <CardDescription className="text-slate-600">
            Enter the code sent to your email. Expires in 5 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                />
              ))}
            </div>


            {error && <p className="text-center text-red-600 text-sm">{error}</p>}

            <Button
              type="submit"
              disabled={loading || code.join("").length !== 6}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Resend Code
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
