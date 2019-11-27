const app = require('../server');
const notificaciones = app
    .loopback
    .getModel('notificaciones');
const User = app
    .loopback
    .getModel('eUser');

const users = app
    .loopback
    .getModel('eUser')
const designatedMeter = app.models.DesignatedMeter
const Meter = app.models.Meter
var lista_costosDeDevices = [];
var listafinal = [];
var i = -1
var cron = require('node-cron');
// Para fines de prueba recomiendo solo cambiar este cron schedule a '* * * * *
// || 0 9 * * 1





let Mandando_a_Llamar = cron.schedule(
    '0 9 * * 1',
    // Segun GuruCrontab  => At 09:00 on Monday.
            () => {
        i = -1;
        Iniciando_secuencia();

        Mandando_a_Llamar.stop();
    }
)
function Iniciando_secuencia() {
    let inicio = cron.schedule(' 30,59 * * * * *', () => {

        designatedMeter.find({}, function (err, designated) {
            if (i == designated.length) {
                console.log('se terminaran de hacer las notificaciones')
                inicio.stop()
            } else {
                IniciarNotificaciones(designated.length);
            }
        })

    });
}

function IniciarNotificaciones(y) {

    let x = cron.schedule(' 5,10,15,20,25,30,35,40,45,50,55 * * * * *', () => {

        if (i != y - 1) {

            designatedMeter.find({}, function (err, designatedmeters) {
                // imprime los dispositivos de cada designatedMeter/compañia
                // console.log(designatedmeters[i].devices)
                designatedmeters[i]
                    .devices
                    .forEach(function (device) {
                        Meter.getConsumptionCostsByFilter(designatedmeters[i].meter_id, // id del meter
                                device.name, //Por cada dispositivo
                                "", 2, 3600, "", function (err, Meter) {
                            var costo_total = []
                            for (x in Meter) { // por cada resultado meter el costo en un arreglo
                                costo_total.push(Meter[x].cost)
                            }
                            Costo_Dispositivo = costo_total
                                .reduce((a, b) => a + b, 0) //Sumando los valores
                                .toFixed(2) //redondearlo a dos punto  .replace(/\B(?=(\d{3})+(?!\d))/g, ",") Mostrarlo de manera bonita
                            lista_costosDeDevices.push(device.name + ' ' + Costo_Dispositivo) //Añadiendolos a un array para futuro uso
                            listafinal = designatedmeters[i].company_id // si esta imprimiendo los datos necesitas hacer una lista de cada dispositivo y despues una lista de cuanto consumieron o sumar todo

                        }) //cerrando consumptios

                    }) //cerrando devices. 5b8dab8c7ed0dd0c5ba0e133 || 5b907cbcd03841243407f8c2
                //Imprime los costos de los dispositivos console.log(lista_costosDeDevices)
                if (lista_costosDeDevices != '') {
                    Mensaje = lista_costosDeDevices

                    var Fecha = Date.now();
                    User
                        .find({
                            where: {
                                company_id: designatedmeters[i - 1].company_id
                            }
                        })
                        .then(users => {

                            notificaciones.create([
                                {
                                    "mensaje": Mensaje,
                                    "company_id": designatedmeters[i - 1].company_id,
                                    "tipo": "Semanal",
                                    "En_Correo": false,
                                    "Fecha": Fecha,
                                    "usuarios": users
                                }
                            ], function () {
                                console.log('Creando notificacion en Api')
                            }) //Creando notificacion

                        })

                }
                lista_costosDeDevices = []
                x.stop();
            });

            i = i + 1;
        } else { //Si es el ultimo designatedMeter crea una notificacion solo para el ultimo
            Mensaje = lista_costosDeDevices
            var Fecha = Date.now();
            User
                .find({
                    where: {
                        company_id: listafinal
                    }
                })
                .then(users => {

                    notificaciones.create([
                        {
                            "mensaje": Mensaje,
                            "company_id": listafinal,
                            "tipo": "Semanal",
                            "En_Correo": false,
                            "Fecha": Fecha,
                            "usuarios": users
                        }
                    ], function () {
                        console.log('Creando notificacion en Api')
                    }) //Creando notificacion

                })
            x.stop();
            i = i + 1;
        }

    })
}