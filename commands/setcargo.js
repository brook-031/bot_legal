const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { ORGS } = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setcargo')
        .setDescription('Configura o sistema de solicitação de cargos'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🏛️ Solicitação de Registro Legal')
            .setDescription('Selecione uma das organizações abaixo para iniciar sua solicitação de registro.\n\nApós clicar, preencha o modal com seu **Nome In-Game** e **ID**.')
            .setColor(0x00AE86)
            .setTimestamp();

        // Group buttons into rows (max 5 buttons per row)
        const rows = [];
        let currentRow = new ActionRowBuilder();

        ORGS.forEach((org, index) => {
            if (index > 0 && index % 5 === 0) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
            currentRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`apply_${org.id}`)
                    .setLabel(org.name)
                    .setEmoji(org.emoji)
                    .setStyle(ButtonStyle.Primary)
            );
        });
        rows.push(currentRow);

        await interaction.reply({ embeds: [embed], components: rows });
    },
};
