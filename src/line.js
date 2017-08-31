// @flow

import type { Point } from './point';
import { createVector } from './vector';
import type { Vector } from './vector';

export type LineSegment = [Point, Point];

export const createLineSegment = (endpoint1: Point, endpoint2?: Point = { x: 0, y: 0 }) =>
  [
    endpoint1,
    endpoint2,
  ];

export const lineSegmentToVector = (lineSegment: LineSegment): Vector =>
  createVector(
    lineSegment[1].x - lineSegment[0].x,
    lineSegment[1].y - lineSegment[0].y,
  );
