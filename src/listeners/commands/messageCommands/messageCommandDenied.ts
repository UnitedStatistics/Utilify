import type { Events, MessageCommandDeniedPayload } from "@sapphire/framework";
import { Listener, type UserError } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { colors } from "../../../consts";

export class UserEvent extends Listener<typeof Events.MessageCommandDenied> {
  public async run({ context, message: content }: UserError, { message }: MessageCommandDeniedPayload) {
    // `context: { silent: true }` should make UserError silent:
    // Use cases for this are for example permissions error when running the `eval` command.
    if (Reflect.get(Object(context), "silent")) return;

    return message.reply({ embeds: [
      new EmbedBuilder().setDescription(content).setColor(colors.danger)
    ], allowedMentions: { users: [message.author.id], roles: [] } });
  }
}
