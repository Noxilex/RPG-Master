"use strict";

//Game board
var board;
var canvas = document.querySelector("#visible-canvas");
var cellSize = 45;

//Interactive cells
var selectedArea;
var hoveredCell;

//Mouse positions
var mousePos;
var startPos;
var endPos;

//State
var state = {
	SELECTING: false
};

//Selection
var selection = {
	from: {},
	to: {},
	tileElement: groundType.DIRT,
	area: []
};

//Colors
var outline = "rgba(0,0,0,0.5)";

function setupUI() {
	// Setup ground buttons
	let groundButtons = document.querySelector("#ground-buttons");

	for (const type in groundType) {
		let button = document.createElement("button");

		if (groundType.hasOwnProperty(type)) {
			const ground = groundType[type];
			button.innerText = type;
			button.style.backgroundColor = ground.color;
			button.onclick = function() {
				selection.tileElement = ground;
			};
			groundButtons.appendChild(button);
		}
	}

	// Setups entities buttons
	let entitiesButtons = document.querySelector("#entities-buttons");

	for (const type in entityType) {
		let button = document.createElement("button");

		if (entityType.hasOwnProperty(type)) {
			const entity = entityType[type];
			button.innerText = type;
			if (entity) {
				button.style.backgroundColor = entity.color;
			}
			button.onclick = function() {
				selection.tileElement = entity;
			};
			entitiesButtons.appendChild(button);
		}
	}
}

function setup() {
	//let boardSizeRaw = prompt("Board size: x y");

	//Setup the UI
	setupUI();

	//Setup board
	let boardSizeRaw = "20 20";
	let sizeRaw = boardSizeRaw.split(" ");
	if (sizeRaw.length != 2) {
		throw new Error("Wrong number of arguments");
	} else if (!parseInt(sizeRaw[0]) || !parseInt(sizeRaw[1])) {
		throw new Error("Values provided are not numbers");
	} else {
		console.log("All is well");
		canvas.width = cellSize * sizeRaw[0];
		canvas.height = cellSize * sizeRaw[1];
		board = new Board(sizeRaw[0], sizeRaw[1]);
		board.setup();
	}
}

function updateGame() {
	processPlayerInput();
	updateGameLogic();
	draw();
	requestAnimationFrame(updateGame);
}

function processPlayerInput() {}

function updateGameLogic() {}

function previewCell(ctx, cell) {
	//Draw cell ground
	ctx.fillStyle = cell.ground.color;
	ctx.fillRect(
		cell.pos.x * cellSize,
		cell.pos.y * cellSize,
		cellSize,
		cellSize
	);

	//Draw the cell entity
	if (cell.entity && cell.entity != entityType.EMPTY) {
		ctx.fillStyle = cell.entity.color;
		ctx.beginPath();
		ctx.arc(
			cell.pos.x * cellSize + cellSize / 2,
			cell.pos.y * cellSize + cellSize / 2,
			cellSize / 3,
			0,
			2 * Math.PI
		);
		ctx.fill();
		ctx.stroke();
	}
	//Draws the outline
	ctx.strokeRect(
		cell.pos.x * cellSize,
		cell.pos.y * cellSize,
		cellSize,
		cellSize
	);
}

function draw() {
	//Create a buffer to modify canvas without interrupting the live canvas
	var buffer = document.createElement("canvas");
	var canvas = document.getElementById("visible-canvas");

	buffer.width = canvas.width;
	buffer.height = canvas.height;

	var buffer_ctx = buffer.getContext("2d");
	var ctx = canvas.getContext("2d");

	//Cell fill (overwritten by cell color)
	buffer_ctx.fillStyle = "#ffcc88";
	//Cell stroke
	buffer_ctx.strokeStyle = outline;
	//Cells draw
	board.draw(buffer_ctx, cellSize);

	//Selection draw
	if (selection.area) {
		selection.area.forEach(cell => {
			previewCell(buffer_ctx, cell);
			buffer_ctx.fillStyle = "rgba(255,255,255,0.05)";
			buffer_ctx.fillRect(
				cell.pos.x * cellSize,
				cell.pos.y * cellSize,
				cellSize,
				cellSize
			);
		});
	}

	//Hovered cell draw
	if (hoveredCell) {
		hoveredCell.draw(buffer_ctx, cellSize);
		buffer_ctx.fillStyle = "rgba(255,255,255,0.2)";
		hoveredCell.draw(buffer_ctx, cellSize, buffer_ctx.fillStyle);
	}

	//Put buffer in visible canvas
	ctx.drawImage(buffer, 0, 0);
}
setup();
updateGame();

/**
 * Listeners
 */

canvas.addEventListener("mousemove", event => {
	mousePos = getMousePos(canvas, event);
	if (state.SELECTING) {
		selection.to = getPosFromMousePos(mousePos);
		let corners = getCorners(selection.from, selection.to);
		selection.area = board.getCells(corners.tl, corners.br);
	}
	hoveredCell = getCellAtMousePos(mousePos, cellSize);
});

canvas.addEventListener("mousedown", event => {
	state.SELECTING = true;

	selection.area = [];

	startPos = getMousePos(canvas, event);
	selection.from = getPosFromMousePos(startPos);
});

document.addEventListener("mouseup", event => {
	state.SELECTING = false;
	fillSelection(selection);
	selection.area = [];
});

canvas.addEventListener("mouseup", event => {
	state.SELECTING = false;
	endPos = getMousePos(canvas, event);
	selection.to = getPosFromMousePos(endPos);

	let corners = getCorners(selection.from, selection.to);
	selection.area = board.getCells(corners.tl, corners.br);
	fillSelection(selection);
	selection.area = [];
});

canvas.addEventListener("mouseleave", event => {
	hoveredCell = null;
});

function fillSelection(selection) {
	selection.area.forEach(elt => {
		setType(elt);
	});
}

function setType(elt) {
	if (selection.tileElement instanceof Ground) {
		elt.ground = selection.tileElement;
	} else if (selection.tileElement instanceof Entity) {
		elt.entity = selection.tileElement;
	}
}

function getCellAtMousePos(mousePos, cellSize) {
	return board.getCell(
		Math.floor(mousePos.x / cellSize),
		Math.floor(mousePos.y / cellSize)
	);
}

/**
 * Returns mouse position based on canvas & mouse event
 * @param {Canvas} canvas
 * @param {Event} e
 */
function getMousePos(canvas, e) {
	let rect = canvas.getBoundingClientRect();
	let x = e.clientX - rect.left;
	let y = e.clientY - rect.top;
	return new Vector(x, y);
}

function getPosFromMousePos(mousePos) {
	return new Vector(
		Math.floor(mousePos.x / cellSize),
		Math.floor(mousePos.y / cellSize)
	);
}

/**
 * Returns the smallest x & y for top-left
 * Return the highest x & y for bottom-right
 * @param {*} cell1
 * @param {*} cell2
 */
function getCorners(cell1, cell2) {
	return {
		tl: {
			x: Math.min(cell1.x, cell2.x),
			y: Math.min(cell1.y, cell2.y)
		},
		br: {
			x: Math.max(cell1.x, cell2.x),
			y: Math.max(cell1.y, cell2.y)
		}
	};
}
