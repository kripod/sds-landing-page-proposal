// @flow

import Delaunator from 'delaunator';
import { createCell } from './cell';
import { createMovingPoint, pointDistanceFromLineSegment } from './point';
import { randomInt, randomMovingPoint } from './random';
import { createVector, vectorLength } from './vector';
import type { Cell } from './cell';
import type { MovingPoint } from './point';

const POINT_DENSITY = 0.05 / window.devicePixelRatio;
const MAX_POINT_VELOCITY_X = 0.5;
const MAX_POINT_VELOCITY_Y = 0.5;
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

  points: Array<MovingPoint>;
  cells: Array<Cell>;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.prevWidth = this.canvas.offsetWidth;
    this.prevHeight = this.canvas.offsetHeight;

    this.points = [];
    this.cells = [];

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

    // Make the amount of points proportional to the screen size
    const numPoints = Math.round(
      POINT_DENSITY *
      Math.sqrt(
        (this.canvas.width ** 2) +
        (this.canvas.height ** 2),
      ),
    );
    const widthChange = this.canvas.width / this.prevWidth;
    const heightChange = this.canvas.height / this.prevHeight;

    this.points = [
      // Corners
      createMovingPoint(0, 0),
      createMovingPoint(0, this.canvas.height),
      createMovingPoint(this.canvas.width, 0),
      createMovingPoint(this.canvas.width, this.canvas.height),

      // Scale previous non-corner points
      ...this.points.slice(4, numPoints).map(({ x, y, vx, vy }) => ({
        x: x * widthChange,
        y: y * heightChange,
        vx,
        vy,
      })),

      // Generate new points if necessary
      ...Array.from(
        { length: numPoints - Math.max(this.points.length, 4) },
        () =>
          randomMovingPoint({
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

    const prevCellColors = new Map(
      this.cells.map(({ pointIndexes, color }) => [pointIndexes.join(), color]),
    );

    this.cells = Array.from({ length: cellsFlattened.length / 3 }, (v, i) => {
      const pointIndexes = [...cellsFlattened.subarray(i * 3, (i + 1) * 3)];

      return createCell(
        pointIndexes,
        prevCellColors.get(pointIndexes.join()) ||
          TRIANGLE_COLORS[randomInt(TRIANGLE_COLORS.length)],
      );
    });

    this.draw();

    this.prevWidth = this.canvas.width;
    this.prevHeight = this.canvas.height;
  }

  movePoints() {
    this.points = this.points
      .map((point, i) => {
        const triangles = this.cells.filter(({ pointIndexes }) => pointIndexes.includes(i));

        const oppositeEdges = triangles
          .map(({ pointIndexes }) =>
            pointIndexes
              .filter(pointIndex => pointIndex !== i)
              .map(pointIndex => this.points[pointIndex]),
          );

        const v = createVector(point.vx, point.vy);

        const collidingEdge = oppositeEdges
          .find(edge =>
            pointDistanceFromLineSegment([edge[0], edge[1]], point) <= vectorLength(v),
          );

        let { vx, vy } = point;

        if (collidingEdge) {
          vx *= -1;
          vy *= -1;
        }

        return {
          x: point.x + vx,
          y: point.y + vy,
          vx,
          vy,
        };
      });

    /*
    this.points.forEach(({ x, y, vx, vy }, i) => {
      const collidingTriangle = this.cells
        .filter(cell => !cell.pointIndexes.includes(i))
        .map(cell =>
          cell.pointIndexes.map(pointIndex => this.points[pointIndex]),
        )
        .find(triangle =>
          isPointInTriangle(
            [x + vx, y + vy],
            triangle.map(point => [point.x, point.y]),
          ),
        );

      if (collidingTriangle != null) {
        const edges = [
          createLineSegment(collidingTriangle[0], collidingTriangle[1]),
          createLineSegment(collidingTriangle[0], collidingTriangle[2]),
          createLineSegment(collidingTriangle[1], collidingTriangle[2]),
        ];

        const distancesFromEdges = edges.map(edge => pointDistanceFromLineSegment(edge, { x, y }));

        const collidingEdge = edges[distancesFromEdges.indexOf(Math.min(...distancesFromEdges))];
        const collisionAngle = vectorsAngle(
          lineSegmentToVector(collidingEdge),
          createVector(vx, vy),
        );

        const vRotated = vectorRotate2D([-vx, -vy], Math.PI - (2 * collisionAngle));

        this.points[i].vx = vRotated[0];
        this.points[i].vy = vRotated[1];
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
    */
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.cells.forEach((cell) => {
      const triangle = cell.pointIndexes.map(
        pointIndex => this.points[pointIndex],
      );

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
