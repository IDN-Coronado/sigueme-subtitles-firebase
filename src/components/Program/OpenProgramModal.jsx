import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

const MONO = { fontFamily: "JetBrains Mono, monospace" };

function OpenProgramModal({ isOpen, onClose, programs = [], onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1d2022] border border-[rgba(69,70,77,0.4)] rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.45)] flex flex-col w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(69,70,77,0.3)]">
          <div>
            <p
              className="text-[#7bd0ff] text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              Programs
            </p>
            <h2 className="text-[#e0e3e5] font-semibold text-lg tracking-tight">
              Abrir programa
            </h2>
          </div>
          <button
            type="button"
            className="text-[#6b7280] hover:text-[#e0e3e5] text-2xl leading-none transition-colors"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-2">
          {programs.length === 0 && (
            <p className="text-[#6b7280] text-sm text-center py-8">
              No hay programas guardados.
            </p>
          )}
          {programs.map((program) => {
            const formattedDate = program.date?.toDate
              ? dayjs(program.date.toDate()).format("D MMM, YYYY")
              : "";
            return (
              <button
                key={program.id}
                type="button"
                onClick={() => onSelect(program)}
                className="text-left w-full border border-[rgba(69,70,77,0.35)] bg-[rgba(16,20,21,0.5)] rounded-lg px-4 py-3 hover:border-[rgba(123,208,255,0.4)] hover:bg-[rgba(123,208,255,0.08)] transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-semibold text-[#e0e3e5] truncate">
                    {program.title || "Programa"}
                  </p>
                  {program.active && (
                    <span
                      className="shrink-0 inline-flex items-center gap-1.5 bg-[rgba(0,166,224,0.2)] text-[#7bd0ff] text-[10px] font-medium tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-sm"
                      style={MONO}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7bd0ff] animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
                {formattedDate && (
                  <p className="text-[#6b7280] text-sm mt-0.5" style={MONO}>
                    {formattedDate}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end px-5 sm:px-6 py-4 border-t border-[rgba(69,70,77,0.3)]">
          <button
            type="button"
            className="px-4 py-2 text-[#c6c6cd] text-sm border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default OpenProgramModal;
