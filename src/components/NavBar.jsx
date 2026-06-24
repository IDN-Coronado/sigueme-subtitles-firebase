import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function NavBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Inicio", to: "/" },
    { name: "Canciones", to: "/songs" },
    { name: "Temas", to: "/themes" }, // add this line
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 font-bold text-cyan-600 text-xl">
            <Link to="/" className="hover:underline focus:outline-none">
              Sigueme
            </Link>
          </div>
          {/* Desktop menu */}
          <div className="hidden md:flex space-x-8">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === item.to
                    ? "bg-cyan-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-cyan-600 hover:bg-gray-100 focus:outline-none"
              aria-label="Main menu"
              aria-expanded={open}
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === item.to
                  ? "bg-cyan-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

export default NavBar;
