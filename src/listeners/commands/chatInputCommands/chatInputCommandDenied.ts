import type { ChatInputCommandDeniedPayload, Events, UserError } from "@sapphire/framework";
import { Listener } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { colors } from "../../../consts";

export class UserEvent extends Listener<typeof Events.ChatInputCommandDenied> {
  public async run({ context, message: content }: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    // `context: { silent: true }` should make UserError silent:
    // Use cases for this are for example permissions error when running the `eval` command.
    if (Reflect.get(Object(context), "silent")) return;

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder().setDescription(content).setColor(colors.danger)
        ],
        allowedMentions: { users: [interaction.user.id], roles: [] }
      });
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder().setDescription(content).setColor(colors.danger)
      ],
      allowedMentions: { users: [interaction.user.id], roles: [] },
    });
  }
}
