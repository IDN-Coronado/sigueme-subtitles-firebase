import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteDoc, doc } from "firebase/firestore";
import db from "../../firebase/firebase";
import ProgramItem from "./ProgramItem";
import ProgramDeleteModal from "./ProgramDeleteModal";

function ProgramList({ programs }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const navigate = useNavigate();
  

  const handleConfirmDelete = async () => {
    if (programToDelete) {
      await deleteDoc(doc(db, "programs", programToDelete));
      setShowConfirm(false);
      setProgramToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setProgramToDelete(null);
  };

  const handleOpenDelete = (programId) => {
    setProgramToDelete(programId);
    setShowConfirm(true);
  };

  return <>
    {programs.map((program) => (
      <ProgramItem
        program={program}
        onClick={e => {
          // Prevent navigation if X is clicked
          if (e.target.dataset.delete) return;
          navigate(`/program/${program.id}`);
      }}
        onDelete={e => {
          e.stopPropagation();
          handleOpenDelete(program.id);
        }}
      />
    ))}
    {/* Confirm Delete Modal */}
    <ProgramDeleteModal
      onCancel={handleCancelDelete}
      onConfirm={handleConfirmDelete}
      isOpen={showConfirm}
    />
  </>;
}

export default ProgramList;