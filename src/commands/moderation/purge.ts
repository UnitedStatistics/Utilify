import { ApplyOptions } from "@sapphire/decorators";
import type { Args } from "@sapphire/framework";
import { Command } from "@sapphire/framework";
import type { Channel, TextBasedChannel } from "discord.js";
import { ApplicationCommandOptionType, ChannelType, EmbedBuilder, Message } from "discord.js";
import ms from "ms";
import { colors } from "../../consts";
import { getGuildId } from "../../lib/utils/getGuildId";
import { reply } from "../../lib/utils/reply";

@ApplyOptions<Command.Options>({
  description: "Deletes a specific amount of messages from a channel.",
  requiredUserPermissions: ["ManageMessages"]
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
            name: "amount",
            description: "The amount of messages to delete.",
            type: ApplicationCommandOptionType.Number,
            maxValue: 100,
            required: true
          },
          {
            name: "channel",
            description: "The channel to delete the messages from.",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [
              ChannelType.AnnouncementThread,
              ChannelType.GuildAnnouncement,
              ChannelType.GuildCategory,
              ChannelType.GuildStageVoice,
              ChannelType.GuildText,
              ChannelType.GuildText,
              ChannelType.GuildVoice,
              ChannelType.PrivateThread,
              ChannelType.PublicThread
            ],
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
    return this.respond(message, args);
  }

  // Chat Input (slash) command
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    return this.respond(interaction);
  }

  private async respond(interactionOrMessage: Message | Command.ChatInputCommandInteraction, args?: Args) {
    const amount =
			interactionOrMessage instanceof Message
			  ? await args!.pick("integer").catch(() => null)
			  : interactionOrMessage.options.getNumber("amount", true);

    if (!amount)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("You must specify the amount of messages to purge.").setColor(colors.danger)]
      });

    if (amount > 100)
      return reply(interactionOrMessage, {
        embeds: [new EmbedBuilder().setDescription("You can only delete up to 100 messages.").setColor(colors.danger)]
      });

    const channel =
			(interactionOrMessage instanceof Message
			  ? await args!.pick("guildChannel").catch(() => null)
			  : (interactionOrMessage.options.getChannel("channel") as Channel)) || (interactionOrMessage.channel as TextBasedChannel);

    if (!channel.isTextBased() || channel.isDMBased())
      return reply(interactionOrMessage, {
        embeds: [
          new EmbedBuilder()
            .setDescription("You must specify a text-based channel. (ex. text channels, announcement channels, etc.)")
            .setColor(colors.danger)
        ]
      });

    const messages = await channel.messages.fetch({
      limit: amount + 1
    });

    const filtered = messages.filter((msg) => Date.now() - msg.createdTimestamp < ms("14 days") && !msg.pinned);

    if (interactionOrMessage instanceof Message && channel.id === interactionOrMessage.channel!.id) interactionOrMessage.delete();

    await channel.bulkDelete(filtered);

    return reply(interactionOrMessage, {
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `Deleted ${amount} message${amount === 1 ? "" : "s"}${
              channel.id !== interactionOrMessage.channel!.id ? ` from <#${channel.id}>` : ""
            }.`
          )
          .setColor(colors.success)
      ]
    });
  }
}
