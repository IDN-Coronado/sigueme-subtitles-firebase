import React from "react";
import { useNavigate } from "react-router-dom";

import { useSongs } from "../firebase/useSongs";

import Header from "../components/Header";

const AddSong = () => {
  const { addSong } = useSongs();
  const navigate = useNavigate();

  const lineRef = React.useRef();
  const [lines, setLines] = React.useState([]);
  const [title, setTitle] = React.useState("");
  const [isError, setIsError] = React.useState(false);

  const onAddLine = (e) => {
    e.preventDefault();
    lineRef.current.value && setLines([...lines, lineRef.current.value]);
    lineRef.current.value = "";
    lineRef.current.focus();
  };

  const onRemoveLine = (e) => {
    e.preventDefault();
    const index = e.currentTarget.dataset.index;
    setLines(lines.filter((_, i) => i !== Number(index)));
  };

  const onSaveSong = (e) => {
    e.preventDefault();
    const confirmed = window.confirm("¿Estás seguro de guardar la canción?");
    if (!confirmed && (!lines.length || !title)) {
      setIsError(true);
      return
    };
    addSong(title, lines);
    navigate('/');

  };

  return (
    <>
      {isError && <div className="px-4 py-2 bg-red-400 text-left flex justify-between">
        <p className="text-white font-bold">Por favor llenar todos los campos</p>
        <button className="text-white font-extrabold mr-8" onClick={() => setIsError(false)}>X</button>
      </div>}
      <Header isAddVisible={false} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Agregar canción
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Agrega una nueva canción a la lista.
                </p>
              </div>
            </div>
            <div className="px-4 py-5 sm:px-6 border-t border-gray-200 ">
              <div className="basis-1/2">
                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Título
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.currentTarget.value)}
                    autoComplete="given-name"
                    className="p-3 sm:p3 mt-1 w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:leading-6"
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="col-span-6">
                  <label
                    htmlFor="body"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Letra
                  </label>
                  {lines.map((line, i) => (
                    <div key={i} className="border-y py-2 my-6 flex justify-between items-center">
                      <p>
                        {line}
                      </p>
                      <button
                        onClick={onRemoveLine}
                        className="py-2 px-4 bg-cyan-500 text-white font-medium rounded-md"
                        data-index={i}
                      >Borrar linea</button>
                    </div>
                  ))}
                  <div className="flex justify-between gap-8">
                    <input
                      type="text"
                      name="body"
                      id="body"
                      ref={lineRef}
                      autoComplete="family-name"
                      className="p-3 sm:p3 mt-1 w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:leading-6"
                    />
                    <button
                      onClick={onAddLine}
                      className="px-8 w-60 bg-cyan-500 text-white font-medium rounded-md"
                    >Agregar linea</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-20 pb-4 py-3 bg-gray-50 text-left sm:px-6">
              <button
                type="submit"
                className="p-4 w-60 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md"
                onClick={onSaveSong}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddSong;
