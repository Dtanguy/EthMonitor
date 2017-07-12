var io = require('socket.io-client');
var timeoutCallback = require('timeout-callback');
var socket;
var name = "noName";
var verbose = true;
var tab = [];
var state = 0;

function setup(nm, ip, port){
	socket = io.connect('http://' + ip + ':' + port, {reconnect: true});
	socket.heartbeatTimeout = 1000;
	name = nm;
	state = 1;
	
	socket.on('connect', function (socket) {
		publish('/register', {name : name}, function(err, data){
			if(!err){
				for (var i = 0; i < tab.length; i++){
					console.log("HAAAAAA");
					publish('/subscribe', tab[i]);
				}
			}
		});
		if(connected){
			connected();
		}else{
			err('No connected function');
		}	
	});

	
	socket.on('msgFromCore', function(msg) {
		try {
			if(msg){
				if(msg.channel && msg.data){
					for (var i = 0; i < tab.length; i++){
						if (msg.channel == tab[i].chan){
							if(tab[i].cb){
								log('<= ' + msg.channel + '; data : ' + JSON.stringify(msg.data))
								//console.log('<= ' + msg.channel + '; data : ' + JSON.stringify(msg.data));
								tab[i].cb(msg.data);
							}
						}
					}
					state = 2;
				}else{
					log('<= ???');
					state = -1;
					//console.log('<= ???');
				}
			}else{
				log('<= ???');
				state = -1;
				//console.log('<= ???');
			}
		
		}catch(e){
			err('ERR' + e);
		}
	});
	
	socket.on('disconnect', function(){
		//console.log('disconnected !!'); 
		log('disconnected !!'); 
	});

}

function subscribe(channel, callback){
	publish('/subscribe', channel);
	tab.push({chan: channel, cb: callback});	
}

function subscribeLocal(channel, callback){
	subscribe('/' + name + channel, callback);
}

function unsubscribe(channel){
	var t = [];
	for (var i = 0; i < tab.length; i++){
		if (channel == tab[i].chan){
			t.push(i);					
		}
	}
	for (var i = 0; i < t.length; i++){
		tab.splice(t[i],1);
	}
}

function publish(chan, d, cb){
	try {
		if(cb){
			socket.emit('msgFromCli', {channel: chan, data: d}, timeoutCallback(1000, cb));
		}else{
			socket.emit('msgFromCli', {channel: chan, data: d});
		}	
		console.log('=> ' + chan + '; data : ' + JSON.stringify(d));
	}catch(e){
		//err('ERR =>' + e);
		cb(e);
	}
}

function err(txt){
	state = -2;
	publish('/' + name + '/err', txt, function(e, data){
		if (e){
			console.log(name + ' : ERROR SEND ERROR !');
		}
	});
	console.log('/' + name + '/err' + ' ' + txt);
}

function log(txt){
	if(verbose){
		publish('/' + name + '/log', txt, function(e, data){
			if (e){
				console.log(name + ' : ERROR SEND LOG !');
			}
		});
		console.log('/' + name + '/log' + ' ' + txt);
	}
}