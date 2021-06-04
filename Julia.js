// Maximum number of iterations for each point on the complex plane
let video;
let poseNet;
let poses = [];
let pose;

const MAX_ITERATIONS = 32;

let cnv_mandel;
let cnv_julia;
let prev_ca = 0, prev_cb = 0; 

let elem_coord = document.getElementById("coord");
let paused = true;
let spacePressed = false;
let mouseXThing;
let mouseYThing;


addEventListener("keypress", onKeyPress);

function onKeyPress(event) {
  console.log('hey');
  // paused = !paused;
  spacePressed = !spacePressed;
  // pause();
}

function setup() {
  pixelDensity(1);
  cnv = createCanvas(1280,480);
  cnv.doubleClicked(handleDouble);
  cnv.touchStarted(handleDouble);
  
  // cnv_mandel = createGraphics(1280, 480);
  cnv_julia = createGraphics(1280, 480);
  colorMode(HSB); 

  video = createCapture(VIDEO);
  video.size(width, height);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on("pose", function(results) {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  // video.hide();
  
  // updateMandel();
  
}

const handleDouble = () => {
  spacePressed=!spacePressed;
}

function modelReady() {
  select("#status").html("Model Loaded");
}

function draw() {
  // image(cnv_mandel,0,0);
  updateJulia();
  image(cnv_julia,0,0);
  pause();
  // image(cnv_julia,0,0);
  drawKeypoints();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i += 1) {
    // For each pose detected, loop through all the keypoints
    const pose = poses[i].pose;
    // const pose = poses[i].pose['leftWrist'];
    // const leftWrist = poses[i].pose['leftWrist'];
    // const pose = poses[i].pose['leftWrist'];
    for (let j = 0; j < pose.keypoints.length; j += 1) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      const keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        fill(255, 0, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
        // console.log(keypoint.position.x, keypoint.position.y)
      }
    }
  }
}

let zoom = 4;

function mouseWheel(e) {
  if (e.delta > 0) {
    zoom *= 1.1;  
  } else {
    zoom /= 1.1;
  }
}

const pause = () => {
  if (spacePressed === true) {
    mouseXThing = poses[0].pose.keypoints[9].position.x, mouseYThing = poses[0].pose.keypoints[9].position.y, console.log('mouseXThing: ', mouseXThing, 'mouseYThing: ', mouseYThing), spacedPressed = false
    return;
    // mouseXThing = mouseX, mouseYThing = mouseY, console.log('mouseXThing: ', mouseXThing, 'mouseYThing: ', mouseYThing), spacedPressed = false
    // return;
  }

}

function updateJulia() {
   //const ca = lerp(prev_ca, map(mouseX, 0, cnv_julia.width, -2, 1),.3);//-0.70176;
   //const cb = lerp(prev_cb, map(mouseY%cnv_julia.height, 0, cnv_julia.height, -1, 1),.3);//-0.70176;
   let ca;
   let cb;
   if(paused) {
    ca = map(mouseXThing, 0, cnv_julia.width, -2, 1);
    cb = map(mouseYThing%cnv_julia.height, 0, cnv_julia.height, -1, 1);
   } else {
    ca = map(poses[0].pose.keypoints[9].position.x, 0, cnv_julia.width, -2, 1);
    cb = map(poses[0].pose.keypoints[9].position.y%cnv_julia.height, 0, cnv_julia.height, -1, 1);
    // ca = map(mouseX, 0, cnv_julia.width, -2, 1);
    // cb = map(mouseY%cnv_julia.height, 0, cnv_julia.height, -1, 1);
   }
  
  prev_ca = ca; 
  prev_cb = cb;
  cnv_julia.background(255);

  elem_coord.innerHTML = ca.toFixed(4) + " + " + cb.toFixed(4) + "i";
  // Establish a range of values on the complex plane
  // A different range will allow us to "zoom" in or out on the fractal

  // It all starts with the width, try higher or lower values
  //float w = abs(sin(angle))*5;
  let w = zoom;
  let h = (w * cnv_julia.height) / cnv_julia.width;

  // Start at negative half the width and height
  let xmin = -w/2;
  let ymin = -h/2;

  // Make sure we can write to the pixels[] array.
  // Only need to do this once since we don't do any other drawing.
  cnv_julia.loadPixels();
  // x goes from xmin to xmax
  let xmax = xmin + w;
  // y goes from ymin to ymax
  let ymax = ymin + h;

  // Calculate amount we increment x,y for each pixel
  let dx = (xmax - xmin) / (cnv_julia.width);
  let dy = (ymax - ymin) / (cnv_julia.height);

  // Start y
  let y = ymin;
  for (let j = 0; j < cnv_julia.height; j++) {
    // Start x
    let x = xmin;
    for (let i = 0; i < cnv_julia.width; i++) {

      // Now we test, as we iterate z = z^2 + cm does z tend towards infinity?
      let a = x;
      let b = y;
      let n = 0;
      while (n < MAX_ITERATIONS) {
        let aa = a * a;
        let bb = b * b;
        // Infinity in our finite world is simple, let's just consider it 16
        if (aa + bb > 8.0) {
          break;  // Bail
        }
        let twoab = 2.0 * a * b;
        a = aa - bb + ca;
        b = twoab + cb;
        n++;
      }

      // We color each pixel based on how long it takes to get to infinity
      // If we never got there, let's pick the color black
      let pix = 4 * (i + j*width);
      
      if (n == MAX_ITERATIONS) {
        cnv_julia.pixels[pix] = 0;
        cnv_julia.pixels[pix+1] = 0;
        cnv_julia.pixels[pix+2] = 0;
        cnv_julia.pixels[pix+3] = 255;
      } else {
        // Gosh, we could make fancy colors here if we wanted
        let hu = ((n / MAX_ITERATIONS) * 360) % 360;
        let c = color(hu,100,Math.pow(n/MAX_ITERATIONS,.25)*100);
        
        cnv_julia.pixels[pix] = red(c); // color(hu, 100, 100);
        cnv_julia.pixels[pix+1] = green(c); // color(hu, 100, 100);
        cnv_julia.pixels[pix+2] = blue(c); // color(hu, 100, 100);
        cnv_julia.pixels[pix+3] = 255; // color(hu, 100, 100);
      }
      x += dx;
    }
    y += dy;
  }
  cnv_julia.updatePixels();
}

// function  updateMandel() {
//   cnv_mandel.background(255);

//   // Start at negative half the width and height
//   let xmin = -2;
//   let ymin = -1;

//   // Make sure we can write to the pixels[] array.
//   // Only need to do this once since we don't do any other drawing.
//   cnv_mandel.loadPixels();

//   // x goes from xmin to xmax
//   let xmax = 1;
//   // y goes from ymin to ymax
//   let ymax = 1;

//   // Calculate amount we increment x,y for each pixel
//   let dx = (xmax - xmin) / (cnv_mandel.width);
//   let dy = (ymax - ymin) / (cnv_mandel.height);

//   // Start y
//   const y = ymin;
//   for (let j = 0; j < cnv_mandel.height; j++) {
//     // Start x
//     let x = xmin;
//     for (let i = 0; i < cnv_mandel.width; i++) {

//       // Now we test, as we iterate z = z^2 + cm does z tend towards infinity?
//       let a = x;
//       let b = y;
      
//       let ca = a;
//       let cb = b;
      
//       let n = 0;
//       while (n < MAX_ITERATIONS) {
//         let aa = a * a - b * b;
//         let bb = 2 * a * b;
//         a = aa + ca;
//         b = bb + cb;
//         if (a * a + b * b > 16) {
//           break;
//         }
//         n++;
//       }

//       // We color each pixel based on how long it takes to get to infinity
//       // If we never got there, let's pick the color black
//       let pix = 4 * (i + j*cnv_mandel.width);
      
//       if (n == MAX_ITERATIONS) {
//         cnv_mandel.pixels[pix] = 0;
//         cnv_mandel.pixels[pix+1] = 0;
//         cnv_mandel.pixels[pix+2] = 0;
//         cnv_mandel.pixels[pix+3] = 255;
//       } else {
//         // Gosh, we could make fancy colors here if we wanted
//         let hu = ((n / MAX_ITERATIONS) * 360) % 360;
//         let c = color(hu,100,Math.pow(n/MAX_ITERATIONS,.25)*100);
        
//         cnv_mandel.pixels[pix] = red(c); // color(hu, 100, 100);
//         cnv_mandel.pixels[pix+1] = green(c); // color(hu, 100, 100);
//         cnv_mandel.pixels[pix+2] = blue(c); // color(hu, 100, 100);
//         cnv_mandel.pixels[pix+3] = 255; // color(hu, 100, 100);
//       }
//       x += dx;
//     }
//     y += dy;
//   }
//   cnv_mandel.updatePixels();
// }
