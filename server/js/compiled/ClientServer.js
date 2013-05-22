// Generated by CoffeeScript 1.6.2
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.ClientServer = (function() {
    function ClientServer(serverFileCollection, routeCollection, appView) {
      this.serverFileCollection = serverFileCollection;
      this.routeCollection = routeCollection;
      this.appView = appView;
      this.evalDynamic = __bind(this.evalDynamic, this);
      this.getContentsForPath = __bind(this.getContentsForPath, this);
      this.parsePath = __bind(this.parsePath, this);
      this.serveAjax = __bind(this.serveAjax, this);
      this.serveFile = __bind(this.serveFile, this);
      this.sendEventTo = __bind(this.sendEventTo, this);
      this.setUpReceiveEventCallbacks = __bind(this.setUpReceiveEventCallbacks, this);
      this.channelOnMessage = __bind(this.channelOnMessage, this);
      this.channelOnOpen = __bind(this.channelOnOpen, this);
      this.channelOnReady = __bind(this.channelOnReady, this);
      this.eventTransmitter = new EventTransmitter();
      this.dataChannel = new ClientServerDataChannel(this.channelOnOpen, this.channelOnMessage, this.channelOnReady);
      this.setUpReceiveEventCallbacks();
    }

    ClientServer.prototype.channelOnReady = function() {
      return this.appView.trigger("setServerID", this.dataChannel.id);
    };

    ClientServer.prototype.channelOnOpen = function() {
      var landingPage;

      console.log("channelOnOpen");
      landingPage = this.serverFileCollection.getLandingPage();
      return this.eventTransmitter.sendEvent(this.dataChannel, "initialLoad", landingPage);
    };

    ClientServer.prototype.channelOnMessage = function(message) {
      console.log("channelOnMessage", message);
      return this.eventTransmitter.receiveEvent(message);
    };

    ClientServer.prototype.setUpReceiveEventCallbacks = function() {
      this.eventTransmitter.addEventCallback("requestFile", this.serveFile);
      return this.eventTransmitter.addEventCallback("requestAjax", this.serveAjax);
    };

    ClientServer.prototype.sendEventTo = function(userID, eventName, data) {
      return this.eventTransmitter.sendEvent(this.dataChannel.getChannelByUserID(userID), eventName, data);
    };

    ClientServer.prototype.serveFile = function(data) {
      var page404, paramData, path, rawPath, route, _ref;

      console.log("FILENAME: " + data.filename);
      rawPath = data.filename || "";
      _ref = this.parsePath(rawPath), path = _ref[0], paramData = _ref[1];
      console.log("Parsed path: " + path);
      console.log("PARAMS: ");
      console.log(paramData);
      route = "/" + path;
      if (!this.serverFileCollection.hasProductionFile(path) && !this.routeCollection.hasRoute(route)) {
        page404 = this.serverFileCollection.get404Page();
        console.error("Error: Client requested " + rawPath + " which does not exist on server.");
        this.sendEventTo(data.socketId, "receiveFile", {
          filename: page404.filename,
          fileContents: page404.fileContents,
          fileType: page404.type,
          type: data.type
        });
        return;
      }
      return this.sendEventTo(data.socketId, "receiveFile", {
        filename: rawPath,
        fileContents: this.getContentsForPath(path, paramData),
        type: data.type,
        fileType: this.serverFileCollection.getFileType(path)
      });
    };

    ClientServer.prototype.serveAjax = function(data) {
      var paramData, path, response, route;

      console.log("Got an ajax request");
      console.log(data);
      if (!('path' in data)) {
        console.log("Received bad ajax request: no path requested");
        return;
      }
      path = data['path'] || "";
      paramData = data.options.data;
      if (typeof paramData === "string") {
        paramData = URI.parseQuery(paramData);
      }
      console.log(paramData);
      route = "/" + path;
      if (!this.serverFileCollection.hasProductionFile(path) && !this.routeCollection.hasRoute(route)) {
        console.log("Path not found");
        return;
      }
      response = {};
      if ('requestId' in data) {
        response['requestId'] = data['requestId'];
      }
      response['path'] = path;
      response['contents'] = this.getContentsForPath(path, paramData);
      console.log("Transmitting ajax response");
      console.log(response);
      return this.sendEventTo(data.socketId, "receiveAjax", response);
    };

    ClientServer.prototype.parsePath = function(fullPath) {
      var params, pathDetails;

      if (!fullPath || fullPath === "") {
        return ["", {}];
      }
      pathDetails = URI.parse(fullPath);
      params = URI.parseQuery(pathDetails.query);
      console.log(params);
      return [pathDetails.path, params];
    };

    ClientServer.prototype.getContentsForPath = function(path, paramData) {
      var results, route, runRoute,
        _this = this;

      route = "/" + path;
      if (this.routeCollection.hasRoute(route)) {
        results = runRoute = function() {
          var params, serverFileCollection;

          serverFileCollection = _this.serverFileCollection;
          params = paramData;
          return eval(_this.routeCollection.getRouteCode(route));
        };
        return runRoute();
      }
      if (this.serverFileCollection.isDynamic(path)) {
        return this.evalDynamic(this.serverFileCollection.getContents(path));
      }
      return this.serverFileCollection.getContents(path);
    };

    ClientServer.prototype.evalDynamic = function(js) {
      var exe,
        _this = this;

      console.log("evalDynamic");
      exe = function() {
        return eval(js);
      };
      return exe();
    };

    return ClientServer;

  })();

}).call(this);

/*
//@ sourceMappingURL=ClientServer.map
*/
