class window.RouteCollection extends Backbone.Collection
  model: Route

  localStorage: new Backbone.LocalStorage("RouteCollection")
  
  initialize: (options) ->
    @fetch()

  comparator: (route) =>
    return route.get("routePath")

  findRouteForPath: (routePath) =>
    matchedRoute = @find (route) =>
      if routePath.match(route.pathRegex)
        console.log "matched path: " + routePath + " with " + route.routePath

      return route.get("isProductionVersion") and
        routePath.match(route.pathRegex) isnt null

    return matchedRoute

  getRouteCode: (routePath) =>
    return @findWhere(routePath: routePath).get("routeCode")

  createProductionVersion: =>
    productionFiles = @where(isProductionVersion: true)
    _.each productionFiles, (route) =>
      route.destroy()

    developmentFiles = @where(isProductionVersion: false)
    _.each developmentFiles, (route) =>
      attrs = _.clone(route.attributes)
      attrs.id = null
      copy = new Route(attrs)
      copy.set("isProductionVersion", true)
      @add(copy)
      copy.save()
