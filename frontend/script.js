const chatForm = document.getElementById("chat-form");
const chatWindow = document.getElementById("chat-window");
const userInput = document.getElementById("user-input");
const submitButton = chatForm.querySelector("button");
const fileInput = document.getElementById("file-input");

// Funkcja generuj�ca unikalny identyfikator u�ytkownika
function generateUserId() {
	return "user_" + Math.random().toString(36).substr(2, 9);
}

// Pobierz lub utw�rz identyfikator u�ytkownika
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

chatForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	const message = userInput.value.trim();
	const file = fileInput.files[0];

	if (!message && !file) return;

	if (message) {
		addMessage(message, "user");
	}
	userInput.value = "";
	userInput.focus();

	userInput.disabled = true;
	submitButton.disabled = true;
	fileInput.disabled = true;

	const typingIndicator = createTypingIndicator();
	chatWindow.appendChild(typingIndicator);
	chatWindow.scrollTop = chatWindow.scrollHeight;

	try {
		if (file) {
			await uploadFile(file);
			fileInput.value = ""; // wyczy�� pole pliku po wys�aniu
		}
		if (message) {
			const botReply = await fetchResponse(message);
			addMessage(botReply, "bot");
		}
	} catch (error) {
		addMessage("Error: Failed to get response from bot.", "bot");
		console.error(error);
	}

	chatWindow.removeChild(typingIndicator);
	userInput.disabled = false;
	submitButton.disabled = false;
	fileInput.disabled = false;
	userInput.focus();
});

async function uploadFile(file) {
	const formData = new FormData();
	formData.append("file", file);
	formData.append("user_id", userId);

	const response = await fetch("/api/upload", {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		throw new Error("File upload failed");
	}
	const data = await response.json();
	addMessage(`(file sended: ${data.filename})`, "user");
}

function addMessage(text, sender) {
	const msg = document.createElement("div");
	msg.classList.add(
		"message",
		sender === "user" ? "user-message" : "bot-message"
	);
	msg.innerHTML = marked.parse(text);
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
			user_id: userId, // Dodajemy identyfikator u�ytkownika do zapytania
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
