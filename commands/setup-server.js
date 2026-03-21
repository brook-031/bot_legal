const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

const orgsData = [
    {
        name: 'Hospital',
        emoji: '🏥',
        color: 'Red',
        ranks: [
            { name: 'Diretor', emoji: '👨‍⚕️', isChefe: true },
            { name: 'Gerente', emoji: '🩺', isGerente: true },
            { name: 'Paramedico', emoji: '🚑' },
            { name: 'Estagiario', emoji: '💊' }
        ]
    },
    {
        name: 'Los Santos',
        emoji: '🛠️',
        color: 'Blue',
        ranks: [
            { name: 'Chefe LosSantos', emoji: '👨‍🔧', isChefe: true },
            { name: 'Gerente LosSantos', emoji: '🔧', isGerente: true },
            { name: 'Mecanico LosSantos', emoji: '🚗' }
        ]
    },
    {
        name: 'OverSpeed',
        emoji: '🏁',
        color: 'Orange',
        ranks: [
            { name: 'Chefe OverSpeed', emoji: '👨‍🔧', isChefe: true },
            { name: 'Gerente OverSpeed', emoji: '🔧', isGerente: true },
            { name: 'Mecanico OverSpeed', emoji: '🏎️' }
        ]
    },
    {
        name: 'Cafe',
        emoji: '☕',
        color: 'DarkOrange',
        ranks: [
            { name: 'Chefe Cafe', emoji: '👨‍🍳', isChefe: true },
            { name: 'Gerente Cafe', emoji: '📋', isGerente: true },
            { name: 'Garçom Cafe', emoji: '☕' }
        ]
    },
    {
        name: 'Pearl',
        emoji: '🦪',
        color: 'Gold',
        ranks: [
            { name: 'Chefe Pearl', emoji: '👑', isChefe: true },
            { name: 'Gerente Pearl', emoji: '📋', isGerente: true },
            { name: 'Garçom Pearl', emoji: '🍽️' }
        ]
    }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-server')
        .setDescription('Cria toda a estrutura do servidor (Cargos, Categorias e Canais) para Novas Orgs')
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

            for (const org of orgsData) {
                // Main Org Role
                const orgRole = await createOrUpdateRole(`${org.emoji} ${org.name}`, { color: org.color });

                // Org Hierarchy Roles
                const roleChefeList = [];
                const roleGerenteList = [];

                for (const rank of org.ranks) {
                    const rankRoleName = `${rank.emoji} ${rank.name}`;
                    const createdRole = await createOrUpdateRole(rankRoleName, { color: org.color });
                    
                    if (rank.isChefe) roleChefeList.push(createdRole.id);
                    if (rank.isGerente) roleGerenteList.push(createdRole.id);
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

                // Channels structure
                const channels = [
                    { name: '🔊 Voz 1', type: ChannelType.GuildVoice, config: 'default' },
                    { name: '🔊 Voz 2', type: ChannelType.GuildVoice, config: 'default' },
                    { name: '🔊 Voz 3', type: ChannelType.GuildVoice, config: 'default' },
                    { name: '💬-bate-papo', type: ChannelType.GuildText, config: 'default' },
                    { name: '📜-regras', type: ChannelType.GuildText, config: 'readonly_edit_high' },
                    { name: '📢-avisos', type: ChannelType.GuildText, config: 'readonly_edit_high' },
                    { name: '📦-bau-lider', type: ChannelType.GuildText, config: 'readonly_all' },
                    { name: '📦-bau', type: ChannelType.GuildText, config: 'readonly_all' },
                    { name: '🏦-banco', type: ChannelType.GuildText, config: 'readonly_all' },
                    { name: '📥-recrutamento', type: ChannelType.GuildText, config: 'default' },
                    { name: '🤝-contratar', type: ChannelType.GuildText, config: 'readonly_edit_high' }
                ];

                for (const chan of channels) {
                    if (interaction.guild.channels.cache.find(c => c.name === chan.name && c.parentId === catOrg.id)) continue;

                    const overwrites = [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: orgRole.id, allow: [PermissionFlagsBits.ViewChannel] }
                    ];

                    if (chan.config === 'readonly_edit_high') {
                        // Everyone can read, nobody can type by default
                        overwrites.push({ id: orgRole.id, deny: [PermissionFlagsBits.SendMessages] });
                        
                        // Chefe/Gerente can type
                        for (const id of roleChefeList) overwrites.push({ id, allow: [PermissionFlagsBits.SendMessages] });
                        for (const id of roleGerenteList) overwrites.push({ id, allow: [PermissionFlagsBits.SendMessages] });
                    } else if (chan.config === 'readonly_all') {
                        // Everyone can read, nobody can type
                        overwrites.push({ id: orgRole.id, deny: [PermissionFlagsBits.SendMessages] });
                    }

                    await interaction.guild.channels.create({
                        name: chan.name,
                        type: chan.type,
                        parent: catOrg.id,
                        permissionOverwrites: overwrites
                    });
                }
            }

            await interaction.editReply('✅ Servidor estruturado para as novas organizações (Cargos, Canais e Permissões)!');
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Erro no setup. Verifique logs.');
        }
    },
};
