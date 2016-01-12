angular.module("messenger.services", [])
  .factory("xmpp", ["$q", "$ionicPopup", function($q, $ionicPopup) {
    return XMPP($q);
  }]);
