// @flow

import type { LineSegment } from './line';

export type Point = {
  x: number,
  y: number,
};

export type MovingPoint = {
  x: number,
  y: number,
  vx: number,
  vy: number,
};

export const createMovingPoint = (
  x?: number = 0,
  y?: number = 0,
  vx?: number = 0,
  vy?: number = 0,
): MovingPoint => ({ x, y, vx, vy });

// Source: https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
export const pointDistanceFromLineSegment = (lineSegment: LineSegment, point: Point) =>
  Math.abs(
    (
      ((lineSegment[1].y - lineSegment[0].y) * point.x) -
      ((lineSegment[1].x - lineSegment[0].x) * point.y)
    ) + (
      (lineSegment[1].x * lineSegment[0].y) -
      (lineSegment[1].y * lineSegment[0].x)
    ),
  ) / Math.sqrt(
    ((lineSegment[1].y - lineSegment[0].y) ** 2) +
    ((lineSegment[1].x - lineSegment[0].x) ** 2),
  );
