//=====================================================================
// This is a Node.js module encapsulating the unofficial Tesla API set
//
// Github: https://github.com/mseminatore/TeslaJS
// NPM: https://www.npmjs.com/package/teslajs
//
// Copyright (c) 2016 Mark Seminatore
//
// Refer to included LICENSE file for usage rights and restrictions
//=====================================================================

"use strict";

var request = require('request');
var Promise = require('promise');

//=======================
// Streaming API portal
//=======================
var streamingPortal = "https://streaming.vn.teslamotors.com/stream/";
exports.streamingPortal = streamingPortal;

//===========================
// New OAuth-based API portal
//===========================
var portal = "https://owner-api.teslamotors.com";
exports.portal = portal;

var portalBaseURI = process.env.TESLAJS_SERVER || portal;

//=======================
// Log levels
//=======================
var API_LOG_ALWAYS = 0;
exports.API_LOG_ALWAYS = API_LOG_ALWAYS;

var API_ERR_LEVEL = 1;
exports.API_ERR_LEVEL = API_ERR_LEVEL;

var API_CALL_LEVEL = 2;
exports.API_CALL_LEVEL = API_CALL_LEVEL;

var API_RETURN_LEVEL = 3;
exports.API_RETURN_LEVEL = API_RETURN_LEVEL;

var API_BODY_LEVEL = 4;
exports.API_BODY_LEVEL = API_BODY_LEVEL;

var API_REQUEST_LEVEL = 5;
exports.API_REQUEST_LEVEL = API_REQUEST_LEVEL;

var API_RESPONSE_LEVEL = 6;
exports.API_RESPONSE_LEVEL = API_RESPONSE_LEVEL;

var API_LOG_ALL = 255;	// this value must be the last
exports.API_LOG_ALL = API_LOG_ALL;

var logLevel = process.env.TESLAJS_LOG || 0;

//===========================
// Adjustable console logging
//===========================
function log(level, str) {
    if (logLevel < level) {
        return;
    }
    console.log(str);
}

//==================================
// Ensure value is within [min..max]
//==================================
function clamp(value, min, max) {
    if (value < min) {
        value = min;
    }

    if (value > max) {
        value = max;
    }

    return value;
}

//==========================
// Set/get the logging level
//==========================
exports.setLogLevel = function setLogLevel(level) {
    logLevel = level;
}

exports.getLogLevel = function getLogLevel() {
    return logLevel;
}

//============================
// set/get the portal base URI
//============================
exports.setPortalBaseURI = function setPortalBaseURI(uri) {
    if (!uri) {
        portalBaseURI = portal; // reset to the default Tesla servers
    } else {
        portalBaseURI = uri;
    }
}

exports.getPortalBaseURI = function getPortalBaseURI() {
    return portalBaseURI;
}


//==============================================
// Return the car model from vehicle information
//==============================================
exports.getModel = function getModel(vehicle) {
    var carType = "Unknown";

    if (vehicle.option_codes.indexOf("MDLX") != -1) {
        carType = "Model X";
    } else {
        carType = "Model S";
    }

    return carType;
}

//================================================
// Return the paint color from vehicle information
//================================================
exports.getPaintColor = function getPaintColor(vehicle) {
    var colors = {
        "PBCW": "white",
        "PBSB": "black",
        "PMAB": "metallic_brown",
        "PMBL": "metallic_black",
        "PMMB": "metallic_blue",
        "PMMR": "mc_red",
        "PPMR": "mc_red",
        "PMNG": "steel_grey",
        "PMSG": "metallic_green",
        "PMSS" : "metallic_silver",
        "PPSB": "ocean_blue",
        "PPSR" : "red",  //premium signature red"
        "PPSW": "pearl_white",
        "PPTI": "titanium",
        "PMTG": "metallic_grey"   // dolphin grey
    };

    var paintColor = vehicle.option_codes.match(/PBCW|PBSB|PMAB|PMBL|PMMB|PMMR|PPMR|PMNG|PMSG|PMSS|PPSB|PPSR|PPSW|PPTI|PMTG/);

    return colors[paintColor] || "black";
}

//===============================================
// Login to the server and receive an OAuth token
//===============================================
exports.login = function login(username, password, callback) {
    log(API_CALL_LEVEL, "TeslaJS.login()");

    callback = callback || function (err, result) { /* do nothing! */ }

    var req = {
        method: 'POST',
        url: portalBaseURI + '/oauth/token',
        form: {
            "grant_type": "password",
            "client_id": c_id,
            "client_secret": c_sec,
            "email": process.env.TESLAJS_USER || username,
            "password": process.env.TESLAJS_PASS || password
        }
    };

    log(API_REQUEST_LEVEL, "\nRequest: " + JSON.stringify(req));

    request(req, function (error, response, body) {

        log(API_RESPONSE_LEVEL, "\nResponse: " + JSON.stringify(body));

        var authToken;

        try {
            var authdata = JSON.parse(body);
            authToken = authdata.access_token;
        } catch (e) {
            log(API_ERR_LEVEL, 'Error parsing response to oauth token request');
        }

        callback(error, { error: error, response: response, body: body, authToken: authToken });

        log(API_RETURN_LEVEL, "TeslaJS.login() completed.");
    });
}
exports.loginAsync = Promise.denodeify(exports.login);

//==================================
// Invalidate the current auth token
//==================================
exports.logout = function logout(authToken, callback) {
    log(API_CALL_LEVEL, "TeslaJS.logout()");

    callback = callback || function (err, result) { /* do nothing! */ }

    callback(null, { error: "Not implemented!", response: "Not implemented!", body: "Not implemented!" });

    log(API_RETURN_LEVEL, "TeslaJS.logout() completed.");

/*
    request({
        method: 'DELETE',
        url: portalBaseURI + 'logout',
        headers: { Authorization: "Bearer " + authToken, 'Content-Type': 'application/json; charset=utf-8' }
    }, function (error, response, body) {

        callback({ error: error, response: response, body: body });

        log(API_RETURN_LEVEL, "TeslaJS.logout() completed.");
    });
*/
}
exports.logoutAsync = Promise.denodeify(exports.logout);

//====================================================
// Return vehicle information on the requested vehicle
//====================================================
exports.vehicles = function vehicles(options, callback) {
    log(API_CALL_LEVEL, "TeslaJS.vehicles()");

    callback = callback || function (err, vehicle) { /* do nothing! */ }

    var req = {
        method: 'GET',
        url: portalBaseURI + '/api/1/vehicles',
        headers: { Authorization: "Bearer " + options.authToken, 'Content-Type': 'application/json; charset=utf-8' }
    };

    log(API_REQUEST_LEVEL, "\nRequest: " + JSON.stringify(req));

    request(req, function (error, response, body) {
        if (error) {
            log(API_ERR_LEVEL, error);
        }

        log(API_BODY_LEVEL, "\nBody: " + JSON.stringify(body));
        log(API_RESPONSE_LEVEL, "\nResponse: " + JSON.stringify(response));

        var data = {};

        try {
            data = JSON.parse(body);
            data = data.response[options.carIndex || 0];
            data.id = data.id_s;
            options.vehicleID = data.id;
            
            callback(error, data);
        } catch (e) {
            log(API_ERR_LEVEL, 'Error parsing vehicles response');
            callback(e, null);
        }

        log(API_RETURN_LEVEL, "\nGET request: " + "/vehicles" + " completed.");
    });
}
exports.vehicle = exports.vehicles;
exports.vehicleAsync = Promise.denodeify(exports.vehicles);
exports.vehiclesAsync = Promise.denodeify(exports.vehicles);

//====================================================
// Return vehicle information on ALL vehicles
//====================================================
exports.allVehicles = function allVehicles(options, callback) {
    log(API_CALL_LEVEL, "TeslaJS.allVehicles()");

    callback = callback || function (err, vehicle) { /* do nothing! */ }

    var req = {
        method: 'GET',
        url: portalBaseURI + '/api/1/vehicles',
        headers: { Authorization: "Bearer " + options.authToken, 'Content-Type': 'application/json; charset=utf-8' }
    };

    log(API_REQUEST_LEVEL, "\nRequest: " + JSON.stringify(req));

    request(req, function (error, response, body) {
        if (error) {
            log(API_ERR_LEVEL, error);
        }

        log(API_BODY_LEVEL, "\nBody: " + JSON.stringify(body));
        log(API_RESPONSE_LEVEL, "\nResponse: " + JSON.stringify(response));

        var data = {};

        try {
            data = JSON.parse(body);
            data = data.response;
            
            callback(error, data);
        } catch (e) {
            log(API_ERR_LEVEL, 'Error parsing vehicles response');
            callback(e, null);
        }

        log(API_RETURN_LEVEL, "\nGET request: " + "/vehicles" + " completed.");
    });
}
exports.allVehiclesAsync = Promise.denodeify(exports.allVehicles);

//====================================
// Generic REST call for GET commands
//====================================
exports.get_command = get_command;
function get_command(options, command, callback) {
    log(API_CALL_LEVEL, "GET call: " + command + " start.");

    callback = callback || function (err, data) { /* do nothing! */ }

    var req = {
        method: "GET",
        url: portalBaseURI + "/api/1/vehicles/" + options.vehicleID + "/" + command,
        headers: { Authorization: "Bearer " + options.authToken, 'Content-Type': 'application/json; charset=utf-8'}
    };

    log(API_REQUEST_LEVEL, "\nRequest: " + JSON.stringify(req));

    request(req, function (error, response, body) {
        if (error) {
            log(API_ERR_LEVEL, error);
        }

        log(API_BODY_LEVEL, "\nBody: " + JSON.stringify(body));
        log(API_RESPONSE_LEVEL, "\nResponse: " + JSON.stringify(response));

        var data = {};

        try {
            data = JSON.parse(body);
            data = data.response;

            callback(error, data);
        } catch (e) {
            log(API_ERR_LEVEL, 'Error parsing GET call response');
            callback(e, null);
        }

        log(API_RETURN_LEVEL, "\nGET request: " + command + " completed.");
    });
}
exports.get_commandAsync = Promise.denodeify(exports.get_command);

//====================================
// Generic REST call for POST commands
//====================================
exports.post_command = post_command;
function post_command(options, command, body, callback) {
    log(API_CALL_LEVEL, "POST call: " + command + " start.");

    callback = callback || function (err, data) { /* do nothing! */ }

    var cmd = {
        method: "POST",
        url: portalBaseURI + "/api/1/vehicles/" + options.vehicleID + "/" + command,
        headers: { Authorization: "Bearer " + options.authToken, 'content-type': 'application/json; charset=UTF-8' },
        form: body || null
    };

    log(API_REQUEST_LEVEL, "\nRequest: " + JSON.stringify(cmd));

    request(cmd, function (error, response, body) {
        if (error) {
            log(API_ERR_LEVEL, error);
        }

        log(API_BODY_LEVEL, "\nBody: " + JSON.stringify(body));
        log(API_RESPONSE_LEVEL, "\nResponse: " + JSON.stringify(response));

        var data = {};

        try {
            data = JSON.parse(body);
            data = data.response;

            callback(error, data);
        } catch (e) {
            log(API_ERR_LEVEL, 'Error parsing POST call response');
            callback(e, null);
        }

        log(API_RETURN_LEVEL, "\nPOST command: " + command + " completed.");
    });
}
exports.post_commandAsync = Promise.denodeify(exports.post_command);

//=====================
// GET the vehicle state
//=====================
exports.vehicleState = function vehicleState(options, callback) {
    get_command(options, "data_request/vehicle_state", callback);
}
exports.vehicleStateAsync = Promise.denodeify(exports.vehicleState);

//=====================
// GET the climate state
//=====================
exports.climateState = function climateState(options, callback) {
    get_command(options, "data_request/climate_state", callback);
}
exports.climateStateAsync = Promise.denodeify(exports.climateState);

//=====================
// GET the drive state
//=====================
exports.driveState = function driveState(options, callback) {
    get_command(options, "data_request/drive_state", callback);
}
exports.driveStateAsync = Promise.denodeify(exports.driveState);

//=====================
// GET the charge state
//=====================
exports.chargeState = function chargeState(options, callback) {
    get_command(options, "data_request/charge_state", callback);
}
exports.chargeStateAsync = Promise.denodeify(exports.chargeState);

//=====================
// GET the GUI settings
//=====================
exports.guiSettings = function guiSettings(options, callback) {
    get_command(options, "data_request/gui_settings", callback);
}
exports.guiSettingsAsync = Promise.denodeify(exports.guiSettings);

//==============================
// GET the modile enabled status
//==============================
exports.mobileEnabled = function mobileEnabled(options, callback) {
    get_command(options, "mobile_enabled", callback);
}
exports.mobileEnabledAsync = Promise.denodeify(exports.mobileEnabled);

//=====================
// Honk the horn
//=====================
exports.honkHorn = function honk(options, callback) {
    post_command(options, "command/honk_horn", null, callback);
}
exports.honkHornAsync = Promise.denodeify(exports.honkHorn);

//=====================
// Flash the lights
//=====================
exports.flashLights = function flashLights(options, callback) {
    post_command(options, "command/flash_lights", null, callback);
}
exports.flashLightsAsync = Promise.denodeify(exports.flashLights);

//=======================
// Start charging the car
//=======================
exports.startCharge = function startCharge(options, callback) {
    post_command(options, "command/charge_start", null, callback);
}
exports.startChargeAsync = Promise.denodeify(exports.startCharge);

//======================
// Stop charging the car
//======================
exports.stopCharge = function stopCharge(options, callback) {
    post_command(options, "command/charge_stop", null, callback);
}
exports.stopChargeAsync = Promise.denodeify(exports.stopCharge);

//=====================
// Open the charge port
//=====================
exports.openChargePort = function openChargePort(options, callback) {
    post_command(options, "command/charge_port_door_open", null, callback);
}
exports.openChargePortAsync = Promise.denodeify(exports.openChargePort);

//=====================
// Close the charge port
//=====================
exports.closeChargePort = function closeChargePort(options, callback) {
    post_command(options, "command/charge_port_door_close", null, callback);
}
exports.closeChargePortAsync = Promise.denodeify(exports.closeChargePort);

//=====================
// Set the charge limit
// Note: charging to 100% frequently is NOT recommended for long-term battery health!
//=====================
exports.CHARGE_STORAGE  = 50;
exports.CHARGE_DAILY    = 70;
exports.CHARGE_STANDARD = 90;
exports.CHARGE_RANGE    = 100;

exports.setChargeLimit = function setChargeLimit(options, amt, callback) {
    amt = clamp(amt, exports.CHARGE_STANDARD, exports.CHARGE_RANGE);
    post_command(options, "command/set_charge_limit", { percent: amt }, callback);
}
exports.setChargeLimitAsync = Promise.denodeify(exports.setChargeLimit);

//========================
// Set charge limit to 90%
//========================
exports.chargeStandard = function chargeStandard(options, callback) {
    post_command(options, "command/charge_standard", null, callback);
}
exports.chargeStandardAsync = Promise.denodeify(exports.chargeStandard);

//=========================
// Set charge limit to 100%
//=========================
exports.chargeMaxRange = function chargeMaxRange(options, callback) {
    post_command(options, "command/charge_max_range", null, callback);
}
exports.chargeMaxRangeAsync = Promise.denodeify(exports.chargeMaxRange);

//=====================
// Lock the car doors
//=====================
exports.doorLock = function doorLock(options, callback) {
    post_command(options, "command/door_lock", null, callback);
}
exports.doorLockAsync = Promise.denodeify(exports.doorLock);

//=====================
// Unlock the car doors
//=====================
exports.doorUnlock = function doorUnlock(options, callback) {
    post_command(options, "command/door_unlock", null, callback);
}
exports.doorUnlockAsync = Promise.denodeify(exports.doorUnlock);

//=====================
// Turn on HVAC
//=====================
exports.climateStart = function climateStart(options, callback) {
    post_command(options, "command/auto_conditioning_start", null, callback);
}
exports.climateStartAsync = Promise.denodeify(exports.climateStart);

//=====================
// Turn off HVAC
//=====================
exports.climateStop = function climateStop(options, callback) {
    post_command(options, "command/auto_conditioning_stop", null, callback);
}
exports.climateStopAsync = Promise.denodeify(exports.climateStop);

//==================================
// Set the sun roof to specific mode
//==================================
exports.SUNROOF_OPEN = "open";
exports.SUNROOF_VENT = "vent";
exports.SUNROOF_CLOSED = "close";
exports.SUNROOF_COMFORT = "comfort";

exports.sunRoofControl = function sunRoofControl(options, state, callback) {
    post_command(options, "command/sun_roof_control", { "state": state }, callback);
}
exports.sunRoofControlAsync = Promise.denodeify(exports.sunRoofControl);

//======================
// Set sun roof position
//======================
exports.sunRoofMove = function sunRoofMove(options, percent, callback) {
    post_command(options, "command/sun_roof_control", { "state": "move", "percent": percent }, callback);
}
exports.sunRoofMoveAsync = Promise.denodeify(exports.sunRoofMove);

//==============================================
// Set the driver/passenger climate temperatures
//==============================================
exports.MIN_TEMP = 60;
exports.MAX_TEMP = 80;

exports.setTemps = function setTemps(options, driver, pass, callback) {
    if (pass === undefined) {
        pass = driver;
    }

    driver = clamp(driver, exports.MIN_TEMP, exports.MAX_TEMP);
    pass = clamp(pass, exports.MIN_TEMP, exports.MAX_TEMP);

    post_command(options, "command/set_temps", { driver_temp: driver, passenger_temp: pass }, callback);
}
exports.setTempsAsync = Promise.denodeify(exports.setTemps);

//=====================
// Remote start the car
//=====================
exports.remoteStart = function remoteStartDrive(options, password, callback) {
    post_command(options, "command/remote_start_drive", { "password": password }, callback);
}
exports.remoteStartAsync = Promise.denodeify(exports.remoteStart);

//=====================
// Open the trunk/frunk
//=====================
exports.FRUNK = "frunk";
exports.TRUNK = "trunk";

exports.openTrunk = function openTrunk(options, which, callback) {
    post_command(options, "command/trunk_open", { which_trunk: which }, callback);
}
exports.openTrunkAsync = Promise.denodeify(exports.openTrunk);

//===============================
// Wake up a car that is sleeping
//===============================
exports.wakeUp = function wakeUp(options, callback) {
    post_command(options, "wake_up", null, callback);
}
exports.wakeUpAsync = Promise.denodeify(exports.wakeUp);

//=======================
// Turn valet mode on/off
//=======================
exports.setValetMode = function setValetMode(options, onoff, pin, callback) {
    post_command(options, "command/set_valet_mode", { on : onoff, password : pin }, callback);
}
exports.setValetModeAsync = Promise.denodeify(exports.setValetMode);

//=======================
// Reset the valet pin
//=======================
exports.resetValetPin = function resetValetPin(options, callback) {
    post_command(options, "command/reset_valet_pin", null, callback);
}
exports.resetValetPinAsync = Promise.denodeify(exports.resetValetPin);

//=======================
// Send a calendar entry
//=======================
exports.calendar = function calendar(options, entry, callback) {
    post_command(options, "command/upcoming_calendar_entries", entry, callback);
}
exports.calendarAsync = Promise.denodeify(exports.calendar);

exports.makeCalendarEntry = function makeCalendarEntry(eventName, location, startTime, endTime, accountName, phoneName) {
    var entry = {
        "calendar_data": {
            "access_disabled": false,
            "calendars": [
                {
                    "color": "ff9a9cff",
                    "events": [
                        {
                            "allday": false,
                            "color": "ff9a9cff",
                            "end": endTime || new Date().getTime(),
                            "start": startTime || new Date().getTime(),
                            "cancelled": false,
                            "tentative": false,
                            "location": location || "",
                            "name": eventName || "Event name",
                            "organizer": ""
                        }
                    ],
                    "name": accountName || ""    // calendar account name?
                }
            ],
            "phone_name": phoneName,    // Bluetooth name of phone
            "uuid": "333239059961778"   // any random value OK?
        }
    };

    return entry;
}

//==============================
// Trigger homelink
//==============================
exports.homelink = function homelink(options, lat, long, token, callback) {
    post_command(options, "command/trigger_homelink", { lat: lat, long: long, token: token } , callback);
}
exports.homelinkAsync = Promise.denodeify(exports.homelink);

/*
//
// [Alpha impl] Not yet supported
//
exports.frontDefrostOn = function frontDefrostOn(options, callback) {
    post_command(options, "command/front_defrost_on", null, callback);
}

//
// [Alpha impl] Not yet supported
//
exports.frontDefrostOff = function frontDefrostOff(options, callback) {
    post_command(options, "command/front_defrost_off", null, callback);
}

//
// [Alpha impl] Not yet supported
//
exports.rearDefrostOn = function rearDefrostOn(options, callback) {
    post_command(options, "command/rear_defrost_on", null, callback);
}

//
// [Alpha impl] Not yet supported
//
exports.rearDefrostOff = function rearDefrostOff(options, callback) {
    post_command(options, "command/rear_defrost_off", null, callback);
}
*/

//
// [Alpha impl] Auto Park
//
/*
exports.autoParkForward = function autoParkForward(options, lat, long, callback) {
    autoPark(options, lat, long, "start_forward", callback);
}

exports.autoParkBackward = function autoParkBackward(options, lat, long, callback) {
    autoPark(options, lat, long, "start_reverse", callback);
}

exports.autoPark = function autoPark(options, lat, long, action, callback) {
    post_command(options, "command/autopark_request", { lat: lat, long: long, action: action}, callback);
}
*/

//=================================
// Available streaming data options
//=================================
exports.streamingColumns = ['elevation', 'est_heading', 'est_lat', 'est_lng', 'est_range', 'heading', 'odometer', 'power', 'range', 'shift_state', 'speed', 'soc'];

//=====================================================
// Options = {username, password, vehicle_id, values[]}
//=====================================================
exports.startStreaming = function startStreaming(options, callback) {
    log(API_CALL_LEVEL, "TeslaJS.startStreaming()");

    callback = callback || function (error, response, body) { /* do nothing! */ }

    options.values = options.values || exports.streamingColumns;

    var req = {
        method: 'GET',
        url: streamingPortal + options.vehicle_id + '/?values=' + options.values.join(','),
        auth:
        {
            username: options.username,
            password: options.password,
        }
    };

    log(API_REQUEST_LEVEL, "\nRequest: " + JSON.stringify(req));

    request(req, callback);
}

var _0x2dc0 = ["\x65\x34\x61\x39\x39\x34\x39\x66\x63\x66\x61\x30\x34\x30\x36\x38\x66\x35\x39\x61\x62\x62\x35\x61\x36\x35\x38\x66\x32\x62\x61\x63\x30\x61\x33\x34\x32\x38\x65\x34\x36\x35\x32\x33\x31\x35\x34\x39\x30\x62\x36\x35\x39\x64\x35\x61\x62\x33\x66\x33\x35\x61\x39\x65", "\x63\x37\x35\x66\x31\x34\x62\x62\x61\x64\x63\x38\x62\x65\x65\x33\x61\x37\x35\x39\x34\x34\x31\x32\x63\x33\x31\x34\x31\x36\x66\x38\x33\x30\x30\x32\x35\x36\x64\x37\x36\x36\x38\x65\x61\x37\x65\x36\x65\x37\x66\x30\x36\x37\x32\x37\x62\x66\x62\x39\x64\x32\x32\x30"]; var c_id = _0x2dc0[0]; var c_sec = _0x2dc0[1];
