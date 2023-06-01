import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { EmbedBuilder, type Message } from "discord.js";
import { colors } from "../../consts";
import { getGuildId } from "../../lib/utils/getGuildId";
import { reply } from "../../lib/utils/reply";

@ApplyOptions<Command.Options>({
  description: "View the amount of members in this server.",
  aliases: ["membercount"]
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
    await interactionOrMessage.guild!.members.fetch();

    const members = interactionOrMessage.guild!.memberCount;
    const users = interactionOrMessage.guild!.members.cache.filter((member) => !member.user.bot).size;
    const bots = interactionOrMessage.guild!.members.cache.filter((member) => member.user.bot).size;

    return reply(interactionOrMessage, {
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: interactionOrMessage.guild!.name,
            iconURL: interactionOrMessage.guild!.iconURL() ?? undefined
          })
          .setDescription(
            [
              `**Members**: ${members}`,
              `**Users**: ${users}`,
              `**Bots**: ${bots}`,
              `**User/Bot ratio**: ${((users / members) * 100).toFixed(2)}%`
            ].join("\n")
          )
          .setColor(colors.primary)
      ]
    });
  }
}
