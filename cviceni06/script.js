function createNewModel(){
	//Funguje nejlépe s firefoxem
	//S Chromem padá možnost nastavování hodnot,
	//jelikož znovunačítám stránku

	//Důležité proměnné
	var vertices =[]
	var pointPositions = []
	var uvs=[]
	var indices = []
	var normals = []
	var indicesTMP=[]
	var ind = 0
	var OGradius = 1
	var layers= parseInt(document.getElementById("rL").value)
	var points = parseInt(document.getElementById("rP").value)
	
	//smyčka od horní vrstvy po spodní vrstvu
	for(var i=-(layers-1)/2;i<=(layers-1)/2;i++){
		newCircle = getNewCircle(OGradius,(layers-1)/2, i)
		pointPositions=generateCirclePoints(newCircle[0],points, newCircle[1])
		pointPositions.forEach((currentElement) => {
			vertices=vertices.concat(currentElement)
			normals=normals.concat(currentElement)
		});
		//generování uv mapy
		for(var j=0;j<=points;j++){
			uvs.push((1-j/points))
			uvs.push((newCircle[1]+1)/2)
		}
		[indicesTMP,ind]=indicesCreation(points,ind)
		indices=indices.concat(indicesTMP)

	}
	indices=indices.concat(fixSouth(points,layers,ind))

	
	var gl = document.getElementById("webgl_canvas").getContext("experimental-webgl");
	console.log(document.getElementById("webgl_canvas").getContext("experimental-webgl"))
	// Create vertex shader
	var vertexShaderCode = document.querySelector("#vs").textContent;
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderCode);
	gl.compileShader(vertexShader);
	// Create fragment shader
	var fragmentShaderCode = document.querySelector("#fs").textContent;
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderCode);
	gl.compileShader(fragmentShader);

	// Create program
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	gl.useProgram(program);

	// Create buffer for positions of vertices
	var posLoc = gl.getAttribLocation(program, "pos");
	gl.enableVertexAttribArray(posLoc);
	// Create buffer for position of vertices
	var posBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
	// We need many vertices, because each vertex need
	// own value of normal and UV
	

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

	// Create buffer for UV coordinates
	var uvLoc = gl.getAttribLocation(program, "uv");
	gl.enableVertexAttribArray(uvLoc);
	var uvBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
	gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

	// Create buffer for vertex normals
	var normalLoc = gl.getAttribLocation(program, "normal");
	gl.enableVertexAttribArray(normalLoc);
	var normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, true, 0, 0);

	// Create index buffer
	var indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);


		
	// Create and load image used as texture
	var image = new Image();
	//image.src = "./wood_texture_simple.png";
	image.src = "./earth.jpg";	
	image.onload = function() {
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		var samplerLoc = gl.getUniformLocation(program, "sampler");
		gl.uniform1i(samplerLoc, 0); // nula odpovídá gl.TEXTURE0
	};

	// Create matrix for model
	var modelMatrix = mat4.create();
	mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(0.8, 0.8, 0.8));
	var modelLocation = gl.getUniformLocation(program, "modelMatrix");
	gl.uniformMatrix4fv(modelLocation, false, modelMatrix);

	// Create matrix for view
	var viewMatrix = mat4.create();
	mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -parseFloat(document.getElementById("rC").value)));
	var viewLocation = gl.getUniformLocation(program, "viewMatrix");
	gl.uniformMatrix4fv(viewLocation, false, viewMatrix);

	// Create matrix for projection
	var projMatrix = mat4.create();
	mat4.perspective(projMatrix, Math.PI/3, 1, 0.1, 100);
	var projLocation = gl.getUniformLocation(program, "projMatrix");
	gl.uniformMatrix4fv(projLocation, false, projMatrix);

	// Create matrix for transformation of normal vectors
	var normalMatrix = mat3.create();
	var normalLocation = gl.getUniformLocation(program, "normalMatrix");
	mat3.normalFromMat4(normalMatrix, modelMatrix);
	gl.uniformMatrix3fv(normalLocation, false, normalMatrix);

	// Enable depth test
	gl.enable(gl.DEPTH_TEST);

	// Create polyfill to make it working in the most modern browsers
	window.requestAnimationFrame = window.requestAnimationFrame
		|| window.mozRequestAnimationFrame
		|| window.webkitRequestAnimationFrame
		|| function(cb) { setTimeout(cb, 1000/60); };

	var render = function() {
		//mat4.rotateY(modelMatrix, modelMatrix, 0.01);
		//mat4.rotateX(modelMatrix, modelMatrix, 0.01);
		mat4.rotateZ(modelMatrix, modelMatrix, -0.02);
		
		gl.uniformMatrix4fv(modelLocation, false, modelMatrix);

		mat3.normalFromMat4(normalMatrix, modelMatrix);
		gl.uniformMatrix3fv(normalLocation, false, normalMatrix);

		gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
		gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
		requestAnimationFrame(render);
	}
	//vyrovnání na rovník
	mat4.rotateX(modelMatrix, modelMatrix, Math.PI/2);
	//23.5° sklon osy Země
	mat4.rotateY(modelMatrix, modelMatrix, -0.408407)
	//centrování na Afriku
	mat4.rotateZ(modelMatrix, modelMatrix, -4*Math.PI/10);
	//mat4.rotateY(modelMatrix, modelMatrix, Math.PI/2);
	render();
}


window.onload = function() {
	createNewModel()
}
function pageReload(){
	if(document.getElementById("CB").checked){
		location.reload()
	}
}





function generateCirclePoints(radius,pointsCount, z){
	//generuje body na vrstevní kružnici
	var angle = 0
	var dAngle = 2*Math.PI/pointsCount
	var points = []
	var x=0
	var y=0
	for(i = 0; i<=pointsCount; i++){
		x=radius*Math.cos(angle)
		y=radius*Math.sin(angle)
		points[i]=[x,y,z]
		angle+=dAngle
	}
	return points
}
function getNewCircle(OGradius, points, heightOffset){
	//generuje radius a výšku nové vrstvy
	var z=OGradius/points*heightOffset
	var radius = Math.sqrt(Math.pow(OGradius,2)-Math.pow(z,2))
	return [radius, z]
}

function FixNumbers(letter,el){
	//kontrola validity dat v number/range
	if(el.id.substring(1,2)!="C"){
		el.value=parseInt(el.value)
	}else{
		el.value=parseFloat(el.value)
	}
	console.log(el.value)
    if (el.value>parseFloat(el.max)){
        el.value=parseFloat(el.max);
    }
    if (el.value<parseFloat(el.min)){
        el.value=parseFloat(el.min);
    }
	console.log(el.value)
    document.getElementById(letter+el.id.substring(1,2)).value=el.value;
    el.value=document.getElementById(letter+el.id.substring(1,2)).value;
	pageReload()
}








function fixSouth(points,layers,ind){
	//idk Antarktida má problémy, když je points < (layers-1)/2
	//rychlý fix
	offset=0
	var indicesTMP=[]
	while (points + offset<=(layers)/2){
		offset++
		indicesTMP,ind=indicesCreation(points,ind)
		ind+=points
	}
	//indexy poslední vrstvy
	[indicesTMP,_]=indicesCreation(points,ind)
	return indicesTMP
}

function indicesCreation(points,ind){
	var indicesTMP=[]
	//generování indexů
	for(var j=0;j<=points;j++){
		indicesTMP.push(ind+j)
		indicesTMP.push(ind+j+points)
		indicesTMP.push(ind+j+1+points)
	
		indicesTMP.push(ind+j)
		indicesTMP.push(ind+j+1)
		indicesTMP.push(ind+j+1+points)
	}
	ind+=points
	return [indicesTMP,ind]
}