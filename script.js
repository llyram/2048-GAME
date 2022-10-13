import Grid from "./Grid.js";
import Tile from "./Tile.js";

const gameBoard = document.getElementById("game-board");
const scoreText = document.getElementById("score");

var game_score = 0;

const grid = new Grid(gameBoard)

grid.randomEmptyCell().tile = new Tile(gameBoard)
grid.randomEmptyCell().tile = new Tile(gameBoard)
setupInput()

var touchstartX
var touchstartY
var touchendX
var touchendY

function setupInput() {
    window.addEventListener("keydown", e => {
        handleInput(e.key)
    }, {once : true})

    document.addEventListener("touchstart", e => {
        e.preventDefault();
        touchstartX = e.changedTouches[0].screenX
        touchstartY = e.changedTouches[0].screenY
    }, {passive: false, once : true})

    document.addEventListener("touchend", e=> {
        touchendX = e.changedTouches[0].screenX
        touchendY = e.changedTouches[0].screenY
        handleGesture()
    }, {once : true})
}

function handleGesture() {
    if (Math.abs(touchendX-touchstartX) > Math.abs(touchendY - touchstartY)) {
        if (touchendX < touchstartX) {
            handleInput("ArrowLeft")
            console.log("left")
        } else {
            handleInput("ArrowRight")
            console.log("right")
        }
        
    } else {
        if (touchendY < touchstartY) {
            handleInput("ArrowUp")
            console.log("up")
        } else {
            handleInput("ArrowDown")
            console.log("down")
        }
    }

}



async function handleInput(dir) {
    switch (dir) {
        case "ArrowUp":
            if (!canMoveUp()) {
                setupInput()
                return
            }
            await moveUp()
            break
        case "ArrowDown":
            if (!canMoveDown()) {
                setupInput()
                return
            }
            await moveDown()
            break
        case "ArrowLeft":
            if (!canMoveLeft()) {
                setupInput()
                return
            }
            await moveLeft()
            break
        case "ArrowRight":
            if (!canMoveRight()) {
                setupInput()
                return
            }
            await moveRight()
            break
        default:
            setupInput()
            return
            break
    }

    var round_score = 0;
    for (let i = 0; i < grid.cells.length; i++) {
        var cell = grid.cells[i];
        round_score += cell.mergeTiles();
    }
    let prev_score = game_score;
    game_score += round_score;

    //Animate the score counter
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = "Score: "+ Math.floor(progress * (end - start) + start);
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
        }
        
        const obj = document.getElementById("value");
        animateValue(scoreText, prev_score, game_score, 1000);

    const newTile = new Tile(gameBoard)
    grid.randomEmptyCell().tile = newTile

    if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
        newTile.waitForTransition(true).then(() => {
            alert("You Lose");
        })
        return 
    }

    setupInput()
}

function moveLeft() {
    return slideTiles(grid.cellsByColumn)
}

function moveRight() {
    return slideTiles(grid.cellsByColumn.map(column => [...column].reverse()))
}

function moveUp() {
    return slideTiles(grid.cellsByRow)
}

function moveDown() {
    return slideTiles(grid.cellsByRow.map(column => [...column].reverse()))
}


function slideTiles(cells) {
    return Promise.all(
    cells.flatMap(group => {
        const promises = []
        for (let i = 1; i < group.length; i++) {
            const cell = group[i]
            if (cell.tile == null) continue
            let lastValidCell
            for(let j = i - 1; j >= 0; j--) {
                const moveToCell = group[j]
                if (!moveToCell.canAccept(cell.tile)) break
                lastValidCell = moveToCell
            }


            if (lastValidCell != null) {
                promises.push(cell.tile.waitForTransition())
                if(lastValidCell.tile != null) {
                    lastValidCell.mergeTile = cell.tile
                } else {
                    lastValidCell.tile = cell.tile
                }
                cell.tile = null
            }
        }
        return promises
    }));
}

function canMoveRight() {
    return canMove(grid.cellsByColumn.map(column => [...column].reverse()))
}
function canMoveLeft() {
    return canMove(grid.cellsByColumn)
}
function canMoveUp() {
    return canMove(grid.cellsByRow)
}
function canMoveDown() {
    return canMove(grid.cellsByRow.map(column => [...column].reverse()))
}

function canMove(cells) {
    return cells.some(group => {
        return group.some((cell, index) => {
            if (index === 0) return false // Cannot move the top cell up
            if (cell.tile == null) return false // cannot move a cell that doesn't exist
            const moveToCell = group[index-1]
            return moveToCell.canAccept(cell.tile) // can the above cell accept us??
        })
    })
}