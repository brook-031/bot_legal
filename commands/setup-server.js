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
                let role = interaction.guild.roles.cache.find(r => r.name === name || r.name.includes(name));
                if (role) {
                    return await role.edit(options);
                }
                return await interaction.guild.roles.create({ name, ...options });
            };

            // 1. Create Global Roles
            const rolePrefeitura = await createOrUpdateRole('🏛️ Prefeitura', { color: 'Gold', permissions: [PermissionFlagsBits.Administrator] });
            const roleSuporte = await createOrUpdateRole('🛠️ Suporte', { color: 'Blue' });
            const roleMembroLegal = await createOrUpdateRole('👮 Membro Legal', { color: 'Greyple' });

            // 2. Create Hierarchy Ranks (Roles)
            for (const rank of RANKS) {
                await createOrUpdateRole(`${rank.emoji} ${rank.name}`, { color: rank.color });
            }

            // 3. Create Org Roles
            for (const org of ORGS) {
                await createOrUpdateRole(`${org.emoji} ${org.name}`, { color: org.color });
            }

            // 4. Create Categories and Channels
            // --- BEM-VINDOS ---
            const catWelcome = await interaction.guild.channels.cache.find(c => c.name === '👋 | BEM-VINDOS' && c.type === ChannelType.GuildCategory)
                || await interaction.guild.channels.create({ name: '👋 | BEM-VINDOS', type: ChannelType.GuildCategory });

            const welcomeChannels = [
                { name: '📩-solicitar-registro', permissions: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.SendMessages] }] },
                { name: '📋-manual-de-conduta', permissions: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.SendMessages] }] }
            ];

            for (const chan of welcomeChannels) {
                if (!interaction.guild.channels.cache.find(c => c.name === chan.name && c.parentId === catWelcome.id)) {
                    await interaction.guild.channels.create({ name: chan.name, parent: catWelcome.id, permissionOverwrites: chan.permissions });
                }
            }

            // --- TICKETS ---
            const catTickets = await interaction.guild.channels.cache.find(c => c.name === '🎫 | TICKETS' && c.type === ChannelType.GuildCategory)
                || await interaction.guild.channels.create({ name: '🎫 | TICKETS', type: ChannelType.GuildCategory });

            if (!interaction.guild.channels.cache.find(c => c.name === '🎟️-abrir-ticket' && c.parentId === catTickets.id)) {
                await interaction.guild.channels.create({ name: '🎟️-abrir-ticket', parent: catTickets.id });
            }
            if (!interaction.guild.channels.cache.find(c => c.name === '📑-log-ticket' && c.parentId === catTickets.id)) {
                await interaction.guild.channels.create({ name: '📑-log-ticket', parent: catTickets.id, permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: rolePrefeitura.id, allow: [PermissionFlagsBits.ViewChannel] }] });
            }

            // --- ADMINISTRAÇÃO ---
            const catAdmin = await interaction.guild.channels.cache.find(c => c.name === '🏢 | ADMINISTRAÇÃO' && c.type === ChannelType.GuildCategory)
                || await interaction.guild.channels.create({ name: '🏢 | ADMINISTRAÇÃO', type: ChannelType.GuildCategory, permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: roleMembroLegal.id, allow: [PermissionFlagsBits.ViewChannel] }] });

            const adminChannels = ['📢-comunicados', '⚠️-advertências', '📉-rebaixamentos', '📑-registro-de-oficiais', '✈️-ausência', '💡-sugestões', '⚖️-código-penal'];
            for (const name of adminChannels) {
                if (!interaction.guild.channels.cache.find(c => c.name === name && c.parentId === catAdmin.id)) {
                    await interaction.guild.channels.create({ name, parent: catAdmin.id });
                }
            }

            // --- ARQUIVOS ---
            const catFiles = await interaction.guild.channels.cache.find(c => c.name === '📂 | ARQUIVOS' && c.type === ChannelType.GuildCategory)
                || await interaction.guild.channels.create({ name: '📂 | ARQUIVOS', type: ChannelType.GuildCategory, permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: roleMembroLegal.id, allow: [PermissionFlagsBits.ViewChannel] }] });

            const fileChannels = ['💸-multas', '📦-apreensoes', '📝-registro-de-acao'];
            for (const name of fileChannels) {
                if (!interaction.guild.channels.cache.find(c => c.name === name && c.parentId === catFiles.id)) {
                    await interaction.guild.channels.create({ name, parent: catFiles.id });
                }
            }

            // --- ORGS ---
            const roleComando = interaction.guild.roles.cache.find(r => r.name.includes('Comando'));
            const roleSubComando = interaction.guild.roles.cache.find(r => r.name.includes('Sub-Comando'));
            const roleCoronel = interaction.guild.roles.cache.find(r => r.name.includes('Coronel'));

            for (const org of ORGS) {
                const orgRole = interaction.guild.roles.cache.find(r => r.name.includes(org.name));
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

                for (const chan of STANDARD_CHANNELS) {
                    if (interaction.guild.channels.cache.find(c => c.name === chan.name && c.parentId === catOrg.id)) continue;

                    const overwrites = [];
                    if (chan.hc_only) {
                        overwrites.push({ id: orgRole.id, deny: [PermissionFlagsBits.ViewChannel] });
                        overwrites.push({ id: roleComando.id, allow: [PermissionFlagsBits.ViewChannel] });
                        overwrites.push({ id: roleSubComando.id, allow: [PermissionFlagsBits.ViewChannel] });
                        overwrites.push({ id: roleCoronel.id, allow: [PermissionFlagsBits.ViewChannel] });
                    }

                    await interaction.guild.channels.create({
                        name: chan.name,
                        type: chan.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText,
                        parent: catOrg.id,
                        permissionOverwrites: overwrites
                    });
                }
            }

            await interaction.editReply('✅ Servidor atualizado com sucesso! Cargos polidos com cores e emojis.');
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Ocorreu um erro ao atualizar o servidor. Verifique as permissões do bot.');
        }
    },
};
