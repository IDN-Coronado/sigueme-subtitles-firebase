function ProgramItem({
  program,
  onClick,
  onDelete,
}) {
  return (
    <div
      key={program.id}
      className="relative border rounded-lg p-4 flex flex-col justify-center items-center bg-white shadow hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 font-bold text-lg z-10 p-2"
        data-delete="true"
        onClick={onDelete}
        title="Eliminar programa"
      >
        ×
      </button>
      <span className="font-bold text-lg mb-2">{program.title || "Programa"}</span>
      <span className="text-gray-600">
          {program.date.format("D MMMM, YYYY")}
      </span>
    </div>
  )
}

export default ProgramItem;