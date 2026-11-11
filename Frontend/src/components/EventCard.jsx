import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";

export default function EventCard({
  event,
  onRegister,
  isRegistered = false,
  pending = false,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const date = new Date(event.date);
  const spots = Math.max(0, event.capacity - (event.currentRegistrations || 0));
  const upcoming =
    date > new Date() && !["completed", "archived"].includes(event.status);
  const label =
    event.status === "archived"
      ? "Archived"
      : !upcoming
        ? "Past event"
        : spots === 0
          ? "Fully booked"
          : "Registration open";
  return (
    <article className="panel event-card">
      <div className="event-art">
        {event.posterUrl && !imageFailed ? (
          <img
            src={event.posterUrl}
            alt={event.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="event-date-art">
            <div>
              <span>{date.toLocaleDateString("en-IN", { month: "long" })}</span>
              <strong className="block">{date.getDate()}</strong>
            </div>
            <CalendarDays size={44} strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="event-body">
        <div>
          <span className="badge">{label}</span>
        </div>
        <h3>
          <Link to={`/events/${event._id}`}>{event.title}</Link>
        </h3>
        <p className="muted text-sm line-clamp-2 mb-3">{event.description}</p>
        <div className="event-meta">
          <CalendarDays size={15} />
          <span>
            {date.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}{" "}
            ·{" "}
            {date.toLocaleTimeString("en-IN", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="event-meta">
          <MapPin size={15} />
          <span className="truncate">{event.venue}</span>
        </div>
        {upcoming && (
          <p className="muted text-xs mt-4">
            {spots} of {event.capacity} places available
          </p>
        )}
        <div className="event-actions">
          <Link
            to={`/events/${event._id}`}
            className="flex items-center gap-1 text-sm font-semibold"
          >
            Details <ArrowUpRight size={16} />
          </Link>
          {isRegistered ? (
            <Link to="/dashboard" className="btn">
              View pass
            </Link>
          ) : upcoming && onRegister ? (
            <button
              className="btn btn-primary"
              onClick={() => onRegister(event._id)}
              disabled={pending || spots === 0}
            >
              {pending ? "Registering…" : spots === 0 ? "Full" : "Register"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
