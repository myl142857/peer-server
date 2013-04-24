// Generated by CoffeeScript 1.6.2
(function() {
  " \nWebRTC handler for clientServer. \n\n(TODO at some point refactor)";
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.WebRTC = (function() {
    function WebRTC(fileStore, portalElem) {
      var _this = this;

      this.fileStore = fileStore;
      this.serveFile = __bind(this.serveFile, this);
      this.setUpReceiveEventCallbacks = __bind(this.setUpReceiveEventCallbacks, this);
      this.sendEventTo = __bind(this.sendEventTo, this);
      this.sendEvent = __bind(this.sendEvent, this);
      this.receiveICECandidate = __bind(this.receiveICECandidate, this);
      this.receiveOffer = __bind(this.receiveOffer, this);
      this.addBrowserConnection = __bind(this.addBrowserConnection, this);
      this.getSocketId = __bind(this.getSocketId, this);
      this.browserConnections = {};
      this.dataChannels = {};
      this.eventTransmitter = new window.EventTransmitter();
      this.setUpReceiveEventCallbacks();
      this.serverUserPortal = new window.ServerUserPortal(portalElem, this.fileStore);
      this.connection = io.connect("http://localhost:8890");
      this.connection.emit("joinAsClientServer");
      this.connection.on("joined", this.addBrowserConnection);
      this.connection.on("receiveOffer", this.receiveOffer);
      this.connection.on("receiveICECandidate", this.receiveICECandidate);
      this.connection.on("setSocketId", function(socketId) {
        return _this.socketId = socketId;
      });
    }

    WebRTC.prototype.getSocketId = function() {
      return this.socketId;
    };

    WebRTC.prototype.addDataChannel = function(socketID, channel) {
      var _this = this;

      console.log("adding data channel");
      channel.onopen = function() {
        var landingPage;

        console.log("data stream open " + socketID);
        landingPage = _this.serverUserPortal.getLandingPage();
        return channel.send(JSON.stringify({
          "eventName": "initialLoad",
          "data": landingPage
        }));
      };
      channel.onclose = function(event) {
        delete _this.dataChannels[socketID];
        return console.log("data stream close " + socketID);
      };
      channel.onmessage = function(message) {
        console.log("data stream message " + socketID);
        console.log(message);
        return _this.eventTransmitter.receiveEvent(message.data);
      };
      channel.onerror = function(err) {
        return console.log("data stream error " + socketID + ": " + err);
      };
      return this.dataChannels[socketID] = channel;
    };

    WebRTC.prototype.addBrowserConnection = function(socketID) {
      var peerConnection,
        _this = this;

      peerConnection = new mozRTCPeerConnection(null, {
        "optional": [
          {
            "RtpDataChannels": true
          }
        ]
      });
      this.browserConnections[socketID] = peerConnection;
      peerConnection.onicecandidate = function(event) {
        return _this.connection.emit("sendICECandidate", socketID, event.candidate);
      };
      peerConnection.ondatachannel = function(evt) {
        console.log("data channel connecting " + socketID);
        return _this.addDataChannel(socketID, evt.channel);
      };
      return console.log("client joined", socketID);
    };

    WebRTC.prototype.receiveOffer = function(socketID, sdp) {
      var pc;

      console.log("offer received from " + socketID);
      pc = this.browserConnections[socketID];
      pc.setRemoteDescription(new mozRTCSessionDescription(sdp));
      return this.sendAnswer(socketID);
    };

    WebRTC.prototype.sendAnswer = function(socketID) {
      var pc,
        _this = this;

      pc = this.browserConnections[socketID];
      return pc.createAnswer(function(session_description) {
        pc.setLocalDescription(session_description);
        return _this.connection.emit("sendAnswer", socketID, session_description);
      });
    };

    WebRTC.prototype.receiveICECandidate = function(socketID, candidate) {
      if (candidate) {
        candidate = new mozRTCIceCandidate(candidate);
        console.log(candidate);
        return this.browserConnections[socketID].addIceCandidate(candidate);
      }
    };

    WebRTC.prototype.sendEvent = function(eventName, data) {
      var dataChannel, socketID, _ref, _results;

      _ref = this.dataChannels;
      _results = [];
      for (socketID in _ref) {
        dataChannel = _ref[socketID];
        _results.push(this.eventTransmitter.sendEvent(dataChannel, eventName, data));
      }
      return _results;
    };

    WebRTC.prototype.sendEventTo = function(socketId, eventName, data) {
      return this.eventTransmitter.sendEvent(this.dataChannels[socketId], eventName, data);
    };

    WebRTC.prototype.setUpReceiveEventCallbacks = function() {
      return this.eventTransmitter.addEventCallback("requestFile", this.serveFile);
    };

    WebRTC.prototype.serveFile = function(data) {
      var filename;

      filename = data.filename;
      console.log("FILENAME: " + filename);
      if (!this.fileStore.hasFile(filename)) {
        console.error("Error: Client requested " + filename + " which does not exist on server.");
        this.sendEventTo(data.socketId, "receiveFile", {
          filename: filename,
          fileContents: "",
          type: ""
        });
        return;
      }
      return this.sendEventTo(data.socketId, "receiveFile", {
        filename: filename,
        fileContents: this.fileStore.getFileContents(filename),
        type: data.type
      });
    };

    return WebRTC;

  })();

}).call(this);