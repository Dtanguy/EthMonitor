

/***************************** Graph config *******************************/

Chart.defaults.global.animationSteps = 1;
var lineSize = 1;
var radius = 0;

var config = {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: "Spot",
            backgroundColor: 'blue',
            borderColor: 'blue',
			borderWidth: lineSize,
			radius: radius,
            data: [],
            fill: false,
        }, {
            label: "Buy",
            fill: false,
            backgroundColor: 'red',
            borderColor: 'red',
			borderWidth: lineSize,
			radius: radius,
            data: [],
        }, {
            label: "Sell",
            fill: false,
            backgroundColor: 'green',
            borderColor: 'green',
			borderWidth: lineSize,
			radius: radius,
            data: [],
        }, {
            label: "GDAX Buy",
            fill: false,
            backgroundColor: 'DarkOrange',
            borderColor: 'DarkOrange',
			borderWidth: lineSize,
			radius: radius,
            data: [],
        }, {
            label: "GDAX Sell",
            fill: false,
            backgroundColor: 'GreenYellow',
            borderColor: 'GreenYellow',
			borderWidth: lineSize,
			radius: radius,
            data: [],
        }]
	},
    options: {
        responsive: true,
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: false,
                    labelString: 'Month'
                }
            }],
			yAxes: [{
				display: true,
				scaleLabel: {
					display: true,
					labelString: 'EUR'
				}
			}]
		}
    }
};

var ctx = $("#graph")[0].getContext('2d');
var myLine = new Chart(ctx, config);





/***************************** API CALL *******************************/
var getLast = '/getdata';		
var getChange = '/getchange';
var getSince = '/getsince';
var lastTimestamp = -1;
var yesterday = new Date(Date.now() - 86400000);// new Date(Date.now() - (1000*60*60*60*4));
var graphMax = 500;
var choice = 'ETH-EUR';
var audio = new Audio('bell.mp3');

function timestampToString(timestamp){
	var d = new Date(timestamp);
	var m = d.getMinutes();
	if (d.getMinutes() < 10){
		m = '0'+ d.getMinutes();
	}
	var s = d.getSeconds();
	if (d.getSeconds() < 10){
		s = '0'+ d.getSeconds();
	}
	return d.getHours() + "h" + m + " " + s;
}

function haveChange(){
	$.get(getChange + "/" + choice, function(data) {
		if(data){
			var DD = JSON.parse(data);
			$("#ping").html("Last get: " + timestampToString(DD.ping)+'sec');
			if(DD.last > lastTimestamp){
				getLastDate();
				lastTimestamp = DD.last;
			}
		}
		setTimeout(haveChange, 2500);
	}).fail(function() {
		console.log("getChange fails");
		setTimeout(haveChange, 2500);
	});
}

function getDataSince(min, max){
	$.get(getSince + "/" + choice + "/" + new Date(min).getTime() + "/" + new Date(max).getTime(), function(data) {
		if(data){
			var DD = JSON.parse(data);
			updateGraph(DD.spot, DD.buy, DD.sell, DD.gdaxBuy, DD.gdaxSell, DD.timestamp);
		}else{
			setTimeout(getDataSince(min,max), 200);
		}
	}).fail(function() {
		setTimeout(getDataSince(min,max), 200);
	});
}

function getLastDate(){	
	$.get(getLast + "/" + choice, function(data) {
		if(data){		
			var DD = JSON.parse(data);
			

			var b = parseFloat($("#alertBelow").val());
			if (b && b > 0 && DD.buy < b && parseFloat(config.data.datasets[1].data[config.data.datasets[1].data.length - 1]) >= b) {
				audio.play();
				setTimeout(()=>{audio.pause()},2200);
			}

			var u = parseFloat($("#alertUpper").val());
			if (u && u > 0 && DD.buy > u && parseFloat(config.data.datasets[1].data[config.data.datasets[1].data.length - 1]) <= u) {
				audio.play();
				setTimeout(()=>{audio.pause()},2200);
			}

			updateGraph(DD.spot, DD.buy, DD.sell, DD.gdaxBuy, DD.gdaxSell, DD.timestamp);
		}
	}).fail(function() {
		console.log("getLast fails");
	});
}

function updateGraph(spot, buy, sell, gdaxBuy, gdaxSell, timestamp){

	if (timestamp.constructor === Array) {	
		config.data.labels = [];	
		for (i = 0; i < timestamp.length; i++) {
			config.data.labels.push(timestampToString(timestamp[i]));
		}			
		config.data.datasets[0].data = spot;
		config.data.datasets[1].data = buy;
		config.data.datasets[2].data = sell;
		config.data.datasets[3].data = gdaxBuy;
		config.data.datasets[4].data = gdaxSell;	
	}else{		
		if (spot < 0 || buy < 0 || sell < 0 || gdaxBuy < 0 || gdaxSell < 0 ){
			return;
		}		
		config.data.labels.push(timestampToString(timestamp));
		config.data.datasets[0].label = "Spot: " + spot + " EUR"
		config.data.datasets[0].data.push(spot);
		config.data.datasets[1].label = "Buy: " + buy + " EUR"
		config.data.datasets[1].data.push(buy);
		config.data.datasets[2].label = "Sell: " + sell + " EUR"
		config.data.datasets[2].data.push(sell);
		config.data.datasets[3].label = "GDAX Buy: " + gdaxBuy + " EUR"
		config.data.datasets[3].data.push(gdaxBuy);
		config.data.datasets[4].label = "GDAX Sell: " + gdaxSell + " EUR"
		config.data.datasets[4].data.push(gdaxSell);
	}
	
	update();	
}

function update(){
	while(config.data.labels.length > graphMax){
		config.data.labels.shift();
		config.data.datasets[0].data.shift();
		config.data.datasets[1].data.shift();
		config.data.datasets[2].data.shift();
		config.data.datasets[3].data.shift();
		config.data.datasets[4].data.shift();
	}
	myLine.update();
}

function changeGraphMax(val){
	if (graphMax != val){		
		if (val > graphMax){
			graphMax = val;
			getDataSince(yesterday, Date.now());
		}else{
			graphMax = val;
			update();
		}		
	}
	$("#nbValue").html("Display " + graphMax + " points" );
}

var flag = false;
function addMarker(state){
	
	var c = parseFloat( $("#cour").val() );
	var v = parseFloat( $("#valeur").val() );
	
	if (flag == true && config.data.datasets.length > 5){
		flag = false;
		config.data.datasets.pop();
		config.data.datasets.pop();
		myLine.update();
	}else if (v > 0 && c > 0 && flag == false){
		flag = true;
		var min = Array(1000).fill(c);	
		var max = Array(1000).fill(c + (v * 0.015)*2 );
		
		config.data.datasets.push({
			label: "Your buy: " + min[0],
			fill: false,
			backgroundColor: 'grey',
			borderColor: 'grey',
			borderWidth: 2,
			radius: radius,
			data: min,
		});

		config.data.datasets.push({
			label: "Benef: " + max[0],
			fill: false,
			backgroundColor: 'grey',
			borderColor: 'grey',
			borderWidth: 2,
			radius: radius,
			data: max,
		});
		
		myLine.update();
	}
}


// Start
getDataSince(yesterday, Date.now());
haveChange();

