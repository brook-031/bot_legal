const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-server')
        .setDescription('DELETA todos os cargos e canais criados pelo bot (Cuidado!)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const categories = interaction.guild.channels.cache.filter(c =>
                c.type === 4 && (
                    c.name.includes('|') ||
                    c.name.includes('BEM-VINDOS') ||
                    c.name.includes('TICKETS') ||
                    c.name.includes('ADMINISTRAÇÃO') ||
                    c.name.includes('ARQUIVOS')
                )
            );

            for (const cat of categories.values()) {
                const children = interaction.guild.channels.cache.filter(c => c.parentId === cat.id);
                for (const child of children.values()) {
                    await child.delete().catch(() => { });
                }
                await cat.delete().catch(() => { });
            }

            // Delete roles
            const rolesToDelete = interaction.guild.roles.cache.filter(r =>
                r.name.includes('🏛️') ||
                r.name.includes('🛠️') ||
                r.name.includes('👮') ||
                r.name.includes('🥇') ||
                r.name.includes('🥈') ||
                r.name.includes('🥉') ||
                r.name.includes('🎖️') ||
                r.name.includes('🏵️') ||
                r.name.includes('🔶') ||
                r.name.includes('🔸') ||
                r.name.includes('🔹') ||
                r.name.includes('🔰') ||
                r.name.includes('❇️') ||
                r.name.includes('✅') ||
                r.name.includes('🔻') ||
                r.name.includes('💂') ||
                r.name.includes('🛡️')
            );

            for (const role of rolesToDelete.values()) {
                if (role.editable && !role.managed) {
                    await role.delete().catch(() => { });
                }
            }

            await interaction.editReply('✅ Estrutura do servidor limpa com sucesso!');
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Erro ao deletar estrutura. Verifique as permissões do bot.');
        }
    },
};
