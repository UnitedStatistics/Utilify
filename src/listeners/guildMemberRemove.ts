import { ApplyOptions } from "@sapphire/decorators";
import { Listener, type Events } from "@sapphire/framework";
import type { GuildMember } from "discord.js";

@ApplyOptions<Listener.Options>({
  name: "guildMemberRemove"
})
export class UserEvent extends Listener<typeof Events.GuildMemberRemove> {
  public async run(member: GuildMember) {
    if (member.guild.id !== "941671046724091968") return;

    const channel = await this.container.client.channels.fetch("1028624014534529085");
    if (!channel || !channel.isTextBased()) return;

    channel.send(`**${member.user.tag}** has left the server.`);
  }
}
