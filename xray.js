'use strict';

const options = {
  width: 450,
  height: 300,
  top: 'layer1.png',
  bottom: 'layer2.png',
  windowRadius: 50
};

const xrayStatus = {
  active: false,
  mouseX: 0,
  mouseY: 0,
  topImage: null,
  bottomImage: null,
  touchFinger: null
};

function loadImage(url) {
  return new Promise(function(resolve, reject) {
    const image = new Image();
    image.onload = function() {
      resolve(image);
    }
    image.src = url;
  });
}

function main() {
  // create sub canvas
  xrayStatus.subCanvas = document.createElement('canvas');
  xrayStatus.subCanvas.style.display = 'none';
  xrayStatus.subCanvas.width = options.width;
  xrayStatus.subCanvas.height = options.height;
  document.querySelector('body').appendChild(xrayStatus.subCanvas);

  // create main canvas
  xrayStatus.mainCanvas = document.createElement('canvas');
  xrayStatus.mainCanvas.width = options.width;
  xrayStatus.mainCanvas.height = options.height;
  document.querySelector('main').appendChild(xrayStatus.mainCanvas);

  // wire events for mouse
  xrayStatus.mainCanvas.addEventListener('mouseout', function() {
    xrayStatus.active = false;
  });
  xrayStatus.mainCanvas.addEventListener('mousemove', function(e) {
    xrayStatus.active = true;
    xrayStatus.mouseX = e.clientX;
    xrayStatus.mouseY = e.clientY;
  });

  // wire events for touch
  function getTouch(e) {
    if (xrayStatus.touchFinger !== null) {
      for (let t of e.touches) {
        if (t.identifier === xrayStatus.touchFinger) return t;
      }
    }
    return null;
  }
  xrayStatus.mainCanvas.addEventListener('touchstart', function(e) {
    if (xrayStatus.touchFinger === null) {
      xrayStatus.active = true;
      xrayStatus.touchFinger = e.touches[0].identifier;
      xrayStatus.mouseX = e.touches[0].clientX;
      xrayStatus.mouseY = e.touches[0].clientY;
    }
    e.preventDefault();
  });
  xrayStatus.mainCanvas.addEventListener('touchcancel', function(e) {
    if (!getTouch(e)) {
      xrayStatus.touchFinger = null;
      xrayStatus.active = false;
    }
    e.preventDefault();
  });
  xrayStatus.mainCanvas.addEventListener('touchend', function(e) {
    if (!getTouch(e)) {
      xrayStatus.touchFinger = null;
      xrayStatus.active = false;
    }
    e.preventDefault();
  });
  xrayStatus.mainCanvas.addEventListener('touchmove', function(e) {
    const t = getTouch(e);
    if (t) {
      xrayStatus.mouseX = t.clientX;
      xrayStatus.mouseY = t.clientY;
    }
    e.preventDefault();
  });

  // preform first rendering
  render();
}

function render() {
  // draw foreground on sub
  const subContext = xrayStatus.subCanvas.getContext('2d');
  subContext.drawImage(xrayStatus.topImage, 0, 0);

  // xor out window on sub
  if (xrayStatus.active) {
    // convert client coords to local coords
    const imagePosition = xrayStatus.mainCanvas.getBoundingClientRect();

    const windowGradient = subContext.createRadialGradient(
      xrayStatus.mouseX - imagePosition.x, xrayStatus.mouseY - imagePosition.y, options.windowRadius * 0.8,
      xrayStatus.mouseX - imagePosition.x, xrayStatus.mouseY - imagePosition.y, options.windowRadius * 1.2
    );
    windowGradient.addColorStop(0, 'black');
    windowGradient.addColorStop(1, 'transparent');

    subContext.fillStyle = windowGradient;
    subContext.globalCompositeOperation = 'xor';
    subContext.fillRect(0, 0, options.width, options.height);
    subContext.globalCompositeOperation = 'source-over';
  }

  // preform main compositing
  const mainContext = xrayStatus.mainCanvas.getContext('2d');
  mainContext.drawImage(xrayStatus.bottomImage, 0, 0);
  mainContext.drawImage(xrayStatus.subCanvas, 0, 0);

  // request a new animation frame to render again
  window.requestAnimationFrame(render);
}

window.addEventListener('load', function() {
  // load all images, then begin xray script
  Promise.all([loadImage(options.top), loadImage(options.bottom)]).then(function(images) {
    xrayStatus.topImage = images[0];
    xrayStatus.bottomImage = images[1];
    main();
  });
});
