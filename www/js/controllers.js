angular.module("messenger.controllers", [])
  .controller("chatsController", ["$scope", "xmpp", "$ionicPopup", function($scope, xmpp, $ionicPopup) {
    Friends = [];
    xmpp.on(xmpp.ev.FRIEND_REQUEST, function(el) {
      $ionicPopup.show({
        title: el.from + "请求加为好友",
        buttons: [{
          text: "拒绝",
          onTap: function(e) {
            xmpp.processingrequest(el.from, false);
          }
        }, {
          text: "<b>接受</b>",
          type: "button-assertive",
          onTap: function(e) {
            xmpp.processingrequest(el.from, true);
          }
        }]
      });
    })
  }])
  .controller("loginController", ["$scope", "$state", "$ionicLoading", "xmpp", function($scope, $state, $ionicLoading, xmpp) {
    $scope.submit = function(u, p) {
      xmpp.join(u, p).then(
        function(success) {
          console.log(success);
          $state.go("chats.friends");
          $ionicLoading.hide();
        },
        function(fail) {
          console.log(fail);
          $ionicLoading.hide();
        },
        function(notify) {
          console.log(notify);
          $ionicLoading.show({
            template: "<ion-spinner icon=\"dots\"></ion-spinner>" + notify
          });
        });
    };
  }]).controller("friendsController", ["$scope", "$state", "$ionicPopup", "xmpp", function($scope, $state, $ionicPopup, xmpp) {
    $scope.Status = {
      name: "在线",
      change: {}
    };
    $scope.onlinestatus = xmpp.onlinestatus;
    $scope.$on("$ionicView.enter", function() {
      xmpp.pullfriends().then(function(_items) {
        $scope.items = Friends;
      });
      xmpp.on(xmpp.ev.FRIEND_CHANGE, function() {
        // navigator.notification.beep(0);
        if (!$scope.$$phase) {
          $scope.$apply(function() {
            $scope.items = Friends;
          });
        }
      });
      $scope.add = function(jid) {
        console.log(jid);
        xmpp.addfriend(jid);
      };
      $scope.changeStatus = function() {
        $ionicPopup.show({
          title: "改变在线状态",
          template: '<ion-radio ng-repeat="d in onlinestatus" ng-model="Status.change" ng-value="d">{{d.name}}</ion-radio>',
          scope: $scope,
          buttons: [{
            text: "取消"
          }, {
            text: "确定",
            type: "button-positive"
          }]
        }).then(function(res) {
          if ($scope.Status !== $scope.Status.change.name) {
            xmpp.changestatus($scope.Status.change);
            $scope.Status.name = $scope.Status.change.name;
          }
        });
      }
      $scope.remove = function(jid, name) {
        $ionicPopup.show({
          title: "确定要删除联系人[" + name + "]？",
          buttons: [{
            text: "取消"
          }, {
            text: "确定",
            type: "button-assertive",
            onTap: function(e) {
              xmpp.remove(jid);
            }
          }]
        });
      };
      $scope.out = function() {
        xmpp.off();
        $state.go("login");
      }
    });
  }]).controller("communicatingController", ["$scope", "$state", "$stateParams", "$ionicScrollDelegate", "xmpp", function($scope, $state, $stateParams, $ionicScrollDelegate, xmpp) {
    $scope.$on("$ionicView.enter", function() {
      $scope.title = $stateParams.title || "陌生人";
      $scope.items = Friends.getMsg($stateParams.name);
      xmpp.on(xmpp.ev.MESSAGE, function(el) {
        if (!$scope.$$phase) {
          $scope.$apply(function() {
            $scope.items = Friends.getMsg($stateParams.name);
          });
        }
        $ionicScrollDelegate.$getByHandle("mainScroll").scrollBottom();
      });
      $scope.send = function(text) {
        xmpp.send($stateParams.name, text);
      };
    });
  }]);
