// 可以使用谷歌代码触发器每隔一段时间调用这个函数清除没有验证的过期用户
function removePendingUsers() {
    var find = {
        "status": "pending",
    };

    var findString = JSON.stringify(find);
    var members = mongo.get(Const.memberColl, "filter=" + findString);
    for (var i = 0; i < members.length; i++) {
        var member = members[i];

        //based on the gap between now and member join date, we decided whether need to add the kick payload
        var pending_time = Date.now() / 1000 - member.date;
        if (pending_time > member.timeout && member.timeout != 0) {
            // The user will be kicked and ban for 1 minute
            var kickPayload = {
                "method": "kickChatMember",
                "chat_id": member.chat.id,
                "user_id": member.user.id,
                "until_date": Date.now() / 1000 + 60,
            };

            var res = postTelegram(kickPayload);
            if (res.ok) {
                var data = { status: "kicked" };
                var setData = { "$set": data };
                mongo.setOne(Const.memberColl + "/" + member._id.$oid, setData);

                if (member.message) {
                    var deleteAskVerifyPayload = {
                        "method": "deleteMessage",
                        "message_id": member.message.message_id,
                        "chat_id": member.chat.id,
                    };
                    postTelegram(deleteAskVerifyPayload);
                }

            }
        }
    }
}