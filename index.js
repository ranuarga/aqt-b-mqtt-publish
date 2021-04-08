require('dotenv').config()

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
    setInterval(function() {
        let feedOne = 0
        let randPh = between(7, 8)
        let randTemperature = between(22, 30)
        let randDo = between(8, 12)
        let randAmonia = between(0, 2)
        let feedTwo = 0
        let randDutycycle = between(47, 60)
        let stringChain = feedOne + '#' + randPh + '#' + randTemperature + '#' + 
            randDo + '#' + randAmonia + '#' + feedTwo + '#' + randDutycycle
        client.publish(process.env.DEVICE_ID, stringChain)
    }, 5000);
})

client.on('error', function (error) {
    console.log(error)
})

client.on('message', function (topic, message) {
    //Called each time a message is received
    console.log('Received message:', topic, message.toString())
})