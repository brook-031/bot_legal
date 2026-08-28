const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wipe-legal')
        .setDescription('WIPE TOTAL: Remove todos os canais, categorias e cargos do Legal (Apenas Administrador)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ Apenas Administradores podem executar a limpeza total.', flags: [MessageFlags.Ephemeral] });
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            await interaction.editReply({ content: '⏳ Iniciando limpeza total (Wipe Legal)...' });

            const channels = await interaction.guild.channels.fetch();
            for (const [id, channel] of channels) {
                if (!channel) continue;
                try {
                    await channel.delete('Wipe do servidor legal');
                    await sleep(150);
                } catch (e) { }
            }

            const roles = await interaction.guild.roles.fetch();
            const botMember = await interaction.guild.members.fetchMe();
            const highestRole = botMember.roles.highest;

            for (const [id, role] of roles) {
                if (role.managed || role.name === '@everyone' || role.position >= highestRole.position) continue;
                try {
                    await role.delete('Wipe do servidor legal');
                    await sleep(150);
                } catch (e) { }
            }

            await interaction.editReply('✅ **Wipe concluído com sucesso!** O servidor Legal está limpo. Agora você pode executar `/setup-legal`.');
        } catch (error) {
            console.error(error);
            await interaction.editReply(`❌ Erro no wipe legal: ${error.message}`);
        }
    }
};
