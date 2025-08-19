import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../context/AuthProvider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [focusedField, setFocusedField] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await api.login(form.email, form.password);

      if (data.verificationToken) {
        sessionStorage.setItem("verificationToken", data.verificationToken);
        sessionStorage.setItem("verificationEmail", form.email);
        navigate("/verify-email");
        return;
      }

      setUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  const isFieldFocused = (fieldName) =>
    focusedField === fieldName || form[fieldName];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold text-slate-800">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-slate-600">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField("")}
                className="peer h-12 pt-4 pb-2 px-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                placeholder=" "
                required
              />
              <Label
                htmlFor="email"
                className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                  isFieldFocused("email")
                    ? "top-1 text-xs text-blue-600"
                    : "top-3 text-base text-slate-500"
                }`}
              >
                Email
              </Label>
            </div>

            <div className="relative">
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField("")}
                className="peer h-12 pt-4 pb-2 px-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                placeholder=" "
                required
              />
              <Label
                htmlFor="password"
                className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                  isFieldFocused("password")
                    ? "top-1 text-xs text-blue-600"
                    : "top-3 text-base text-slate-500"

                }`}
              >
                Password
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Login
            </Button>

            {error && (
              <p className="text-center text-sm text-red-600">{error}</p>
            )}

            <p className="text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >

                Sign Up
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
