require('dotenv').config()
const moment = require('moment')
const mqtt = require('mqtt')
const dataset = require('./dataset')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: 'log.csv',
    append: true,
    header: [
        {id: 'feedOne', title: 'feedOne'},
        {id: 'ph', title: 'ph'},
        {id: 'temperature', title: 'temperature'},
        {id: 'do', title: 'do'},
        {id: 'amonia', title: 'amonia'},
        {id: 'feedTwo', title: 'feedTwo'},
        {id: 'dutycycle', title: 'dutycycle'},
        {id: 'time', title: 'time'},
    ]
});
const options = {
    host: 'broker.hivemq.com',
    port: 1883,
}
const client = mqtt.connect(options)
let randPh, randTemperature, randDo, randAmonia, randDutycycle, stringChain, line, time
let writeData = []
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
                } else if (process.env.DATA_TYPE == 'DATASET') {
                    line = between(0,dataset.data.length - 1)
                    dataSensor = dataset.data[line]
                    randPh = dataSensor.ph
                    randTemperature = dataSensor.temperature
                    randDo = dataSensor.do
                    randAmonia = dataSensor.amonia
                    randDutycycle = dataSensor.dutycycle
                }
                stringChain = feedOne + '#' + randPh + '#' + randTemperature + '#' + 
                        randDo + '#' + randAmonia + '#' + feedTwo + '#' + randDutycycle
                client.publish(process.env.DEVICE_ID, stringChain)
                time = moment().format('YYYY-MM-DD HH:mm:ss.SSS')
                console.log(stringChain + ' ' + time)
                writeData = [
                    {
                        "feedOne": feedOne,
                        "ph": randPh,
                        "temperature": randTemperature,
                        "do": randDo,
                        "amonia": randAmonia,
                        "feedTwo": feedTwo,
                        "dutycycle": randDutycycle,
                        "time": time
                    }
                ]
                csvWriter.writeRecords(writeData).then(() => console.log('Data Logged'))
            }, 5000)
        } else if (message.toString() == '0') {
            clearInterval(interval)
            interval = null
        }
    }
    //Called each time a message is received
    console.log('Received message:', topic, message.toString())
})