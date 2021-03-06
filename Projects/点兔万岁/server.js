var apikey = require("./key");
var RongCloudSDK = require("rongcloud-sdk")(apikey);
var express = require("express");
var app = express();
var RongMessage = RongCloudSDK.Message;
var Private = RongMessage.Private;
var RongUser = RongCloudSDK.User;

app.get("/getappkey", (_, res) => res.end(apikey.appkey));
app.get("/gettoken", (_, res) => res.end(getToken()));
app.get("/exit", (req, res) => res.end(onExit(decodeURIComponent(req.query.token))));
app.use(express.static("static"));
app.listen(8080, () => {
    console.log("listening 8080");
});

var queue = [];
var match = [];

var users = [];
for (var i = 0; i < 10; i++) {
    var id = "ttt" + i;
    RongUser.register({
        id: id,
        name: id,
        portrait: "."
    }).then(result => {
        // console.log(result);
        users.push(result);
    }, error => {
        console.log(error);
    });
}

function getToken() {
    for (var i = 0; i < users.length; i++) {
        if (users[i].code > 0) {
            users[i].code = 0;
            queue.push(users[i]);
            console.log(users[i].userId, "enter");
            if (queue.length > 1) {
                var user1 = queue.shift();
                var user2 = queue.shift();
                match.push([user1, user2]);
                sendMessage(user1, "oppo:1:" + user2.userId);
                sendMessage(user2, "oppo:2:" + user1.userId);
                console.log(user1.userId, "<>", user2.userId);
            }
            return JSON.stringify(users[i]);
        }
    }
    return JSON.stringify({
        code: 404,
        userId: "",
        token: ""
    });
}

function sendMessage(user, text) {
    console.log(`向${user.userId}发送${text}`);
    Private.send({
        senderId: "game",
        targetId: user.userId,
        objectName: "RC:TxtMsg",
        content: {
            content: text
        }
    }).then(result => {
        console.log(result);
    }, error => {
        console.log(error);
    });
}

function onExit(token) {
    var index = queue.findIndex(u => u.token == token);
    if (index > -1) {
        console.log("exit", queue[index].userId);
        queue[index].code = 200;
        queue.splice(index, 1);
    } else {
        exitMatch(token);
    }
}

function exitMatch(token) {
    for (var i = 0; i < match.length; i++) {
        if (match[i][0].token == token) {
            sendMessage(match[i][1], "exit", match[i][0].userId, "<>", match[i][1].userId, "end");
            match[i][0].code = 200;
            match.splice(i, 1);
        } else if (match[i][1].token == token) {
            sendMessage(match[i][0], "exit", match[i][0].userId, "<>", match[i][1].userId, "end");
            match[i][1].code = 200;
            match.splice(i, 1);
        }
    }
}
