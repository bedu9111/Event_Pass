import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, MapPin, Users, ArrowLeft, Ticket } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE}/api/events/${id}`);
      setEvent(data);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "This event is no longer available."
          : "We couldn’t load this event. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [id]);
  useEffect(() => {
    setRegistered(false);
    if (user?.role === "student")
      axios
        .get(`${API_BASE}/api/registrations/my-registrations`)
        .then(({ data }) =>
          setRegistered(data.some((r) => r.eventId?._id === id)),
        )
        .catch(() => {});
  }, [id, user]);
  const register = async () => {
    setBusy(true);
    try {
      await axios.post(`${API_BASE}/api/registrations/${id}`);
      setRegistered(true);
      setEvent((prev) => ({
        ...prev,
        currentRegistrations: prev.currentRegistrations + 1,
      }));
      toast.success("Your place is reserved.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const upcoming =
    event &&
    new Date(event.date) > new Date() &&
    !["completed", "archived"].includes(event.status);
  const spots = event
    ? Math.max(0, event.capacity - event.currentRegistrations)
    : 0;
  return (
    <div className="page-shell">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm muted mb-7"
      >
        <ArrowLeft size={16} />
        Back to events
      </Link>
      {loading ? (
        <div className="panel empty-state" role="status">
          Loading event…
        </div>
      ) : error ? (
        <div className="panel empty-state" role="alert">
          <h1 className="text-xl mb-5">{error}</h1>
          <button className="btn" onClick={load}>
            Try again
          </button>
        </div>
      ) : (
        event && (
          <>
            <div className="mb-8">
              <span className="badge">
                {upcoming ? "Upcoming event" : "Past event"}
              </span>
              <h1 className="page-title">{event.title}</h1>
              <p className="muted">
                Hosted by {event.createdBy?.name || "Campus organisers"}
              </p>
            </div>
            <div className="grid md:grid-cols-[1.6fr_1fr] gap-8 items-start">
              <section className="panel overflow-hidden">
                {event.posterUrl && (
                  <img
                    src={event.posterUrl}
                    alt={event.title}
                    className="w-full max-h-96 object-cover"
                  />
                )}
                <div className="p-7">
                  <h2 className="text-xl font-semibold mb-4">
                    About this event
                  </h2>
                  <p className="muted leading-7 whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              </section>
              <aside className="panel p-7">
                <h2 className="text-xl font-semibold mb-5">Plan your visit</h2>
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <CalendarDays size={19} className="muted shrink-0 mt-1" />
                    <div>
                      <p>
                        {new Date(event.date).toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="muted text-sm mt-1">
                        {new Date(event.date).toLocaleTimeString("en-IN", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin size={19} className="muted shrink-0" />
                    {event.venue}
                  </div>
                  <div className="flex gap-3">
                    <Users size={19} className="muted shrink-0" />
                    {spots} of {event.capacity} places available
                  </div>
                </div>
                <div className="mt-7 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {registered ? (
                    <>
                      <p className="text-sm mb-4">
                        You’re on the list. Your pass is ready.
                      </p>
                      <Link to="/dashboard" className="btn btn-primary w-full">
                        <Ticket size={17} />
                        View my pass
                      </Link>
                    </>
                  ) : !upcoming ? (
                    <p className="muted text-sm">
                      Registration for this event has closed.
                    </p>
                  ) : !user ? (
                    <Link to="/login" className="btn btn-primary w-full">
                      Sign in to register
                    </Link>
                  ) : user.role === "student" ? (
                    <button
                      className="btn btn-primary w-full"
                      onClick={register}
                      disabled={busy || spots === 0}
                    >
                      {busy
                        ? "Reserving your place…"
                        : spots === 0
                          ? "Fully booked"
                          : "Register for event"}
                    </button>
                  ) : event.createdBy?._id === user.id ? (
                    <Link to={`/admin/event/${id}`} className="btn w-full">
                      View registrations
                    </Link>
                  ) : (
                    <p className="muted text-sm">
                      This event is managed by{" "}
                      {event.createdBy?.name || "another organiser"}.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </>
        )
      )}
    </div>
  );
}
