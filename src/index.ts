import "./lib/setup";

import { LogLevel, SapphireClient } from "@sapphire/framework";
import { ActivityType, GatewayIntentBits } from "discord.js";

const client = new SapphireClient({
  defaultPrefix: ">",
  caseInsensitiveCommands: true,
  logger: {
    level: LogLevel.Debug
  },
  intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
  loadMessageCommandListeners: true,
  presence: {
    activities: [
      {
        name: "for bad actors",
        type: ActivityType.Watching
      }
    ]
  }
});

const main = async () => {
  try {
    client.logger.info("Logging in...");
    await client.login();
    client.logger.info(`Logged in as ${client.user!.tag}.`);
  } catch (error) {
    client.logger.fatal(error);
    client.destroy();
    process.exit(1);
  }
};

main();
