firebase.auth().onAuthStateChanged((usr) => {
  if (usr) {
    var generalMessagesOFF = false;
    var actionMessageTimer = null;
    const cool_be_mindful_too = "Be mindful! Your cooling setpoint is too low. You may lose points!",
      cool_be_mindful_changed = "Be mindful, you just  lowered  your cooling setpoint. You may lose points!",
      cool_good_job = "Good job, you increased your cooling setpoint. You are earning points!",
      cool_great = "Great! Your cooling setpoint is in good range. You are earning full points!",
      heat_be_mindful_too = "Be mindful! Your heating setpoint is too high. You may lose points!",
      heat_be_mindful_changed = "Be mindful, you just  increased  your heating setpoint. You may lose points!",
      heat_good_job = "Good job, you lowered your heating setpoint. You are earning points!",
      heat_great = "Great! Your heating setpoint is in good range. You are earning full points!";
    const intervalForReading = 15 * 1000;
    var homeHeat, homeCool,
      awayHeat, awayCool,
      sleepHeat, sleepCool, t, ct, ht;
    var last, current;
    var homeThresholds = {
      cooling: {
        low: 68,
        middle: 73,
        high: 80
      },
      heating: {
        low: 65,
        middle: 75,
        high: 80,
      }
    };
    var awayThresholds = {
      cooling: {
        low: 72,
        middle: 80,
        high: 83
      },
      heating: {
        low: 65,
        middle: 68,
        high: 75,
      }
    };
    var sleepThresholds = {
      cooling: {
        low: 70,
        middle: 77,
        high: 83
      },
      heating: {
        low: 65,
        middle: 70,
        high: 75,
      }
    };
    var timeoutOverrideCancel = null;
    function MultiRangeSlider(element, settings, getFormattedValue = (value) => value) {
      const slider = element;
      const DOM = {};
      let steps = [];
      let dragging = false;
      let currentHandle = null;
      const getHandleOffset = () => DOM.handles[0].offsetWidth / 2;
      const getTrackWidth = () => DOM.track.offsetWidth;
      const getFocusedHandle = () => DOM.handles.find(handle => document.activeElement === handle);
      const values = {
        start: settings.start,
        end: settings.end
      };
      function getSteps(sliderWidth, stepLen, handleOffset) {
        const steps = [];
        for (let i = 0; i <= stepLen; i++) {
          const stept = i * (sliderWidth * 0.95 / stepLen) + handleOffset;
          const stepPercent = (i * (95 / stepLen)).toFixed(2);
          const value = i * settings.increment + settings.start;
          steps.push({
            value,
            stept,
            stepPercent
          });
        }
        return steps;
      }
      const getStepLen = () => (settings.end - settings.start) / settings.increment;
      const startDrag = (event) => {
        currentHandle = event.target;
        dragging = true;
        last = { start: values.start, end: values.end };
      };
      const stopDrag = () => {
        dragging = false;
      };
      const actionMessagesCooling = (low, middle, high, current, last) => {
        const actionMessageContainer = document.getElementById('actionMessagesContainer'),
          actionMessageDiv = document.getElementById('actionMessages'),
          generalMessagesContainer = document.getElementById('generalMessagesContainer')
        generalMessagesDiv = document.getElementById('generalMessages');
        let NO_MESSAGE = false,
          BE_MINDFUL = false;
        let type = null;
        firebase.database().ref(`/messages/${usr.uid}`).once('value')
          .then(messageSnapshot => {
            type = messageSnapshot.val().type;
            if (type === "cool" || "both" === type) {
              if (current < low) {
                actionMessageDiv.innerText = cool_be_mindful_too;
                BE_MINDFUL = true;
              }
              if (middle <= current && current <= high) {
                actionMessageDiv.innerText = cool_great;
              }
              if ((low <= current && current < middle) && (current < last)) {
                actionMessageDiv.innerText = cool_be_mindful_changed;
                BE_MINDFUL = true;
              }
              if ((low <= current && current < middle) && (current > last)) {
                actionMessageDiv.innerText = cool_good_job;
              }
              if (current === last || high < current) {
                actionMessageDiv.innerText = "";
                NO_MESSAGE = true;
              }
              if (NO_MESSAGE) {
                actionMessageContainer.style.display = "none";
              } else {
                actionMessageContainer.classList.remove('override');

                if (BE_MINDFUL) {
                  actionMessageContainer.classList.add('bemindful');
                } else {
                  actionMessageContainer.classList.remove('bemindful');
                }
                if (!generalMessagesOFF) {
                  generalMessagesOFF = true;
                  const interval5AM = (29 - new Date().getHours()) * 60 * 60 * 1000;
                  setTimeout(() => {
                    generalMessagesOFF = false;
                    generalMessagesContainer.style.display = "flex";
                  }, interval5AM)
                }
                actionMessageContainer.style.display = "flex";
                if (actionMessageTimer) {
                  clearTimeout(actionMessageTimer);
                }
                actionMessageTimer = setTimeout(() => {
                  actionMessageContainer.style.display = "none";
                  generalMessagesContainer.style.display = "none";
                }, intervalForReading);
              }
            } else {
              console.log(`The current type: ${type} IS NOT for this handle`);
            }
          })
          .catch(reason => {
            console.error(reason);
          });
      }
      const actionMessagesHeating = (low, middle, high, current, last) => {
        const actionMessageContainer = document.getElementById('actionMessagesContainer'),
          actionMessageDiv = document.getElementById('actionMessages'),
          generalMessagesContainer = document.getElementById('generalMessagesContainer')
        generalMessagesDiv = document.getElementById('generalMessages');
        let NO_MESSAGE = false,
          BE_MINDFUL = false;
        let type = null;
        firebase.database().ref(`/messages/${usr.uid}`).once('value')
          .then(messageSnapshot => {
            type = messageSnapshot.val().type;
            if (type === "heat" || "both" === type) {
              if (high <= current) {
                actionMessageDiv.innerText = heat_be_mindful_too;
                BE_MINDFUL = true;
              }
              if (low <= current && current < middle) {
                actionMessageDiv.innerText = heat_great;
              }
              if ((middle <= current && current < high) && (current > last)) {
                actionMessageDiv.innerText = heat_be_mindful_changed;
                BE_MINDFUL = true;
              }
              if ((middle <= current && current < high) && (current < last)) {
                actionMessageDiv.innerText = heat_good_job;
              }
              if (current === last || current < low) {
                actionMessageDiv.innerText = "";
                NO_MESSAGE = true;
              }
              if (NO_MESSAGE) {
                actionMessageContainer.style.display = "none";
              } else {
                actionMessageContainer.classList.remove('override');
                if (BE_MINDFUL) {
                  actionMessageContainer.classList.add('bemindful');
                } else {
                  actionMessageContainer.classList.remove('bemindful');
                }
                if (!generalMessagesOFF) {
                  generalMessagesOFF = true;
                  const interval5AM = (29 - new Date().getHours()) * 60 * 60 * 1000;
                  setTimeout(() => {
                    generalMessagesOFF = false;
                    generalMessagesContainer.style.display = "flex";
                  }, interval5AM)
                }
                actionMessageContainer.style.display = "flex";
                if (actionMessageTimer) {
                  clearTimeout(actionMessageTimer);
                }
                actionMessageTimer = setTimeout(() => {
                  actionMessageContainer.style.display = "none";
                  generalMessagesContainer.style.display = "none";
                }, intervalForReading);
              }
            } else {
              console.log(`The current type: ${type} IS NOT for this handle`);
            }
          })
          .catch(reason => {
            console.error(reason);
          });
      }
      const updateValuesFromHandles = async (event) => {
        dragging = false;
        var currentModule = document.getElementsByClassName('active_module').item(0).id === "scheduleButton" ? "schedule" : "override";
        if (currentModule == "schedule") {
          try {
            if (event.target.classList[0] == "multi-range__handle") {
              for (let att of event.srcElement.attributes) {
                if (att.name == "data-handle-position") {
                  t = att.value == "start" ? "heating" : "cooling";
                  function changeCoolSetpointInBQ(state) {
                    if (values.end != last.end) {
                      firebase.database().ref(`overrides/${usr.uid}`).once('value')
                        .then(overrideSnapShot => {
                          overrideExists = overrideSnapShot.val().pending;
                          switch (state) {
                            case "home":
                              actionMessagesCooling(homeThresholds.cooling.low, homeThresholds.cooling.middle, homeThresholds.cooling.high, values.end, last.end);
                              var updates = {};
                              if (!overrideExists) {
                                updates[`cursetpoints/${usr.uid}/home/cool`] = homeCool;
                              }
                              updates[`setpoints/${usr.uid}/home/cool`] = homeCool;
                              firebase.database().ref().update(updates);
                              break;
                            case "away":
                              actionMessagesCooling(awayThresholds.cooling.low, awayThresholds.cooling.middle, awayThresholds.cooling.high, values.end, last.end);
                              var updates = {};
                              if (!overrideExists) {
                                updates[`cursetpoints/${usr.uid}/away/cool`] = awayCool;
                              }
                              updates[`setpoints/${usr.uid}/away/cool`] = awayCool;
                              firebase.database().ref().update(updates);
                              break;
                            case "sleep":
                              actionMessagesCooling(sleepThresholds.cooling.low, sleepThresholds.cooling.middle, sleepThresholds.cooling.high, values.end, last.end);
                              var updates = {};
                              if (!overrideExists) {
                                updates[`cursetpoints/${usr.uid}/sleep/cool`] = sleepCool;
                              }
                              updates[`setpoints/${usr.uid}/sleep/cool`] = sleepCool;
                              firebase.database().ref().update(updates);
                              break;
                            default:
                              break;
                          }
                        });
                    }
                  }
                  function changeHeatSetpointInBQ(state) {
                    if (values.start != last.start) {
                      firebase.database().ref(`overrides/${usr.uid}`).once('value')
                        .then(overrideSnapShot => {
                          overrideExists = overrideSnapShot.val().pending;
                          switch (state) {
                            case "home":
                              actionMessagesHeating(homeThresholds.heating.low, homeThresholds.heating.middle, homeThresholds.heating.high, values.start, last.start);
                              var updates = {};
                              if (!overrideExists) {
                                updates[`cursetpoints/${usr.uid}/home/heat`] = homeHeat;
                              }
                              updates[`setpoints/${usr.uid}/home/heat`] = homeHeat;
                              firebase.database().ref().update(updates);
                              break;
                            case "away":
                              actionMessagesHeating(awayThresholds.heating.low, awayThresholds.heating.middle, awayThresholds.heating.high, values.start, last.start);
                              var updates = {};
                              if (!overrideExists) {
                                updates[`cursetpoints/${usr.uid}/away/heat`] = awayHeat;
                              }
                              updates[`setpoints/${usr.uid}/away/heat`] = awayHeat;
                              firebase.database().ref().update(updates);
                              break;
                            case "sleep":
                              actionMessagesHeating(sleepThresholds.heating.low, sleepThresholds.heating.middle, sleepThresholds.heating.high, values.start, last.start);
                              var updates = {};
                              if (!overrideExists) {
                                updates[`cursetpoints/${usr.uid}/sleep/heat`] = sleepHeat;
                              }
                              updates[`setpoints/${usr.uid}/sleep/heat`] = sleepHeat;
                              firebase.database().ref().update(updates);
                              break;
                            default:
                              break;
                          }
                        });
                    }
                  }
                  if (t == "cooling") {
                    let interactionUpdate = {};
                    interactionUpdate[`${Date.now()}`] = "schedule_cooling_handle";
                    firebase.database().ref(`interactions/${usr.uid}/`).update(interactionUpdate).catch(reason => console.error(reason));
                    let currrentCoolingState = document.getElementsByClassName("active_state").item(0).value;
                    changeCoolSetpointInBQ(currrentCoolingState);
                  } else if (t == "heating") {
                    let interactionUpdate = {};
                    interactionUpdate[`${Date.now()}`] = "schedule_heating_handle";
                    firebase.database().ref(`interactions/${usr.uid}/`).update(interactionUpdate).catch(reason => console.error(reason));
                    let currrentHeatingState = document.getElementsByClassName("active_state").item(0).value;
                    changeHeatSetpointInBQ(currrentHeatingState);
                  }
                }
              }
            }
          } catch (e) {
            console.error("SOMETHING WRONG WITH THE HANDLES")
            console.error(e);
          }
        } else if (currentModule == "override") {
          if (timeoutOverrideCancel) {
            console.log("NEW OVERRIDE")
            clearTimeout(timeoutOverrideCancel);
          }
          // OVERRIDE SETPOINTS 
          try {
            if (event.target.classList[0] == "multi-range__handle") {
              for (let att of event.srcElement.attributes) {
                if (att.name == "data-handle-position") {
                  var type_ovrr = att.value == "start" ? "heating" : "cooling";
                  firebase.database().ref(`/messages/${usr.uid}/type`).once('value').then(typeSnapshot => {
                    let type = typeSnapshot.val();
                    if ((type_ovrr == "cooling" && type == 'cool')
                      || (type_ovrr == "heating" && type == 'heat')
                      || (type == 'both')) {
                      let actionMessageContainer = document.getElementById('actionMessagesContainer'),
                        actionMessageDiv = document.getElementById('actionMessages');
                      actionMessageContainer.classList.remove('bemindful');
                      actionMessageContainer.classList.add('override');
                      actionMessageDiv.innerText = 'If you want to earn more points, consider following the guidelines in the override panel!';
                      actionMessageContainer.style.display = "flex";
                      if (actionMessageTimer) {
                        clearTimeout(actionMessageTimer);
                      }
                      actionMessageTimer = setTimeout(() => {
                        actionMessageContainer.style.display = "none";
                        generalMessagesContainer.style.display = "none";
                      }, intervalForReading);
                    }
                  });
                  if (type_ovrr == "cooling") {
                    let interactionUpdate = {};
                    interactionUpdate[`${Date.now()}`] = "override_cooling_handle";
                    firebase.database().ref(`interactions/${usr.uid}/`).update(interactionUpdate).catch(reason => console.error(reason));
                  } else {
                    let interactionUpdate = {};
                    interactionUpdate[`${Date.now()}`] = "override_heating_handle";
                    firebase.database().ref(`interactions/${usr.uid}/`).update(interactionUpdate).catch(reason => console.error(reason));
                  }
                  var aux_hour = new Date().getHours();
                  // Create a pending override
                  firebase.database().ref(`overrides/${usr.uid}`).update({
                    pending: true,
                    heat: values.start,
                    cool: values.end,
                    state: "",
                    hour: 24,
                  });
                  var override_state_button = document.getElementsByClassName('active_override_state').item(0);
                  if (override_state_button != null) {
                    if (type_ovrr == "cooling") {
                      var cool_ovrr = override_state_button.value;

                      if (values.end != last.end) {
                        switch (cool_ovrr) {
                          case "home":
                            actionMessagesCooling(homeThresholds.cooling.low, homeThresholds.cooling.middle, homeThresholds.cooling.high, values.end, last.end);
                            firebase.database().ref(`cursetpoints/${usr.uid}/home`).update({ cool: values.end });
                            break;
                          case "away":
                            actionMessagesCooling(awayThresholds.cooling.low, awayThresholds.cooling.middle, awayThresholds.cooling.high, values.end, last.end);
                            firebase.database().ref(`cursetpoints/${usr.uid}/away`).update({ cool: values.end });
                            break;
                          case "sleep":
                            actionMessagesCooling(sleepThresholds.cooling.low, sleepThresholds.cooling.middle, sleepThresholds.cooling.high, values.end, last.end);
                            firebase.database().ref(`cursetpoints/${usr.uid}/sleep`).update({ cool: values.end });
                            break;
                          default:
                            break;
                        }
                      }
                    } else {
                      var heat_ovrr = override_state_button.value;

                      if (values.start != last.start) {
                        switch (heat_ovrr) {
                          case "home":
                            actionMessagesHeating(homeThresholds.heating.low, homeThresholds.heating.middle, homeThresholds.heating.high, values.start, last.start);
                            firebase.database().ref(`cursetpoints/${usr.uid}/home`).update({ heat: values.start });
                            break;
                          case "away":
                            actionMessagesHeating(awayThresholds.heating.low, awayThresholds.heating.middle, awayThresholds.heating.high, values.start, last.start);
                            firebase.database().ref(`cursetpoints/${usr.uid}/away`).update({ heat: values.start });
                            break;
                          case "sleep":
                            actionMessagesHeating(sleepThresholds.heating.low, sleepThresholds.heating.middle, sleepThresholds.heating.high, values.start, last.start);
                            firebase.database().ref(`cursetpoints/${usr.uid}/sleep`).update({ heat: values.start });
                            break;
                          default:
                            break;
                        }
                      }
                    }
                  } else {
                    // CHANGE DATABASES
                    firebase.database().ref(`cursetpoints/${usr.uid}`).update({ home: { heat: values.start, cool: values.end }, away: { heat: values.start, cool: values.end }, sleep: { heat: values.start, cool: values.end } })
                      .catch(reason => {
                        console.error(reason);
                      });
                  }
                }
              }
            }
          } catch (e) {
            console.error("SOMETHING WRONG WITH THE HANDLES")
            console.error(e);
          }
        }
      }

      function createLabels(container, settings) {
        const labels = document.createElement("div");
        labels.classList.add("multi-range__labels");
        steps = getSteps(slider.offsetWidth, getStepLen(), getHandleOffset());
        steps.forEach(step => {
          const label = document.createElement("label");
          label.classList.add("label");
          if (getFormattedValue(step.value) == "60°F" ||
            getFormattedValue(step.value) == "70°F" ||
            getFormattedValue(step.value) == "80°F")
            label.textContent = getFormattedValue(step.value);
          label.style.left = `${step.stepPercent}%`;
          label.style.top = "0"
          labels.appendChild(label);
          const tick = document.createElement("div");
          tick.classList.add("multi-range__tick");
          container.appendChild(tick);
        });

        return labels;
      }

      function addElementsToDOM() {
        const track = document.createElement("div");
        track.classList.add("multi-range__track");
        DOM.track = track;
        const trackBg = document.createElement("div");
        trackBg.classList.add("multi-range__track-bg");
        const trackFill = document.createElement("div");
        trackFill.classList.add("multi-range__fill");
        DOM.trackFill = trackFill;
        const ticksContainer = document.createElement("div");
        ticksContainer.classList.add("multi-range__ticks");
        let handleContainer = document.createElement("div");
        handleContainer.classList.add("multi-range__handles");
        const leftHandle = document.createElement("div");
        leftHandle.classList.add("multi-range__handle");
        leftHandle.setAttribute("data-handle-position", "start");
        leftHandle.setAttribute("tabindex", 0);
        const rightHandle = document.createElement("div");
        rightHandle.classList.add("multi-range__handle");
        rightHandle.setAttribute("data-handle-position", "end");
        rightHandle.setAttribute("tabindex", 0);
        handleContainer.appendChild(leftHandle);
        handleContainer.appendChild(rightHandle);
        DOM.handles = [leftHandle, rightHandle];
        track.appendChild(trackBg);
        track.appendChild(trackFill);
        slider.appendChild(track);
        slider.appendChild(handleContainer);
        const labels = createLabels(ticksContainer, settings);
        slider.appendChild(labels);
        track.appendChild(ticksContainer);
      }

      function init() {
        addElementsToDOM();
        DOM.handles.forEach(handle => {
          handle.addEventListener("mousedown", startDrag);
          handle.addEventListener("touchstart", startDrag);
          handle.addEventListener("touchend", updateValuesFromHandles);
          handle.addEventListener("touchcancel", updateValuesFromHandles);
          handle.addEventListener("touchmove", onHandleMove);
          handle.addEventListener("mouseup", updateValuesFromHandles);
        });
        window.addEventListener("mouseup", stopDrag);
        window.addEventListener("touchend", stopDrag);
        window.addEventListener("resize", onWindowResize);
        window.addEventListener("mousemove", onHandleMove);
        window.addEventListener("touchmove", onHandleMove);
        window.addEventListener("keydown", onKeyDown);
      }
      function dispatchEvent() {
        let event;
        if (window.CustomEvent) {
          event = new CustomEvent("slider-change", {
            detail: { start: values.start, end: values.end }
          });
        } else {
          event = document.createEvent("CustomEvent");
          event.initCustomEvent("slider-change", true, true, {
            start: values.start,
            end: values.end
          });
        }
        slider.dispatchEvent(event);
      }
      function getClosestStep(newt, handlePosition) {
        const isStart = handlePosition === "start";
        const otherStep = getStep(values[isStart ? "end" : "start"]);
        let closestDistance = Infinity;
        let indetOfClosest = null;
        for (let i = 0; i < steps.length; i++) {
          if (
            (isStart && steps[i].stept < otherStep.stept) ||
            (!isStart && steps[i].stept > otherStep.stept)
          ) {
            const distance = Math.abs(steps[i].stept - newt);
            if (distance < closestDistance) {
              closestDistance = distance;
              indetOfClosest = i;
            }
          }
        }
        return steps[indetOfClosest];
      }
      function updateHandles() {
        DOM.handles.forEach((handle, index) => {
          const step = index === 0 ? getStep(values.start) : getStep(values.end);
          handle.style.left = `${step.stepPercent}%`;
        });
      }
      const getStep = value => steps.find(step => step.value === value);
      function updateFill() {
        const trackWidth = getTrackWidth();
        const startStep = getStep(values.start);
        const endStep = getStep(values.end);
        const newWidth =
          trackWidth - (startStep.stept + (trackWidth - endStep.stept));
        const percentage = newWidth / trackWidth * 100;
        DOM.trackFill.style.width = `${percentage}%`;
        DOM.trackFill.style.left = `${startStep.stepPercent}%`;
      }
      function render() {
        updateFill();
        updateHandles();
      }
      function onHandleMove(event) {
        event.preventDefault();
        if (!dragging) return;
        const handleOffset = getHandleOffset();
        const clientX = event.clientX || event.touches[0].clientX;
        window.requestAnimationFrame(async () => {
          if (!dragging) return;
          const mousex = clientX - slider.offsetLeft;
          const handlePosition = currentHandle.dataset.handlePosition;
          let newX = Math.max(
            handleOffset,
            Math.min(mousex, slider.offsetWidth - handleOffset)
          );
          const currentStep = getClosestStep(newX, handlePosition);
          t = currentHandle.dataset.handlePosition == "start" ? "heating" : "cooling";
          var lessThanMinimumDistance = false;
          try {
            if (t === "heating") {
              if (values.end - currentStep.value <= 4) {
                values[handlePosition] = values.end - 5;
                lessThanMinimumDistance = true;
              } else {
                values[handlePosition] = currentStep.value;
              }
            } else {
              if (currentStep.value - values.start <= 4) {
                values[handlePosition] = values.start + 5;
                lessThanMinimumDistance = true;
              } else {
                values[handlePosition] = currentStep.value;
              }
            }
          } catch (e) {
            onWindowResize();
          }
          var currentModule = document.getElementsByClassName('active_module').item(0).id === "scheduleButton" ? "schedule" : "override";
          if (currentModule == "schedule") {
            try {
              var v = currentStep.value;
              if (!lessThanMinimumDistance) {
                switch (t) {
                  case "heating":
                    let heatingStateOnMovement = document.getElementsByClassName("active_state").item(0).value;
                    if (heatingStateOnMovement == "home") homeHeat = v;
                    else if (heatingStateOnMovement == "away") awayHeat = v;
                    else sleepHeat = v;
                    break;
                  case "cooling":
                    let coolingStateOnMovement = document.getElementsByClassName("active_state").item(0).value;
                    if (coolingStateOnMovement == "home") homeCool = v;
                    else if (coolingStateOnMovement == "away") awayCool = v;
                    else sleepCool = v;
                    break;
                  default:
                    break;
                }
              }
            } catch (e) {
              onWindowResize();
            }
          }
          render();
          dispatchEvent();
        });
      }
      function onKeyDown(e) {
        const keyCode = e.keyCode;
        const handle = getFocusedHandle();
        const keys = {
          "37": "left",
          "39": "right"
        };
        const arrowKey = keys[keyCode];
        if (!handle || !arrowKey) return;
        const handlePosition = handle.dataset.handlePosition;
        const stepIncrement = arrowKey === "left" ? -1 : 1;
        const stepIndet = steps.findIndet(step => step.value === values[handlePosition]);
        const newIndet = stepIndet + stepIncrement;
        if (newIndet < 0 || newIndet >= steps.length) return;
        values[handlePosition] = steps[newIndet].value;
        render();
        dispatchEvent();
      }
      function onWindowResize() {
        steps = getSteps(slider.offsetWidth, getStepLen(), getHandleOffset());
        render();
      }
      function update(newValues) {
        values.start = newValues.start;
        values.end = newValues.end;
        render();
      }
      function on(eventType, fn) {
        slider.addEventListener(eventType, fn);
      }
      function off(eventType, fn) {
        slider.removeEventListener(eventType, fn);
      }
      function destroy(removeElement) {
        DOM.handles.forEach(handle => {
          handle.removeEventListener("mousedown", startDrag);
          handle.removeEventListener("touchstart", startDrag);
        });
        window.removeEventListener("mouseup", stopDrag);
        window.removeEventListener("touchend", stopDrag);
        window.removeEventListener("resize", onWindowResize);
        window.removeEventListener("mousemove", onHandleMove);
        window.removeEventListener("touchmove", onHandleMove);
        window.removeEventListener("keydown", onKeyDown);
        if (removeElement) slider.parentNode.removeChild(slider);
      }
      init();
      render();
      return {
        on,
        off,
        update,
        destroy
      };
    }
    function getFormattedValue(value) {
      return value + "°F";
    }
    const settings = {
      start: 60,
      end: 87,
      increment: 1
    };
    var slider = MultiRangeSlider(
      document.getElementsByClassName("multi-range").item(0),
      settings,
      getFormattedValue
    );

    var slider2 = MultiRangeSlider(
      document.getElementsByClassName("multi-range").item(1),
      settings,
      getFormattedValue
    );
    slider.on("slider-change", event => view.update(event.detail));
    slider2.on("slider-change", event => view2.update(event.detail));
    const view = {
      start: document.getElementById("detailHeat"),
      end: document.getElementById("detailCool"),
      update: function (values) {
        for (let key in values) {
          try {
            this[key].textContent = getFormattedValue(values[key]);
          } catch (e) {
            console.log(e);
          }
        }
      }
    };
    const view2 = {
      start: document.getElementById('overrideHeat'),
      end: document.getElementById('overrideCool'),
      update: function (values) {
        for (let key in values) {
          try {
            this[key].textContent = getFormattedValue(values[key]);
          } catch (e) {
            console.log(e);
          }
        }
      }
    };
    view.update({
      start: 60,
      end: 85
    });
    slider2.update({
      start: 60,
      end: 85,
      update: function (values) {
        for (let key in values) {
          this[key].textContent = getFormattedValue(values[key]);
        }
      }
    });
    view2.update({
      start: 60,
      end: 85
    });
    var rawTicks = document.getElementsByClassName("multi-range__tick");
    var ticks = [];
    for (let tick of rawTicks) {
      ticks.push(tick);
      tick.style.background = "gray";
      tick.style.alignSelf = "flex-end";
    }
    var half = Math.floor(ticks.length / 2);
    for (let i = 0; i < half; i++) {
      if (i == 5 || i == 15 || i == 25) {
        ticks[i].style.height = "2.3em";
      } else if (i % 10 == 0) {
        ticks[i].style.height = "5em";
      } else {
        ticks[i].style.height = "0";
      }
    }
    for (i = 0; i < half; i++) {
      var x = i + half;

      if (i == 5 || i == 15 || i == 25) {
        ticks[x].style.height = "2.8em";
      } else if (i % 10 == 0) {
        ticks[x].style.height = "5em";
      } else {
        ticks[x].style.height = "0";
      }
    }
    var ticksContainer = document.getElementsByClassName("multi-range__ticks")
    for (let tickContainer of ticksContainer) {
      tickContainer.style.background = "#DEDEDE";
    }
  } else {
    window.location.href = '/';
  }
});