const chatForm = document.getElementById("chat-form");
const chatWindow = document.getElementById("chat-window");
const userInput = document.getElementById("user-input");
const submitButton = chatForm.querySelector("button");
const fileInput = document.getElementById("file-input");
const fileInputWrapper = fileInput.parentElement;

function generateUserId() {
	return "user_" + Math.random().toString(36).substr(2, 9);
}

function getUserId() {
	let userId = localStorage.getItem("chat_user_id");
	if (!userId) {
		userId = generateUserId();
		localStorage.setItem("chat_user_id", userId);
	}
	return userId;
}

const userId = getUserId();
userInput.focus();

fileInput.addEventListener("change", () => {
	if (fileInput.files.length > 0) {
		fileInputWrapper.classList.add("file-selected");
	} else {
		fileInputWrapper.classList.remove("file-selected");
	}
});

chatForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	let message = userInput.value.trim();
	const file = fileInput.files[0];

	if (!message && !file) return;

	userInput.disabled = true;
	submitButton.disabled = true;
	fileInput.disabled = true;

	if (message) {
		addMessage(message, "user");
	}

	let fileContent = "";
	let fileNameForDisplay = "";

	const typingIndicator = createTypingIndicator();

	try {
		if (file) {
			fileNameForDisplay = file.name;
			addMessage(`(Processing file: ${fileNameForDisplay})`, "user-info");
			fileContent = await readFileAsText(file);
		}

		chatWindow.appendChild(typingIndicator);
		chatWindow.scrollTop = chatWindow.scrollHeight;

		let combinedMessageForBot = message;
		if (fileContent) {
			const fileBlock = `\\n\\n--- Content of file ${fileNameForDisplay} ---\\n${fileContent}\\n--- End of file ${fileNameForDisplay} ---`;
			combinedMessageForBot = message
				? `${message}${fileBlock}`
				: fileBlock.trim();
		}

		userInput.value = "";
		fileInput.value = "";
		fileInput.parentElement.classList.remove("file-selected");

		if (combinedMessageForBot) {
			const botReply = await fetchResponse(combinedMessageForBot);
			addMessage(botReply, "bot");
		} else if (!file) {
			addMessage("(No message entered)", "bot");
		}
	} catch (error) {
		addMessage("Error: Failed to process request.", "bot");
		console.error(error);
	} finally {
		if (document.body.contains(typingIndicator)) {
			chatWindow.removeChild(typingIndicator);
		}
		userInput.disabled = false;
		submitButton.disabled = false;
		fileInput.disabled = false;
		userInput.focus();
	}
});

async function readFileAsText(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => resolve(event.target.result);
		reader.onerror = (error) => reject(error);
		reader.readAsText(file);
	});
}

function addMessage(text, sender) {
	const msg = document.createElement("div");
	msg.classList.add("message");
	if (sender === "user") {
		msg.classList.add("user-message");
	} else if (sender === "bot") {
		msg.classList.add("bot-message");
	} else if (sender === "user-info") {
		msg.classList.add("user-info-message");
	}
	msg.innerHTML = text ? marked.parse(text) : "";
	chatWindow.appendChild(msg);
	chatWindow.scrollTop = chatWindow.scrollHeight;
}

function createTypingIndicator() {
	const container = document.createElement("div");
	container.classList.add("typing-indicator");
	container.innerHTML = `
    <span></span>
    <span></span>
    <span></span>
  `;
	return container;
}

async function fetchResponse(userMsg) {
	const response = await fetch("/api/generate", {
		method: "POST",
		body: JSON.stringify({
			question: userMsg,
			user_id: userId,
		}),
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error("Network response was not OK");
	}

	const data = await response.json();
	return data.response || "(No response)";
}
