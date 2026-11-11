import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE } from "../utils/api";

export default function CreateEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    venue: "",
    capacity: "",
    posterUrl: "",
  });
  const [loading, setLoading] = useState(!!eventId);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (!eventId) return;
    axios
      .get(`${API_BASE}/api/events/${eventId}`)
      .then(({ data }) => {
        const date = new Date(data.date);
        const localDate = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16);
        setForm({
          title: data.title,
          description: data.description,
          date: localDate,
          venue: data.venue,
          capacity: data.capacity,
          posterUrl: data.posterUrl || "",
        });
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [eventId]);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (
      file.size > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setError("Choose a JPG, PNG, or WebP image smaller than 5 MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const data = new FormData();
      data.append("image", file);
      const res = await axios.post(`${API_BASE}/api/events/upload`, data);
      setForm((prev) => ({ ...prev, posterUrl: res.data.url }));
    } catch {
      setError(
        "Poster upload failed. Please try again, or create the event without a poster.",
      );
    } finally {
      setUploading(false);
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = {
        ...form,
        capacity: Number(form.capacity),
        date: new Date(form.date).toISOString(),
      };
      if (eventId) await axios.put(`${API_BASE}/api/events/${eventId}`, data);
      else await axios.post(`${API_BASE}/api/events`, data);
      toast.success(eventId ? "Event updated." : "Event published.");
      navigate("/admin");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save this event. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="page-shell max-w-3xl">
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 muted text-sm mb-6"
      >
        <ArrowLeft size={16} />
        Back to overview
      </Link>
      <p className="eyebrow">Organiser workspace</p>
      <h1 className="page-title">
        {eventId ? "Edit event" : "Create an event"}
      </h1>
      <p className="muted mb-8">
        Give students the details they need to show up.
      </p>
      {loading ? (
        <div className="panel empty-state" role="status">
          Loading event…
        </div>
      ) : loadError ? (
        <div className="panel empty-state" role="alert">
          Couldn’t load this event. Return to the overview and try again.
        </div>
      ) : (
        <form className="panel p-6 sm:p-8 space-y-6" onSubmit={submit}>
          <div>
            <label className="block text-sm font-semibold mb-2" htmlFor="title">
              Event name
            </label>
            <input
              className="field"
              id="title"
              name="title"
              required
              value={form.title}
              onChange={update}
              placeholder="Give your event a clear name"
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              htmlFor="description"
            >
              About the event
            </label>
            <textarea
              className="field min-h-36"
              id="description"
              name="description"
              required
              value={form.description}
              onChange={update}
              placeholder="What can attendees expect? Include anything they should bring."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                htmlFor="date"
              >
                Date and time
              </label>
              <input
                className="field"
                id="date"
                name="date"
                type="datetime-local"
                required
                value={form.date}
                onChange={update}
              />
              <p className="muted text-xs mt-2">
                Shown in your local timezone.
              </p>
            </div>
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                htmlFor="capacity"
              >
                Capacity
              </label>
              <input
                className="field"
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                step="1"
                required
                value={form.capacity}
                onChange={update}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" htmlFor="venue">
              Venue
            </label>
            <input
              className="field"
              id="venue"
              name="venue"
              required
              value={form.venue}
              onChange={update}
              placeholder="Building, room, or meeting point"
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              htmlFor="poster"
            >
              Event poster <span className="muted font-normal">(optional)</span>
            </label>
            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-5">
              <Upload size={20} className="muted mb-3" />
              <input
                id="poster"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={upload}
                disabled={uploading}
                className="block max-w-full text-sm"
              />
              <p className="muted text-xs mt-3" role="status">
                {uploading
                  ? "Uploading poster…"
                  : "JPG, PNG, or WebP. Up to 5 MB."}
              </p>
              {form.posterUrl && (
                <div className="mt-4">
                  <img
                    className="max-h-48 rounded-md"
                    src={form.posterUrl}
                    alt="Event poster preview"
                  />
                  <button
                    type="button"
                    className="text-sm underline mt-2"
                    onClick={() => setForm({ ...form, posterUrl: "" })}
                  >
                    Remove poster
                  </button>
                </div>
              )}
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link to="/admin" className="btn">
              Cancel
            </Link>
            <button className="btn btn-primary" disabled={saving || uploading}>
              {saving ? "Saving…" : eventId ? "Save changes" : "Publish event"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
