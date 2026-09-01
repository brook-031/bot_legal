const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder, MessageFlags, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('exportar-ids')
        .setDescription('Exporta TODOS os IDs de canais, categorias e cargos do Servidor Legal para o .env')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            const guild = interaction.guild;
            await guild.channels.fetch();
            await guild.roles.fetch();

            let envLines = [];
            let summaryLines = [];

            envLines.push(`# ============================================================`);
            envLines.push(`# GUILD LEGAL`);
            envLines.push(`# ============================================================`);
            envLines.push(`LEGAL_GUILD_ID=${guild.id}`);
            envLines.push(``);

            // ---- CARGOS ----
            envLines.push(`# ============================================================`);
            envLines.push(`# CARGOS DO SERVIDOR LEGAL`);
            envLines.push(`# ============================================================`);
            summaryLines.push(`\n============================================================`);
            summaryLines.push(`TODOS OS CARGOS DO SERVIDOR LEGAL`);
            summaryLines.push(`============================================================\n`);

            const roles = [...guild.roles.cache.values()].sort((a, b) => b.position - a.position);
            roles.forEach((role, i) => {
                const cleanKey = role.name
                    .replace(/[^\w\s]/g, '')
                    .trim()
                    .toUpperCase()
                    .replace(/\s+/g, '_')
                    .replace(/_+/g, '_')
                    .substring(0, 40);
                envLines.push(`LEGAL_ROLE_${cleanKey}_ID=${role.id}`);
                summaryLines.push(`🎭 @${role.name.padEnd(35)} -> ID: ${role.id}`);
            });

            // ---- CATEGORIAS ----
            envLines.push(``);
            envLines.push(`# ============================================================`);
            envLines.push(`# CATEGORIAS DO SERVIDOR LEGAL`);
            envLines.push(`# ============================================================`);
            summaryLines.push(`\n============================================================`);
            summaryLines.push(`CATEGORIAS DO SERVIDOR LEGAL`);
            summaryLines.push(`============================================================\n`);

            const categories = [...guild.channels.cache.values()]
                .filter(c => c.type === ChannelType.GuildCategory)
                .sort((a, b) => a.rawPosition - b.rawPosition);

            categories.forEach(cat => {
                const cleanKey = cat.name
                    .replace(/[^\w\s]/g, '')
                    .trim()
                    .toUpperCase()
                    .replace(/\s+/g, '_')
                    .replace(/_+/g, '_')
                    .substring(0, 40);
                envLines.push(`LEGAL_CATEGORY_${cleanKey}_ID=${cat.id}`);
                summaryLines.push(`📁 ${cat.name.padEnd(35)} -> ID: ${cat.id}`);
            });

            // ---- CANAIS ----
            envLines.push(``);
            envLines.push(`# ============================================================`);
            envLines.push(`# CANAIS DO SERVIDOR LEGAL`);
            envLines.push(`# ============================================================`);
            summaryLines.push(`\n============================================================`);
            summaryLines.push(`CANAIS DO SERVIDOR LEGAL`);
            summaryLines.push(`============================================================\n`);

            const textChannels = [...guild.channels.cache.values()]
                .filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement || c.type === ChannelType.GuildForum)
                .sort((a, b) => {
                    const catDiff = (a.parentId || '0').localeCompare(b.parentId || '0');
                    return catDiff !== 0 ? catDiff : a.rawPosition - b.rawPosition;
                });

            textChannels.forEach(ch => {
                const cleanKey = ch.name
                    .replace(/[^\w\s]/g, '')
                    .trim()
                    .toUpperCase()
                    .replace(/\s+/g, '_')
                    .replace(/_+/g, '_')
                    .substring(0, 40);
                const catName = ch.parent ? ch.parent.name.substring(0, 20).replace(/\s+/g, '-') : 'SEM_CATEGORIA';
                envLines.push(`LEGAL_CHANNEL_${cleanKey}_ID=${ch.id}  # [${catName}]`);
                summaryLines.push(`#️⃣  ${ch.name.padEnd(35)} -> ID: ${ch.id}  [${catName}]`);
            });

            // ---- VOICE CHANNELS ----
            envLines.push(``);
            envLines.push(`# ============================================================`);
            envLines.push(`# CANAIS DE VOZ DO SERVIDOR LEGAL`);
            envLines.push(`# ============================================================`);
            summaryLines.push(`\n============================================================`);
            summaryLines.push(`CANAIS DE VOZ DO SERVIDOR LEGAL`);
            summaryLines.push(`============================================================\n`);

            const voiceChannels = [...guild.channels.cache.values()]
                .filter(c => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice)
                .sort((a, b) => a.rawPosition - b.rawPosition);

            voiceChannels.forEach(ch => {
                const cleanKey = ch.name
                    .replace(/[^\w\s]/g, '')
                    .trim()
                    .toUpperCase()
                    .replace(/\s+/g, '_')
                    .replace(/_+/g, '_')
                    .substring(0, 40);
                summaryLines.push(`🔊 ${ch.name.padEnd(35)} -> ID: ${ch.id}`);
                envLines.push(`LEGAL_VOICE_${cleanKey}_ID=${ch.id}`);
            });

            const envContent = envLines.join('\n');
            const summaryContent = summaryLines.join('\n');

            const attachEnv = new AttachmentBuilder(Buffer.from(envContent, 'utf8'), { name: 'legal_copiar_para_env.txt' });
            const attachSummary = new AttachmentBuilder(Buffer.from(summaryContent, 'utf8'), { name: 'legal_ids_resumo.txt' });

            await interaction.editReply({
                content: `📄 **IDs do Servidor Legal exportados com sucesso!**\n\n` +
                    `• \`legal_copiar_para_env.txt\` → copie para o \`.env\`\n` +
                    `• \`legal_ids_resumo.txt\` → lista legível de todos os IDs\n\n` +
                    `**Total:** ${roles.length} cargos | ${categories.length} categorias | ${textChannels.length} canais de texto | ${voiceChannels.length} canais de voz`,
                files: [attachEnv, attachSummary]
            });

        } catch (err) {
            console.error('[exportar-ids] Erro:', err);
            await interaction.editReply({ content: `❌ Erro ao exportar IDs: ${err.message}` });
        }
    }
};
