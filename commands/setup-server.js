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
            // 1. Create Global Roles
            const rolePrefeitura = await interaction.guild.roles.create({ name: 'Prefeitura', color: 'Gold', permissions: [PermissionFlagsBits.Administrator], reason: 'Setup Inicial' });
            const roleSuporte = await interaction.guild.roles.create({ name: 'Suporte', color: 'Blue', reason: 'Setup Inicial' });
            const roleMembroLegal = await interaction.guild.roles.create({ name: 'Membro Legal', color: 'Greyple', reason: 'Setup Inicial' });

            // 2. Create Hierarchy Ranks (Roles)
            for (const rank of RANKS) {
                await interaction.guild.roles.create({ name: rank, reason: 'Setup Hierarquia' });
            }

            // 3. Create Org Roles
            for (const org of ORGS) {
                await interaction.guild.roles.create({ name: org.name, reason: 'Setup Org' });
            }

            // 4. Create Categories and Channels
            // --- BEM-VINDOS ---
            const catWelcome = await interaction.guild.channels.create({ name: '👋 | BEM-VINDOS', type: ChannelType.GuildCategory });
            await interaction.guild.channels.create({ name: '📩-solicitar-registro', parent: catWelcome.id, permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.SendMessages] }] });
            await interaction.guild.channels.create({ name: '📋-manual-de-conduta', parent: catWelcome.id, permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.SendMessages] }] });

            // --- TICKETS ---
            const catTickets = await interaction.guild.channels.create({ name: '🎫 | TICKETS', type: ChannelType.GuildCategory });
            await interaction.guild.channels.create({ name: '🎟️-abrir-ticket', parent: catTickets.id });
            await interaction.guild.channels.create({ name: '📑-log-ticket', parent: catTickets.id, permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: rolePrefeitura.id, allow: [PermissionFlagsBits.ViewChannel] }] });

            // --- ADMINISTRAÇÃO ---
            const catAdmin = await interaction.guild.channels.create({ name: '🏢 | ADMINISTRAÇÃO', type: ChannelType.GuildCategory, permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: roleMembroLegal.id, allow: [PermissionFlagsBits.ViewChannel] }] });
            const adminChannels = ['📢-comunicados', '⚠️-advertências', '📉-rebaixamentos', '📑-registro-de-oficiais', '✈️-ausência', '💡-sugestões', '⚖️-código-penal'];
            for (const name of adminChannels) {
                await interaction.guild.channels.create({ name, parent: catAdmin.id });
            }

            // --- ARQUIVOS ---
            const catFiles = await interaction.guild.channels.create({ name: '📂 | ARQUIVOS', type: ChannelType.GuildCategory, permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: roleMembroLegal.id, allow: [PermissionFlagsBits.ViewChannel] }] });
            const fileChannels = ['💸-multas', '📦-apreensoes', '📝-registro-de-acao'];
            for (const name of fileChannels) {
                await interaction.guild.channels.create({ name, parent: catFiles.id });
            }

            // --- ORGS ---
            const roleComando = interaction.guild.roles.cache.find(r => r.name === 'Comando');
            const roleSubComando = interaction.guild.roles.cache.find(r => r.name === 'Sub-Comando');
            const roleCoronel = interaction.guild.roles.cache.find(r => r.name === 'Coronel');

            for (const org of ORGS) {
                const orgRole = interaction.guild.roles.cache.find(r => r.name === org.name);
                const catOrg = await interaction.guild.channels.create({
                    name: `🏢 | ${org.name}`,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: orgRole.id, allow: [PermissionFlagsBits.ViewChannel] }
                    ]
                });

                for (const chan of STANDARD_CHANNELS) {
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

            await interaction.editReply('✅ Servidor configurado com sucesso! Todos os cargos e canais foram criados.');
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Ocorreu um erro ao configurar o servidor. Verifique as permissões do bot.');
        }
    },
};
