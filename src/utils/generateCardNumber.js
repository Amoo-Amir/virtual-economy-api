const crypto = require("node:crypto");

function generateCardNumber() {
  return crypto.randomInt(100000000000, 1000000000000).toString();
}

module.exports = generateCardNumber;
