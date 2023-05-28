import { ApplyOptions } from "@sapphire/decorators";
import type { Args } from "@sapphire/framework";
import { Command } from "@sapphire/framework";
import { ApplicationCommandOptionType, EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import { colors } from "../consts";
import { getGuildId } from "../lib/utils/getGuildId";
import { reply } from "../lib/utils/reply";

@ApplyOptions<Command.Options>({
  description: "Unban a user.",
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
            description: "The user to unban.",
            type: ApplicationCommandOptionType.User,
            required: true
          },
          {
            name: "reason",
            description: "Why you want to unban this user.",
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
    const user =
			interactionOrMessage instanceof Message ? await args!.pick("user").catch(() => null) : interactionOrMessage.options.getUser("user");

    const moderator = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

    if (!user)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("You need to specify a user.").setColor(colors.danger)]
      });

    const reason =
			(interactionOrMessage instanceof Message
			  ? await args!.rest("string").catch(() => null)
			  : interactionOrMessage.options.getString("reason")) || "No reason specified.";

    const bans = await interactionOrMessage.guild!.bans.fetch();
    if (!bans.has(user.id))
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("That user is not banned.")]
      });

    await interactionOrMessage.guild!.members.unban(user.id);

    try {
      user.send({
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
      });
    } catch {
      this.container.client.logger.warn(`Couldn't DM ${user.tag}.`);
    }

    return reply(interactionOrMessage, {
      embeds: [new EmbedBuilder().setDescription(`**${user.tag}** has been unbanned.`).setColor(colors.success)]
    });
  }
}
