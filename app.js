const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
  console.log("A user connected");

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
    io.emit("playerStatus", "w", "Connected");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
    io.emit("playerStatus", "b", "Connected");
  } else {
    uniquesocket.emit("spectatorRole", "The game is full");
  }

  // Notify both players of the current status
  if (players.white) {
    io.to(players.white).emit(
      "playerStatus",
      "b",
      players.black ? "Connected" : "Waiting for opponent"
    );
  }
  if (players.black) {
    io.to(players.black).emit(
      "playerStatus",
      "w",
      players.white ? "Connected" : "Waiting for opponent"
    );
  }

  uniquesocket.on("disconnect", function () {
    if (uniquesocket.id === players.white) {
      delete players.white;
      io.emit("playerStatus", "w", "Disconnected");
    } else if (uniquesocket.id === players.black) {
      delete players.black;
      io.emit("playerStatus", "b", "Disconnected");
    }

    // Notify the remaining player about the disconnection
    if (players.white) {
      io.to(players.white).emit("playerStatus", "b", "Disconnected");
    }
    if (players.black) {
      io.to(players.black).emit("playerStatus", "w", "Disconnected");
    }
  });

  uniquesocket.on("move", function (move) {
    try {
      if (chess.turn() === "w" && uniquesocket.id !== players.white) {
        return;
      }
      if (chess.turn() === "b" && uniquesocket.id !== players.black) {
        return;
      }

      const result = chess.move(move);

      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move:", move);
        uniquesocket.emit("invalidMove", move);
      }
    } catch (err) {
      console.log(err);
      uniquesocket.emit("invalidMove", move);
    }
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
