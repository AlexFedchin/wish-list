import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import ClickSpark from "./components/reactbits/ClickSpark";
import { Loader } from "./components/ui/Loader";
import { useAuth } from "./lib/auth";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import ListPage from "./pages/ListPage";
import SharePage from "./pages/SharePage";
import NotFound from "./pages/NotFound";

function ScrollToTop() {
  const { pathname } = useLocation();
  // Braces matter: a concise body would hand scrollTo's return value back to
  // React as a cleanup function. "instant" keeps the smooth CSS scrolling for
  // in-page anchor links without animating every route change.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function Protected({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <Loader label="Getting things ready" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader label="Getting things ready" />;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <ClickSpark />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <GuestOnly>
              <SignIn />
            </GuestOnly>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnly>
              <SignUp />
            </GuestOnly>
          }
        />
        <Route
          path="/app"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/app/settings"
          element={
            <Protected>
              <Account />
            </Protected>
          }
        />
        <Route
          path="/app/list/:id"
          element={
            <Protected>
              <ListPage />
            </Protected>
          }
        />
        <Route path="/s/:token" element={<SharePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
