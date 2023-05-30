import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import type { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { colors } from "../../consts";
import { getGuildId } from "../../lib/utils/getGuildId";
import { reply } from "../../lib/utils/reply";

function capitalize(str: string) {
  return str[0].toUpperCase() + str.toLowerCase().slice(1).replace(/_/gi, " ");
}

@ApplyOptions<Command.Options>({
  description: "View all of the commands this bot has."
})
export class UserCommand extends Command {
  // Register Chat Input and Context Menu command
  public override registerApplicationCommands(registry: Command.Registry) {
    // Register Chat Input command
    registry.registerChatInputCommand(
      {
        name: this.name,
        description: this.description
      },
      {
        guildIds: getGuildId()
      }
    );
  }

  // Message command
  public async messageRun(message: Message) {
    return this.respond(message);
  }

  // Chat Input (slash) command
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    return this.respond(interaction);
  }

  private async respond(interactionOrMessage: Message | Command.ChatInputCommandInteraction) {
    const categories: { name: string; commands: string[] }[] = [];

    this.container.stores.get("commands").forEach((command) => {
      if (categories.find((category) => category.name === command.category!)) {
        const category = categories.findIndex((category) => category.name === command.category!);

        categories[category].commands.push(command.name);
      } else
        categories.push({
          name: command.category!,
          commands: [command.name]
        });
    });

    return reply(interactionOrMessage, {
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: this.container.client.user!.username,
            iconURL: this.container.client.user!.displayAvatarURL()
          })
          .setFields(
            categories.map((category) => ({
              name: capitalize(category.name),
              value: "`" + category.commands.sort((a, z) => a.localeCompare(z)).join("`, `") + "`"
            }))
          )
          .setColor(colors.primary)
      ]
    });
  }
}
