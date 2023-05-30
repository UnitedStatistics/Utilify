import { ApplyOptions } from "@sapphire/decorators";
import { Listener, type Events } from "@sapphire/framework";
import { EmbedBuilder, type Message } from "discord.js";
import moment from "moment";
import { colors } from "../consts";
import { db } from "../lib/db";

@ApplyOptions<Listener.Options>({
  event: "messageCreate"
})
export class UserEvent extends Listener<typeof Events.MessageCreate> {
  public async run(message: Message) {
    if (!message.inGuild() || message.author.bot) return;

    const mentioned = message.mentions.members.first();
    if (mentioned) {
      const data = await db.afk.findFirst({
        where: {
          userId: mentioned.id
        }
      });
      if (!data) return;

      const timeSince = moment(data.startedAt).fromNow();

      message.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: mentioned.displayName,
              iconURL: mentioned.displayAvatarURL()
            })
            .setDescription([`I've been AFK since **${timeSince}**.`, `> **Reason**: ${data.reason}`].join("\n"))
            .setColor(colors.primary)
        ],
        allowedMentions: {
          parse: [],
          users: [],
          roles: [],
          repliedUser: true
        }
      });
    }

    const data = await db.afk.findFirst({
      where: {
        userId: message.author.id
      }
    });

    const prefix = this.container.client.options.defaultPrefix
      ? typeof this.container.client.options.defaultPrefix === "object"
        ? this.container.client.options.defaultPrefix[0]
        : this.container.client.options.defaultPrefix
      : ">";

    if (data && !message.content.startsWith(prefix) && new Date().getTime() - data.startedAt.getTime() > 30_000) {
      await db.afk.delete({
        where: {
          userId: message.author.id
        }
      });
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`Welcome back! You were AFK for **${moment(data.startedAt).fromNow(true)}**.`)
            .setColor(colors.success)
        ],
        allowedMentions: {
          parse: [],
          users: [],
          roles: [],
          repliedUser: true
        }
      });
    }
  }
}
