import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";
import { API_BASE } from "../utils/api";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowRight, Search, CalendarDays, RefreshCw } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("upcoming");
  const [pending, setPending] = useState(null);
  const fetchEvents = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get(`${API_BASE}/api/events`);
      setEvents(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchEvents();
  }, []);
  useEffect(() => {
    setRegistrations([]);
    if (user?.role === "student")
      axios
        .get(`${API_BASE}/api/registrations/my-registrations`)
        .then(({ data }) => setRegistrations(data))
        .catch(() => toast.error("Could not load your registrations."));
  }, [user]);
  const register = async (id) => {
    if (pending) return;
    setPending(id);
    try {
      await axios.post(`${API_BASE}/api/registrations/${id}`);
      setRegistrations((prev) => [...prev, { eventId: { _id: id } }]);
      setEvents((prev) =>
        prev.map((e) =>
          e._id === id
            ? { ...e, currentRegistrations: e.currentRegistrations + 1 }
            : e,
        ),
      );
      toast.success("You’re registered. Your QR pass is in My passes.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setPending(null);
    }
  };
  const visible = events
    .filter((e) => {
      const upcoming =
        new Date(e.date) > new Date() &&
        !["completed", "archived"].includes(e.status);
      return (
        (filter === "all" || (filter === "upcoming" ? upcoming : !upcoming)) &&
        `${e.title} ${e.venue}`
          .toLowerCase()
          .includes(query.toLowerCase().trim())
      );
    })
    .sort((a, b) =>
      filter === "past"
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date),
    );
  return (
    <div className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Your campus. Your calendar.</p>
          <h1>
            Make time for
            <br />
            something good.
          </h1>
          <p>
            Find your next college event, reserve a place, and keep your entry
            pass close at hand.
          </p>
          <a href="#events" className="btn btn-primary mt-6">
            Explore events <ArrowRight size={16} />
          </a>
        </div>
        <aside className="hero-note">
          <div className="flex items-center justify-between">
            <span className="eyebrow">From discovery to the door</span>
            <CalendarDays size={20} />
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                Find your event
                <p>See what’s happening and check the details.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                Save your spot<p>Register and receive your personal QR pass.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                Show up, scan in<p>Keep your pass ready at the entrance.</p>
              </div>
            </li>
          </ol>
        </aside>
      </section>
      <section id="events" className="pt-10 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="eyebrow">The campus calendar</p>
            <h2 className="text-3xl font-semibold mt-2">
              Find your next event
            </h2>
          </div>
          {user && (
            <Link
              to={user.role === "admin" ? "/admin" : "/dashboard"}
              className="text-sm font-semibold flex items-center gap-2"
            >
              {user.role === "admin" ? "Manage events" : "My passes"}{" "}
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-7">
          <div className="flex gap-1" aria-label="Filter events">
            {[
              ["upcoming", "Upcoming"],
              ["past", "Past events"],
              ["all", "All events"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`btn ${filter === value ? "btn-primary" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="relative sm:w-72">
            <span className="sr-only">Search events by name or venue</span>
            <Search size={17} className="absolute left-3 top-3.5 muted" />
            <input
              className="field pl-10"
              placeholder="Search events or venues"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        {loading ? (
          <div className="panel empty-state" role="status">
            Loading events…
          </div>
        ) : error ? (
          <div className="panel empty-state" role="alert">
            <RefreshCw size={28} />
            <h3>We couldn’t load events</h3>
            <p>Please check your connection and try again.</p>
            <button className="btn" onClick={fetchEvents}>
              Try again
            </button>
          </div>
        ) : visible.length ? (
          <>
            <p className="muted text-xs mb-4" aria-live="polite">
              {visible.length} {visible.length === 1 ? "event" : "events"}
            </p>
            <div className="event-grid">
              {visible.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onRegister={user?.role === "student" ? register : null}
                  isRegistered={registrations.some(
                    (r) => r.eventId?._id === event._id,
                  )}
                  pending={pending === event._id}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="panel empty-state">
            <CalendarDays size={32} />
            <h3>
              {query ? "No matching events" : "Nothing on the calendar yet"}
            </h3>
            <p>
              {query
                ? "Try another event name or venue."
                : "When an event is published, you’ll find it here."}
            </p>
            {query ? (
              <button className="btn" onClick={() => setQuery("")}>
                Clear search
              </button>
            ) : user?.role === "admin" ? (
              <Link className="btn btn-primary" to="/admin/create-event">
                Create an event
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
