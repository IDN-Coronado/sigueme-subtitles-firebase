import {
  Calendar, Search, Plus, Radio, MoreVertical, Settings2,
  Pencil, Trash2, ChevronLeft, Play, Pause, Square, Repeat,
  ChevronsLeft, ChevronsRight, ChevronRight, Music, Film,
  BookOpen, Monitor, GripVertical, ALargeSmall, Captions,
  AlignLeft, AlignCenter, AlignRight, Sun, Moon,
} from "lucide-react";

export function IconCalendar({ color = "currentColor", size = 18 }) {
  return <Calendar size={size} color={color} />;
}
export function IconSearch({ color = "#6b7280", size = 18 }) {
  return <Search size={size} color={color} />;
}
export function IconPlus({ color = "currentColor", size = 18 }) {
  return <Plus size={size} color={color} />;
}
export function IconBroadcast({ color = "currentColor", size = 18 }) {
  return <Radio size={size} color={color} />;
}
export function IconDots({ color = "#6b7280", size = 16 }) {
  return <MoreVertical size={size} color={color} />;
}
export function IconGear({ color = "currentColor", size = 16 }) {
  return <Settings2 size={size} color={color} />;
}
export function IconEdit({ color = "#c6c6cd", size = 16 }) {
  return <Pencil size={size} color={color} />;
}
export function IconTrash({ color = "#c6c6cd", size = 16 }) {
  return <Trash2 size={size} color={color} />;
}
export function IconChevron({ collapsed, color = "#c6c6cd" }) {
  return (
    <ChevronLeft
      size={16}
      color={color}
      className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
    />
  );
}
export function IconPlay({ color = "currentColor", size = 16 }) {
  return <Play size={size} color={color} fill={color} />;
}
export function IconPause({ color = "currentColor", size = 16 }) {
  return <Pause size={size} color={color} fill={color} />;
}
export function IconStop({ color = "currentColor", size = 16 }) {
  return <Square size={size} color={color} fill={color} />;
}
export function IconLoop({ color = "currentColor", size = 16 }) {
  return <Repeat size={size} color={color} />;
}
export function IconSlideFirst({ color = "currentColor", size = 16 }) {
  return <ChevronsLeft size={size} color={color} />;
}
export function IconSlidePrev({ color = "currentColor", size = 16 }) {
  return <ChevronLeft size={size} color={color} />;
}
export function IconSlideNext({ color = "currentColor", size = 16 }) {
  return <ChevronRight size={size} color={color} />;
}
export function IconSlideLast({ color = "currentColor", size = 16 }) {
  return <ChevronsRight size={size} color={color} />;
}
export function IconSong({ color = "currentColor", size = 16 }) {
  return <Music size={size} color={color} />;
}
export function IconMedia({ color = "currentColor", size = 16 }) {
  return <Film size={size} color={color} />;
}
export function IconBible({ color = "currentColor", size = 16 }) {
  return <BookOpen size={size} color={color} />;
}
export function IconTheme({ color = "currentColor", size = 16 }) {
  return <Monitor size={size} color={color} />;
}
export function IconGrip({ color = "currentColor", size = 16 }) {
  return <GripVertical size={size} color={color} />;
}
export function IconTextDecrease({ color = "currentColor", size = 16 }) {
  return <ALargeSmall size={size} color={color} />;
}
export function IconTextIncrease({ color = "currentColor", size = 16 }) {
  return <ALargeSmall size={size} color={color} className="scale-x-[-1]" />;
}
export function IconCc({ color = "currentColor", size = 16 }) {
  return <Captions size={size} color={color} />;
}
export function IconAlignLeft({ color = "currentColor", size = 16 }) {
  return <AlignLeft size={size} color={color} />;
}
export function IconAlignCenter({ color = "currentColor", size = 16 }) {
  return <AlignCenter size={size} color={color} />;
}
export function IconAlignRight({ color = "currentColor", size = 16 }) {
  return <AlignRight size={size} color={color} />;
}
export function IconSun({ color = "currentColor", size = 16 }) {
  return <Sun size={size} color={color} />;
}
export function IconMoon({ color = "currentColor", size = 16 }) {
  return <Moon size={size} color={color} />;
}
