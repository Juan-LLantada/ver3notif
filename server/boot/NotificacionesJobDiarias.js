const app = require('../server');
const notificaciones = app
    .loopback
    .getModel('notificaciones');
const User = app
    .loopback
    .getModel('eUser');

    const service    = app
    .loopback
    .getModel('Service');

const designatedMeter = app.models.DesignatedMeter
const Meter = app.models.Meter
var lista_costosDeDevices = [];
var listafinal = [];
var i = 1
var cron = require('node-cron');
var p = -1;



let Mandando_a_Llamar = cron.schedule(
    '* * * * *',
    // Segun GuruCrontab  => At 09:00 on Monday.
            () => {
        p = -1;
        Iniciando_secuencia();

        Mandando_a_Llamar.stop();
    }
)


function Iniciando_secuencia() {
    let inicio = cron.schedule(' 30,59 * * * * *', () => {

        service.find({}, function (err, servuce) {
            if (p == servuce.length) {
                console.log('se terminaran de hacer las notificaciones')
                inicio.stop()
            } else {
                IniciarNotificaciones(servuce.length);
            }
        })

    });
}



function IniciarNotificaciones(y){

    let x = cron.schedule(' 7,14,24,30,40,59 * * * * *', () => {
    if (p != y - 1) {
    service.find({}).then(servicio =>{
            designatedMeter.find({
                where: {
                    id: servicio[p].designatedMeterId
                }
            }).then(designated=>{

                
                 designated.forEach(desigantedmeter =>{
        
                    Meter.getConsumptionCostsByFilter(desigantedmeter.meter_id, // id del meter
                        "", //Por cada dispositivo
                        servicio[p].serviceName, 2, 3600, "", async function (err, Meter){
        
                            var costo_total = []
                            for (x in Meter) { // por cada resultado meter el costo en un arreglo
                                costo_total.push(Meter[x].cost)
                            }
                            Costo_Dispositivo = costo_total
                                .reduce((a, b) => a + b, 0) //Sumando los valores
                                .toFixed(2) //redondearlo a dos punto  .replace(/\B(?=(\d{3})+(?!\d))/g, ",") Mostrarlo de manera bonita
                            lista_costosDeDevices.push(servicio[p].serviceName + ' ' + Costo_Dispositivo) //Añadiendolos a un array para futuro uso
                            listafinal = desigantedmeter.company_id // si esta imprimiendo los datos 
                        })
                        if(lista_costosDeDevices!=''){
                            Mensaje = lista_costosDeDevices
                            var Fecha = Date.now();
                            User
                                .find({
                                    where: {
                                        company_id: desigantedmeter.company_id
                                    }
                                })
                                .then(users => {
                                    notificaciones.create([
                                        {
                                            "mensaje": Mensaje,
                                            "company_id": desigantedmeter.company_id,
                                            "tipo": "Diaria",
                                            "En_Correo": false,
                                            "Fecha": Fecha,
                                            "usuarios": users
                                        }
                                    ], function () {
                                        console.log('Creando notificacion en Api')
                                    }) //Creando notificacion
                                
                                })

                                lista_costosDeDevices = [];
                        }
        

                 })
                                    
            
        
        
        
            })
            
      
        })

        p= p+1;
    
        x.stop()
    }else{
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
                        "tipo": "Diaria",
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

   
        p=p+1;
        x.stop();

    }
});

} 


