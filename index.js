const express = require('express')
const axios = require('axios').default;
const RouterOSClient = require('routeros-client').RouterOSClient;
const RosApi = require('node-routeros').RouterOSAPI;
require('dotenv').config()
const { Telegraf } = require('telegraf')
var moment = require('moment-timezone');

const bot = new Telegraf(process.env.TELEGRAM_API_KEY)

const app = express()
const port = process.env.EXPRESS_PORT
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
var telegramAdmins = process.env.TELEGRAM_CHAT_ID.split(",");

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/donebackup2022', (req, res) => {
  // console.log(req.body);

  const waktuCronSendTelegram = moment.tz(moment(), 'Asia/Jakarta').format('DDMMYYYY HHmmss')
  const arrays = telegramAdmins;
  for (let index = 0; index < arrays.length; index++) {
    const element = arrays[index];
    // console.log(req.body);
    bot.telegram.sendMessage(element, `${waktuCronSendTelegram}: SIMDA 2022 Auto Backup`);
    bot.telegram.sendMessage(element, `${req.body.url}`);
  }
  res.send();
})

app.get('/getActiveIsp', (req, res) => {
  const api = getRosClient();

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
  const conn = getRosApi();

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
  const conn = getRosApi();

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

  const api = getRosClient();

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

  const conn = getRosApi();

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
  
  const conn = getRosApi();

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

bot.command('test', (ctx) => {
  if (!telegramAdmins.includes(ctx.message.chat.id.toString())) {
    ctx.reply("unauthorized access");

    return;
  }

  ctx.reply('yahaha 1 2')
})

bot.command('adminlinkbackupsimda', (ctx) => {
  if (!telegramAdmins.includes(ctx.message.chat.id.toString())) {
    ctx.reply("unauthorized access");

    return;
  }

  ctx.reply('https://db.bpkad.agungdh.com:82')
})

bot.command('backupsimda2022', (ctx) => {
  if (!telegramAdmins.includes(ctx.message.chat.id.toString())) {
    ctx.reply("unauthorized access");

    return;
  }

  axios.get('http://192.168.0.2:3001/backup2022')
  .then(function (response) {
    // handle success
    ctx.reply(response.data)
  })
  .catch(function (error) {
    // handle error
    ctx.reply('Failed')
  })
})

bot.command('backupsimda2021', (ctx) => {
  if (!telegramAdmins.includes(ctx.message.chat.id.toString())) {
    ctx.reply("unauthorized access");

    return;
  }

  axios.get('http://192.168.0.2:3001/backup2021')
  .then(function (response) {
    // handle success
    ctx.reply(response.data)
  })
  .catch(function (error) {
    // handle error
    ctx.reply('Failed')
  })
})

bot.launch()

function getRosApi() {
  return new RosApi({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASS
  });
}

function getRosClient() {
  return new RouterOSClient({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASS
  });
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))