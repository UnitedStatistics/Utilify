import { ApplyOptions } from "@sapphire/decorators";
import type { Args } from "@sapphire/framework";
import { Command } from "@sapphire/framework";
import type { GuildMember } from "discord.js";
import { ApplicationCommandOptionType, EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import ms from "ms";
import { PunishmentType, colors, okayRoles } from "../../consts";
import { db } from "../../lib/db";
import { getGuildId } from "../../lib/utils/getGuildId";
import { reply } from "../../lib/utils/reply";

@ApplyOptions<Command.Options>({
  description: "Mute a user.",
  requiredUserPermissions: ["MuteMembers"]
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
            description: "The user to mute.",
            type: ApplicationCommandOptionType.User,
            required: true
          },
          {
            name: "length",
            description: "How long this user should be muted.",
            type: ApplicationCommandOptionType.String,
            required: true
          },
          {
            name: "reason",
            description: "Why you want to mute this user.",
            type: ApplicationCommandOptionType.String,
            required: false
          }
        ],
        defaultMemberPermissions: [PermissionFlagsBits.MuteMembers]
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
        embeds: [new EmbedBuilder().setDescription("You need to specify a user.").setColor(colors.danger)]
      });

    if (
			member.roles.cache
			  .filter((role) => !okayRoles.includes(role.id))
			  .sort((a, z) => z.position - a.position)
			  .first()!.position >=
			(interactionOrMessage.member as GuildMember)!.roles.cache
			  .filter((role) => !okayRoles.includes(role.id))
			  .sort((a, z) => z.position - a.position)
			  .first()!.position
    )
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("You can't mute a user that has a higher/equal role to you.").setColor(colors.danger)]
      });

    if (!member.moderatable)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("I can't mute that user.").setColor(colors.danger)]
      });

    const length =
			interactionOrMessage instanceof Message ? await args!.pick("string").catch(() => null) : interactionOrMessage.options.getString("length");

    if (!length)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("You have to specify a length.").setColor(colors.danger)]
      });

    const reason =
			(interactionOrMessage instanceof Message
			  ? await args!.rest("string").catch(() => null)
			  : interactionOrMessage.options.getString("reason")) || "No reason specified.";

    member.timeout(ms(length), reason);

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
        type: PunishmentType.Mute,
        length: ms(length),
        userId: member.id,
        moderatorId: moderator.id
      }
    });

    member
      .send({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              [
                `You've been muted in **${interactionOrMessage.guild!.name}**.`,
                `**Moderator**: ${moderator.tag}`,
                `**Length**: ${ms(ms(length), { long: true })}`,
                `**Reason**: ${reason}`
              ].join("\n")
            )
            .setColor(colors.danger)
        ]
      })
      .catch(() => this.container.client.logger.warn(`Couldn't DM ${member.user.tag}.`));

    return reply(interactionOrMessage, {
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `**${member.user.tag}** has been muted for **${ms(ms(length), {
              long: true
            })}**.`
          )
          .setColor(colors.success)
      ]
    });
  }
}
