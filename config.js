const fs = require("fs");
if (fs.existsSync("config.env"))
  require("dotenv").config({ path: "./config.env" });

function convertToBool(text, fault = "true") {
  return text === fault ? true : false;
}

module.exports = {
  SESSION_ID: process.env.SESSION_ID || "Enter your session ID",
  MONGODB: process.env.MONGODB_URL || process.env.MONGODB || "mongodb+srv://gamingkolla788_db_user:QJ7VrzsikZba7QV@cluster0.imw2kqu.mongodb.net/?appName=Cluster0",
  OWNER_NUM: process.env.OWNER_NUM || "94761576618",
};
