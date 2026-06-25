let io;

function setIO(serverIO) {
  io = serverIO;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }
  return io;
}

module.exports = { setIO, getIO };
