const io = require("socket.io-client");
const socket = io(process.env.REACT_APP_API_URL || "http://localhost:5000", { transports: ["websocket"] });
socket.on("connect", () => {
  console.log("TEST2 CONNECTED to", socket.id);
});
socket.on("new_login_attempt", (data) => {
  console.log("RECEIVED IN TEST2:", data);
});
socket.on("threat_level_change", (data) => {
  console.log("RECEIVED THREAT LEVEL IN TEST2:", data);
});
