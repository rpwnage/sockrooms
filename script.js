import * as THREE from "three";

// DOM Elements
const canvas = document.getElementById("webgl-canvas");

canvas.width = window.innerWidth; // Set width to full window width
canvas.height = window.innerHeight; // Set height to full window height

const usernameInput = document.getElementById("username-input");
const setUsernameButton = document.getElementById("set-username-btn");

setUsernameButton.addEventListener("click", () => {
	const username = usernameInput.value.trim(); // Trim leading/trailing spaces
	if (username) {
		// Remove everything except the canvas, show the canvas!
		usernameInput.remove();
		setUsernameButton.remove();
		canvas.style.display = "";

		// Connect to the server with the chosen username
		const socket = io(
			import.meta.env.VITE_WS_URL + `?username=${username}`,
			{
				transports: ["websocket"],
			}
		);

		// Set the username
		socket.emit("set-username", username);

		// Scene, Camera, Renderer setup
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);

		const renderer = new THREE.WebGLRenderer({
			antialias: true,
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
		function createUserCube(userElement, position) {
			const userId = userElement.id;
			const otherMaterial = new THREE.MeshBasicMaterial({
				color: Math.random() * 0xffffff,
			}); // Random color
			const otherCube = new THREE.Mesh(geometry, otherMaterial);
			otherCube.position.set(position.x, position.y, position.z);
			otherUsers[userId] = otherCube;
			scene.add(otherCube);
			// Create a text sprite for the username
			const usernameCanvas = document.createElement("canvas");
			const usernameContext = usernameCanvas.getContext("2d");
			usernameContext.font = "16px Arial";
			usernameContext.fillStyle = "white";
			usernameContext.fillText(userElement.username, 10, 20); // Adjust position as needed

			const usernameTexture = new THREE.Texture(usernameCanvas);
			usernameTexture.needsUpdate = true;

			const usernameMaterial = new THREE.SpriteMaterial({
				map: usernameTexture,
			});
			const usernameSprite = new THREE.Sprite(usernameMaterial);
			usernameSprite.position.set(
				position.x,
				position.y + 0.5,
				position.z
			); // Position above the cube

			if (usernameSprite) {
				scene.add(usernameSprite);
			}

			otherUsers[userId] = { cube: otherCube, sprite: usernameSprite }; // Store both cube and sprite
		}

		// Update user position based on keyboard input
		document.addEventListener("keydown", (event) => {
			const speed = 0.1;
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
				console.log(users[userId]);
				if (userId !== myUserId) {
					// Check if user already exists before creating a new cube
					if (!otherUsers[userId]) {
						createUserCube(users[userId], users[userId].position);
					} else {
						otherUsers[userId].cube.position.set(
							users[userId].cube.position.x,
							users[userId].cube.position.y,
							users[userId].cube.position.z
						);
					}
				}
			}
		});

		// Handle new user joining (received from server)
		socket.on("new-user", (newUser) => {
			// Create and display the new user's cube
			createUserCube(newUser, newUser.position);
		});

		// Handle updates of other user positions
		socket.on("user-updates", (users) => {
			// Update positions of other user cubes and username sprites
			for (const userId in users) {
				if (userId !== myUserId) {
					// Ensure user exists in otherUsers before accessing properties
					if (otherUsers[userId]) {
						otherUsers[userId].cube.position.set(
							users[userId].position.x,
							users[userId].position.y,
							users[userId].position.z
						);

						// Update username sprite position if it exists
						if (otherUsers[userId].sprite) {
							otherUsers[userId].sprite.position.set(
								users[userId].position.x,
								users[userId].position.y + 0.5,
								users[userId].position.z
							); // Keep above the cube
						}
					} else {
						console.warn(
							`Received update for unknown user: ${userId}`
						);
					}
				}
			}
		});

		// Handle user disconnection
		socket.on("user-disconnected", (disconnectedUserId) => {
			if (otherUsers[disconnectedUserId]) {
				scene.remove(otherUsers[disconnectedUserId].cube);
				scene.remove(otherUsers[disconnectedUserId].sprite);
				delete otherUsers[disconnectedUserId];
			}
		});

		// Animation loop
		function animate() {
			requestAnimationFrame(animate);

			renderer.render(scene, camera);
		}

		animate();
	} else {
		alert("Please enter a username");
	}
});
