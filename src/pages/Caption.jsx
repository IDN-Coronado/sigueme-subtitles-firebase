import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { ChromePicker } from 'react-color';
import tinycolor from "tinycolor2";

import db from "../firebase/firebase";

const CAPTION = 'caption';
const LOCAL_STORAGE_COLOR = 'sigueme:color';
const LOCAL_STORAGE_CC = 'sigueme:cc';
const LOCAL_STORAGE_SIZE = 'sigueme:size';
const DEFAULT_BG = '#a3e635';
const textSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl', 'text-9xl', 'text-10xl'];

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
  const [ textSize, setTextSize ] = useState(9);
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
    localStorage.removeItem(LOCAL_STORAGE_CC);
    localStorage.removeItem(LOCAL_STORAGE_SIZE);
    setColor({ hex: DEFAULT_BG });
    setIsCC(true);
    setTextSize(9);
  };

  const onCCStyle = () => {
    const newCCState = !isCC;
    localStorage.setItem(LOCAL_STORAGE_CC, JSON.stringify(newCCState));
    setIsCC(newCCState);
  }

  const onIncrease = () => {
    const newSize = textSize + 1;
    setTextSize(newSize);
    localStorage.setItem(LOCAL_STORAGE_SIZE, newSize);
  }

  const onDecrease = () => {
    const newSize = textSize - 1;
    setTextSize(newSize);
    localStorage.setItem(LOCAL_STORAGE_SIZE, newSize);
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
    {caption && <h1 className={`${textSizes[textSize]} p-2 text-center text-${textColor} ${isCC ? 'bg-zinc-900' : ''}`}>
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
        className="text-xs text-zinc-900 mr-4 -rotate-90"
        onClick={onIncrease}
      >&#10140;</button>
      <button
        type="button"
        className="text-xs text-zinc-900 mr-4 rotate-90"
        onClick={onDecrease}
      >&#10140;</button>
      <button
        type="button"
        className="text-lg border-4 border-zinc-900 text-zinc-900 rounded-md p-0"
        onClick={onButtonClick}
      >
        <div className="border-2 border-gray-300 px-4 py-2 rounded-sm" style={{ backgroundColor: color.hex }} />
      </button>
      <button
        type="button"
        className="text-xs ml-2 text-zinc-900"
        onClick={onCCStyle}
      >CC Style</button>
      <button
        type="button"
        className="text-[8px] ml-6 text-zinc-900"
        onClick={onReset}
      >RESET</button>
    </div>
    {isPickerVisible && <ChromePicker
      className="absolute bottom-10 right-2"
      color={color}
      onChange={onColorChange}
    />}
  </div>
}

export default Caption;
