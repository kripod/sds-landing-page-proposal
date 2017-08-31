// @flow

import { createMovingPoint } from './point';

export const randomFloat = (max: number, min?: number = 0) =>
  (Math.random() * (max - min)) + min;

export const randomInt = (max: number, min?: number = 0) =>
  Math.floor(randomFloat(max, min));

export const randomMovingPoint = (
  {
    maxX,
    maxY,
    maxVx = 0,
    maxVy = 0,
    minX = 0,
    minY = 0,
    minVx = 0,
    minVy = 0,
  }: {
    maxX: number,
    maxY: number,
    maxVx?: number,
    maxVy?: number,
    minX?: number,
    minY?: number,
    minVx?: number,
    minVy?: number,
  } = {},
) =>
  createMovingPoint(
    randomFloat(maxX, minX),
    randomFloat(maxY, minY),
    randomFloat(maxVx, minVx),
    randomFloat(maxVy, minVy),
  );
