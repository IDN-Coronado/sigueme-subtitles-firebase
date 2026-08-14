import { useMemo } from "react";

import useDataStore, { newId } from "../local/data";
import { toProgramDate } from "../i18n/formatProgramDate";
import { buildDefaultMainLogo } from "./defaultMainLogo";

// Firestore capped the list at 8 to limit reads. Kept so OpenProgramModal and
// Home's "recent" list look the same, but getById searches the full set, so
// opening an older program by URL now works — it silently returned {} before.
const RECENT_LIMIT = 8;

function byDateDesc(a, b) {
  return (
    new Date(toProgramDate(b.date) || 0) - new Date(toProgramDate(a.date) || 0)
  );
}

function usePrograms(id) {
  const allPrograms = useDataStore((s) => s.data.programs);
  const write = useDataStore((s) => s.write);

  const programs = useMemo(
    () => [...allPrograms].sort(byDateDesc).slice(0, RECENT_LIMIT),
    [allPrograms]
  );

  const getById = (programId) =>
    allPrograms.find((p) => p.id === programId) || {};

  const program = getById(id);

  const addProgram = async (fields) => {
    const mainLogo = fields.mainLogo || (await buildDefaultMainLogo());
    const next = {
      ...fields,
      // JSON has no date type; store ISO and let toProgramDate normalize on
      // read, since imported programs still carry Firestore Timestamps.
      ...(fields.date ? { date: new Date(fields.date).toISOString() } : {}),
      mainLogo,
      id: newId(),
    };
    await write({ programs: [...allPrograms, next] });
    return next;
  };

  const updateProgram = async (programId, data) => {
    await write({
      programs: allPrograms.map((p) =>
        p.id === programId ? { ...p, ...data } : p
      ),
    });
  };

  const activateProgram = async (programId) => {
    await write({
      programs: allPrograms.map((p) => ({ ...p, active: p.id === programId })),
    });
  };

  const removeProgram = async (programId) => {
    await write({ programs: allPrograms.filter((p) => p.id !== programId) });
  };

  return {
    programs,
    program,
    getById,
    addProgram,
    updateProgram,
    activateProgram,
    removeProgram,
  };
}

export default usePrograms;
