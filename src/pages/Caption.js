import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import db from "../firebase/firebase";

const CAPTION = 'caption';

const Caption = () => {
  const [ caption, setCaption ] = useState('');

  
  useEffect(() => {
    const captionRef = doc(db, CAPTION, CAPTION);
    const unsub = onSnapshot(captionRef, doc =>
      setCaption(doc.data()?.caption)
    );
    return unsub;
  }, [])

  return <div className="grid h-screen place-items-center bg-lime-400">
    {caption && <h1 className="text-6xl bg-zinc-900 p-2 text-white">
      {caption}
    </h1>}
  </div>
}

export default Caption;