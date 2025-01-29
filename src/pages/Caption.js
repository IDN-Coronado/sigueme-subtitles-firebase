import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { ChromePicker } from 'react-color';
import tinycolor from "tinycolor2";

import db from "../firebase/firebase";

const CAPTION = 'caption';
const LOCAL_STORAGE_COLOR = 'sigueme:color';
const LOCAL_STORAGE_CC = 'sigueme:cc';
const DEFAULT_BG = '#a3e635';

const getColor = () => {
  const color = localStorage.getItem(LOCAL_STORAGE_COLOR);
  return color ? JSON.parse(color) : { hex: DEFAULT_BG };
};

const getIsCC = () => {
  const cc = localStorage.getItem(LOCAL_STORAGE_CC);
  return cc ? JSON.parse(cc) : true;
};

const Caption = () => {
  const [ caption, setCaption ] = useState('');
  const [ color, setColor ] = useState(getColor());
  const [ isCC, setIsCC ] = useState(getIsCC());
  const [ isPickerVisible, setIsPickerVisible ] = useState(false);
  const [ isActionsVisible, setIsActionsVisible ] = useState(false);

  const onColorChange = color => {
    setColor(color);
  }

  const onButtonClick = () => {
    const colorString = JSON.stringify(color);
    localStorage.setItem(LOCAL_STORAGE_COLOR, colorString);
    setIsPickerVisible(!isPickerVisible);
  }

  const onReset = () => {
    localStorage.removeItem(LOCAL_STORAGE_COLOR);
    setColor({ hex: DEFAULT_BG });
  };

  const onCCStyle = () => {
    const newCCState = !isCC;
    localStorage.setItem(LOCAL_STORAGE_CC, JSON.stringify(newCCState));
    setIsCC(newCCState);
  }

  useEffect(() => {
    const captionRef = doc(db, CAPTION, CAPTION);
    const unsub = onSnapshot(captionRef, doc =>
      setCaption(doc.data()?.caption)
    );
    return unsub;
  }, [])

  const textColor = tinycolor(color.hex).isDark() || isCC ? 'white' : 'black';

  return <div className="grid h-screen place-items-center" style={{ backgroundColor: color.hex }}>
    {caption && <h1 className={`text-6xl p-2 text-${textColor} ${isCC ? 'bg-zinc-900' : ''}`}>
      {caption}
    </h1>}
    <div
      className="absolute bottom-2 right-2 flex"
      style={{ opacity: isActionsVisible || isPickerVisible ? 1 : 0, transition: 'opacity 300ms 300ms' }}
      onMouseEnter={() => setIsActionsVisible(true)}
      onFocus={() => setIsActionsVisible(true)}
      onMouseLeave={() => setIsActionsVisible(false)}
      onBlur={() => setIsActionsVisible(false)}
    >
      <button
        type="button"
        className="text-lg border-2 border-zinc-900 text-zinc-900 rounded-md p-0"
        onClick={onButtonClick}
      >
        <div className="border-4 border-gray-500 px-4 py-2 rounded-md" style={{ backgroundColor: color.hex }} />
      </button>
      <button
        type="button"
        className="text-xs ml-2 text-zinc-900"
        onClick={onReset}
      >RESET</button>
      <button
        type="button"
        className="text-xs ml-2 text-zinc-900"
        onClick={onCCStyle}
      >CC Style</button>
    </div>
    {isPickerVisible && <ChromePicker
      className="absolute bottom-10 right-2"
      color={color}
      onChange={onColorChange}
    />}
  </div>
}

export default Caption;
