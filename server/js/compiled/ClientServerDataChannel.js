// Generated by CoffeeScript 1.3.3
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  window.ClientServerDataChannel = (function(_super) {

    __extends(ClientServerDataChannel, _super);

    function ClientServerDataChannel(onOpenCallback, onMessageCallback, onReady) {
      this.onOpenCallback = onOpenCallback;
      this.onMessageCallback = onMessageCallback;
      this.onReady = onReady;
      this.dataChannelReady = __bind(this.dataChannelReady, this);

      ClientServerDataChannel.__super__.constructor.call(this, this.onOpenCallback, this.onMessageCallback);
      this.dataChannel.direction = "one-to-many";
    }

    ClientServerDataChannel.prototype.dataChannelReady = function() {
      this.dataChannel.open(this.id);
      return this.onReady();
    };

    return ClientServerDataChannel;

  })(ClientDataChannel);

}).call(this);
