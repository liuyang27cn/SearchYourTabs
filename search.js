(function(){

  var searchableContent = {};

  var openTab = function(tabId, content, searchTerm){
    chrome.tabs.update(tabId, {
      "highlighted": true
    });

    chrome.tabs.sendMessage(tabId, {
      action: "highlight",
      content: content,
      searchTerm: searchTerm
    });
  };

  $(document).ready(function() {
    var $result = $("#result");

    // search content
      $("#searchBar").on("keyup", $.debounce(function(){
        var $this = $(this);
        var text = $.trim($this.val()).toLowerCase();
        console.log("searching text " + text);
        $result.text("searching...");
        var results = [];
        var resultHtml = "";
        for (var tabId in searchableContent)
        {
          if (searchableContent.hasOwnProperty(tabId))
          {
            var contentList = searchableContent[tabId];
            for (var i = 0; i < contentList.length - 1; i++)
            {
              if (contentList[i].toLowerCase().search(text) > -1)
              {
                console.log(contentList[i].toLowerCase());
                results.push({
                  "text": contentList[i],
                  "tabId": tabId
                });
              }
            };
          }
        }

        if (results.length > 0)
        {
          var textLength = text.length;
          for (var i = 0; i < results.length - 1; i++)
          {
            var content = results[i].text;
            var tabId = results[i].tabId;
            var startIndex = content.toLowerCase().search(text);
            resultHtml += "<div class='searchResult' data-tabid='"+ tabId + "' data-content='" + encodeURIComponent(content) + "'>" + content.substring(Math.max(0, startIndex - 50), startIndex) + "<span class='highlight'>" + content.substring(startIndex, startIndex + textLength) + "</span>" + content.substring(startIndex + textLength, Math.min(content.length, startIndex + textLength + 50)) + "</div>\n";
          }
          $result.html(resultHtml);
        }
        else
        {
           $result.text("No Results Found");
        }

      }, 250));

    $result.on("click", ".searchResult", function(){
      var $this = $(this);
      var tabId = $this.data("tabid");
      var content = $this.data("content");
      openTab(tabId, content, $("#searchBar").val());
    });
    // end search content
  });

// save content below
  var saveContent = function(tabId, html) {
    searchableContent[tabId] = html;
  };

  // Listen for messages
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    sendResponse();
    if (msg.action == "getContent")
      saveContent(sender.tab.id, msg.html);
  });

  var queryInfo = {
      currentWindow: true
  };

  chrome.tabs.query(queryInfo, function callback(tabs){
    for(var i = 0; i < tabs.length; i++)
    {
      var currentTab = tabs[i];
     
      chrome.tabs.executeScript(currentTab.id, {file: "jquery-3.2.0.min.js"}, (function(tagId){
        console.log("Injected jquery-3.2.0.min.js for tab " + tagId);
      })(currentTab.id));

      chrome.tabs.executeScript(currentTab.id, {file: "sendContent.js"}, (function(tagId){
        console.log("Injected sendContent.js for tab " + tagId);
      })(currentTab.id));
     
    }
  });
// end save content below

})();