require("dotenv").config();
require("./http"); // run http server
const firebase = require("./api/firebase");

// Catch Errors before they crash the app.
process.on("uncaughtException", err => {
  const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
  console.error("Uncaught Exception: ", errorMsg);
  // process.exit(1); //Eh, should be fine, but maybe handle this?
});

process.on("unhandledRejection", err => {
  console.error("Uncaught Promise Error: ", err);
  // process.exit(1); //Eh, should be fine, but maybe handle this?
});
process.on("SIGINT", function() {
  console.log("Starting queue shutdown");
  firebase.disconnectRunner();
});
