(function(window){
    window.SpiderParse = {
        parse: function(htmlString){
            var self = this;
            var parsedHTML = { children:[], childNodes:[] };
            var doc = document.implementation.createHTMLDocument("");
            (function getTags(htmlString){
                var getAllNodesRegex = /(<[^<>]*)|((?!>\s+)(?!>$)(?!><)(>[^<>]*))/g;
                var allNodes = htmlString.match(getAllNodesRegex);

                (function getTagsHelper (nodes, parent, inc){
                    var currentChild = nodes[0];
                    var isTextNode = currentChild.charAt(0) == ">";

                    var name;
                    if(!isTextNode) {
                        var nameEndIndex = currentChild.indexOf(" ");
                        name  = nameEndIndex < 0 ? currentChild.substring(1):currentChild.substring(1, nameEndIndex);
                    }

                    var element;
                    if(isTextNode)
                        element = doc.createTextNode(currentChild.substring(1));
                    else{
                        element = doc.createElement(name);
                        self.getAttributesFromTag(currentChild, element);
                    }

                    //The childinc and sibinc variables used in the following section are used to keep track of the
                    //position of the current child in relation to its parent, I do this so that I can know where
                    //a parent node's ending tag is with out running a while loop through the entire array of nodes
                    //to find it on each recursive call of getTagsHelper.
                    if(isTextNode){
                        if (parent == null) parsedHTML.children.push(element);
                        else parent.appendChild(element);

                        var nextNodes = nodes.slice(1);

                        var sibinc = 1;
                         if(nextNodes.length > 0 && nextNodes[0].indexOf("</") != 0)sibinc = sibinc + getTagsHelper(nextNodes, parent);

                        return sibinc;

                    }else{
                        //get children if there are any
                        var nextChildNodes = nodes.slice(1);
                        var childinc = 1;
                        if(nextChildNodes[0].indexOf("</") != 0)childinc = childinc + getTagsHelper(nextChildNodes, element);

                        if(parent == null) parsedHTML.children.push(element);
                        else parent.appendChild(element);

                        //get next sibling
                        var sibinc = 1;
                        var nextNodes = nodes.slice(sibinc + childinc);
                        if(nextNodes.length > 0 && nextNodes[0].indexOf("</") != 0)
                            sibinc = sibinc + getTagsHelper(nextNodes, parent);

                        return sibinc + childinc;
                    }
                })(allNodes, null);
            })(htmlString);

            return parsedHTML;
        },
        getAttributesFromTag: function(tagString, element){
            if(tagString.search(/^<\s+/) >= 0) throw new Error("Improperly Formed Tag: " + tagString);

            var attrRegEx = /[^<.*\s'"]*\s*=\s*((['][^']*['])|(["][^"]*["])|([^'"\s]*\s))/g;
            var attrsAndValues = tagString.match(attrRegEx);
            var standaloneAttrs;

            //if there is no match, then check to see if the tag consists of only stand alone attributes
            if(attrsAndValues == null){
                standaloneAttrs = tagString.match(/\s+[^\s\/>]*/g);

                if(standaloneAttrs == null) return;

                for(var i = 0; i < standaloneAttrs.length; i++) {
                    var attr = standaloneAttrs[i].trim();
                    if(attr != "")element.setAttribute(attr, null);
                }
            }else {
                tagString = tagString.replace(attrRegEx, "");
                standaloneAttrs = tagString.match(/\s+[^\s\/>]*/g);
                attrsAndValues = attrsAndValues.concat(standaloneAttrs);

                for(var i = 0; i < attrsAndValues.length; i++){
                    var av = attrsAndValues[i];

                    if(av == null) continue;

                    var indexOfEquals = av.indexOf("=");
                    var name = av.trim();
                    if(indexOfEquals < 0 && name != "" && name != ''){
                        element.setAttribute(name, null);
                    }else{
                        var name = av.substring(0, indexOfEquals).trim();
                        var value = av.substring(indexOfEquals + 1).trim();
                        if(name != "" && name != '')element.setAttribute(name, value.replace(/^["'](.*)["']$/, '$1'));
                    }
                }
            }
        }
    }
})(window);