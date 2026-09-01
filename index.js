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
            "SELECT id FROM accounts WHERE discord = ? OR discord = ? LIMIT 1",
            [discordId, `discord:${discordId}`]
        );

        if (!accountRows || accountRows.length === 0) return;

        const userId = accountRows[0].id;
        let playerName = member.user.username;

        try {
            const [charRows] = await dbPool.query("SELECT name, name2 FROM characters WHERE id = ? LIMIT 1", [userId]);
            if (charRows && charRows.length > 0) {
                playerName = `${charRows[0].name || ''} ${charRows[0].name2 || ''}`.trim();
            }
        } catch (e) {}

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

// ============================================================
// SERVIDOR HTTP INTERNO PARA SINCRONIZAÇÃO EM TEMPO REAL
// ============================================================
const http = require('http');

const syncServer = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/bridge/sync-member') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body || '{}');
                const { discordId, playerName, setagens } = data;

                if (!discordId) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'discordId is required' }));
                }

                console.log(`[Bot Legal] 📥 Sincronização recebida para Discord: ${discordId}`);

                for (const guild of client.guilds.cache.values()) {
                    const member = await guild.members.fetch(discordId).catch(() => null);
                    if (!member) continue;

                    if (setagens && Array.isArray(setagens)) {
                        let legalConfig = null;
                        const genPath = path.join(__dirname, 'utils/generated_ids.json');
                        if (fs.existsSync(genPath)) {
                            try { legalConfig = JSON.parse(fs.readFileSync(genPath, 'utf8')); } catch (e) {}
                        }

                        for (const s of setagens) {
                            if (s.tipo && s.tipo.toLowerCase() === 'ilegal') continue;
                            const emp = (s.emprego || '').toLowerCase().trim().replace(/[\s_\-]+/g, '');
                            const level = parseInt(s.permissao) || 1;

                            // 1. Busca organização por ID na config
                            let org = null;
                            if (legalConfig && legalConfig.orgs) {
                                org = legalConfig.orgs.find(o => o.id.replace(/[\s_\-]+/g, '') === emp || o.name.toLowerCase().replace(/[\s_\-]+/g, '').includes(emp));
                            }
                            if (!org) {
                                org = LEGAL_ORGS.find(o => o.id.replace(/[\s_\-]+/g, '') === emp || o.name.toLowerCase().replace(/[\s_\-]+/g, '').includes(emp));
                            }
                            if (!org) continue;

                            // 2. Cargo Base por ID
                            const baseRoleId = org.roles?.base || process.env[`ROLE_ORG_${org.id.toUpperCase()}_BASE_ID`];
                            if (baseRoleId && guild.roles.cache.has(baseRoleId)) {
                                await member.roles.add(baseRoleId).catch(err => console.warn(`[Bot Legal] Erro cargo base ${baseRoleId}:`, err.message));
                                console.log(`[Bot Legal] ✅ [ID: ${baseRoleId}] Cargo Base (${org.name}) adicionado para ${member.user.tag}`);
                            }

                            // 3. Cargo Hierárquico por ID
                            const rankRoleId = org.roles?.[`nivel_${level}`] || org.roles?.nivel_1;
                            if (rankRoleId && guild.roles.cache.has(rankRoleId)) {
                                await member.roles.add(rankRoleId).catch(err => console.warn(`[Bot Legal] Erro cargo hierarquia ${rankRoleId}:`, err.message));
                                console.log(`[Bot Legal] ✅ [ID: ${rankRoleId}] Cargo Hierarquia Nível ${level} adicionado para ${member.user.tag}`);
                            }

                            // 4. Formata Apelido
                            const rankDef = (org.ranks && org.ranks.find(r => r.level === level)) || (org.ranks && org.ranks[0]) || { name: 'Membro' };
                            const cleanOrgName = org.name.replace(/^(Polícia|Mecânica|Restaurante)\s+/, '');
                            const finalNick = `[${cleanOrgName} | ${rankDef.name}] ${playerName || member.user.username}`;
                            await member.setNickname(finalNick.substring(0, 32)).catch(() => {});
                        }
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, message: 'Legal sincronizado' }));
            } catch (err) {
                console.error('[Bot Legal] Erro no sync HTTP:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

const HTTP_PORT = process.env.HTTP_PORT || 3002;
syncServer.listen(HTTP_PORT, () => {
    console.log(`[Bot Legal] Servidor de Sincronização HTTP rodando na porta ${HTTP_PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
