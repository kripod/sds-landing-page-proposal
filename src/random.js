// @flow

export const randomFloat = (max: number, min?: number = 0) =>
  (Math.random() * (max - min)) + min;

export const randomPoint = (maxX: number, maxY: number, minX?: number = 0, minY?: number = 0) =>
  [
    randomFloat(maxX, minX),
    randomFloat(maxY, minY),
  ];
