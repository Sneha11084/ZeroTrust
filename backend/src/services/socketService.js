const { getIO } = require('../config/socketInstance');

function emitNewLoginAttempt(payload) {
  const io = getIO();
  if (!io) return;
  console.log('Emitting new_login_attempt:', payload);
  io.emit('new_login_attempt', {
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

function emitThreatLevelChange(level) {
  const io = getIO();
  if (!io) return;
  console.log('Emitting threat_level_change:', level);
  io.emit('threat_level_change', { level });
}

function emitNewBlockedIP(payload) {
  const io = getIO();
  if (!io) return;
  console.log('Emitting new_blocked_ip:', payload);
  io.emit('new_blocked_ip', {
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  emitNewLoginAttempt,
  emitThreatLevelChange,
  emitNewBlockedIP,
};
