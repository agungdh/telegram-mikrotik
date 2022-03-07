const express = require('express')
const axios = require('axios').default;
const RouterOSClient = require('routeros-client').RouterOSClient;
const RosApi = require('node-routeros').RouterOSAPI;
require('dotenv').config()
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.TELEGRAM_API_KEY)

const app = express()
const port = process.env.EXPRESS_PORT

var telegramAdmins = process.env.TELEGRAM_CHAT_ID.split(",");

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/getActiveIsp', (req, res) => {
  const api = new RouterOSClient({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASS
  });

  api.connect().then((client) => {
      client.menu("/ip route print").where('id', '*7').getOnly().then((result) => {
          api.close();
          
          if (result.disabled) {
            res.send("icon");
          } else {
            res.send("indihome");
          }
      }).catch((err) => {
          api.close();

          console.log(err);
      });
  }).catch((err) => {
    console.log(err.message);
  });
})

app.get('/setActiveIsp/indihome', (req, res) => {
  const conn = new RosApi({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASS
  });

  conn.connect()
    .then(() => {
        conn.write('/ip/route/enable', [
            '=numbers=*7',
        ])
        .then((data) => {
            conn.close();
            res.send('success');
        })
        .catch((err) => {
            conn.close();
            console.log(err);
            res.send('failed');
        });
    })
    .catch((err) => {
        console.log(err);
    });
})

app.get('/setActiveIsp/icon', (req, res) => {
  const conn = new RosApi({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASS
  });

  conn.connect()
    .then(() => {
        conn.write('/ip/route/disable', [
            '=numbers=*7',
        ])
        .then((data) => {
            conn.close();
            res.send('success');
        })
        .catch((err) => {
            conn.close();
            console.log(err);
            res.send('failed');
        });
    })
    .catch((err) => {
        console.log(err);
    });
})

app.get('/getLocalIp', (req, res) => {
  axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.API_IPGEOLOCATION_IO_API_KEY}`)
  .then(function (response) {
    res.send(response.data);
  })
  .catch(function (error) {
    console.log(error.message);
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

bot.start((ctx) => ctx.reply(ctx.message.chat.id))

bot.command('checkisp', (ctx) => {
  if (!telegramAdmins.includes(ctx.message.chat.id.toString())) {
    ctx.reply("unauthorized access");

    return;
  }

  const api = new RouterOSClient({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASS
  });

  api.connect().then((client) => {
      client.menu("/ip route print").where('id', '*7').getOnly().then((result) => {
          api.close();
          
          if (result.disabled) {
            ctx.reply('icon')
          } else {
            ctx.reply('indihome')
          }
      }).catch((err) => {
          api.close();

          console.log(err);
      });
  }).catch((err) => {
    console.log(err.message);
  });
})

bot.command('setispindihome', (ctx) => {
  if (!telegramAdmins.includes(ctx.message.chat.id.toString())) {
    ctx.reply("unauthorized access");

    return;
  }

  const conn = new RosApi({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASS
  });

  conn.connect()
    .then(() => {
        conn.write('/ip/route/enable', [
            '=numbers=*7',
        ])
        .then((data) => {
            conn.close();
            ctx.reply('success')
        })
        .catch((err) => {
            conn.close();
            console.log(err);
            ctx.reply('failed')
        });
    })
    .catch((err) => {
        console.log(err);
    });
})

bot.command('setispicon', (ctx) => {
  if (!telegramAdmins.includes(ctx.message.chat.id.toString())) {
    ctx.reply("unauthorized access");

    return;
  }
  
  const conn = new RosApi({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASS
  });

  conn.connect()
    .then(() => {
        conn.write('/ip/route/disable', [
            '=numbers=*7',
        ])
        .then((data) => {
            conn.close();
            ctx.reply('success')
        })
        .catch((err) => {
            conn.close();
            console.log(err);
            ctx.reply('failed')
        });
    })
    .catch((err) => {
        console.log(err);
    });
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))