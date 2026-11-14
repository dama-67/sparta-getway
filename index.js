const express = require('express')
const { Telegraf, Markup } = require('telegraf')
const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')

// سيرفر وهمي عشان Render يفضل Live
const app = express()
app.get('/', (req,res)=> res.send('SPARTA V7 LIVE 👑 - BOT IS RUNNING'))
app.listen(process.env.PORT || 3000)

const BOT_TOKEN = process.env.BOT_TOKEN
const bot = new Telegraf(BOT_TOKEN)
let waSock = null

const CHANNEL_LINK = "https://whatsapp.com/channel/0029VbDwdAaG3R3j1bt1903S"
const DEV_LINK = "https://t.me/DAMA_4"

const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('اتصال 🔗', 'connect'), Markup.button.callback('فصل 🗑️', 'disconnect')],
  [Markup.button.callback('الحالة 📊', 'status'), Markup.button.callback('إعادة الاتصال ♻️', 'reconnect')],
  [Markup.button.callback('الإعدادات ⚙️', 'settings')],
  [Markup.button.callback('المطور 👑', 'dev'), Markup.button.callback('القناة 📢', 'channel')]
])

async function startWA(phone, ctx){
  const { state, saveCreds } = await useMultiFileAuthState('./auth_sparta')
  waSock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({level:'silent'})) },
    logger: P({level:'silent'}),
    browser: ["Ubuntu","Chrome","20.0.04"],
    printQRInTerminal: false
  })
  waSock.ev.on('creds.update', saveCreds)
  waSock.ev.on('connection.update', (u)=>{
    if(u.connection === 'open'){
      ctx.replyWithMarkdown(`
✦ *بوابة SPARTA للواتساب* 🐍 ✦
━━━━━━━━━━━━━━━━

✅ *تم الاتصال بنجاح*

تم ربط جلسة واتساب الخاصة بك بنجاح.

📱📱 رقم الهاتف:
${phone}

🔗🔗 حالة الجلسة:
*متصل*

يمكنك الآن استخدام SPARTA بشكل طبيعي.

⚡ *SPARTA*`,
      Markup.inlineKeyboard([
        [Markup.button.url('المطور 👑', DEV_LINK)],
        [Markup.button.url('القناة 📢', CHANNEL_LINK)]
      ])
      )
    }
  })
  await new Promise(r=>setTimeout(r,1500))
  const custom = "SPAR-TA" + Math.floor(Math.random()*90+10)
  const code = await waSock.requestPairingCode(phone, custom)
  return code
}

bot.start((ctx)=> ctx.replyWithMarkdown(`
╔═══════════════════╗
🐍 *SPARTA V7 GATEWAY* 🐍
╚═══════════════════╝
`, mainMenu))

// هنا التعديل اللي طلبته زي صورة MEDUSA
bot.action('connect', async (ctx)=>{
  await ctx.replyWithMarkdown(`
📱 *SPARTA CONNECT*

أرسل رقم واتساب بهذا الشكل:

\`201xxxxxxxxx\`

سيتم إنشاء رمز Pairing Code بعد ذلك.
`)
})

bot.on('text', async (ctx)=>{
  const phone = ctx.message.text.replace(/[^0-9]/g,'')
  if(phone.length < 10 || phone.length > 15) return
  try{
    await ctx.reply(`⏳ جاري توليد كود لـ ${phone} ...`)
    const code = await startWA(phone, ctx)
    const formatted = code.slice(0,4)+'-'+code.slice(4)
    await ctx.replyWithMarkdown(`📲 كودك: *${formatted}*\n\nاذهب الى واتساب > الاجهزة المرتبطة > ربط برقم الهاتف\n\nLogging in...`, 
    Markup.inlineKeyboard([[Markup.button.callback(`📋 نسخ الرمز ${formatted}`, `copy`)]]))
  }catch(e){ ctx.reply('❌ خطأ: '+e.message) }
})

bot.action('disconnect', async (ctx)=>{
  if(fs.existsSync('./auth_sparta')) fs.rmSync('./auth_sparta',{recursive:true,force:true})
  ctx.reply('🗑️ تم فصل SPARTA', mainMenu)
})

bot.action('status', (ctx)=>{
  const ok = fs.existsSync('./auth_sparta/creds.json')
  ctx.reply(ok ? '🟢 SPARTA متصل ✅' : '🔴 غير متصل', mainMenu)
})

bot.action('reconnect', (ctx)=> ctx.reply('♻️ ابعت رقمك تاني للربط'))
bot.action('settings', (ctx)=> ctx.reply('⚙️ الاعدادات قريبا'))
bot.action('dev', (ctx)=> ctx.replyWithMarkdown(`👑 المطور:\n${DEV_LINK}`, Markup.inlineKeyboard([[Markup.button.url('المطور 👑', DEV_LINK)]])))
bot.action('channel', (ctx)=> ctx.replyWithMarkdown(`📢 القناة:\n${CHANNEL_LINK}`, Markup.inlineKeyboard([[Markup.button.url('القناة 📢', CHANNEL_LINK)]])))

bot.launch().then(()=> console.log('SPARTA GATEWAY LIVE'))
