import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { ProvideSongs } from "./firebase/useSongs"; 

import './App.css';

import Home from "./pages/Home";
import Song from "./pages/Song";
import Caption from "./pages/Caption";
import AddSong from "./pages/AddSong";
import Songs from "./pages/Songs";
import NavBar from "./components/NavBar";
import { Outlet } from "react-router-dom"; // add this import
import Program from "./pages/Program";
import Themes from "./pages/Themes"; // import the new Themes page

// Add a layout component to wrap NavBar and children
function Layout() {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "", element: <Home /> },
      { path: "songs", element: <Songs /> },
      { path: "caption", element: <Caption /> },
      { path: "song/:songId", element: <Song /> },
      { path: "add", element: <AddSong /> },
      { path: "program/:programId", element: <Program /> },
      { path: "themes", element: <Themes /> }, // add this line
    ],
  },
]);

function App() {
  return (
    <ProvideSongs>
      <div className="bg-gray-100 min-h-screen">
        <RouterProvider router={router} />
      </div>
    </ProvideSongs>
  );
}

export default App;
