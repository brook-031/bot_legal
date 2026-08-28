require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { LEGAL_ORGS } = require('./utils/config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
}

// Conexão MySQL para auto-reconhecimento
let dbPool = null;
if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_DATABASE) {
    try {
        dbPool = mysql.createPool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        console.log('[MySQL Legal] Conexão com banco de dados configurada com sucesso.');
    } catch (e) {
        console.error('[MySQL Legal] Erro ao criar pool MySQL:', e.message);
    }
}

function getStoredConfig() {
    try {
        const p = path.join(__dirname, 'utils/generated_ids.json');
        if (fs.existsSync(p)) {
            return JSON.parse(fs.readFileSync(p, 'utf8'));
        }
    } catch (e) { }
    return null;
}

client.once('ready', () => {
    console.log(`[Bot Legal] Logado como ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    (async () => {
        try {
            console.log('[Bot Legal] Registrando comandos de aplicação...');
            if (process.env.CLIENT_ID && process.env.GUILD_ID) {
                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                    { body: commands },
                );
                console.log(`[Bot Legal] ${commands.length} comandos (/) registrados na Guild com sucesso!`);
            } else if (process.env.CLIENT_ID) {
                await rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID),
                    { body: commands },
                );
                console.log(`[Bot Legal] ${commands.length} comandos (/) registrados globalmente com sucesso!`);
            }
        } catch (error) {
            console.error('[Bot Legal] Erro ao registrar comandos:', error);
        }
    })();
});

// Auto-Reconhecimento de Jogadores ao Entrar no Discord Legal
client.on('guildMemberAdd', async member => {
    if (!dbPool) return;

    try {
        const discordId = member.id;
        // 1. Busca o passaporte na tabela accounts
        const [accountRows] = await dbPool.query(
            "SELECT id, name, name2 FROM accounts WHERE discord = ? OR discord = ? LIMIT 1",
            [discordId, `discord:${discordId}`]
        );

        if (!accountRows || accountRows.length === 0) return;

        const userId = accountRows[0].id;
        const playerName = `${accountRows[0].name || ''} ${accountRows[0].name2 || ''}`.trim();

        // 2. Busca setagem na tabela wnGroups_Setagens
        const [setagemRows] = await dbPool.query(
            "SELECT emprego, cargo, permissao FROM wnGroups_Setagens WHERE user_id = ? AND tipo = 'Legal' LIMIT 1",
            [userId]
        );

        if (!setagemRows || setagemRows.length === 0) return;

        const setagem = setagemRows[0];
        const orgId = setagem.emprego?.toLowerCase();
        const level = parseInt(setagem.permissao) || 1;

        const org = LEGAL_ORGS.find(o => o.id === orgId || o.name.toLowerCase().includes(orgId));
        if (!org) return;

        const storedConfig = getStoredConfig();
        const orgData = storedConfig?.orgs?.find(o => o.id === org.id);

        if (orgData) {
            // Entrega cargo base + cargo de hierarquia
            if (orgData.roles.base) await member.roles.add(orgData.roles.base).catch(() => {});
            const targetRoleId = orgData.roles[`nivel_${level}`];
            if (targetRoleId) await member.roles.add(targetRoleId).catch(() => {});

            // Formata apelido
            const rankDef = org.ranks.find(r => r.level === level) || org.ranks[0];
            const cleanOrgName = org.name.replace(/^(Polícia|Mecânica|Restaurante)\s+/, '');
            const finalNick = `[${cleanOrgName} | ${rankDef.name}] ${playerName || member.user.username}`;
            await member.setNickname(finalNick.substring(0, 32)).catch(() => {});

            console.log(`[Bot Legal] Auto-reconhecimento: ${member.user.tag} vinculado a ${org.name} (${rankDef.name})`);
        }
    } catch (e) {
        console.error('[Bot Legal] Erro no auto-reconhecimento em guildMemberAdd:', e.message);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true });
            }
        }
    } else if (interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) {
        const handlerPath = path.join(__dirname, 'handlers', 'interactionHandler.js');
        if (fs.existsSync(handlerPath)) {
            require(handlerPath)(interaction, client);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
