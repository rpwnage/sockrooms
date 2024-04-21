const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const sqlite3 = require("sqlite3").verbose();

// Data structures for users and default username
const users = {};
const defaultUsername = "Anon";

// Separate database functionality using `require`
const db = require("./database");
// Call connectDB before using database functions
db.connectDB()
	.then(() => {
		console.log("[DB] Database connection established");
		// Start of the server logic here, including Socket.IO initialization

		io.on("connection", (socket) => {
			console.log(`[${socket.id}] User connected`);

			// Create a new user object with ID, username, and default position
			users[socket.id] = {
				id: socket.id,
				username: defaultUsername,
				position: {
					x: 0,
					y: 0,
					z: 0,
				},
			};

			// Function to set the username (with optional validation)
			function setUsername(username) {
				if (username) {
					// Consider adding checks for username length, allowed characters, etc.
					users[socket.id].username = username;
					console.log(`[${socket.id}] Username set to ${username}`);
				}
			}

			// Check for username in handshake query and set it if provided
			const username = socket.handshake.query.username;
			if (username) {
				setUsername(username);
			} else {
				console.log(
					`[${socket.id}] Username not provided, defaulting to '${defaultUsername}'`
				);
			}

			// Listen for "set-username" event from client and update username
			socket.on("set-username", (username) => {
				setUsername(username);
			});

			// Send the user their own data and information about all users
			socket.emit("user-data", users);

			// Broadcast new user information to all connected clients (except the new user)
			socket.broadcast.emit("new-user", users[socket.id]);

			// Handle user movement updates
			socket.on("user-movement", (data) => {
				users[socket.id].position = data.position;

				db.updateUserPosition(socket.id, data.position)
					.then(() => {
						console.log(
							`[${socket.id}] User position updated in database.`
						);
					})
					.catch((err) => {
						console.error(
							`Error updating user position: ${err.message}`
						);
					});

				// Broadcast the updated user positions to all clients
				io.emit("user-updates", users); // Emit to all, including the user itself
			});

			// Handle chat messages by logging and broadcasting them
			socket.on("chat-message", (message) => {
				console.log(`[${socket.id}] Message: ${message}`);
				socket.broadcast.emit("chat-message", message);
			});

			// Handle user disconnection
			socket.on("disconnect", () => {
				console.log(`[${socket.id}] User disconnected`);

				// Remove the disconnected user from the list
				delete users[socket.id];

				// Broadcast the disconnected user ID to all clients
				socket.broadcast.emit("user-disconnected", socket.id);
			});
		});
	})
	.catch((err) => {
		console.error("Error connecting to database:", err.message);
		// Handle connection error gracefully (e.g., exit the server)
	});

http.listen(3000, () => {
	console.log("Server listening on port 3000");
});
