angular.module("messenger", ["ionic", "messenger.controllers", "messenger.services"])
  .run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })
  .config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    $ionicConfigProvider.scrolling.jsScrolling(false);
    $stateProvider
      .state("chats", {
        url: "/chats",
        abstract: true,
        templateUrl: "templates/chats.html",
        controller: "chatsController"
      })
      .state("chats.friends", {
        url: "/friends",
        views: {
          "chats": {
            templateUrl: "templates/friends.html",
            controller: "friendsController"
          }
        }
      })
      .state("chats.communicating", {
        url: "/communicating?:name&title",
        params: {
          name: null,
          title: null
        },
        views: {
          "chats": {
            templateUrl: "templates/communicating.html",
            controller: "communicatingController"
          }
        }
      })
      .state("login", {
        url: "/login",
        templateUrl: "templates/login.html",
        controller: "loginController"
      });
    $urlRouterProvider.otherwise("/login");
  });
