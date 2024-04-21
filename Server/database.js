const sqlite3 = require("sqlite3").verbose();

const DATABASE_PATH = "sockroom.db";
let db;

function connectDB() {
	return new Promise((resolve, reject) => {
		db = new sqlite3.Database(DATABASE_PATH, (err) => {
			if (err) {
				console.error(
					"[DB] Error connecting to database:",
					err.message
				);
				reject(err);
			} else {
				console.log("[DB] Connected to database successfully.");
				createTableIfNotExists() // Check and create table if needed
					.then(() => resolve())
					.catch((err) => reject(err));
			}
		});
	});
}

function createTableIfNotExists() {
	return new Promise((resolve, reject) => {
		db.run(
			`CREATE TABLE IF NOT EXISTS user_movement (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        x REAL NOT NULL,
        y REAL NOT NULL,
        z REAL NOT NULL
      )`,
			(err) => {
				if (err) {
					reject(err);
				} else {
					console.log(
						'[DB] Table "user_movement" created (if it did not exist).'
					);
					resolve();
				}
			}
		);
	});
}

// Function to log user movement data into the database
function logUserMovement(userId, position) {
	return new Promise((resolve, reject) => {
		if (!db) {
			return reject(
				new Error("Database not connected. Call connectDB() first.")
			);
		}

		// Replace with your actual column names (ensure prepared statements)
		const stmt = db.prepare(
			"INSERT INTO user_movement (user_id, timestamp, x, y, z) VALUES (?, ?, ?, ?, ?)"
		);
		const timestamp = Date.now(); // Get current timestamp

		stmt.run(
			userId,
			timestamp,
			position.x,
			position.y,
			position.z,
			(err) => {
				if (err) {
					reject(err);
				} else {
					console.log(
						`[DB] User movement for ${userId} logged at ${timestamp}.`
					);
					resolve(); // Or return the inserted data ID if needed
				}
			}
		);
	});
}

module.exports = {
	connectDB,
	logUserMovement,
};
