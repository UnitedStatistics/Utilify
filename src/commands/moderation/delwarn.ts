import { ApplyOptions } from "@sapphire/decorators";
import type { Args } from "@sapphire/framework";
import { Command } from "@sapphire/framework";
import { ApplicationCommandOptionType, EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import { PunishmentType, colors } from "../../consts";
import { db } from "../../lib/db";
import { getGuildId } from "../../lib/utils/getGuildId";
import { reply } from "../../lib/utils/reply";

@ApplyOptions<Command.Options>({
  description: "Remove a warn from someone.",
  aliases: ["deletewarn", "removewarn", "remwarn", "rmwarn"],
  requiredUserPermissions: ["KickMembers"]
})
export class UserCommand extends Command {
  // Register Chat Input and Context Menu command
  public override registerApplicationCommands(registry: Command.Registry) {
    // Register Chat Input command
    registry.registerChatInputCommand(
      {
        name: this.name,
        description: this.description,
        options: [
          {
            name: "id",
            description: "The ID of the warn to remove.",
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ],
        defaultMemberPermissions: [PermissionFlagsBits.KickMembers]
      },
      {
        guildIds: getGuildId()
      }
    );
  }

  // Message command
  public async messageRun(message: Message, args: Args) {
    return this.respond(message, args);
  }

  // Chat Input (slash) command
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    return this.respond(interaction);
  }

  private async respond(interactionOrMessage: Message | Command.ChatInputCommandInteraction, args?: Args) {
    const id =
			interactionOrMessage instanceof Message ? await args!.pick("string").catch(() => null) : interactionOrMessage.options.getString("id");

    if (!id)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("You must specify the warn ID.").setColor(colors.danger)]
      });

    if (
      (await db.punishment.count({
        where: { id, type: PunishmentType.Warn }
      })) < 1
    )
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("A warn with that ID doesn't exist.").setColor(colors.danger)]
      });

    await db.punishment.delete({
      where: { id }
    });

    return reply(interactionOrMessage, {
      embeds: [new EmbedBuilder().setDescription(`Warn ID **${id}** has been deleted.`).setColor(colors.success)]
    });
  }
}
