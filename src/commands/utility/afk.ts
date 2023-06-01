import { ApplyOptions } from "@sapphire/decorators";
import type { Args } from "@sapphire/framework";
import { Command } from "@sapphire/framework";
import type { User } from "discord.js";
import { ApplicationCommandOptionType, EmbedBuilder, Message } from "discord.js";
import { colors } from "../../consts";
import { db } from "../../lib/db";
import { getGuildId } from "../../lib/utils/getGuildId";
import { reply } from "../../lib/utils/reply";

@ApplyOptions<Command.Options>({
  description: "Set or clear your AFK status."
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
            name: "set",
            description: "Set your AFK status.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "reason",
                description: "Why you're going AFK.",
                type: ApplicationCommandOptionType.String,
                required: false
              }
            ]
          },
          {
            name: "clear",
            description: "Clear your AFK status.",
            type: ApplicationCommandOptionType.Subcommand
          }
        ]
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
    const user = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

    const subcommandOrReason =
			interactionOrMessage instanceof Message ? await args!.pick("string").catch(() => null) : interactionOrMessage.options.getSubcommand();

    await db.user.upsert({
      where: {
        id: user.id
      },
      create: {
        id: user.id
      },
      update: {}
    });

    if (interactionOrMessage instanceof Message && (!subcommandOrReason || !["set", "clear"].includes(subcommandOrReason))) {
      if (
        (await db.afk.count({
          where: {
            userId: user.id
          }
        })) >= 1
      )
        return this.clearAfkStatus(interactionOrMessage, user);

      const reason = subcommandOrReason && [subcommandOrReason, await args!.rest("string").catch(() => null)].filter(Boolean).join(" ");

      return this.setAfkStatus(interactionOrMessage, user, reason);
    }

    switch (subcommandOrReason) {
    case "set": {
      const reason =
					interactionOrMessage instanceof Message
					  ? await args!.rest("string").catch(() => null)
					  : interactionOrMessage.options.getString("reason");

      return this.setAfkStatus(interactionOrMessage, user, reason);
    }
    case "clear": {
      return this.clearAfkStatus(interactionOrMessage, user);
    }
    }

    return;
  }

  private async setAfkStatus(interactionOrMessage: Message | Command.ChatInputCommandInteraction, user: User, reason?: string | null) {
    await db.afk.create({
      data: {
        userId: user.id,
        reason: reason || "No reason specified."
      }
    });

    const member = interactionOrMessage.guild!.members.cache.get(user.id);
    if (member && member.manageable) member.setNickname(`[AFK] ${member.displayName}`);

    return reply(interactionOrMessage, {
      embeds: [new EmbedBuilder().setDescription("Your AFK status has been set.").setColor(colors.success)],
      ephemeral: true
    });
  }

  private async clearAfkStatus(interactionOrMessage: Message | Command.ChatInputCommandInteraction, user: User) {
    await db.afk.delete({
      where: {
        userId: user.id
      }
    });

    const member = interactionOrMessage.guild!.members.cache.get(user.id);
    console.log(member);
    if (member && member.manageable) member.setNickname(member.displayName.replace(/\[AFK\] /g, ""));

    return reply(interactionOrMessage, {
      embeds: [new EmbedBuilder().setDescription("Your AFK status has been cleared.").setColor(colors.success)],
      ephemeral: true
    });
  }
}
