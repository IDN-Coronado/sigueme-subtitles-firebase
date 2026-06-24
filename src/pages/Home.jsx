import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/es"; // import Spanish locale

import usePrograms from "../firebase/usePrograms";

import ProgramList from "../components/Program/ProgramList";
import NewProgramModal from "../components/Program/NewProgramModal";

dayjs.locale("es"); // set locale globally

function Home() {
  const { programs, addProgram } = usePrograms();
  const [currentPrograms, setCurrentPrograms] = useState(programs);
  const [isNewProgramModalVisible, setIsNewProgramModalVisible] = useState(false);
  const navigate = useNavigate();

  const handleCreateProgram = async ({ date, title }) => {
    const jsDate = date.toDate(); // Convert dayjs object to JavaScript Date
    const docRef = await addProgram({
      date: jsDate,
      title: title
    });
    navigate(`/program/${docRef.id}`);
  };
  
  useEffect(() => {
    setCurrentPrograms(programs);
  }, [programs]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard de Programas</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* CTA to add new program */}
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed border-cyan-400 rounded-lg p-6 cursor-pointer hover:bg-cyan-50 min-h-[120px]"
          onClick={() => setIsNewProgramModalVisible(true)}
        >
          <span className="text-cyan-600 text-4xl mb-2">+</span>
          <span className="font-semibold text-cyan-700">Nuevo Programa</span>
        </div>
        {/* Programs */}
        <ProgramList programs={currentPrograms}  />
      </div>
      {/* New Program Modal */}
      <NewProgramModal
        isOpen={isNewProgramModalVisible}
        onCancel={() => setIsNewProgramModalVisible(false)}
        onSubmit={handleCreateProgram}
      />
    </div>
  );
}

export default Home;
