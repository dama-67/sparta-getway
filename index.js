const express = require('express')
const { Telegraf, Markup } = require('telegraf')
const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
const QRCode = require('qrcode')

const app = express()
app.get('/', (req,res)=> res.send('SPARTA V7 LIVE 👑'))
app.listen(process.env.PORT || 3000)

const bot = new Telegraf(process.env.BOT_TOKEN)
const CHANNEL_LINK = "https://whatsapp.com/channel/0029VbDwdAaG3R3j1bt1903S"
const DEV_LINK = "https://t.me/DAMA_4"

const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('اتصال 🔗', 'connect'), Markup.button.callback('فصل 🗑️', 'disconnect')],
  [Markup.button.callback('الحالة 📊', 'status')]
])

async function startQR(ctx){
  if(fs.existsSync('./auth_sparta')) fs.rmSync('./auth_sparta',{recursive:true,force:true})
  const { state, saveCreds } = await useMultiFileAuthState('./auth_sparta')
  const sock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({level:'silent'})) },
    logger: P({level:'silent'}),
    browser: ["Ubuntu","Chrome","20.0.04"],
    printQRInTerminal: false
  })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (u)=>{
    const { connection, qr } = u
    if(qr){
      try{
        const buffer = await QRCode.toBuffer(qr)
        await ctx.replyWithPhoto({source: buffer}, {caption: '📲 امسح الـ QR ده من واتساب\n\nواتساب > الاجهزة المرتبطة > ربط جهاز\n\nصالح 30 ثانية!'})
      }catch(e){ console.log(e) }
    }
    if(connection === 'open'){
      ctx.reply('✅ SPARTA تم الاتصال بنجاح 🐍👑')
    }
  })
}

bot.start((ctx)=> ctx.reply('🐍 SPARTA V7 GATEWAY - QR MODE', mainMenu))
bot.action('connect', (ctx)=> startQR(ctx))
bot.action('disconnect', (ctx)=>{
  if(fs.existsSync('./auth_sparta')) fs.rmSync('./auth_sparta',{recursive:true,force:true})
  ctx.reply('🗑️ تم الفصل', mainMenu)
})
bot.action('status', (ctx)=>{
  const ok = fs.existsSync('./auth_sparta/creds.json')
  ctx.reply(ok ? '🟢 متصل ✅' : '🔴 غير متصل', mainMenu)
})

bot.launch().then(()=> console.log('LIVE'))
