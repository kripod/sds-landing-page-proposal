// @flow

export type Vector = Array<number>;
export type Vector2D = [number, number];

export const createVector = (...coordinates: Array<number>): Vector => coordinates;

// Source: https://en.wikipedia.org/wiki/Magnitude_(mathematics)#Euclidean_vector_space
export const vectorLength = (vector: Vector) =>
  Math.sqrt(vector.reduce((acc, curr) => acc + (curr ** 2), 0));

// Source: https://en.wikipedia.org/wiki/Rotation_(mathematics)#Two_dimensions
export const vectorRotate2D = (vector: Vector2D, angle: number) =>
  [
    (vector[0] * Math.cos(angle)) - (vector[1] * Math.sin(angle)),
    (vector[0] * Math.sin(angle)) + (vector[1] * Math.cos(angle)),
  ];

// Source: https://en.wikipedia.org/wiki/Dot_product#Algebraic_definition
export const vectorsDotProduct = (vector1: Vector, vector2: Vector) =>
  vector1.reduce((acc, curr, i) => acc + (curr * vector2[i]), 0);

// Source: https://en.wikipedia.org/wiki/Dot_product#Geometric_definition
export const vectorsAngle = (vector1: Vector, vector2: Vector) =>
  Math.acos(
    vectorsDotProduct(vector1, vector2) / (
      vectorLength(vector1) *
      vectorLength(vector2)
    ),
  );
