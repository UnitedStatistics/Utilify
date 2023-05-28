import type { Command } from "@sapphire/framework";
import type { InteractionReplyOptions, MessagePayload, MessageReplyOptions, } from "discord.js";
import { Message } from "discord.js";

export function reply(interactionOrMessage: Message | Command.ChatInputCommandInteraction ,options: string | MessagePayload | InteractionReplyOptions) {
  if(interactionOrMessage instanceof Message) {
    return interactionOrMessage.channel.send(options as string | MessagePayload | MessageReplyOptions);
  }

  return interactionOrMessage.reply(options);
}