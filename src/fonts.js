/**
 * The interface's mono face, applied as an inline style because Tailwind's
 * config carries no font-family tokens.
 *
 * Import this rather than re-declaring the object: it was copied into
 * fifteen files, and two components drifted to a bare "monospace" and so
 * rendered in the system mono instead. See DESIGN.md.
 */
export const MONO = { fontFamily: "JetBrains Mono, monospace" };
