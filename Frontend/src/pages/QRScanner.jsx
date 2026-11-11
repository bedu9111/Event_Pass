import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  Upload,
  ScanLine,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import axios from "axios";
import { API_BASE } from "../utils/api";

export default function QRScanner() {
  const scannerRef = useRef(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const stop = async () => {
    const scanner = scannerRef.current;
    if (scanner?.isScanning) await scanner.stop();
    if (mountedRef.current) setScanning(false);
  };
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const scanner = scannerRef.current;
      if (scanner?.isScanning)
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
    };
  }, []);
  const verify = async (data) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await stop();
      const { data: response } = await axios.post(`${API_BASE}/api/scan`, {
        qrCodeData: data,
      });
      if (mountedRef.current) setResult(response.registration);
    } catch (err) {
      if (mountedRef.current)
        setError(
          err.response?.data?.message ||
            "Could not verify this pass. Please try again.",
        );
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  };
  const start = async () => {
    setError("");
    setResult(null);
    setBusy(true);
    try {
      scannerRef.current ??= new Html5Qrcode("qr-reader");
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (w, h) => ({
            width: Math.floor(Math.min(w, h) * 0.7),
            height: Math.floor(Math.min(w, h) * 0.7),
          }),
        },
        verify,
        () => {},
      );
      if (!mountedRef.current) {
        await scannerRef.current.stop();
        return;
      }
      setScanning(true);
    } catch {
      setError(
        "Camera unavailable. Allow camera access, or upload a QR pass image below.",
      );
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };
  const scanFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setError("");
    setResult(null);
    setBusy(true);
    try {
      await stop();
      scannerRef.current ??= new Html5Qrcode("qr-reader");
      const data = await scannerRef.current.scanFile(file, false);
      await verify(data);
    } catch {
      setError(
        "No readable QR code found. Choose a clear image of an EventPass QR code.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page-shell max-w-4xl">
      <Link
        className="inline-flex gap-2 items-center text-sm muted mb-6"
        to="/admin"
      >
        <ArrowLeft size={16} />
        Back to overview
      </Link>
      <p className="eyebrow">At the entrance</p>
      <h1 className="page-title">Check in attendees</h1>
      <p className="muted mb-8">
        Scan a student’s EventPass QR code to verify their entry.
      </p>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <section className="panel p-6">
          <div className="min-h-52 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
            <div id="qr-reader" />
            {!scanning && (
              <div className="text-center p-10">
                <ScanLine
                  size={44}
                  strokeWidth={1}
                  className="mx-auto muted mb-4"
                />
                <p className="muted text-sm">
                  Position the QR code inside the camera frame.
                </p>
              </div>
            )}
          </div>
          <div className="mt-5 flex gap-3">
            <button
              className="btn btn-primary flex-1"
              onClick={
                scanning
                  ? () =>
                      stop().catch(() =>
                        setError(
                          "Could not stop the camera. Reload this page.",
                        ),
                      )
                  : start
              }
              disabled={busy}
            >
              <Camera size={17} />
              {scanning
                ? "Stop camera"
                : busy
                  ? "Please wait…"
                  : "Start camera"}
            </button>
          </div>
          <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
            <label
              htmlFor="qr-file"
              className="text-sm font-semibold flex items-center gap-2 mb-3"
            >
              <Upload size={16} />
              Or upload a QR pass
            </label>
            <input
              id="qr-file"
              className="text-sm max-w-full"
              type="file"
              accept="image/*"
              onChange={scanFile}
              disabled={busy}
            />
          </div>
        </section>
        <section className="panel p-6" aria-live="polite">
          {error ? (
            <>
              <AlertCircle size={28} className="text-red-600 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Entry not confirmed
              </h2>
              <p className="muted">{error}</p>
            </>
          ) : result ? (
            <>
              <CheckCircle size={30} className="text-green-600 mb-4" />
              <h2 className="text-xl font-semibold mb-5">You’re checked in</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="muted text-xs mb-1">Attendee</dt>
                  <dd className="font-semibold">{result.studentId?.name}</dd>
                  <dd className="muted text-sm">
                    {result.studentId?.rollNumber}
                  </dd>
                </div>
                <div>
                  <dt className="muted text-xs mb-1">Event</dt>
                  <dd>{result.eventId?.title}</dd>
                </div>
                <div>
                  <dt className="muted text-xs mb-1">Check-in time</dt>
                  <dd>{new Date(result.scannedAt).toLocaleTimeString()}</dd>
                </div>
              </dl>
              <button
                className="btn w-full mt-6"
                onClick={start}
                disabled={busy}
              >
                Scan next pass
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-3">Ready when you are</h2>
              <p className="muted text-sm leading-6">
                A verified pass shows the attendee and event here. Each pass can
                be checked in once.
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
