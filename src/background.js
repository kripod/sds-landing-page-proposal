// @flow

import Delaunator from 'delaunator';
import { randomPoint } from './random';
import type { Point } from './point';

const POINT_DENSITY = 0.05;
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
  triangleColorMap: Map<string, string>;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.prevWidth = this.canvas.offsetWidth;
    this.prevHeight = this.canvas.offsetHeight;

    this.points = [];
    this.triangleColorMap = new Map();

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

    const numPoints = Math.sqrt(POINT_DENSITY * this.canvas.width * this.canvas.height);
    const widthChange = this.canvas.width / this.prevWidth;
    const heightChange = this.canvas.height / this.prevHeight;

    this.points = [
      [0, 0],
      [0, this.canvas.height],
      [this.canvas.width, 0],
      [this.canvas.width, this.canvas.height],
      ...this.points
        .slice(Math.min(this.points.length, 4), numPoints)
        .map(([x, y]) => [
          x * widthChange,
          y * heightChange,
        ]),
      ...Array.from(
        { length: numPoints - this.points.length },
        () => randomPoint(this.canvas.width, this.canvas.height),
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

    this.draw();

    this.prevWidth = this.canvas.width;
    this.prevHeight = this.canvas.height;
  }

  draw() {
    const { triangles } = new Delaunator(this.points);

    let triangleColorIndex = 0;

    for (let i = 0; i < triangles.length; i += 3) {
      const pointIndexes = triangles.slice(i, i + 3);
      const triangle = [...pointIndexes].map(j => this.points[j]);

      this.ctx.beginPath();
      this.ctx.moveTo(...triangle[0]);
      this.ctx.lineTo(...triangle[1]);
      this.ctx.lineTo(...triangle[2]);
      this.ctx.closePath();

      const pointIndexesSerialized = pointIndexes.join();
      let color = this.triangleColorMap.get(pointIndexesSerialized);
      if (color == null) {
        color = TRIANGLE_COLORS[triangleColorIndex];
        this.triangleColorMap.set(pointIndexesSerialized, color);
      }

      this.ctx.fillStyle = color;
      this.ctx.strokeStyle = color;
      this.ctx.fill();
      this.ctx.stroke();

      triangleColorIndex = (triangleColorIndex + 1) % TRIANGLE_COLORS.length;
    }
  }
}
