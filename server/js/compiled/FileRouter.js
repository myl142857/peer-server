// Generated by CoffeeScript 1.6.2
(function() {
  'Defines the Route model and RouteCollection for handing dynamic paths and \ndefined path parameters.\n\nTODO: there should be verification on the UI-end that only valid Routes are initialized.\nSpecifically: \n  - name should be a valid Javascript function name (nonempty, no invalid characters, no spaces, etc)\n  - routePath should be a valid path (tokens separated by / without invalid characters in the tokens.\n      some of the tokens can be of the form <token> but there shouldn\'t be any other angle-brackets \n      except at the start and end.)';
  var _ref, _ref1,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  window.Route = (function(_super) {
    __extends(Route, _super);

    function Route() {
      this.sanitizePathPart = __bind(this.sanitizePathPart, this);
      this.setParsedPath = __bind(this.setParsedPath, this);
      this.getExecutableFunction = __bind(this.getExecutableFunction, this);      _ref = Route.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Route.prototype.defaults = {
      name: "",
      routePath: "",
      routeCode: "",
      paramNames: [],
      options: {},
      isProductionVersion: false,
      hasBeenEdited: false
    };

    Route.prototype.initialize = function() {
      this.setParsedPath();
      console.log("Parsed route: " + this.get("routePath") + " " + this.pathRegex + " " + this.paramNames);
      return this.on("change:routePath", this.setParsedPath);
    };

    Route.prototype.getExecutableFunction = function(urlParams, dynamicParams, staticFiles) {
      var fcn, paramNames, text,
        _this = this;

      text = "(function " + this.get("name") + "(";
      paramNames = this.get("paramNames");
      text += paramNames.join(", ") + ", params" + ") {";
      text += this.get("routeCode") + "})";
      dynamicParams = _.map(dynamicParams, function(param) {
        return '"' + param + '"';
      });
      console.log("dynamic params: " + dynamicParams);
      text += "(" + dynamicParams.join(",") + ", " + JSON.stringify(urlParams) + ")";
      console.log("Function: " + text);
      fcn = function() {
        staticFiles = staticFiles;
        return eval(text);
      };
      return fcn;
    };

    Route.prototype.setParsedPath = function() {
      var isParamPart, paramNames, part, path, pathParts, regexParts, _i, _len,
        _this = this;

      isParamPart = function(part) {
        return part.length > 2 && part.charAt(0) === "<" && part.charAt(part.length - 1) === ">";
      };
      path = this.get("routePath");
      pathParts = path.split("/");
      paramNames = [];
      regexParts = [];
      if (pathParts.length === 0) {
        return paramNames;
      }
      pathParts[pathParts.length - 1] = this.sanitizePathPart(_.last(pathParts));
      for (_i = 0, _len = pathParts.length; _i < _len; _i++) {
        part = pathParts[_i];
        if (isParamPart(part)) {
          paramNames.push(part.slice(1, -1));
          regexParts.push("([^/]+)");
        } else {
          regexParts.push(part);
        }
      }
      this.pathRegex = "^" + regexParts.join("/") + "/?$";
      return this.set("paramNames", paramNames);
    };

    Route.prototype.sanitizePathPart = function(part) {
      part = part.split("#")[0];
      part = part.split("&")[0];
      return part;
    };

    return Route;

  })(Backbone.Model);

  window.RouteCollection = (function(_super) {
    __extends(RouteCollection, _super);

    function RouteCollection() {
      this.createProductionVersion = __bind(this.createProductionVersion, this);
      this.getRouteCode = __bind(this.getRouteCode, this);
      this.findRouteForPath = __bind(this.findRouteForPath, this);
      this.comparator = __bind(this.comparator, this);      _ref1 = RouteCollection.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    RouteCollection.prototype.model = Route;

    RouteCollection.prototype.localStorage = new Backbone.LocalStorage("RouteCollection");

    RouteCollection.prototype.initialize = function() {
      var indexRoute, indexRouteDev;

      this.fetch();
      indexRoute = new Route({
        name: "testing",
        routePath: "/test/<name>/<x>/<y>",
        routeCode: "var result = parseInt(x)+parseInt(y); return '<h1>hello ' + name + '!</h1><p> x= ' + x + ' plus y = ' + y + ' is ' + result + '</p><h2>' + params.animal + '!!</h2>'",
        isProductionVersion: true
      });
      this.add(indexRoute);
      indexRouteDev = new Route({
        name: "testing",
        routePath: "/test/<name>/<x>/<y>",
        routeCode: "var result = parseInt(x)+parseInt(y); return '<h1>hello ' + name + '!</h1><p> x= ' + x + ' plus y = ' + y + ' is ' + result + '</p><h2>' + params.animal + '!!</h2>'",
        isProductionVersion: false
      });
      return this.add(indexRouteDev);
    };

    RouteCollection.prototype.comparator = function(route) {
      return route.get("routePath");
    };

    RouteCollection.prototype.findRouteForPath = function(routePath) {
      var matchedRoute,
        _this = this;

      matchedRoute = this.find(function(route) {
        return route.get("isProductionVersion") && routePath.match(route.pathRegex) !== null;
      });
      return matchedRoute;
    };

    RouteCollection.prototype.getRouteCode = function(routePath) {
      return this.findWhere({
        routePath: routePath
      }).get("routeCode");
    };

    RouteCollection.prototype.createProductionVersion = function() {
      var developmentFiles, productionFiles,
        _this = this;

      productionFiles = this.where({
        isProductionVersion: true
      });
      _.each(productionFiles, function(route) {
        return route.destroy();
      });
      developmentFiles = this.where({
        isProductionVersion: false
      });
      return _.each(developmentFiles, function(route) {
        var attrs, copy;

        attrs = _.clone(route.attributes);
        attrs.id = null;
        copy = new Route(attrs);
        copy.set("isProductionVersion", true);
        _this.add(copy);
        return copy.save();
      });
    };

    return RouteCollection;

  })(Backbone.Collection);

}).call(this);

/*
//@ sourceMappingURL=FileRouter.map
*/
