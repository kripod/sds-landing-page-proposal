// @flow

export type Point = {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const createPoint = (x?: number = 0, y?: number = 0, vx?: number = 0, vy?: number = 0) => (
  { x, y, vx, vy }
);

export default createPoint;
