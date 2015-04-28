describe("SpiderParse", function(){
    describe("When getting attributes", function(){
        var attrsList = [];


        beforeEach(function(){
            attrsList = [];
        });

        it("Should throw error if the tag is improperly formated", function(){
            var tag = "< input type='text' width='500'>";
            expect(function(){ SpiderParse.parse(tag); }).toThrowError(Error);;
        });

        it("The list passed to the function should contain each element in the tag", function(){
            var tag = "<div id='5' class='test.css'>";
            SpiderParse.getAttributesFromTag(tag, attrsList);
            expect(attrsList).toContain({name:'id', value:'5'});
            expect(attrsList).toContain({name:'class', value:'test.css'});

        });

        it("The attributes should be parsed correctly regardless of spaces before or after equals signs or after values", function(){
            var tag = "<p height = \"55px\"width= \"55px\"      id     =32 style=      'background-color: #333333' num=5>";
            SpiderParse.getAttributesFromTag(tag, attrsList);
            expect(attrsList).toContain({name:'height', value:"55px"});
            expect(attrsList).toContain({name:'width', value:"55px"});
            expect(attrsList).toContain({name: "id", value: "32"});
            expect(attrsList).toContain({name: "style", value: 'background-color: #333333'});
            expect(attrsList).toContain({name:"num", value:"5"});

            var tag2 ="<body lang='en'bgcolor='#ffffff'>";
            attrsList = [];
            SpiderParse.getAttributesFromTag(tag2, attrsList);
            expect(attrsList).toContain({name: "lang", value: "en"});
            expect(attrsList).toContain({name: "bgcolor", value: '#ffffff'});
        });

        it("The list passed to the function should be empty if the tag has no attributes", function(){
            var tag = "<body>";
            SpiderParse.getAttributesFromTag(tag, attrsList);
            expect(attrsList.length).toBe(0);
        });

        it("If the tag contains attributes with no equal signs they should appear with null values", function(){
            var tag = "<div ng-app #IMPLIED bar 'test'/>"
            SpiderParse.getAttributesFromTag(tag, attrsList);
            expect(attrsList).toContain({name:"ng-app", value:null});
            expect(attrsList).toContain({name:"#IMPLIED", value:null});
            expect(attrsList).toContain({name:"bar", value:null});
        });

        it("If standalone and assigned attributes exist they all should be added to the list", function(){
            var tag = "<section #IMPLIED height=32 hidden=\"true\"  ng-app foo>";
            SpiderParse.getAttributesFromTag(tag, attrsList);
            expect(attrsList).toContain({name:"#IMPLIED", value:null});
            expect(attrsList).toContain({name:"height", value:"32"});
            expect(attrsList).toContain({name:"hidden", value: "true"});
            expect(attrsList).toContain({name:"ng-app", value:null});
            expect(attrsList).toContain({name:"foo", value:null});
        });
    });

    describe("When parsing html page", function(){
        var parsedHTML = SpiderParse.parse(htmlstring);
        it("Doctype and html should be first level children", function(){
            expect(parsedHTML.children[0].name).toBe('!DOCTYPE');
            expect(parsedHTML.children[1].name).toBe('html');
        });

        it("Head and body should be second level children", function(){
            expect(parsedHTML.children[1].children[0].name).toBe('head');
            expect(parsedHTML.children[1].children[1].name).toBe('body');
        });

        it("All nodes should have the correct number of children", function(){
            expect(parsedHTML.children[0].children.length).toBe(0);
            expect(parsedHTML.children[1].children.length).toBe(2);
            expect(parsedHTML.children[1].children[0].children.length).toBe(16);
            expect(parsedHTML.children[1].children[1].children.length).toBe(9);
        });

        it("Text nodes should be only stored in the children list", function(){
            expect(parsedHTML.children[1].children[1].childNodes[0].name).toBe("textNode");
            expect(parsedHTML.children[1].children[1].childNodes[0].value).toBe("This is only a test\n");
            expect(parsedHTML.children[1].children[1].childNodes[0].nextSibling.name.toLowerCase()).toBe("br");
            expect(parsedHTML.children[1].children[1].childNodes[1].previousSibling.name.toLowerCase()).toBe("textnode");
            expect(parsedHTML.children[1].children[1].children[1].name).not.toBe("textNode");
            expect(parsedHTML.children[1].children[1].children[1].value).not.toBe("This is only a test\n");
            expect(parsedHTML.children[1].children[1].children[1].name.toLowerCase()).toBe("br");
        })
    });

    describe("When using the createElement function", function(){
        var parsedHTML = SpiderParse.parse(htmlstring);
        var node1 = parsedHTML.children[1].children[0].createElement();
        var node2 = parsedHTML.children[1].children[1].createElement();
        it("Object should be of proper type", function(){
            expect(node1.nodeName).toBe("HEAD");
            expect(node2.nodeName).toBe("BODY");
        });

        it("Element should have correct number of children and children", function(){
            expect(node1.children.length).toBe(16);
            expect(node1.childNodes.length).toBe(16);
            expect(node2.children.length).toBe(9);
            expect(node2.childNodes.length).toBe(10);
        });

        it("Element should have the correct number of attributes", function(){
            expect(node1.attributes.length).toBe(0);
            expect(node2.attributes.length).toBe(2);
        });

        it("Attributes should have the correct names and values", function(){
            expect(node2.attributes[0].name).toBe("lang");
            expect(node2.attributes[0].value).toBe("en");
            expect(node2.attributes[1].name).toBe("bgcolor");
            expect(node2.attributes[1].value).toBe("#f0f8ff");
        });
    });
});