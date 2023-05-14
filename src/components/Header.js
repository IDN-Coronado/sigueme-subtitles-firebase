import React from "react";

import { Link } from "react-router-dom";

const Header = ({
  isBackVisible = true,
  isAddVisible = true,
}) => (
  <>
    {isBackVisible && <div className="px-4 py-2 bg-gray-400 text-left">
      <Link
        to="/"
        className="ml-6 whitespace-nowrap text-sm font-semibold text-slate-200 hover:text-slate-50"
      ><span aria-hidden="true">←</span>Home</Link>
    </div>}
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Canciones
        </h1>
        {isAddVisible && <Link to="/add" className="p-0 text-cyan-500 font-bold flex items-center">
          <span>Agregar canción</span>
        </Link>}
      </div>
    </header>
  </>
);

export default Header;