var rects = [];
var numRects = 20;
var cir;
var score=0, highscore=0;
var obstacle= [];
let video;
let features;
let knn;
let labelP;
let ready = false;
let playerX;
let playerY;
let label = 'nothing';
let clamp = 100;
let enemySpeed = 10;
let = 0;
function preload() {

  // preload() runs once
  enemy1 = loadImage('frog1.png');
  enemy2 = loadImage('frog2.png');
  player1 = loadImage('fly1.png');
  player2 = loadImage('fly3.png');
  player3 = loadImage('fly2.png');





}
function setup() {
    createCanvas(320, 240);
  video = createCapture(VIDEO);
  video.size(320, 240);
  features = ml5.featureExtractor('MobileNet', modelReady);
  knn = ml5.KNNClassifier();
  labelP = createP('need training data');
  labelP.style('font-size', '32pt');
  playerX = width / 2;
  playerY = height / 2;
  frameRate(10);
	createCanvas(displayWidth,displayHeight);

	for(i=0;i<numRects;i++){
		r = new rectObj(random(width),random(height), random(69,70), random(69,70) ) // generate a rectObj
		rects.push(r); //add it to the array.
	}

	cir = new circleObj(20);// create a new circle object
	console.log(rects);
}

function draw(){
  //prevents player from going off the screen
  if(playerY>height-clamp){
  playerY-=10;
  }
  if(playerY<clamp){
  playerY+=10;
  }
  //visual of where out collider is
  //ellipse(playerX, playerY, 24);

  if (label == 'middle') {
    playerY+=0;
  } else if (label == 'up') {
    playerY-=10;
  } else if (label == 'down') {
    playerY+=10;
  }

  //image(video, 0, 0);
  if (!ready && knn.getNumLabels() > 0) {
    goClassify();
    ready = true;
  }
    score++;

	background(0,100,200);



	for(i=0;i<numRects;i++){
		rects[i].disp();
		rects[i].collide( cir ); //collide against the circle object
	}

	cir.disp(displayWidth/2,playerY); //pass the x,y pos in to the circle.
  if(score%2==0){
  image(player1,displayWidth/2-30,playerY-35,60,60);
  }
  else{
  image(player2,displayWidth/2-30,playerY-35,60,60);
  }
  if(score==0){
  image(player3,displayWidth/2-30,playerY-35,60,60);
  }
  textSize(32);
text('score'+score, 10, 30);
text('highscore'+highscore, 10, 72);
}

function rectObj(x,y,w,h,src){
	this.x = x
	this.y = y
	this.w = w
	this.h = h
  this.src = src;
	this.color = color(random(255),random(255),random(255))
	this.hit = false;

	this.collide = function(obj){

		this.hit = collideRectCircle(this.x, this.y, this.w, this.h, obj.x, obj.y, obj.dia); //collide the cir object into this rectangle object.

		if(this.hit){
          if(score>highscore){
            image(player3,displayWidth/2-20,playerY-20,40,40);
          highscore=score;
          }

            score=0;
			this.color = color(0) //set this rectangle to be black if it gets hit

		}

	}

	this.disp = function(){
		noStroke();
		fill(this.color);
		this.x += enemySpeed //move to the right!
		if(this.x > width){ //loop to the left!
            //z = random([0, 1]);
			this.x = -this.w;
            this.color = color(random(255),random(255),random(255))
		}

         if(score%2==0){

          if(h==1){
             image(enemy1,this.x,this.y,this.w,this.h);
            h=0;
          }
           else{
           image(enemy2,this.x,this.y,this.w,this.h);
             h=1;
           }

         }
        else{

            if(h!=1){
             image(enemy2,this.x,this.y,this.w,this.h);

            }
          else{
          image(enemy1,this.x,this.y,this.w,this.h);
          }

        }
	}

}

function circleObj(dia){
	this.dia = dia;
	//this.color = color(random(255),random(255),random(255))
    this.color = color(255)
	this.x;
	this.y;

	this.disp = function(x,y){
		this.x = x;
		this.y = y;
		noStroke();
		fill(this.color);
		ellipse(this.x,this.y,this.dia,this.dia);
	}

}

function goClassify() {
  const logits = features.infer(video);
  knn.classify(logits, function(error, result) {
    if (error) {
      console.error(error);
    } else {
      label = result.label;
      labelP.html(result.label);
      goClassify();
    }
  });
}

function keyPressed() {
  const logits = features.infer(video);
  if (key == 'm') {
    knn.addExample(logits, 'middle');
    console.log('middle');
  } else if (key == 'u') {
    knn.addExample(logits, 'up');
    console.log('up');
  } else if (key == 'd') {
    knn.addExample(logits, 'down');
    console.log('down');
  } else if (key == 's') {
    save(knn, 'model.json');
    //knn.save('model.json');
  }
}

function modelReady() {
  console.log('model ready!');
  // Comment back in to load your own model!
  // knn.load('model.json', function() {
  //   console.log('knn loaded');
  // });
}



// Temporary save code until ml5 version 0.2.2
const save = (knn, name) => {
  const dataset = knn.knnClassifier.getClassifierDataset();
  if (knn.mapStringToIndex.length > 0) {
    Object.keys(dataset).forEach(key => {
      if (knn.mapStringToIndex[key]) {
        dataset[key].label = knn.mapStringToIndex[key];
      }
    });
  }
  const tensors = Object.keys(dataset).map(key => {
    const t = dataset[key];
    if (t) {
      return t.dataSync();
    }
    return null;
  });
  let fileName = 'myKNN.json';
  if (name) {
    fileName = name.endsWith('.json') ? name : `${name}.json`;
  }
  saveFile(fileName, JSON.stringify({ dataset, tensors }));
};

const saveFile = (name, data) => {
  const downloadElt = document.createElement('a');
  const blob = new Blob([data], { type: 'octet/stream' });
  const url = URL.createObjectURL(blob);
  downloadElt.setAttribute('href', url);
  downloadElt.setAttribute('download', name);
  downloadElt.style.display = 'none';
  document.body.appendChild(downloadElt);
  downloadElt.click();
  document.body.removeChild(downloadElt);
  URL.revokeObjectURL(url);
};
