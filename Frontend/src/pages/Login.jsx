import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await login(email.trim(), password);
    setBusy(false);
    if (result.success)
      navigate(result.user.role === "admin" ? "/admin" : "/dashboard");
    else setError(result.message);
  };
  return (
    <div className="auth-layout">
      <aside className="auth-aside">
        <p className="eyebrow">Welcome to EventPass</p>
        <h1>
          Your plans,
          <br />
          all in one place.
        </h1>
        <p>
          Sign in to find your passes, manage registrations, and get ready for
          your next campus event.
        </p>
        <Link to="/" className="inline-flex text-sm font-semibold mt-7">
          ← Back to events
        </Link>
      </aside>
      <section className="panel auth-card">
        <h2 className="text-2xl font-semibold">Welcome back</h2>
        <p className="muted text-sm mt-2">
          Sign in with your registered email.
        </p>
        <form onSubmit={submit}>
          <div>
            <label htmlFor="email">Email address</label>
            <input
              className="field"
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu"
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <div className="relative">
              <input
                className="field pr-12"
                id="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="icon-btn absolute right-1 top-1"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="muted text-sm mt-7">
          New to EventPass?{" "}
          <Link
            className="font-semibold underline underline-offset-4"
            to="/register"
          >
            Create an account
          </Link>
        </p>
      </section>
    </div>
  );
}
