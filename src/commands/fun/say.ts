import { ApplyOptions } from "@sapphire/decorators";
import type { Args } from "@sapphire/framework";
import { Command } from "@sapphire/framework";
import { ApplicationCommandOptionType, EmbedBuilder, Message } from "discord.js";
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

    if (interactionOrMessage instanceof Message && interactionOrMessage.reference)
      (await interactionOrMessage.fetchReference()).reply({
        content,
        allowedMentions: {
          parse: [],
          users: [],
          roles: []
        }
      });
    else
			interactionOrMessage.channel!.send({
			  content,
			  allowedMentions: {
			    parse: [],
			    users: [],
			    roles: []
			  }
			});

    if (interactionOrMessage instanceof Message) return;
    else
      interactionOrMessage.reply({
        embeds: [new EmbedBuilder().setDescription("Message successfully sent!").setColor(colors.success)],
        ephemeral: true
      });
  }
}
