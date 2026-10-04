const fs = require("fs");
if (fs.existsSync("config.env"))
  require("dotenv").config({ path: "./config.env" });

function convertToBool(text, fault = "true") {
  return text === fault ? true : false;
}

module.exports = {
  MONGODB: process.env.MONGODB || "mongodb+srv://botuser:Bot123456@cluster0.imw2kqu.mongodb.net/?appName=Cluster0",
OWNER_NUM: process.env.OWNER_NUM || "94761576618",
};
