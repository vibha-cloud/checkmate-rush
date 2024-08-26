const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let playerStatuses = { w: false, b: false };

const turnDisplay = document.getElementById("turnDisplay");
const whiteStatus = document.getElementById("whiteStatus");
const blackStatus = document.getElementById("blackStatus");

const loadingScreen = document.getElementById("loadingScreen");
const chessContainer = document.getElementById("chessContainer");

// Update the display showing whose turn it is
const updateTurnDisplay = () => {
  turnDisplay.innerText =
    chess.turn() === "w" ? "White's Turn" : "Black's Turn";
};

// Update the player status and show the chess container if both players are connected
const updatePlayerStatus = (role, status) => {
  if (role === "w") {
    whiteStatus.innerText = `White: ${status}`;
    playerStatuses.w = status === "Connected";
  } else if (role === "b") {
    blackStatus.innerText = `Black: ${status}`;
    playerStatuses.b = status === "Connected";
  }

  if (playerStatuses.w && playerStatuses.b) {
    showChessContainer(); // Hide the loading screen and show the chess board
  }
};

// Show the chess container and hide the loading screen
const showChessContainer = () => {
  setTimeout(() => {
    loadingScreen.classList.add("hidden");
    chessContainer.classList.remove("hidden");
  }, 3000); // Adjust the delay if necessary
};

// Show the loading screen and hide the chess container
const showLoadingScreen = () => {
  loadingScreen.classList.remove("hidden");
  chessContainer.classList.add("hidden");
};

// Render the chess board with pieces
const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );

        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            console.log("Drag start:", pieceElement.innerText);
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", "");
            pieceElement.classList.add("dragging");
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          console.log("Drag end:", pieceElement.innerText);
          draggedPiece = null;
          sourceSquare = null;
          pieceElement.classList.remove("dragging");
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          console.log(
            "Drop on:",
            squareElement.dataset.row,
            squareElement.dataset.col
          );
          const targetSource = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };

          handleMove(sourceSquare, targetSource);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });
  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }

  updateTurnDisplay(); // Update the turn display after rendering the board
};

// Handle moving a piece
const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };

  console.log("Move:", move);
  socket.emit("move", move);
};

// Convert piece type to Unicode character
const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♙",
    r: "♖",
    n: "♘",
    b: "♗",
    q: "♕",
    k: "♔",
    P: "♟︎",
    R: "♜",
    N: "♞",
    B: "♝",
    Q: "♛",
    K: "♚",
  };

  return unicodePieces[piece.type] || "";
};

// Socket event handlers
socket.on("playerStatus", function (role, status) {
  updatePlayerStatus(role, status);
});

socket.on("playerRole", function (role) {
  console.log("Player role:", role);
  playerRole = role;

  renderBoard();
});

socket.on("spectatorRole", function () {
  console.log("Spectator role");
  playerRole = null;

  renderBoard();
});

socket.on("boardState", function (fen) {
  console.log("Board state:", fen);
  chess.load(fen);
  renderBoard();
});

socket.on("move", function (move) {
  console.log("Opponent move:", move);
  chess.move(move);
  renderBoard();
});

// Initially show the loading screen
showLoadingScreen();
