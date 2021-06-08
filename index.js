require('dotenv').config()
const moment = require('moment')
const mqtt = require('mqtt')
const options = {
    host: 'broker.hivemq.com',
    port: 1883,
}
const client = mqtt.connect(options)

client.on('connect', function () {
    console.log('Connected')
    function between(min, max) {  
        return Math.floor(
          Math.random() * (max - min + 1) + min
        )
    }
    let randPh, randTemperature, randDo, randAmonia, randDutycycle, stringChain
    const maxAmonia = 2
    const minAmonia = 0
    const feedOne = 0
    const feedTwo = 0
    setInterval(function() {
        randPh = between(7, 8)
        randTemperature = between(22, 30)
        randDo = between(8, 12)
        randAmonia = ((Math.random() * (maxAmonia - minAmonia)) + minAmonia).toFixed(2)
        randDutycycle = between(47, 60)
        stringChain = feedOne + '#' + randPh + '#' + randTemperature + '#' + 
            randDo + '#' + randAmonia + '#' + feedTwo + '#' + randDutycycle
        client.publish(process.env.DEVICE_ID, stringChain)
        console.log(stringChain + ' ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'))
    }, 5000)
})

client.on('error', function (error) {
    console.log(error)
})

client.on('message', function (topic, message) {
    //Called each time a message is received
    console.log('Received message:', topic, message.toString())
})