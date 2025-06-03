const chatForm = document.getElementById("chat-form");
const chatWindow = document.getElementById("chat-window");
const userInput = document.getElementById("user-input");
const submitButton = chatForm.querySelector("button");

userInput.focus();

chatForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	const message = userInput.value.trim();
	if (!message) return;

	addMessage(message, "user");
	userInput.value = "";
	userInput.focus();

	userInput.disabled = true;
	submitButton.disabled = true;

	const typingIndicator = createTypingIndicator();
	chatWindow.appendChild(typingIndicator);
	chatWindow.scrollTop = chatWindow.scrollHeight;

	try {
		const botReply = await fetchResponse(message);
		chatWindow.removeChild(typingIndicator);
		addMessage(botReply, "bot");
	} catch (error) {
		chatWindow.removeChild(typingIndicator);
		addMessage("Error: Failed to get response from bot.", "bot");
		console.error(error);
	}

	userInput.disabled = false;
	submitButton.disabled = false;
	userInput.focus();
});

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
