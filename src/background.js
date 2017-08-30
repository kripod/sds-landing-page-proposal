// @flow

import Delaunator from 'delaunator';
import isPointInTriangle from 'point-in-triangle';
import { randomFloat, randomPoint } from './random';
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
  pointVelocities: Array<Point>;
  cells: Array<Array<number>>;
  triangleColorMap: Map<string, string>;
  nextTriangleColorIndex: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.prevWidth = this.canvas.offsetWidth;
    this.prevHeight = this.canvas.offsetHeight;

    this.points = [];
    this.pointVelocities = [];
    this.triangleColorMap = new Map();
    this.nextTriangleColorIndex = 0;

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  getNextTriangleColor() {
    const color = TRIANGLE_COLORS[this.nextTriangleColorIndex];
    this.nextTriangleColorIndex = (this.nextTriangleColorIndex + 1) % TRIANGLE_COLORS.length;
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
      [0, 0],
      [0, this.canvas.height],
      [this.canvas.width, 0],
      [this.canvas.width, this.canvas.height],

      // Scale previous non-corner points
      ...this.points
        .slice(4, numPoints)
        .map(([x, y]) => [
          x * widthChange,
          y * heightChange,
        ]),

      // Generate new points if necessary
      ...Array.from(
        { length: numPoints - Math.max(this.points.length, 4) },
        () => randomPoint(this.canvas.width, this.canvas.height),
      ),
    ];

    this.pointVelocities = [
      ...Array.from({ length: 4 }, () => [0, 0]),
      ...this.pointVelocities.slice(4, this.points.length),
      ...Array.from(
        { length: this.points.length - this.pointVelocities.length },
        () => [
          randomFloat(MAX_POINT_VELOCITY_X, -MAX_POINT_VELOCITY_X),
          randomFloat(MAX_POINT_VELOCITY_Y, -MAX_POINT_VELOCITY_Y),
        ],
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

    const { triangles: cellsFlattened } = new Delaunator(this.points);
    this.cells = Array.from(
      { length: cellsFlattened.length / 3 },
      (v, i) => [...cellsFlattened.subarray(i * 3, (i + 1) * 3)],
    );

    this.draw();

    this.prevWidth = this.canvas.width;
    this.prevHeight = this.canvas.height;
  }

  movePoints() {
    this.points.forEach(([x, y], i) => {
      const [vx, vy] = this.pointVelocities[i];

      if (this.cells
        .filter(cell => !cell.includes(i))
        .map(cell => cell.map(pointIndex => this.points[pointIndex]))
        .some(triangle => isPointInTriangle([x + vx, y + vy], triangle))
      ) {
        this.pointVelocities[i][0] *= -1;
        this.pointVelocities[i][1] *= -1;
      } else {
        if (x + vx < 0 || x + vx > this.canvas.width) {
          this.pointVelocities[i][0] *= -1;
        }

        if (y + vy < 0 || y + vy > this.canvas.height) {
          this.pointVelocities[i][1] *= -1;
        }
      }

      this.points[i] = [
        x + this.pointVelocities[i][0],
        y + this.pointVelocities[i][1],
      ];
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.cells.forEach((cell) => {
      const triangle = cell.map(j => this.points[j]);

      this.ctx.beginPath();
      this.ctx.moveTo(...triangle[0]);
      this.ctx.lineTo(...triangle[1]);
      this.ctx.lineTo(...triangle[2]);
      this.ctx.closePath();

      const cellSerialized = cell.join();
      let color = this.triangleColorMap.get(cellSerialized);
      if (color == null) {
        color = this.getNextTriangleColor();
        this.triangleColorMap.set(cellSerialized, color);
      }

      this.ctx.fillStyle = color;
      this.ctx.strokeStyle = color;
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
