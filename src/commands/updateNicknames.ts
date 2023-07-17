import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    PermissionsBitField,
    type ChatInputCommandInteraction,
} from 'discord.js';
import { Color } from '../lib/embeds';
import { InputId, ModalId } from '../lib/updates';

const error = (interaction: ChatInputCommandInteraction, content: string) => {
    return interaction.followUp({
        embeds: [new EmbedBuilder().setColor(Color.Red).setDescription(content)],
        ephemeral: false,
    });
};

@ApplyOptions<Command.Options>({
    description: 'Changes specific characters in nicknames',
    requiredUserPermissions: [PermissionsBitField.Flags.ManageNicknames],
    runIn: [CommandOptionsRunTypeEnum.GuildAny]
})
export class UpdateNicknameCommand extends Command {
    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: false });

        if (!interaction.inGuild()) {
            await error(interaction, 'Command only available in servers');
            return;
        }

        const guild = await interaction.client.guilds.fetch(
            interaction.guildId
        );
        if (!guild.members.me) {
            await error(interaction, 'I am not a member of this server');
            return;
        }

        const missingPermissions = guild.members.me.permissions.missing([
            PermissionsBitField.Flags.ManageNicknames,
        ]);
        if (missingPermissions.length) {
            await error(
                interaction,
                `I am missing the following permissions: ${missingPermissions}`
            );
            return;
        }

        const timeoutModal = new ModalBuilder()
            .setCustomId(ModalId.Update)
            .setTitle('')
            .setComponents(
                new ActionRowBuilder<TextInputBuilder>().setComponents(
                    new TextInputBuilder()
                        .setCustomId(InputId.Find)
                        .setLabel('Find')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('')
                        .setRequired(true)
                ),
                new ActionRowBuilder<TextInputBuilder>().setComponents(
                    new TextInputBuilder()
                        .setCustomId(InputId.Replace)
                        .setLabel('Replace')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('')
                        .setRequired(true)
                )
            );
        await interaction.showModal(timeoutModal);
    }
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(
            command =>
                command
                    .setName(this.name)
                    .setDescription(this.description)
            //  {idHints: ['983911170203324447']}
        );
    }
}
