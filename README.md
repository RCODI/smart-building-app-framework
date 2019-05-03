
# smart-building-app-framework

Date: April 19, 2018
Version of Document: 0.1 

1. MySmartE App – Installation and Overview

MySmartE App is a web-based that allows you to control your thermostat remotely and monitor their energy status. It is currently used on Amazon Firetablets but can also be viewed on mobile phones later. The application is developed using Node.js, Javascript, Jade and CSS. This document gives and overview of the code of the application.

1.1 Setup

For developers, in order to start working on the project, the initial step is to clone the repository from the RCODI GitHub accounts. Then install the dependencies of the project by running the command `npm install` (remember that commands in this documentation are for Linux/MacOs, find the equivalent for Windows). If you find any problems on “building”, try the command `npm rebuild`. That error might be caused by the dependencies as “appmetrics-dash”. You don’t have to use a daemon tool to keep your server alive, but it’s recommended since it makes the reboot and maintenance of the server much more easy. (From my experience I’d recommend using nodemon). 

Once you have cloned the repository and installed the dependencies, you’ll have to set redis up in order to run the app. The repository have a configuration file called `redis.conf`. This is configuration file for the redis-server you’ll have to set up. The steps to do so can be found here.

After this, you should be able to run the nodejs app in your local environment. A few things to remember: since the code is for a single server-app having multiple apps running at the same time could cause problems with the ecobee requests and the integrity of the jobs because the jobs user request will be executed and processed as many times as server-apps there are running. 

Another important aspect to take into account is the authentication with the different services this app is dependent of. You’ll have to authenticate for the services of Firebase Realtime Database, the Bigquery Data Warehouse and the Ecobee API. For the first two you’ll have to get the .json` files to add to the project. (Once the project is set up you can manage on the credentials for users that will make queries to that project). Think of those as your password using your app as username. For ecobee you’ll have to follow their process of authentication and token’s refreshing, and you can find that here.

1.1.1 Initialization

For the initialization, you’ll have to proceed with several things. 

First is to set the ecobee credentials with the app. This will result in having a pair of refresh/access tokens to make requests to the Ecobee API. Those tokens will be stored in Firebase once you end up the setup. The process to grant access to an ecobee account for a third-party app is more detailed here. To request a pin with the existing app, you can use the route: /ecobee/pin, and once you’ve done everything in the ecobee admin site, then you can use the route: /ecobee/init/:cid/:token to record the tokens on the firebase project. You can also do this by hand by examining the ecobee.js file and reusing the request there. 

You should be wondering when those tokens will expire, and the short answer is that the app already handles the refreshing of those and keeping them updated on firebase. 


1.2 General Structure

The app is divided in several systems, they’re the nodejs app/server, the firebase real-time database and the Google BigQuery data warehouse, the Ecobee API and multiple thermostats, Alexa’s skill and Echo dots, and the tablet’s or browser.

1.3 Main Files

1.3.1 Routes

The main function of the routes in the nodejs app is to serve services to a client, so to speak, as an API. Although the purpose of the routes for the current version of the app is not meant to be used as API routes. The routes serve as bridges to the clients to change information on the backend and they can handle all http requests currently available such as GET, POST, etc... In the following sections there’ll be a detailed information of all of them.

1.3.1.1 bq route

The bq route is used for insertion of rows on the Bigquery project. Since the queries for Bigquery can only be performed using a library for nodejs instead of the users themselves, the route handles those queries/insertions to the community-connected project in Bigquery.

This routes are referenced in the main.js file and they normally are summoned on behalf on changes to the ecobee thermostat. Those routes include: “setpoint”, “schedule”, “cursetpoint”, “curschedule” and “canceloverride”. 

1.3.1.2 ecobee route

The ecobee route is used for changing or setting the schedule of your thermostat and updating the same in the database.

These operations are also invoked in the main.js file

1.3.1.3 login route

This is used to render the login page.

1.3.1.4 Index route

The index.js is used to check the connection of the URL and also update the survey results (satisfaction, expectation, experiences and problems) of the user in the database.

1.3.2 App.js 

App.js handles the routes which are responsible for handling the service requests to apis and views which are responsible for the appearance of the app and javascripts which control the functionality of the app.

1.3.3 Public Folder

1.3.3.1 Main.js

The main.js handles every user interaction on the app. It sends request to the ecobee API to change the temperature of the thermostat and send requests to the database to update data in the databse or to retrieve data.

1.3.3.2 Login.js

The login.js helps authenticate the user login requests. It connects to firebase and checks the entered credentials to validate and authenticate the request and redirects to the home page upon successful login.

1.3.3.3 twoHandleSlider.js

The two handle slider monitors the temperature settings made by the user I the front-end and displays the action messages and general messages accordingly based on the thresholds defined.
It updates the setpoint values to the firebase database too.

1.3.3.4 style.css

Style.css has the css code that controls the appearance of every component on the app. When the appearance of particular element has to be changed, get the element id from the index.jade and change the properties of that element id accordingly in style.css.

2. Nodejs server

2.1 Init Setup

For the initial setup, run the command, “npm install “ to install all the dependencies the app requires. To run the app, use the command – nodemon bin/www.
Both the commands have to be run the same folder as app.js.

3. License in using this code

This code is available under the [GNU license](https://www.gnu.org/licenses/gpl-3.0.en.html).
> All rights granted under this License are granted for the term of copyright on the Program, and are irrevocable provided the stated conditions are met. This License explicitly affirms your unlimited permission to run the unmodified Program. The output from running a covered work is covered by this License only if the output, given its content, constitutes a covered work. This License acknowledges your rights of fair use or other equivalent, as provided by copyright law.

4. Funding sources and authors

This project was supported by the following National Science Foundation (NSF). 
Authors: Research Center for Open Digital Innovation: Dr. Sabine Brunswicker, Jesús Enrique Aldana Sigoña (PhD student), Juan Camilo Cárdenas Gómez (Software Developer), Monika Kamma (Graduate Student)
Github account: https://github.com/RCODI/smart-building-app-framework (Project Github Account with additional project related software code)
