import * as THREE from "three";
const socket = io(import.meta.env.VITE_WS_URL, { transports: ["websocket"] });

// Scene, Camera, Renderer setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
const renderer = new THREE.WebGLRenderer({
	canvas: document.getElementById("webgl-canvas"),
});

camera.position.z = 5;

// Create a cube geometry and material
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// Create a cube mesh (our own) and add it to the scene
const myCube = new THREE.Mesh(geometry, material);
scene.add(myCube);

// Store user information
let myUserId;
let myPosition = { x: 0, y: 0, z: 0 };

// Dictionary to store other user's cubes and their positions
const otherUsers = {};

// Function to create a cube mesh for another user
function createUserCube(userId, position) {
	const otherMaterial = new THREE.MeshBasicMaterial({
		color: Math.random() * 0xffffff,
	}); // Random color
	const otherCube = new THREE.Mesh(geometry, otherMaterial);
	otherCube.position.set(position.x, position.y, position.z);
	otherUsers[userId] = otherCube;
	scene.add(otherCube);
}

// Update user position based on keyboard input
document.addEventListener("keydown", (event) => {
	const speed = 1;
	switch (event.key) {
		case "w":
			myPosition.z += speed;
			break;
		case "s":
			myPosition.z -= speed;
			break;
		case "a":
			myPosition.x -= speed;
			break;
		case "d":
			myPosition.x += speed;
			break;
	}

	// Send updated position to the server
	socket.emit("user-movement", { position: myPosition });
	myCube.position.set(myPosition.x, myPosition.y, myPosition.z);
});

// Handle received user data from the server (including our own)
socket.on("user-data", (users) => {
	myUserId = users[socket.id].id; // Get our own ID
	myPosition = users[socket.id].position; // Update our own position

	// Update our own cube's position
	myCube.position.set(myPosition.x, myPosition.y, myPosition.z);

	// Create and update other user cubes based on received data
	for (const userId in users) {
		if (userId !== myUserId) {
			// Check if user already exists before creating a new cube
			if (!otherUsers[userId]) {
				createUserCube(userId, users[userId].position);
			} else {
				otherUsers[userId].position.set(
					users[userId].position.x,
					users[userId].position.y,
					users[userId].position.z
				);
			}
		}
	}
});

// Handle new user joining (received from server)
socket.on("new-user", (newUser) => {
	// Create and display the new user's cube
	createUserCube(newUser.id, newUser.position);
});

// Handle updates of other user positions
socket.on("user-updates", (users) => {
	// Update positions of other user cubes based on received data
	for (const userId in users) {
		if (userId !== myUserId) {
			// Ensure user exists before accessing their cube
			if (otherUsers[userId]) {
				otherUsers[userId].position.set(
					users[userId].position.x,
					users[userId].position.y,
					users[userId].position.z
				);
			} else {
				console.warn(`Received update for unknown user: ${userId}`);
				myCube.position.set(myPosition.x, myPosition.y, myPosition.z);
			}
		}
	}
});

// Handle user disconnection
socket.on("user-disconnected", (disconnectedUserId) => {
	if (otherUsers[disconnectedUserId]) {
		scene.remove(otherUsers[disconnectedUserId]);
		delete otherUsers[disconnectedUserId];
	}
});

// Animation loop
function animate() {
	requestAnimationFrame(animate);

	renderer.render(scene, camera);
}

animate();
