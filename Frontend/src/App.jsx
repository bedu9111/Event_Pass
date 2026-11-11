import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import EventDetails from "./pages/EventDetails";
const QRScanner = lazy(() => import("./pages/QRScanner"));
import CreateEvent from "./pages/CreateEvent";
import AdminEventDetails from "./pages/AdminEventDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:block focus:p-3"
          >
            Skip to content
          </a>
          <Navbar />
          <main id="main-content">
            <Suspense
              fallback={
                <div className="page-shell empty-state" role="status">
                  Loading…
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/events/:id" element={<EventDetails />} />

                {/* Protected Student Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute studentOnly>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/create-event"
                  element={
                    <ProtectedRoute adminOnly>
                      <CreateEvent />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/edit-event/:eventId"
                  element={
                    <ProtectedRoute adminOnly>
                      <CreateEvent />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/event/:eventId"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminEventDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/scan"
                  element={
                    <ProtectedRoute adminOnly>
                      <QRScanner />
                    </ProtectedRoute>
                  }
                />
                {/* Protected Student/Admin Profile Route */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="*"
                  element={
                    <div className="page-shell empty-state">
                      <h1 className="page-title">Page not found</h1>
                      <a href="/" className="btn">
                        Back to events
                      </a>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </main>
          <footer className="site-footer">
            <span>EventPass · Campus events, organised.</span>
            <span>Discover. Register. Attend.</span>
          </footer>
          <Toaster position="bottom-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
