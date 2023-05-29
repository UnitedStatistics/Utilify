import { ApplyOptions } from "@sapphire/decorators";
import type { GuildBasedChannelTypes } from "@sapphire/discord.js-utilities";
import type { Args } from "@sapphire/framework";
import { Command } from "@sapphire/framework";
import { ApplicationCommandOptionType, ChannelType, EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import ms from "ms";
import { colors } from "../consts";
import { getGuildId } from "../lib/utils/getGuildId";
import { reply } from "../lib/utils/reply";

@ApplyOptions<Command.Options>({
  description: "Update the slowmode in a channel.",
  aliases: ["sm"],
  requiredUserPermissions: ["ManageChannels"]
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
            name: "time",
            description: "The amount of slowmode.",
            type: ApplicationCommandOptionType.User,
            required: true
          },
          {
            name: "channel",
            description: "The channel to set the slowmode of.",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [
              ChannelType.GuildAnnouncement,
              ChannelType.PublicThread,
              ChannelType.PrivateThread,
              ChannelType.AnnouncementThread,
              ChannelType.GuildText,
              ChannelType.GuildForum,
              ChannelType.GuildVoice
            ],
            required: false
          }
        ],
        defaultMemberPermissions: [PermissionFlagsBits.ManageChannels]
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
    const time =
			interactionOrMessage instanceof Message ? await args!.pick("string").catch(() => null) : interactionOrMessage.options.getString("length");

    if (!time)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("You must specify how much the slowmode should be.").setColor(colors.danger)]
      });

    if (ms(time) > ms("6h"))
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("Slwomode must be below 6 hours.").setColor(colors.danger)]
      });

    const channel = ((interactionOrMessage instanceof Message
      ? await args!.pick("guildChannel").catch(() => null)
      : interactionOrMessage.options.getChannel("channel")) || interactionOrMessage.channel!) as GuildBasedChannelTypes;
    if (!channel.isTextBased())
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("Channel must be a text channel.").setColor(colors.danger)]
      });

    channel.setRateLimitPerUser(ms(time) / 1000);

    return reply(interactionOrMessage, {
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `Slowmode${channel.id !== interactionOrMessage.channel!.id ? ` in ${channel}` : ""} was ${
              ms(time) === 0 ? "**disabled**" : `set to **${ms(ms(time), { long: true })}**`
            }.`
          )
          .setColor(colors.success)
      ]
    });
  }
}
