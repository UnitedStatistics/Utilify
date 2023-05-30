import type { ColorResolvable } from "discord.js";
import { join } from "path";

export const rootDir = join(__dirname, "..");
export const srcDir = join(rootDir, "src");

export const colors: Record<"primary" | "success" | "danger", ColorResolvable> = {
  primary: "LightGrey",
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

export const okayRoles = [
  "1112295242964676608",
  "1064517980328824932",
  "1064518042169655326",
  "1064518152081379380",
  "1064518245840859207",
  "1064518340602777690"
];
