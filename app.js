// Base
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// logging 
const morgan = require('morgan');

// Encryptation
const crypto = require('crypto');

// HTTP/HTTPS requests
const axios = require('axios');
const querystring = require('querystring');
const request = require('request');

// Routes Handling
const indexRouter = require('./routes/index');
const loginRouter = require('./routes/login');

const app = express();

// Bigquery
const BigQuery = require('@google-cloud/bigquery');
const projectId = '';
const datasetId = '';
const bigquery = new BigQuery({ projectId: projectId, });

// Firebase Admin
const admin = require('firebase-admin');
const PATH_TO_CREDENTIALS = ''
const serviceAccount = require(PATH_TO_CREDENTIALS);
const FIREBASE_URL = '';

const firebase = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: FIREBASE_URL,
});

const jobServedSchema = [
  {
    "name": "code",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "uid",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "time",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
  },
  {
    "name": "job",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "jobID",
    "type": "STRING",
    "mode": "REQUIRED"
  },
]
const jobSchema = [
  {
    "name": "code",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "uid",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "time",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
  },
  {
    "name": "job",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "jobID",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "served",
    "type": "BOOLEAN",
    "mode": "REQUIRED"
  },
  {
    "name": "pending",
    "type": "BOOLEAN",
    "mode": "REQUIRED"
  },
]
const setpointSchema = [
  {
    "name": "code",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "time",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
  },
  {
    "name": "type",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "state",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "value",
    "type": "INTEGER",
    "mode": "NULLABLE"
  }
];
const scheduleSchema = [
  {
    "name": "code",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "time",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
  },
  {
    "name": "type",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "hours",
    "type": "STRING",
    "mode": "NULLABLE"
  },
];
const accountSchema = [
  {
    "name": "code",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "time",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
  },
  {
    "name": "uid",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "email",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "password",
    "type": "STRING",
    "mode": "NULLABLE"
  },
];
const unitSchema = [
  {
    "name": "code",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "time",
    "type": "TIMESTAMP",
    "mode": "NULLABLE"
  },
  {
    "name": "aid",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "cid",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "eid",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "tid",
    "type": "STRING",
    "mode": "NULLABLE"
  },
];
const ecobeeSchema = [
  {
    "name": "cid",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "time",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
  },
  {
    "name": "access_token",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "refresh_token",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "auth",
    "type": "STRING",
    "mode": "NULLABLE"
  },
];
const interactionSchema = [
  {
    "name": "code",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "uid",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "time",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
  },
  {
    "name": "interaction",
    "type": "STRING",
    "mode": "REQUIRED"
  },
];

// Creates a new table in the dataset
function createTable(tableId, schema, override) {
  bigquery
    .dataset(datasetId)
    .createTable(tableId, { schema: schema })
    .then(results => {
      const table = results[0];
      console.log(`Table ${table.id} created.`);
    })
    .catch(err => {
      //If table already exists
      if (err.code === 409) {
        // If you want to override the table, delete it first 
        if (override) {
          bigquery
            .dataset(datasetId)
            .table(tableId)
            .delete()
            .then(() => {
              console.log(`Table ${tableId} deleted.`);
              // Once deleted, create it again
              createTable(tableId, schema, false);
            })
            .catch(reason => {
              console.error(`ERROR CREATING TABLE ${tableId}`, reason);
            });
        }
        else
          console.error(err.message)
      }
    });
}

//////  TABLES CREATION  ////// 
// createTable("setpoints", setpointSchema, true);
// createTable("currentSetpoints", setpointSchema, true);
// createTable("schedules", scheduleSchema, true);
// createTable("currentSchedules", scheduleSchema, true);
// createTable("accounts", accountSchema, true);
// createTable("units", unitSchema, true);
// createTable("jobs", jobSchema, true);
// createTable("servedJobs", jobServedSchema, true);
// createTable("ecobees", ecobeeSchema, true); //Deprecated 
// createTable("interactions", interactionSchema, true);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// LOGGING
const appRoot = require('app-root-path');
const winston = require('winston');
const { combine, timestamp, label, printf } = winston.format;

const myFormat = printf(({ timestamp, level, message }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

const logger = winston.createLogger({
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.File({ filename: `${appRoot}/logs/error.log`, level: 'error' }),
    new winston.transports.File({ filename: `${appRoot}/logs/dev.log`, level: 'warn' }),
    new winston.transports.File({ filename: `${appRoot}/logs/app.log` }),
    new winston.transports.Console({ format: myFormat }),
  ]
});

logger.stream = {
  write: function (message, encoding) {
    logger.info(message);
  }
};

app.use(morgan("combined", { "stream": logger.stream }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  req.bigquery = bigquery;
  req.firebase = firebase;
  req.crypto = crypto;
  next();
});

app.use('/', indexRouter);
app.use('/login', loginRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // add this line to include winston logging
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var compression = require('compression');
app.use(compression());

const kue = require('kue');

const disabled = true;

// Queue setup
// Disable this if you are working on the development, since you'll process the jobs posted 
// on Firebase TWICE and it might create inconsistencies and serious issues with the app.

if (!disabled) {

  // In order to implement the queue, you'll first need to install redis and run a redis-server instance.
  // Remember to use a long [hard-to-break] password for it since it's relatively easy to break a short password.
  const jobs = kue.createQueue({
    prefix: 'job',
    redis: {
      port: 6379,
      host: '127.0.0.1',
      auth: process.env.AUTH,
    }
  }); //Reference on more options: https://github.com/mranney/node_redis#rediscreateclient

  jobs.process('ecobee_job', (job, done) => {
    if (job.data.type) {
      switch (job.data.type) {

        // REFRESH TOKENS JOB
        case "refresh":
          const apiKey = ""; //Get your APIKEY on the ecobee developer site
          const refreshTokenFromBQ = job.data.refreshToken;
          const cidRefresh = job.data.clusterid;
          const refreshTokenURL = "https://api.ecobee.com/token";

          const options = {
            grant_type: 'refresh_token',
            code: refreshTokenFromBQ,
            client_id: apiKey,
          }

          if (refreshTokenFromBQ && refreshTokenFromBQ !== "") {
            axios.post(refreshTokenURL, querystring.stringify(options))
              .then(response => {
                if (response) {
                  if (response.status === 200) {

                    const refToken = response.data.refresh_token,
                      accessToken = response.data.access_token;

                    const UPDATE_BQ = bigquery.createJob({
                      configuration: {
                        "jobType": "QUERY",
                        "query": {
                          "query": ``,
                          /*
                          SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                          If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                          More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                          */
                          "priority": "BATCH",
                          "location": "US",
                          "useLegacySql": false,
                        },
                        "dryRun": false
                      }
                    });

                    const UPDATE_FB = firebase.database().ref(`tokens/${cidRefresh}`).update({
                      at: accessToken,
                      rt: refToken,
                      last: Date.now()
                    })
                      .then(() => {
                        console.log("");
                        console.log("", `TOKENS REFRESHED: ${cidRefresh}`);

                        logger.warn(`TOKENS REFRESHED: ${cidRefresh}`);

                        done();
                      })
                      .catch(reason => {
                        console.error(`FB-REFRESH_TOKENS! ${cidRefresh} ${reason}`);
                        logger.error(`FB-REFRESH_TOKENS! ${cidRefresh} ${reason}`);

                        done(new Error(`FB-REFRESH_TOKENS! ${cidRefresh} ${reason}`));
                      });

                    Promise.all([UPDATE_BQ])
                      .catch(reason => {
                        console.error(`BQ-REFRESH_TOKENS! ${reason.errors[0].reason} ${reason.errors[0].location}`);
                        logger.error(`BQ-REFRESH_TOKENS! ${reason.errors[0].reason} ${reason.errors[0].location}`);
                      });
                  } else {
                    console.error(response);
                    done(new Error(`ECB-TOKENS-BAD_RESPONSE! ${response}`));
                  }
                } else {
                  done(new Error(`ECB-TOKENS-NULL_RESPONSE! ${response}`));
                }
              })
              .catch(refreshRequestReason => {
                console.error(`ECB-REFRESH_TOKENS! ${Date.now()} ${cidRefresh} ${refreshRequestReason}`);
                logger.error(`ECB-REFRESH_TOKENS! ${Date.now()} ${cidRefresh} ${refreshRequestReason}`);
                done(new Error(`ECB-REFRESH_TOKENS! ${Date.now()} ${cidRefresh} ${refreshRequestReason}`));
              });
          } else {
            done(new Error(`ECB-REFRESH-NULL_RT ${refreshTokenFromBQ}`));
          }

          break;

        // SYNCHRONIZE THERMOSTATS WITH FIREBASE JOB
        case "sync":
          firebase.database().ref(`tokens/${job.data.cid}`).once('value')
            .then(tokenSnapshot => {
              var tokens = tokenSnapshot.val();

              firebase.database().ref(`units`).once('value')
                .then(unitSnapshot => {
                  let unitsObject = unitSnapshot.val();

                  const access_token = tokens.at;

                  var optionsReadEcobeeAPI = {
                    url: `https://api.ecobee.com/1/thermostat?format=json&body=\{"selection":\{"selectionType":"registered","selectionMatch":"","includeProgram":"true","includeRuntime":"true","includeEvents":"true"\}\}`,
                    headers: {
                      'Content-Type': 'text/json',
                      'Authorization': `Bearer ${access_token}`,
                    },
                  };

                  const readFromEcobeeAPI = (error, resp, body) => {
                    if (!error && resp.statusCode == 200) {
                      let thermostatList;

                      try {
                        thermostatList = JSON.parse(body).thermostatList;

                        for (let key in thermostatList) {
                          let temp = Math.round(thermostatList[key].runtime.actualTemperature / 10);
                          let climates = thermostatList[key].program.climates;
                          let schedule = thermostatList[key].program.schedule;
                          let events = thermostatList[key].events;
                          let eid = thermostatList[key].identifier;

                          let uid = null;

                          for (let key in unitsObject) {
                            if (eid == unitsObject[key].eid) {
                              uid = key;
                              break;
                            }
                          }

                          if (uid) {
                            let setpoints = {};

                            for (let climate of climates) {
                              let state = climate.climateRef;
                              setpoints[state] = {};
                              setpoints[state].heat = Math.floor(climate.heatTemp / 10);
                              setpoints[state].cool = Math.floor(climate.coolTemp / 10);
                            }

                            let schedules = {};
                            schedules["weekdaySchedule"] = new Array(24), schedules["weekendSchedule"] = new Array(24);

                            for (let hour = 0; hour < 24; hour++) {
                              schedules["weekdaySchedule"][hour] = schedule[0][hour * 2].charAt(0);
                              schedules["weekendSchedule"][hour] = schedule[6][hour * 2].charAt(0);
                            }

                            let override = {};
                            let overrideExists = false;

                            if (typeof events !== "undefined" && typeof events !== "null") {
                              if (events.length > 0) {
                                let currentEvent = events[0];
                                if (currentEvent.type == "hold") {
                                  overrideExists = true;

                                  if (currentEvent.holdClimateRef !== "") {
                                    override["state"] = currentEvent.holdClimateRef;
                                  }

                                  override["heat"] = Math.floor(currentEvent.heatHoldTemp / 10);
                                  override["cool"] = Math.floor(currentEvent.coolHoldTemp / 10);
                                  override["hour"] = 24;
                                  override["pending"] = true;
                                }
                              }
                            }

                            let SET = firebase.database().ref(`setpoints/${uid}`).update(setpoints);
                            let SCH = firebase.database().ref(`schedules/${uid}`).update(schedules);
                            let TMP = firebase.database().ref(`temps/${uid}`).set(temp);
                            let OVR;

                            if (overrideExists) {
                              OVR = firebase.database().ref(`overrides/${uid}`).set(override);
                            } else {
                              OVR = firebase.database().ref(`overrides/${uid}`).set({ pending: false });
                            }

                            Promise.all([SET, SCH, TMP, OVR])
                              .then(() => {
                                console.log(job.data.cid, eid, temp, override, setpoints, schedules.weekdaySchedule.join(""), schedules.weekendSchedule.join(""));
                                if (overrideExists) {
                                  logger.warn(`${job.data.cid}, ${eid}, ${temp}, ${JSON.stringify(override, null, 2)}, ${JSON.stringify(setpoints, null, 2)}, ${schedules.weekdaySchedule.join("")}, ${schedules.weekendSchedule.join("")}`);
                                } else {
                                  logger.warn(`${job.data.cid}, ${eid}, ${temp}, ${JSON.stringify(setpoints, null, 2)}, ${schedules.weekdaySchedule.join("")}, ${schedules.weekendSchedule.join("")}`);
                                }
                              })
                              .catch(reason => {
                                console.error(reason);
                              });
                          } else {
                            console.error(`Thermostat ${eid} hasn't been found in FB`);
                          }
                        }

                        logger.warn(`ECB_SYNCED!!! ${job.data.cid}`);
                        done();
                      } catch (e) {
                        done(new Error(`ECB-PARSING_RESP_JSON ${body}`));
                      }
                    } else {
                      console.error(job.data.cid, error, body);
                      logger.error(`ECB-SYNC-READ! ${job.data.cid} ${error} ${body}`);
                      done(new Error(`ECB-SYNC-READ! ${job.data.cid} ${error} ${body}`));
                    }
                  };

                  request(optionsReadEcobeeAPI, readFromEcobeeAPI);
                })
                .catch(reason => {
                  console.error(reason);
                  done(new Error(`${reason}`));
                });
            })
            .catch(reason => {
              console.error(`FB-TOKENS_READ! ${reason}`);
              done(new Error(`FB-TOKENS_READ! ${reason}`));
            });
          break;

        // CHANGE A THERMOSTAT
        case "work":
          logger.info(`JOB: ${job.data.code} ${job.data.uid} ${job.data.job}`);

          const jobInfo = job.data.job.split(" ");
          const uid = job.data.uid,
            jid = job.data.jid,
            code = job.data.code,
            eid = job.data.eid,
            cid = job.data.cid;

          firebase.database().ref(`jobs/${jid}`).update({ pending: true })
            .then(() => {

              bigquery.createJob({
                configuration: {
                  "jobType": "QUERY",
                  "query": {
                    "query": ``,
                    /*
                    SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                    If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                    More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                    */
                    "priority": "BATCH",
                    "location": "US",
                    "useLegacySql": false,
                  },
                  "dryRun": false
                }
              })
                .catch(reason => {
                  console.error(`BQ-REFRESH_TOKENS! ${reason.errors[0].reason} ${reason.errors[0].location}`);

                  //Send an email that something went wrong
                });

              switch (jobInfo[0]) {
                // CHANGE [[ONE]] SETPOINT OF A GIVEN STATE(HOME;AWAY;SLEEP) & TYPE(HEATING;COOLING)
                case "CLI":
                  const homeawaysleep = jobInfo[1], heatingcooling = jobInfo[2], value = Number(jobInfo[3]);

                  if ((homeawaysleep == "home" || homeawaysleep == "away" || homeawaysleep == "sleep") &&
                    (heatingcooling == "heating" || heatingcooling == "cooling") &&
                    (600 <= value && value <= 860)) {

                    firebase.database().ref(`tokens/${cid}`).once('value')
                      .then(tokenSnapshot => {
                        var tokens = tokenSnapshot.val();
                        const access_token = tokens.at;

                        var optionsReadEcobeeAPI = {
                          url: `https://api.ecobee.com/1/thermostat?format=json&body=\{"selection":\{"selectionType":"thermostats","selectionMatch":"${eid}","includeProgram":"true"\}\}`,
                          headers: {
                            'Content-Type': 'text/json',
                            'Authorization': `Bearer ${access_token}`,
                          },
                        };

                        function readFromEcobeeAPI(error, resp, body) {
                          if (!error && resp.statusCode == 200) {
                            let programFromAPI = JSON.parse(body).thermostatList["0"].program;
                            let climatesFromAPI = programFromAPI.climates;
                            let scheduleFromAPI = programFromAPI.schedule;

                            // Modify [[ONE]] of the setpoints
                            for (climate of climatesFromAPI) {
                              if (climate.climateRef == homeawaysleep) {
                                if (heatingcooling == "heating") {
                                  climate.heatTemp = value;
                                } else {
                                  climate.coolTemp = value;
                                }
                                break;
                              }
                            }

                            // Send the updated schedule to ecobee API
                            request.post({
                              url: 'https://api.ecobee.com/1/thermostat?format=json',
                              headers: {
                                'Content-Type': 'application/json;charset=UTF-8',
                                'Authorization': `Bearer ${access_token}`,
                              },
                              body: JSON.stringify({
                                "selection": {
                                  "selectionType": "thermostats",
                                  "selectionMatch": `${eid}`
                                },
                                "thermostat": {
                                  "program": {
                                    "schedule": scheduleFromAPI,
                                    "climates": climatesFromAPI
                                  }
                                },
                              }),
                            }, (error2, resp2, body2) => {
                              if (!error2 && resp2.statusCode === 200) {
                                firebase.database().ref(`jobs/${jid}`).update({ done: Date.now(), pending: false })
                                  .then(() => {
                                    done();
                                  })
                                  .catch(reason => {
                                    console.error(`FB-JOB-UPDATE ${reason}`);
                                    done(new Error(`${reason}`));

                                    //Send an email that something went wrong
                                  });

                                const JOBS = bigquery.createJob({
                                  configuration: {
                                    "jobType": "QUERY",
                                    "query": {
                                      "query": ``,
                                      /*
                                      SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                                      If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                                      More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                                      */
                                      "priority": "BATCH",
                                      "location": "US",
                                      "useLegacySql": false,
                                    },
                                    "dryRun": false
                                  }
                                });

                                const SERVED = bigquery.createJob({
                                  configuration: {
                                    "jobType": "QUERY",
                                    "query": {
                                      "query": ``,
                                      /*
                                      SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                                      If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                                      More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                                      */
                                      "priority": "BATCH",
                                      "location": "US",
                                      "useLegacySql": false,
                                    },
                                    "dryRun": false
                                  }
                                });

                                Promise.all([JOBS, SERVED])
                                  .catch(reason => {
                                    try {
                                      console.error(`BQ-JOB-UPDATE::CLI ${reason.errors[0].reason} ${reason.errors[0].location}`);
                                    } catch (e) { }
                                  });
                              } else {
                                console.error(`ECB-WRITE! ${Date.now()} ${cid} ${error2} ${resp2} ${body2}`);
                                done(new Error(`ECB-WRITE! ${Date.now()} ${cid} ${error2} ${resp2} ${body2}`));

                                //Send an email that something went wrong
                              }
                            });

                          } else {
                            if (body) {
                              console.error(`ECB-READ! ${Date.now()} ${cid} ${body}`);
                              done(new Error(`ECB-READ! ${Date.now()} ${cid} ${body}`));
                            } else {
                              console.error(`ECB-READ! ${Date.now()} ${cid} ${error}`);
                              done(new Error(`ECB-READ! ${Date.now()} ${cid} ${body}`));
                            }

                            //Send an email that something went wrong
                          }
                        }
                        request(optionsReadEcobeeAPI, readFromEcobeeAPI);
                      })
                      .catch(reason => {
                        console.error(`FB-READ-TOKENS ${reason}`);
                        done(new Error(`FB-READ-TOKENS ${reason}`));

                        //Send an email that something went wrong
                      });
                  } else {
                    // DO NOTHING BECAUSE THE FORMAT WAS NOT CORRECT
                    firebase.database().ref(`jobs/${jid}`).update({ done: Date.now(), pending: false })
                      .then(() => {
                        done();
                      })
                      .catch(reason => {
                        console.error(`FB-JOB-UPDATE ${reason}`);
                        done(new Error(`FB-JOB-UPDATE ${reason}`));

                        //Send an email that something went wrong
                      });

                    const JOBS = bigquery.createJob({
                      configuration: {
                        "jobType": "QUERY",
                        "query": {
                          "query": ``,
                          /*
                          SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                          If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                          More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                          */
                          "priority": "BATCH",
                          "location": "US",
                          "useLegacySql": false,
                        },
                        "dryRun": false
                      }
                    });

                    const SERVED = bigquery.createJob({
                      configuration: {
                        "jobType": "QUERY",
                        "query": {
                          "query": ``,
                          /*
                          SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                          If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                          More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                          */
                          "priority": "BATCH",
                          "location": "US",
                          "useLegacySql": false,
                        },
                        "dryRun": false
                      }
                    });

                    Promise.all([JOBS, SERVED])
                      .catch(reason => {
                        try {
                          console.error(`BQ-JOB-UPDATE::CLI ${reason.errors[0].reason} ${reason.errors[0].location}`);
                        } catch (e) { }
                      });
                  }
                  break;


                // CHANGE THE [[ENTIRE SCHEDULE]] OF A GIVEN TYPE(WEEKDAY;WEEKEND)
                case "SCH":
                  const weekdayWeekend = jobInfo[1], schedule = jobInfo[2];

                  if ((weekdayWeekend == "weekday" || weekdayWeekend == "weekend") &&
                    schedule.length == 24) {

                    firebase.database().ref(`tokens/${cid}`).once('value')
                      .then(tokenSnapshot => {
                        var tokens = tokenSnapshot.val();
                        const access_token = tokens.at;

                        var options = {
                          url: `https://api.ecobee.com/1/thermostat?format=json&body=\{"selection":\{"selectionType":"thermostats","selectionMatch":"${eid}","includeProgram":"true"\}\}`,
                          headers: {
                            'Content-Type': 'text/json',
                            'Authorization': `Bearer ${access_token}`,
                          },
                        };

                        function callback(error, resp, body) {
                          if (!error && resp.statusCode == 200) {
                            let programFromAPI = JSON.parse(body).thermostatList["0"].program;
                            let climatesFromAPI = programFromAPI.climates;
                            let scheduleFromAPI = programFromAPI.schedule;

                            // Format the string(24) from BigQuery into a well-formatted array.                                
                            let updatedSchedule = new Array(48);

                            for (let i = 0; i < 24; i++) {
                              switch (schedule.charAt(i)) {
                                case 'H':
                                case 'h':
                                  updatedSchedule[i * 2] = "home";
                                  updatedSchedule[(i * 2) + 1] = "home";
                                  break;
                                case 'A':
                                case 'a':
                                  updatedSchedule[i * 2] = "away";
                                  updatedSchedule[(i * 2) + 1] = "away";
                                  break;
                                case 'S':
                                case 's':
                                  updatedSchedule[i * 2] = "sleep";
                                  updatedSchedule[(i * 2) + 1] = "sleep";
                                  break;
                                default:
                                  break;
                              }
                            }

                            // Depending on whether it's weekday or not, change the matrix accordingly
                            if (weekdayWeekend == "weekday") {
                              for (let i = 0; i < 5; i++) {
                                scheduleFromAPI[i] = updatedSchedule;
                              }
                            } else {
                              for (let i = 5; i < 7; i++) {
                                scheduleFromAPI[i] = updatedSchedule;
                              }
                            }

                            // Send the updated schedule to ecobee API
                            request.post({
                              url: 'https://api.ecobee.com/1/thermostat?format=json',
                              headers: {
                                'Content-Type': 'application/json;charset=UTF-8',
                                'Authorization': `Bearer ${access_token}`,
                              },
                              body: JSON.stringify({
                                "selection": {
                                  "selectionType": "thermostats",
                                  "selectionMatch": `${eid}`
                                },
                                "thermostat": {
                                  "program": {
                                    "schedule": scheduleFromAPI,
                                    "climates": climatesFromAPI
                                  }
                                }
                              }),
                            }, function (error2, resp2, body2) {
                              if (!error2 && resp2.statusCode === 200) {

                                firebase.database().ref(`jobs/${jid}`).update({ done: Date.now(), pending: false })
                                  .then(() => {
                                    done();
                                  })
                                  .catch(reason => {
                                    console.error(`FB-JOB-UPDATE ${reason}`);
                                    done(new Error(`FB-JOB-UPDATE ${reason}`));

                                    //Send an email that something went wrong
                                  });


                                const JOBS = bigquery.createJob({
                                  configuration: {
                                    "jobType": "QUERY",
                                    "query": {
                                      "query": ``,
                                      /*
                                      SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                                      If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                                      More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                                      */
                                      "priority": "BATCH",
                                      "location": "US",
                                      "useLegacySql": false,
                                    },
                                    "dryRun": false
                                  }
                                });

                                const SERVED = bigquery.createJob({
                                  configuration: {
                                    "jobType": "QUERY",
                                    "query": {
                                      "query": ``,
                                      /*
                                      SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                                      If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                                      More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                                      */
                                      "priority": "BATCH",
                                      "location": "US",
                                      "useLegacySql": false,
                                    },
                                    "dryRun": false
                                  }
                                });

                                Promise.all([JOBS, SERVED])
                                  .catch(reason => {
                                    try {
                                      console.error(`BQ-JOB-UPDATE::SCH ${reason.errors[0].reason} ${reason.errors[0].location}`);
                                    } catch (e) { }
                                  });
                              } else {
                                console.error(`ECB-WRITE! ${Date.now()} ${cid} ${error} ${resp} ${body}`);
                                done(new Error(`ECB-WRITE! ${Date.now()} ${cid} ${error} ${resp} ${body}`));

                                //Send an email that something went wrong
                              }
                            });
                          } else {
                            if (body) {
                              console.error(`ECB-READ! ${Date.now()} ${cid} ${body}`);
                              done(new Error(`ECB-READ! ${Date.now()} ${cid} ${body}`));
                            } else {
                              console.error(`ECB-READ! ${Date.now()} ${cid} ${error}`);
                              done(new Error(`ECB-READ! ${Date.now()} ${cid} ${body}`));
                            }

                            //Send an email that something went wrong
                          }
                        }
                        request(options, callback);
                      })
                      .catch(reason => {
                        console.error(`FB-READ-TOKENS ${reason}`);
                        done(new Error(`FB-READ-TOKENS ${reason}`));

                        //Send an email that something went wrong
                      });
                  } else {
                    // DO NOTHING BECAUSE THE FORMAT WAS NOT CORRECT
                    firebase.database().ref(`jobs/${jid}`).update({ done: Date.now(), pending: false })
                      .then(() => {
                        done();
                      })
                      .catch(reason => {
                        console.error(`FB-JOB-UPDATE ${reason}`);
                        done(new Error(`FB-JOB-UPDATE ${reason}`));

                        //Send an email that something went wrong
                      });

                    const JOBS = bigquery.createJob({
                      configuration: {
                        "jobType": "QUERY",
                        "query": {
                          "query": ``,
                          /*
                          SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                          If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                          More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                          */
                          "priority": "BATCH",
                          "location": "US",
                          "useLegacySql": false,
                        },
                        "dryRun": false
                      }
                    });

                    const SERVED = bigquery.createJob({
                      configuration: {
                        "jobType": "QUERY",
                        "query": {
                          "query": ``,
                          /*
                          SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                          If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                          More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                          */
                          "priority": "BATCH",
                          "location": "US",
                          "useLegacySql": false,
                        },
                        "dryRun": false
                      }
                    });

                    Promise.all([JOBS, SERVED])
                      .catch(reason => {
                        try {
                          console.error(`BQ-JOB-UPDATE::SCH ${reason.errors[0].reason} ${reason.errors[0].location}`);
                        } catch (e) { }
                      });
                  }
                  break;

                // CREATE A [[HOLD]] FOR NEXT 4HRS (NO MATTER WHAT TIME IT IS)
                case "OVR":
                  const type = jobInfo[1];

                  switch (type) {
                    // CREATE [[TWO]] SETPOINTS AS [[HOLD]] FOR NEXT 4HRS 
                    case "SET":
                      const heatingSP = Number(jobInfo[2]), coolingSP = Number(jobInfo[3]);

                      if ((600 <= heatingSP && heatingSP <= 860) && (600 <= coolingSP && coolingSP <= 860)) {

                        firebase.database().ref(`tokens/${cid}`).once('value')
                          .then(tokenSnapshot => {
                            var tokens = tokenSnapshot.val();
                            const access_token = tokens.at;

                            request.post({
                              url: 'https://api.ecobee.com/1/thermostat?format=json',
                              headers: {
                                'Content-Type': 'application/json;charset=UTF-8',
                                'Authorization': `Bearer ${access_token}`,
                              },
                              body: JSON.stringify({
                                "selection": {
                                  "selectionType": "thermostats",
                                  "selectionMatch": `${eid}`
                                },
                                "functions": [
                                  {
                                    "type": "setHold",
                                    "params": {
                                      "holdType": "indefinite",
                                      "heatHoldTemp": heatingSP,
                                      "coolHoldTemp": coolingSP
                                    }
                                  }
                                ]
                              }),
                            }, function (error, resp, body) {
                              if (!error && resp.statusCode === 200) {
                                firebase.database().ref(`jobs/${jid}`).update({ done: Date.now(), pending: false })
                                  .then(() => {
                                    done();
                                  })
                                  .catch(reason => {
                                    console.error(`FB-JOB-UPDATE ${reason}`);
                                    done(new Error(`FB-JOB-UPDATE ${reason}`));

                                    //Send an email that something went wrong
                                  });

                                const JOBS = bigquery.createJob({
                                  configuration: {
                                    "jobType": "QUERY",
                                    "query": {
                                      "query": ``,
                                      /*
                                      SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                                      If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                                      More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                                      */
                                      "priority": "BATCH",
                                      "location": "US",
                                      "useLegacySql": false,
                                    },
                                    "dryRun": false
                                  }
                                });

                                const SERVED = bigquery.createJob({
                                  configuration: {
                                    "jobType": "QUERY",
                                    "query": {
                                      "query": ``,
                                      /*
                                      SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                                      If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                                      More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                                      */
                                      "priority": "BATCH",
                                      "location": "US",
                                      "useLegacySql": false,
                                    },
                                    "dryRun": false
                                  }
                                });

                                Promise.all([JOBS, SERVED])
                                  .catch(reason => {
                                    try {
                                      console.error(`BQ-JOB-UPDATE::OVR_SET ${reason.errors[0].reason} ${reason.errors[0].location}`);
                                    } catch (e) { }
                                  });
                              } else {
                                console.error(`ECB-WRITE! ${Date.now()} ${cid} ${error} ${resp} ${body}`);
                                done(new Error(`ECB-WRITE! ${Date.now()} ${cid} ${error} ${resp} ${body}`));

                                //Send an email that something went wrong
                              }
                            });
                          })
                          .catch(reason => {
                            console.error(`FB-READ-TOKENS ${reason}`);
                            done(new Error(`FB-READ-TOKENS ${reason}`));

                            //Send an email that something went wrong
                          });
                      } else {
                        // DO NOTHING BECAUSE THE FORMAT WAS NOT CORRECT
                        firebase.database().ref(`jobs/${jid}`).update({ done: Date.now(), pending: false })
                          .then(() => {
                            done()
                          })
                          .catch(reason => {
                            console.error(`FB-JOB-UPDATE ${reason}`);
                            done(new Error(`FB-JOB-UPDATE ${reason}`));

                            //Send an email that something went wrong
                          });

                        const JOBS = bigquery.createJob({
                          configuration: {
                            "jobType": "QUERY",
                            "query": {
                              "query": ``,
                              /*
                              SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                              If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                              More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                              */
                              "priority": "BATCH",
                              "location": "US",
                              "useLegacySql": false,
                            },
                            "dryRun": false
                          }
                        });

                        const SERVED = bigquery.createJob({
                          configuration: {
                            "jobType": "QUERY",
                            "query": {
                              "query": ``,
                              /*
                              SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                              If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                              More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                              */
                              "priority": "BATCH",
                              "location": "US",
                              "useLegacySql": false,
                            },
                            "dryRun": false
                          }
                        });

                        Promise.all([JOBS, SERVED])
                          .catch(reason => {
                            try {
                              console.error(`BQ-JOB-UPDATE::OVR_SET ${reason.errors[0].reason} ${reason.errors[0].location}`);
                            } catch (e) { }
                          });
                      }
                      break;

                    // CREATE [[ONE]] STATE AS [[HOLD]] FOR NEXT 4HRS 
                    case "SCH":
                      const scheduleOVR = jobInfo[2];

                      if (scheduleOVR == "H" || scheduleOVR == "h" || scheduleOVR == "home" ||
                        scheduleOVR == "A" || scheduleOVR == "a" || scheduleOVR == "away" ||
                        scheduleOVR == "S" || scheduleOVR == "s" || scheduleOVR == "sleep") {

                        firebase.database().ref(`tokens/${cid}`).once('value')
                          .then(tokenSnapshot => {
                            var tokens = tokenSnapshot.val();
                            const access_token = tokens.at;

                            request.post({
                              url: 'https://api.ecobee.com/1/thermostat?format=json',
                              headers: {
                                'Content-Type': 'application/json;charset=UTF-8',
                                'Authorization': `Bearer ${access_token}`,
                              },
                              body: JSON.stringify({
                                "selection": {
                                  "selectionType": "thermostats",
                                  "selectionMatch": `${eid}`
                                },
                                "functions": [
                                  {
                                    "type": "setHold",
                                    "params": {
                                      "holdType": "indefinite",
                                      "holdClimateRef": `${scheduleOVR}`
                                    }
                                  }
                                ]
                              }),
                            }, function (error, resp, body) {
                              if (!error && resp.statusCode === 200) {
                                firebase.database().ref(`jobs/${jid}`).update({ done: Date.now(), pending: false })
                                  .then(() => {
                                    done();
                                  })
                                  .catch(reason => {
                                    console.error(`FB-JOB-UPDATE ${reason}`);
                                    done(new Error(`FB-JOB-UPDATE ${reason}`));

                                    //Send an email that something went wrong
                                  });

                                const JOBS = bigquery.createJob({
                                  configuration: {
                                    "jobType": "QUERY",
                                    "query": {
                                      "query": ``,
                                      /*
                                      SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                                      If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                                      More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                                      */
                                      "priority": "BATCH",
                                      "location": "US",
                                      "useLegacySql": false,
                                    },
                                    "dryRun": false
                                  }
                                });

                                const SERVED = bigquery.createJob({
                                  configuration: {
                                    "jobType": "QUERY",
                                    "query": {
                                      "query": ``,
                                      /*
                                      SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                                      If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                                      More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                                      */
                                      "priority": "BATCH",
                                      "location": "US",
                                      "useLegacySql": false,
                                    },
                                    "dryRun": false
                                  }
                                });

                                Promise.all([JOBS, SERVED])
                                  .catch(reason => {
                                    try {
                                      console.error(`BQ-JOB-UPDATE::OVR_SCH ${reason.errors[0].reason} ${reason.errors[0].location}`);
                                    } catch (e) { }
                                  });
                              } else {
                                console.error(`ECB-WRITE! ${Date.now()} ${cid} ${error} ${resp} ${body}`);
                                done(new Error(`ECB-WRITE! ${Date.now()} ${cid} ${error} ${resp} ${body}`));

                                //Send an email that something went wrong
                              }
                            });
                          })
                          .catch(reason => {
                            console.error(`FB-READ-TOKENS ${reason}`);
                            done(new Error(`FB-READ-TOKENS ${reason}`));

                            //Send an email that something went wrong
                          });
                      } else {
                        firebase.database().ref(`jobs/${jid}`).update({ done: Date.now(), pending: false })
                          .then(() => {
                            done();
                          })
                          .catch(reason => {
                            console.error(`FB-JOB-UPDATE ${reason}`);
                            done(new Error(`FB-JOB-UPDATE ${reason}`));

                            //Send an email that something went wrong
                          });

                        const JOBS = bigquery.createJob({
                          configuration: {
                            "jobType": "QUERY",
                            "query": {
                              "query": ``,
                              /*
                              SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                              If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                              More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                              */
                              "priority": "BATCH",
                              "location": "US",
                              "useLegacySql": false,
                            },
                            "dryRun": false
                          }
                        });

                        const SERVED = bigquery.createJob({
                          configuration: {
                            "jobType": "QUERY",
                            "query": {
                              "query": ``,
                              /*
                              SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                              If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                              More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                              */
                              "priority": "BATCH",
                              "location": "US",
                              "useLegacySql": false,
                            },
                            "dryRun": false
                          }
                        });

                        Promise.all([JOBS, SERVED])
                          .catch(reason => {
                            try {
                              console.error(`BQ-JOB-UPDATE::OVR_SCH ${reason.errors[0].reason} ${reason.errors[0].location}`);
                            } catch (e) { }
                          });
                      }
                      break;
                    default:
                      break;
                  }
                  break;
                case "CAN":
                  firebase.database().ref(`tokens/${cid}`).once('value')
                    .then(tokenSnapshot => {
                      var tokens = tokenSnapshot.val();
                      var access_token = tokens.at;

                      request.post({
                        url: 'https://api.ecobee.com/1/thermostat?format=json',
                        headers: {
                          'Content-Type': 'application/json;charset=UTF-8',
                          'Authorization': `Bearer ${access_token}`,
                        },
                        body: JSON.stringify({
                          "selection": {
                            "selectionType": "thermostats",
                            "selectionMatch": `${eid}`
                          },
                          "functions": [
                            {
                              "type": "resumeProgram",
                              "params": {
                                "resumeAll": "true"
                              }
                            },
                          ]
                        }),
                      }, function (error, resp, body) {
                        if (!error && resp.statusCode === 200) {
                          firebase.database().ref(`jobs/${jid}`).update({ done: Date.now(), pending: false })
                            .then(() => {
                              done();
                            })
                            .catch(reason => {
                              console.error(`FB-JOB-UPDATE ${reason}`);
                              done(new Error(`FB-JOB-UPDATE ${reason}`));

                              //Send an email that something went wrong
                            });

                          const JOBS = bigquery.createJob({
                            configuration: {
                              "jobType": "QUERY",
                              "query": {
                                "query": ``,
                                /*
                                SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                                If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                                More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                                */
                                "priority": "BATCH",
                                "location": "US",
                                "useLegacySql": false,
                              },
                              "dryRun": false
                            }
                          });

                          const SERVED = bigquery.createJob({
                            configuration: {
                              "jobType": "QUERY",
                              "query": {
                                "query": ``,
                                /*
                                SETTING priority to BATCH will start the query as soon as idle resources are available (usually within a few minutes). 
                                If BigQuery hasn't started the query within 24 hours, BigQuery changes the job priority to INTERACTIVE.
                                More info on: https://cloud.google.com/bigquery/docs/running-queries#batch 
                                */
                                "priority": "BATCH",
                                "location": "US",
                                "useLegacySql": false,
                              },
                              "dryRun": false
                            }
                          });

                          Promise.all([JOBS, SERVED])
                            .catch(reason => {
                              try {
                                console.error(`BQ-JOB-UPDATE::OVR_CAN ${reason.errors[0].reason} ${reason.errors[0].location}`);
                              } catch (e) { }
                            });
                        } else {
                          console.error(`ECB-WRITE! ${Date.now()} ${cid} ${error} ${resp} ${body}`);
                          done(new Error(`ECB-WRITE! ${Date.now()} ${cid} ${error} ${resp} ${body}`));

                          //Send an email that something went wrong
                        }
                      });
                    })
                    .catch(reason => {
                      console.error(`FB-READ-TOKENS ${reason}`);
                      done(new Error(`FB-READ-TOKENS ${reason}`));

                      //Send an email that something went wrong
                    });
                  break;
                default:
                  break;
              }
            })
            .catch(reason => {
              console.error(`FB-JOB-PENDING ${reason}`);
              done(new Error(`FB-JOB-PENDING ${reason}`));

              //Send an email that something went wrong
            });
          break;
        default:
          done();
          break;
      }
    } else {
      done(new Error("QUEUE-NO_JOB_TYPE"));
    }
  });

  // Check every second that there's no stuck jobs due to unstable redis connections
  jobs.watchStuckJobs(1000);

  // JOBS MANAGEMENT
  firebase.database().ref('jobs').orderByChild('pending').equalTo(true).on('child_added', (childSnapshot, prevChildKey) => {
    var jobObject = childSnapshot.val();
    firebase.database().ref(`units/${jobObject["uid"]}`).once('value').then(unitSnp => {
      var tempData = unitSnp.val();

      if (tempData) {
        jobObject.code = tempData.code;
        jobObject.cid = tempData.cid;
        jobObject.eid = tempData.eid;
        jobObject.jid = childSnapshot.key;

        jobObject.type = 'work';
        jobObject.title = `${jobObject.uid} ${Date.now()} ${jobObject.job}`;

        if (jobObject.pending) {
          let work = jobs.create('ecobee_job', jobObject).priority('normal').attempts(1).ttl(2000).removeOnComplete(true).save();

          work
            .on('complete', (result) => {
              console.log(`DONE: ${work.data}`);
              logger.warn(`DONE: ${JSON.stringify(work.data, null, 2)}`);
            })
            .on('failed attempt', (errorMessage, doneAttempts) => {
              console.error(`Work failed ${doneAttempts} times. REASON: ${errorMessage}`);
            })
            .on('failed', (errorMessage) => {
              console.error(`FAILED: ${work.data}`);
              logger.error(`FAILED: ${JSON.stringify(work.data, null, 2)}`);
              work.remove();
            });
        } else {
          logger.info(`NO UNIT FOUND FOR ${jobObject["uid"]}`);
          firebase.database().ref(`jobs/${childSnapshot.key}`).update({ pending: false, doit: Date.now() }).catch(reason => logger.error(`FB-JOB_UPDATE ${reason}`));
        }
      }
    }).catch(reason => console.error(`FB-READ-UNITS ${reason}`));
  }, cancelCallback => console.error(`FB-READ-NEW-JOBS! ${cancelCallback}`), null);


  // // INITIAL CHECK ON TOKENS
  firebase.database().ref(`tokens`).once('value', snapshot => {
    var tokensInfo = snapshot.val();

    for (let cluster of Object.keys(tokensInfo)) {
      const last = tokensInfo[cluster].last;

      if (Date.now() - last >= 60000 * 59) {
        let refresh = jobs.create('ecobee_job', { type: 'refresh', clusterid: cluster, refreshToken: tokensInfo[cluster].rt }).priority('high').attempts(3).ttl(3000).removeOnComplete(true).save();

        refresh
          .on('complete', (result) => {
            console.log(`DONE: ${refresh.data}`);
            logger.warn(`DONE: ${JSON.stringify(refresh.data, null, 2)}`);
          })
          .on('failed attempt', (errorMessage, doneAttempts) => {
            console.error(`Work failed ${doneAttempts} times. REASON: ${errorMessage}`);
          })
          .on('failed', (errorMessage) => {
            console.error(`FAILED: ${refresh.data} REASON: ${errorMessage}`);
            logger.error(`FAILED: ${refresh.data} REASON: ${errorMessage}`);
            refresh.remove();
          });
      }
    }
  })
    .catch(reason => {
      console.error(500, "UNABLE TO READ TOKENS FROM FIREBASE");
      console.error(`FB-READ-TOKENS! ${reason}`);
    });


  setInterval(() => {
    firebase.database().ref(`tokens`).once('value', snapshot => {
      var tokensInfo = snapshot.val();

      for (let cluster of Object.keys(tokensInfo)) {

        const last = tokensInfo[cluster].last;
        if (Date.now() - last >= 60000 * 50) {
          let refresh = jobs.create('ecobee_job', { type: 'refresh', clusterid: cluster, refreshToken: tokensInfo[cluster].rt }).priority('high').attempts(3).ttl(3000).removeOnComplete(true).save();

          refresh
            .on('complete', (result) => {
              console.log(`DONE: ${refresh.data}`);
              logger.warn(`DONE: ${JSON.stringify(refresh.data, null, 2)}`);
            })
            .on('failed attempt', (errorMessage, doneAttempts) => {
              console.error(`Work failed ${doneAttempts} times. REASON: ${errorMessage}`);
            })
            .on('failed', (errorMessage) => {
              console.error(`FAILED: ${refresh.data} REASON: ${errorMessage}`);
              logger.info(`FAILED: ${refresh.data} REASON: ${errorMessage}`);
              refresh.remove();
            });
        }
      }
    })
      .catch(reason => {
        console.error(500, "UNABLE TO READ TOKENS FROM FIREBASE");
        console.error(`FB-READ-TOKENS! ${reason}`);
      });
  }, 60000);

  const showSurveysOnFriday = () => {
    let fridayDate = new Date();

    if (fridayDate.getUTCDay() == 5 && fridayDate.getUTCHours() - 5 == 1) {
      firebase.database().ref('surveys').once('value')
        .then(surveySnapshot => {
          let surveys = surveySnapshot.val();

          for (let participant in surveys) {
            firebase.database().ref(`surveys/${participant}`).update({ pending: true });
          }
        })
    }
  };

  showSurveysOnFriday();
  setInterval(showSurveysOnFriday, 60000 * 55);
}

module.exports = app;