import { ApplyOptions } from "@sapphire/decorators";
import type { Args } from "@sapphire/framework";
import { Command } from "@sapphire/framework";
import type { GuildMember } from "discord.js";
import { ApplicationCommandOptionType, EmbedBuilder, Message } from "discord.js";
import { PunishmentType, colors } from "../consts";
import { db } from "../lib/db";
import { getGuildId } from "../lib/utils/getGuildId";
import { reply } from "../lib/utils/reply";

@ApplyOptions<Command.Options>({
  description: "Check the warnings you've recieved."
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
            description: "The user you want to check the warnings of.",
            type: ApplicationCommandOptionType.User,
            required: false
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
    return this.respond(message as Message & { member: GuildMember }, args);
  }

  // Chat Input (slash) command
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    return this.respond(interaction as Command.ChatInputCommandInteraction & { member: GuildMember });
  }

  private async respond(interactionOrMessage: (Message | Command.ChatInputCommandInteraction) & { member: GuildMember }, args?: Args) {
    const currentUser = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

    const user =
			interactionOrMessage instanceof Message ? await args!.pick("user").catch(() => null) : interactionOrMessage.options.getUser("user");

    if (user && !interactionOrMessage.member!.permissions.has("KickMembers"))
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("You don't have permission to check other user's warnings.").setColor(colors.danger)]
      });

    const punishments = await db.punishment.findMany({
      where: {
        userId: (user || currentUser).id,
        type: PunishmentType.Warn
      },
      orderBy: {
        punishedAt: "desc"
      }
    });

    if (!punishments.length)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription(`${user ? "That user doesn't" : "You don't"} have any warnings.`).setColor(colors.danger)]
      });

    return reply(interactionOrMessage, {
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: (user || currentUser).tag,
            iconURL: (user || currentUser).displayAvatarURL()
          })
          .setFields(
            punishments.map((punishment) => ({
              name: punishment.id,
              value: [`**Warned on**: <t:${Math.round(punishment.punishedAt.getTime() / 1000)}:f>`, `**Reason**: ${punishment.reason}`]
                .filter(Boolean)
                .join("\n")
            }))
          )
          .setColor(colors.primary)
      ]
    });
  }
}
