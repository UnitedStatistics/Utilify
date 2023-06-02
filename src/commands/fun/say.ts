import { ApplyOptions } from "@sapphire/decorators";
import type { Args } from "@sapphire/framework";
import { Command } from "@sapphire/framework";
import type { GuildMember } from "discord.js";
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, Message } from "discord.js";
import { colors } from "../../consts";
import { getGuildId } from "../../lib/utils/getGuildId";

@ApplyOptions<Command.Options>({
  description: "Make me say something."
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
            name: "message",
            description: "The message you want me to say",
            type: ApplicationCommandOptionType.String,
            required: true
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
    if (interactionOrMessage instanceof Message) interactionOrMessage.delete().catch(() => null);

    const content =
			interactionOrMessage instanceof Message
			  ? await args!.rest("string").catch(() => null)
			  : interactionOrMessage.options.getString("message");

    if (!content) return;

    let message: Message;

    if (interactionOrMessage instanceof Message && interactionOrMessage.reference)
      message = await (
        await interactionOrMessage.fetchReference()
      ).reply({
        content,
        allowedMentions: {
          parse: [],
          users: [],
          roles: []
        }
      });
    else
      message = await interactionOrMessage.channel!.send({
        content,
        allowedMentions: {
          parse: [],
          users: [],
          roles: []
        }
      });

    const logsChannel = await this.container.client.channels.fetch("1028926450377699349");
    if (logsChannel && !logsChannel.isDMBased() && logsChannel.isTextBased())
      logsChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Sent message through me")
            .setDescription([`**Message**: ${content}`, `**Channel**: ${message.channel}`].join("\n"))
            .setFooter({
              text: (interactionOrMessage.member as GuildMember).displayName,
              iconURL: (interactionOrMessage.member as GuildMember).displayAvatarURL()
            })
            .setTimestamp()
            .setColor(colors.primary)
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setLabel("View message").setStyle(ButtonStyle.Link).setURL(message.url)
          )
        ]
      });

    if (interactionOrMessage instanceof Message) return;
    else
      interactionOrMessage.reply({
        embeds: [new EmbedBuilder().setDescription("Message successfully sent!").setColor(colors.success)],
        ephemeral: true
      });
  }
}
