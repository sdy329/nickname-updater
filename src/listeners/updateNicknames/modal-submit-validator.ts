import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import {
    EmbedBuilder,
    type Interaction,
    type ModalSubmitInteraction,
} from 'discord.js';
import { Color } from '../../lib/embeds';
import { InputId, ModalId } from '../../lib/updates';
import { messageLogger } from '../..';

@ApplyOptions<Listener.Options>({ event: Events.InteractionCreate })
export class InteractionCreateListener extends Listener<
    typeof Events.InteractionCreate
> {

    public override async run(interaction: Interaction) {
        if (
            !interaction.isModalSubmit() ||
            interaction.customId !== ModalId.Update ||
            !interaction.inGuild()
        ) {
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const find = interaction.fields.getTextInputValue(InputId.Find);
        if (!find) {
            return this.sendValidationFailure(
                interaction,
                'Find must contain at least 1 non-whitespace character'
            );
        }

        const replace = interaction.fields.getTextInputValue(InputId.Replace);
        if (!replace) {
            return this.sendValidationFailure(
                interaction,
                'Replace must contain at least 1 non-whitespace character'
            );
        }

        const spaces = interaction.fields.getTextInputValue(InputId.Spaces);
        let spaceStatus = false;
        if (!spaces) {
            spaceStatus = false;
        }
        else if (spaces.toLowerCase() == 'yes') {
            spaceStatus = true;
        }
        else if (spaces.toLowerCase() == 'no') {
            spaceStatus = false;
        }
        else {
            return this.sendValidationFailure(
                interaction,
                'Add Spaces input may only contain yes or no'
            );
        }


        const guild = await interaction.client.guilds.fetch(interaction.guildId);
        const member = await guild.members.fetch(interaction.member.user.id);

        const members = await guild.members.fetch();
        let changeCount = 0;
        let errorCount = 0;

        if (spaceStatus) {
            await Promise.all(
                members.map(async (member) => {
                    if (member.displayName.includes(' ' + find + ' ')) {
                        try {
                            await member.setNickname(
                                member.displayName.replace(' ' + find + ' ', replace)
                            );
                            console.log(`Changed nickname for ${member.user.tag}: ${member.displayName}`);
                            changeCount++;
                        } catch (error) {
                            console.error(`Failed to change nickname for ${member.user.tag}`);
                            errorCount++;
                        }
                    }
                })
            );
        }
        else {
            await Promise.all(
                members.map(async (member) => {
                    if (member.displayName.includes(find)) {
                        try {
                            await member.setNickname(
                                member.displayName.replace(find, replace)
                            );
                            console.log(`Changed nickname for ${member.user.tag}: ${member.displayName}`);
                            changeCount++;
                        } catch (error) {
                            console.error(`Failed to change nickname for ${member.user.tag}`);
                            errorCount++;
                        }
                    }
                })
            );
        }

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(Color.Green)
                    .setDescription(
                        [
                            'Command Complete ✅',
                            `┣ Changed usernames: ${changeCount}`,
                            `┗ Change errors: ${errorCount}`
                        ].join('\n')
                    ),
            ],
        });

        messageLogger.logNicknameUpdates(
            member,
            find,
            replace,
            changeCount.toString(),
            errorCount.toString(),
            interaction.createdTimestamp
        );
    }

    private async sendValidationFailure(
        interaction: ModalSubmitInteraction,
        description: string
    ) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder().setColor(Color.Red).setDescription(description),
            ],
        });
    }
}
