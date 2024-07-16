'use strict';
const DIRECTIONS = [
    { x: 0, y: -1 }, // North
    { x: 1, y: 0 }, // East
    { x: 0, y: 1 }, // South
    { x: -1, y: 0 } // West
];
function initMap(size) {
    const mapSize = Math.max(1, size);
    return Array.from({ length: mapSize }, () => new Array(mapSize).fill('ocean'));
}
function returnSeed() {
    const seed = (Math.floor(Math.random() * 9000) + 1000).toString();
    const seedMax = Math.max(...seed.split('').map(Number));
    return seed.split('').map(e => Math.floor((Number(e) / seedMax) * 2)).join('');
}
function proposeNewTileLocation(minX, maxX, minY, maxY) {
    return {
        x: Math.floor(Math.random() * (maxX - minX + 1)) + minX,
        y: Math.floor(Math.random() * (maxY - minY + 1)) + minY
    };
}
function initTile(type) {
    let newLocation = { x: 0, y: 0 };
    let chunkId = Math.floor(Math.random() * 4);
    do {
        for (let i = 0; i < 4; i++) {
            chunkId = (chunkId + i) % 4;
            if (!CHUNKS[chunkId].wasUsed) {
                CHUNKS[chunkId].wasUsed = true;
                newLocation = proposeNewTileLocation(CHUNKS[chunkId].x0, CHUNKS[chunkId].x1 - 1, CHUNKS[chunkId].y0, CHUNKS[chunkId].y1 - 1);
                break;
            }
        }
    } while (MAP.mapGrid[newLocation.y][newLocation.x] !== 'ocean');
    MAP.mapGrid[newLocation.y][newLocation.x] = type;
    return new Tile(newLocation.x, newLocation.y, type);
}
class WorldMap {
    constructor(size) {
        this.mapGrid = [];
        this.islandArray = [];
        this.lakeArray = [];
        this.mapGrid = initMap(size);
    }
    addIsland(island) {
        this.islandArray.push(island);
    }
    addLake(lake) {
        this.lakeArray.push(lake);
    }
}
class Island {
    constructor(tile) {
        this.tilesArray = [];
        this.type = tile.type;
        this.updateMapData(tile);
    }
    updateMapData(tile) {
        MAP.mapGrid[tile.position.y][tile.position.x] = tile.type;
        this.tilesArray.push(tile);
    }
    generateNextSpill() {
        this.tilesArray.forEach(tile => {
            if (!tile.isShore)
                return;
            const seed = returnSeed();
            seed.split('').forEach((value, direction) => {
                if (value === '1') {
                    const newX = tile.position.x + DIRECTIONS[direction].x;
                    const newY = tile.position.y + DIRECTIONS[direction].y;
                    if (this.isValidPosition(newX, newY)) {
                        const newTile = new Tile(newX, newY, tile.type);
                        this.updateMapData(newTile);
                    }
                }
                else if (value === '2') {
                    let newX = tile.position.x + DIRECTIONS[direction].x;
                    let newY = tile.position.y + DIRECTIONS[direction].y;
                    if (this.isValidPosition(newX, newY)) {
                        const newTile1 = new Tile(newX, newY, tile.type);
                        this.updateMapData(newTile1);
                        newX += DIRECTIONS[direction].x;
                        newY += DIRECTIONS[direction].y;
                        if (this.isValidPosition(newX, newY)) {
                            const newTile2 = new Tile(newX, newY, tile.type);
                            this.updateMapData(newTile2);
                        }
                    }
                }
            });
            tile.isShore = this.checkIfShore(tile);
        });
    }
    checkIfShore(tile) {
        return DIRECTIONS.some(direction => {
            const newX = tile.position.x + direction.x;
            const newY = tile.position.y + direction.y;
            return this.isValidPosition(newX, newY);
        });
    }
    isValidPosition(x, y) {
        return x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE && MAP.mapGrid[y][x] === 'ocean';
    }
    findRandomNonShoreTile() {
        const nonShoreTiles = this.tilesArray.filter(tile => !tile.isShore);
        if (nonShoreTiles.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * nonShoreTiles.length);
        return nonShoreTiles[randomIndex];
    }
}
class Lake extends Island {
    constructor(tile) {
        super(tile);
    }
    spillLakes() {
        this.tilesArray.forEach(tile => {
            const seed = returnSeed();
            seed.split('').forEach((value, direction) => {
                if (value === '1') {
                    const newX = tile.position.x + DIRECTIONS[direction].x;
                    const newY = tile.position.y + DIRECTIONS[direction].y;
                    if (this.isValidLakePosition(newX, newY)) {
                        const newTile = new Tile(newX, newY, 'lake');
                        this.updateMapData(newTile);
                    }
                }
                else if (value === '2') {
                    let newX = tile.position.x + DIRECTIONS[direction].x;
                    let newY = tile.position.y + DIRECTIONS[direction].y;
                    if (this.isValidLakePosition(newX, newY)) {
                        const newTile1 = new Tile(newX, newY, 'lake');
                        this.updateMapData(newTile1);
                        newX += DIRECTIONS[direction].x;
                        newY += DIRECTIONS[direction].y;
                        if (this.isValidLakePosition(newX, newY)) {
                            const newTile2 = new Tile(newX, newY, 'lake');
                            this.updateMapData(newTile2);
                        }
                    }
                }
            });
            tile.isShore = this.checkIfShore(tile);
        });
    }
    isValidLakePosition(x, y) {
        return x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE && MAP.mapGrid[y][x] !== 'ocean' && MAP.mapGrid[y][x] !== 'lake' && !this.isShore(x, y);
    }
    isShore(x, y) {
        return DIRECTIONS.some(direction => {
            const newX = x + direction.x;
            const newY = y + direction.y;
            return this.isValidPosition(newX, newY) && MAP.mapGrid[newY][newX] === 'ocean';
        });
    }
    isValidPosition(x, y) {
        return x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE;
    }
}
class Tile {
    constructor(x, y, type, contents = null, isShore = true) {
        this.position = { x: Math.max(Math.min(MAP_SIZE, x), 0), y: Math.max(Math.min(MAP_SIZE, y), 0) };
        this.type = type;
        this.contents = contents;
        this.isShore = isShore;
    }
}
// === Generate Islands ===
const MAP_SIZE = 100;
let CHUNKS = [
    { x0: 0, y0: 0, x1: MAP_SIZE / 2, y1: MAP_SIZE / 2, wasUsed: false },
    { x0: MAP_SIZE / 2, y0: 0, x1: MAP_SIZE, y1: MAP_SIZE / 2, wasUsed: false },
    { x0: 0, y0: MAP_SIZE / 2, x1: MAP_SIZE / 2, y1: MAP_SIZE, wasUsed: false },
    { x0: MAP_SIZE / 2, y0: MAP_SIZE / 2, x1: MAP_SIZE, y1: MAP_SIZE, wasUsed: false }
];
const MAP = new WorldMap(MAP_SIZE);
function generateNewIslands() {
    const biomeTypes = ['grass', 'sand', 'snow', 'rock'];
    function createIsland(biomeType) {
        const newInitTile = initTile(biomeType);
        return new Island(newInitTile);
    }
    const initIslands = biomeTypes.map(createIsland);
    initIslands.forEach(island => {
        MAP.addIsland(island);
    });
    CHUNKS.forEach(chunk => chunk.wasUsed = false);
}
generateNewIslands();
const SPILL_NUMBER = 15;
function generateNextSpill() {
    MAP.islandArray.forEach(island => island.generateNextSpill());
}
for (let spill = 0; spill < SPILL_NUMBER; spill++) {
    generateNextSpill();
    if (spill === 7) {
        generateNewIslands();
    }
}
// === Add lakes ===
const LAKE_SPILL_DEPTH = 3;
function addLakes() {
    MAP.islandArray.forEach(island => {
        if (Math.random() < 0.3) {
            const nonShoreTile = island.findRandomNonShoreTile();
            if (nonShoreTile) {
                const lakeTile = new Tile(nonShoreTile.position.x, nonShoreTile.position.y, 'lake');
                const newLake = new Lake(lakeTile);
                MAP.addLake(newLake);
                island.tilesArray = island.tilesArray.filter(tile => tile !== nonShoreTile);
            }
        }
    });
}
addLakes();
function spillAllLakes(spillDepth) {
    console.log("spilled");
    for (let i = 0; i < spillDepth; i++) {
        MAP.lakeArray.forEach(lake => lake.spillLakes());
    }
}
spillAllLakes(LAKE_SPILL_DEPTH);
