const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    MessageFlags
} = require('discord.js');
const { LEGAL_ORGS } = require('../utils/config');
const fs = require('fs');
const path = require('path');

function getStoredConfig() {
    try {
        const p = path.join(__dirname, '../utils/generated_ids.json');
        if (fs.existsSync(p)) {
            return JSON.parse(fs.readFileSync(p, 'utf8'));
        }
    } catch (e) { }
    return null;
}

module.exports = async (interaction, client) => {
    try {
        const storedConfig = getStoredConfig();

        // 1. INTERAÇÕES DE BOTÃO
        if (interaction.isButton()) {
            // Solicitar Set - Botão público
            if (interaction.customId === 'pedir_set_btn_legal') {
                const options = LEGAL_ORGS.slice(0, 25).map(org =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(org.name)
                        .setValue(org.id)
                        .setEmoji(org.emoji)
                );

                const select = new StringSelectMenuBuilder()
                    .setCustomId('select_org_recrutamento_legal')
                    .setPlaceholder('Selecione a Organização...')
                    .addOptions(options);

                const row = new ActionRowBuilder().addComponents(select);
                return await interaction.reply({ content: 'Escolha a organização desejada:', components: [row], flags: [MessageFlags.Ephemeral] });
            }

            // Aprovar Solicitação de Set
            if (interaction.customId.startsWith('approve_set_legal_')) {
                const data = interaction.customId.replace('approve_set_legal_', '').split('_');
                const targetUserId = data[0];
                const orgId = data[1];
                const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);
                const org = LEGAL_ORGS.find(o => o.id === orgId);

                if (!member || !org) {
                    return interaction.update({ content: '❌ Erro ao localizar membro ou organização.', components: [] });
                }

                // Localiza os cargos
                let orgData = storedConfig?.orgs?.find(o => o.id === orgId);
                let baseRole = orgData ? interaction.guild.roles.cache.get(orgData.roles.base) : interaction.guild.roles.cache.find(r => r.name.includes(org.name) && !r.name.includes('-'));
                let lowestRankLevel = org.ranks[org.ranks.length - 1].level;
                let recruitRole = orgData ? interaction.guild.roles.cache.get(orgData.roles[`nivel_${lowestRankLevel}`]) : interaction.guild.roles.cache.find(r => r.name.includes(org.ranks[org.ranks.length - 1].name));

                if (baseRole) await member.roles.add(baseRole).catch(() => {});
                if (recruitRole) await member.roles.add(recruitRole).catch(() => {});

                // Atualizar apelido se fornecido
                const embedFields = interaction.message.embeds[0]?.fields || [];
                const nomeField = embedFields.find(f => f.name.includes('Nome'))?.value;
                if (nomeField) {
                    const lowestRankName = org.ranks[org.ranks.length - 1].name;
                    await member.setNickname(`[${org.name.replace(/^(Polícia|Mecânica|Restaurante)\s+/, '')} | ${lowestRankName}] ${nomeField}`).catch(() => {});
                }

                const logEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                    .setColor('#2ECC71')
                    .setTitle(`✅ SOLICITAÇÃO APROVADA — ${org.name.toUpperCase()}`)
                    .addFields({ name: 'Aprovado por', value: `<@${interaction.user.id}>` });

                return await interaction.update({ content: `✅ <@${targetUserId}> foi aprovado em **${org.name}**!`, embeds: [logEmbed], components: [] });
            }

            // Recusar Solicitação de Set
            if (interaction.customId.startsWith('deny_set_legal_')) {
                const data = interaction.customId.replace('deny_set_legal_', '').split('_');
                const targetUserId = data[0];
                const orgId = data[1];
                const org = LEGAL_ORGS.find(o => o.id === orgId);

                const logEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                    .setColor('#E74C3C')
                    .setTitle(`❌ SOLICITAÇÃO RECUSADA — ${org ? org.name.toUpperCase() : 'LEGAL'}`)
                    .addFields({ name: 'Recusado por', value: `<@${interaction.user.id}>` });

                return await interaction.update({ content: `❌ Solicitação de <@${targetUserId}> foi recusada.`, embeds: [logEmbed], components: [] });
            }
        }

        // 2. INTERAÇÕES DE SELECT MENU
        if (interaction.isStringSelectMenu()) {
            // Selecionou a Org no Recrutamento -> Abre Modal
            if (interaction.customId === 'select_org_recrutamento_legal') {
                const orgId = interaction.values[0];
                const org = LEGAL_ORGS.find(o => o.id === orgId);
                if (!org) return interaction.reply({ content: 'Organização não encontrada.', flags: [MessageFlags.Ephemeral] });

                const modal = new ModalBuilder()
                    .setCustomId(`modal_set_legal_${orgId}`)
                    .setTitle(`Recrutamento: ${org.name.substring(0, 25)}`);

                const nameInput = new TextInputBuilder()
                    .setCustomId('nome_jogo')
                    .setLabel('NOME COMPLETO IN-GAME')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: Bruno Silva')
                    .setRequired(true);

                const idInput = new TextInputBuilder()
                    .setCustomId('id_jogo')
                    .setLabel('PASSAPORTE (ID DO JOGO)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 1234')
                    .setRequired(true)
                    .setMaxLength(10);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(nameInput),
                    new ActionRowBuilder().addComponents(idInput)
                );

                return await interaction.showModal(modal);
            }

            // Gerenciamento de Cargo Selecionado (Painel Liderança)
            if (interaction.customId.startsWith('manage_role_legal_')) {
                const data = interaction.customId.replace('manage_role_legal_', '').split('_');
                const targetUserId = data[0];
                const orgId = data[1];
                const selectedLevel = interaction.values[0];
                const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);
                const org = LEGAL_ORGS.find(o => o.id === orgId);

                if (!member || !org) return interaction.update({ content: '❌ Erro ao localizar membro ou organização.', components: [] });

                const orgData = storedConfig?.orgs?.find(o => o.id === orgId);

                if (selectedLevel === 'expulsar') {
                    // Remover todos os cargos da organização
                    if (orgData) {
                        const allRoleIds = Object.values(orgData.roles);
                        await member.roles.remove(allRoleIds).catch(() => {});
                    } else {
                        const rolesToRemove = member.roles.cache.filter(r => r.name.includes(org.name));
                        await member.roles.remove(rolesToRemove).catch(() => {});
                    }
                    await member.setNickname(null).catch(() => {});
                    return await interaction.update({ content: `✅ <@${targetUserId}> foi **expulso** de **${org.name}** e todos os seus cargos foram removidos.`, components: [] });
                } else {
                    const levelNum = parseInt(selectedLevel);
                    const rankDef = org.ranks.find(r => r.level === levelNum);

                    if (orgData) {
                        // Remove apenas os cargos de hierarquia da org, mantém o cargo base
                        const hierarchyRoleIds = Object.entries(orgData.roles)
                            .filter(([key]) => key !== 'base')
                            .map(([, id]) => id);

                        await member.roles.remove(hierarchyRoleIds).catch(() => {});
                        await member.roles.add(orgData.roles.base).catch(() => {});
                        const targetRoleId = orgData.roles[`nivel_${levelNum}`];
                        if (targetRoleId) await member.roles.add(targetRoleId).catch(() => {});
                    }

                    // Atualiza apelido com o novo cargo
                    const currentNick = member.displayName.replace(/^\[.*?\]\s*/, '');
                    if (rankDef) {
                        const cleanOrgName = org.name.replace(/^(Polícia|Mecânica|Restaurante)\s+/, '');
                        await member.setNickname(`[${cleanOrgName} | ${rankDef.name}] ${currentNick}`).catch(() => {});
                    }

                    return await interaction.update({ content: `✅ O cargo de <@${targetUserId}> foi alterado para **${rankDef?.name || selectedLevel}** em **${org.name}**!`, components: [] });
                }
            }
        }

        // 3. SELEÇÃO DE USUÁRIO (UserSelectMenu no canal gerenciar-membros)
        if (interaction.isUserSelectMenu()) {
            if (interaction.customId.startsWith('manage_user_legal_')) {
                const orgId = interaction.customId.replace('manage_user_legal_', '');
                const targetUser = interaction.users.first();
                const org = LEGAL_ORGS.find(o => o.id === orgId);

                if (!targetUser || !org) {
                    return interaction.reply({ content: '❌ Erro ao carregar organização ou usuário.', flags: [MessageFlags.Ephemeral] });
                }

                // Montar opções de hierarquia daquela org + opção de expulsar
                const options = org.ranks.map(r =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`${r.emoji} ${r.name}`)
                        .setValue(r.level.toString())
                );
                options.push(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('❌ Expulsar da Organização')
                        .setValue('expulsar')
                        .setDescription('Remove todos os cargos e desvincula o membro')
                );

                const selectRole = new StringSelectMenuBuilder()
                    .setCustomId(`manage_role_legal_${targetUser.id}_${orgId}`)
                    .setPlaceholder('Escolha o novo cargo ou expulsão...')
                    .addOptions(options);

                const row = new ActionRowBuilder().addComponents(selectRole);

                return await interaction.reply({
                    content: `Gerenciando **${targetUser.username}** em **${org.name}**:\n*Selecione a ação desejada abaixo:*`,
                    components: [row],
                    flags: [MessageFlags.Ephemeral]
                });
            }
        }

        // 4. SUBMISSÃO DE MODAL
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('modal_set_legal_')) {
                const orgId = interaction.customId.replace('modal_set_legal_', '');
                const org = LEGAL_ORGS.find(o => o.id === orgId);
                const nome = interaction.fields.getTextInputValue('nome_jogo');
                const passaporte = interaction.fields.getTextInputValue('id_jogo');

                if (!org) return interaction.reply({ content: 'Organização não encontrada.', flags: [MessageFlags.Ephemeral] });

                // Localiza o canal 🤝・contratar daquela org
                const orgData = storedConfig?.orgs?.find(o => o.id === orgId);
                let hiringChannel = orgData ? interaction.guild.channels.cache.get(orgData.channels['🤝・contratar']) : interaction.guild.channels.cache.find(c => c.name === '🤝・contratar' && c.parent?.name.includes(org.name));

                if (!hiringChannel) {
                    return interaction.reply({ content: `❌ Canal de contratação de **${org.name}** não encontrado. Peça para um administrador rodar \`/setup-legal\`.`, flags: [MessageFlags.Ephemeral] });
                }

                const embed = new EmbedBuilder()
                    .setTitle(`📥 NOVA SOLICITAÇÃO DE SET — ${org.name.toUpperCase()}`)
                    .setColor('#3498DB')
                    .addFields(
                        { name: 'Candidato (Discord)', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                        { name: 'Nome In-Game', value: nome, inline: true },
                        { name: 'Passaporte (ID)', value: passaporte, inline: true }
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: 'Apenas Líderes e Sub-Líderes devem aprovar/recusar' });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`approve_set_legal_${interaction.user.id}_${orgId}`)
                        .setLabel('Aprovar Recrutamento')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId(`deny_set_legal_${interaction.user.id}_${orgId}`)
                        .setLabel('Recusar')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('❌')
                );

                await hiringChannel.send({ embeds: [embed], components: [row] });
                return await interaction.reply({ content: `✅ Sua solicitação foi enviada para a liderança de **${org.name}**! Aguarde a análise.`, flags: [MessageFlags.Ephemeral] });
            }
        }

    } catch (error) {
        console.error('[InteractionHandler Legal] Erro:', error);
    }
};
