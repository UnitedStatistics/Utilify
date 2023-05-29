import { ApplyOptions } from "@sapphire/decorators";
import type { Args } from "@sapphire/framework";
import { Command } from "@sapphire/framework";
import type { GuildMember } from "discord.js";
import { ApplicationCommandOptionType, EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import { colors, okayRoles } from "../consts";
import { getGuildId } from "../lib/utils/getGuildId";
import { reply } from "../lib/utils/reply";

@ApplyOptions<Command.Options>({
  description: "Manage a user's roles.",
  aliases: ["role"],
  requiredUserPermissions: ["ManageRoles"]
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
            name: "add",
            description: "Add a role to a user.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "role",
                description: "The role to add.",
                type: ApplicationCommandOptionType.Role,
                required: true
              },
              {
                name: "user",
                description: "The user to add the role to.",
                type: ApplicationCommandOptionType.User,
                required: false
              }
            ]
          },
          {
            name: "remove",
            description: "Remove a role to a user.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "role",
                description: "The role to remove.",
                type: ApplicationCommandOptionType.Role,
                required: true
              },
              {
                name: "user",
                description: "The user to remove the role from.",
                type: ApplicationCommandOptionType.User,
                required: false
              }
            ]
          }
        ],
        defaultMemberPermissions: [PermissionFlagsBits.ManageRoles]
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
    const subcommand = (
			interactionOrMessage instanceof Message ? await args!.pick("string").catch(() => null) : interactionOrMessage.options.getSubcommand()
		) as "add" | "remove" | null;

    if (!subcommand || !["add", "remove"].includes(subcommand))
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("You must specify the subcommand as either `add` or `remove`.").setColor(colors.danger)]
      });

    const role =
			interactionOrMessage instanceof Message
			  ? await args!.pick("role").catch(() => undefined)
			  : interactionOrMessage.guild!.roles.cache.get(interactionOrMessage.options.getRole("role")!.id);

    if (!role)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription(`You must specify the role to ${subcommand}.`).setColor(colors.danger)]
      });

    if (role.position >= (await interactionOrMessage.guild!.members.fetchMe())!.roles.highest.position)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription(`I don't have permission to ${subcommand} that role.`).setColor(colors.danger)]
      });

    const member =
			(interactionOrMessage instanceof Message
			  ? await args!.pick("member").catch(() => null)
			  : (interactionOrMessage.options.getMember("user") as GuildMember | null)) || (interactionOrMessage.member as GuildMember);

    if (
      member.id !== (interactionOrMessage.member as GuildMember).id &&
			member.roles.cache
			  .filter((role) => okayRoles.includes(role.id))
			  .sort((a, z) => z.position - a.position)
			  .first()!.position >=
				(interactionOrMessage.member as GuildMember).roles.cache
				  .filter((role) => okayRoles.includes(role.id))
				  .sort((a, z) => z.position - a.position)
				  .first()!.position
    )
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("That user has roles that are higher/equal to yours.")]
      });

    if (subcommand === "add" && member.roles.cache.has(role.id))
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("That user already has that role.").setColor(colors.danger)]
      });
    else if (subcommand === "remove" && !member.roles.cache.has(role.id))
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("That user doesn't has that role.").setColor(colors.danger)]
      });

    member.roles[subcommand](role);

    return reply(interactionOrMessage, {
      embeds: [
        new EmbedBuilder()
          .setDescription(`${subcommand === "add" ? `Added **${role.name}** to` : `Removed **${role.name}** from`} **${member.user.tag}**.`)
          .setColor(colors.success)
      ]
    });
  }
}
