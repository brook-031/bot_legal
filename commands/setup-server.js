const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { ORGS, RANKS, STANDARD_CHANNELS } = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-server')
        .setDescription('Cria toda a estrutura do servidor (Cargos, Categorias e Canais)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Helper function to create or update roles
            const createOrUpdateRole = async (name, options = {}) => {
                let role = interaction.guild.roles.cache.find(r => r.name === name);
                if (role) {
                    return await role.edit(options);
                }
                return await interaction.guild.roles.create({ name, ...options });
            };

            // 1. Create Global Roles
            const rolePrefeitura = await createOrUpdateRole('🏛️ Prefeitura', { color: 'Gold', permissions: [PermissionFlagsBits.Administrator] });
            const roleSuporte = await createOrUpdateRole('🛠️ Suporte', { color: 'Blue' });
            const roleMembroLegal = await createOrUpdateRole('👮 Membro Legal', { color: 'Greyple' });

            // 2. Create Global Categories
            const catWelcome = await interaction.guild.channels.cache.find(c => c.name === '👋 | BEM-VINDOS' && c.type === ChannelType.GuildCategory)
                || await interaction.guild.channels.create({ name: '👋 | BEM-VINDOS', type: ChannelType.GuildCategory });

            const catTickets = await interaction.guild.channels.cache.find(c => c.name === '🎫 | TICKETS' && c.type === ChannelType.GuildCategory)
                || await interaction.guild.channels.create({ name: '🎫 | TICKETS', type: ChannelType.GuildCategory });

            const catAdmin = await interaction.guild.channels.cache.find(c => c.name === '🏢 | ADMINISTRAÇÃO' && c.type === ChannelType.GuildCategory)
                || await interaction.guild.channels.create({ name: '🏢 | ADMINISTRAÇÃO', type: ChannelType.GuildCategory, permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: roleMembroLegal.id, allow: [PermissionFlagsBits.ViewChannel] }] });

            const catFiles = await interaction.guild.channels.cache.find(c => c.name === '📂 | ARQUIVOS' && c.type === ChannelType.GuildCategory)
                || await interaction.guild.channels.create({ name: '📂 | ARQUIVOS', type: ChannelType.GuildCategory, permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: roleMembroLegal.id, allow: [PermissionFlagsBits.ViewChannel] }] });

            // 3. Create global channels
            const globalChannels = [
                { name: '📩-solicitar-registro', parent: catWelcome.id, overwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.SendMessages] }] },
                { name: '📋-manual-de-conduta', parent: catWelcome.id, overwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.SendMessages] }] },
                { name: '🎟️-abrir-ticket', parent: catTickets.id },
                { name: '📑-log-ticket', parent: catTickets.id, overwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: rolePrefeitura.id, allow: [PermissionFlagsBits.ViewChannel] }] }
            ];

            for (const chan of globalChannels) {
                if (!interaction.guild.channels.cache.find(c => c.name === chan.name && c.parentId === chan.parent)) {
                    await interaction.guild.channels.create({ name: chan.name, parent: chan.parent, permissionOverwrites: chan.overwrites || [] });
                }
            }

            const adminChannels = ['📢-comunicados', '⚠️-advertências', '📉-rebaixamentos', '📑-registro-de-oficiais', '✈️-ausência', '💡-sugestões', '⚖️-código-penal'];
            for (const name of adminChannels) {
                if (!interaction.guild.channels.cache.find(c => c.name === name && c.parentId === catAdmin.id)) {
                    await interaction.guild.channels.create({ name, parent: catAdmin.id });
                }
            }

            const fileChannels = ['💸-multas', '📦-apreensoes', '📝-registro-de-acao'];
            for (const name of fileChannels) {
                if (!interaction.guild.channels.cache.find(c => c.name === name && c.parentId === catFiles.id)) {
                    await interaction.guild.channels.create({ name, parent: catFiles.id });
                }
            }

            // 4. Create Org-Specific Roles and Channels
            for (const org of ORGS) {
                // Main Org Role
                const orgRole = await createOrUpdateRole(`${org.emoji} ${org.name}`, { color: org.color });

                // Org Hierarchy Roles
                const orgHierarchy = {};
                for (const rank of RANKS) {
                    const rankRoleName = `${rank.emoji} ${rank.name} - ${org.name}`;
                    orgHierarchy[rank.name] = await createOrUpdateRole(rankRoleName, { color: rank.color });
                }

                // Org Category
                const catOrgName = `🏢 | ${org.name}`;
                const catOrg = await interaction.guild.channels.cache.find(c => c.name === catOrgName && c.type === ChannelType.GuildCategory)
                    || await interaction.guild.channels.create({
                        name: catOrgName,
                        type: ChannelType.GuildCategory,
                        permissionOverwrites: [
                            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                            { id: orgRole.id, allow: [PermissionFlagsBits.ViewChannel] }
                        ]
                    });

                // Org Channels
                for (const chan of STANDARD_CHANNELS) {
                    if (interaction.guild.channels.cache.find(c => c.name === chan.name && c.parentId === catOrg.id)) continue;

                    const overwrites = [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: orgRole.id, allow: [PermissionFlagsBits.ViewChannel] }
                    ];

                    if (chan.hc_only) {
                        // Restricted to Comando, Sub-Comando, Coronel of THIS org
                        overwrites.push({ id: orgRole.id, deny: [PermissionFlagsBits.ViewChannel] });
                        overwrites.push({ id: orgHierarchy['Comando'].id, allow: [PermissionFlagsBits.ViewChannel] });
                        overwrites.push({ id: orgHierarchy['Sub-Comando'].id, allow: [PermissionFlagsBits.ViewChannel] });
                        overwrites.push({ id: orgHierarchy['Coronel'].id, allow: [PermissionFlagsBits.ViewChannel] });
                    }

                    await interaction.guild.channels.create({
                        name: chan.name,
                        type: chan.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText,
                        parent: catOrg.id,
                        permissionOverwrites: overwrites
                    });
                }
            }

            await interaction.editReply('✅ Servidor estruturado com hierarquias isoladas por organização!');
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Erro no setup. Verifique logs.');
        }
    },
};
