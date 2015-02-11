// state variables, helper functions, etc.
// go here...

function randomNum(min, max) {
	return Math.floor(Math.random()*(max + 1 - min)) + min;
}

// line variables
var cWidth;
var cHeight;
var background = "#333";
var lineAlpha = 0.6;
var lineCountBase = 150;
var lineCountMax = 240;
var lineWidthBase = 3;
var lineWidthMax = 5;
var lineCount = 0;
var lineWidth = 3;
var lineCap = "round";
var lineHeightMax = 0;

// how many frames to wait between redraws
var wait = 5;
// keep track of how many frames we've had
var frameCount = 0;

// microphone variables
var maxLevel = 0;
var oldLevel = 0;
var volumeScale = 0;
var volumeScaleSum = 0;
var audioStream;
var sourceNode;
var javascriptNode;

var volumeScaleEle;
var lineCountEle;
var lineWidthEle;
var onBtn;
var offBtn;
var micStatus;
//var imgOpacity;

var imgMax = 9;

var isPause = false;

var seattle = new Image();
var isImgOn = true;

var dragMouseX;
var dragMouseY;
var isTracing = false;

// one-time initialization.
// by default, this method is only invoked once, upon page launch
// - canvas: an HTML canvas element
// - ctx: a 2D drawing context for the canvas

function init(canvas, ctx) {

  cWidth = canvas.width;
  cHeight = canvas.height;
  document.body.style.backgroundColor = background;

  if(isImgOn) {
    seattle.src = "seattle" + randomNum(1, imgMax) + ".jpg";
    ctx.drawImage(seattle, 0, 0, cWidth, cHeight);
  }

  volumeScaleEle = document.querySelector("#volumeScale");
  lineCountEle = document.querySelector("#lineCount");
  lineWidthEle = document.querySelector("#lineWidth");
  //imgOpacity = document.querySelector("#imgOpacity");

  onBtn = document.getElementById("onBtn");
  onBtn.addEventListener("click", initAudio);

  offBtn = document.getElementById("offBtn");
  offBtn.addEventListener("click", stopAudio);

  micStatus = document.getElementById("micStatus");

  canvas.addEventListener("click", function(){
    isPause = !isPause;
  });

  canvas.addEventListener("mousedown", down);

}

function down(event) {
  isTracing = true;
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
}

function move(event) {
  var canvas = document.getElementById("canvas");
  dragMouseX = event.pageX - canvas.offsetLeft;
  dragMouseY = event.pageY - canvas.offsetTop;
}

function up(event) {
  isTracing = false;
  window.removeEventListener("mousemove", move);
  window.removeEventListener("mouseup", up);
}

function initAudio() {

  onBtn.style.display = "none";
  offBtn.style.display = "inline-block";
  micStatus.innerHTML = "ON";

  // cross browser
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  // check media api support
  if(navigator.getUserMedia) {

    var audioContext = new AudioContext();

    navigator.getUserMedia(
      // only need microphone
      { audio: true, video: false }, 
      // got stream callback
      function(stream) {
        audioStream = stream;
        sourceNode = audioContext.createMediaStreamSource(audioStream);
        javascriptNode = audioContext.createScriptProcessor(1024, 1, 1);
        sourceNode.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);
        
        javascriptNode.onaudioprocess = function(event) {
          var input = event.inputBuffer.getChannelData(0);
          var instantLevel = 0.0;
          var sumLevel = 0.0;
          for(var i = 0; i < input.length; i++) {
            sumLevel += input[i] * input[i];
          }
          instantLevel = Math.sqrt(sumLevel / input.length);
          maxLevel = Math.max(maxLevel, instantLevel);
          instantLevel = Math.max(instantLevel, oldLevel-0.008);
          oldLevel = instantLevel;
          volumeScale = instantLevel/maxLevel;
        }
      },
      // did not get stream
      function(e) {
        console.log(e);
      }
    );
  }
}

function stopAudio() {
  onBtn.style.display = "inline-block";
  offBtn.style.display = "none";
  micStatus.innerHTML = "OFF";
  javascriptNode.onaudioprocess = null;
  if(audioStream) audioStream.stop();
  if(sourceNode) sourceNode.disconnect();
  volumeScale = 0;
  maxLevel = 0;
  oldLevel = 0;
  volumeScaleEle.innerHTML = volumeScale;
  lineCountEle.innerHTML = 0;
  lineWidthEle.innerHTML = 0;
}

// frame drawing routine.
// this method will be invoked once for every frame.
// - canvas: an HTML canvas element
// - ctx: a 2D drawing context for the canvas
function draw(canvas, ctx) {

  //if(isPause) return;

  if(frameCount % wait === 0) {

    if(volumeScale > 0) {
      lineHeightMax = cHeight*volumeScale;
      lineCount = lineCountBase * (1 + volumeScale);
      lineCount = Math.min(lineCount, lineCountMax);
      lineWidth = lineWidthBase * (1 + volumeScale * 3);
      lineWidth = Math.min(lineWidth, lineWidthMax);
      volumeScaleEle.innerHTML = volumeScale.toFixed(5);
      lineCountEle.innerHTML = Math.floor(lineCount);
      lineWidthEle.innerHTML = Math.floor(lineWidth);
      volumeScaleSum += volumeScale/60;
    }
    else {
      lineHeightMax = randomNum(0, 20);
      //lineHeightMax = cHeight-10;
      lineCount = lineCountBase;
      lineWidth = lineWidthBase;
    }

    if(volumeScaleSum > 0.7) {
      seattle.src = "seattle" + randomNum(1, imgMax) + ".jpg";
      volumeScaleSum = 0;
    }

    ctx.clearRect(0, 0, cWidth, cHeight);
    ctx.globalCompositeOperation = "source-over";
    if(isImgOn) {
      ctx.drawImage(seattle, 0, 0, cWidth, cHeight);
      ctx.fillStyle = "rgba(50, 50, 50, " + (1-volumeScaleSum) + ")";
    }
    else {
      ctx.fillStyle = background;
    }
    ctx.fillRect(0, 0, cWidth, cHeight);

    //imgOpacity.innerHTML = 1 - volumeScaleSum;

    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = lineCap;
    
    for (var i = 0; i < lineCount; i++) {
      ctx.beginPath();
      var lineX = randomNum(0, cWidth);
      var tmpHeightMax = lineHeightMax;
      if(isTracing && lineX > dragMouseX-40 && lineX < dragMouseX+40) {
        tmpHeightMax = cHeight-dragMouseY*2;
        if(tmpHeightMax>0) volumeScaleSum += tmpHeightMax/1000000;
        if(tmpHeightMax<0) volumeScaleSum += (-tmpHeightMax)/1000000;
      }
      if(isTracing && lineX > dragMouseX-70 && lineX < dragMouseX-40) {
        tmpHeightMax = (cHeight-dragMouseY*2)/2;
      }
      if(isTracing && lineX > dragMouseX+40 && lineX < dragMouseX+70) {
        tmpHeightMax = (cHeight-dragMouseY*2)/2;
      }

      var lineYStart = randomNum(10, tmpHeightMax) + (cHeight-tmpHeightMax)/2;
      var lineYEnd = randomNum(10, tmpHeightMax) + (cHeight-tmpHeightMax)/2;
      var r = randomNum(100, 255); 
      var g = randomNum(0, 210);
      var b = randomNum(0, 210);
      var lineColor = "rgba(" + r + ", " + g + ", " + b + ", " + lineAlpha + ")" ;
      ctx.strokeStyle = lineColor;
      ctx.moveTo(lineX, lineYStart);
      ctx.lineTo(lineX, lineYEnd);
      ctx.stroke();
    }
  }

  // update the frame count
  frameCount += 1;
}
