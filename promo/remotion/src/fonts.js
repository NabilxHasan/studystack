import { loadFont as loadOrbitron } from "@remotion/google-fonts/Orbitron";
import { loadFont as loadRajdhani } from "@remotion/google-fonts/Rajdhani";
import { loadFont as loadShareTech } from "@remotion/google-fonts/ShareTechMono";

const orbitron = loadOrbitron();
const rajdhani = loadRajdhani();
const shareTech = loadShareTech();

export const FONT = {
  orbitron: orbitron.fontFamily,
  rajdhani: rajdhani.fontFamily,
  mono: shareTech.fontFamily,
};

export const waitForFonts = () =>
  Promise.all([orbitron.waitUntilDone(), rajdhani.waitUntilDone(), shareTech.waitUntilDone()]);
