import { Link } from "react-router-dom";

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?|$)/i;

function isVideoUrl(url) {
  return VIDEO_EXTENSIONS.test(url);
}

function ThemeBackground({ url }) {
  if (!url) return null;
  if (isVideoUrl(url)) {
    return (
      <video
        src={url}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />
    );
  }
  return (
    <img
      src={url}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 w-full h-full object-cover"
      style={{ zIndex: 0 }}
    />
  );
}

function ProgramsItemsList({ title, songs, slides, onRemoveSong, onRemoveSlide, isTemporal, isSaving, programTheme }) {
  const handleRemoveSong = (e) => {
    const songId = e.currentTarget.dataset.songId;
    onRemoveSong(songId);
  };

  const handleRemoveSlide = (e) => {
    const slideId = e.currentTarget.dataset.slideId;
    onRemoveSlide(slideId);
  };

  if (songs.length === 0 && slides.length === 0) return null;

  return (
    <div className="relative">
      {/* Overlay while saving (only for temporal items) */}
      {isTemporal && isSaving && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="text-white font-semibold text-lg">Guardando...</span>
          </div>
        </div>
      )}
      <h2 className="text-lg font-semibold mb-2">
        {title}
      </h2>
      <div className={`grid ${isTemporal ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"} gap-3 mb-8`}>
        {/* Songs */}
        {songs.length > 0 &&
          songs
            .map((song, index) => (
              <div
                key={song.id || index}
                className={`relative flex flex-col items-center justify-center border rounded-lg shadow aspect-square overflow-hidden ${isTemporal ? "bg-white hover:bg-cyan-50" : ""}`}
              >
                {!isTemporal && <ThemeBackground url={programTheme?.backgroundUrl} />}
                <button
                  className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-white rounded shadow text-gray-400 hover:text-red-500 font-bold text-xs z-10"
                  title="Quitar canción"
                  onClick={handleRemoveSong}
                  style={{ padding: 0 }}
                  tabIndex={0}
                  data-song-id={song.id}
                >
                  ×
                </button>
                {!isTemporal && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-8 bg-white bg-opacity-90 z-0"></div>
                )}
                {isTemporal ? (
                  <span className="font-semibold text-center z-10">{song.title}</span>
                ) : (
                  <Link
                    to={`/song/${song.id}`}
                    className="w-full h-full flex flex-col items-center justify-center z-10"
                    tabIndex={-1}
                  >
                    <span className="font-semibold text-center">{song.title}</span>
                  </Link>
                )}
              </div>
            ))}
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            className={`relative flex flex-col items-center justify-center border rounded-lg shadow aspect-square overflow-hidden ${isTemporal ? "bg-white hover:bg-orange-50" : ""}`}
          >
            {!isTemporal && <ThemeBackground url={programTheme?.backgroundUrl} />}
            <button
              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-white rounded shadow text-gray-400 hover:text-red-500 font-bold text-xs z-10"
              title="Quitar slide"
              data-slide-id={slide.id}
              onClick={handleRemoveSlide}
              style={{ padding: 0 }}
              tabIndex={0}
            >
              ×
            </button>
            {!isTemporal && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-8 bg-white bg-opacity-90 z-0"></div>
            )}
            <span className="font-semibold text-center z-10">{slide.title || slide.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProgramsItemsList;