import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";

import db from "../firebase/firebase";

import { useSongs } from "../firebase/useSongs";

const CAPTION = 'caption';

function Song() {
  const [ activeLine, setActiveLine ] = useState(null);
  const { songId } = useParams();
  const { getById } = useSongs();
  const currentSong = getById(songId);

  const handleClick = async (e) => {
    const caption = e.currentTarget.value;
    setActiveLine(Number(e.currentTarget?.dataset?.index) ?? null);

    const captionRef = doc(db, CAPTION, CAPTION);

    try {
      await updateDoc(captionRef, {
        caption
      });
    } catch (e) {
      setActiveLine(null);
      console.log("No se pudo actualizar los subtítulos", e);
    }
  };

  return (
    <div className="App">
      <div className="px-4 py-2 bg-gray-400 text-left">
        <Link
          to="/"
          className="ml-6 whitespace-nowrap text-sm font-semibold text-slate-200 hover:text-slate-50"
        ><span aria-hidden="true">←</span>Home</Link>
      </div>
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {currentSong?.title}
          </h1>
          <button
            onClick={handleClick}
            value=""
            type="button"
            className="py-4 mt-4 sm:mt-0 mx-auto w-full sm:w-52 sm:mx-0 border rounded-md text-white bg-cyan-500 font-bold border-gray-300"
          >Clear</button>
        </div>
      </header>
      <main>
        <ul className="divide-y divide-gray-200 mx-auto max-w-4xl px-6 lg:px-8 bg-white shadow mt-2 py-4">
          {currentSong?.body?.map((line, i) => (
            <li
              key={i}
              className={`hover:bg-gray-100 ${activeLine === i ? 'font-bold text-cyan-500' : ''}`}>
              <button
                onClick={handleClick}
                value={line}
                type="button"
                data-index={i}
                className="py-4 mx-auto w-full"
              >
                {line}
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default Song;