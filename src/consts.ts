import type { ColorResolvable } from "discord.js";
import { join } from "path";

export const rootDir = join(__dirname, "..");
export const srcDir = join(rootDir, "src");

export const colors: Record<"primary" | "success" | "danger", ColorResolvable> = {
  primary: "#3B5163",
  success: "#00ff00",
  danger: "#ff0000"
};

export enum PunishmentType {
  Warn,
  Mute,
  Kick,
  Ban
}

export const punishmentTypes: { [key: number]: string } = {
  [PunishmentType.Warn]: "Warn",
  [PunishmentType.Mute]: "Mute",
  [PunishmentType.Kick]: "Kick",
  [PunishmentType.Ban]: "Ban"
};