const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (botToken === undefined) {
    throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
}

export default {
    botToken,
};
