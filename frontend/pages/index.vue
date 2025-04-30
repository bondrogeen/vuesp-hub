<template>
  <div class="container mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <h1>Main</h1>
    </div>
  </div>
</template>

<script setup>
import { io } from "socket.io-client";

const socket = io("/socket.io");

// Обработчики событий
socket.on("service:status", (data) => {
  document.getElementById("status").textContent = `Status: ${
    data.running ? "Running" : "Stopped"
  }`;
});

socket.on("service:log", (log) => {
  console.log(log);
});

socket.on("service:error", (error) => {
  const logsDiv = document.getElementById("logs");
  logsDiv.innerHTML += `<div style="color: red">${error}</div>`;
});

// Методы управления
function startService() {
  console.log("startService");
  socket.emit("service:start", {}, (response) => {
    console.log("Start response:", response);
  });
}

function stopService() {
  socket.emit("service:stop", {}, (response) => {
    console.log("Stop response:", response);
  });
}

// Запрос статуса при загрузке
socket.emit("service:get-status", {}, (response) => {
  document.getElementById("status").textContent = `Status: ${
    response.running ? "Running" : "Stopped"
  }`;
});

setTimeout(() => {
  startService();
}, 3000);
</script>
