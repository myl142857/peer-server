// Generated by CoffeeScript 1.6.3
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.ClientServer = (function() {
    function ClientServer(options) {
      this.onDBChange = __bind(this.onDBChange, this);
      this.removePeerFromClientBrowserResourceRequests = __bind(this.removePeerFromClientBrowserResourceRequests, this);
      this.onResourceChange = __bind(this.onResourceChange, this);
      this.recordResourceRequest = __bind(this.recordResourceRequest, this);
      this.getContentsForPath = __bind(this.getContentsForPath, this);
      this.parsePath = __bind(this.parsePath, this);
      this.serveFile = __bind(this.serveFile, this);
      this.sendFailure = __bind(this.sendFailure, this);
      this.sendEventTo = __bind(this.sendEventTo, this);
      this.setUpReceiveEventCallbacks = __bind(this.setUpReceiveEventCallbacks, this);
      this.channelConnectionOnData = __bind(this.channelConnectionOnData, this);
      this.channelOnConnectionClose = __bind(this.channelOnConnectionClose, this);
      this.channelOnConnection = __bind(this.channelOnConnection, this);
      this.readDesiredServerIDFromURL = __bind(this.readDesiredServerIDFromURL, this);
      this.channelOnInvalidID = __bind(this.channelOnInvalidID, this);
      this.channelOnUnavailableID = __bind(this.channelOnUnavailableID, this);
      this.channelOnReady = __bind(this.channelOnReady, this);
      this.serverFileCollection = options.serverFileCollection;
      this.routeCollection = options.routeCollection;
      this.appView = options.appView;
      this.userDatabase = options.userDatabase;
      this.desiredServerID = this.readDesiredServerIDFromURL();
      this.eventTransmitter = new EventTransmitter();
      this.userSessions = new UserSessions();
      this.dataChannel = new ClientServerDataChannel({
        onConnectionCallback: this.channelOnConnection,
        onDataCallback: this.channelConnectionOnData,
        onReady: this.channelOnReady,
        onConnectionCloseCallback: this.channelOnConnectionClose,
        desiredServerID: this.desiredServerID,
        onUnavailableIDCallback: this.channelOnUnavailableID,
        onInvalidIDCallback: this.channelOnInvalidID
      });
      this.setUpReceiveEventCallbacks();
      this.clientBrowserConnections = {};
      this.isPushChangesEnabled = false;
      if (this.isPushChangesEnabled) {
        this.clientBrowserResourceRequests = {};
        this.serverFileCollection.on("change", this.onResourceChange);
        this.routeCollection.on("change", this.onResourceChange);
        this.userDatabase.on("onDBChange", this.onDBChange);
      }
    }

    ClientServer.prototype.channelOnReady = function() {
      var serverID;
      serverID = this.dataChannel.id;
      this.appView.trigger("setServerID", serverID);
      this.serverFileCollection.initLocalStorage(serverID);
      this.routeCollection.initLocalStorage(serverID);
      return this.userDatabase.initLocalStorage(serverID);
    };

    ClientServer.prototype.channelOnUnavailableID = function() {
      return this.appView.trigger("onUnavailableID", this.desiredServerID);
    };

    ClientServer.prototype.channelOnInvalidID = function() {
      return this.appView.trigger("onInvalidID", this.desiredServerID);
    };

    ClientServer.prototype.readDesiredServerIDFromURL = function() {
      if (/\/server\//.test(location.pathname)) {
        return location.pathname.replace(/\/server\//, "");
      }
      return null;
    };

    ClientServer.prototype.channelOnConnection = function(connection) {
      var contents, foundRoute, landingPage;
      landingPage = this.serverFileCollection.getLandingPage();
      this.clientBrowserConnections[connection.peer] = connection;
      this.userSessions.addSession(connection.peer);
      this.appView.updateConnectionCount(_.size(this.clientBrowserConnections));
      foundRoute = this.routeCollection.findRouteForPath("/index");
      if (foundRoute !== null && foundRoute !== void 0) {
        contents = this.getContentsForPath("/index", {}, foundRoute, connection.peer);
        if (contents && !contents.error) {
          landingPage = {
            fileContents: contents.result,
            filename: "index",
            type: "text/html"
          };
        }
      }
      return this.eventTransmitter.sendEvent(connection, "initialLoad", landingPage);
    };

    ClientServer.prototype.channelOnConnectionClose = function(connection) {
      if (connection && connection.peer) {
        this.userSessions.removeSession(connection.peer);
      }
      if (connection && connection.peer && _.has(this.clientBrowserConnections, connection.peer)) {
        delete this.clientBrowserConnections[connection.peer];
      }
      this.appView.updateConnectionCount(_.size(this.clientBrowserConnections));
      return this.removePeerFromClientBrowserResourceRequests(connection.peer);
    };

    ClientServer.prototype.channelConnectionOnData = function(data) {
      return this.eventTransmitter.receiveEvent(data);
    };

    ClientServer.prototype.setUpReceiveEventCallbacks = function() {
      return this.eventTransmitter.addEventCallback("requestFile", this.serveFile);
    };

    ClientServer.prototype.sendEventTo = function(socketId, eventName, data) {
      var connection;
      connection = this.clientBrowserConnections[socketId];
      return this.eventTransmitter.sendEvent(connection, eventName, data);
    };

    ClientServer.prototype.sendFailure = function(data, errorMessage) {
      var page404, response;
      if (data.type === "ajax") {
        response = {
          fileContents: "",
          type: data.type,
          textStatus: "error",
          errorThrown: errorMessage,
          requestId: data.requestId
        };
      } else {
        page404 = this.serverFileCollection.get404Page();
        response = {
          filename: page404.filename,
          fileContents: page404.fileContents,
          fileType: page404.type,
          type: data.type,
          errorMessage: errorMessage
        };
      }
      return this.sendEventTo(data.socketId, "receiveFile", response);
    };

    ClientServer.prototype.serveFile = function(data) {
      var contents, extraParams, fileType, foundRoute, foundServerFile, name, paramData, path, rawPath, response, slashedPath, val, _ref;
      rawPath = data.filename || "";
      if (_.isObject(rawPath)) {
        rawPath = rawPath.url;
      }
      _ref = this.parsePath(rawPath), path = _ref[0], paramData = _ref[1];
      if (data.options && data.options.data) {
        if (typeof data.options.data === "string") {
          extraParams = URI.parseQuery(paramData);
        } else {
          extraParams = data.options.data;
        }
        for (name in extraParams) {
          val = extraParams[name];
          paramData[name] = val;
        }
      }
      slashedPath = "/" + path;
      foundRoute = this.routeCollection.findRouteForPath(slashedPath);
      foundServerFile = this.serverFileCollection.findWhere({
        name: path,
        isProductionVersion: true
      });
      if ((foundRoute === null || foundRoute === void 0) && !this.serverFileCollection.hasProductionFile(path)) {
        console.error("Error: Client requested " + rawPath + " which does not exist on server.");
        this.sendFailure(data, "Not found");
        return;
      }
      if (foundRoute === null || foundRoute === void 0) {
        fileType = this.serverFileCollection.getFileType(path);
      } else {
        fileType = "UNKNOWN";
      }
      contents = this.getContentsForPath(path, paramData, foundRoute, data.socketId);
      if (!contents || contents.error) {
        console.error("Error: Function evaluation for  " + rawPath + " generated an error, returning 404: " + contents.error);
        this.sendFailure(data, "Internal server error");
        return;
      }
      response = {
        filename: rawPath,
        fileContents: contents.result,
        type: data.type,
        fileType: fileType
      };
      if (data.type === "ajax") {
        response.requestId = data.requestId;
      } else {
        this.recordResourceRequest(data.socketId, data, foundServerFile, foundRoute);
      }
      return this.sendEventTo(data.socketId, "receiveFile", response);
    };

    ClientServer.prototype.parsePath = function(fullPath) {
      var params, pathDetails;
      if (!fullPath || fullPath === "") {
        return ["", {}];
      }
      pathDetails = URI.parse(fullPath);
      params = URI.parseQuery(pathDetails.query);
      return [pathDetails.path, params];
    };

    ClientServer.prototype.getContentsForPath = function(path, paramData, foundRoute, socketId) {
      var match, runRoute, slashedPath;
      if (foundRoute === null || foundRoute === void 0) {
        return {
          "result": this.serverFileCollection.getContents(path)
        };
      }
      slashedPath = "/" + path;
      match = slashedPath.match(foundRoute.pathRegex);
      runRoute = foundRoute.getExecutableFunction(paramData, match.slice(1), this.serverFileCollection.getContents, this.userDatabase.database, this.userSessions.getSession(socketId));
      return runRoute();
    };

    ClientServer.prototype.recordResourceRequest = function(peerID, data, foundServerFile, foundRoute) {
      var resource, resourceName;
      if (!this.isPushChangesEnabled) {
        return;
      }
      if (!((foundServerFile && foundServerFile.get("fileType") === ServerFile.fileTypeEnum.HTML) || foundRoute)) {
        return;
      }
      resource = null;
      if (foundServerFile) {
        resource = foundServerFile;
      } else if (foundRoute) {
        resource = foundRoute;
      }
      if (!resource) {
        return;
      }
      resourceName = resource.get("name");
      this.removePeerFromClientBrowserResourceRequests(peerID);
      if (!this.clientBrowserResourceRequests[resourceName]) {
        this.clientBrowserResourceRequests[resourceName] = [];
      }
      return this.clientBrowserResourceRequests[resourceName].push({
        peerID: peerID,
        data: data
      });
    };

    ClientServer.prototype.onResourceChange = function(resource) {
      var interestedPeers,
        _this = this;
      if (!this.isPushChangesEnabled) {
        return;
      }
      if (!resource.get("isProductionVersion")) {
        return;
      }
      interestedPeers = this.clientBrowserResourceRequests[resource.get("name")];
      return _.each(interestedPeers, function(interestedPeer) {
        return _this.serveFile(interestedPeer.data);
      });
    };

    ClientServer.prototype.removePeerFromClientBrowserResourceRequests = function(peerID) {
      var resourceNames,
        _this = this;
      if (!this.isPushChangesEnabled) {
        return;
      }
      resourceNames = _.keys(this.clientBrowserResourceRequests);
      return _.each(resourceNames, function(resourceName) {
        return _this.clientBrowserResourceRequests[resourceName] = _.filter(_this.clientBrowserResourceRequests[resourceName], function(interestedPeer) {
          return interestedPeer.peerID !== peerID;
        });
      });
    };

    ClientServer.prototype.onDBChange = function() {
      var resourceNames,
        _this = this;
      if (!this.isPushChangesEnabled) {
        return;
      }
      resourceNames = _.keys(this.clientBrowserResourceRequests);
      return _.each(resourceNames, function(resourceName) {
        var interestedPeers, route;
        route = _this.routeCollection.findWhere({
          name: resourceName,
          isProductionVersion: true
        });
        if (route && /database\.insert\(|database\(.*?\)\.remove\(|database\(.*?\)\.update\(/.test(route.get("routeCode"))) {
          return;
        }
        interestedPeers = _this.clientBrowserResourceRequests[resourceName];
        return _.each(interestedPeers, function(interestedPeer) {
          return _this.serveFile(interestedPeer.data);
        });
      });
    };

    return ClientServer;

  })();

}).call(this);
