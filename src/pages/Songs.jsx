import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import useSongs from "../firebase/useSongs";

function Songs() {
  const { songs, filterByValue } = useSongs();
  const [currentSongs, setCurrentSongs] = useState(songs);

  const searchSongs = useCallback(e => {
    const value = e.currentTarget.value;
    const filtered = filterByValue(value);
    setCurrentSongs(filtered);
  }, [filterByValue]);

  useEffect(() => {
    setCurrentSongs(songs);
  }, [songs]);

  return (
    <>
      <Header isBackVisible={false} />
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="py-4">
          <input
            placeholder="Buscar canciones"
            type="text"
            className="p-3 sm:p-5 mt-1 w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:leading-6"
            onChange={searchSongs}
          />
        </div>
        <main className="mx-auto max-w-none pb-8">
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {currentSongs?.map(song => <li key={song.id}>
                <Link to={`/song/${song.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    {song.title}
                  </div>
                </Link>
              </li>)}
            </ul>
          </div>
        </main>
      </div>
    </>
  );
}

export default Songs;
