import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, limit, writeBatch } from "firebase/firestore";
import db from "./firebase";
import { create } from "zustand";

const COLLECTION_NAME = 'programs';

const useProgramsStore = create(set => ({
  programs: [],
  setPrograms: (programs) => set({ programs }),
  setInitialized: (val) => set({ initialized: val }),
}));

function usePrograms(id) {
  const [ program, setProgram ] = useState({});
  const { programs, setPrograms } = useProgramsStore();

  const getById = (id, dbPrograms = programs) =>
    dbPrograms.filter(p => p.id === id).shift() || {};

  const addProgram = async (program) => {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), program);
    setPrograms([
      ...programs,
      { ...program, id: docRef.id }
    ]);
    return docRef;
  };

  const updateProgram = async (id, data) => {
    const programRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(programRef, data);
    setPrograms(programs.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const activateProgram = async (id) => {
    const batch = writeBatch(db);
    programs.forEach(p => {
      const ref = doc(db, COLLECTION_NAME, p.id);
      batch.update(ref, { active: p.id === id });
    });
    await batch.commit();
    setPrograms(programs.map(p => ({ ...p, active: p.id === id })));
  };

  const removeProgram = async (id) => {
    const programRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(programRef);
    setPrograms(programs.filter(p => p.id !== id));
  };

  useEffect(() => {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(
      collectionRef,
      orderBy("date", "desc"),
      limit(8)
    );
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const dbPrograms = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setPrograms(dbPrograms);
      setProgram(getById(id, dbPrograms));
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [setPrograms, id]);

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
