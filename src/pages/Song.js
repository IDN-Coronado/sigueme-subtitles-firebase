import { useState } from "react";
import { useParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";

import db from "../firebase/firebase";

import { useSongs } from "../firebase/useSongs";

const CAPTION = 'caption';

function Song() {
  const [ activeLine, setActiveLine ] = useState(null);
  const [ editIndex, setEditIndex ] = useState(null);
  const [ editValue, setEditValue ] = useState("");
  const [ isSaving, setIsSaving ] = useState(false);
  const [ isEditionMode, setIsEditionMode ] = useState(false);
  const { songId } = useParams();
  const { getById, updateSongLines } = useSongs();
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

  // Edit handlers
  const handleEditClick = (i, line) => {
    setEditIndex(i);
    setEditValue(line);
  };

  const handleEditChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleEditSave = async () => {
    if (editIndex === null) return;
    setIsSaving(true);
    try {
      const newLines = currentSong.body.map((l, i) => i === editIndex ? editValue : l);
      await updateSongLines(songId, newLines);
      setEditIndex(null);
      setEditValue("");
    } catch (e) {
      alert("No se pudo guardar el cambio");
    }
    setIsSaving(false);
  };

  const handleEditCancel = () => {
    setEditIndex(null);
    setEditValue("");
  };

  return (
    <div className="App">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {currentSong?.title}
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleClick}
              value=""
              type="button"
              className="py-4 mt-4 sm:mt-0 mx-auto w-full sm:w-52 sm:mx-0 border rounded-md text-white bg-cyan-500 font-bold border-gray-300"
            >Clear</button>
            <button
              type="button"
              className={`py-4 mt-4 sm:mt-0 mx-auto w-full sm:w-52 sm:mx-0 border rounded-md font-bold border-gray-300 ${isEditionMode ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setIsEditionMode(v => !v)}
            >
              {isEditionMode ? "Desactivar edición" : "Editar líneas"}
            </button>
          </div>
        </div>
      </header>
      <main>
        <ul className="divide-y divide-gray-200 mx-auto max-w-4xl px-6 lg:px-8 bg-white shadow mt-2 py-4">
          {currentSong?.body?.map((line, i) => (
            <li
              key={i}
              className={`hover:bg-gray-100 ${activeLine === i ? 'font-bold text-cyan-500' : ''}`}>
              {editIndex === i ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={handleEditChange}
                    className="py-2 px-2 border rounded w-full"
                    disabled={isSaving}
                  />
                  <button
                    onClick={handleEditSave}
                    className="px-2 py-1 bg-green-500 text-white rounded"
                    disabled={isSaving}
                  >Guardar</button>
                  <button
                    onClick={handleEditCancel}
                    className="px-2 py-1 bg-gray-300 text-black rounded"
                    disabled={isSaving}
                  >Cancelar</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClick}
                    value={line}
                    type="button"
                    data-index={i}
                    className="py-4 mx-auto w-full text-left"
                  >
                    {line}
                  </button>
                  {isEditionMode && (
                    <button
                      onClick={() => handleEditClick(i, line)}
                      className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
                    >Editar</button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default Song;