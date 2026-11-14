const { Telegraf, Markup } = require('telegraf')
const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')

const BOT_TOKEN = process.env.BOT_TOKEN
const bot = new Telegraf(BOT_TOKEN)
let waSock = null

const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('اتصال 🔗', 'connect'), Markup.button.callback('فصل 🗑️', 'disconnect')],
  [Markup.button.callback('الحالة 📊', 'status'), Markup.button.callback('إعادة الاتصال ♻️', 'reconnect')],
  [Markup.button.callback('الإعدادات ⚙️', 'settings')],
  [Markup.button.callback('المطور 👑', 'dev'), Markup.button.callback('القناة 📢', 'channel')]
])

async function startWA(phone, ctx){
  const { state, saveCreds } = await useMultiFileAuthState('./auth_sparta')
  const sock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({level:'silent'})) },
    logger: P({level:'silent'}),
    browser: ["Ubuntu","Chrome","20.0.04"],
    printQRInTerminal: false
  })
  waSock = sock
  sock.ev.on('creds.update', saveCreds)
  await new Promise(r=>setTimeout(r,1200))
  const custom = "SPAR-TA" + Math.floor(Math.random()*90+10)
  const code = await sock.requestPairingCode(phone, custom)
  return code
}

bot.start((ctx)=> ctx.replyWithMarkdown(`
╔═══════════════════╗
🐍 *SPARTA V7 GATEWAY* 🐍
╚═══════════════════╝

✨ مرحبا يا ملك ✨
اختر من القائمة
`, mainMenu))

bot.action('connect', (ctx)=>{
  ctx.reply('📱 ابعت رقم واتساب مع كود البلد:\nمثال: 201102915995')
})

bot.on('text', async (ctx)=>{
  const phone = ctx.message.text.replace(/[^0-9]/g,'')
  if(phone.length < 10 || phone.length > 15) return
  try{
    const m = await ctx.reply(`⏳ جاري توليد كود لـ ${phone} ...`)
    const code = await startWA(phone, ctx)
    const formatted = code.slice(0,4)+'-'+code.slice(4)
    await ctx.reply(`📲 كودك: *${formatted}*\n\nTo get your code: Go to WhatsApp > Linked devices > Link with phone number\n\nLogging in...`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback(`📋 نسخ الرمز ${formatted}`, `copy`)]])})
  }catch(e){ ctx.reply('❌ خطأ: '+e.message) }
})

bot.action('disconnect', async (ctx)=>{
  if(fs.existsSync('./auth_sparta')) fs.rmSync('./auth_sparta',{recursive:true,force:true})
  ctx.reply('🗑️ تم فصل SPARTA')
})

bot.action('status', (ctx)=>{
  const ok = fs.existsSync('./auth_sparta/creds.json')
  ctx.reply(ok ? '🟢 SPARTA متصل' : '🔴 غير متصل', mainMenu)
})

bot.launch()
