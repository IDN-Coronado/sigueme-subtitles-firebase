function ProgramDeleteModal ({
  isOpen,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-lg flex flex-col gap-4 min-w-[300px]">
        <span className="font-semibold text-lg mb-2">¿Estás seguro de eliminar este programa?</span>
        <div className="flex gap-4 justify-end">
          <button
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={onConfirm}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProgramDeleteModal;