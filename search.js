(function(){

	var entityMap = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
		'/': '&#x2F;',
		'`': '&#x60;',
		'=': '&#x3D;'
	};
	var previewPreSize = 20;
	var previewSize = 65;
	var searchableContent = {};
	var allTabs = {};

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

	var cleanSpace = function(str) {
		return str
				.replace(/\s+/g, " ")	// replace spaces
				.replace(/[&<>"'`=\/]/g, function (s) { // escape html
					return entityMap[s];
				});
	};

	var getSearchResultHtml = function(tabId, text, searchResultItem) {
		var textLength = text.length;
		var content = searchResultItem.text;
		var tabId = searchResultItem.tabId;
		var startIndex = content.toLowerCase().search(text);
		var tab = allTabs[tabId];
		var html = "<div class='searchResult' data-tabid='"+ tabId + "' data-content='" + encodeURIComponent(content) + "'>" + 
						"<span class='favIcon'><img src='" + encodeURI(tab.favIconUrl) + "' height='22'></span>" +
						"<span class='textArea'>" + 
							"<div class='tabTitle'>" + tab.title + "</div>" +
							"<div class='searchHighlight'>" + cleanSpace(content.substring(Math.max(0, startIndex - previewPreSize), startIndex)) + "<span class='highlight'>" + cleanSpace(content.substring(startIndex, startIndex + textLength)) + "</span>" + cleanSpace(content.substring(startIndex + textLength, startIndex + previewSize))  + "</div>" +
						"</span>" +
				"</div>";

		return html;
			
	};

	$(document).ready(function() {
		var $result = $("#result");
		var $tomatosContainer = $("#tomatosContainer");

		// search content
			$("#searchBar").on("keyup", $.debounce(function(){
				var $this = $(this);
				var text = $.trim($this.val()).toLowerCase();
				
				// don't search empty string
				if (text == "")
				{
					$result.text("");
					$tomatosContainer.removeClass("hidden");
					return;
				}

				$result.text("searching...");
				$tomatosContainer.addClass("hidden");
				var results = [];
				var resultHtml = "";
				for (var tabId in searchableContent)
				{
					if (searchableContent.hasOwnProperty(tabId))
					{
						var contentList = searchableContent[tabId];
						for (var i = 0; i < contentList.length; i++)
						{
							if (contentList[i].toLowerCase().search(text) > -1)
							{
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
					for (var i = 0; i < results.length; i++)
					{
						resultHtml += getSearchResultHtml(tabId, text, results[i]);           
					}
					$result.html(resultHtml);
					$tomatosContainer.addClass("hidden");
				}
				else
				{
					 $result.text("No Results Found");
					 $tomatosContainer.addClass("hidden");
				}

			}, 250));

		$result.on("click", ".searchResult", function(){
			var $this = $(this);
			var tabId = $this.data("tabid");
			var content = $this.data("content");
			openTab(tabId, content, $("#searchBar").val());
			window.close();
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

	chrome.tabs.query(queryInfo, function callback(tabs) {
		// render tomatos
		var html = "";
		for(var i = 0; i < 40; i++)
		{
			if (i < tabs.length)
			{
				html += "<div class='tomatoContainer'>" + 
					"<div class='tomato42'><img src='tomato42.png' height='26'></div>" +
				"</div>";
			}
			else
			{
				html += "<div class='tomatoContainer'>" + 
					"<div class='tomatoSprout'></div>" +
				"</div>";
			}
			
		}
		html += "<div class='tabNumDisplay'>" + tabs.length + " tabs</div>";
		$("#tomatosContainer").html(html);

		// insert scripts onto tabs
		for(var i = 0; i < tabs.length; i++)
		{
			var currentTab = tabs[i];
		 
			chrome.tabs.executeScript(currentTab.id, {file: "jquery-3.2.0.min.js"}, (function(tagId){
				console.log("Injected jquery-3.2.0.min.js for tab " + tagId);
			})(currentTab.id));

			chrome.tabs.executeScript(currentTab.id, {file: "sendContent.js"}, (function(tagId){
				console.log("Injected sendContent.js for tab " + tagId);
			})(currentTab.id));

			allTabs[currentTab.id] = currentTab;
		}
	});
// end save content below

})();