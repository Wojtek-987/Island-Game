/// <reference types="p5/global" />

'use strict';

const BASE_W: number = 800, BASE_H: number = 500;
let CANVAS_WIDTH: number = 800, CANVAS_HEIGHT: number = 500, SCALE: number = 1;
const TILE_SIZE: number = 4;

function setup(): void {
    calculateWindowDimensions();
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    smooth();
    frameRate(30);
}

function draw(): void {
    // Draw Tiles
    noStroke();
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tileType: string = MAP.mapGrid[y][x];

            switch (tileType) {
                case 'ocean':
                    fill('blue');
                    break;
                case 'grass':
                    fill('green');
                    break;
                case 'sand':
                    fill('yellow');
                    break;
                case 'snow':
                    fill('white');
                    break;
                case 'rock':
                    fill('gray');
                    break;
                case 'lake':
                    fill('aqua');
                    break;
                default:
                    fill('magenta');
                    break;
            }

            rect(x * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
        }
    }
    // Draw Details
}


let resizeTimeout: number | undefined;
function windowResized(): void {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout((): void => {
        calculateWindowDimensions();
        resizeCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    }, 500);
}

function calculateWindowDimensions(): void {
    if (window.innerWidth / BASE_W >= window.innerHeight / BASE_H) {
        // If "width" > "height", set proportions relative to height
        CANVAS_WIDTH = BASE_W * (window.innerHeight / BASE_H);
        CANVAS_HEIGHT = window.innerHeight;
        SCALE = window.innerHeight / BASE_H;
    } else {
        CANVAS_WIDTH = window.innerWidth;
        CANVAS_HEIGHT = BASE_H * (window.innerWidth / BASE_W);
        SCALE = window.innerWidth / BASE_W;
    }
}
