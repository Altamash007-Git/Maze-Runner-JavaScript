const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;
const cellsHorizontal = 9;
const cellsVertical = 7;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLenghtX = width / cellsHorizontal;
const unitLenghtY = height / cellsVertical;

// Game variables
let engine, world, render, runner, currentBall;

// Maze structure arrays
let grid, verticals, horizontals;

// Initialize the engine and world (but don't start running yet)
engine = Engine.create();
engine.world.gravity.y = 0;
world = engine.world;

// Create the renderer (but don't start it yet)
render = Render.create({
    element: document.getElementById('game-canvas'),
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});

// Maze generation helper function
const shuffle = (arr) => {
    let counter = arr.length;
    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);
        counter--;
        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp; 
    }
    return arr;
};

const stepThroughCell = (row, column) => {
    if (grid[row][column]) {
        return;
    }

    grid[row][column] = true;
    
    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);

    for (let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor;

        if (
            nextRow < 0 || 
            nextRow >= cellsVertical || 
            nextColumn < 0 || 
            nextColumn >= cellsHorizontal
        ) {
            continue; 
        }
        if (grid[nextRow][nextColumn]) {
            continue;
        }
        if (direction === 'left') {
            verticals[row][column - 1] = true;
        } else if (direction === 'right') {
            verticals[row][column] = true;
        } else if (direction === 'up') {
            horizontals[row - 1][column] = true;
        } else if (direction === 'down') {
            horizontals[row][column] = true;
        }
        stepThroughCell(nextRow, nextColumn);
    }
};

function createMaze() {
    // Add boundary walls
    const walls = [
        Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true}),
        Bodies.rectangle(width / 2, height, width, 2, { isStatic: true}),
        Bodies.rectangle(0, height / 2, 2, height, { isStatic: true}),
        Bodies.rectangle(width, height / 2, 2, height, { isStatic: true}), 
    ];
    World.add(world, walls);

    // Initialize grid arrays
    grid = Array(cellsHorizontal)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false));

    verticals = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal - 1).fill(false));

    horizontals = Array(cellsVertical - 1)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false));

    const startRow = Math.floor(Math.random() * cellsVertical);
    const startColumn = Math.floor(Math.random() * cellsHorizontal);

    stepThroughCell(startRow, startColumn);
    
    // Add maze walls
    addMazeWalls(horizontals, verticals);
    
    // Add goal and ball
    addGoalAndBall();
}

function addMazeWalls(horizontals, verticals) {
    horizontals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
            if (open) return;
            const wall = Bodies.rectangle(
                columnIndex * unitLenghtX + unitLenghtX / 2,
                rowIndex * unitLenghtY + unitLenghtY,
                unitLenghtX,
                5,
                {
                    label: 'wall',
                    isStatic: true,
                    render: { fillStyle: 'red' }
                }
            );
            World.add(world, wall);
        });
    });

    verticals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
            if (open) return;
            const wall = Bodies.rectangle(
                columnIndex * unitLenghtX + unitLenghtX,
                rowIndex * unitLenghtY + unitLenghtY / 2,
                5,
                unitLenghtY,
                {
                    label: 'wall',
                    isStatic: true,
                    render: { fillStyle: 'red' }
                }
            );
            World.add(world, wall);
        });
    });
}

function addGoalAndBall() {
    // Add goal
    const goal = Bodies.rectangle(
        width - unitLenghtX / 2,
        height - unitLenghtY / 2,
        unitLenghtX * 0.7,
        unitLenghtY * 0.7,
        {
            label: 'goal',
            isStatic: true,
            render: { fillStyle: 'green' }
        }
    );
    World.add(world, goal);

    // Add ball
    const ballRadius = Math.min(unitLenghtX, unitLenghtY) / 4;
    currentBall = Bodies.circle(
        unitLenghtX / 2,
        unitLenghtY / 2,
        ballRadius,
        {
            label: 'ball',
            render: { fillStyle: 'blue' }
        }
    );
    World.add(world, currentBall);
}

function initGame() {
    // Hide start screen and show game
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-canvas').style.display = 'block';
    
    // Start the engine and renderer
    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);
    
    // Generate and add the maze
    createMaze();
}

// Handle keyboard controls
document.addEventListener('keydown', event => {
    if (!currentBall) return;

    const { x, y } = currentBall.velocity;

    if(event.keyCode === 38) {
        Body.setVelocity(currentBall, { x, y: y - 5 });
    }

    if(event.keyCode === 39) {
        Body.setVelocity(currentBall, { x: x + 5, y });
    }
    
    if(event.keyCode === 40) {
        Body.setVelocity(currentBall, { x, y: y + 5 });
    }

    if(event.keyCode === 37) {
        Body.setVelocity(currentBall, { x: x - 5, y });
    }
}); 

const resetGame = () => {
    // Reset gravity
    world.gravity.y = 0;
    
    // Remove all bodies from the world
    World.clear(world, false);
    
    // Create new maze and add elements
    createMaze();
    
    // Hide the winner message
    document.querySelector('.winner').classList.add('hidden');
};

// Add event listeners
document.getElementById('start-button').addEventListener('click', initGame);
document.getElementById('try-again').addEventListener('click', resetGame);

// Win condition
Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];

        if (
            labels.includes(collision.bodyA.label) &&
            labels.includes(collision.bodyB.label)
        ) {
            // Make sure the winner display is on top
            document.querySelector('.winner').classList.remove('hidden');
            
            // Add victory effects
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if (body.label === 'wall') {
                    Body.setStatic(body, false);
                }
            });
            
            // Make sure the Try Again button is clickable
            setTimeout(() => {
                const tryAgainBtn = document.querySelector('.try-again-btn');
                if (tryAgainBtn) {
                    tryAgainBtn.focus();
                }
            }, 100);
        }
    });
});






    
            
    
 

  


