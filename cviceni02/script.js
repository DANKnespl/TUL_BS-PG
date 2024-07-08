//tolerance changed using range - fix number, redraw image 
function tolChangeRange(el){
    document.getElementById(el.id+"2").value=el.value;
    if (document.getElementById("convert").disabled==false){
        convertImage() //RT changes
    } 
    //console.log(document.getElementById("convert").disabled)
}
//tolerance changed using number - fix range, fix number if not valid, redraw image
function tolChangeNumber(el){
    el.value=parseInt(el.value)
    if (el.value>255){
        el.value=255;
    }
    if (el.value<0){
        el.value=0;
    }
    document.getElementById(el.id.substring(0,1)).value=el.value;
    el.value=document.getElementById(el.id.substring(0,1)).value;
    if (document.getElementById("convert").disabled==false){
        convertImage()  //RT changes
    }
    //console.log(document.getElementById("convert").disabled)
}


// Callback function called, when file is "opened"
function handleFileSelect(item, elementName) {
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
                    var srcCanvas = document.getElementById(elementName);
                    var srcContext = srcCanvas.getContext("2d");

                    // Change size of canvas
                    srcCanvas.height = srcImg.height;
                    srcCanvas.width = srcImg.width;

                    srcContext.drawImage(srcImg, 0, 0);

                    var dstCanvas = document.getElementById("result");
                    dstCanvas.height = srcImg.height;
                    dstCanvas.width = srcImg.width;

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
    };
};


// Callback function called, when clicked at Convert button
function convertImage() {
    var personCanvas = document.getElementById("person");
    var personContext = personCanvas.getContext("2d");
    var canvasHeight = personCanvas.height;
    var canvasWidth = personCanvas.width;

    var personImageData = personContext.getImageData(0, 0, canvasWidth, canvasHeight);
    var backgroundImageData = document.getElementById("background").getContext("2d").getImageData(0, 0, canvasWidth, canvasHeight);
    var logoImageData = document.getElementById("logo").getContext("2d").getImageData(0, 0, canvasWidth, canvasHeight);
    var resultImageData = document.getElementById("result").getContext("2d").getImageData(0, 0, canvasWidth, canvasHeight);

    convertImageData(personImageData, backgroundImageData, logoImageData, resultImageData);

    document.getElementById("result").getContext("2d").putImageData(resultImageData, 0, 0);
};

// Function for converting raw data of image
function convertImageData(personImageData, backgroundImageData, logoImageData, resultImageData) {
    //load everithing into variables
    var personData = personImageData.data;
    var backgroundData = backgroundImageData.data;
    var logoData = logoImageData.data;
    var resultData = resultImageData.data;
    var red, green, blue, alpha;
    
    //get user specified information for chroma keying
    const tolRed = parseInt(document.getElementById("r").value);
    const tolGreen = parseInt(document.getElementById("g").value);
    const tolBlue = parseInt(document.getElementById("b").value);
    const color=document.getElementById("clr").value;
    const refRed = parseInt(color.substr(1,2), 16)
    const refGreen = parseInt(color.substr(3,2), 16)
    const refBlue = parseInt(color.substr(5,2), 16)
    var alphaFG;
    
    for (var pixelIndex = 0; pixelIndex < personData.length; pixelIndex += 4) {
        //first layer(background)
        red=backgroundData[pixelIndex+0];
        green=backgroundData[pixelIndex+1];
        blue=backgroundData[pixelIndex+2];
        alphaFG=personData[pixelIndex+3]/255;  //get alpha of foreground
        //if colors in tolerance draw the second layer (person)
        if(!(refRed-tolRed<personData[pixelIndex+0] && personData[pixelIndex+0]<refRed+tolRed) || !(refGreen-tolGreen<personData[pixelIndex+1] && personData[pixelIndex+1]<refGreen+tolGreen) || !(refBlue-tolBlue<personData[pixelIndex+2] && personData[pixelIndex+2]<refBlue+tolBlue)){
            red=personData[pixelIndex+0]*alphaFG+red*(1-alphaFG);
            green=personData[pixelIndex+1]*alphaFG+green*(1-alphaFG);
            blue=personData[pixelIndex+2]*alphaFG+blue*(1-alphaFG);
        }
        alphaLG=logoData[pixelIndex+3]/255   //get alpha of logo
        //turn that pixel gray
        gray=(0.299 * logoData[pixelIndex+0] + 0.587 * logoData[pixelIndex+1] + 0.114 * logoData[pixelIndex+2])*alphaLG
        //blending logo into first two layers
        red=red*(1-alphaLG)+gray;
        green=green*(1-alphaLG)+gray;
        blue=blue*(1-alphaLG)+gray;
        alpha = 255; //set alpha to 255, no reason to take anything else

        //set data for last canvas
        resultData[pixelIndex + 0] = red;
        resultData[pixelIndex + 1] = green;
        resultData[pixelIndex + 2] = blue;
        resultData[pixelIndex + 3] = alpha;
    }
}