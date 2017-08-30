// @flow

export type Cell = {
  pointIndexes: Array<number>;
  color: string;
};

export const createCell = (pointIndexes: Array<number>, color: string) => (
  { pointIndexes, color }
);

export default createCell;
