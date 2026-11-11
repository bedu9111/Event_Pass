import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  CalendarDays,
  MapPin,
  Ticket,
  ArrowRight,
} from "lucide-react";
import axios from "axios";
import { API_BASE } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/registrations/my-registrations`,
      );
      setRegistrations(data.filter((r) => r.eventId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const download = (r) => {
    const a = document.createElement("a");
    a.download = `${r.eventId.title}-pass.png`;
    a.href = r.qrCodeImage;
    a.click();
  };
  return (
    <div className="page-shell">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <p className="eyebrow">Your campus calendar</p>
          <h1 className="page-title">My passes</h1>
          <p className="muted">
            Hi {user?.name?.split(" ")[0]}, here’s what you’ve signed up for.
          </p>
        </div>
        <Link className="btn" to="/">
          Explore events
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="stat-grid">
        {[
          ["Registrations", registrations.length],
          [
            "Coming up",
            registrations.filter((r) => new Date(r.eventId.date) > new Date())
              .length,
          ],
          ["Attended", registrations.filter((r) => r.isScanned).length],
        ].map(([label, value]) => (
          <div className="panel" key={label}>
            <p>{label}</p>
            <strong>{loading || error ? "—" : value}</strong>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="panel empty-state" role="status">
          Loading your passes…
        </div>
      ) : error ? (
        <div className="panel empty-state" role="alert">
          <h2>Couldn’t load your passes</h2>
          <p>Please try again in a moment.</p>
          <button className="btn" onClick={load}>
            Try again
          </button>
        </div>
      ) : !registrations.length ? (
        <div className="panel empty-state">
          <Ticket size={34} />
          <h2>Your next event is waiting</h2>
          <p>Register for an event and your entry pass will appear here.</p>
          <Link className="btn btn-primary" to="/">
            Find an event
          </Link>
        </div>
      ) : (
        <div className="event-grid">
          {registrations.map((r) => (
            <article className="panel p-6" key={r._id}>
              <span className="badge">
                {r.isScanned
                  ? "Checked in"
                  : new Date(r.eventId.date) > new Date()
                    ? "Upcoming"
                    : "Past event"}
              </span>
              <h2 className="text-xl font-semibold mt-4 mb-3">
                <Link to={`/events/${r.eventId._id}`}>{r.eventId.title}</Link>
              </h2>
              <p className="event-meta">
                <CalendarDays size={15} />
                {new Date(r.eventId.date).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <p className="event-meta">
                <MapPin size={15} />
                {r.eventId.venue}
              </p>
              <div className="my-5 border-t border-dashed border-gray-300 dark:border-gray-600 pt-5">
                <img
                  className="w-40 h-40 mx-auto bg-white rounded-md p-2"
                  src={r.qrCodeImage}
                  alt={`Entry QR code for ${r.eventId.title}`}
                />
                <p className="muted text-xs text-center mt-3">
                  {r.isScanned
                    ? `Checked in ${new Date(r.scannedAt).toLocaleString()}`
                    : "Show this pass at the entrance"}
                </p>
              </div>
              <button className="btn w-full" onClick={() => download(r)}>
                <Download size={16} />
                Download pass
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
