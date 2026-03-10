const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { ORGS } = require('../utils/config');

module.exports = async (interaction, client) => {
    if (interaction.isButton()) {
        const [action, ...params] = interaction.customId.split('_');

        // --- Role Application Logic ---
        if (action === 'apply') {
            const orgId = params[0];
            const org = ORGS.find(o => o.id === orgId);

            const modal = new ModalBuilder()
                .setCustomId(`modal_apply_${orgId}`)
                .setTitle(`Inscrição - ${org.name}`);

            const nameInput = new TextInputBuilder()
                .setCustomId('ingame_name')
                .setLabel('Nome In-Game')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: João Silva')
                .setRequired(true);

            const idInput = new TextInputBuilder()
                .setCustomId('ingame_id')
                .setLabel('ID do Personagem')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 1234')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(idInput)
            );

            await interaction.showModal(modal);
        }

        if (action === 'approve' || action === 'reject') {
            const userId = params[0];
            const orgId = params[1];
            const member = await interaction.guild.members.fetch(userId);
            const org = ORGS.find(o => o.id === orgId);

            if (action === 'approve') {
                const legalRole = interaction.guild.roles.cache.find(r => r.name.includes('Membro Legal'));
                const orgRole = interaction.guild.roles.cache.find(r => r.name.includes(org.name));
                const recrutaRole = interaction.guild.roles.cache.find(r => r.name.includes('Recruta'));

                if (legalRole) await member.roles.add(legalRole);
                if (orgRole) await member.roles.add(orgRole);
                if (recrutaRole) await member.roles.add(recrutaRole);

                await interaction.reply({ content: `✅ Candidato ${member.user.tag} aprovado para ${org.name}!`, ephemeral: false });
                await interaction.message.delete();
            } else {
                await interaction.reply({ content: `❌ Candidato ${member.user.tag} recusado para ${org.name}.`, ephemeral: true });
                await interaction.message.delete();
            }
        }

        // --- Ticket Logic ---
        if (action === 'ticket') {
            const ticketAction = params[0];

            if (ticketAction === 'open') {
                const channelName = `ticket-${interaction.user.username}`.toLowerCase();
                const existingTicket = interaction.guild.channels.cache.find(c => c.name === channelName);

                if (existingTicket) {
                    return interaction.reply({ content: `Você já possui um ticket aberto: ${existingTicket}`, ephemeral: true });
                }

                const category = interaction.guild.channels.cache.find(c => c.name.includes('TICKETS') && c.type === 4);
                const roleSuporte = interaction.guild.roles.cache.find(r => r.name.includes('Suporte'));
                const rolePrefeitura = interaction.guild.roles.cache.find(r => r.name.includes('Prefeitura'));

                const ticketChannel = await interaction.guild.channels.create({
                    name: channelName,
                    type: 0, // GuildText
                    parent: category ? category.id : null,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: ['ViewChannel'] },
                        { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] },
                        { id: roleSuporte?.id || interaction.guild.ownerId, allow: ['ViewChannel', 'SendMessages'] },
                        { id: rolePrefeitura?.id || interaction.guild.ownerId, allow: ['ViewChannel', 'SendMessages'] }
                    ]
                });

                const ticketEmbed = new EmbedBuilder()
                    .setTitle('🎫 Ticket Aberto')
                    .setDescription(`Olá ${interaction.user}, aguarde um momento que o **Suporte** ou a **Prefeitura** irá te atender.\n\nClique no botão abaixo para fechar o ticket.`)
                    .setColor(0x00FF00)
                    .setTimestamp();

                const ticketRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_close')
                        .setLabel('Fechar Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

                await ticketChannel.send({ content: `<@&${roleSuporte?.id}> <@&${rolePrefeitura?.id}>`, embeds: [ticketEmbed], components: [ticketRow] });
                await interaction.reply({ content: `Seu ticket foi criado em ${ticketChannel}`, ephemeral: true });
            }

            if (ticketAction === 'close') {
                const logChannel = interaction.guild.channels.cache.find(c => c.name === '📑-log-ticket');

                if (logChannel) {
                    await logChannel.send({ content: `Ticket de **${interaction.channel.name}** fechado por **${interaction.user.tag}**.` });
                }

                await interaction.reply('Fechando ticket em 5 segundos...');
                setTimeout(() => interaction.channel.delete().catch(() => { }), 5000);
            }
        }
    }


    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('modal_apply_')) {
            const orgId = interaction.customId.split('_')[2];
            const org = ORGS.find(o => o.id === orgId);
            const name = interaction.fields.getTextInputValue('ingame_name');
            const id = interaction.fields.getTextInputValue('ingame_id');

            // Find the hiring channel for this org (logic to find channel by name or ID stored in DB/JSON)
            const hiringChannel = interaction.guild.channels.cache.find(c => c.name === `🤝-contratar` && c.parent.name.includes(org.name));

            if (!hiringChannel) {
                return interaction.reply({ content: 'Erro: Canal de contratação não encontrado.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(`Nova Solicitação: ${org.name}`)
                .setColor(0x00FF00)
                .addFields(
                    { name: 'Candidato', value: `${interaction.user}`, inline: true },
                    { name: 'Nome In-Game', value: name, inline: true },
                    { name: 'ID', value: id, inline: true }
                )
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`approve_${interaction.user.id}_${orgId}`)
                    .setLabel('Aprovar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`reject_${interaction.user.id}_${orgId}`)
                    .setLabel('Recusar')
                    .setStyle(ButtonStyle.Danger)
            );

            await hiringChannel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: 'Sua solicitação foi enviada aos responsáveis!', ephemeral: true });
        }
    }

    // Ticket handling will be added here
};
