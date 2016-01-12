/**
 * 通过Strophe扩展的XMPP操作类
 * @class XMPP
 * @constructor
 */
var XMPP = function($q) {
  // var BOSH_SERVICE = "http://192.168.0.61:7070/http-bind/";
  var BOSH_SERVICE = "ws://192.168.0.30:7070/ws/"
  var domain = "@rd";
  var jid = null;
  var me = null;
  var serve = new Strophe.Connection(BOSH_SERVICE);
  /*serve.jingle.ice_config = {
    "iceServers": [{
      "url": "stun:stun.stunprotocol.org:3478"
    }]
  };*/
  var CONNECTION_STATUS = [];
  CONNECTION_STATUS[Strophe.Status.ERROR] = "错误";
  CONNECTION_STATUS[Strophe.Status.CONNFAIL] = "连接失败";
  CONNECTION_STATUS[Strophe.Status.AUTHFAIL] = "认证失败";
  CONNECTION_STATUS[Strophe.Status.DISCONNECTED] = "断开";
  CONNECTION_STATUS[Strophe.Status.DISCONNECTING] = "正在断开";
  CONNECTION_STATUS[Strophe.Status.AUTHENTICATING] = "正在验证";
  CONNECTION_STATUS[Strophe.Status.CONNECTING] = "正在连接";
  CONNECTION_STATUS[Strophe.Status.ATTACHED] = "附加成功";
  CONNECTION_STATUS[Strophe.Status.CONNECTED] = "连接成功";
  var SUBCRIPTION = [];
  SUBCRIPTION["none"] = "无";
  SUBCRIPTION["to"] = "TA还不是你的好友";
  SUBCRIPTION["from"] = "你还不是TA的好友";
  SUBCRIPTION["both"] = "互相订阅";
  var getname = function(jid) {
    return Strophe.getNodeFromJid(jid) || "陌生人";
  }

  function EventHandle() {
    this.events = {};
  }
  EventHandle.prototype.on = function(eventName, callback) {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].push(callback);
  }
  EventHandle.prototype.emit = function(eventName, _) {
    var events = this.events[eventName];
    var args = Array.prototype.slice.call(arguments, 1);
    var i, m;
    if (!events) return;
    for (i = 0, m = events.length; i < m; i++) {
      events[i].apply(null, args);
    }
  };

  function _XMPP() {}
  _XMPP.prototype = new EventHandle();
  _XMPP.prototype.ev = {
    //消息
    MESSAGE: "__on_message__",
    //好友请求
    FRIEND_REQUEST: "__friend_request__",
    //好友列表发生变化
    FRIEND_CHANGE: "__friend_change__"
  };
  _XMPP.prototype.onlinestatus = [{
    name: "在线",
    value: "none"
  }, {
    name: "暂时离开",
    value: "away"
  }, {
    name: "找我聊天",
    value: "chat"
  }, {
    name: "忙碌",
    value: "dnd"
  }, {
    name: "长时间离开",
    value: "xa"
  }];
  /**
   * 登陆到服务器
   * @method join
   * @for XMPP
   * @param {string} u 登陆XMPP服务器的用户名
   * @param {string} p 密码
   * @return {$q}
   */
  _XMPP.prototype.join = function(u, p) {
    var _d = $q.defer();
    var chat = this;
    serve.connect(u + domain, p, function(status) {
      console.debug("[" + new Date() + "]\t" + JSON.stringify(CONNECTION_STATUS[status]));
      if (status == Strophe.Status.CONNECTING || status == Strophe.Status.DISCONNECTING || status == Strophe.Status.AUTHENTICATING) {
        _d.notify(CONNECTION_STATUS[status]);
      } else if (status == Strophe.Status.ATTACHED || status == Strophe.Status.CONNECTED) {
        console.log("serve", serve);

        JID = Strophe.getBareJidFromJid(serve.jid);
        jid = Strophe.getBareJidFromJid(serve.jid);
        // serve.jingle.getStunAndTurnCredentials();
        console.warn("serve", serve._proto.socket);
        serve.xmlInput = function(data) {
          console.debug("[接受消息]", data);
        };
        serve.xmlOutput = function(data) {
          console.debug("[发送消息]", data);
        };
        var aFileParts, filename, mimeFile;
        serve.si_filetransfer.addFileHandler(function(from, sid, filename, size, mime) {
          filename = filename;
          mimeFile = mime;
          console.log(from);
          console.log(sid);
          console.log(filename);
          console.log(size);
          console.log(mime);
        });
        serve.ibb.addIBBHandler(function(type, from, sid, data, seq) {
          switch (type) {
            case "open":
              // new file, only metadata
              aFileParts = [];
              break;
            case "data":
              aFileParts.push(data);
              // data
              break;
            case "close":
              var data = "data:" + mimeFile + ";base64,";
              for (var i = 0; i < aFileParts.length; i++) {
                data += aFileParts[i].split(",")[1];
              }
              console.log("image", data);
              // and we're done
            default:
              throw new Error("shouldn't be here.")
          }
        });
        /**
         * 接收消息
         */
        serve.addHandler(function(data) {
          Strophe.forEachChild(data, "body", function(el) {
            var jid = Strophe.getBareJidFromJid(data.getAttribute("from"));
            Friends.appendMsg(jid, {
              jid: jid,
              name: getname(jid),
              time: data.getAttribute("time") || new Date(),
              message: Strophe.getText(el) || ""
            });
            chat.emit(chat.ev.MESSAGE, null);
            chat.emit(chat.ev.FRIEND_CHANGE, null);
          });
          return true;
        }, null, 'message', null, null, null);
        /**
         * 好友列表发生变化
         */
        serve.addHandler(function(data) {
          console.log("好友列表发生变化", data);
          Strophe.forEachChild(data, "query", function(query) {
            Strophe.forEachChild(query, "item", function(item) {
              if ("remove" === item.getAttribute("subscription") || "none" === item.getAttribute("subscription")) {
                Friends.remove(Strophe.getBareJidFromJid(item.getAttribute("jid")));
              } else {
                console.log(Strophe.getBareJidFromJid(item.getAttribute("jid")));
                Friends.modifyOrAdd(new Friend({
                  jid: Strophe.getBareJidFromJid(item.getAttribute("jid")),
                  subscribe: SUBCRIPTION[item.getAttribute("subscription") || "none"],
                }));
              }
              chat.emit(chat.ev.FRIEND_CHANGE, null);
            });
          });
          return true;
        }, "jabber:iq:roster", "iq", "set", null, null);
        /**
         * 好友请求
         */
        serve.addHandler(function(data) {
          console.log("好友请求", data);
          chat.emit(chat.ev.FRIEND_REQUEST, {
            from: getname(data.getAttribute("from")),
          });
          return true; //必须的
        }, "jabber:client", "presence", "subscribe", null, null); //subscribe为有人请求加好友
        /**
         * 好友更改了状态
         */
        serve.addHandler(function(data) {
          Friends.modifyOrAdd(new Friend({
            jid: Strophe.getBareJidFromJid(data.getAttribute("from")),
            status: Strophe.getText(data.getElementsByTagName("status")[0]) || "",
            show: Strophe.getText(data.getElementsByTagName("show")[0]) || ""
          }));
          chat.emit(chat.ev.FRIEND_CHANGE, null);
          return true; //必须的
        }, "jabber:client", "presence", null, null, null);
        serve.send($pres().tree());
        _d.resolve(CONNECTION_STATUS[status]);
      } else if (status == Strophe.Status.ERROR || status == Strophe.Status.CONNFAIL || status == Strophe.Status.AUTHFAIL) {
        serve.disconnect();
        _d.reject(CONNECTION_STATUS[status]);
      } else if (status == Strophe.Status.DISCONNECTED) {
        _d.reject(CONNECTION_STATUS[status]);
      }
    });
    return _d.promise;
  };
  _XMPP.prototype.off = function() {
    serve.disconnect();
    Friends = [];
  };
  /**
   * 发消息给对方
   * @method send
   * @for XMPP
   * @param {string} user 发送的对象
   * @param {string} resource 发送的内容
   */
  _XMPP.prototype.send = function(user, resource) {
    var chat = this;
    serve.send($msg({
      to: user,
      type: "chat"
    }).cnode(Strophe.xmlElement("body", "", resource)).tree());
    Friends.appendMsg(user, {
      jid: "",
      name: "",
      time: new Date(),
      message: resource
    });
    chat.emit(chat.ev.MESSAGE, null);
  };
  /**
   * 添加好友
   */
  _XMPP.prototype.addfriend = function(jid) {
    console.log("添加好友", $pres({
      id: new Date().getTime(),
      to: jid.indexOf("@") > -1 ? Strophe.getBareJidFromJid(jid) : Strophe.getBareJidFromJid(jid + domain),
      type: "subscribe"
    }).tree());
    serve.send($pres({
      id: new Date().getTime(),
      to: jid.indexOf("@") > -1 ? Strophe.getBareJidFromJid(jid) : Strophe.getBareJidFromJid(jid + domain),
      type: "subscribe"
    }).tree());
  };
  /**
   * 处理好友请求
   */
  _XMPP.prototype.processingrequest = function(jid, result) {
    var chat = this;
    serve.send($pres({
      id: new Date().getTime(),
      to: jid + domain,
      type: result ? "subscribed" : "unsubscribed"
    }).tree());
    if (result) {
      chat.addfriend(jid);
    }
  };
  /**
   * 修改在线状态
   */
  _XMPP.prototype.changestatus = function(status) {
    // <presence xml:lang='en'>
    //   <show>away</show>
    //   <status>I shall return!</status>
    //   <priority>1</priority>
    // </presence>
    var pres = $pres();
    if (status.value !== "none") {
      pres.c("show").t(status.value).up();
    }
    pres.c("status").t(status.name).up();
    pres.c("priority").t(1).up();
    serve.send(pres.tree());
  };
  /**
   * 移除好友
   */
  _XMPP.prototype.remove = function(jid) {
    var chat = this;
    serve.sendIQ($iq({
        type: 'set',
        id: new Date().getTime() + ":sendIQ"
      }).c('query', {
        xmlns: 'jabber:iq:roster'
      }).c("item", {
        jid: jid,
        subscription: "remove"
      }).tree(),
      function(el) {
        Friends.remove(jid);
        chat.emit(chat.ev.FRIEND_CHANGE, null);
      },
      function(fail) {
        console.log(fail);
      }
    );
  };
  /**
   * 拉取好友列表
   */
  _XMPP.prototype.pullfriends = function() {
    var d = $q.defer();
    serve.sendIQ($iq({
        type: 'get',
        id: new Date().getTime() + ":sendIQ"
      }).c('query', {
        xmlns: 'jabber:iq:roster'
      }).tree(),
      function(el) {
        Strophe.forEachChild(el, "query", function(query) {
          Strophe.forEachChild(query, "item", function(item) {
            console.log(item);
            Friends.modifyOrAdd(new Friend({
              jid: Strophe.getBareJidFromJid(item.getAttribute("jid")),
              name: item.getAttribute("name") || getname(item.getAttribute("jid")),
              subscribe: SUBCRIPTION[item.getAttribute("subscription") || "none"],
            }));
          });
        });
        d.resolve(Friends);
      },
      function(error) {
        console.log(error);
        d.reject("error");
      }
    );
    return d.promise;
  }
  return new _XMPP();
};
