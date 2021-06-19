require('dotenv').config()
const moment = require('moment')
const mqtt = require('mqtt')
const fs = require('fs')
const csv = require('csv-parser')
const options = {
    host: 'broker.hivemq.com',
    port: 1883,
}
const client = mqtt.connect(options)
let randPh, randTemperature, randDo, randAmonia, randDutycycle, stringChain
let interval = null
const maxAmonia = 2
const minAmonia = 0
const feedOne = 0
const feedTwo = 0

client.on('connect', function () {
    console.log('Connected')
    client.subscribe(process.env.DEVICE_ID + '/ASKING')
})

client.on('error', function (error) {
    console.log(error)
})

function between(min, max) {  
    return Math.floor(
      Math.random() * (max - min + 1) + min
    )
}

client.on('message', function (topic, message) {
    if(topic == process.env.DEVICE_ID + '/ASKING') {
        if(message.toString() == '1') {
            interval = setInterval(function() {
                if(process.env.DATA_TYPE == 'RAND') {
                    randPh = between(7, 8)
                    randTemperature = between(22, 30)
                    randDo = between(8, 12)
                    randAmonia = ((Math.random() * (maxAmonia - minAmonia)) + minAmonia).toFixed(2)
                    randDutycycle = between(47, 60)
                    stringChain = feedOne + '#' + randPh + '#' + randTemperature + '#' + 
                        randDo + '#' + randAmonia + '#' + feedTwo + '#' + randDutycycle
                } else if (process.env.DATA_TYPE == 'DATASET') {
                    // let i = 1
                    console.log('poi1')
                    fs.readFileSync('dataset.csv', "utf-8", function(err, data){
                        if(err) {
                            throw err;
                        }
                        let lines = data.split('\n')
                        let line = lines[Math.floor(Math.random()*lines.length)].split(',')
                        stringChain = feedOne + '#' + line[1] + '#' + line[2] + '#' + 
                            line[3] + '#' + line[4] + '#' + feedTwo + '#' + line[6]
                        console.log('poi2')
                    })
                    // fs.createReadStream('dataset.csv')
                    //     .pipe(csv())
                    //     .on('data', function (row) {
                    //         if(between(1,32) == i) {
                    //             console.log(i)
                    //             stringChain = feedOne + '#' + row.ph + '#' + row.temperature + '#' + 
                    //                 row.do + '#' + row.amonia + '#' + feedTwo + '#' + row.dutycycle
                    //         }
                    //         i++
                    //     })
                    //     .on('end', function () {
                    //         // TO DO
                    //     })
                }
                client.publish(process.env.DEVICE_ID, stringChain)
                console.log(stringChain + ' ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'))
            }, 5000)
        } else if (message.toString() == '0') {
            clearInterval(interval)
            interval = null
        }
    }
    //Called each time a message is received
    console.log('Received message:', topic, message.toString())
})