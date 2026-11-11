import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  ScanLine,
  CalendarDays,
  Search,
  ArrowUpRight,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE } from "../utils/api";

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState(null);
  const load = async () => {
    setLoading(true);
    setError(false);
    setAttendance(null);
    try {
      const { data } = await axios.get(`${API_BASE}/api/events/mine`);
      setEvents(data);
      const results = await Promise.allSettled(
        data.map((e) =>
          axios.get(`${API_BASE}/api/registrations/event/${e._id}`),
        ),
      );
      if (results.every((r) => r.status === "fulfilled"))
        setAttendance(
          results.reduce(
            (sum, r) =>
              sum + r.value.data.filter((reg) => reg.isScanned).length,
            0,
          ),
        );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const remove = async (event) => {
    if (
      !window.confirm(
        `Delete “${event.title}” and its registrations? This cannot be undone.`,
      )
    )
      return;
    setDeleting(event._id);
    try {
      await axios.delete(`${API_BASE}/api/events/${event._id}`);
      toast.success("Event deleted.");
      await load();
    } catch {
      toast.error("Could not delete this event.");
    } finally {
      setDeleting(null);
    }
  };
  const filtered = events.filter((e) =>
    `${e.title} ${e.venue}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="eyebrow">Organiser workspace</p>
          <h1 className="page-title">Event overview</h1>
          <p className="muted">
            Manage your calendar and keep track of attendance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link className="btn" to="/admin/scan">
            <ScanLine size={17} />
            Check-in
          </Link>
          <Link className="btn btn-primary" to="/admin/create-event">
            <Plus size={17} />
            Create event
          </Link>
        </div>
      </div>
      <div className="stat-grid">
        {[
          ["Published events", events.length],
          [
            "Registrations",
            events.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0),
          ],
          ["Checked in", attendance ?? "—"],
        ].map(([label, value]) => (
          <div className="panel" key={label}>
            <p>{label}</p>
            <strong>{loading || error ? "—" : value}</strong>
          </div>
        ))}
      </div>
      <section className="panel overflow-hidden">
        <div className="p-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Your events</h2>
          <label className="relative">
            <span className="sr-only">Search your events</span>
            <Search size={16} className="absolute left-3 top-3.5 muted" />
            <input
              className="field pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events"
            />
          </label>
        </div>
        {loading ? (
          <div className="empty-state" role="status">
            Loading your events…
          </div>
        ) : error ? (
          <div className="empty-state" role="alert">
            <h3>Couldn’t load your events</h3>
            <button className="btn" onClick={load}>
              Try again
            </button>
          </div>
        ) : !filtered.length ? (
          <div className="empty-state">
            <CalendarDays size={32} />
            <h3>
              {query ? "No matching events" : "Your first event starts here"}
            </h3>
            <p>
              {query
                ? "Try another search."
                : "Add the details, set a capacity, and open registrations."}
            </p>
            {!query && (
              <Link className="btn btn-primary" to="/admin/create-event">
                Create event
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="muted text-xs">
                <tr>
                  {["Event", "Date & venue", "Registrations", "Actions"].map(
                    (h) => (
                      <th
                        scope="col"
                        className="px-6 py-4 font-medium whitespace-nowrap"
                        key={h}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr
                    key={event._id}
                    className="border-t border-gray-200 dark:border-gray-700"
                  >
                    <td className="px-6 py-5 min-w-48">
                      <Link
                        className="font-semibold text-base"
                        to={`/admin/event/${event._id}`}
                      >
                        {event.title}
                      </Link>
                      <div className="mt-2">
                        <span className="badge">{event.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="whitespace-nowrap">
                        {new Date(event.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="muted mt-1">{event.venue}</p>
                    </td>
                    <td className="px-6 py-5 tabular-nums">
                      {event.currentRegistrations}{" "}
                      <span className="muted">/ {event.capacity}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        <Link
                          className="btn"
                          to={`/admin/event/${event._id}`}
                          aria-label={`View registrations for ${event.title}`}
                        >
                          <ArrowUpRight size={16} />
                        </Link>
                        <Link
                          className="btn"
                          to={`/admin/edit-event/${event._id}`}
                        >
                          Edit
                        </Link>
                        <button
                          className="btn btn-danger"
                          disabled={deleting === event._id}
                          onClick={() => remove(event)}
                        >
                          {deleting === event._id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
