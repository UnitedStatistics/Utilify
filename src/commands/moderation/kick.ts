import { ApplyOptions } from "@sapphire/decorators";
import type { Args } from "@sapphire/framework";
import { Command } from "@sapphire/framework";
import type { GuildMember } from "discord.js";
import { ApplicationCommandOptionType, EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import { PunishmentType, colors, okayRoles } from "../../consts";
import { db } from "../../lib/db";
import { getGuildId } from "../../lib/utils/getGuildId";
import { reply } from "../../lib/utils/reply";

@ApplyOptions<Command.Options>({
  description: "Kick a user.",
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
            description: "The user to kick.",
            type: ApplicationCommandOptionType.User,
            required: true
          },
          {
            name: "reason",
            description: "Why you want to kick this user.",
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
    const member =
			interactionOrMessage instanceof Message
			  ? await args!.pick("member").catch(() => null)
			  : (interactionOrMessage.options.getMember("user") as GuildMember | null);

    const moderator = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

    if (!member)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("You need to specify a member.").setColor(colors.danger)]
      });

    if (
      (member.roles.cache
        .filter((role) => !!okayRoles.includes(role.id))
        .sort((a, z) => z.position - a.position)
        .first()?.position || 0) >=
			((interactionOrMessage.member as GuildMember)!.roles.cache
			  .filter((role) => !okayRoles.includes(role.id))
			  .sort((a, z) => z.position - a.position)
			  .first()?.position || 0)
    )
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("You can't kick a member that has a higher/equal role to you.").setColor(colors.danger)]
      });

    if (!member.kickable)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("I can't kick that member.").setColor(colors.danger)]
      });

    const reason =
			(interactionOrMessage instanceof Message
			  ? await args!.rest("string").catch(() => null)
			  : interactionOrMessage.options.getString("reason")) || "No reason specified.";

    member
      .send({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              [
                `You've been kicked from **${interactionOrMessage.guild!.name}**.`,
                `**Moderator**: ${moderator.tag}`,
                `**Reason**: ${reason}`
              ].join("\n")
            )
            .setColor(colors.danger)
        ]
      })
      .catch(() => this.container.client.logger.warn(`Couldn't DM ${member.user.tag}.`));

    member.kick(reason);

    await db.user.upsert({
      where: {
        id: member.user.id
      },
      create: {
        id: member.user.id
      },
      update: {}
    });

    await db.punishment.create({
      data: {
        reason,
        type: PunishmentType.Kick,
        userId: member.id,
        moderatorId: moderator.id
      }
    });

    return reply(interactionOrMessage, {
      embeds: [new EmbedBuilder().setDescription(`**${member.user.tag}** has been kicked.`).setColor(colors.success)]
    });
  }
}
