const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('exportar-ids')
        .setDescription('Exporta os IDs de todos os canais e cargos do Servidor Legal para o .env')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            const guild = interaction.guild;
            const exportConfigPath = path.join(__dirname, '../utils/generated_ids.json');
            let curConfig = {};
            if (fs.existsSync(exportConfigPath)) {
                curConfig = JSON.parse(fs.readFileSync(exportConfigPath, 'utf8'));
            }

            let envContent = `# === CARGOS GLOBAIS (LEGAL) ===\n`;
            envContent += `GUILD_ID=${guild.id}\n`;
            envContent += `ROLE_STAFF_LEGAL_ID=${curConfig?.globalRoles?.['Staff'] || ''}\n`;
            envContent += `ROLE_SUPORTE_LEGAL_ID=${curConfig?.globalRoles?.['Suporte'] || ''}\n`;
            envContent += `ROLE_JUIZ_ID=${curConfig?.globalRoles?.['Juiz'] || ''}\n\n`;

            if (curConfig?.orgs) {
                envContent += `# === TAGS BASE DAS ORGANIZAÇÕES LEGAIS ===\n`;
                for (const org of curConfig.orgs) {
                    const cleanKey = org.id.toUpperCase().replace(/[^A-Z0-9]/g, '_');
                    envContent += `ROLE_ORG_${cleanKey}_BASE_ID=${org.roles?.base || ''}\n`;
                }
            }

            const attachmentJson = new AttachmentBuilder(Buffer.from(JSON.stringify(curConfig, null, 2)), { name: 'legal_ids.json' });
            const attachmentEnv = new AttachmentBuilder(Buffer.from(envContent, 'utf8'), { name: 'copiar_para_env_legal.txt' });

            await interaction.editReply({
                content: `📄 **IDs do Servidor Legal exportados com sucesso!**`,
                files: [attachmentEnv, attachmentJson]
            });
        } catch (err) {
            await interaction.editReply({ content: `❌ Erro ao exportar IDs: ${err.message}` });
        }
    }
};
