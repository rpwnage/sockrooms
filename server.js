const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

// Define user information
const users = {};

app.use(express.static("public"));

io.on("connection", (socket) => {
	console.log("A user connected:", socket.id);

	// Assign a unique ID to the user
	users[socket.id] = {
		id: socket.id,
		position: {
			x: 0,
			y: 0,
			z: 0,
		},
	};

	// Send the user their ID and position data (including their own)
	socket.emit("user-data", users);

	// Broadcast the new user information to all clients (except the new user)
	socket.broadcast.emit("new-user", users[socket.id]);

	// Handle user movement updates
	socket.on("user-movement", (data) => {
		users[socket.id].position = data.position;

		// Broadcast the updated user positions to all clients
		socket.emit("user-updates", users);

		// First update the own position, then brodcast the updated positions to all other clients
		socket.broadcast.emit("user-updates", users);
	});

	// Handle user disconnection
	socket.on("disconnect", () => {
		console.log("A user disconnected:", socket.id);

		// Remove the disconnected user from the list
		delete users[socket.id];

		// Broadcast the disconnected user information to all clients
		socket.broadcast.emit("user-disconnected", socket.id);
	});
});

http.listen(3000, () => {
	console.log("Server listening on port 3000");
});
