import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Ticket, Sun, Moon, Bell, LogOut } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [noticeError, setNoticeError] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );
  const noticeRef = useRef(null);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  useEffect(() => {
    setOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);
  useEffect(() => {
    const close = (e) => {
      if (!noticeRef.current?.contains(e.target)) setShowNotifications(false);
    };
    const escape = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  useEffect(() => {
    let active = true;
    setNotifications([]);
    setNoticeError(false);
    if (user)
      axios
        .get(`${API_BASE}/api/registrations/notifications`)
        .then(({ data }) => {
          if (active) setNotifications(data.notifications || []);
        })
        .catch(() => {
          if (active) setNoticeError(true);
        });
    return () => {
      active = false;
    };
  }, [user, showNotifications]);
  const read = async (notification) => {
    try {
      await axios.patch(
        `${API_BASE}/api/registrations/notifications/${notification._id}/read`,
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, read: true } : n,
        ),
      );
      if (notification.eventId) navigate(`/events/${notification.eventId}`);
    } catch {
      toast.error("Could not open this notification.");
    }
  };
  const links = [
    ["/", "Events"],
    ...(user
      ? user.role === "admin"
        ? [
            ["/admin", "Overview"],
            ["/admin/scan", "Check-in"],
          ]
        : [["/dashboard", "My passes"]]
      : []),
  ];
  const signOut = () => {
    logout();
    navigate("/");
    setOpen(false);
  };
  return (
    <header className="site-header">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="EventPass home">
          <span className="brand-mark">
            <Ticket size={21} />
          </span>
          EventPass
          <span className="hidden lg:inline text-xs font-normal tracking-normal muted ml-2">
            / campus
          </span>
        </Link>
        <nav className="nav-links hidden md:flex" aria-label="Main navigation">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="icon-btn"
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <>
              <div className="relative" ref={noticeRef}>
                <button
                  className="icon-btn relative"
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={18} />
                  {notifications.some((n) => !n.read) && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-green-600 rounded-full" />
                  )}
                </button>
                {showNotifications && (
                  <section
                    className="panel absolute right-0 top-12 w-72 max-h-80 overflow-auto shadow-lg p-4"
                    aria-label="Notifications"
                  >
                    <h2 className="font-semibold mb-3">Notifications</h2>
                    {noticeError ? (
                      <p className="muted text-sm">
                        Notifications are unavailable. Please try again later.
                      </p>
                    ) : !notifications.length ? (
                      <p className="muted text-sm">You’re all caught up.</p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n._id}
                          onClick={() => read(n)}
                          className={`block w-full text-left text-sm py-3 border-b border-gray-200 dark:border-gray-700 ${n.read ? "muted" : "font-medium"}`}
                        >
                          {n.message}
                        </button>
                      ))
                    )}
                  </section>
                )}
              </div>
              <Link to="/profile" className="hidden md:flex btn">
                {user.name?.split(" ")[0]}
              </Link>
              <button
                className="icon-btn hidden md:flex"
                aria-label="Sign out"
                onClick={signOut}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Create account
              </Link>
            </div>
          )}
          <button
            className="icon-btn md:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          className="md:hidden px-5 pb-4 grid gap-2"
          aria-label="Mobile navigation"
        >
          {links.map(([to, label]) => (
            <NavLink className="btn justify-start" key={to} to={to} end>
              {label}
            </NavLink>
          ))}
          {user ? (
            <>
              <Link className="btn justify-start" to="/profile">
                My profile
              </Link>
              <button className="btn justify-start" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="btn" to="/login">
                Sign in
              </Link>
              <Link className="btn btn-primary" to="/register">
                Create account
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
