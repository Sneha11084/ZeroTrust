const io = require("socket.io-client");
const axios = require("axios");

const socket = io(process.env.REACT_APP_API_URL || "http://localhost:5000", {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("TEST CLIENT CONNECTED");
  
  // Trigger a login attempt
  axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`, {
    email: "test@example.com",
    password: "wrongpassword"
  }).catch(e => {
    console.log("Login rejected, expected. Waiting for socket event...");
  });
});

socket.on("new_login_attempt", (data) => {
  console.log("TEST CLIENT RECEIVED new_login_attempt:", data);
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.error("TEST CLIENT ERROR:", err);
  process.exit(1);
});

setTimeout(() => {
  console.error("TIMEOUT: Did not receive event in 10s");
  process.exit(1);
}, 10000);
