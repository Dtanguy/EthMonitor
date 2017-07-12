var fs = require("fs");
eval(fs.readFileSync('./mod.js', 'utf-8'));

setup('CRYPTO', 'dtanguy.fr', 3010);
function connected(){
	console.log('Connected!');
}

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var http = require('http');
var https = require('https');
var request = require("request")
var crontab = require('node-crontab');


/************************ FAKE DATABASE ************************/
var LastTimestamp = new Date();
var DDB_ETH = {
        "value": [
            {
                "timestamp": -1,
                "spot": -1,
                "sell": -1,
                "buy": -1,
                "gdaxSell": -1,
                "gdaxNbSell": -1,
                "gdaxBuy": -1,
            "gdaxNbBuy": -1
        }
	]
};
var DDB_BTC = {
        "value": [
            {
                "timestamp": -1,
                "spot": -1,
                "sell": -1,
                "buy": -1,
                "gdaxSell": -1,
                "gdaxNbSell": -1,
                "gdaxBuy": -1,
                "gdaxNbBuy": -1
            }
		]
};

function readDDB(DDB, devise) {

	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1;
	var yyyy = today.getFullYear();
	var filename = devise + "-" + dd + "-" + mm + "-" + yyyy + ".json";
	
	fs.readFile('./'+filename, function (err,data) {
		if (err) {
			return console.log(err);
		}
		if(data){
			
			try {
				var json = JSON.parse(data);					
				console.log("The file loaded!");
				//console.log(json);
				if (devise == 'ETH-EUR'){
					DDB_ETH = json.DDB;
				}else if (devise == 'BTC-EUR'){
					DDB_BTC = json.DDB;
				}
			}
			catch(err) {
				
				console.log(err);
				if (devise == 'ETH-EUR'){
					DDB_ETH = {
							"value": [
								{
									"timestamp": -1,
									"spot": -1,
									"sell": -1,
									"buy": -1,
									"gdaxSell": -1,
									"gdaxNbSell": -1,
									"gdaxBuy": -1,
									"gdaxNbBuy": -1
								}
							]
					};
				}else if (devise == 'BTC-EUR'){
					DDB_BTC = {
							"value": [
								{
									"timestamp": -1,
									"spot": -1,
									"sell": -1,
									"buy": -1,
									"gdaxSell": -1,
									"gdaxNbSell": -1,
									"gdaxBuy": -1,
									"gdaxNbBuy": -1
								}
							]
					};
				}
			}		
		}
	});
}
	
function writeDDB(devise){
	
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1;
	var yyyy = today.getFullYear();
	var filename = devise + "-" + dd + "-" + mm + "-" + yyyy + ".json";

	var DDB = {};
	if (devise == 'ETH-EUR'){
		DDB = DDB_ETH;
	}else if (devise == 'BTC-EUR'){
		DDB = DDB_BTC;
	}

	var fs = require('fs');		
	fs.writeFile(filename, JSON.stringify ({'DDB': DDB}, null, 4), { flag: 'w' }, function(err) {
		if(err) {
			return console.log(err);
		}
	});  
	//console.log("The file was saved!");
}

readDDB(DDB_ETH, 'ETH-EUR');
readDDB(DDB_BTC, 'BTC-EUR');


/************************* EXPRESS **************************/

var app = express(); 
app.use(express.static('public'));
	
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(bodyParser.json({ limit: '10mb' }));   

app.use(function (error, req, res, next) {
  if (error) {
    res.sendStatus(500);
    res.end();
  } else {
    next();
  }
});

app.use(bodyParser.urlencoded({   
  limit: '10mb',
  extended: true
}));

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  next();
});

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname+'/public/index.html'));
});




/************************* END POINT **************************/
subscribe('/ETH/getlast', function (data, fn) {
	var last = DDB_ETH.value[DDB_ETH.value.length-1];
	publish('/ETH/last', last, function(err, data){
		if (err){
			err('ETH/getlast => ' + err + JSON.stringify(err));
		}
	});
});

	
	

app.get('/getsince/:devise/:min/:max', function (req, res) {
	var devise = req.params.devise;
	var max = Date.now();
	if (req.params.max){
		max = req.params.max;
	}
	var min = req.params.min;
	//console.log("I got this !", limitTime);
	
	var toSend = {
		'spot': [],
		'buy': [],
		'sell': [],		
		'gdaxBuy': [],
		'gdaxSell': [],
		'timestamp': []
	};
	
	var DDB = {};
	if (devise == 'ETH-EUR'){
		DDB = DDB_ETH;
	}else if (devise == 'BTC-EUR'){
		DDB = DDB_BTC;
	}
	
	for (var i = 0; i < DDB.value.length; i++) {
		if (DDB.value[i].spot < 0 || 
			DDB.value[i].buy < 0 || 
			DDB.value[i].sell < 0 ||	
			DDB.value[i].gdaxBuy < 0 || 
			DDB.value[i].gdaxSell < 0				
		){			
		}else {		
			if (DDB.value[i].timestamp > min && DDB.value[i].timestamp < max){
				toSend.spot.push(DDB.value[i].spot);
				toSend.buy.push(DDB.value[i].buy);
				toSend.sell.push(DDB.value[i].sell);
				toSend.gdaxBuy.push(DDB.value[i].gdaxBuy);
				toSend.gdaxSell.push(DDB.value[i].gdaxSell);
				toSend.timestamp.push(DDB.value[i].timestamp);
			}
		}
	}
	
	res.json(JSON.stringify (toSend));
});

app.get('/getchange/:devise', function (req, res) {
	var devise = req.params.devise;
	
	var DDB = {};
	if (devise == 'ETH-EUR'){
		DDB = DDB_ETH;
	}else if (devise == 'BTC-EUR'){
		DDB = DDB_BTC;
	}
	
	res.json(JSON.stringify ({
		'ping': LastTimestamp,
		'last': DDB.value[DDB.value.length-1].timestamp, 
	}));
});

app.get('/getdata/:devise', function (req, res) {
	var devise = req.params.devise;
	
	var DDB = {};
	if (devise == 'ETH-EUR'){
		DDB = DDB_ETH;
	}else if (devise == 'BTC-EUR'){
		DDB = DDB_BTC;
	}
	res.json(JSON.stringify (DDB.value[DDB.value.length-1]));
});

	
app.listen(3000, function () {
	console.log('App listening on port 3000!');
});



/************************* Get on external API **************************/

// End point
var coinBaseUrl = "https://api.coinbase.com/v2"
var gdaxUrl = "https://api.gdax.com";

// ETH & BTC var
var tmpE, tmpB;
var flagE, flagB;

function ifGoodAndDiffSave(devise, tmp, flag) {	
	if(flag[0] && flag[1] && flag[2] && flag[3]){
		
		//Update ping
		LastTimestamp = Date.now();		
	
		//Update value if some change
		if(DDB_ETH.value[DDB_ETH.value.length-1].spot != tmp.spot ||
			DDB_ETH.value[DDB_ETH.value.length-1].sell != tmp.sell ||
			DDB_ETH.value[DDB_ETH.value.length-1].buy != tmp.buy ||
			DDB_ETH.value[DDB_ETH.value.length-1].gdaxSell != tmp.gdaxSell ||
			DDB_ETH.value[DDB_ETH.value.length-1].gdaxBuy != tmp.gdaxBuy ){	
			
			tmp.timestamp = Date.now();
			if (devise == 'ETH-EUR'){
				DDB_ETH.value.push(tmp);
			}else if (devise == 'BTC-EUR'){
				DDB_BTC.value.push(tmp);
			}				
			writeDDB(devise);
			
			publish('/' + name + '/' + devise + '/last', tmp, function(r, data){
				if (r){
					err(devise + '/last => ' + r + JSON.stringify(r));
				}
			});
		}
		
	}	
}

function getPrice(devise, tmp, flag) {
	
	//Reset
	flag = [false,false,false,false];
	tmp = {
		'timestamp': -1,
		'spot': -1,
		'sell': -1,
		'buy': -1,
		'gdaxSell': -1,
		'gdaxNbSell': -1,
		'gdaxBuy': -1,
		'gdaxNbBuy': -1		
	};
	
	//CoinBase buy
    request({
		url: coinBaseUrl + "/prices/" + devise + "/buy",
		json: true
	}, function (error, response, body) {
		if (!error && response.statusCode === 200) {			
			tmp.buy = body.data.amount;					
		}else{
			console.log("sell error :", error);
		}
		flag[0] = true;
		ifGoodAndDiffSave(devise, tmp, flag);
	});
	
	//CoinBase sell
	request({
		url: coinBaseUrl + "/prices/" + devise + "/sell",
		json: true
	}, function (error, response, body) {
		if (!error && response.statusCode === 200) {			
			tmp.sell = body.data.amount;
		}else{
			console.log("sell error :", error);
		}		
		flag[1] = true;
		ifGoodAndDiffSave(devise, tmp, flag);
	});
	
	//CoinBase spot
	request({
		url: coinBaseUrl + "/prices/" + devise + "/spot",
		json: true
	}, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			tmp.spot = body.data.amount;				
		}else{
			console.log("spot error :", error);
		}
		flag[2] = true;
		ifGoodAndDiffSave(devise, tmp, flag);
	});
	
	//GDAX buy and sell
	request({
		url: gdaxUrl + "/products/" + devise + "/book", //?level=3",
		headers: {'User-Agent': 'request'},
		json: true
	}, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			tmp.gdaxSell = body.bids[0][0];
			tmp.gdaxBuy = body.asks[0][0];
			tmp.gdaxNbSell = body.bids[0][1];
			tmp.gdaxNbBuy = body.asks[0][1];
		}else{
			console.log("error :", error);
		}
		flag[3] = true;
		ifGoodAndDiffSave(devise, tmp, flag);
	});	
}


//Every 5 sec, ask for new data
var jobId = crontab.scheduleJob("*/5 * * * * *", function(){ 
    getPrice('ETH-EUR', tmpE, flagE);	
	getPrice('BTC-EUR', tmpB, flagB);	
});

//Every hour, reload DBB
var jobPurge = crontab.scheduleJob("0 */1 * * *", function(){ 
	readDDB(DDB_ETH, 'ETH-EUR');
	readDDB(DDB_BTC, 'BTC-EUR');
});

