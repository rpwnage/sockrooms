function initializeChat(socket) {
	const chatWindow = document.getElementById("chat-window");
	const chatMessages = document.getElementById("chat-messages");
	const chatInput = document.getElementById("chat-input");
	const chatMenuButton = document.getElementById("chat-menu-button");
	const chatMenu = document.getElementById("chat-menu");
	const chatMenuDropDown = document.getElementById("chat-menu-dropdown");
	const settingsButton = document.getElementById("settings-button");

	let isChatOpen = false;
	let isChatMenuDropdownOpen = false;
	let chatInputFocused = false;

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

	function addChatMessage(message, playerIsAuthor = false) {
		const div = document.createElement("div");
		if (playerIsAuthor) div.className = "chat-message sent-message";
		else div.className = "chat-message received-message";
		div.textContent = message;
		chatMessages.appendChild(div);
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}

	function addChatInfoMessage(message) {
		const div = document.createElement("div");
		div.className = "chat-info-message";
		div.textContent = `--- ${message} ---`;
		chatMessages.appendChild(div);
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}

	chatInput.addEventListener("focus", () => {
		window.chatInputFocused = true;
	});

	chatInput.addEventListener("focusout", () => {
		window.chatInputFocused = false;
	});

	chatInput.addEventListener("keydown", (event) => {
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

	document.addEventListener("keydown", (event) => {
		switch (event.key) {
			case "Enter":
				if (!window.chatInputFocused) toggleChat();
				break;
		}
	});
}

export default initializeChat;
