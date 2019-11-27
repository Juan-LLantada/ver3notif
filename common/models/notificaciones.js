
const axios = require('axios')
module.exports = function(notificaciones) {



/**
 * Encuentra Notificaciones Por compañia POR DIA!
 * @param {string} Company_id Es el id de la compañia
 * @param {Function(Error, object)} callback
 */

notificaciones.Company = function (Company_id, callback) { //EncuentraNotificacionesPorCompañia por diarias
    var x = []
    notificaciones
        .find({})
        .then(notif => {
            for (i in notif) {
                if (notif[i].company_id == Company_id && notif[i].tipo == "Diaria") {
                    x.push(notif[i])
                }
            }
            callback(null, x)
        })

};




/**
 * Ve las notificaciones y regresa arreglo de nuevas notificaciones y pasadas
 * @param {string} User_id El id del usuario
 * @param {string} Company_id Company id
 * @param {Function(Error, object)} callback
 */

notificaciones.VerNotificaciones = function(User_id, Company_id, callback)
{
    var x = []
    var nuevas = []
    var viejas = []
    var todas = []
    notificaciones
        .find({})
        .then(notif => {
            for (i in notif) {
                if (notif[i].company_id == Company_id) {
                    //Todas las notificaciones que tengan el mismo company id
                    console.log('encontramos esta compañia con id' + Company_id)
                                        

                    viejas.push(notif[i])

                        for(c in notif[i].usuarios){
                
                                if(notif[i].usuarios[c].id == User_id){
                                        notif[i].usuarios.splice(c,1)
                                        viejas.pop()

                                            nuevas.push(notif[i])
                                        console.log('se hizo')
                                    
                                        axios.post('http://localhost:3000/api/notificaciones/'+notif[i].id+'/replace', {
                                            
                                                mensaje: notif[i].mensaje,
                                                 company_id : notif[i].company_id,
                                                 tipo : notif[i].tipo,
                                                 En_Correo : notif[i].tipo,
                                                 Fecha : notif[i].Fecha,
                                                 usuarios : notif[i].usuarios  
                                          })
                                          .then(function (response) {
                                            console.log(response);
                                          })
                                          .catch(function (error) {
                                            console.log(error);
                                          });
                                }else{
                             
                                        //Agregar a arreglo viejo
                                }
                                        
                            console.log('un usuario')
                            console.log(c)
                        }
                      
                }
            }






            notifica = [nuevas,viejas]
            callback(null, notifica)
        })

};





}

/*
notif[i].usuarios.forEach(usuario => {
        //Por cada usuario de la notifiacion
            if(usuario.id == User_id)  {
                
            
                // si el usuario id tiene el mismo user id introducido
        
            nuevas.push(notif[i]);
            //Aqui pasarlo a arreglo chido

        

            }else {
                
                viejas.push(notif)

            //Aqui pasarlo a arreglo anterior

            }
    });*/