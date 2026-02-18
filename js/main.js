//Cells state [1-8], flag, flag-error hidden, mine, selected, empty
//<div class="tile" data-tile="1"><span>1</span></div>

window.addEventListener("DOMContentLoaded", function () {
	let row = 9;
	let col = 9;
	let mineCount = 10;
	let mineGrid = [];
	let gameIsStarted = false;
	let gameOver = false;
	let emptyTilesToReveal = [];
	let counterTimer = 0;
	let counterFlagRemaining = 0;
	let timerInterval = null;
	let currDifficulty = "beginner";
	const boardElement = document.querySelector(".board");
	const resetButton = document.querySelector("[data-reset]");
	const turntableTileElement = document.querySelector("[data-turntable-tile]");
	const timerElement = document.querySelector("[data-timer]");
	const flagCounterElement = document.querySelector("[data-flag-remaining]");
	const newGameButtons = document.querySelectorAll("[data-new-game]");

	const selectThemeButtons = document.querySelectorAll("[data-theme-btn]");
	const boardTheme = document.querySelector("[data-board-theme]");

	const handleBoardMousedown = (event) => {
		event.preventDefault();
		boardElement.setAttribute("data-mousedown", true);
		boardElement.addEventListener("mouseup", handleBoardMouseup);
		boardElement.addEventListener("mouseleave", handleBoardMouseup);
		boardElement.addEventListener("mousemove", mouseEffect);
		mouseEffect(event);
	};

	const handleBoardMouseup = (event) => {
		removePressedTile();
		boardElement.removeAttribute("data-mousedown");
		boardElement.removeEventListener("mouseup", handleBoardMouseup);
		boardElement.removeEventListener("mouseleave", handleBoardMouseup);
		boardElement.removeEventListener("mousemove", mouseEffect);

		let tileMouseup = document.elementFromPoint(event.clientX, event.clientY);

		if (tileMouseup.classList.contains("board")) {
			return;
		}

		while (tileMouseup && !tileMouseup.classList.contains("tile")) {
			tileMouseup = tileMouseup.parentElement;
		}

		if (tileMouseup.classList.contains("tile")) {
			if (!gameIsStarted) {
				// All mouse events trigger the start of the game
				generateMineGrid(
					tileMouseup.getAttribute("data-row"),
					tileMouseup.getAttribute("data-col")
				);
				gameIsStarted = true;
				startTimer();
				showFlagRemainingCounter();
				handleTileReveal(tileMouseup);
			} else {
				// Game is already started, the mouse events do specific things
				if (event.button === 2) {
					// Right click
					addFlagOnTile(tileMouseup);
				} else {
					// Left click
					handleTileReveal(tileMouseup);
				}
			}
		}
	};

	const mouseEffect = (event) => {
		removePressedTile();
		let tileHovered = document.elementFromPoint(event.clientX, event.clientY);

		if (tileHovered.classList.contains("board")) {
			return;
		}

		while (tileHovered && !tileHovered.classList.contains("tile")) {
			tileHovered = tileHovered.parentElement;
		}

		const tileRow = parseInt(tileHovered.getAttribute("data-row"));
		const tileCol = parseInt(tileHovered.getAttribute("data-col"));

		if (
			["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(
				tileHovered.getAttribute("data-tile")
			)
		) {
			for (let i = -1; i <= 1; i++) {
				for (let j = -1; j <= 1; j++) {
					if (
						tileRow + i >= 0 &&
						tileRow + i < row &&
						tileCol + j >= 0 &&
						tileCol + j < col
					) {
						const neighborTile = boardElement.querySelector(
							`[data-row="${tileRow + i}"][data-col="${tileCol + j}"]`
						);
						if (neighborTile.getAttribute("data-tile") === "hidden") {
							neighborTile.setAttribute("data-pressed", true);
						}
					}
				}
			}
		} else if (
			tileHovered &&
			tileHovered.classList.contains("tile") &&
			tileHovered.getAttribute("data-tile") === "hidden"
		) {
			tileHovered.setAttribute("data-pressed", true);
		}
	};

	const removePressedTile = () => {
		const pressedTile = boardElement.querySelectorAll("[data-pressed]");
		pressedTile.forEach((tile) => {
			tile.removeAttribute("data-pressed");
		});
	};

	const addFlagOnTile = (tile) => {
		if (tile.getAttribute("data-tile") === "hidden") {
			tile.setAttribute("data-tile", "flag");
			counterFlagRemaining--;
		} else if (tile.getAttribute("data-tile") === "flag") {
			tile.setAttribute("data-tile", "hidden");
			counterFlagRemaining++;
		}

		showFlagRemainingCounter();
	};

	const handleTileReveal = (tile) => {
		const status = tile.getAttribute("data-tile");

		if (
			["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(
				tile.getAttribute("data-tile")
			) &&
			checkIfTileHasSameNumberOfNeighboringFlags(tile)
		) {
			emptyTilesToReveal.push(tile);
			revealNeighboringTiles();
		} else if (status === "hidden") {
			assignTileValue(tile);
		}

		checkIfGGWP();
	};

	const assignTileValue = (tile) => {
		const tileRow = parseInt(tile.getAttribute("data-row"));
		const tileCol = parseInt(tile.getAttribute("data-col"));
		let neighborMines = 0;

		if (mineGrid[tileRow][tileCol] === true) {
			handleGameOver(tileRow, tileCol);
			return;
		}

		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				if (
					tileRow + i >= 0 &&
					tileRow + i < row &&
					tileCol + j >= 0 &&
					tileCol + j < col
				) {
					if (mineGrid[tileRow + i][tileCol + j] === true) {
						neighborMines++;
					}
				}
			}
		}

		if (neighborMines > 0) {
			tile.setAttribute("data-tile", neighborMines);
			tile.querySelector("span").innerText = neighborMines;
		} else {
			tile.setAttribute("data-tile", "empty");
			tile.querySelector("span").innerText = "";
			emptyTilesToReveal.push(tile);
			revealNeighboringTiles();
		}
	};

	const revealNeighboringTiles = () => {
		const tileToReveal = emptyTilesToReveal.pop();
		const tileRow = parseInt(tileToReveal.getAttribute("data-row"));
		const tileCol = parseInt(tileToReveal.getAttribute("data-col"));

		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				if (
					tileRow + i >= 0 &&
					tileRow + i < row &&
					tileCol + j >= 0 &&
					tileCol + j < col
				) {
					const neighborTile = boardElement.querySelector(
						`[data-row="${tileRow + i}"][data-col="${tileCol + j}"]`
					);
					if (neighborTile.getAttribute("data-tile") === "hidden") {
						if (mineGrid[tileRow + i][tileCol + j] !== true) {
							assignTileValue(neighborTile);
						} else {
							handleGameOver(tileRow, tileCol);
						}
					}
				}
			}
		}
	};

	const checkIfTileHasSameNumberOfNeighboringFlags = (tile) => {
		const tileRow = parseInt(tile.getAttribute("data-row"));
		const tileCol = parseInt(tile.getAttribute("data-col"));
		const flagsCount = parseInt(tile.getAttribute("data-tile"));
		let neighborFlags = 0;

		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				if (
					tileRow + i >= 0 &&
					tileRow + i < row &&
					tileCol + j >= 0 &&
					tileCol + j < col
				) {
					const neighborTile = boardElement.querySelector(
						`[data-row="${tileRow + i}"][data-col="${tileCol + j}"]`
					);
					if (neighborTile.getAttribute("data-tile") === "flag") {
						neighborFlags++;
					}
				}
			}
		}

		return neighborFlags >= flagsCount;
	};

	const generateEmptyBoard = () => {
		boardElement.style.gridTemplateColumns = `repeat(${col}, 1fr)`;

		removeTileFromBoard();

		for (let i = 0; i < row; i++) {
			mineGrid[i] = [];
			for (let j = 0; j < col; j++) {
				mineGrid[i][j] = false;
				const cloneTile = turntableTileElement.cloneNode(true);
				cloneTile.setAttribute("data-tile", "hidden");
				cloneTile.setAttribute("data-row", i);
				cloneTile.setAttribute("data-col", j);
				cloneTile.removeAttribute("data-turntable-tile");
				boardElement.appendChild(cloneTile);
			}
		}
	};

	const removeTileFromBoard = () => {
		const tileToDelete = boardElement.querySelectorAll(".tile");
		tileToDelete.forEach((tile) => {
			boardElement.removeChild(tile);
		});
	};

	const generateMineGrid = (excludeRow, excludeCol) => {
		let minesToPlace = mineCount;
		counterFlagRemaining = mineCount;

		while (minesToPlace > 0) {
			const [currRow, currCol] = getTileWithNoMine(excludeRow, excludeCol);
			mineGrid[currRow][currCol] = true;
			minesToPlace--;
			console.log("Mine: ", minesToPlace, "Row: ", currRow, "Col: ", currCol);
		}

		console.log("mineGrid", mineGrid);
	};

	const getTileWithNoMine = (excludeRow, excludeCol) => {
		const currRow = Math.floor(Math.random() * row);
		const currCol = Math.floor(Math.random() * col);

		if (
			mineGrid[currRow][currCol] !== true &&
			currRow !== parseInt(excludeRow) &&
			currCol !== parseInt(excludeCol)
		) {
			return [currRow, currCol];
		} else {
			return getTileWithNoMine(excludeRow, excludeCol);
		}
	};

	const handleGameOver = (tileRow, tileCol) => {
		gameOver = true;
		boardElement.removeEventListener("mousedown", handleBoardMousedown);
		resetButton.setAttribute("data-reset", "frown");

		for (let i = 0; i < row; i++) {
			for (let j = 0; j < col; j++) {
				if (mineGrid[i][j] === true) {
					const tile = boardElement.querySelector(
						`[data-row="${i}"][data-col="${j}"]`
					);
					if (tile.getAttribute("data-tile") !== "flag") {
						setMineIcon(tile, i === tileRow && j === tileCol);
					}
				}
			}
		}

		const flagsTiles = boardElement.querySelectorAll("[data-tile='flag']");

		flagsTiles.forEach((tile) => {
			const tileRow = parseInt(tile.getAttribute("data-row"));
			const tileCol = parseInt(tile.getAttribute("data-col"));
			if (mineGrid[tileRow][tileCol] !== true) {
				tile.setAttribute("data-tile", "flag-error");
			}
		});
	};

	const startTimer = () => {
		handleCounterDisplay(counterTimer, timerElement);

		timerInterval = setInterval(() => {
			if (!gameOver) {
				counterTimer++;
				handleCounterDisplay(counterTimer, timerElement);
			}
		}, 1000);
	};

	const showFlagRemainingCounter = () => {
		handleCounterDisplay(counterFlagRemaining, flagCounterElement);
	};

	handleCounterDisplay = (number, element) => {
		const numberToProcess = number < 1000 ? number : 999;
		const explodedNumber = numberToProcess.toString().split("");

		element.querySelectorAll("span").forEach((span) => {
			span.remove();
		});

		for (let i = 0; i < 3 - explodedNumber.length; i++) {
			const newPlaceholder = document.createElement("span");
			newPlaceholder.innerText = "0";
			newPlaceholder.classList.add("placeholder");
			element.appendChild(newPlaceholder);
		}

		for (let i = 0; i < explodedNumber.length; i++) {
			const newDigit = document.createElement("span");
			newDigit.innerText = explodedNumber[i];
			element.appendChild(newDigit);
		}
	};

	const checkIfGGWP = () => {
		const revealedTilesCount = boardElement.querySelectorAll(
			"[data-tile]:not([data-tile='hidden']):not([data-tile='flag'])"
		).length;

		console.log("GG", revealedTilesCount, row * col - mineCount);

		if (revealedTilesCount === row * col - mineCount) {
			const remainingTiles = boardElement.querySelectorAll(
				"[data-tile='hidden']"
			);
			remainingTiles.forEach((tile) => {
				tile.setAttribute("data-tile", "flag");
			});
			gameOver = true;
			boardElement.removeEventListener("mousedown", handleBoardMousedown);
			resetButton.setAttribute("data-reset", "victory");
		}
	};

	const setMineIcon = (tile, isClickedMine) => {
		const newId = `mine-${Math.random().toString(36).substring(2, 15)}`;
		tile.setAttribute("data-tile", isClickedMine ? "mine-error" : "mine");
		const gradient = tile.querySelector(".icon-mine__gradient");
		const circle = tile.querySelector(".icon-mine__circle");
		gradient.setAttribute("id", newId);
		circle.setAttribute("fill", `url(#${newId})`);
	};

	const resetGame = () => {
		gameIsStarted = false;
		gameOver = false;
		counterTimer = 0;
		counterFlagRemaining = mineCount;
		emptyTilesToReveal = [];
		mineGrid = [];
		clearInterval(timerInterval);
		handleCounterDisplay(counterTimer, timerElement);
		handleCounterDisplay(counterFlagRemaining, flagCounterElement);
		boardElement.removeAttribute("data-mousedown");
		boardElement.removeEventListener("mouseup", handleBoardMouseup);
		boardElement.removeEventListener("mouseleave", handleBoardMouseup);
		boardElement.removeEventListener("mousemove", mouseEffect);
		boardElement.addEventListener("mousedown", handleBoardMousedown);
		resetButton.setAttribute("data-reset", "smile");
		removePressedTile();
		generateEmptyBoard();
		setSummaryBarText();
	};

	const startNewGameWithDifficulty = (difficulty) => {
		const [newRow, newCol, newMineCount] =
			getGameDifficultySettings(difficulty);
		row = newRow;
		col = newCol;
		mineCount = newMineCount;

		startNewGame();
	};

	const startNewGame = () => {
		absoluteMaxMineCount = Math.floor(row * col * 0.8) - 1;

		if (row > 20) {
			row = 20;
		}

		if (row < 3) {
			row = 3;
		}

		if (col > 30) {
			col = 30;
		}

		if (col < 3) {
			col = 3;
		}

		if (mineCount > absoluteMaxMineCount) {
			mineCount = absoluteMaxMineCount;
		}

		resetGame();
	};

	const setSummaryBarText = () => {
		let difficultyText = "Custom";

		if (row === 9 && col === 9 && mineCount === 10) {
			difficultyText = "Beginner";
		} else if (row === 16 && col === 16 && mineCount === 40) {
			difficultyText = "Intermediate";
		} else if (row === 16 && col === 30 && mineCount === 99) {
			difficultyText = "Expert";
		}

		document.querySelector("[data-summary-difficulty]").textContent =
			difficultyText;
		document.querySelector("[data-summary-grid]").textContent = `${row}x${col}`;
		document.querySelector("[data-summary-mines]").textContent = mineCount;
	};

	const getGameDifficultySettings = (difficulty) => {
		if (difficulty === "intermediate") {
			return [16, 16, 40];
		} else if (difficulty === "expert") {
			return [16, 30, 99];
		} else {
			return [9, 9, 10];
		}
	};

	startNewGameWithDifficulty("beginner");

	boardElement.addEventListener("contextmenu", (e) => e.preventDefault());
	resetButton.addEventListener("click", resetGame);

	newGameButtons.forEach((button) => {
		button.addEventListener("click", () => {
			currDifficulty = button.getAttribute("data-new-game");
			button.blur();
			startNewGameWithDifficulty(currDifficulty);
		});
	});

	selectThemeButtons.forEach((button) => {
		button.addEventListener("click", () => {
			boardTheme.setAttribute(
				"data-board-theme",
				button.getAttribute("data-theme-btn")
			);
			button.blur();
		});
	});
});
