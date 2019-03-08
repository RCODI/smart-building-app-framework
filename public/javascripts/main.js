$(document).ready(() => {
    firebase.auth().onAuthStateChanged(userResponse => {
        if (userResponse) {
            user = userResponse;
            var db = firebase.database();

            let fills = document.getElementsByClassName('multi-range__fill');

            for (let fill of fills) {
                fill.style.width = "0";
            }

            const defaultHomeHeatCool = { heat: 72, cool: 77 };
            const defaultAwayHeatCool = { heat: 68, cool: 72 };
            const defaultSleepHeatCool = { heat: 70, cool: 75 };
            const defaultSetpoints = { home: defaultHomeHeatCool, away: defaultAwayHeatCool, sleep: defaultSleepHeatCool };
            const defaultDay = ["s", "s", "s", "s", "s", "s", "s", "s", "h", "h", "a", "a", "a", "a", "a", "a", "a", "a", "a", "h", "h", "h", "h", "s",];
            const defaultDay2 = ["s", "s", "s", "s", "s", "s", "s", "s", "h", "h", "h", "h", "h", "h", "h", "h", "h", "h", "h", "h", "h", "h", "h", "s",];
            const defaultSchedules = { weekdaySchedule: defaultDay, weekendSchedule: defaultDay2, currentWeekdaySchedule: defaultDay, currentWeekendSchedule: defaultDay2 };

            const setpointsRef = db.ref(`setpoints/${userResponse.uid}/`);
            const schedulesRef = db.ref(`schedules/${userResponse.uid}/`);
            const cursetpointsRef = db.ref(`cursetpoints/${userResponse.uid}/`);
            const overridesRef = db.ref(`overrides/${userResponse.uid}/`);

            const interactionsRef = db.ref(`interactions/${usr.uid}/`);
            let interactionUpdate = {};

            let redirect = false;

            // Fill user's info on FB
            const setpointsPromise = setpointsRef.once('value').then(snapshot => {
                let data = snapshot.val();
                if (data == null) {
                    redirect = true;
                    setpointsRef.set(defaultSetpoints);
                }
            });

            const curSetpointsPromise = cursetpointsRef.once('value').then(snapshot => {
                let data = snapshot.val();
                if (data == null) {
                    redirect = true;
                    cursetpointsRef.set(defaultSetpoints);
                }
            });

            const schedulesPromise = schedulesRef.once('value').then(snapshot => {
                let data = snapshot.val();
                if (data == null) {
                    redirect = true;
                    schedulesRef.set(defaultSchedules);
                }
            });

            const overridesPromise = overridesRef.once('value').then(snapshot => {
                let data = snapshot.val();
                if (data == null) {
                    redirect = true;
                    overridesRef.set({ pending: false });
                }
            })

            Promise.all([setpointsPromise, curSetpointsPromise, schedulesPromise, overridesPromise]).then(() => {
                if (redirect) {
                    window.location.href = "/";
                }
            });

            // Change the temperature module
            var temperatureContainer = document.getElementById('temp');

            temperatureContainer.innerHTML = "67<sup>°F</sup>";

            db.ref(`temps/${userResponse.uid}`).on('value', tempSnapshot => {
                let temp = tempSnapshot.val();

                if (temp) {
                    temperatureContainer.innerHTML = `${temp}<sup>°F</sup>`;
                }
            })

            // Change the state module
            const refCurrentWeekday = db.ref(`schedules/${userResponse.uid}/currentWeekdaySchedule`);
            const refCurrentWeekend = db.ref(`schedules/${userResponse.uid}/currentWeekendSchedule`);
            const refOverride = db.ref(`overrides/${userResponse.uid}`);
            const refTypeMessage = db.ref(`messages/${userResponse.uid}/type`);

            var currentOverride = document.getElementById("currentOverride");

            refOverride.on('value', overrideSnapshot => {
                let overrideInfo = overrideSnapshot.val();

                if (overrideInfo.pending) {
                    if (timeoutOverrideCancel) {
                        clearTimeout(timeoutOverrideCancel);
                    }

                    currentOverride.style.display = "flex";


                    slider2.update({
                        start: overrideInfo.heat,
                        end: overrideInfo.cool,
                        update: function (values) {
                            for (let key in values) {
                                this[key].textContent = getFormattedValue(values[key]);
                            }
                        }
                    });

                    view2.update({
                        start: overrideInfo.heat,
                        end: overrideInfo.cool,
                    });
                    // if (new Date().getHours() > overrideInfo.hour) {
                    //     overrideCancelOverrideButton.click();
                    // } else {
                    //     if (timeoutOverrideCancel) {
                    //         clearTimeout(timeoutOverrideCancel);
                    //     }

                    //     timeoutOverrideCancel = setTimeout(() => {
                    //         timeoutOverrideCancel = null;
                    //         overrideCancelOverrideButton.click();
                    //     }, 60000 * 60 * (overrideInfo.hour - new Date().getHours()));
                    // }
                } else {

                    currentOverride.style.display = "none";

                    let currentDate = new Date();
                    let currentHour = currentDate.getHours();
                    let currentIsWeekday = currentDate.getDay() == 0 || currentDate.getDay() == 6 ? false : true;
                    if (currentIsWeekday) {
                        db.ref(`schedules/${userResponse.uid}/weekdaySchedule`).once('value').then(weekdayScheduleSnapshot => {
                            let weekdaySCH = weekdayScheduleSnapshot.val();
                            if (weekdaySCH) {
                                // let currentState = ;
                                switch (weekdaySCH[currentHour]) {
                                    case 'h':
                                        db.ref(`setpoints/${userResponse.uid}/home`).once('value').then(snpshot => {
                                            let values = snpshot.val();

                                            slider2.update({
                                                start: values.heat,
                                                end: values.cool,
                                                update: function (values) {
                                                    for (let key in values) {
                                                        this[key].textContent = getFormattedValue(values[key]);
                                                    }
                                                }
                                            });

                                            view2.update({
                                                start: values.heat,
                                                end: values.cool,
                                            });
                                        })
                                        break;
                                    case 'a':
                                        db.ref(`setpoints/${userResponse.uid}/away`).once('value').then(snpshot => {
                                            let values = snpshot.val();

                                            slider2.update({
                                                start: values.heat,
                                                end: values.cool,
                                                update: function (values) {
                                                    for (let key in values) {
                                                        this[key].textContent = getFormattedValue(values[key]);
                                                    }
                                                }
                                            });

                                            view2.update({
                                                start: values.heat,
                                                end: values.cool,
                                            });
                                        })
                                        break;
                                    case 's':
                                        db.ref(`setpoints/${userResponse.uid}/sleep`).once('value').then(snpshot => {
                                            let values = snpshot.val();

                                            slider2.update({
                                                start: values.heat,
                                                end: values.cool,
                                                update: function (values) {
                                                    for (let key in values) {
                                                        this[key].textContent = getFormattedValue(values[key]);
                                                    }
                                                }
                                            });

                                            view2.update({
                                                start: values.heat,
                                                end: values.cool,
                                            });
                                        })
                                        break;
                                    default:
                                        break;
                                }

                            }
                        })
                    } else {
                        db.ref(`schedules/${userResponse.uid}/weekendSchedule`).once('value').then(weekendScheduleSnapshot => {
                            let weekendSCH = weekendScheduleSnapshot.val();
                            if (weekendSCH) {
                                // let currentState = ;
                                switch (weekendSCH[currentHour]) {
                                    case 'h':
                                        db.ref(`setpoints/${userResponse.uid}/home`).once('value').then(snpshot => {
                                            let values = snpshot.val();

                                            slider2.update({
                                                start: values.heat,
                                                end: values.cool,
                                                update: function (values) {
                                                    for (let key in values) {
                                                        this[key].textContent = getFormattedValue(values[key]);
                                                    }
                                                }
                                            });

                                            view2.update({
                                                start: values.heat,
                                                end: values.cool,
                                            });
                                        })
                                        break;
                                    case 'a':
                                        db.ref(`setpoints/${userResponse.uid}/away`).once('value').then(snpshot => {
                                            let values = snpshot.val();

                                            slider2.update({
                                                start: values.heat,
                                                end: values.cool,
                                                update: function (values) {
                                                    for (let key in values) {
                                                        this[key].textContent = getFormattedValue(values[key]);
                                                    }
                                                }
                                            });

                                            view2.update({
                                                start: values.heat,
                                                end: values.cool,
                                            });
                                        })
                                        break;
                                    case 's':
                                        db.ref(`setpoints/${userResponse.uid}/sleep`).once('value').then(snpshot => {
                                            let values = snpshot.val();

                                            slider2.update({
                                                start: values.heat,
                                                end: values.cool,
                                                update: function (values) {
                                                    for (let key in values) {
                                                        this[key].textContent = getFormattedValue(values[key]);
                                                    }
                                                }
                                            });

                                            view2.update({
                                                start: values.heat,
                                                end: values.cool,
                                            });
                                        })
                                        break;
                                    default:
                                        break;
                                }

                            }
                        })
                    }

                }
            })

            refCurrentWeekday.on('value', (curWeekdaySnapshot) => {
                const CUR_WD_STATE_FB = curWeekdaySnapshot.val()[new Date().getHours()];
                let auxDate = new Date();

                let isWeekday = auxDate.getDay() == 0 || auxDate.getDay() == 6 ? false : true;
                if (isWeekday) {
                    changeModeOnHeader(CUR_WD_STATE_FB);
                }
            });

            refCurrentWeekend.on('value', (curWeekendSnapshot) => {
                const CUR_WE_STATE_FB = curWeekendSnapshot.val()[new Date().getHours()];
                let auxDate = new Date();

                let isWeekday = auxDate.getDay() == 0 || auxDate.getDay() == 6 ? false : true;
                if (!isWeekday) {
                    changeModeOnHeader(CUR_WE_STATE_FB);
                }
            });

            refTypeMessage.on('value', (typeMessageSnapshot) => {
                const type = typeMessageSnapshot.val();
                let overridePanel = document.getElementById('overridePanel'),
                    overridePanelContainer = document.getElementById('overridePanelContainer');

                switch (type) {
                    case 'heat':
                        overridePanelContainer.style.display = "flex";
                        overridePanelContainer.style.height = "78%";

                        overridePanel.innerHTML = `
                        <p>Consider using a <span style="color: var(--heating); font-weight: 900;">heating</span> setpoint:</p>
                        <l>
                            <li><span style="color: var(--heating);">Close to <b>68°<sup>F</sup></b></span> when you are away</li>
                        
                            <li><span style="color: var(--heating);">Lower than <b>75°<sup>F</sup></b></span> when you are at home if you feel comfortable </li>
                        
                            <li><span style="color: var(--heating);">Close to <b>70°<sup>F</sup></b></span> when you sleep if you feel comfortable </li>
                        </l>`;
                        break;
                    case 'cool':
                        overridePanelContainer.style.display = "flex";
                        overridePanelContainer.style.height = "78%";

                        overridePanel.innerHTML = `
                        <p> Consider using a <span style="color: var(--cooling); font-weight: 900;">cooling</span> setpoint: </p>
                        <l>
                            <li><span style="color: var(--cooling);">Close to <b>80°<sup>F</sup></b></span> when you are away </li>
                        
                            <li><span style="color: var(--cooling);">Higher than <b>73°<sup>F</sup></b></span> when you are at home if you feel comfortable </li>
                        
                            <li><span style="color: var(--cooling);">Close to <b>77°<sup>F</sup></b></span> when you sleep if you feel comfortable </li>
                        </l>`;
                        break;
                    case 'both':
                        overridePanelContainer.style.display = "flex";
                        overridePanelContainer.style.height = "90%";

                        overridePanel.innerHTML = `
                        <p> Consider using a <span style="color: var(--heating); font-weight: 900;">heating</span>/<span style="color: var(--cooling); font-weight: 900;">cooling</span> setpoint: </p>
                        <l>
                            <li><span style="color: var(--heating);">Close to <b>68°<sup>F</sup></b></span>/<span style="color: var(--cooling);"><b>80°<sup>F</sup></b></span> when you are away </li>
                        
                            <li><span style="color: var(--heating);">Lower</span>/<span style="color: var(--cooling)">Higher</span> than <span style="color: var(--heating);"><b>75°<sup>F</sup></b></span>/<span style="color: var(--cooling);"><b>73°<sup>F</sup></b></span> when you are at home if you feel comfortable </li>
                        
                            <li><span style="color: var(--heating);">Close to <b>70°<sup>F</sup></b></span>/<span style="color: var(--cooling);"><b>77°<sup>F</sup></b></span> when you sleep if you feel comfortable </li>
                        </l>`;
                        break;
                    default:
                        overridePanelContainer.style.display = "none";
                        break;
                }
            });

            const changeModeOnHeader = (nowState) => {
                switch (nowState) {
                    case "h":
                        currentModeDisplay.style.background = colorHomeStatus;
                        currentModeDisplay.innerHTML = `<div id="status">Home</div>`;
                        break;

                    case "s":
                        currentModeDisplay.style.background = colorAsleepStatus;
                        currentModeDisplay.innerHTML = `<div id="status">Sleep</div>`;
                        break;

                    case "a":
                        currentModeDisplay.style.background = colorAwayStatus;
                        currentModeDisplay.innerHTML = `<div id="status">Away</div>`;
                        break;

                    default:
                        break;
                }
            };

            const changeHandlesOnOverride = () => {
                db.ref(`overrides/${userResponse.uid}/pending`).on('value', pendingSnapshot => {
                    let pending = pendingSnapshot.val();

                    if (pending == false) {
                        let currentDate = new Date();
                        let currentHour = currentDate.getHours();
                        let currentIsWeekday = currentDate.getDay() == 0 || currentDate.getDay() == 6 ? false : true;
                        if (currentIsWeekday) {
                            db.ref(`schedules/${userResponse.uid}/weekdaySchedule`).once('value').then(weekdayScheduleSnapshot => {
                                let weekdaySCH = weekdayScheduleSnapshot.val();
                                if (weekdaySCH) {
                                    // let currentState = ;
                                    switch (weekdaySCH[currentHour]) {
                                        case 'h':
                                            db.ref(`setpoints/${userResponse.uid}/home`).once('value').then(snpshot => {
                                                let values = snpshot.val();

                                                slider2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                    update: function (values) {
                                                        for (let key in values) {
                                                            this[key].textContent = getFormattedValue(values[key]);
                                                        }
                                                    }
                                                });

                                                view2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                });
                                            })
                                            break;
                                        case 'a':
                                            db.ref(`setpoints/${userResponse.uid}/away`).once('value').then(snpshot => {
                                                let values = snpshot.val();

                                                slider2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                    update: function (values) {
                                                        for (let key in values) {
                                                            this[key].textContent = getFormattedValue(values[key]);
                                                        }
                                                    }
                                                });

                                                view2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                });
                                            })
                                            break;
                                        case 's':
                                            db.ref(`setpoints/${userResponse.uid}/sleep`).once('value').then(snpshot => {
                                                let values = snpshot.val();

                                                slider2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                    update: function (values) {
                                                        for (let key in values) {
                                                            this[key].textContent = getFormattedValue(values[key]);
                                                        }
                                                    }
                                                });

                                                view2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                });
                                            })
                                            break;
                                        default:
                                            break;
                                    }

                                }
                            })
                        } else {
                            db.ref(`schedules/${userResponse.uid}/weekendSchedule`).once('value').then(weekendScheduleSnapshot => {
                                let weekendSCH = weekendScheduleSnapshot.val();
                                if (weekendSCH) {
                                    // let currentState = ;
                                    switch (weekendSCH[currentHour]) {
                                        case 'h':
                                            db.ref(`setpoints/${userResponse.uid}/home`).once('value').then(snpshot => {
                                                let values = snpshot.val();

                                                slider2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                    update: function (values) {
                                                        for (let key in values) {
                                                            this[key].textContent = getFormattedValue(values[key]);
                                                        }
                                                    }
                                                });

                                                view2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                });
                                            })
                                            break;
                                        case 'a':
                                            db.ref(`setpoints/${userResponse.uid}/away`).once('value').then(snpshot => {
                                                let values = snpshot.val();

                                                slider2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                    update: function (values) {
                                                        for (let key in values) {
                                                            this[key].textContent = getFormattedValue(values[key]);
                                                        }
                                                    }
                                                });

                                                view2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                });
                                            })
                                            break;
                                        case 's':
                                            db.ref(`setpoints/${userResponse.uid}/sleep`).once('value').then(snpshot => {
                                                let values = snpshot.val();

                                                slider2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                    update: function (values) {
                                                        for (let key in values) {
                                                            this[key].textContent = getFormattedValue(values[key]);
                                                        }
                                                    }
                                                });

                                                view2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                });
                                            })
                                            break;
                                        default:
                                            break;
                                    }

                                }
                            })
                        }
                    }
                });
            }

            db.ref(`setpoints/${user.uid}`).on('value', setpointSnapshot => {
                var setpointsFirebase = setpointSnapshot.val();

                if (setpointsFirebase && setpointsFirebase != undefined) {
                    document.getElementById("heat_home").innerText = setpointsFirebase.home.heat + "°F";
                    document.getElementById("cool_home").innerText = setpointsFirebase.home.cool + "°F";

                    document.getElementById("heat_away").innerText = setpointsFirebase.away.heat + "°F";
                    document.getElementById("cool_away").innerText = setpointsFirebase.away.cool + "°F";

                    document.getElementById("heat_sleep").innerText = setpointsFirebase.sleep.heat + "°F";
                    document.getElementById("cool_sleep").innerText = setpointsFirebase.sleep.cool + "°F";
                }
            });

            var colorHomeStatus = "#CC30C0",
                colorAwayStatus = "#4EA1EA",
                colorAsleepStatus = "#1F3271",
                colorMainConsumption = "linear-gradient(to right, #efefef, #dad927)",
                colorHomeConsumption = colorHomeStatus,
                colorSleepConsumption = colorAsleepStatus,
                colorAwayConsumption = colorAwayStatus,
                colorBackgroundDark = "#DEDEDE";

            var currentState = "";

            for (var k = 0; k < 4; k++) {
                const statusButton = document.getElementById("currentStatus" + k);
                const v = k;

                statusButton.addEventListener("click", () => {

                    setCancelContainer.style.display = "grid";

                    switch (v) {
                        case 1:
                            interactionUpdate = {};
                            interactionUpdate[`${Date.now()}`] = "schedule_HOME_button";
                            interactionsRef.update(interactionUpdate).catch(reason => console.error(reason));

                            for (let i = 0; i < 24; i++) {
                                if (weekdaySchedule[i] == "h") {
                                    weekdaySliderDivs[i].classList.remove('unactive')
                                } else {
                                    weekdaySliderDivs[i].classList.add('unactive')
                                }

                                if (weekendSchedule[i] == "h") {
                                    weekendSliderDivs[i].classList.remove('unactive')
                                } else {
                                    weekendSliderDivs[i].classList.add('unactive')
                                }
                            }
                            break;
                        case 2:
                            interactionUpdate = {};
                            interactionUpdate[`${Date.now()}`] = "schedule_AWAY_button";
                            interactionsRef.update(interactionUpdate).catch(reason => console.error(reason));

                            for (let i = 0; i < 24; i++) {
                                if (weekdaySchedule[i] == "a") {
                                    weekdaySliderDivs[i].classList.remove('unactive')
                                } else {
                                    weekdaySliderDivs[i].classList.add('unactive')
                                }
                                if (weekendSchedule[i] == "a") {
                                    weekendSliderDivs[i].classList.remove('unactive')
                                } else {
                                    weekendSliderDivs[i].classList.add('unactive')
                                }
                            }
                            break;
                        case 3:
                            interactionUpdate = {};
                            interactionUpdate[`${Date.now()}`] = "schedule_SLEEP_button";
                            interactionsRef.update(interactionUpdate).catch(reason => console.error(reason));

                            for (let i = 0; i < 24; i++) {
                                if (weekdaySchedule[i] == "s") {
                                    weekdaySliderDivs[i].classList.remove('unactive')
                                } else {
                                    weekdaySliderDivs[i].classList.add('unactive')
                                }

                                if (weekendSchedule[i] == "s") {
                                    weekendSliderDivs[i].classList.remove('unactive')
                                } else {
                                    weekendSliderDivs[i].classList.add('unactive')
                                }
                            }
                            break;
                        default:
                            break;
                    }

                    currentState = statusButton.value;

                    var stateButtons = document.getElementsByClassName("currentStateButton");
                    var currentColorContainer = document.getElementById("setpointDetailContainer");
                    var textDetail = document.getElementById("dinamicSetpointTextContainer");

                    var ct = 0;
                    for (let button of stateButtons) {
                        button.style.background = "white";
                        button.style.fontWeight = "bold";
                        button.classList.remove("active_state")

                        switch (ct) {
                            case 0:
                                button.style.color = "#949494";
                                break;
                            case 1:
                                button.style.color = colorHomeStatus;
                                break;
                            case 2:
                                button.style.color = colorAwayStatus;
                                break;
                            case 3:
                                button.style.color = colorAsleepStatus;
                                break;
                            default:
                                button.style.color = "#949494";
                                break;
                        }
                        ct++;
                    }

                    statusButton.classList.add("active_state")

                    statusButton.style.fontWeight = "bold";

                    var isAllTab = false;

                    switch (statusButton.value) {
                        case "all":
                            statusButton.style.background = "gray";
                            statusButton.style.color = "black";
                            isAllTab = true;
                            break;
                        case "home":
                            statusButton.style.background = colorHomeStatus;
                            textDetail.style.color = colorHomeStatus;
                            statusButton.style.color = "white";
                            currentColorContainer.style.border = `1px solid ${colorHomeStatus}`;

                            db.ref(`setpoints/${userResponse.uid}/home`).once('value').then((snapshot) => {
                                var setpointsFirebase = snapshot.val();

                                if (setpointsFirebase != null && setpointsFirebase != undefined) {
                                    document.getElementById("detailHeat").innerText = setpointsFirebase.heat + "°F";
                                    document.getElementById("detailCool").innerText = setpointsFirebase.cool + "°F";

                                    slider.update({
                                        start: setpointsFirebase.heat,
                                        end: setpointsFirebase.cool,
                                        update: function (values) {
                                            for (let key in values) {
                                                this[key].textContent = getFormattedValue(values[key]);
                                            }
                                        }
                                    });

                                    view.update({
                                        start: setpointsFirebase.heat,
                                        end: setpointsFirebase.cool,
                                    });
                                } else {
                                    db.ref(`setpoints/${userResponse.uid}`).update({
                                        home: {
                                            heat: homeHeatGOOD,
                                            cool: homeCoolGOOD,
                                        }
                                    }).then(() => {
                                        document.getElementById("detailHeat").innerText = homeHeatGOOD + "°F";
                                        document.getElementById("detailCool").innerText = homeCoolGOOD + "°F";

                                        slider.update({
                                            start: homeHeatGOOD,
                                            end: homeCoolGOOD,
                                            update: function (values) {
                                                for (let key in values) {
                                                    this[key].textContent = getFormattedValue(values[key]);
                                                }
                                            }
                                        });

                                        view.update({
                                            start: homeHeatGOOD,
                                            end: homeCoolGOOD,
                                        });
                                    })
                                }
                            });


                            break;
                        case "away":
                            statusButton.style.background = colorAwayStatus;
                            textDetail.style.color = colorAwayStatus;
                            currentColorContainer.style.border = `1px solid ${colorAwayStatus}`;
                            statusButton.style.color = "white";


                            db.ref(`setpoints/${userResponse.uid}/away`).once('value').then((snapshot) => {
                                var setpointsFirebase = snapshot.val();

                                if (setpointsFirebase != null && setpointsFirebase != undefined) {
                                    document.getElementById("detailHeat").innerText = setpointsFirebase.heat + "°F";
                                    document.getElementById("detailCool").innerText = setpointsFirebase.cool + "°F";

                                    slider.update({
                                        start: setpointsFirebase.heat,
                                        end: setpointsFirebase.cool,
                                        update: function (values) {
                                            for (let key in values) {
                                                this[key].textContent = getFormattedValue(values[key]);
                                            }
                                        }
                                    });

                                    view.update({
                                        start: setpointsFirebase.heat,
                                        end: setpointsFirebase.cool,
                                    });
                                } else {
                                    db.ref(`setpoints/${userResponse.uid}`).update({
                                        away: {
                                            heat: awayHeatGOOD,
                                            cool: awayCoolGOOD,
                                        }
                                    }).then(() => {
                                        document.getElementById("detailHeat").innerText = awayHeatGOOD + "°F";
                                        document.getElementById("detailCool").innerText = awayCoolGOOD + "°F";

                                        slider.update({
                                            start: awayHeatGOOD,
                                            end: awayCoolGOOD,
                                            update: function (values) {
                                                for (let key in values) {
                                                    this[key].textContent = getFormattedValue(values[key]);
                                                }
                                            }
                                        });

                                        view.update({
                                            start: awayHeatGOOD,
                                            end: awayCoolGOOD,
                                        });
                                    })
                                }
                            });

                            break;
                        case "sleep":
                            statusButton.style.background = colorAsleepStatus;
                            textDetail.style.color = colorAsleepStatus;
                            currentColorContainer.style.border = `1px solid ${colorAsleepStatus}`;
                            statusButton.style.color = "white";

                            db.ref(`setpoints/${userResponse.uid}/sleep`).once('value').then((snapshot) => {
                                var setpointsFirebase = snapshot.val();

                                if (setpointsFirebase != null && setpointsFirebase != undefined) {
                                    document.getElementById("detailHeat").innerText = setpointsFirebase.heat + "°F";
                                    document.getElementById("detailCool").innerText = setpointsFirebase.cool + "°F";

                                    slider.update({
                                        start: setpointsFirebase.heat,
                                        end: setpointsFirebase.cool,
                                        update: function (values) {
                                            for (let key in values) {
                                                this[key].textContent = getFormattedValue(values[key]);
                                            }
                                        }
                                    });

                                    view.update({
                                        start: setpointsFirebase.heat,
                                        end: setpointsFirebase.cool,
                                    });
                                } else {
                                    db.ref(`setpoints/${userResponse.uid}`).update({
                                        sleep: {
                                            heat: sleepHeatGOOD,
                                            cool: sleepCoolGOOD,
                                        }
                                    }).then(() => {
                                        document.getElementById("detailHeat").innerText = sleepHeatGOOD + "°F";
                                        document.getElementById("detailCool").innerText = sleepCoolGOOD + "°F";

                                        slider.update({
                                            start: sleepHeatGOOD,
                                            end: sleepCoolGOOD,
                                            update: function (values) {
                                                for (let key in values) {
                                                    this[key].textContent = getFormattedValue(values[key]);
                                                }
                                            }
                                        });

                                        view.update({
                                            start: sleepHeatGOOD,
                                            end: sleepCoolGOOD,
                                        });
                                    })
                                }
                            });

                            break;
                        default:
                            break;
                    }

                    if (isAllTab) {
                        setCancelContainer.style.display = "none";

                        document.getElementById('setpointAllContainer').style.display = "grid";
                        document.getElementById('setpointDetailContainer').style.display = "none";

                        for (let i = 0; i < 24; i++) {
                            weekdaySliderDivs[i].classList.remove('unactive');
                            weekendSliderDivs[i].classList.remove('unactive');
                        }

                        db.ref(`setpoints/${userResponse.uid}`).once('value')
                            .then((snapshot) => {
                                var setpointsFirebase = snapshot.val();

                                if (setpointsFirebase != null && setpointsFirebase != undefined) {
                                    document.getElementById("heat_home").innerText = setpointsFirebase.home.heat + "°F";
                                    document.getElementById("cool_home").innerText = setpointsFirebase.home.cool + "°F";

                                    document.getElementById("heat_away").innerText = setpointsFirebase.away.heat + "°F";
                                    document.getElementById("cool_away").innerText = setpointsFirebase.away.cool + "°F";

                                    document.getElementById("heat_sleep").innerText = setpointsFirebase.sleep.heat + "°F";
                                    document.getElementById("cool_sleep").innerText = setpointsFirebase.sleep.cool + "°F";
                                }
                            })
                            .catch(reason => console.error(reason));
                    } else {
                        document.getElementById('setpointAllContainer').style.display = "none";
                        document.getElementById('setpointDetailContainer').style.display = "grid";
                    }

                });
            }

            //SCHEDULE SLIDERS

            var weekdaySchedule = new Array(24);
            var weekendSchedule = new Array(24);

            var sliderContainer1 = document.getElementById("weekdayContainer");
            var sliderContainer2 = document.getElementById("weekendContainer");

            sliderContainer1.style.display = "grid";
            sliderContainer1.style.gridTemplateColumns = "0.5fr repeat(24,1fr) 0.5fr";
            sliderContainer1.style.gridTemplateRows = "20% 3.6vw";

            sliderContainer2.style.display = "grid";
            sliderContainer2.style.gridTemplateColumns = "0.5fr repeat(24,1fr) 0.5fr";
            sliderContainer2.style.gridTemplateRows = "20% 3.6vw";

            var pastWeekdaySchedule = new Array(24);
            var pastWeekendSchedule = new Array(24);

            var weekdaySliderBoundaries = [];
            var weekendSliderBoundaries = [];
            var weekdaySliderDivs = [];
            var weekendSliderDivs = [];

            weekdayScheduleRef = db.ref(`schedules/${userResponse.uid}/weekdaySchedule`);
            weekendScheduleRef = db.ref(`schedules/${userResponse.uid}/weekendSchedule`);

            var pendingWkDaySchedule = false;

            weekdayScheduleRef.once('value').then((s) => {
                const ws = s.val();
                weekdaySchedule = ws;

                for (let j = 0; j < 24; j++) {
                    const textDiv = document.createElement("div");

                    textDiv.style.gridColumn = (j + 2) + "/" + (j + 3);
                    textDiv.style.gridRow = "3/4";
                    textDiv.style.color = "white";
                    textDiv.style.fontWeight = "700"

                    textDiv.innerText = `${j % 12 == 0 ? 12 : j % 12} `;

                    textDiv.style.textAlign = "center";
                    textDiv.style.fontSize = "1em";
                    textDiv.style.width = "100%";

                    const div = document.createElement("div");

                    div.id = "hourWeekday" + j;
                    div.className = "divWeekday";
                    div.style.gridColumn = (j + 2) + "/" + (j + 3);
                    div.style.gridRow = "2/3";
                    div.style.height = "3.6vw";
                    div.style.width = "100%";
                    div.style.borderLeft = "1px solid #dedede";
                    div.style.display = "flex";
                    div.style.alignItems = "center";

                    div.style.touchAction = "manipulation";

                    switch (weekdaySchedule[j]) {
                        case "h":
                        case "home":
                            div.style.background = colorHomeStatus;
                            break;
                        case "a":
                        case "away":
                            div.style.background = colorAwayStatus;
                            break;
                        case "s":
                        case "sleep":
                            div.style.background = colorAsleepStatus;
                            break;
                        default:
                            console.log("NO ASSIGNED", weekdaySchedule[j])
                            div.style.background = "gray";
                            break;
                    }


                    function scheduleSliderInteraction(event) {
                        event.preventDefault();
                        // Get the current location of the pointer
                        var currentTouchLeft = event.touches[0].clientX;

                        if (weekdaySliderBoundaries && weekdaySliderBoundaries[0][1] != 0) {
                            // Go through every interval in the slider
                            for (let k = 0; k < weekdaySliderBoundaries.length; k++) {

                                // For every div, get the left and righ boundaries
                                var left = weekdaySliderBoundaries[k][0], right = weekdaySliderBoundaries[k][1];

                                // If the current touch is between those boundaries, then color it and change the week
                                if (left <= currentTouchLeft && currentTouchLeft <= right) {
                                    changeColorsAndUpdateArray(weekdaySliderDivs[k], k);
                                }
                            }
                        } else {
                            var weekdayDivs = document.getElementsByClassName("divWeekday");

                            for (let x = 0; x < weekdayDivs.length; x++) {
                                weekdaySliderBoundaries[x][0] = weekdayDivs.item(x).offsetLeft;
                                weekdaySliderBoundaries[x][1] = weekdayDivs.item(x).offsetLeft + weekdayDivs.item(x).offsetWidth;
                            }
                        }
                    }

                    var deltaSchedule;
                    var lastTouch;

                    div.addEventListener("touchstart", (event) => {
                        if (Date.now() - lastTouch < 500) {
                            console.log("DOUBLE TOUCH!");
                        }

                        deltaSchedule = weekdaySchedule.slice();
                        scheduleSliderInteraction(event);
                    });

                    div.addEventListener("touchmove", (event) => {
                        scheduleSliderInteraction(event);
                    });

                    const finishTouch = () => {
                        lastTouch = Date.now();
                        interactionUpdate = {};
                        interactionUpdate[`${Date.now()}`] = "schedule_WEEKDAY_slider";
                        interactionsRef.update(interactionUpdate).catch(reason => console.error(reason));

                        pastWeekdaySchedule = weekdaySchedule.slice();
                        writeWeekdaySchedule(userResponse.uid);
                    };

                    div.addEventListener("touchend", event => {
                        finishTouch();
                    });

                    div.addEventListener("touchcancel", event => {
                        finishTouch();
                    });

                    const writeWeekdaySchedule = (uid) => {
                        var weekdayArrayToString = weekdaySchedule.join("");
                        var deltaArrayToSring = deltaSchedule.join("");

                        db.ref(`overrides/${uid}`).once('value')
                            .then(overrideSnap => {
                                let data = overrideSnap.val();
                                if (data != null) {
                                    if (weekdayArrayToString != deltaArrayToSring) {
                                        var update = {};
                                        update[`weekdaySchedule`] = weekdaySchedule;

                                        if (!data.pending) {
                                            update[`currentWeekdaySchedule`] = weekdaySchedule;
                                        }

                                        // db.ref(`/schedules/${uid}`).update(update).catch(reason => console.error(reason));

                                        if (!pendingWkDaySchedule && document.getElementsByClassName("active_state").item(0).value != "all") {
                                            pendingWkDaySchedule = true;

                                            setTimeout(() => {
                                                pendingWkDaySchedule = false;
                                            }, 3 * 1000);
                                        }
                                    }
                                }
                            });
                    }

                    function changeColorsAndUpdateArray(d, index) {
                        d.classList.remove('unactive');

                        switch (currentState) {
                            case "home":
                                d.style.background = colorHomeStatus;
                                weekdaySchedule[index] = "h";
                                break;

                            case "sleep":
                                d.style.background = colorAsleepStatus;
                                weekdaySchedule[index] = "s";
                                break;

                            case "away":
                                d.style.background = colorAwayStatus;
                                weekdaySchedule[index] = "a";
                                break;

                            default:
                                break;
                        }
                    }

                    sliderContainer1.appendChild(div);
                    weekdaySliderDivs.push(div);
                    weekdaySliderBoundaries[j] = ([div.offsetLeft, div.offsetLeft + div.offsetWidth]);
                    div.appendChild(textDiv);
                }
            });
            /////END OF THE FIRST SLIDER

            /// BEGINNING OF THE SECOND SCHEDULE SLIDER
            var pendingWkEndSchedule = false;

            weekendScheduleRef.once('value').then((snapshot) => {
                weekendSchedule = snapshot.val();

                for (let j = 0; j < 24; j++) {
                    const textDiv = document.createElement("div");

                    textDiv.style.gridColumn = (j + 2) + "/" + (j + 3);
                    textDiv.style.gridRow = "3/4";
                    textDiv.style.width = "100%";
                    textDiv.style.color = "white";

                    textDiv.innerText = `${j % 12 == 0 ? 12 : j % 12}`;

                    textDiv.style.textAlign = "center";
                    textDiv.style.fontSize = "1em";
                    textDiv.style.fontWeight = "900";
                    textDiv.style.alignSelf = "center";

                    const div = document.createElement("div");

                    div.id = "hourWeekday" + j;
                    div.className = "divWeekend";
                    div.style.gridColumn = (j + 2) + "/" + (j + 3);
                    div.style.gridRow = "2/3";
                    div.style.height = "3.6vw";
                    // div.style.width = "1.8vw";
                    div.style.width = "100%";
                    div.style.borderLeft = "1px solid #DEDEDE";
                    div.style.display = "flex";
                    div.style.alignItems = "center";

                    div.style.touchAction = "manipulation";

                    switch (weekendSchedule[j]) {
                        case "h":
                        case "home":
                            div.style.background = colorHomeStatus;
                            break;
                        case "a":
                        case "away":
                            div.style.background = colorAwayStatus;
                            break;
                        case "s":
                        case "sleep":
                            div.style.background = colorAsleepStatus;
                            break;
                        default:
                            console.log("NO ASSIGNED", weekendSchedule[j])
                            div.style.background = "gray";
                            break;
                    }


                    function scheduleSliderInteraction(event) {
                        event.preventDefault();
                        // Get the current location of the pointer
                        var currentTouchLeft = event.touches[0].clientX;

                        if (weekendSliderBoundaries && weekendSliderBoundaries[0][1] != 0) {
                            // Go through every interval in the slider
                            for (let k = 0; k < weekendSliderBoundaries.length; k++) {

                                // For every div, get the left and righ boundaries
                                var left = weekendSliderBoundaries[k][0], right = weekendSliderBoundaries[k][1];

                                // If the current touch is between those boundaries, then color it and change the week
                                if (left <= currentTouchLeft && currentTouchLeft <= right) {
                                    changeColorsAndUpdateArray(weekendSliderDivs[k], k);
                                }
                            }
                        } else {
                            var weekendDivs = document.getElementsByClassName("divWeekend");

                            for (let x = 0; x < weekendDivs.length; x++) {
                                weekendSliderBoundaries[x][0] = weekendDivs.item(x).offsetLeft;
                                weekendSliderBoundaries[x][1] = weekendDivs.item(x).offsetLeft + weekendDivs.item(x).offsetWidth;
                            }
                        }
                    }

                    var deltaSchedule;
                    var lastTouch;

                    div.addEventListener("touchstart", (event) => {
                        if (Date.now() - lastTouch < 500) {
                            console.log("DOUBLE TOUCH!");
                        }
                        deltaSchedule = weekendSchedule.slice();
                        scheduleSliderInteraction(event);
                    });

                    div.addEventListener("touchmove", (event) => {
                        scheduleSliderInteraction(event);
                    });

                    const finishTouch = () => {
                        lastTouch = Date.now();

                        interactionUpdate = {};
                        interactionUpdate[`${Date.now()}`] = "schedule_WEEKEND_slider";
                        interactionsRef.update(interactionUpdate).catch(reason => console.error(reason));

                        pastWeekendSchedule = weekendSchedule.slice();
                        writeWeekendSchedule(userResponse.uid);
                    };

                    div.addEventListener("touchend", event => {
                        finishTouch();
                    });

                    div.addEventListener("touchcancel", event => {
                        finishTouch();
                    });

                    const writeWeekendSchedule = (uid) => {
                        var weekendArrayToString = weekendSchedule.join("");
                        var deltaArrayToSring = deltaSchedule.join("");

                        db.ref(`overrides/${uid}`).once('value')
                            .then(overrideSnap => {
                                let data = overrideSnap.val();
                                if (data != null) {
                                    if (weekendArrayToString != deltaArrayToSring) {
                                        var update = {};
                                        update[`weekendSchedule`] = weekendSchedule;

                                        if (!data.pending) {
                                            update[`currentWeekendSchedule`] = weekendSchedule;
                                        }

                                        // db.ref(`/schedules/${uid}`).update(update).catch(reason => console.error(reason));

                                        if (!pendingWkEndSchedule && document.getElementsByClassName("active_state").item(0).value != "all") {
                                            pendingWkEndSchedule = true;

                                            setTimeout(() => {
                                                pendingWkEndSchedule = false;
                                            }, 3 * 1000);
                                        }
                                    }
                                }
                            });
                    }

                    function changeColorsAndUpdateArray(d, index) {
                        d.classList.remove('unactive');

                        switch (currentState) {
                            case "home":
                                d.style.background = colorHomeStatus;
                                weekendSchedule[index] = "h";
                                break;

                            case "sleep":
                                d.style.background = colorAsleepStatus;
                                weekendSchedule[index] = "s";
                                break;

                            case "away":
                                d.style.background = colorAwayStatus;
                                weekendSchedule[index] = "a";
                                break;

                            default:
                                break;
                        }
                    }

                    sliderContainer2.appendChild(div);
                    weekendSliderDivs.push(div);
                    weekendSliderBoundaries[j] = ([div.offsetLeft, div.offsetLeft + div.offsetWidth]);
                    div.appendChild(textDiv);
                }
            });

            const currentTemperatureContainer = document.getElementById('currentTempContainer');

            const timeDiv = document.getElementById('hourminute');
            const ampmDiv = document.getElementById('ampm');

            setInterval(() => {
                let td = new Date();

                timeDiv.innerHTML = `${td.getHours() % 12 == 0 ? 12 : td.getHours() > 12 ? td.getHours() - 12 : td.getHours()}${td.getSeconds() % 2 == 0 ? ":" : " "}${td.getMinutes() < 10 ? "0" + td.getMinutes() : td.getMinutes()}`;
                if (td.getHours() >= 12) {
                    ampmDiv.innerHTML = "<b>PM</b>";
                } else {
                    ampmDiv.innerHTML = "<b>AM</b>";
                }
            }, 1000);


            //////////////////////////////////////////////
            let personalContent = document.getElementById("personalContainer");

            personalContent.style.display = "none";

            let communityTab = document.getElementsByClassName("tabButton").item(0)
            let personalTab = document.getElementsByClassName("tabButton").item(1)
            let communityContent = document.getElementById("communityContainer");

            function showCommunityContent() {
                communityContent.style.display = "grid";
                personalContent.style.display = "none";
            }

            function showPersonalContent() {
                personalContent.style.display = "grid";
                communityContent.style.display = "none";
            }

            communityTab.addEventListener("click", showCommunityContent);
            personalTab.addEventListener("click", showPersonalContent);

            let isProduction = true;

            if (isProduction) {
                showPersonalContent();
                communityTab.style.display = "none";
                // personalTab.style.gridColimn
                document.getElementsByClassName("personalTab").item(0).style.gridColumn = "1/5";
            }

            var d = new Date();
            var month = new Array();
            month[0] = "January";
            month[1] = "February";
            month[2] = "March";
            month[3] = "April";
            month[4] = "May";
            month[5] = "June";
            month[6] = "July";
            month[7] = "August";
            month[8] = "September";
            month[9] = "October";
            month[10] = "November";
            month[11] = "December";
            var n = month[d.getMonth()];

            let kWh = document.getElementById("kiloWattButton");
            let USD = document.getElementById("currencyButton");
            let points = document.getElementById("pointsButton");
            let fixedButtons = [kWh, USD, points]

            kWh.style.fontWeight = "bold";
            kWh.style.background = "lightgray";
            kWh.style.color = "black";
            kWh.style.fontSize = "1.3em";


            for (let i = 0; i < fixedButtons.length; i++) {
                fixedButtons[i].addEventListener("click", () => {
                    let selected = fixedButtons[i].style.fontWeight;
                    if (selected == "bold") {
                        // fixedButtons[i].style.fontWeight = "normal";
                        // fixedButtons[i].style.background = "rgb(230,230,230,0.8)";
                        // fixedButtons[i].style.color = "lightgray";
                        // fixedButtons[i].style.fontSize = "1.2em";         
                    } else {
                        fixedButtons[i].style.fontWeight = "bold";
                        fixedButtons[i].style.background = "lightgray";
                        fixedButtons[i].style.color = "black";
                        fixedButtons[i].style.fontSize = "1.3em";

                        for (let j = 1; j < 3; j++) {
                            fixedButtons[(i + j) % 3].style.fontWeight = "normal";
                            fixedButtons[(i + j) % 3].style.background = "rgb(230,230,230,0.8)";
                            fixedButtons[(i + j) % 3].style.color = "lightgray";
                            fixedButtons[(i + j) % 3].style.fontSize = "1.2em";
                        }
                    }
                });
            }

            let weekButton = document.getElementById("weekButton");
            let monthButton = document.getElementById("monthButton");
            let weekSlideContainer = document.getElementsByClassName("slideContainer2").item(0);
            let monthSlideContainer = document.getElementsByClassName("slideContainer").item(0);
            let monthButtonIsClicked = true;

            monthButton.style.fontWeight = "bold";
            monthButton.style.background = "lightgray";
            monthButton.style.color = "black";
            monthButton.style.fontSize = "1.3em";

            weekSlideContainer.style.display = "none";

            weekButton.addEventListener("click", () => {
                if (monthButtonIsClicked) {
                    monthButtonIsClicked = false;

                    monthSlideContainer.style.display = "none";
                    weekSlideContainer.style.display = "grid";

                    monthButton.style.fontWeight = "normal";
                    monthButton.style.background = "rgb(230,230,230,0.8)";
                    monthButton.style.color = "lightgray";
                    monthButton.style.fontSize = "1.2em";

                    weekButton.style.fontWeight = "bold";
                    weekButton.style.background = "lightgray";
                    weekButton.style.color = "black";
                    weekButton.style.fontSize = "1.3em";
                }
            });

            monthButton.addEventListener("click", () => {
                if (!monthButtonIsClicked) {
                    monthButtonIsClicked = true;

                    monthSlideContainer.style.display = "grid";
                    weekSlideContainer.style.display = "none";

                    weekButton.style.fontWeight = "normal";
                    weekButton.style.background = "rgb(230,230,230,0.8)";
                    weekButton.style.color = "lightgray";
                    weekButton.style.fontSize = "1.2em";

                    monthButton.style.fontWeight = "bold";
                    monthButton.style.background = "lightgray";
                    monthButton.style.color = "black";
                    monthButton.style.fontSize = "1.3em";
                }
            });

            ///////////////////////////////////////////////////////////////////////////////////////////////

            var scheduleButton = document.getElementById("scheduleButton");
            var overrideButton = document.getElementById("overrideButton");
            var setCancelContainer = document.getElementById('setCancelContainer');

            const defaultBackgroundColorButton = "#F7F7F7";

            scheduleButton.style.background = defaultBackgroundColorButton;
            overrideButton.style.background = defaultBackgroundColorButton;
            overrideButton.style.fontSize = "auto";

            var scheduleButtonContainer = document.getElementById("homeContainer");
            var overrideButtonContainer = document.getElementById("asleepContainer");

            let controlContainer = document.getElementById("controlContainer");
            let overrideContainer = document.getElementById("overrideContainer");

            controlContainer.style.display = "none";
            overrideContainer.style.display = "none";


            scheduleButton.addEventListener("click", () => {

                const prevWeekdayPromise = weekdayScheduleRef.once('value');
                const prevWeekendPromise = weekendScheduleRef.once('value');

                Promise.all([prevWeekdayPromise, prevWeekendPromise])
                    .then(values => {
                        weekdaySchedule = values[0].val();
                        weekendSchedule = values[1].val();

                        for (let x = 0; x < 24; x++) {
                            let dday = document.getElementsByClassName('divWeekday').item(x);
                            let dend = document.getElementsByClassName('divWeekend').item(x);

                            dday.classList.remove('unactive');
                            dend.classList.remove('unactive');

                            switch (weekdaySchedule[x]) {
                                case "h":
                                    dday.style.background = colorHomeStatus;
                                    break;

                                case "s":
                                    dday.style.background = colorAsleepStatus;
                                    break;

                                case "a":
                                    dday.style.background = colorAwayStatus;
                                    break;

                                default:
                                    break;
                            }

                            switch (weekendSchedule[x]) {
                                case "h":
                                    dend.style.background = colorHomeStatus;
                                    break;

                                case "s":
                                    dend.style.background = colorAsleepStatus;
                                    break;

                                case "a":
                                    dend.style.background = colorAwayStatus;
                                    break;

                                default:
                                    break;
                            }
                        }
                    })
                    .catch(reason => {
                        console.error(reason);
                    });

                var Dt = new Date();
                var isWe = Dt.getDay() == 0 || Dt.getDay() == 6 ? false : true;

                if (isWe) {
                    db.ref(`schedules/${userResponse.uid}/weekdaySchedule`).once('value', data => {
                        weekdaySchedule = data.val();
                    });

                } else {
                    db.ref(`schedules/${userResponse.uid}/weekendSchedule`).once('value', data => {
                        weekendSchedule = data.val();
                    });
                }

                var clickevent = new MouseEvent('click', {
                    'view': window,
                    'bubbles': true,
                    'cancelable': true
                });

                document.getElementById('currentStatus0').dispatchEvent(clickevent);

                interactionUpdate = {};
                interactionUpdate[`${Date.now()}`] = "schedule_button";
                interactionsRef.update(interactionUpdate).catch(reason => console.error(reason));

                scheduleButtonIsClicked = true;
                overrideButtonIsClicked = false;

                scheduleButton.classList.add("active_module");
                overrideButton.classList.remove("active_module");

                controlContainer.style.display = "grid";
                overrideContainer.style.display = "none";

                controlContainer.style.zIndex = "0";
                overrideContainer.style.zIndex = "1";

                scheduleButton.style.background = colorBackgroundDark;
                scheduleButton.style.color = "black";
                scheduleButton.style.borderBottom = "0";
                scheduleButton.style.height = "100%";

                overrideButton.style.background = "#F7F7F7";
                overrideButton.style.color = "#949494";
                overrideButton.style.height = "80%";

                scheduleButton.style.borderBottomLeftRadius = "0";
                scheduleButton.style.borderBottomRightRadius = "0";
                scheduleButton.style.borderTopLeftRadius = "20px";
                scheduleButton.style.borderTopRightRadius = "20px";

                overrideButton.style.borderRadius = "100px";

                document.getElementById("homeContainer").style.gridArea = "4/3/6/4";
                document.getElementById("asleepContainer").style.gridArea = "4/4/5/5";

                overrideButton.style.borderBottom = "1px solid var(--border-color-schedule-override)";
            });

            overrideButton.addEventListener("click", () => {
                // Return the schedule back to normal
                const prevWeekdayPromise = weekdayScheduleRef.once('value');
                const prevWeekendPromise = weekendScheduleRef.once('value');

                Promise.all([prevWeekdayPromise, prevWeekendPromise])
                    .then(values => {
                        weekdaySchedule = values[0].val();
                        weekendSchedule = values[1].val();

                        for (let x = 0; x < 24; x++) {
                            let dday = document.getElementsByClassName('divWeekday').item(x);
                            let dend = document.getElementsByClassName('divWeekend').item(x);

                            dday.classList.remove('unactive');
                            dend.classList.remove('unactive');

                            switch (weekdaySchedule[x]) {
                                case "h":
                                    dday.style.background = colorHomeStatus;
                                    break;

                                case "s":
                                    dday.style.background = colorAsleepStatus;
                                    break;

                                case "a":
                                    dday.style.background = colorAwayStatus;
                                    break;

                                default:
                                    break;
                            }

                            switch (weekendSchedule[x]) {
                                case "h":
                                    dend.style.background = colorHomeStatus;
                                    break;

                                case "s":
                                    dend.style.background = colorAsleepStatus;
                                    break;

                                case "a":
                                    dend.style.background = colorAwayStatus;
                                    break;

                                default:
                                    break;
                            }
                        }
                    })
                    .catch(reason => {
                        console.error(reason);
                    });

                // Select the setpoints for the current schedule if there's no override 

                db.ref(`overrides/${userResponse.uid}/pending`).on('value', pendingSnapshot => {
                    let pending = pendingSnapshot.val();

                    if (pending == false) {
                        let currentDate = new Date();
                        let currentHour = currentDate.getHours();
                        let currentIsWeekday = currentDate.getDay() == 0 || currentDate.getDay() == 6 ? false : true;
                        if (currentIsWeekday) {
                            db.ref(`schedules/${userResponse.uid}/weekdaySchedule`).once('value').then(weekdayScheduleSnapshot => {
                                let weekdaySCH = weekdayScheduleSnapshot.val();
                                if (weekdaySCH) {
                                    // let currentState = ;
                                    switch (weekdaySCH[currentHour]) {
                                        case 'h':
                                            db.ref(`setpoints/${userResponse.uid}/home`).once('value').then(snpshot => {
                                                let values = snpshot.val();

                                                slider2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                    update: function (values) {
                                                        for (let key in values) {
                                                            this[key].textContent = getFormattedValue(values[key]);
                                                        }
                                                    }
                                                });

                                                view2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                });
                                            })
                                            break;
                                        case 'a':
                                            db.ref(`setpoints/${userResponse.uid}/away`).once('value').then(snpshot => {
                                                let values = snpshot.val();

                                                slider2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                    update: function (values) {
                                                        for (let key in values) {
                                                            this[key].textContent = getFormattedValue(values[key]);
                                                        }
                                                    }
                                                });

                                                view2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                });
                                            })
                                            break;
                                        case 's':
                                            db.ref(`setpoints/${userResponse.uid}/sleep`).once('value').then(snpshot => {
                                                let values = snpshot.val();

                                                slider2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                    update: function (values) {
                                                        for (let key in values) {
                                                            this[key].textContent = getFormattedValue(values[key]);
                                                        }
                                                    }
                                                });

                                                view2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                });
                                            })
                                            break;
                                        default:
                                            break;
                                    }

                                }
                            })
                        } else {
                            db.ref(`schedules/${userResponse.uid}/weekendSchedule`).once('value').then(weekendScheduleSnapshot => {
                                let weekendSCH = weekendScheduleSnapshot.val();
                                if (weekendSCH) {
                                    // let currentState = ;
                                    switch (weekendSCH[currentHour]) {
                                        case 'h':
                                            db.ref(`setpoints/${userResponse.uid}/home`).once('value').then(snpshot => {
                                                let values = snpshot.val();

                                                slider2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                    update: function (values) {
                                                        for (let key in values) {
                                                            this[key].textContent = getFormattedValue(values[key]);
                                                        }
                                                    }
                                                });

                                                view2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                });
                                            })
                                            break;
                                        case 'a':
                                            db.ref(`setpoints/${userResponse.uid}/away`).once('value').then(snpshot => {
                                                let values = snpshot.val();

                                                slider2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                    update: function (values) {
                                                        for (let key in values) {
                                                            this[key].textContent = getFormattedValue(values[key]);
                                                        }
                                                    }
                                                });

                                                view2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                });
                                            })
                                            break;
                                        case 's':
                                            db.ref(`setpoints/${userResponse.uid}/sleep`).once('value').then(snpshot => {
                                                let values = snpshot.val();

                                                slider2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                    update: function (values) {
                                                        for (let key in values) {
                                                            this[key].textContent = getFormattedValue(values[key]);
                                                        }
                                                    }
                                                });

                                                view2.update({
                                                    start: values.heat,
                                                    end: values.cool,
                                                });
                                            })
                                            break;
                                        default:
                                            break;
                                    }

                                }
                            })
                        }
                    }
                });

                interactionUpdate = {};
                interactionUpdate[`${Date.now()}`] = "override_button";
                interactionsRef.update(interactionUpdate).catch(reason => console.error(reason));

                scheduleButtonIsClicked = false;
                overrideButtonIsClicked = true;

                overrideButton.classList.add("active_module");
                scheduleButton.classList.remove("active_module");

                controlContainer.style.display = "none";
                overrideContainer.style.display = "grid";

                overrideButton.style.background = colorBackgroundDark;
                overrideButton.style.color = "black";
                overrideButton.style.borderBottom = "0";
                overrideButton.style.height = "100%";

                scheduleButton.style.background = "#F7F7F7";
                scheduleButton.style.color = "#949494";
                scheduleButton.style.height = "80%";

                overrideButton.style.borderBottomLeftRadius = "0";
                overrideButton.style.borderBottomRightRadius = "0";
                overrideButton.style.borderTopLeftRadius = "20px";
                overrideButton.style.borderTopRightRadius = "20px";

                scheduleButton.style.borderRadius = "100px";

                document.getElementById("asleepContainer").style.gridArea = "4/4/6/5";
                document.getElementById("homeContainer").style.gridArea = "4/3/5/4";

                scheduleButton.style.borderBottom = "1px solid var(--border-color-schedule-override)";
            });

            let XButton = document.getElementById("XButton");
            var XButtonClicked = false;
            XButton.addEventListener("click", () => {
                interactionUpdate = {};
                interactionUpdate[`${Date.now()}`] = "XButton";
                interactionsRef.update(interactionUpdate).catch(reason => console.error(reason));

                XButtonClicked = true;
                if (XButtonClicked) {
                    const prevWeekdayPromise = weekdayScheduleRef.once('value');
                    const prevWeekendPromise = weekendScheduleRef.once('value');

                    Promise.all([prevWeekdayPromise, prevWeekendPromise])
                        .then(values => {
                            weekdaySchedule = values[0].val();
                            weekendSchedule = values[1].val();

                            for (let x = 0; x < 24; x++) {
                                let dday = document.getElementsByClassName('divWeekday').item(x);
                                let dend = document.getElementsByClassName('divWeekend').item(x);

                                dday.classList.remove('unactive');
                                dend.classList.remove('unactive');

                                switch (weekdaySchedule[x]) {
                                    case "h":
                                        dday.style.background = colorHomeStatus;
                                        break;

                                    case "s":
                                        dday.style.background = colorAsleepStatus;
                                        break;

                                    case "a":
                                        dday.style.background = colorAwayStatus;
                                        break;

                                    default:
                                        break;
                                }

                                switch (weekendSchedule[x]) {
                                    case "h":
                                        dend.style.background = colorHomeStatus;
                                        break;

                                    case "s":
                                        dend.style.background = colorAsleepStatus;
                                        break;

                                    case "a":
                                        dend.style.background = colorAwayStatus;
                                        break;

                                    default:
                                        break;
                                }
                            }
                        })
                        .catch(reason => {
                            console.error(reason);
                        });
                    temp();
                    XButtonClicked = false;
                }
            });

            let XButton2 = document.getElementById("XButton2");
            var XButton2Clicked = false;
            XButton2.addEventListener("click", () => {
                interactionUpdate = {};
                interactionUpdate[`${Date.now()}`] = "XButton";
                interactionsRef.update(interactionUpdate).catch(reason => console.error(reason));

                XButton2Clicked = true;
                if (XButton2Clicked) {
                    temp();
                    XButton2Clicked = false;
                }
            });

            const temp = () => {

                scheduleButton.classList.remove('active_module');
                overrideButton.classList.remove('active_module');

                for (let i = 0; i < 4; i++) {
                    document.getElementById(`currentStatus${i}`).classList.remove('active_state');;
                }

                for (let i = 0; i < 24; i++) {
                    weekdaySliderDivs[i].classList.remove('unactive');
                    weekendSliderDivs[i].classList.remove('unactive');
                }

                controlContainer.style.display = "none";
                overrideContainer.style.display = "none";
                document.getElementById('actionMessagesContainer').style.display = "none";

                overrideButton.style.background = "#F7F7F7";
                overrideButton.style.color = "#949494";

                scheduleButton.style.background = "#F7F7F7";
                scheduleButton.style.color = "#949494";

                scheduleButton.style.height = "80%";
                overrideButton.style.height = "80%";

                scheduleButton.style.borderRadius = "100px";
                overrideButton.style.borderRadius = "100px";

                scheduleButton.style.border = "1px solid var(--border-color-schedule-override)";
                overrideButton.style.border = "1px solid var(--border-color-schedule-override)";

                document.getElementById("asleepContainer").style.gridRow = "4/5";
                document.getElementById("homeContainer").style.gridRow = "4/5";
            }

            // SET CANCEL BUTTONS
            const setButton = document.getElementById('setButton');
            const cancelButton = document.getElementById('cancelButton');

            setButton.addEventListener('click', event => {
                interactionUpdate = {};
                interactionUpdate[`${Date.now()}`] = "set_Button";
                interactionsRef.update(interactionUpdate);

                db.ref(`overrides/${userResponse.uid}`).once('value').then(overSnap => {
                    var overrideData = overSnap.val();
                    var overridePending = overrideData.pending == undefined ? false : overrideData.pending;

                    var schedulesPromise, setpointsPromise;

                    db.ref(`setpoints/${userResponse.uid}`).once('value')
                        .then(setpointSnap => {
                            db.ref(`schedules/${userResponse.uid}`).once('value')
                                .then(scheduleSnapshot => {
                                    let schedulesFB = scheduleSnapshot.val();
                                    let weekdayScheduleFB = schedulesFB.weekdaySchedule.join(""), weekendScheduleFB = schedulesFB.weekendSchedule.join("");
                                    let currentWeekdaySchedule = weekdaySchedule.join(""), currentWeekendSchedule = weekendSchedule.join("");

                                    if (!overridePending) {
                                        db.ref(`setpoints/${userResponse.uid}`).once('value')
                                            .then(snap => {
                                                db.ref(`cursetpoints/${userResponse.uid}`).set(snap.val())
                                                    .catch(reason => {
                                                        console.error(reason);
                                                        XButton.click();
                                                    });
                                            });
                                    }

                                    if (weekdayScheduleFB != currentWeekdaySchedule && weekendScheduleFB != currentWeekendSchedule) {
                                        let updates = {};
                                        if (!overridePending) {
                                            updates[`currentWeekdaySchedule`] = weekdaySchedule;
                                            updates[`currentWeekendSchedule`] = weekendSchedule;
                                        }
                                        updates[`weekdaySchedule`] = weekdaySchedule;
                                        updates[`weekendSchedule`] = weekendSchedule;

                                        schedulesPromise = db.ref(`schedules/${userResponse.uid}`).update(updates)
                                            .then(() => {
                                                scheduleButton.click();
                                            });
                                    } else if (weekdayScheduleFB != currentWeekdaySchedule && weekendScheduleFB == currentWeekendSchedule) {
                                        let updates = {};
                                        if (!overridePending) {
                                            updates[`currentWeekdaySchedule`] = weekdaySchedule;
                                        }
                                        updates[`weekdaySchedule`] = weekdaySchedule;
                                        schedulesPromise = db.ref(`schedules/${userResponse.uid}`).update(updates)
                                            .then(() => {
                                                scheduleButton.click();
                                            });
                                    } else if (weekdayScheduleFB == currentWeekdaySchedule && weekendScheduleFB != currentWeekendSchedule) {
                                        let updates = {};
                                        if (!overridePending) {
                                            updates[`currentWeekendSchedule`] = weekendSchedule;
                                        }
                                        updates[`weekendSchedule`] = weekendSchedule;

                                        schedulesPromise = db.ref(`schedules/${userResponse.uid}`).update({ 'weekendSchedule': weekendSchedule })
                                            .then(() => {
                                                scheduleButton.click();
                                            });
                                    } else {
                                        scheduleButton.click();
                                    }
                                })

                        });
                });
            });


            cancelButton.addEventListener('click', event => {
                interactionUpdate = {};
                interactionUpdate[`${Date.now()}`] = "cancel_Button";
                interactionsRef.update(interactionUpdate);

                const prevWeekdayPromise = weekdayScheduleRef.once('value');
                const prevWeekendPromise = weekendScheduleRef.once('value');

                Promise.all([prevWeekdayPromise, prevWeekendPromise])
                    .then(values => {
                        weekdaySchedule = values[0].val();
                        weekendSchedule = values[1].val();

                        for (let x = 0; x < 24; x++) {
                            let dday = document.getElementsByClassName('divWeekday').item(x);
                            let dend = document.getElementsByClassName('divWeekend').item(x);

                            dday.classList.remove('unactive');
                            dend.classList.remove('unactive');

                            switch (weekdaySchedule[x]) {
                                case "h":
                                    dday.style.background = colorHomeStatus;
                                    break;

                                case "s":
                                    dday.style.background = colorAsleepStatus;
                                    break;

                                case "a":
                                    dday.style.background = colorAwayStatus;
                                    break;

                                default:
                                    break;
                            }

                            switch (weekendSchedule[x]) {
                                case "h":
                                    dend.style.background = colorHomeStatus;
                                    break;

                                case "s":
                                    dend.style.background = colorAsleepStatus;
                                    break;

                                case "a":
                                    dend.style.background = colorAwayStatus;
                                    break;

                                default:
                                    break;
                            }
                        }

                        scheduleButton.click();
                    })
                    .catch(reason => {
                        console.error(reason);
                    })
            });


            // RHS Cascade Chart
            var totalContainer = document.getElementById("totalConsumption");
            var heatContainer = document.getElementById("heatConsumption");
            var waterContainer = document.getElementById("waterConsumption");
            var plugsContainer = document.getElementById("plugsConsumption");

            var totalMeter = document.getElementById("totalConsumptionMeter");
            var heatMeter = document.getElementById("heatConsumptionMeter");
            var waterMeter = document.getElementById("waterConsumptionMeter");
            var plugsMeter = document.getElementById("plugsConsumptionMeter");

            const homePoints = document.getElementById("homePoints"),
                awayPoints = document.getElementById("awayPoints"),
                sleepPoints = document.getElementById("sleepPoints"),
                homePointsRemaining = document.getElementById("homePointsRemaining"),
                awayPointsRemaining = document.getElementById("awayPointsRemaining"),
                sleepPointsRemaining = document.getElementById("sleepPointsRemaining");

            var isConsumption = false;

            if (isConsumption) {
                var maxConsumption = 100;
                var heatConsumption = 000;
                var waterConsumption = 000;
                var plugsConsumption = 000;
            } 

            const axis = document.getElementById('axisContainer');

            // AXIS
            for (let t = 1; t < 11; t++) {
                const l = document.createElement('div');
                const p = document.createElement("p");
                const pp = document.createTextNode(`${t * 10}`);

                p.style.gridArea = `1/${t}/2/${t + 1}`;
                l.style.gridArea = `1/${t}/2/${t + 1}`;

                p.style.color = "#a8a8a8";
                p.style.textAlign = "right";
                p.style.marginRight = "-5px";
                p.style.fontWeight = "900";

                l.style.height = "100%";
                l.style.marginLeft = "auto";
                l.style.background = "white";
                l.style.width = "2px";

                if (t == 10) {
                    l.style.marginRight = "-2px"
                }

                p.appendChild(pp);

                axis.appendChild(p);
                totalContainer.appendChild(l);
            }

            let lastWeekButton = document.getElementById("lastWeekButton");
            let thisWeekButton = document.getElementById("thisWeekButton");
            thisWeekButton.classList.add('clicked');


            thisWeekButton.addEventListener("click", () => {


                interactionUpdate = {};
                interactionUpdate[`${Date.now()}`] = "this_week_button";
                interactionsRef.update(interactionUpdate).catch(reason => console.error(reason));

                thisWeekButton.classList.add('clicked');
                lastWeekButton.classList.remove('clicked');
            });

            lastWeekButton.addEventListener("click", () => {
                interactionUpdate = {};
                interactionUpdate[`${Date.now()}`] = "last_week_button";
                interactionsRef.update(interactionUpdate).catch(reason => console.error(reason));

                lastWeekButton.classList.add('clicked');
                thisWeekButton.classList.remove('clicked');
            });
            // General Messages

            let messagesContainer = document.getElementById("generalMessages");


            db.ref(`/messages/${userResponse.uid}/msg`).on('value', msgSnapshot => {
                let msg = msgSnapshot.val();

                if (typeof msg != "null" && typeof msg != "undefined") {
                    try {
                        messagesContainer.innerHTML = `<div>${msg.split("Fahrenheit").join(`°F`)}</div>`;
                    } catch (e) {
                        console.error(e);
                        messagesContainer.innerHTML = `<div>Sorry, we don't have enough data.</div>`;
                    }
                } else {

                }

            })


            // Override Methods

            let currentModeDisplayContainer = document.getElementById("currentModeDisplayContainer");
            let currentModeModule = document.getElementById("currentModeModule");

            currentModeDisplayContainer.style.background = "#DEDEDE";
            currentModeModule.style.borderLeftColor = "transparent";
            currentModeDisplay.style.color = "white";

            let overrideStatusButtonHome = document.getElementById("override_status_home"),
                overrideStatusButtonAway = document.getElementById("override_status_away"),
                overrideStatusButtonSleep = document.getElementById("override_status_sleep"),
                overrideCancelOverrideButton = document.getElementById("cancel_override"),
                overrideHomeButtonContainer = document.getElementById("overrideHomeButtonContainer"),
                overrideAwayButtonContainer = document.getElementById("overrideAwayButtonContainer"),
                overrideSleepButtonContainer = document.getElementById("overrideSleepButtonContainer");

            const overrideButtons = [overrideStatusButtonAway, overrideStatusButtonHome, overrideStatusButtonSleep];


            for (let ovr_button of overrideButtons) {
                ovr_button.addEventListener("click", () => {
                    interactionUpdate = {};
                    interactionUpdate[`${Date.now()}`] = `${ovr_button.id}`;
                    interactionsRef.update(interactionUpdate).catch(reason => console.error(reason));

                    overrideStatusButtonAway.classList.remove('active_override_state');
                    overrideStatusButtonHome.classList.remove('active_override_state');
                    overrideStatusButtonSleep.classList.remove('active_override_state');

                    ovr_button.classList.add('active_override_state');

                    const hourNow = new Date().getHours();
                    // Create a pending override
                    db.ref(`overrides/${userResponse.uid}`).update({
                        pending: true,
                        hour: 24,
                        state: ovr_button.value,
                    });

                    const state = ovr_button.value;
                    let isWeekday_ovrr = new Date().getDay() == 0 || new Date().getDay() == 6 ? false : true;

                    if (isWeekday_ovrr) {
                        var overridedWeekdaySchedule = weekdaySchedule.slice();
                        switch (state) {
                            case "home":
                                for (let i = 0; i < 4; i++) {
                                    if ((i + hourNow) < 24)
                                        overridedWeekdaySchedule[i + hourNow] = "h";
                                }
                                break;
                            case "away":
                                for (let i = 0; i < 4; i++) {
                                    if ((i + hourNow) < 24)
                                        overridedWeekdaySchedule[i + hourNow] = "a";
                                }
                                break;
                            case "sleep":
                                for (let i = 0; i < 4; i++) {
                                    if ((i + hourNow) < 24)
                                        overridedWeekdaySchedule[i + hourNow] = "s";
                                }
                                break;
                            default:
                                break;
                        }
                        db.ref(`schedules/${userResponse.uid}`).update({ currentWeekdaySchedule: overridedWeekdaySchedule });
                    } else {
                        var overridedWeekendSchedule = weekendSchedule.slice();
                        switch (state) {
                            case "home":
                                for (let i = 0; i < 4; i++) {
                                    if ((i + hourNow) < 24)
                                        overridedWeekendSchedule[i + hourNow] = "h";
                                }
                                break;
                            case "away":
                                for (let i = 0; i < 4; i++) {
                                    if ((i + hourNow) < 24)
                                        overridedWeekendSchedule[i + hourNow] = "a";
                                }
                                break;
                            case "sleep":
                                for (let i = 0; i < 4; i++) {
                                    if ((i + hourNow) < 24)
                                        overridedWeekendSchedule[i + hourNow] = "s";
                                }
                                break;
                            default:
                                break;
                        }
                        db.ref(`schedules/${userResponse.uid}`).update({ currentWeekdendSchedule: overridedWeekendSchedule });
                    }

                    db.ref(`setpoints/${userResponse.uid}/${state}`).once('value')
                        .then(snapshot => {
                            var setpointsFromFB = snapshot.val();

                            if (setpointsFromFB != null) {
                                slider2.update({
                                    start: setpointsFromFB.heat,
                                    end: setpointsFromFB.cool,
                                    update: function (values) {
                                        for (let key in values) {
                                            this[key].textContent = getFormattedValue(values[key]);
                                        }
                                    }
                                });

                                view2.update({
                                    start: setpointsFromFB.heat,
                                    end: setpointsFromFB.cool,
                                });
                            }
                        });


                    if (timeoutOverrideCancel) {
                        console.log("NEW OVERRIDE");
                        clearTimeout(timeoutOverrideCancel);
                    }
                });
            }
            var tempTimer;
            overrideCancelOverrideButton.addEventListener("click", () => {
                interactionUpdate = {};
                interactionUpdate[`${Date.now()}`] = "cancel_override_button";
                interactionsRef.update(interactionUpdate).catch(reason => console.error(reason));

                overrideCancelOverrideButton.style.background = "#58746A";
                overrideCancelOverrideButton.style.color = "white";

                if (timeoutOverrideCancel) {
                    clearTimeout(timeoutOverrideCancel);
                    timeoutOverrideCancel = null;
                }

                if (tempTimer != null) {
                    clearTimeout(tempTimer);
                }

                tempTimer = setTimeout(() => {
                    overrideCancelOverrideButton.style.background = "white";
                    overrideCancelOverrideButton.style.color = "black";
                    tempTimer = null;
                }, 3 * 1000)

                overrideStatusButtonAway.classList.remove('active_override_state');
                overrideStatusButtonHome.classList.remove('active_override_state');
                overrideStatusButtonSleep.classList.remove('active_override_state');

                var tempDay = new Date().getDay();

                if (tempDay == 0 || tempDay == 6) {
                    db.ref(`schedules/${userResponse.uid}/weekendSchedule`).once('value').then(snaps => {
                        var sch = snaps.val();
                        if (sch != null) {
                            db.ref(`schedules/${userResponse.uid}/currentWeekendSchedule`).set(sch)
                                .then(() => writeOnBQThenEcobee())
                                .catch(reason => console.error(reason));
                        }
                    }).catch(reason => console.error(reason));
                } else {
                    db.ref(`schedules/${userResponse.uid}/weekdaySchedule`).once('value').then(snaps => {
                        var sch = snaps.val();
                        if (sch != null) {
                            db.ref(`schedules/${userResponse.uid}/currentWeekdaySchedule`).set(sch)
                                .then(() => writeOnBQThenEcobee())
                                .catch(reason => console.error(reason));
                        }
                    }).catch(reason => console.error(reason));
                }

                function writeOnBQThenEcobee() {
                    // This will change the current schedule table by querying the new table 
                    db.ref(`overrides/${userResponse.uid}`).update({ pending: false })
                        .then(() => {
                        })
                        .catch(reason => console.error(reason));
                }
            });

            // Get the modal
            var modal = document.getElementById('myModal');

            // When the user clicks the button, open the modal 
            var btn = document.getElementById("btnmodl");

            var aboutButton = document.getElementById('mySmarteButton'),
                guideButton = document.getElementById('guidelinesButton'),
                alexaButton = document.getElementById('alexaButton');

            var surveyContainer = document.getElementById('surveyContainer'),
                alexaImg = document.getElementById('alexaImg'),
                rulesImg = document.getElementById('rulesImg'),
                guideImg = document.getElementById('guideImg'),
                aboutVideo = document.getElementById('aboutVideo');

            var span = document.getElementsByClassName("close")[0];

            aboutVideo.pause();
            alexaImg.pause();

            // ecobeeUsedContainer = document.getElementById('ecobeeMessageContainer');

            // db.ref(`ecobee/${userResponse.uid}/flag`).on('value', ecobeeUsageSnapshot => {
            //     let flag = ecobeeUsageSnapshot.val();

            //     if (flag) {
            //         span.style.display = "block";

            //         removeAllLive();
            //         ecobeeUsedContainer.classList.add('live');
            //     }
            // })

            btn.onclick = () => {
                removeAllLive();
                span.style.display = "none";
                surveyContainer.classList.add('live');
            }

            aboutButton.onclick = () => {
                interactionUpdate = {};
                interactionUpdate[`${Date.now()}`] = "mySmartE_Button";
                interactionsRef.update(interactionUpdate);
                span.style.display = "block";

                removeAllLive();
                aboutVideo.classList.add('live');
            }

            guideButton.onclick = () => {
                interactionUpdate = {};
                interactionUpdate[`${Date.now()}`] = "guidelines_Button";
                interactionsRef.update(interactionUpdate);
                span.style.display = "block";

                removeAllLive();
                guideImg.classList.add('live');
            }

            alexaButton.onclick = () => {
                interactionUpdate = {};
                interactionUpdate[`${Date.now()}`] = "alexa_Button";
                interactionsRef.update(interactionUpdate);
                span.style.display = "block";

                removeAllLive();
                alexaImg.classList.add('live');
            }

            function removeAllLive() {
                modal.style.display = "block";

                surveyContainer.classList.remove('live');
                alexaImg.classList.remove('live');
                rulesImg.classList.remove('live');
                aboutVideo.classList.remove('live');
                guideImg.classList.remove('live');
            }


            // When the user clicks on <span> (x), close the modal
            span.onclick = function () {
                modal.style.display = "none";

                aboutVideo.pause();
                alexaImg.pause();
            }

            // Pause Videos 
            let vid = document.getElementById('aboutVideo');
            let vid2 = document.getElementById('alexaImg');
            vid.pause();
            vid2.pause();

            // Survey form
            let survey = document.getElementById('survey');
            let s = document.createElement('form');

            const checkboxs = [
                document.getElementById('problem1'),
                document.getElementById('problem2'),
                document.getElementById('problem3'),
                document.getElementById('problem4'),
                document.getElementById('problem5'),
                document.getElementById('problem6'),
                document.getElementById('problem7')];

            for (let checkbox of checkboxs) {
                checkbox.addEventListener('click', event => {
                    if (checkbox.checked) {
                        document.getElementById(`${checkbox.id}Label`).style.color = "var(--selected)";
                    } else {
                        document.getElementById(`${checkbox.id}Label`).style.color = "black";
                    }
                });
            }

            const otherProblemInput = document.getElementById('problem8');
            const otherProblemInputLabel = document.getElementById('problem8Label');

            otherProblemInput.addEventListener('change', event => {
                if (otherProblemInput.value !== "") {
                    otherProblemInputLabel.style.color = "var(--selected)";
                } else {
                    otherProblemInputLabel.style.color = "black";
                }
            })

            db.ref(`surveys/${userResponse.uid}/pending`).on('value', surveySnapshot => {
                let pending = surveySnapshot.val();
                if (pending !== null) {
                    if (pending === true) {
                        btn.click();
                    }
                } else {
                    btn.click();
                }
            })

            const submitButton = document.getElementById('submitButton');
            survey.action = `/survey/${userResponse.uid}`;

            let range = document.getElementById('expectation');
            const updateAxisRange = () => {
                for (let i = 0; i < 11; i++) {
                    let t = document.getElementsByClassName('axis').item(i);
                    t.style.color = "black";
                    t.style.fontWeight = "normal";
                    t.style.fontSize = "19px";
                }
                let current = document.getElementsByClassName('axis').item(range.value / 10);
                current.style.color = "var(--selected)";
                current.style.fontWeight = "bolder";
                current.style.fontSize = "21px";
            };

            const addListenerToRange = (listeners) => {
                let list = listeners.split(" ");

                for (let event of list) {
                    range.addEventListener(event, updateAxisRange);
                }
            }

            addListenerToRange("touchmove click pointerup");

            // let q1Inputs = document.getElementsByClassName('q1'),
            //     q3aInputs = document.getElementsByClassName('q3a'),
            //     q3bInputs = document.getElementsByClassName('q3b'),
            //     q3cInputs = document.getElementsByClassName('q3c');

            // let testInput = document.createElement('input');

            // for (let i = 0; i < q1Inputs.length; i++) {
            //     let q1 = q1Inputs.item(i);
            //     q1.oninvalid = event => {
            //         event.validationMessage = "TEST";
            //         console.log(event)
            //     };
            // }

            // Action Messages 
            document.getElementById('actionMessagesContainer').style.display = "none";

            ////////// LOOP-CODE //////////

            // Hourly(1minute actually) update on the state module
            setInterval(() => {
                let isWeekdayHourly = new Date().getDay() == 0 || new Date().getDay() == 6 ? false : true;
                let hourNow = new Date().getHours();
                let stateNow;

                if (isWeekdayHourly) {
                    db.ref(`schedules/${userResponse.uid}/currentWeekdaySchedule`).once('value')
                        .then(scheduleSnapshot => {
                            let currentSchedule = scheduleSnapshot.val();
                            stateNow = currentSchedule[hourNow];

                            stateNow && changeModeOnHeader(stateNow);
                            changeHandlesOnOverride();
                        })
                        .catch(reason => {
                            console.error(reason);
                        });
                } else {
                    db.ref(`schedules/${userResponse.uid}/currentWeekendSchedule`).once('value')
                        .then(scheduleSnapshot => {
                            let currentSchedule = scheduleSnapshot.val();
                            stateNow = currentSchedule[hourNow];

                            stateNow && changeModeOnHeader(stateNow);
                            changeHandlesOnOverride();
                        })
                        .catch(reason => {
                            console.error(reason);
                        });
                }

            }, 60000);

            // If it's 12AM (AKA a new day) clean overrides (EVERY 55min)
            // if (new Date().getHours() == 0) {
            //     db.ref(`overrides/${userResponse.uid}`).set({ pending: false });
            // }

            // If it's FRIDAY
            if (new Date().getDay() == 5) {
                // Check if survey is done
                db.ref(`surveys/${userResponse.uid}`).once('value')
                    .then(surveySnap => {
                        let surveyData = surveySnap.val();

                        if (surveyData) {
                            let surveyPending = typeof surveyData !== "null" || typeof surveyData !== "undefined" ? surveyData.pending : true;
                            if (surveyData[`${new Date().getUTCMonth() + 1}-${new Date().getUTCDate()}-${new Date().getUTCFullYear()}`])
                                if (surveyPending) {
                                    btn.click();
                                }
                        }

                    })
            }

            setInterval(() => {
                var isNewdayAlready = new Date().getHours() < 3 && new Date().getMinutes() < 5;

                if (isNewdayAlready) {
                    var isItFriday = new Date().getDay() == 5;
                    if (isItFriday && !surveyReseted) {
                        btn.click();
                        db.ref(`surveys/${userResponse.uid}`).update({ pending: true });
                    }
                }

            }, 60000);


            // If it's 5AM o'clock (EVERY 31min)
            setInterval(() => {
                var is5AM = new Date().getHours() == 5;
                if (is5AM) {
                    // Return to the this week view of points
                    thisWeekButton.click();

                    db.ref(`/messages/${userResponse.uid}/msg`).once('value')
                        .then(msgSnapshot => {
                            let msg = msgSnapshot.val();

                            if (typeof msg != "null" && typeof msg != "undefined") {
                                const tempdiv = document.createElement('div');

                                try {
                                    tempdiv.innerText = msg.split("Fahrenheit").join(`°F`);
                                } catch (e) {
                                    console.error(e);
                                    messagesContainer.innerHTML = `<div>Sorry, we don't have enough data.</div>`;
                                }
                                messagesContainer.appendChild(tempdiv);

                            } else {
                            }

                        })
                        .catch(reason => {
                        });
                }
            }, 60000 * 31);
        } else {
            document.getElementsByClassName('wrapper').item(0).style.display = "none";
            window.location.href = "/login";
        }
    });
});

// Pause Videos AGAIN
let vid = document.getElementById('aboutVideo');
let vid2 = document.getElementById('alexaImg');
vid.pause();
vid2.pause();