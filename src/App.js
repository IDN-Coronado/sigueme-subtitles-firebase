import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { ProvideSongs } from "./firebase/useSongs"; 

import './App.css';

import Home from "./pages/Home";
import Song from "./pages/Song";
import Caption from "./pages/Caption";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/caption",
    element: <Caption />,
  },
  {
    path: "/song/:songId",
    element: <Song />,
  },
]);

function App() {
  return (
    <ProvideSongs>
      <div className="bg-gray-100 h-screen">
        <RouterProvider router={router} />
      </div>
    </ProvideSongs>
  );
}

export default App;
