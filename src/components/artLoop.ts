/** Loop lengths of the animated art (sign-up, tutorial, camps (AnimatedArt.tsx); pure, so tests can check it. */
export const ART_SECONDS = { welcome: 4, goals: 3, plan: 4, consent: 4, find: 4, technique: 4, smokefree: 5, focus: 6, alcoholfree: 4 } as const;
export type AnimatedArtName = keyof typeof ART_SECONDS;
export const ANIMATED_ART_NAMES = Object.keys(ART_SECONDS) as AnimatedArtName[];
/** The loop's phase (0–1) for a name at a time in ms; each picture is drawn from this, so loops are seamless. */
export const artPhase = (name: AnimatedArtName, ms: number) => (ms / 1000 / ART_SECONDS[name]) % 1;
