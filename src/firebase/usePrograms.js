import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, limit } from "firebase/firestore";
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
    removeProgram,
  };
}

export default usePrograms;
