// @flow

export const randomInt = (max: number, min?: number = 0) =>
  Math.floor(Math.random() * (max - min)) + min;

export const randomPoint = (maxX: number, maxY: number, minX?: number = 0, minY?: number = 0) =>
  [
    randomInt(maxX, minX),
    randomInt(maxY, minY),
  ];

export default randomInt;
