'use strict';

const app = require('./../../server/server.js');
const async = require('async');
const Constants = require('./../../server/constants.json');
const mail = require('../../server/modules/mail.js');
const path = require('path');
const notificaciones = app.loopback.notificaciones

module.exports = function(Company) {
    Company.register = function register(contactData, user, cb){
        Company.findOne({ where: { for_free_trial: true }})
            .then(company => {
                if (!company) return cb({ status: 404, message: 'No default company set for free trial' });
                company.users.create({
                    ...user,
                    created_at: new Date(),
                    updated_at: new Date(),
                    free_trial: true,
                    contact_data: contactData
                }, err => {
                    if (err) return cb(err);
                    cb(null, 'OK');
                });
            })
            .catch(err => {
                cb(err);
            });
        const templateVars = user;
        const templatePath = path.join(__dirname, '/../../server/templates/welcome.mustache');
    
        mail.sendMail(templatePath, templateVars, {to: user.email, subject:"El equipo de Energybook te da la bienvenida"});
    };

    Company.remoteMethod(
        'register', {
            accepts: [
                { arg: 'contactData', type: 'object' },
                { arg: 'user', type: 'object' }
            ],
            returns: { arg: 'response', type: 'string' }
        }
    );

    Company.addDesignatedMeter = function addDesignatedMeter(data, cb) {
        const Services = app.loopback.getModel('Service');
        const DesignatedMeters = app.loopback.getModel('DesignatedMeter');
        const Meters = app.loopback.getModel('Meter');
        if(!data || !data.company_id){
            cb({status: 400, message: "Parametros faltantes"}, null);
        } else {
            Meters.create({
                serial_number: data.serial_number,
                created_at: new Date(),
                updated_at: new Date()
            }, (err, newMeter) => {
                if (err) return {status: 400, message: "Error al crear medidor"};
                newMeter.designatedMeters.create({
                    device_name: data.device_name,
                    hostname: data.hostname,
                    summatory_device: Constants.Meters.common_names.summatory_device,
                    max_value: parseInt(data.max_value),
                    min_value: parseInt(data.min_value),
                    company_id: data.company_id,
                    created_at: new Date()
                }, (err, dsgMeter) => {
                    if (err) {
                        Meters.destroyById(newMeter.id, () => {
                            return cb({status: 400, message: "Error al crear medidor designado"});
                        });
                    } else {
                        Meters.storeConnectedDevices(dsgMeter.id, (err, met) => {
                            if (err) {
                                Meters.destroyById(newMeter.id, () => {
                                    DesignatedMeters.destroyById(dsgMeter.id, () => {
                                        return cb(err);
                                    });
                                });
                            } else {
                                Services.setUpBasicService(dsgMeter.id, err => {
                                    if (err) {
                                        Meters.destroyById(newMeter.id, () => {
                                            DesignatedMeters.destroyById(dsgMeter.id, () => {
                                                return cb({status: 400, message: "No se pudo crear el servicio para el medidor"});
                                            });
                                        });
                                    } else cb(null, 'Medidor '+ dsgMeter.id +' asignado correctamente');
                                });
                            }
                        });
                    }
                });
            });
        }
    };

    Company.remoteMethod(
        'addDesignatedMeter', {
            accepts: [
                { arg: 'data', type: 'object' }
            ],
            returns: { arg: 'response', type: 'object', root: true }
        }
    );

    Company.block = function block(company_id, cb) {
        if(!company_id){
            cb({status: 400, message: "ID de compañía faltante"}, null);
        } else {
            Company.findById(company_id, function(err, company){
                company.status = Constants.Companies.status.Bloqueada;
                company.save(function(err, updated_company){
                    updated_company.users(function(err, users){
                        async.each(users, function (user, next){
                            user.status = Constants.Eusers.status.Bloqueado;
                            user.save();
                            next();
                        }, function(err){
                            cb(null, 'Compañía bloqueada exitosamente');
                        });
                    });
                });
            });
        }
    };

    Company.remoteMethod(
        'block', {
            accepts: [
                { arg: 'company_id', type: 'string' }
            ],
            returns: { arg: 'response', type: 'string', root: true }
        }
    );

    Company.addUser = function addUser(companyId, user, cb) {
        Company.findById(companyId, (err, company) => {
            if (err) return cb(err);
            company.users.create({
                ...user,
                phone: company.phone,
                created_at: new Date(),
                updated_at: new Date()
            }, (err, usr) => {
                if (err) cb(err);
                else cb(null, usr);
            });
        });
    }

    Company.remoteMethod(
        'addUser', {
            accepts: [
                { arg: 'companyId', type: 'string' },
                { arg: 'user', type: 'object' }
            ],
            returns: { arg: 'user', type: 'object' }
        }
    )

    Company.addUsers = function addUsers(data, cb) {
        if(!data.company.id){
            cb({status: 400, message: "ID de compañía faltante"}, null);
        } else {
            Company.findById(data.company.id, function(err, company){
                if(!company || company.status === Constants.Companies.status.Bloqueada){
                    cb({status: 400, message: "Error, compañía bloqueada"}, null);
                } else {
                    company.users.create({
                        name: data.manager.name,
                        lastname: data.manager.lastname,
                        phone: data.company.phone,
                        email: data.manager.email,
                        password: 'Password123',
                        created_at: new Date(),
                        updated_at: new Date()
                    }, function(err, user){
                        if(err) cb(err, null)

                    });
                    if(data.user){
                        company.users.create({
                            name: data.user.name,
                            lastname: data.user.lastname,
                            phone: data.company.phone,
                            email: data.user.email,
                            password: 'Password123',
                            created_at: new Date(),
                            updated_at: new Date()
                        }, function(err, user){
                            if(err) cb(err, null)
                        });
                    }
                    cb(null, true);
                }
            });
        }
    };

    Company.remoteMethod(
        'addUsers', {
            accepts: [
                { arg: 'data', type: 'object' }
            ],
            returns: { arg: 'response', type: 'string', root: true }
        }
    );

    Company.updateData = function updateData(data, cb) {
        let new_company = data.company;
        if(!new_company.id){
            cb({status: 400, message: "ID de compañía faltante"}, null);
        } else {
            Company.findById(new_company.id, function(err, company){
                if(err){
                    cb({status: 400, message: err}, null);
                } else {
                    company.company_name = new_company.company_name;
                    company.legal_name = new_company.company_name;
                    company.phone = new_company.phone;
                    company.company_type = new_company.type_id;
                    company.location = new_company.location;
                    company.save(function(err, savedCompany){

                    });
                    cb(null, true);
                }
            });
        }
    };

    Company.remoteMethod(
        'updateData', {
            accepts: [
                { arg: 'data', type: 'object' }
            ],
            returns: { arg: 'response', type: 'string', root: true }
        }
    );


//-------------------------------------------------------------------------



}
