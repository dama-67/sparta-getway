const express = require('express')
const { Telegraf, Markup } = require('telegraf')
const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')

// Web Server عشان Render يفضل Live
const app = express()
app.get('/', (req,res)=> res.send('SPARTA V7 LIVE 👑 - BOT IS RUNNING'))
app.listen(process.env.PORT || 3000, ()=> console.log('Web Live'))

const bot = new Telegraf(process.env.BOT_TOKEN)
const CHANNEL_LINK = "https://whatsapp.com/channel/0029VbDwdAaG3R3j1bt1903S"
const DEV_LINK = "https://t.me/DAMA_4"

const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('اتصال 🔗', 'connect'), Markup.button.callback('فصل 🗑️', 'disconnect')],
  [Markup.button.callback('الحالة 📊', 'status'), Markup.button.callback('إعادة الاتصال ♻️', 'reconnect')],
  [Markup.button.callback('الإعدادات ⚙️', 'settings')],
  [Markup.button.callback('المطور 👑', 'dev'), Markup.button.callback('القناة 📢', 'channel')]
])

async function getCode(phone, ctx){
  if(fs.existsSync('./auth_sparta')) fs.rmSync('./auth_sparta',{recursive:true,force:true})
  const { state, saveCreds } = await useMultiFileAuthState('./auth_sparta')
  const sock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({level:'silent'})) },
    logger: P({level:'silent'}),
    browser: ["Ubuntu","Chrome","20.0.04"],
    printQRInTerminal: false,
    syncFullHistory: false
  })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', (u)=>{
    if(u.connection === 'open'){
      ctx.replyWithMarkdown(`✦ *بوابة SPARTA للواتساب* 🐍 ✦
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
  await new Promise(r=>setTimeout(r,2500))
  const code = await sock.requestPairingCode(phone)
  return code
}

bot.start((ctx)=> ctx.replyWithMarkdown(`
╔═══════════════════╗
🐍 *SPARTA V7 GATEWAY* 🐍
╚═══════════════════╝
`, mainMenu))

bot.action('connect', (ctx)=>{
  ctx.replyWithMarkdown(`📱 *SPARTA CONNECT*\n\nأرسل رقم واتساب بهذا الشكل:\n\n\`201xxxxxxxxx\`\n\nسيتم إنشاء رمز Pairing Code بعد ذلك.`)
})

bot.on('text', async (ctx)=>{
  let phone = ctx.message.text.replace(/[^0-9]/g,'')
  if(phone.length < 10) return
  if(phone.startsWith('0')) phone = phone.slice(1)
  try{
    await ctx.reply(`⏳ جاري توليد كود لـ ${phone} ...`)
    const code = await getCode(phone, ctx)
    await ctx.replyWithMarkdown(`📲 كودك: *${code}*\n\nاذهب الى واتساب > الاجهزة المرتبطة > ربط برقم الهاتف\n\nLogging in...`)
  }catch(e){
    ctx.reply(`❌ خطأ: ${e.message}\n1- امسح جهاز قديم من واتساب\n2- دوس فصل 🗑️\n3- جرب تاني`)
  }
})

bot.action('disconnect', (ctx)=>{
  if(fs.existsSync('./auth_sparta')) fs.rmSync('./auth_sparta',{recursive:true,force:true})
  ctx.reply('🗑️ تم فصل SPARTA', mainMenu)
})

bot.action('status', (ctx)=>{
  const ok = fs.existsSync('./auth_sparta/creds.json')
  ctx.reply(ok ? '🟢 SPARTA متصل ✅' : '🔴 غير متصل', mainMenu)
})

bot.action('reconnect', (ctx)=> ctx.reply('♻️ ابعت رقمك تاني للربط'))
bot.action('settings', (ctx)=> ctx.reply('⚙️ الاعدادات قريبا'))
bot.action('dev', (ctx)=> ctx.replyWithMarkdown(`👑 المطور: ${DEV_LINK}`, Markup.inlineKeyboard([[Markup.button.url('المطور 👑', DEV_LINK)]])))
bot.action('channel', (ctx)=> ctx.replyWithMarkdown(`📢 القناة: ${CHANNEL_LINK}`, Markup.inlineKeyboard([[Markup.button.url('القناة 📢', CHANNEL_LINK)]])))

bot.launch().then(()=> console.log('SPARTA GATEWAY LIVE - Ubuntu'))
