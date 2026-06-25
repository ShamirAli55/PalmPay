const { randomUUID } = require("crypto");

function makeEvent(data = {}) {
  return {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    ...data,
  };
}

module.exports = { makeEvent };
