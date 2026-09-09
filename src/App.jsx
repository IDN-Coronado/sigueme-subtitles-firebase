import { useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router-dom";

import "./App.css";

import Home from "./pages/Home";
import Caption from "./pages/Caption";
import Live from "./pages/Live";
import Program from "./pages/Program";
import useLocale from "./hooks/useLocale";
import { signInStoredOperator } from "./firebase/operator";
import DesktopGate from "./components/DesktopGate";
import ErrorBanner from "./components/ErrorBanner";
import LocalDataGate from "./components/LocalDataGate";

function Layout() {
  // Re-render the app shell when language changes so `t()` updates.
  useLocale();

  // Sign this machine's operator account in once, at console startup. Failures
  // are surfaced in Settings (as "not signed in") rather than blocking: the
  // console runs on local data, and only publishing a caption needs Firebase.
  useEffect(() => {
    signInStoredOperator().catch(() => {});
  }, []);

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#101415]">
      {/* The console's data lives in a local file now, so it only runs in the
          desktop app. /caption and /live are outside this layout and still
          work in a browser. */}
      <DesktopGate>
        <LocalDataGate>
          <Outlet />
        </LocalDataGate>
        {/* One error surface for the whole console — see utils/notice.js. */}
        <ErrorBanner />
      </DesktopGate>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/program/:programId", element: <Program /> },
      { path: "/songs", element: <Navigate to="/" replace /> },
      { path: "/song/:songId", element: <Navigate to="/" replace /> },
      { path: "/add", element: <Navigate to="/" replace /> },
      { path: "/themes", element: <Navigate to="/" replace /> },
      { path: "/media", element: <Navigate to="/" replace /> },
    ],
  },
  { path: "/caption", element: <Caption /> },
  { path: "/live", element: <Live /> },
]);

function App() {
  return (
    <div className="h-full min-h-0">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
