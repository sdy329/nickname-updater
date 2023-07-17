import {
  ChannelType,
  EmbedBuilder,
  type Guild,
  type GuildMember,
} from 'discord.js';
import {Color} from './embeds';
import type {SettingsManager} from './settings';

export class MessageLogger {
  public constructor(private readonly settingsManager: SettingsManager) {}

  public async logNicknameUpdates(
    member: GuildMember,
    find: string,
    replace: string,
    updated: string,
    errors: string,
    executedTimestamp: number
  ) {
    const logChannel = await this.channelForGuild(member.guild);
    if (!logChannel) {
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(Color.Blue)
      .setTitle('Nicknames Updated')
      .addFields(
        {name: 'Member', value: `${member} (${member.user.tag})`},
        {name: 'Find', value: find},
        {name: 'Replace', value: replace},
        {name: 'Updated', value: updated},
        {name: 'Errors', value: errors},
      )
      .setFooter({text: `User ID: ${member.id}`})
      .setTimestamp(executedTimestamp);

    await logChannel.send({embeds: [embed]});
  }

  private async channelForGuild(guild: Guild) {
    const guildSettings = await this.settingsManager.get(guild.id);

    const loggingChannelId = guildSettings?.loggingChannel;
    if (!loggingChannelId) {
      return null;
    }

    const loggingChannel = await guild.channels.fetch(loggingChannelId);

    return loggingChannel?.type === ChannelType.GuildText
      ? loggingChannel
      : null;
  }

}
