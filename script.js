$(document).ready(function() {
  var chat_history = [];
  var chats = [];
  var chat_history_current_key = "";
  var open_ai_key = localStorage.getItem('open-ai-key');

  $("#clear-chat").click(function() {
    $("#chatbox").empty();
    chat_history = [];
    localStorage.setItem(chat_history_current_key, JSON.stringify(chat_history));
  });

  $("#new-chat").click(function() {
    $("#chatbox").empty();
    chat_history = [];

    var current_timetamp = new Date().getTime();
    var key = "chat_history_" + current_timetamp;
    chat_history_current_key = key;

    var title = 'New Chat';
    $("#chat-list").prepend("<li class='list-group-item list-group-item-dark' data-chat-id='" + key + "'>" + title + "</li>");

    chats.push({
      "title": title,
      "key": key
    });

    localStorage.setItem('chats', JSON.stringify(chats));
    localStorage.setItem(key, JSON.stringify(chat_history));
    $("#chat-list li").first().click();
  });

  $("#chat-list").on('click', 'li', function() {
    var key = $(this).attr('data-chat-id');
    $(this).addClass('active').siblings().removeClass('active');
    chat_history_current_key = key;

    chat_history = JSON.parse(localStorage.getItem(key));
    $("#chatbox").empty();
    for(var i = 0; i < chat_history.length; i++) {
      if(chat_history[i].role == "user") {
        $("#chatbox").append("<p class='user-input'>" + chat_history[i].content + "</p>");
      } else {
        $("#chatbox").append("<p class='ai-output'>" + chat_history[i].content.replaceAll("\n","<br>").replaceAll(" ", "&nbsp") + "</p>");
      }
    }
  });

  $("#submit").click(function() {
    var userInput =  $("#user-input").val();
    console.log(userInput);
    $("#chatbox").append("<p class='user-input'>" + userInput + "</p>");
    $("#user-input").val("");

    chat_history.push({
      "role": "user",
      "content": userInput
    });
    localStorage.setItem(chat_history_current_key, JSON.stringify(chat_history));

    if($("#chat-list li.active").text() == "New Chat") {
      var local_chats = JSON.parse(localStorage.getItem('chats'));
      selected_chat_index = local_chats.findIndex(chat => chat.key === chat_history_current_key)
      selected_chat = local_chats[selected_chat_index];
      local_chats.splice(selected_chat_index, 1);
      selected_chat.title = userInput;

      local_chats.splice(selected_chat_index, 0, selected_chat);
      localStorage.setItem('chats', JSON.stringify(local_chats));  
      $("#chat-list li.active").text(userInput);
    }

    var data = {
      "model": "gpt-3.5-turbo",
      "messages": chat_history
    }

    $.ajax({
      method: 'POST',
      url: "https://api.openai.com/v1/chat/completions",
      data: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + open_ai_key
      },
      success: function(data, status) {
        console.log(data);
        var response = data.choices[0].message.content;
        console.log(response);

        chat_history.push({
          "role": "assistant",
          "content": response
        });
        localStorage.setItem(chat_history_current_key, JSON.stringify(chat_history));
        $("#chatbox").append("<p class='ai-output'>" + response.replaceAll("\n","<br>").replaceAll(" ", "&nbsp") + "</p>");
      }
    })
  })

  $("#setting-save-button").click(function() {
    var key = $("#open-ai-key").val();
    open_ai_key = key;
    localStorage.setItem('open-ai-key', key);
    $("#setting-close-button").click();
  })

  chats = localStorage.getItem('chats');

  if(chats == null) {
    chats = [];
    $("#new-chat").click();
  } else {
    chats = JSON.parse(localStorage.getItem('chats'));
    for(var i = 0; i < chats.length; i++) {
      var title = chats[i].title || 'New Chat';
      $("#chat-list").prepend("<li class='list-group-item list-group-item-dark' data-chat-id='" + chats[i].key + "'>" + title + "</li>");
    }
  }

  $("#chat-list li").first().click();

  if(open_ai_key == null) {
    $("#setting").click();
  }
})
