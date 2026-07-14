import { useState, useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from "react-router-dom";

import './App.css';

import Home from "./pages/Home";
import Song from "./pages/Song";
import Caption from "./pages/Caption";
import AddSong from "./pages/AddSong";
import Songs from "./pages/Songs";
import Program from "./pages/Program";
import Themes from "./pages/Themes";
import Sidebar from "./components/Sidebar";

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setSidebarCollapsed(true);
  }, [location.pathname]);

  const activeItem =
    location.pathname === "/" ? "programs"
    : location.pathname.includes("songs") || location.pathname.includes("song") ? "songs"
    : location.pathname.includes("themes") ? "themes"
    : "programs";

  return (
    <div className="flex min-h-screen bg-[#101415]">
      <Sidebar
        activeItem={activeItem}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
      />
      <div className="flex flex-col flex-1 min-h-screen min-w-0 ml-[72px]">
        <Outlet />
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/songs", element: <Songs /> },
      { path: "/song/:songId", element: <Song /> },
      { path: "/add", element: <AddSong /> },
      { path: "/program/:programId", element: <Program /> },
      { path: "/themes", element: <Themes /> },
    ],
  },
  { path: "/caption", element: <Caption /> },
]);

function App() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
