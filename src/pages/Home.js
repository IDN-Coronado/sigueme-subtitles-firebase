import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, limit, onSnapshot, addDoc } from "firebase/firestore";
import db from "../firebase/firebase";
import dayjs from "dayjs";
import "dayjs/locale/es"; // import Spanish locale

import ProgramList from "../components/Program/ProgramList";
import NewProgramModal from "../components/Program/NewProgramModal";

dayjs.locale("es"); // set locale globally

function Home() {
  const [programs, setPrograms] = useState([]);
  const [isNewProgramModalVisible, setIsNewProgramModalVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "programs"),
      orderBy("date", "desc"),
      limit(8)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const programsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure date is a Date object
        return ({
          id: doc.id,
          ...data,
          date: dayjs(data.date.toDate())
        })
      })
      setPrograms(programsData);
    });
    return unsub;
  }, []);

  const handleCreateProgram = async ({ date, title }) => {
    const jsDate = date.toDate(); // Convert dayjs object to JavaScript Date
    const docRef = await addDoc(collection(db, "programs"), {
      date: jsDate,
      title: title
    });
    navigate(`/program/${docRef.id}`);
  };

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
        <ProgramList programs={programs}  />
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
