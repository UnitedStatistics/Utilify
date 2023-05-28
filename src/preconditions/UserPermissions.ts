import type { AllFlowsPrecondition, Command } from "@sapphire/framework";
import { Identifiers, Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction, Message, NewsChannel, TextChannel } from "discord.js";
import { PermissionFlagsBits, PermissionsBitField } from "discord.js";

export interface PermissionPreconditionContext extends AllFlowsPrecondition.Context {
	permissions?: PermissionsBitField;
}

export class UserPrecondition extends Precondition {
  private readonly dmChannelPermissions = new PermissionsBitField(
    ~new PermissionsBitField([
      PermissionFlagsBits.AddReactions,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.UseExternalEmojis,
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.UseExternalStickers,
      PermissionFlagsBits.MentionEveryone
    ]).bitfield & PermissionsBitField.All
  ).freeze();

  public override messageRun(message: Message, _command: Command, context: PermissionPreconditionContext): AllFlowsPrecondition.Result {
    const required = context.permissions ?? new PermissionsBitField();
    const channel = message.channel as TextChannel | NewsChannel;
    const permissions = message.guild ? channel.permissionsFor(message.author) : this.dmChannelPermissions;

    return this.sharedRun(required, permissions);
  }

  public override chatInputRun(interaction: ChatInputCommandInteraction, _command: Command, context: PermissionPreconditionContext): AllFlowsPrecondition.Result {
    const required = context.permissions ?? new PermissionsBitField();
    const permissions = interaction.guildId ? interaction.memberPermissions : this.dmChannelPermissions;

    return this.sharedRun(required, permissions);
  }

  private sharedRun(
    requiredPermissions: PermissionsBitField,
    availablePermissions: PermissionsBitField | null,
  ): AllFlowsPrecondition.Result {
    if (!availablePermissions) {
      return this.error({
        identifier: Identifiers.PreconditionUserPermissionsNoPermissions,
        message: "Couldn't resolve your permissions."
      });
    }

    const missing = availablePermissions.missing(requiredPermissions);
    return missing.length === 0
      ? this.ok()
      : this.error({
        identifier: Identifiers.PreconditionUserPermissions,
        message: "You don't have enough permissions to run this command.",
        context: { missing }
			  });
  }
}