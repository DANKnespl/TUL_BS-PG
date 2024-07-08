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
					srcCanvas.height = srcImg.height;
					srcCanvas.width = srcImg.width;
					srcContext.drawImage(srcImg, 0, 0);
					DrawHistograms(true)
				}
			}
		})(files[i]);

		reader.readAsDataURL(files[i]);

		break;
	};
};

function DrawHistograms(full){
	/*
	Metoda pro započetí výpočtů a vykreslování histogramů
	Někde tady se přenastavovala velikost canvasů pro histogramy. V zadání je:
	"Mějte na paměti, že canvas id="histogram" má pevnou velikost 256x256."
	zbavil jsem se tedy tohoto přenastavení.
	*/
	var srcCanvas = document.getElementById("src");
	var srcContext = srcCanvas.getContext("2d");
	var histCanvas = document.getElementById("histogram");
	var histContext = histCanvas.getContext("2d");
	var hist2Canvas = document.getElementById("histogram2");
	var hist2Context = hist2Canvas.getContext("2d");

	var canvasHeight = srcCanvas.height;
	var canvasWidth = srcCanvas.width;
	var srcImageData = srcContext.getImageData(0, 0, canvasWidth, canvasHeight);

	var histHeight = histCanvas.height;
	var histWidth = histCanvas.width;
	var histImageData = histContext.getImageData(0, 0, histWidth, histHeight);

	var hist2Height = hist2Canvas.height;
	var hist2Width = hist2Canvas.width;
	var hist2ImageData = hist2Context.getImageData(0, 0, hist2Width, hist2Height);

	convertImageData(srcImageData, histImageData, hist2ImageData, full);
	
	hist2Context.putImageData(hist2ImageData, 0, 0);
	histContext.putImageData(histImageData, 0, 0);
}



// Function for converting raw data of image
function convertImageData(srcImageData, histImageData,hist2ImageData, full) {
	var histData = histImageData.data;
	var hist2Data = hist2ImageData.data;
	//vyčištění canvasů histogramů
	for(var i=0;i< histData.length;i++){
		histData[i]=0;
		if(full){
			hist2Data[i]=0;
		}
	}
	//výběr hlavního histogramu
	var radios = document.getElementsByName('MainHistogram');
	var value;
	for (var i = 0; i < radios.length; i++) {
		if (radios[i].type === 'radio' && radios[i].checked) {
			value = radios[i].value;       
		}
	}
	// Go through the image using x,y coordinates
	var datagrams=GetDatagrams(srcImageData)
	var redData=datagrams[0]
	var greenData=datagrams[1]
	var blueData=datagrams[2]
	var grayData=datagrams[3]
	
	//tvorba polí histogramů
	var mainData=datagrams[value]
	var redHist=Array(256).fill(0)
	var greenHist=Array(256).fill(0)
	var blueHist=Array(256).fill(0)
	var grayHist=Array(256).fill(0)
	var mainHist=Array(256).fill(0)
	//plnění histogramů
	for (var i=0; i<mainData.length; i+=2){
		if(redData[i+1]!=0){
			redHist[redData[i]]+=1
		}
		if(greenData[i+1]!=0){
			greenHist[greenData[i]]+=1
		}
		if(blueData[i+1]!=0){
			blueHist[blueData[i]]+=1
		}
		if(grayData[i+1]!=0){
			grayHist[grayData[i]]+=1
		}
		if(mainData[i+1]!=0){
			mainHist[mainData[i]]+=1
		}
	}

	maxAmount=Math.max.apply(Math,mainHist)
	var normRedHist=Array(256).fill(0)
	var normGreenHist=Array(256).fill(0)
	var normBlueHist=Array(256).fill(0)
	var normGrayHist=Array(256).fill(0)
	var normMainHist=Array(256).fill(0)
	//transformace hodnot histogramů v závislosti na výšce kanvasu
	for(var i=0;i<mainHist.length;i++){
		normRedHist[i] = redHist[i]/Math.max.apply(Math,redHist)*histImageData.height;
		normGreenHist[i] = greenHist[i]/Math.max.apply(Math,greenHist)*histImageData.height;
		normBlueHist[i] = blueHist[i]/Math.max.apply(Math,blueHist)*histImageData.height;
		normGrayHist[i] = grayHist[i]/Math.max.apply(Math,grayHist)*histImageData.height;
		normMainHist[i] = mainHist[i]/Math.max.apply(Math,mainHist)*histImageData.height;
	}

	for(var x=0; x < mainHist.length; x++){
		//vykreslení vybraného histogramu
		for(var y=histImageData.height;y > histImageData.height - normMainHist[x];y--){
			pixelIndex = getPixelID(x,y,histImageData.width) * 4
			histData[pixelIndex + 0] = (value==0?255:0);
			histData[pixelIndex + 1] = (value==1?255:0);
			histData[pixelIndex + 2] = (value==2?255:0);
			histData[pixelIndex + 3] = 255;
		}
		if(full){
			//vykreslení jasového histogramu
			for(var y=histImageData.height;y > histImageData.height - normGrayHist[x];y--){
				pixelIndex = getPixelID(x,y,histImageData.width) * 4
				hist2Data[pixelIndex + 0] = 0
				hist2Data[pixelIndex + 1] = 0
				hist2Data[pixelIndex + 2] = 0
				hist2Data[pixelIndex + 3] = 255;
			}
			//prolnutí červeným histogramem
			for(var y=histImageData.height;y > histImageData.height - normRedHist[x];y--){
				pixelIndex = getPixelID(x,y,histImageData.width) * 4
				hist2Data[pixelIndex + 0] += 255
				hist2Data[pixelIndex + 1] += 0
				hist2Data[pixelIndex + 2] += 0
				hist2Data[pixelIndex + 3] = 255;
			}
			//prolnutí zeleným histogramem
			for(var y=histImageData.height;y > histImageData.height - normGreenHist[x];y--){
				pixelIndex = getPixelID(x,y,histImageData.width) * 4
				hist2Data[pixelIndex + 0] += 0
				hist2Data[pixelIndex + 1] += 255
				hist2Data[pixelIndex + 2] += 0
				hist2Data[pixelIndex + 3] = 255;
			}
			//prolnutí červeným histogramem
			for(var y=histImageData.height;y > histImageData.height - normBlueHist[x];y--){
				pixelIndex = getPixelID(x,y,histImageData.width) * 4
				hist2Data[pixelIndex + 0] += 0
				hist2Data[pixelIndex + 1] += 0
				hist2Data[pixelIndex + 2] += 255
				hist2Data[pixelIndex + 3] = 255;
				//kontrola překrytí hodnot v RGB histogramech
				console.log(hist2Data[pixelIndex + 0]==hist2Data[pixelIndex + 1]==hist2Data[pixelIndex + 2]==255)
				if(hist2Data[pixelIndex + 0]==255 && hist2Data[pixelIndex + 1]==255){
					hist2Data[pixelIndex + 0] = 128
					hist2Data[pixelIndex + 1] = 128
					hist2Data[pixelIndex + 2] = 128
				
				}
			}
		}

	}
};

function GetDatagrams(imgData){
	/*
	Separuje barevné kanály, a tvoří pro ně šedotónovou reprezentaci
	Vrací pole polí [R, G, B, Y], všechna vnitřní pole jsou [hodnota, alpha, hodnota2, alpha2, ... hodnotan, alphan]
	*/
	var rawData=imgData.data
	var datagrams
	var redData=[]
	var greenData=[]
	var blueData=[]
	var grayData=[]
	for(var y = 0; y < imgData.height; y++) {
		for(var x = 0; x < imgData.width; x++) {
			pixelIndexG = ( (imgData.width * y) + x) * 2
			pixelIndex = ( (imgData.width * y) + x) * 4
			red   = rawData[pixelIndex + 0];
			green = rawData[pixelIndex + 1];
			blue  = rawData[pixelIndex + 2];
			alpha = rawData[pixelIndex + 3];
			
			redData[pixelIndexG]=red
			greenData[pixelIndexG]=green
			blueData[pixelIndexG]=blue
			grayData[pixelIndexG]=Math.floor(0.299 * red + 0.587 * green + 0.114 * blue)
			
			redData[pixelIndexG+1]=alpha
			greenData[pixelIndexG+1]=alpha
			blueData[pixelIndexG+1]=alpha
			grayData[pixelIndexG+1]=alpha
		}
	}
	datagrams = [redData,greenData,blueData,grayData]
	return datagrams
}

function getPixelID(x,y,width){
	/*
	počítá index pro 2D pole hodnot, kde každá hodnota=index.
	Pro delší je nutné násobit délkou jedné hodnoty (RGBA = *4)
	 */
	return ((width * y) + x)
}