/**
 * jid,name,show,status,subscribe
 */
Friend = function(args) {
  this.jid;
  this.name;
  this.show;
  this.status;
  this.subscribe;
  this.messages = [];
  this.isRead = false;
  if (args.jid !== undefined && args.jid !== null) {
    this.jid = args.jid;
  }
  if (args.name !== undefined && args.name !== null) {
    this.name = args.name;
  }
  if (args.show !== undefined && args.show !== null) {
    this.show = args.show;
  }
  if (args.status !== undefined && args.status !== null) {
    this.status = args.status;
  }
  if (args.subscribe !== undefined && args.subscribe !== null) {
    this.subscribe = args.subscribe;
  }
  if (args.messages !== undefined && args.messages !== null) {
    this.messages = args.messages;
  }
}
JID = null;
Friends = [];
Array.prototype.me = "";
Array.prototype.remove = function(jid) {
  for (var i = 0; i < this.length; i++) {
    if (this[i].jid === jid) {
      for (var j = i; j < this.length - 1; j++) {
        this[j] = this[j + 1];
      }
      this.length--;
      break;
    }
  }
};
Array.prototype.appendMsg = function(jid, msg) {
  for (var i = 0; i < this.length; i++) {
    if (this[i].jid === jid) {
      this[i].isRead = false;
      this[i].messages[this[i].messages.length] = msg;
      break;
    }
  }
  for (var i = 0; i < this.length; i++) {
    console.log(this[i]);
  }
}
Array.prototype.newMsg = function(jid) {
  for (var i = 0; i < this.length; i++) {
    if (this[i].jid === jid) {
      return this[i].isRead;
    }
  }
}
Array.prototype.getMsg = function(jid) {
  for (var i = 0; i < this.length; i++) {
    if (this[i].jid === jid) {
      this[i].isRead = true;
      return this[i].messages;
    }
  }
}
Array.prototype.modifyOrAdd = function(model) {
  if (JID !== model.jid && model.jid !== undefined && model.jid !== null) {
    var len = -1;
    for (var i = 0; i < this.length; i++) {
      if (this[i].jid === model.jid) {
        len = i;
        if (model.name !== undefined && model.name !== null) {
          this[i].name = model.name;
        } else if (this[i].name === undefined || this[i].name === null || this[i].name.length === 0) {
          try {
            this[i].name = model.jid.split("@")[0];
          } catch (e) {
            this[i].name = model.jid
          }
        }
        if (model.show !== undefined && model.show !== null) {
          this[i].show = model.show;
        }
        if (model.status !== undefined && model.status !== null) {
          this[i].status = model.status;
        }
        if (model.subscribe !== undefined && model.subscribe !== null) {
          this[i].subscribe = model.subscribe;
        }
      }
    }
    if (len === -1 && model.jid !== null) {
      this[this.length] = model;
    }
  }
};
