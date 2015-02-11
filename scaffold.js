// Scaffolding for generative art exercise.
// DO NOT MODIFY.
(function() {
  var canvas = document.getElementById("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var ctx = canvas.getContext("2d");

  var timer_frame = window.requestAnimationFrame
      || window.webkitRequestAnimationFrame
      || window.mozRequestAnimationFrame
      || window.oRequestAnimationFrame
      || window.msRequestAnimationFrame
      || function(callback) { setTimeout(callback, 17); };

  function tick() {
    if (typeof draw === 'function') {
      draw(canvas, ctx);
    }
    advance();
  }

  function advance() {
    timer_frame(tick);
  }

  init(canvas, ctx);
  advance();
})();