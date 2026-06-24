function ThemeItem({ theme, onDelete }) {
  return (
    <div
      key={theme.id}
      className="relative border rounded-lg flex flex-col items-center bg-white shadow aspect-[16/9] overflow-hidden p-0 group"
    >
      <button
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white rounded shadow text-gray-400 hover:text-red-500 font-bold text-lg z-10"
        title="Eliminar tema"
        onClick={() => onDelete(theme)}
        style={{ padding: 0 }}
      >
        ×
      </button>
      <div className="w-full h-full flex-1 flex items-center justify-center">
        {theme.type === "video" ? (
          <video
            src={theme.backgroundUrl}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
          />
        ) : theme.type === "image" ? (
          <img
            src={theme.backgroundUrl}
            alt={theme.title}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
      {/* Metadata bar for touch devices */}
      <div className="block md:hidden absolute bottom-0 left-0 w-full bg-black bg-opacity-80 py-2 px-2">
        <span className="font-semibold text-white text-sm truncate">{theme.title}</span>
      </div>
      {/* Metadata bar for non-touch devices (on hover) */}
      <div className="hidden md:block absolute bottom-0 left-0 w-full pointer-events-none">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div
            className="w-full py-2 px-2"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0) 100%)"
            }}
          >
            <span className="font-semibold text-white text-sm truncate">{theme.title}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThemeItem;