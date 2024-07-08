import Score from '../js/Score.js';

// Audio elements
var audio = new Audio('../media/missFX.mp3');
var audio2 = new Audio('../media/hitFX.mp3');

// Scores
const [p1Score, setP1Score] = new Score({ "left": "25%", "bottom": "0" });
const [p2Score, setP2Score] = new Score({ "right": "25%", "bottom": "0" });

// Game elements
var cube,controls,renderer,camera, scene, stats;
var leftSpringer, rightSpringer;
var area_size=[8.01,3.51,1.01]
const dyBase = 0.03;
const dxBase = 0.02;
var dy = 0.00;
var dx = 0.03;

// Controller object for key presses
const controller = {
    "w": { pressed: false },
    "s": { pressed: false },
    "ArrowUp": { pressed: false },
    "ArrowDown": { pressed: false }
};

// Event listeners for key presses
document.addEventListener("keydown", (e) => {
    // Key normalization
    var key = e.key.length == 1 ? e.key.toLowerCase() : e.key;
    if (controller[key]) {
        controller[key].pressed = true;
    }
});
document.addEventListener("keyup", (e) => {
    // Key normalization
    var key = e.key.length == 1 ? e.key.toLowerCase() : e.key;
    if (controller[key]) {
        controller[key].pressed = false;
    }
});

// Function to execute player moves based on key presses
const executeMoves = () => {
    Object.keys(controller).forEach(key => {
        if (controller[key].pressed) {
            switch (key) {
                case "w":
                    movePaddleUp(leftSpringer);
                    break;
                case "s":
                    movePaddleDown(leftSpringer);
                    break;
                case "ArrowUp":
                    movePaddleUp(rightSpringer);
                    break;
                case "ArrowDown":
                    movePaddleDown(rightSpringer);
                    break;
            }
        }
    });
};

//Functions to move paddles based on player input
function movePaddleUp(springer){
	if (springer != undefined){
		if(springer.position.y < 1.25){
			if(springer.position.x < 0){
					leftSpringer.position.y+=0.05		
			}else{
				rightSpringer.position.y+=0.05
			}
		}
	}
	
}
function movePaddleDown(springer){
	if (springer != undefined){
		if(springer.position.y > -1.25){
			if(springer.position.x < 0){
				leftSpringer.position.y-=0.05
			}else{
				rightSpringer.position.y-=0.05
			}
		}
	}
}

window.onload = function() {
	var parent, obj, area;
	init();
	animate();
	function init() {
		camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
		camera.position.z = 5.0;

		controls = new THREE.TrackballControls( camera );
		controls.rotateSpeed = 4.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.8;
		controls.noZoom = false;
		controls.noPan = false;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;
		controls.keys = [ 65, 83, 68 ];
		controls.addEventListener( 'change', render );

		// Create scene hierarchy
		scene = new THREE.Scene();
		parent = new THREE.Object3D();
		obj = new THREE.Object3D();
		parent.add(obj);
		scene.add( parent );

		//Area for play
		let box_geometry = new THREE.BoxGeometry( area_size[0], area_size[1], area_size[2] );
		let box_mesh = new THREE.Mesh(box_geometry, null);
		area = new THREE.BoxHelper(box_mesh);
		scene.add(area);

		//Springers
		let springerGeometry= new THREE.BoxGeometry(0.25, 1, 1);
		const right_material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
		const left_material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
		leftSpringer = new THREE.Mesh(springerGeometry, left_material);
		rightSpringer = new THREE.Mesh(springerGeometry, right_material);
		leftSpringer.scale.set(0.25,1,1)
		rightSpringer.scale.set(0.25,1,1)
		scene.add(leftSpringer)
		scene.add(rightSpringer)
		leftSpringer.position.x=-(area_size[0]-0.01)/2
		rightSpringer.position.x=(area_size[0]-0.01)/2
	

		//ball
		let cube_geometry = new THREE.BoxGeometry( 1, 1, 1 );
		const cube_material = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Replace 0x00ff00 with your desired color
		cube = new THREE.Mesh( cube_geometry, cube_material);
		cube.scale.x=0.25
		cube.scale.y=0.25
		cube.scale.z=0.25
		obj.add( cube );

		// Display statistics of drawing to canvas
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		stats.domElement.style.zIndex = 100;
		document.body.appendChild( stats.domElement );

		// renderer
		renderer = new THREE.WebGLRenderer();
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );

		window.addEventListener( 'resize', onWindowResize, false );
	}
}

function animate() {
	requestAnimationFrame( animate );
	executeMoves()
	if (cube.position.y+cube.scale.y/2 >= (area_size[1])/2 || cube.position.y-cube.scale.y/2 <= -(area_size[1])/2) {
		dy = -dy
		audio2.cloneNode(true).play();
	};
	
	if (dx < 0){
		if (cube.position.x-cube.scale.x/2 <= (leftSpringer.position.x+leftSpringer.scale.x/2)) {
			springerColisionY(leftSpringer)
		};
	}else{
		if (cube.position.x+cube.scale.x/2 >= (rightSpringer.position.x-rightSpringer.scale.x/2)) {
			springerColisionY(rightSpringer)
		};
	}
	if (cube.position.x+cube.scale.x/2 >= (area_size[0])/2) {
		dx = -dx;
	};
	cube.position.y += dy;
	cube.position.x += dx;
	
	controls.update();
	render();
}

function springerColisionY(springer){
	//intersectsBox is not used to ensure hit registering in high speed situations
	if (cube.position.y-cube.scale.y/2 <=springer.position.y+springer.scale.y/2 && cube.position.y+cube.scale.y/2 >= springer.position.y-springer.scale.y/2){
		if(dx > 0){
			dx = -(dx+0.02);
			//quantum tuneling fix
			cube.position.x = springer.position.x-springer.scale.x/2
		}else{
			dx = -(dx-0.02);
			//quantum tuneling fix
			cube.position.x = springer.position.x+springer.scale.x/2
		}
		if(dy==0){
			dy=dyBase
		}
		audio2.cloneNode(true).play();
	}
	else{
		//reset
		if(dx > 0){
			dx = -dxBase;
			setP1Score(prev => prev + 1);
		}else{
			dx = dxBase;
			setP2Score(prev => prev + 1);
		}
		if(dy > 0){
			dy = dyBase;
		}else{
			dy = -dyBase;
		}
		cube.position.x=0
		audio.cloneNode(true).play();
	}
}




function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	controls.handleResize();
	render();
}

function render() {
	renderer.render( scene, camera );
	stats.update();
}
