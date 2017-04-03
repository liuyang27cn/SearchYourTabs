var notSelector = ':not(head,noscript,script,meta,style,i,link,html):visible';
var selector = '*:not(:has(*)):visible';

var getContentElements = function () {
	var nodes = [];
	var leafNodes = $('body').find(selector);
	
	$.each(leafNodes, function (index, node) {
		var $node = $(node)
		nodes.push($node);
		
		var $parentNode = $node.parent(notSelector);
		if ($parentNode.children().length <= 3)
			nodes.push($parentNode);
	});

	return nodes;
};

var highlight = function(content, searchTerm){
	var $textContainers = getContentElements();
	var found = false;
	content = decodeURIComponent(content);

	$.each($textContainers, function (index, element) {
		var text = $.trim($(element).text());	

		if (text == content)
		{
			var $highlightContainer = $textContainers[index];
			$highlightContainer
				.css("transition", "all 1.5s ease");
			$highlightContainer
				.css("background-color", "yellow");
			$highlightContainer[0].scrollIntoView({
			    behavior: "auto", // or "auto" or "instant"
			    block: "start" // or "end"
			});
			found = true;
			return false;
		}
	});
	
	// if couldn't find, trigger browser search
	if (!found)
	{
		window.find(searchTerm);
	}
};

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	if (msg.action == "highlight")
		highlight(msg.content, msg.searchTerm);
});

function DOMtoString(document_root) {
	var html = [];
	var $elements = getContentElements();

	$.each($elements, function (index, element) {
		var text = $.trim($(element).text());	
		if (text && html.indexOf(text) < 0)
			html.push(text);
	});
    return html;
}

chrome.runtime.sendMessage(null, {
    action: "getContent",
    html: DOMtoString(document.body)
});

