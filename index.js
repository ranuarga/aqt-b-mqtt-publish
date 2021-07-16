require('dotenv').config()
const moment = require('moment')
const mqtt = require('mqtt')
const dataset = require('./dataset')
const fuzzyis = require('fuzzyis')
const {LinguisticVariable, Term, Rule, FIS} = fuzzyis
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const csvWriter = createCsvWriter({
    path: process.env.DEVICE_ID + 'log.csv',
    append: true,
    header: [
        {id: 'feedOne', title: 'feedOne'},
        {id: 'ph', title: 'ph'},
        {id: 'temperature', title: 'temperature'},
        {id: 'do', title: 'do'},
        {id: 'amonia', title: 'amonia'},
        {id: 'feedTwo', title: 'feedTwo'},
        {id: 'dutycycle', title: 'dutycycle'},
        {id: 'date', title: 'date'},
        {id: 'time', title: 'time'},
    ]
});

const options = {
    host: 'broker.hivemq.com',
    port: 1883,
}
const client = mqtt.connect(options)

const system = new FIS('Aquaponic Pump System')
const speedState = new LinguisticVariable('speed', [40, 65])
const temperatureState = new LinguisticVariable('temperature', [15, 40])
const amoniaState = new LinguisticVariable('amonia', [0, 2])
system.addOutput(speedState)
system.addInput(amoniaState)
system.addInput(temperatureState)
amoniaState.addTerm(new Term('safe', 'trapeze', [0, 0, 0.25, 0.65]))
amoniaState.addTerm(new Term('warn', 'triangle', [0.25, 0.65, 1]))
amoniaState.addTerm(new Term('tox', 'trapeze', [0.65, 1, 100, 100]))
temperatureState.addTerm(new Term('cold', 'trapeze', [15, 15, 20, 27.5]))
temperatureState.addTerm(new Term('good', 'triangle', [25, 27.5, 30]))
temperatureState.addTerm(new Term('warm', 'triangle', [27.5, 30, 32.5]))
temperatureState.addTerm(new Term('hot', 'trapeze', [30, 32.5, 100, 100]))
speedState.addTerm(new Term('slow', 'trapeze', [40, 40, 45, 52.5]))
speedState.addTerm(new Term('normal', 'triangle', [45, 52.5, 60]))
speedState.addTerm(new Term('quick', 'trapeze', [52.5, 60, 65, 65]))
system.rules = [
    new Rule(
        ['safe', 'cold'],
        ['slow'],
        'and'
    ),
    new Rule(
        ['safe', 'good'],
        ['slow'],
        'and'
    ),
    new Rule(
        ['safe', 'warm'],
        ['normal'],
        'and'
    ),
    new Rule(
        ['warn', 'cold'],
        ['slow'],
        'and'
    ),
    new Rule(
        ['warn', 'good'],
        ['normal'],
        'and'
    ),
    new Rule(
        ['warn', 'warm'],
        ['normal'],
        'and'
    ),
    new Rule(
        ['tox', null],
        ['quick'],
        'and'
    ),
    new Rule(
        [null, 'hot'],
        ['quick'],
        'and'
    )
]

let randPh, randTemperature, randDo, randAmonia, randDutycycle, stringChain, line, datetime, date, time
let writeData = []
let interval = null
const maxAmonia = 2
const minAmonia = 0
const feedOne = 10
const feedTwo = 10

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
                } else if (process.env.DATA_TYPE == 'DATASET') {
                    line = between(0,dataset.data.length - 1)
                    dataSensor = dataset.data[line]
                    randPh = dataSensor.ph
                    randTemperature = dataSensor.temperature
                    randDo = dataSensor.do
                    randAmonia = dataSensor.amonia
                }
                randDutycycle = system.getPreciseOutput([randAmonia, randTemperature])
                stringChain = feedOne + '#' + randPh + '#' + randTemperature + '#' + 
                        randDo + '#' + randAmonia + '#' + feedTwo + '#' + randDutycycle
                client.publish(process.env.DEVICE_ID, stringChain)
                datetime = moment()
                date = datetime.format('YYYY-MM-DD')
                time = datetime.format('HH:mm:ss.SSS')
                console.log(stringChain + ' ' + date + ' ' + time)
                writeData = [
                    {
                        "feedOne": feedOne,
                        "ph": randPh,
                        "temperature": randTemperature,
                        "do": randDo,
                        "amonia": randAmonia,
                        "feedTwo": feedTwo,
                        "dutycycle": randDutycycle,
                        "date": date,
                        "time": time
                    }
                ]
                csvWriter.writeRecords(writeData).then(() => console.log('Data Logged'))
            }, process.env.DELAY_TIME)
        } else if (message.toString() == '0') {
            clearInterval(interval)
            interval = null
        }
    }
    //Called each time a message is received
    console.log('Received message:', topic, message.toString())
})