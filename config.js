const fs = require("fs");
if (fs.existsSync("config.env"))
  require("dotenv").config({ path: "./config.env" });

function convertToBool(text, fault = "true") {
  return text === fault ? true : false;
}

module.exports = {
  SESSION_ID: process.env.SESSION_ID || "Enter your session ID",
  MONGODB: process.env.MONGODB || "mongodb+srv://gamingkolla788_db_user:aTw7a2D1sg0qX0AA@cluster0.fmw2kqu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  OWNER_NUM: process.env.OWNER_NUM || "94752634200",
};
