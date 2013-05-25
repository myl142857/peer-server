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
      this.serveFile = __bind(this.serveFile, this);
      this.sendEventTo = __bind(this.sendEventTo, this);
      this.setUpReceiveEventCallbacks = __bind(this.setUpReceiveEventCallbacks, this);
      this.channelConnectionOnData = __bind(this.channelConnectionOnData, this);
      this.channelOnConnection = __bind(this.channelOnConnection, this);
      this.channelOnReady = __bind(this.channelOnReady, this);
      this.eventTransmitter = new EventTransmitter();
      this.dataChannel = new ClientServerDataChannel(this.channelOnConnection, this.channelConnectionOnData, this.channelOnReady);
      this.setUpReceiveEventCallbacks();
      this.clientBrowserConnections = {};
    }

    ClientServer.prototype.channelOnReady = function() {
      return this.appView.trigger("setServerID", this.dataChannel.id);
    };

    ClientServer.prototype.channelOnConnection = function(connection) {
      var landingPage;

      landingPage = this.serverFileCollection.getLandingPage();
      this.clientBrowserConnections[connection.peer] = connection;
      return this.eventTransmitter.sendEvent(connection, "initialLoad", landingPage);
    };

    ClientServer.prototype.channelConnectionOnData = function(data) {
      return this.eventTransmitter.receiveEvent(data);
    };

    ClientServer.prototype.setUpReceiveEventCallbacks = function() {
      this.eventTransmitter.addEventCallback("requestFile", this.serveFile);
      return this.eventTransmitter.addEventCallback("requestAjax", this.serveAjax);
    };

    ClientServer.prototype.sendEventTo = function(socketId, eventName, data) {
      var connection;

      connection = this.clientBrowserConnections[socketId];
      return this.eventTransmitter.sendEvent(connection, eventName, data);
    };

    ClientServer.prototype.serveFile = function(data) {
      var fileType, foundRoute, page404, paramData, path, rawPath, slashedPath, _ref;

      console.log("FILENAME: " + data.filename);
      rawPath = data.filename || "";
      _ref = this.parsePath(rawPath), path = _ref[0], paramData = _ref[1];
      console.log("Parsed path: " + path);
      console.log("PARAMS: ");
      console.log(paramData);
      slashedPath = "/" + path;
      foundRoute = this.routeCollection.findRouteForPath(slashedPath);
      console.log("FOUND ROUTE: ");
      console.log(foundRoute);
      if (foundRoute === null && !this.serverFileCollection.hasProductionFile(path)) {
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
      fileType = foundRoute === null ? this.serverFileCollection.getFileType(path) : "DYNAMIC";
      return this.sendEventTo(data.socketId, "receiveFile", {
        filename: rawPath,
        fileContents: this.getContentsForPath(path, paramData, foundRoute),
        type: data.type,
        fileType: fileType
      });
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

    ClientServer.prototype.getContentsForPath = function(path, paramData, foundRoute) {
      var match, runRoute, slashedPath;

      if (foundRoute !== null) {
        slashedPath = "/" + path;
        console.log("getting contents for path! ");
        console.log(foundRoute.paramNames);
        match = slashedPath.match(foundRoute.pathRegex);
        console.log("Matching given path " + slashedPath);
        console.log("with found path " + foundRoute.get("routePath"));
        console.log("and results are: " + match);
        runRoute = foundRoute.getExecutableFunction(paramData, match.slice(1), this.serverFileCollection);
        return runRoute();
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
