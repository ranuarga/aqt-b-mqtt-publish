require('dotenv').config()
const moment = require('moment')
const mqtt = require('mqtt')
const dataset = require('./dataset')
const options = {
    host: 'broker.hivemq.com',
    port: 1883,
}
const client = mqtt.connect(options)
let randPh, randTemperature, randDo, randAmonia, randDutycycle, stringChain, line
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
                    line = between(0,dataset.data.length - 1)
                    dataSensor = dataset.data[line]
                    stringChain = feedOne + '#' + dataSensor.ph + '#' + dataSensor.temperature + '#' + 
                        dataSensor.do + '#' + dataSensor.amonia + '#' + feedTwo + '#' + dataSensor.dutycycle
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