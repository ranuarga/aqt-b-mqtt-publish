require('dotenv').config()

const mqtt = require('mqtt')
const options = {
    host: 'broker.hivemq.com',
    port: 1883,
}
const client = mqtt.connect(options)

client.on('connect', function () {
    console.log('Connected')
    setInterval(function() {
        client.publish(process.env.DEVICE_ID, '0#7#26#21#0.1#0#55#')
    }, 5000);
})

client.on('error', function (error) {
    console.log(error)
})

client.on('message', function (topic, message) {
    //Called each time a message is received
    console.log('Received message:', topic, message.toString())
})