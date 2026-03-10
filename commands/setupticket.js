const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupticket')
        .setDescription('Configura o sistema de tickets'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Central de Atendimento')
            .setDescription('Precisa de ajuda ou quer falar com a Prefeitura?\nClique no botão abaixo para abrir um ticket de suporte.')
            .setColor(0x3498DB)
            .setThumbnail(interaction.guild.iconURL())
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_open')
                .setLabel('Abrir Ticket')
                .setEmoji('🎟️')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
