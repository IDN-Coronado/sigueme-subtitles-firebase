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
import AuthGate from "./components/AuthGate";
import DesktopGate from "./components/DesktopGate";
import LocalDataGate from "./components/LocalDataGate";

function Layout() {
  // Re-render the app shell when language changes so `t()` updates.
  useLocale();

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#101415]">
      {/* The console's data lives in a local file now, so it only runs in the
          desktop app. /caption and /live are outside this layout and still
          work in a browser. */}
      <DesktopGate>
        <AuthGate>
          <LocalDataGate>
            <Outlet />
          </LocalDataGate>
        </AuthGate>
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
