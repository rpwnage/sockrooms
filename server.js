const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

// Define user information
const users = {};
const defaultUsername = "Anon";

app.use(express.static("public"));

io.on("connection", (socket) => {
	console.log(`[${socket.id}] User connected`);

	users[socket.id] = {
		id: socket.id,
		username: defaultUsername, // give the user a default username
		position: {
			x: 0,
			y: 0,
			z: 0,
		},
	};

	function setUsername(username) {
		if (username) {
			// Validate username (optional, add checks for length, allowed characters, etc.)
			users[socket.id].username = username;
			console.log(`[${socket.id}] Username set to ${username}`);
		}
	}

	const username = socket.handshake.query.username;
	if (username) {
		setUsername(username); // Set username if provided
	} else {
		console.log(
			`[${socket.id}] Username has not been provided, defaulting to '${defaultUsername}'`
		);
	}

	// Listen for the "set-username" event from the client
	socket.on("set-username", (username) => {
		setUsername(username); // Call setUsername function with received username
	});

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
		console.log(`[${socket.id}] User disconnected`);

		// Remove the disconnected user from the list
		delete users[socket.id];

		// Broadcast the disconnected user information to all clients
		socket.broadcast.emit("user-disconnected", socket.id);
	});
});

http.listen(3000, () => {
	console.log("Server listening on port 3000");
});
