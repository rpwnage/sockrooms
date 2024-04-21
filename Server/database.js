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
				createUsersTableIfNotExists() // Check and create table if needed
					.then(() => resolve())
					.catch((err) => reject(err));
			}
		});
	});
}

function createUsersTableIfNotExists() {
	return new Promise((resolve, reject) => {
		db.run(
			`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        position_x REAL,
        position_y REAL,
        position_z REAL
      );`,
			(err) => {
				if (err) {
					reject(err);
				} else {
					console.log(
						"[DB] Table 'users' created (if it did not exist)."
					);
					resolve();
				}
			}
		);
	});
}

// Function to update user position (assuming it's called updateUserPosition)
function updateUserPosition(userId, position) {
	return new Promise((resolve, reject) => {
		if (!db) {
			return reject(
				new Error("Database not connected. Call connectDB() first.")
			);
		}

		const stmt = db.prepare(
			"UPDATE users SET position_x = ?, position_y = ?, position_z = ? WHERE id = ?"
		);
		stmt.run(position.x, position.y, position.z, userId, (err) => {
			if (err) {
				reject(err);
			} else {
				console.log(`[DB][${userId}] User position updated.`);
				resolve();
			}
		});
	});
}

module.exports = {
	connectDB,
	updateUserPosition,
};
