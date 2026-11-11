import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: "student",
    name: "",
    email: "",
    rollNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [file, setFile] = useState(null);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match.");
    if (
      file &&
      (file.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type))
    )
      return setError("Choose a JPG, PNG, or WebP image smaller than 5 MB.");
    setBusy(true);
    const data = new FormData();
    for (const key of ["name", "email", "password", "role"])
      data.append(key, key === "password" ? form[key] : form[key].trim());
    if (form.role === "student")
      data.append("rollNumber", form.rollNumber.trim());
    if (file) data.append("profilePic", file);
    const result = await register(data);
    setBusy(false);
    if (result.success)
      navigate(result.user.role === "admin" ? "/admin" : "/dashboard");
    else setError(result.message);
  };
  return (
    <div className="register-layout">
      <section className="panel register-card" aria-labelledby="register-title">
        <header className="register-header">
          <div>
            <h1 id="register-title">Create your account</h1>
            <p className="muted">Enter your details to sign up.</p>
          </div>
          <Link to="/login" className="register-signin">
            Have an account? <span>Sign in</span>
          </Link>
        </header>
        <form onSubmit={submit} className="register-form">
          <div>
            <label htmlFor="role">Account type</label>
            <select
              id="role"
              name="role"
              className="field"
              value={form.role}
              onChange={update}
              aria-describedby="role-help"
            >
              <option value="student">Student</option>
              <option value="admin">Admin (Organiser)</option>
            </select>
          </div>
          {form.role === "student" && (
            <div>
              <label htmlFor="rollNumber">Roll number</label>
              <input
                className="field"
                id="rollNumber"
                name="rollNumber"
                autoComplete="off"
                required
                value={form.rollNumber}
                onChange={update}
                placeholder="e.g. 2024CS001"
              />
            </div>
          )}
          <p
            id="role-help"
            className="register-wide register-role-help muted"
            aria-live="polite"
          >
            {form.role === "admin"
              ? "For organisers who create events and manage attendance."
              : "For students attending campus events."}
          </p>
          {[
            ["name", "Full name", "text", "name", "Name as on your college ID"],
            ["email", "Email address", "email", "email", "you@college.edu"],
          ].map(([name, label, type, autoComplete, placeholder]) => (
            <div key={name}>
              <label htmlFor={name}>{label}</label>
              <input
                className="field"
                id={name}
                name={name}
                type={type}
                autoComplete={autoComplete}
                required
                value={form[name]}
                onChange={update}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div>
            <label htmlFor="password">
              Password{" "}
              <span className="muted font-normal">(8+ characters)</span>
            </label>
            <div className="relative">
              <input
                className="field pr-12"
                id="password"
                name="password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
                value={form.password}
                onChange={update}
              />
              <button
                type="button"
                className="icon-btn register-password-toggle"
                aria-label={show ? "Hide passwords" : "Show passwords"}
                aria-pressed={show}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              className="field"
              id="confirmPassword"
              name="confirmPassword"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={update}
            />
          </div>
          <div className="register-wide register-upload">
            <div>
              <label htmlFor="profilePic">
                Profile photo{" "}
                <span className="muted font-normal">(optional)</span>
              </label>
              <p id="photo-help" className="muted">
                JPG, PNG or WebP · up to 5 MB
              </p>
            </div>
            <input
              id="profilePic"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby="photo-help"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </div>
          {error && (
            <p
              role="alert"
              className="register-wide text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          )}
          <div className="register-wide register-actions">
            <Link to="/" className="muted">
              ← Back to events
            </Link>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Creating account…" : "Create account"}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
