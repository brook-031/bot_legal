const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    UserSelectMenuBuilder,
    AttachmentBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { LEGAL_ORGS, STANDARD_CHANNELS } = require('../utils/config');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-legal')
        .setDescription('Cria ou sincroniza toda a estrutura do Servidor Legal (Cargos, Canais e Painéis)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) return interaction.reply({ content: 'Este comando só pode ser usado em um servidor.', ephemeral: true });

        // Trava de segurança para Dono / Fundador
        if (process.env.OWNER_ID && interaction.user.id !== process.env.OWNER_ID && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ Apenas o Dono do Servidor pode executar o Setup Legal.', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            console.log('Iniciando comando /setup-legal...');
            await interaction.editReply('🚀 **Iniciando Setup do Servidor Legal...**\nIsso criará ou sincronizará todas as organizações, hierarquias, 19 salas padronizadas e painéis de liderança.');

            await guild.roles.fetch();
            await guild.channels.fetch();

            const exportData = {
                guildId: guild.id,
                generatedAt: new Date().toISOString(),
                rolesGerais: {},
                categorias: {},
                orgs: []
            };

            // 1. CARGOS GERAIS
            let fundadorRole = guild.roles.cache.find(r => r.name.includes('Fundador') || r.name.includes('Prefeito'));
            if (!fundadorRole) {
                fundadorRole = await guild.roles.create({
                    name: '👑 Prefeito / Fundador',
                    color: '#FF0000',
                    permissions: [PermissionFlagsBits.Administrator],
                    hoist: true
                });
            }

            let suporteRole = guild.roles.cache.find(r => r.name.includes('SUPORTE') || r.name.includes('Staff'));
            if (!suporteRole) {
                suporteRole = await guild.roles.create({
                    name: '⚡ SUPORTE LEGAL',
                    color: '#00FFFF',
                    hoist: true
                });
            }

            let cidadaoLegalRole = guild.roles.cache.find(r => r.name === '👔 Membro Legal');
            if (!cidadaoLegalRole) {
                cidadaoLegalRole = await guild.roles.create({
                    name: '👔 Membro Legal',
                    color: '#2ECC71',
                    hoist: false
                });
            }

            exportData.rolesGerais.fundador = fundadorRole.id;
            exportData.rolesGerais.suporte = suporteRole.id;
            exportData.rolesGerais.membroLegal = cidadaoLegalRole.id;

            // 2. CATEGORIA GOVERNO / PREFEITURA
            let governoCat = guild.channels.cache.find(c => (c.name.includes('GOVERNO') || c.name.includes('PREFEITURA')) && c.type === ChannelType.GuildCategory);
            if (!governoCat) {
                governoCat = await guild.channels.create({
                    name: '🌐 GOVERNO & PREFEITURA',
                    type: ChannelType.GuildCategory
                });
                await sleep(500);
            }
            exportData.categorias.governo = governoCat.id;

            const govChannels = ['💬・chat-geral', '📢・avisos-legais', '📝・solicitar-set'];
            exportData.canaisGoverno = {};
            for (const chName of govChannels) {
                let ch = guild.channels.cache.find(c => c.name === chName && c.parentId === governoCat.id);
                if (!ch) {
                    ch = await guild.channels.create({
                        name: chName,
                        type: ChannelType.GuildText,
                        parent: governoCat.id
                    });
                    await sleep(400);
                }
                exportData.canaisGoverno[chName] = ch.id;

                // Enviar painel de solicitar set
                if (chName === '📝・solicitar-set') {
                    const msgs = await ch.messages.fetch({ limit: 5 }).catch(() => null);
                    if (!msgs || msgs.size === 0) {
                        const embedSet = new EmbedBuilder()
                            .setTitle('📝 RECRUTAMENTO & SOLICITAÇÃO DE SET')
                            .setDescription('Seja bem-vindo ao servidor Legal!\n\nSe você foi contratado ou deseja solicitar o seu set em uma organização (Polícia, Hospital, Mecânicas, Restaurantes), clique no botão abaixo e informe seu **Passaporte (ID)**.')
                            .setColor('#2ECC71')
                            .setFooter({ text: 'Amazere Roleplay • Sistema Legal' });

                        const rowSet = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('pedir_set_btn_legal')
                                .setLabel('🤝 Solicitar Set')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('📝')
                        );

                        await ch.send({ embeds: [embedSet], components: [rowSet] });
                    }
                }
            }

            let reuniaoGeralGov = guild.channels.cache.find(c => c.name === '🔊・Reunião Geral' && c.parentId === governoCat.id);
            if (!reuniaoGeralGov) {
                reuniaoGeralGov = await guild.channels.create({
                    name: '🔊・Reunião Geral',
                    type: ChannelType.GuildVoice,
                    parent: governoCat.id
                });
                await sleep(400);
            }
            exportData.canaisGoverno['reuniao_geral'] = reuniaoGeralGov.id;

            // 3. CRIAR CADA UMA DAS ORGANIZAÇÕES LEGAIS
            let orgIndex = 0;
            for (const org of LEGAL_ORGS) {
                orgIndex++;
                console.log(`[Setup Legal] Criando org ${orgIndex}/${LEGAL_ORGS.length}: ${org.name}...`);
                await interaction.editReply(`Trabalhando... [Organização ${orgIndex}/${LEGAL_ORGS.length} - ${org.name}]`).catch(() => {});

                const orgData = {
                    id: org.id,
                    name: org.name,
                    emoji: org.emoji,
                    type: org.type,
                    roles: {},
                    channels: {}
                };

                // Cargo Base da Org (ex: 🚓 CORE ou 🏥 Hospital)
                const baseRoleName = `${org.emoji} ${org.name}`;
                let baseRole = guild.roles.cache.find(r => r.name === baseRoleName);
                if (!baseRole) {
                    baseRole = await guild.roles.create({
                        name: baseRoleName,
                        color: org.ranks[0]?.color || '#3498DB',
                        mentionable: true,
                        hoist: true
                    });
                    await sleep(350);
                }
                orgData.roles.base = baseRole.id;

                // Cargos Hierárquicos da Org
                const leadershipRoleIds = []; // Níveis 1 e 2
                for (const rank of org.ranks) {
                    const roleName = `${rank.emoji} ${rank.name} - ${org.name.replace(/^(Polícia|Mecânica|Restaurante)\s+/, '')}`;
                    let role = guild.roles.cache.find(r => r.name === roleName);
                    if (!role) {
                        role = await guild.roles.create({
                            name: roleName,
                            color: rank.color,
                            hoist: rank.level <= 3
                        });
                        await sleep(350);
                    }
                    orgData.roles[`nivel_${rank.level}`] = role.id;
                    if (rank.level <= 2) {
                        leadershipRoleIds.push(role.id);
                    }
                }

                // Categoria da Org
                const catName = `${org.emoji} | ${org.name.toUpperCase()}`;
                let orgCat = guild.channels.cache.find(c => c.name === catName && c.type === ChannelType.GuildCategory);

                const catOverwrites = [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: baseRole.id, allow: [PermissionFlagsBits.ViewChannel] },
                    { id: fundadorRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] },
                    { id: suporteRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] }
                ];

                if (!orgCat) {
                    orgCat = await guild.channels.create({
                        name: catName,
                        type: ChannelType.GuildCategory,
                        permissionOverwrites: catOverwrites
                    });
                    await sleep(400);
                } else {
                    await orgCat.edit({ permissionOverwrites: catOverwrites }).catch(() => {});
                }
                orgData.categoryId = orgCat.id;

                // Criar as 19 Salas Padronizadas
                for (const chDef of STANDARD_CHANNELS) {
                    let ch = guild.channels.cache.find(c => c.name === chDef.name && c.parentId === orgCat.id);
                    const isVoice = chDef.type === 'voice';

                    const chOverwrites = [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: baseRole.id, allow: [PermissionFlagsBits.ViewChannel] },
                        { id: fundadorRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] },
                        { id: suporteRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] }
                    ];

                    // Se for sala exclusiva de liderança (Cargos 1 e 2)
                    if (chDef.leadershipOnly) {
                        chOverwrites.push({ id: baseRole.id, deny: [PermissionFlagsBits.ViewChannel] });
                        for (const lId of leadershipRoleIds) {
                            chOverwrites.push({ id: lId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] });
                        }
                    }

                    if (!ch) {
                        ch = await guild.channels.create({
                            name: chDef.name,
                            type: isVoice ? ChannelType.GuildVoice : ChannelType.GuildText,
                            parent: orgCat.id,
                            permissionOverwrites: chOverwrites
                        });
                        await sleep(350);
                    } else {
                        await ch.edit({ permissionOverwrites: chOverwrites }).catch(() => {});
                    }
                    orgData.channels[chDef.name] = ch.id;

                    // Painel de Gerenciar Membros
                    if (chDef.name === '👥・gerenciar-membros') {
                        const msgs = await ch.messages.fetch({ limit: 5 }).catch(() => null);
                        if (!msgs || msgs.size === 0) {
                            const embedManage = new EmbedBuilder()
                                .setTitle(`👥 PAINEL DE GERENCIAMENTO — ${org.name.toUpperCase()}`)
                                .setDescription('Selecione um membro da organização abaixo para alterar seu cargo ou expulsá-lo.\n\n*Apenas Líderes e Sub-Líderes possuem permissão para utilizar este painel.*')
                                .setColor('#3498DB')
                                .setFooter({ text: 'Amazere Roleplay • Gestão de Membros' });

                            const userSelect = new UserSelectMenuBuilder()
                                .setCustomId(`manage_user_legal_${org.id}`)
                                .setPlaceholder('Selecione o membro para gerenciar...');

                            const rowManage = new ActionRowBuilder().addComponents(userSelect);
                            await ch.send({ embeds: [embedManage], components: [rowManage] });
                        }
                    }
                }

                exportData.orgs.push(orgData);
            }

            // 4. SALVAR E EXPORTAR ARQUIVO DE IDs
            const exportConfigPath = path.join(__dirname, '../utils/generated_ids.json');
            fs.writeFileSync(exportConfigPath, JSON.stringify(exportData, null, 2));

            let envContent = `# === CARGOS GLOBAIS (LEGAL) ===\n`;
            envContent += `GUILD_ID=${guild.id}\n`;
            envContent += `ROLE_STAFF_LEGAL_ID=${exportData.globalRoles['Staff'] || ''}\n`;
            envContent += `ROLE_SUPORTE_LEGAL_ID=${exportData.globalRoles['Suporte'] || ''}\n`;
            envContent += `ROLE_JUIZ_ID=${exportData.globalRoles['Juiz'] || ''}\n\n`;

            envContent += `# === TAGS BASE DAS ORGANIZAÇÕES LEGAIS (USADO NA BRIDGE FIVEM) ===\n`;
            for (const org of exportData.orgs) {
                const cleanKey = org.id.toUpperCase().replace(/[^A-Z0-9]/g, '_');
                envContent += `ROLE_ORG_${cleanKey}_BASE_ID=${org.roles.base || ''}\n`;
            }

            const attachmentJson = new AttachmentBuilder(Buffer.from(JSON.stringify(exportData, null, 2)), { name: 'legal_ids.json' });
            const attachmentEnv = new AttachmentBuilder(Buffer.from(envContent, 'utf8'), { name: 'copiar_para_env_legal.txt' });

            await interaction.editReply({
                content: `✅ **Setup do Servidor Legal concluído com sucesso!**\nTodas as ${LEGAL_ORGS.length} organizações foram criadas com hierarquias, 19 salas padronizadas, isolamento por cargo e painéis de gestão.\n\n📄 **Baixe o arquivo \`copiar_para_env_legal.txt\` para colar diretamente no seu \`.env\` do Easypanel:**`,
                files: [attachmentEnv, attachmentJson]
            });

        } catch (error) {
            console.error('[Setup Legal] Erro crítico:', error);
            await interaction.editReply({ content: `❌ Erro no setup legal: ${error.message}` });
        }
    }
};
