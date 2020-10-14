var open_web_sockets={},base_reconnect_interval=2;function openWebSocket(e,o){open_web_sockets[e]||doSendAPIRequest({command:"get_push_info",username:e},function(n){if(n.url){var c=new WebSocket(n.url+"?pt_blocker="+clientID);open_web_sockets[e]=c,c.onopen=function(){logger({data:"Socket connection opened for "+e,consoleFunction:console.log}),base_reconnect_interval=2},c.onmessage=function(e){logger({data:"Received socket message "+e.data+" at "+Date(),consoleFunction:console.log});try{var n=JSON.parse(e.data);n.pt===clientID?logger({data:"  ignoring "+e.event+" event from self",consoleFunction:console.log}):o(n)}catch(e){logger({data:"message data invalid.",consoleFunction:console.error})}},c.onclose=function(n){logger({data:"Lost socket connection for "+e+" at "+Date(),consoleFunction:console.log}),delete open_web_sockets[e],4e3!==n.code&&"CLOSE_LOGOUT"!==n.reason&&reconnectWebSocket(e,o)}}else reconnectWebSocket(e,o)})}function reconnectWebSocket(e,o){if(bg.get("isLoggedIn")){var n=base_reconnect_interval<5?5:1,c=base_reconnect_interval*(1+Math.random()*n);logger({data:"reconnecting in "+c.toFixed(2)+" seconds.",consoleFunction:console.log}),setTimeout(function(){openWebSocket(e,o),base_reconnect_interval<512&&(base_reconnect_interval*=2)},1e3*c)}}function closeWebSocket(e){open_web_sockets[e]&&open_web_sockets[e].close(4e3,"CLOSE_LOGOUT")}