// Callback function called, when file is "opened"
function handleFileSelect(item) {
	var files = item.files;

	console.log(files);

	for (var i = 0; i < files.length; i++) {
		console.log(files[i], files[i].name, files[i].size, files[i].type);

		// Only process image files.
		if (!files[i].type.match('image.*')) {
			continue;
		}

		var reader = new FileReader();

		// Closure for loading image to memory
		reader.onload = (function(file) {
			return function(evt) {

				var srcImg = new Image();
				srcImg.src = evt.target.result;

				srcImg.onload = function() {
					var srcCanvas = document.getElementById("src");
					var srcContext = srcCanvas.getContext("2d");

					// Change size of canvas
					srcCanvas.height = srcImg.height;
					srcCanvas.width = srcImg.width;

					srcContext.drawImage(srcImg, 0, 0);

					var convertButton = document.getElementById("convert");
					// Enabled button
					convertButton.disabled = false;
					// Add callback
					convertButton.addEventListener('click', convertImage, false);
				}
			}
		})(files[i]);

		reader.readAsDataURL(files[i]);

		break;
	}
}

// Callback function called, when clicked at Convert button
function convertImage() {
	var srcCanvas = document.getElementById("src");
	var srcContext = srcCanvas.getContext("2d");
	var canvasHeight = srcCanvas.height;
	var canvasWidth = srcCanvas.width;

	var srcImageData = srcContext.getImageData(0, 0, canvasWidth, canvasHeight);

	convertImageData(srcImageData);

	srcContext.putImageData(srcImageData, 0, 0);
}

// Function for converting raw data of image
function convertImageData(imgData) {
	//výsledek není 100% stejný, 
	var rawData = imgData.data;
	var pixelIndex, pixelIndexG;
	const M = [[0,12,3,15],[8,4,11,7],[2,14,1,13],[10,6,9,5]]
	const n = 4
	const k = 17
	var err,val
	var grayData= RGB2GRAY(imgData)
	for(var y = 0; y < imgData.height; y++) {
		for(var x = 0; x < imgData.width; x++) {
			pixelIndexG = getPixelID(x,y,imgData.width) * 2
			pixelIndex = getPixelID(x,y,imgData.width) * 4
			gray= grayData[pixelIndexG]
			val = (gray >  k *M[y%n][x%n])?255:0
			putGrayPixel(rawData,pixelIndex,val)
			err = val - gray
			//feedback v podobě zaokrouhlovací chyby
			grayData[getPixelID(x+1,y,imgData.width)*2]+=(7/16)*err
			grayData[getPixelID(x-1,y+1,imgData.width)*2]+=(3/16)*err
			grayData[getPixelID(x,y+1,imgData.width)*2]+=(5/16)*err
			grayData[getPixelID(x+1,y+1,imgData.width)*2]+=(1/16)*err
		
			rawData[pixelIndex + 3] = grayData[pixelIndexG+1];
		}
	}
}

//Puts Grayscale pixel into img at specified index
function putGrayPixel(rawData,Index,value){
	rawData[Index + 0] = value;
	rawData[Index + 1] = value;
	rawData[Index + 2] = value;

}

//RGB IMG to GRAYSCALE IMG
function RGB2GRAY(imgData){
	rawData=imgData.data
	grayData=[]
	for(var y = 0; y < imgData.height; y++) {
		for(var x = 0; x < imgData.width; x++) {
			pixelIndexG = getPixelID(x,y,imgData.width) * 2
			pixelIndex = getPixelID(x,y,imgData.width) * 4
			red   = rawData[pixelIndex + 0];
			green = rawData[pixelIndex + 1];
			blue  = rawData[pixelIndex + 2];
			alpha = rawData[pixelIndex + 3];
			grayData[pixelIndexG]= 0.299 * red + 0.587 * green + 0.114 * blue
			grayData[pixelIndexG+1]=alpha
		}
	}
	return grayData
}

//gets pixel id 
function getPixelID(x,y,width){
	return ((width * y) + x)
}
