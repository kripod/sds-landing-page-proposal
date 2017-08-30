// @flow

import Background from './background';

const backgroundCanvas = document.getElementById('background-canvas');

if (!(backgroundCanvas instanceof HTMLCanvasElement)) {
  throw new Error('Could not initialize UI. Some HTML elements are invalid or missing.');
}

const bg = new Background(backgroundCanvas); // eslint-disable-line no-unused-vars
bg.startAnimation();
