let conversationHistory = JSON.parse(localStorage.getItem("conversationHistory")) || [];

document.addEventListener("DOMContentLoaded", loadChatHistory);

async function sendMessage() {
    const userInput = document.getElementById("user-input").value;
    if (!userInput.trim()) return;

    appendMessage("You", userInput, "user-message");
    document.getElementById("user-input").value = "";

    // Show the loading indicator.
    showLoadingIndicator();

    const contextMessage = "You are an AI chatbot assistant. Your job is to be helpful."

    // Add the context-setting message to the conversation history (only for the chatbot).
    conversationHistory.push({ role: "user", text: contextMessage });
    conversationHistory.push({ role: "user", text: userInput });

    const requestBody = {
        contents: conversationHistory.map(msg => ({
            role: msg.role === "bot" ? "model" : "user",  // Change bot role to model.
            parts: [{ text: msg.text }]
        }))
    };

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=YOUR_API_KEY", // You can get an API key from http://aistudio.google.com/.
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error response:", errorData);
            appendMessage("Chatbot", "Error: " + (errorData.error?.message || "Bad Request"), "bot-message");
            return;
        }

        const data = await response.json();
        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't understand that.";

        appendMessage("Chatbot", botReply, "bot-message", true); // Make sure the chat is recognized as having Markdown formatting.
        conversationHistory.push({ role: "bot", text: botReply });
        saveChatHistory();

        // Hide the loading indicator after the chatbot's response message has been received by the user.
        hideLoadingIndicator();
    } catch (error) {
        console.error("Fetch error:", error);
        appendMessage("Chatbot", "Error: Unable to reach the server.", "bot-message");

        // Hide the loading indicator if there's an error.
        hideLoadingIndicator();
    }
}

document.getElementById("user-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevents a newline from being added.
        sendMessage(); // Calls the sendMessage function.
    }
});

// Function to append messages and render Markdown.
function appendMessage(sender, message, className, isMarkdown = false) {
    const chatBox = document.getElementById("chat-box");
    const messageDiv = document.createElement("div");
    messageDiv.className = className;

    // Skip the context-setting message for display in the chat UI.
    if (message.startsWith(contextMessage)) {
        return; // Skip this message for display.
    }

    // For bot messages, render Markdown.
    if (isMarkdown) {
        messageDiv.innerHTML = marked.parse(message);
    } else {
        // For user messages, do not apply Markdown parsing.
        messageDiv.innerHTML = `${sender}: ${message}`;
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function saveChatHistory() {
    localStorage.setItem("conversationHistory", JSON.stringify(conversationHistory));
}

function loadChatHistory() {
    const chatBox = document.getElementById("chat-box");
    conversationHistory.forEach(msg => {
        // Skip the context-setting message from being displayed.
        if (msg.text.startsWith(contextMessage)) {
            return; // Skip this message for display
        }

        // Render messages with Markdown for the bot, but not for the user.
        appendMessage(msg.role === "user" ? "You" : "Chatbot", msg.text, msg.role === "user" ? "user-message" : "bot-message", msg.role === "bot");
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Show loading indicator in the chat box.
function showLoadingIndicator() {
    const chatBox = document.getElementById("chat-box");
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "loading";
    loadingDiv.id = "loading-indicator";
    loadingDiv.innerHTML = "Loading..."; // You can replace this with a GIF if you prefer/
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Hide loading indicator after response is received.
function hideLoadingIndicator() {
    const loadingDiv = document.getElementById("loading-indicator");
    if (loadingDiv) {
        loadingDiv.remove();
    }
}