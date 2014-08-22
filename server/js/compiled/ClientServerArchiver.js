// Generated by CoffeeScript 1.6.3
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.ClientServerArchiver = (function() {
    function ClientServerArchiver(params) {
      this.archive = __bind(this.archive, this);
      this.serverName = params.serverName;
      this.serverFileCollection = params.serverFileCollection;
      this.routeCollection = params.routeCollection;
      this.userDatabase = params.userDatabase;
      this.button = params.button;
      this.button.click(this.archive);
    }

    ClientServerArchiver.prototype.archive = function() {
      var $anchor, anchor, blob, developmentFolder, productionFolder, zip,
        _this = this;
      zip = new JSZip();
      productionFolder = zip.folder("live_version");
      developmentFolder = zip.folder("edited_version");
      this.serverFileCollection.each(function(serverFile) {
        var ext, filename, folder, imageData;
        if (serverFile.get("isProductionVersion")) {
          folder = productionFolder;
        } else {
          folder = developmentFolder;
        }
        filename = serverFile.get("name");
        ext = ServerFile.fileTypeToFileExt[serverFile.get("fileType")] || "";
        if (ext !== "" && filename.match("\." + ext + "$") === null) {
          filename += "." + ext;
        }
        if (serverFile.get("fileType") === ServerFile.fileTypeEnum.IMG) {
          imageData = serverFile.get("contents").replace(/data:image\/.*?;base64,/, "");
          return folder.file(filename, imageData, {
            base64: true
          });
        } else {
          return folder.file(filename, serverFile.get("contents"));
        }
      });
      this.routeCollection.each(function(route) {
        var contents, folder;
        if (route.get("isProductionVersion")) {
          folder = productionFolder;
        } else {
          folder = developmentFolder;
        }
        contents = {};
        contents.routePath = route.get("routePath");
        contents.routeCode = route.get("routeCode");
        return folder.file(route.get("name") + ".route.js", JSON.stringify(contents, null, " "));
      });
      zip.file("database.db", this.userDatabase.toString());
      blob = zip.generate({
        type: "blob"
      });
      anchor = document.createElement("a");
      anchor.href = window.URL.createObjectURL(blob);
      anchor.download = "" + this.serverName + ".zip";
      $anchor = $(anchor);
      $anchor.hide();
      $("body").append($anchor);
      anchor.click();
      return $anchor.remove();
    };

    return ClientServerArchiver;

  })();

}).call(this);