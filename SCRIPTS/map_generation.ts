'use strict';

const DIRECTIONS = [
    { x: 0, y: -1 },  // North
    { x: 1, y: 0 },   // East
    { x: 0, y: 1 },   // South
    { x: -1, y: 0 }   // West
];

function initMap(size: number): string[][] {
    const mapSize: number = Math.max(1, size);
    return Array.from({ length: mapSize }, () => new Array<string>(mapSize).fill('ocean'));
}

function returnSeed(): string {
    const seed: string = (Math.floor(Math.random() * 9000) + 1000).toString();
    const seedMax: number = Math.max(...seed.split('').map(Number));
    return seed.split('').map(e => Math.floor((Number(e) / seedMax) * 2)).join('');
}

function proposeNewTileLocation(minX: number, maxX: number, minY: number, maxY: number): { x: number, y: number } {
    return {
        x: Math.floor(Math.random() * (maxX - minX + 1)) + minX,
        y: Math.floor(Math.random() * (maxY - minY + 1)) + minY
    };
}

function initTile(type: string): Tile {
    let newLocation: { x: number, y: number } = { x: 0, y: 0 };
    let chunkId = Math.floor(Math.random() * 4);

    do {
        for (let i = 0; i < 4; i++) {
            chunkId = (chunkId + i) % 4;
            if (!CHUNKS[chunkId].wasUsed) {
                CHUNKS[chunkId].wasUsed = true;
                newLocation = proposeNewTileLocation(
                    CHUNKS[chunkId].x0,
                    CHUNKS[chunkId].x1 - 1,
                    CHUNKS[chunkId].y0,
                    CHUNKS[chunkId].y1 - 1
                );
                break;
            }
        }
    } while (MAP.mapGrid[newLocation.y][newLocation.x] !== 'ocean');

    MAP.mapGrid[newLocation.y][newLocation.x] = type;

    return new Tile(newLocation.x, newLocation.y, type);
}

class WorldMap {
    public mapGrid: string[][] = [];
    public islandArray: Island[] = [];
    public lakeArray: Lake[] = [];

    constructor(size: number) {
        this.mapGrid = initMap(size);
    }

    addIsland(island: Island): void {
        this.islandArray.push(island);
    }

    addLake(lake: Lake): void {
        this.lakeArray.push(lake);
    }
}

class Island {
    public type: string;
    public tilesArray: Tile[] = [];

    constructor(tile: Tile) {
        this.type = tile.type;
        this.updateMapData(tile);
    }

    updateMapData(tile: Tile): void {
        MAP.mapGrid[tile.position.y][tile.position.x] = tile.type;
        this.tilesArray.push(tile);
    }

    generateNextSpill(): void {
        this.tilesArray.forEach(tile => {
            if (!tile.isShore) return;

            const seed: string = returnSeed();

            seed.split('').forEach((value: string, direction: number): void => {
                if (value === '1') {
                    const newX = tile.position.x + DIRECTIONS[direction].x;
                    const newY = tile.position.y + DIRECTIONS[direction].y;
                    if (this.isValidPosition(newX, newY)) {
                        const newTile = new Tile(newX, newY, tile.type);
                        this.updateMapData(newTile);
                    }
                } else if (value === '2') {
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

    checkIfShore(tile: Tile): boolean {
        return DIRECTIONS.some(direction => {
            const newX: number = tile.position.x + direction.x;
            const newY: number = tile.position.y + direction.y;
            return this.isValidPosition(newX, newY);
        });
    }

    isValidPosition(x: number, y: number): boolean {
        return x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE && MAP.mapGrid[y][x] === 'ocean';
    }

    findRandomNonShoreTile(): Tile | null {
        const nonShoreTiles: Tile[] = this.tilesArray.filter(tile => !tile.isShore);
        if (nonShoreTiles.length === 0) {
            return null;
        }
        const randomIndex: number = Math.floor(Math.random() * nonShoreTiles.length);
        return nonShoreTiles[randomIndex];
    }
}

class Lake extends Island {
    constructor(tile: Tile) {
        super(tile);
    }

    spillLakes(): void {
        this.tilesArray.forEach(tile => {
            const seed: string = returnSeed();

            seed.split('').forEach((value: string, direction: number): void => {
                if (value === '1') {
                    const newX: number = tile.position.x + DIRECTIONS[direction].x;
                    const newY: number = tile.position.y + DIRECTIONS[direction].y;
                    if (this.isValidLakePosition(newX, newY)) {
                        const newTile: Tile = new Tile(newX, newY, 'lake');
                        this.updateMapData(newTile);
                    }
                } else if (value === '2') {
                    let newX: number = tile.position.x + DIRECTIONS[direction].x;
                    let newY: number = tile.position.y + DIRECTIONS[direction].y;
                    if (this.isValidLakePosition(newX, newY)) {
                        const newTile1: Tile = new Tile(newX, newY, 'lake');
                        this.updateMapData(newTile1);

                        newX += DIRECTIONS[direction].x;
                        newY += DIRECTIONS[direction].y;
                        if (this.isValidLakePosition(newX, newY)) {
                            const newTile2: Tile = new Tile(newX, newY, 'lake');
                            this.updateMapData(newTile2);
                        }
                    }
                }
            });

            tile.isShore = this.checkIfShore(tile);
        });
    }

    isValidLakePosition(x: number, y: number): boolean {
        return x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE && MAP.mapGrid[y][x] !== 'ocean' && MAP.mapGrid[y][x] !== 'lake' && !this.isShore(x, y);
    }

    isShore(x: number, y: number): boolean {
        return DIRECTIONS.some(direction => {
            const newX = x + direction.x;
            const newY = y + direction.y;
            return this.isValidPosition(newX, newY) && MAP.mapGrid[newY][newX] === 'ocean';
        });
    }

    isValidPosition(x: number, y: number): boolean {
        return x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE;
    }
}

class Tile {
    public position: { x: number, y: number };
    public type: string;
    public contents: string | null;
    public isShore: boolean;

    constructor(x: number, y: number, type: string, contents: string | null = null, isShore: boolean = true) {
        this.position = { x: Math.max(Math.min(MAP_SIZE, x), 0), y: Math.max(Math.min(MAP_SIZE, y), 0) };
        this.type = type;
        this.contents = contents;
        this.isShore = isShore;
    }
}

// === Generate Islands ===

const MAP_SIZE: number = 100;
let CHUNKS = [
    { x0: 0, y0: 0, x1: MAP_SIZE / 2, y1: MAP_SIZE / 2, wasUsed: false },
    { x0: MAP_SIZE / 2, y0: 0, x1: MAP_SIZE, y1: MAP_SIZE / 2, wasUsed: false },
    { x0: 0, y0: MAP_SIZE / 2, x1: MAP_SIZE / 2, y1: MAP_SIZE, wasUsed: false },
    { x0: MAP_SIZE / 2, y0: MAP_SIZE / 2, x1: MAP_SIZE, y1: MAP_SIZE, wasUsed: false }
];

const MAP: WorldMap = new WorldMap(MAP_SIZE);

function generateNewIslands(): void {
    const biomeTypes: string[] = ['grass', 'sand', 'snow', 'rock'] as const;
    type BiomeType = typeof biomeTypes[number];

    function createIsland(biomeType: BiomeType): Island {
        const newInitTile: Tile = initTile(biomeType);
        return new Island(newInitTile);
    }

    const initIslands: Island[] = biomeTypes.map(createIsland);
    initIslands.forEach(island => {
        MAP.addIsland(island);
    });
    CHUNKS.forEach(chunk => chunk.wasUsed = false);
}

generateNewIslands();

const SPILL_NUMBER: number = 15;
function generateNextSpill(): void {
    MAP.islandArray.forEach(island => island.generateNextSpill());
}

for (let spill: number = 0; spill < SPILL_NUMBER; spill++) {
    generateNextSpill();
    if (spill === 7) {
        generateNewIslands();
    }
}


// === Add lakes ===

const LAKE_SPILL_DEPTH = 3;
function addLakes(): void {
    MAP.islandArray.forEach(island => {
        if (Math.random() < 0.3) {
            const nonShoreTile: Tile | null = island.findRandomNonShoreTile();
            if (nonShoreTile) {
                const lakeTile: Tile = new Tile(nonShoreTile.position.x, nonShoreTile.position.y, 'lake');
                const newLake: Lake = new Lake(lakeTile);
                MAP.addLake(newLake);

                island.tilesArray = island.tilesArray.filter(tile => tile !== nonShoreTile);
            }
        }
    });
}

addLakes();

function spillAllLakes(spillDepth: number): void {
    console.log("spilled");
    for (let i = 0; i < spillDepth; i++) {
        MAP.lakeArray.forEach(lake => lake.spillLakes());
    }
}

spillAllLakes(LAKE_SPILL_DEPTH);
