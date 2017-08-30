// @flow

import Delaunator from 'delaunator';
import isPointInTriangle from 'point-in-triangle';
import { createCell } from './cell';
import { createPoint } from './point';
import { randomPoint } from './random';
import type { Cell } from './cell';
import type { Point } from './point';

const POINT_DENSITY = 0.002; // 0.05 / window.devicePixelRatio;
const MAX_POINT_VELOCITY_X = 0.5; // 2;
const MAX_POINT_VELOCITY_Y = 0.5; // 2;
const OFFSCREEN_AREA_RATIO = 0.05;

const TRIANGLE_COLORS = [
  '#901429',
  '#b90e3e',
  '#be0e34',
  '#d30d42',
  '#de1851',
];

export default class Background {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  prevWidth: number;
  prevHeight: number;

  points: Array<Point>;
  cells: Array<Cell>;
  nextCellColorIndex: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.prevWidth = this.canvas.offsetWidth;
    this.prevHeight = this.canvas.offsetHeight;

    this.points = [];
    this.cells = [];
    this.nextCellColorIndex = 0;

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  getNextCellColor() {
    const color = TRIANGLE_COLORS[this.nextCellColorIndex];
    this.nextCellColorIndex = (this.nextCellColorIndex + 1) % TRIANGLE_COLORS.length;
    return color;
  }

  handleResize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

    // Make the amount of points proportional to the screen size
    const numPoints = Math.sqrt(POINT_DENSITY * this.canvas.width * this.canvas.height);
    const widthChange = this.canvas.width / this.prevWidth;
    const heightChange = this.canvas.height / this.prevHeight;

    this.points = [
      // Corners
      createPoint(0, 0),
      createPoint(0, this.canvas.height),
      createPoint(this.canvas.width, 0),
      createPoint(this.canvas.width, this.canvas.height),

      // Scale previous non-corner points
      ...this.points
        .slice(4, numPoints)
        .map(({ x, y, vx, vy }) => ({
          x: x * widthChange,
          y: y * heightChange,
          vx,
          vy,
        })),

      // Generate new points if necessary
      ...Array.from(
        { length: numPoints - Math.max(this.points.length, 4) },
        () => randomPoint({
          maxX: this.canvas.width,
          maxY: this.canvas.height,
          maxVx: MAX_POINT_VELOCITY_X,
          maxVy: MAX_POINT_VELOCITY_Y,
        }),
      ),
    ];

    // Use offscreen area to avoid weird triangles near the borders
    this.ctx.setTransform(
      1 + (2 * OFFSCREEN_AREA_RATIO),
      0,
      0,
      1 + (2 * OFFSCREEN_AREA_RATIO),
      -this.canvas.width * OFFSCREEN_AREA_RATIO,
      -this.canvas.height * OFFSCREEN_AREA_RATIO,
    );

    const { triangles: cellsFlattened } = new Delaunator(
      this.points,
      point => point.x,
      point => point.y,
    );

    this.cells = Array.from(
      { length: cellsFlattened.length / 3 },
      (v, i) => createCell(
        [...cellsFlattened.subarray(i * 3, (i + 1) * 3)],
        this.getNextCellColor(),
      ),
    );

    this.draw();

    this.prevWidth = this.canvas.width;
    this.prevHeight = this.canvas.height;
  }

  movePoints() {
    this.points.forEach(({ x, y, vx, vy }, i) => {
      if (
        this.cells
          .filter(cell => !cell.pointIndexes.includes(i))
          .map(cell => cell.pointIndexes.map(pointIndex => this.points[pointIndex]))
          .some(triangle => isPointInTriangle(
            [x + vx, y + vy],
            triangle.map(point => [point.x, point.y]),
          ))
      ) {
        this.points[i].vx *= -1;
        this.points[i].vy *= -1;
      } else {
        if (x + vx < 0 || x + vx > this.canvas.width) {
          this.points[i].vx *= -1;
        }

        if (y + vy < 0 || y + vy > this.canvas.height) {
          this.points[i].vy *= -1;
        }
      }

      this.points[i].x += this.points[i].vx;
      this.points[i].y += this.points[i].vy;
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.cells.forEach((cell) => {
      const triangle = cell.pointIndexes.map(pointIndex => this.points[pointIndex]);

      this.ctx.beginPath();
      this.ctx.moveTo(triangle[0].x, triangle[0].y);
      this.ctx.lineTo(triangle[1].x, triangle[1].y);
      this.ctx.lineTo(triangle[2].x, triangle[2].y);
      this.ctx.closePath();

      this.ctx.fillStyle = cell.color;
      this.ctx.strokeStyle = cell.color;
      this.ctx.fill();
      this.ctx.stroke();
    });
  }

  startAnimation() {
    window.requestAnimationFrame(() => {
      this.movePoints();
      this.draw();
      this.startAnimation();
    });
  }
}
