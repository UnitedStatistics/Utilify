import { ApplyOptions } from "@sapphire/decorators";
import type { Args } from "@sapphire/framework";
import { Command } from "@sapphire/framework";
import { ApplicationCommandOptionType, EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import { PunishmentType, colors } from "../consts";
import { db } from "../lib/db";
import { getGuildId } from "../lib/utils/getGuildId";
import { reply } from "../lib/utils/reply";

@ApplyOptions<Command.Options>({
  description: "Warn a user.",
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
            name: "user",
            description: "The user to warn.",
            type: ApplicationCommandOptionType.User,
            required: true
          },
          {
            name: "reason",
            description: "Why you want to warn this user.",
            type: ApplicationCommandOptionType.String,
            required: false
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
    const user =
			interactionOrMessage instanceof Message ? await args!.pick("user").catch(() => null) : interactionOrMessage.options.getUser("user");

    const moderator = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

    if (!user)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("You need to specify a member.").setColor(colors.danger)]
      });

    const reason =
			(interactionOrMessage instanceof Message
			  ? await args!.rest("string").catch(() => null)
			  : interactionOrMessage.options.getString("reason")) || "No reason specified.";

    await db.user.upsert({
      where: {
        id: user.id
      },
      create: {
        id: user.id
      },
      update: {}
    });

    await db.punishment.create({
      data: {
        reason,
        type: PunishmentType.Warn,
        userId: user.id,
        moderatorId: moderator.id
      }
    });

    return reply(interactionOrMessage, {
      embeds: [new EmbedBuilder().setDescription(`**${user.tag}** has been warned.`).setColor(colors.success)]
    });
  }
}
