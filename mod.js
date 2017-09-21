var mqtt = require('mqtt');
var rip = require("ip");

var myName = 'noName';
var myNum = -1;

var mip = rip.address();
var tab = [];
var client;

var settings = {
	connectTimeout: 5000,
	keepalive: 65000,
	username: '',
    password: ''
}

function setup(nm, ip, port){
	
	if(nm != ''){
		myName = nm;
	}else{
		myName = 'unKnow';
	}
	myNum =	Math.random().toString(16).substr(2, 8);	
	settings.clientId = myName + '-' + myNum;
	
	if(port){
		client = mqtt.connect('mqtt://' + ip + ':' + port, settings);
	}else{
		client = mqtt.connect('mqtt://' + ip, settings);
	}

	client.on('connect', function () {
		if(typeof connected === "function"){
			connected();
			publish('/' +myName + '-' + myNum + '/ping', {});
		}	
	});	
	
	client.on('message', function (topic, msg) {
		var msg = msg.toString();
		
		if(!topic || !msg){
			return;
		}
		
		for (var i = 0; i < tab.length; i++){
			if (topic == tab[i].chan){
				if(tab[i].cb){
					try {
						var msg2 = JSON.parse(msg);
					} catch (e) {
						msg2 = {err: e, str: msg};
					}
					tab[i].cb(msg2);
				}
			}
		}
		
		if(typeof allPub === "function"){
			allPub(topic, msg2);
		}
		
	});
	
	subscribe('/' + myName + '-' + myNum + '/exit', function () {
		process.exit(1);
	});
		
	subscribe('/' + myName + '-' + myNum + '/justdoit', function (msg) {
		if(msg.ask){
			try{
				var ans;
				eval(msg.ask);
				publishLocal('/justdoit', {answer: ans});
			}catch(r){
				publishLocal('/justdoit', {err: r});
			}	
		}
	});
}


function publish(channel, msg){
	try {
		msg.from = myName + '-' + myNum;
		msg.ip = mip;
		client.publish(channel, JSON.stringify(msg));
	}catch(e){
		console.log(e);
	}		
}


function subscribe(chann, callback){
	try {
		client.subscribe(chann);
		tab.push({chan: chann, cb: callback});		
	}catch(e){
		console.log(e);
	}
}


function unsubscribe(chann){
	var t = [];
	for (var i = 0; i < tab.length; i++){
		if (chann == tab[i].chan){
			t.push(i);					
		}
	}
	for (var i = 0; i < t.length; i++){
		tab.splice(t[i],1);
		publish('/unsubscribe', {name: myName + '-' + myNum, channel: chann});
	}
}


function err(txt){
	publish('/ERROR', {err: txt});
	console.log('\x1b[41m%s\x1b[0m', '/ERROR', txt);
	console.log('');
}


function log(txt){
	publish('/LOG', {log: txt});
	console.log('\x1b[36m%s\x1b[0m', '/LOG {from: ' + myName + '-' + myNum + '}', txt);
	console.log('');
}