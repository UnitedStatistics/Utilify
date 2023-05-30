import { init } from "@androz2091/discord-invites-tracker";
import { ApplyOptions } from "@sapphire/decorators";
import type { Store } from "@sapphire/framework";
import { Listener } from "@sapphire/framework";
import { blue, gray, green, magenta, magentaBright, white, yellow } from "colorette";
import { env } from "../lib/env";

const dev = env.NODE_ENV !== "production";

@ApplyOptions<Listener.Options>({ once: true })
export class UserEvent extends Listener {
  private readonly style = dev ? yellow : blue;

  public run() {
    this.printBanner();
    this.printStoreDebugInformation();

    const tracker = init(this.container.client, {
      fetchGuilds: true,
      fetchVanity: true,
      fetchAuditLogs: true
    });

    tracker.on("guildMemberAdd", async (member, type, invite) => {
      if (member.guild.id !== "941671046724091968") return;

      const channel = await this.container.client.channels.fetch("1028624014534529085");
      if (!channel || !channel.isTextBased()) return;

      switch (type) {
      case "normal":
        {
          channel.send(`**${member.user.tag}** has joined the server. They were invited by **${invite!.inviter?.tag}**.`);
        }
        break;
      default:
        {
          channel.send(`**${member.user.tag}** has joined the server.`);
        }
        break;
      }
    });
  }

  private printBanner() {
    const success = green("+");

    const llc = dev ? magentaBright : white;
    const blc = dev ? magenta : blue;

    const line01 = llc("");
    const line02 = llc("");
    const line03 = llc("");

    // Offset Pad
    const pad = " ".repeat(7);

    console.log(
      String.raw`
${line01} ${pad}${blc("1.0.0")}
${line02} ${pad}[${success}] Gateway
${line03}${dev ? ` ${pad}${blc("<")}${llc("/")}${blc(">")} ${llc("DEVELOPMENT MODE")}` : ""}
		`.trim()
    );
  }

  private printStoreDebugInformation() {
    const { client, logger } = this.container;
    const stores = [...client.stores.values()];
    const last = stores.pop()!;

    for (const store of stores) logger.info(this.styleStore(store, false));
    logger.info(this.styleStore(last, true));
  }

  private styleStore(store: Store<any>, last: boolean) {
    return gray(`${last ? "└─" : "├─"} Loaded ${this.style(store.size.toString().padEnd(3, " "))} ${store.name}.`);
  }
}
