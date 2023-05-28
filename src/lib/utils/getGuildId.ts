import { env } from "../env";

export function getGuildId() {
  return env.GUILD_ID ? [env.GUILD_ID] : [];
}