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
            var tag = "<div id='5' class='test.css' >";
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
        });

        it("The list passed to the function should be empty if the tag has no attributes", function(){
            var tag = "<body>";
            SpiderParse.getAttributesFromTag(tag, attrsList);
            expect(attrsList.length).toBe(0);
        });

        it("If the tag contains attributes with no equal signs they should appear with null values", function(){
            var tag = "<div ng-app #IMPLIED bar>"
            SpiderParse.getAttributesFromTag(tag, attrsList);
            expect(attrsList).toContain({name:"ng-app", value:null});
            expect(attrsList).toContain({name:"#IMPLIED", value:null});
            expect(attrsList).toContain({name:"bar", value:null});
        });

        it("If standalone and assigned attributes exist they all should be added to the list", function(){
            var tag = "<section #IMPLIED height=32 hidden=\"true\">";
            SpiderParse.getAttributesFromTag(tag, attrsList);
            expect(attrsList).toContain({name:"#IMPLIED", value:null});
            expect(attrsList).toContain({name:"height", value:"32"});
            expect(attrsList).toContain({name:"hidden", value: "true"});
        });
    });

});