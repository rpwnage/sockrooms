import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// DOM Elements
const canvas = document.getElementById("webgl-canvas");

canvas.width = window.innerWidth; // Set width to full window width
canvas.height = window.innerHeight; // Set height to full window height

const usernameInput = document.getElementById("username-input");
const setUsernameButton = document.getElementById("set-username-btn");
const chatWindow = document.getElementById("chat-window");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const chatMenuButton = document.getElementById("chat-menu-button");
const chatMenu = document.getElementById("chat-menu");
const chatMenuDropDown = document.getElementById("chat-menu-dropdown");
const settingsButton = document.getElementById("settings-button");
const coordinatesOverlay = document.getElementById("coordinates-overlay");

$(".chat-window").draggable({ handle: ".chat-title", scroll: false });
setUsernameButton.addEventListener("click", () => {
	const username = usernameInput.value.trim(); // Trim leading/trailing spaces
	if (username) {
		// Remove everything except the canvas, show the canvas!
		usernameInput.remove();
		setUsernameButton.remove();
		canvas.style.display = "";

		let isChatOpen = false;
		let isChatMenuDropdownOpen = false;
		let isMovementPaused = false;

		let developmentMode = true;

		function main() {
			function toggleChat() {
				if (isChatOpen) {
					chatWindow.style.display = "none";
					isChatOpen = false;
				} else {
					chatWindow.style.display = "";
					chatInput.focus();
					isChatOpen = true;
				}
			}

			function toggleChatMenuDropdown() {
				if (isChatMenuDropdownOpen) {
					chatMenuDropDown.style.display = "none";
					isChatMenuDropdownOpen = false;
				} else {
					chatMenuDropDown.style.display = "";
					isChatMenuDropdownOpen = true;

					document.addEventListener("click", (event) => {
						const withinBoundaries = event
							.composedPath()
							.includes(chatMenu);

						if (isChatMenuDropdownOpen) {
							if (!withinBoundaries) {
								toggleChatMenuDropdown();
							}
						}
					});
				}
			}

			// Set the username
			socket.emit("set-username", username);

			// Scene, Camera, Renderer setup
			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera(
				80,
				window.innerWidth / window.innerHeight,
				0.1,
				1000
			);

			const renderer = new THREE.WebGLRenderer({
				antialias: true,
				canvas: document.getElementById("webgl-canvas"),
			});

			const controls = new OrbitControls(camera, renderer.domElement);

			camera.position.z = 5;

			// Create a cube geometry and material
			const geometry = new THREE.BoxGeometry(1, 1, 1);
			const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

			// Create a cube mesh (our own) and add it to the scene
			const myCube = new THREE.Mesh(geometry, material);
			scene.add(myCube);

			controls.target.copy(myCube.position); // Set object as target for rotation
			controls.enableDamping = true; // Enable smooth damping effect
			controls.dampingFactor = 0.25; // Adjust damping factor

			// Store user information
			let myUserId;
			let myPosition = { x: 0, y: 0, z: 0 };

			// Dictionary to store other user's cubes and their positions
			const otherUsers = {};

			const desiredDistance = 5; // Adjust as needed

			function constrainCameraDistance(camera, target, distance) {
				const direction = new THREE.Vector3()
					.subVectors(camera.position, target)
					.normalize();
				const newPosition = target
					.clone()
					.add(direction.multiplyScalar(distance));
				camera.position.copy(newPosition);
			}

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

				otherUsers[userId] = {
					cube: otherCube,
					sprite: usernameSprite,
				}; // Store both cube and sprite
			}

			function addChatMessage(message, playerIsAuthor = false) {
				const div = document.createElement("div");
				if (playerIsAuthor) div.className = "chat-message sent-message";
				else div.className = "chat-message received-message";
				div.textContent = message;
				chatMessages.appendChild(div);
				chatMessages.scrollTop = chatMessages.scrollHeight;
			}

			function addJoinMessage(username) {
				const div = document.createElement("div");
				div.className = "user-joined-message";
				div.textContent = `--- ${username} joined ---`;
				chatMessages.appendChild(div);
				chatMessages.scrollTop = chatMessages.scrollHeight;
			}

			chatInput.addEventListener("focus", () => {
				isMovementPaused = true;
			});

			chatInput.addEventListener("focusout", () => {
				isMovementPaused = false;
			});

			chatInput.addEventListener("keydown", (event) => {
				console.log(event.key);
				switch (event.key) {
					case "Enter":
						if (isChatOpen) {
							// Clear the chat window
							let message = chatInput.value.trim();
							if (message[0] == "/") {
								// handle the input as a command. Still gotta come up with a system for this. - TODO
							} else {
								if (message.replace(" ", "").length > 0) {
									chatInput.value = "";
									addChatMessage(message, true);
									socket.emit("chat-message", message);
								}
							}
						}
				}
			});

			chatMenuButton.addEventListener("click", function () {
				toggleChatMenuDropdown();
			});

			// Dropdown Menu items

			settingsButton.addEventListener("click", function () {});

			socket.on("chat-message", (message) => {
				if (isChatOpen) {
					addChatMessage(message, false);
				}
			});

			function updateCoordinates() {
				coordinatesOverlay.innerText = `(${myPosition.x}, ${myPosition.y}, ${myPosition.z})`;
			}

			// Update user position based on keyboard input
			document.addEventListener("keydown", (event) => {
				const speed = 1;
				if (!isMovementPaused) {
					switch (event.key) {
						case "w":
							myPosition.z -= speed;
							controls.target.z -= speed; // Move target left
							break;
						case "s":
							myPosition.z += speed;
							controls.target.z += speed; // Move target left
							break;
						case "a":
							myPosition.x -= speed;
							controls.target.x -= speed; // Move target left
							break;
						case "d":
							myPosition.x += speed;
							controls.target.x += speed; // Move target right
							break;
						case " ":
							myPosition.y += speed;
							controls.target.y += speed; // Move target up
							break;
						case "Shift":
							myPosition.y -= speed;
							controls.target.y -= speed; // Move target down
							break;
						case "Enter":
							toggleChat();
							break;
					}
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
							createUserCube(
								users[userId],
								users[userId].position
							);
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
				addJoinMessage(newUser.username);
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
				controls.update();
				constrainCameraDistance(
					camera,
					controls.target,
					desiredDistance
				);

				updateCoordinates();
				renderer.render(scene, camera);
			}

			animate();
		}

		// Connect to the server with the chosen username
		const socket = io(
			import.meta.env.VITE_WS_URL + `?username=${username}`,
			{
				transports: ["websocket"],
			}
		);

		if (!developmentMode) {
			socket.on("connect_error", (err) => {
				console.error("Socket.IO connection failed:", err);
				// Display error message to the user (e.g., using alert, toast notification)
				alert(
					"Failed to connect to server. Please check your internet connection or try again later."
				);

				window.location.reload();
			});
		}

		if (!developmentMode) {
			socket.on("connect", () => {
				main();
			});
		} else {
			main();
		}
	} else {
		alert("Please enter a username");
	}
});
