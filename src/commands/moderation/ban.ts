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
  description: "Ban a user.",
  requiredUserPermissions: ["BanMembers"]
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
            description: "The user to ban.",
            type: ApplicationCommandOptionType.User,
            required: true
          },
          {
            name: "reason",
            description: "Why you want to ban this user.",
            type: ApplicationCommandOptionType.String,
            required: false
          }
        ],
        defaultMemberPermissions: [PermissionFlagsBits.BanMembers]
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

    console.log(
			(interactionOrMessage.member as GuildMember)!.roles.cache
			  .filter((role) => !okayRoles.includes(role.id))
			  .sort((a, z) => z.position - a.position)
			  .first()?.name
    );

    if (
      (member.roles.cache
        .filter((role) => !okayRoles.includes(role.id))
        .sort((a, z) => z.position - a.position)
        .first()?.position || 0) >=
			((interactionOrMessage.member as GuildMember)!.roles.cache
			  .filter((role) => !okayRoles.includes(role.id))
			  .sort((a, z) => z.position - a.position)
			  .first()?.position || 0)
    )
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("You can't ban a member that has a higher/equal role to you.").setColor(colors.danger)]
      });

    if (!member.bannable)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("I can't ban that member.").setColor(colors.danger)]
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
                `You've been banned from **${interactionOrMessage.guild!.name}**.`,
                `**Moderator**: ${moderator.tag}`,
                `**Reason**: ${reason}`
              ].join("\n")
            )
            .setColor(colors.danger)
        ]
      })
      .catch(() => this.container.client.logger.warn(`Couldn't DM ${member.user.tag}.`));

    member.ban({ reason });

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
        type: PunishmentType.Ban,
        userId: member.id,
        moderatorId: moderator.id
      }
    });

    return reply(interactionOrMessage, {
      embeds: [new EmbedBuilder().setDescription(`**${member.user.tag}** has been banned.`).setColor(colors.success)]
    });
  }
}
