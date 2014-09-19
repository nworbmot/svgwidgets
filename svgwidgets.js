

// SVG iPython Widgets

// A library to manipulate Scalar Vector Graphics in the iPython notebook
// using Widgets, which synchronise between the Python backend and the
// Javascript frontend.


// Copyright 2014 Tom Brown (tombrown@nworbmot.org)

// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License as
// published by the Free Software Foundation; either version 3 of the
// License, or (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.




// code the define our new Backbone.js View objects

require(["widgets/js/widget"], function(WidgetManager){

    // widget_properties is put into the global scope by svgwidgets.py
    // and contains a list of class names with their properties
    
    for(var class_name in widget_properties){
        
        var fertile = widget_properties[class_name]["fertile"];
        
        var view_name = widget_properties[class_name]["view_name"];

        // choose the base class to inherit from, depending on whether
        // the class can have children
        if(fertile){
            var BaseClass = IPython.WidgetManager._view_types.ContainerView;
        }
        else{
            var BaseClass = IPython.DOMWidgetView;
        }

        
	// the class definition of the Backbone.js view
        var NewView = BaseClass.extend({
            
            // store the properties we need for each class
            
            fertile: fertile,

	    draggable: widget_properties[class_name]["draggable"],

	    has_content: widget_properties[class_name]["has_content"],
            
	    // note that this.attributes is reserved by Backbone.js
            svg_attributes: widget_properties[class_name]["attributes"],
        
            tag_name: widget_properties[class_name]["tag_name"],

            render: function(){
                // called when view is rendered

		// the DOM element to render
                var el = document.createElementNS("http://www.w3.org/2000/svg",this.tag_name);
            
                // needs to be called to set this.el to el properly
                this.setElement(el);

		// render any children with the ContainerView render method
                if(this.fertile){
		    this.constructor.__super__.render.apply(this);
		}

		// make sure all attributes, etc., are up-to-date
                this.update();

		// define event listeners for the SVG
		if(this.tag_name === "svg"){
		    make_svg_clickable(this);
		}
            },
        
            update: function(){
		// called when something is changed

		// update all the SVG attributes
                for(var i=0, length = this.svg_attributes.length; i<length; i++){
		    var name = this.svg_attributes[i];
                    var value = this.model.get(name);
                    this.el.setAttribute(name,value);
                }    
            
		// update the content if required
		if(this.has_content){
		    this.el.innerHTML = this.model.get("content");
		}


                this.constructor.__super__.update.apply(this);
            },
	    
            on_msg: function (content) {
		// deal with requests from the Python backend

		if (content["message_type"] === "get_html") {
		    var message = {"message_type": "html","html": this.el.outerHTML};
                    this.send(message);
		}
            }

            
        });

        
        // register the View with the widget manager
        WidgetManager.register_widget_view(view_name, NewView);
        
        
    }

});



// attach all the event listeners to the SVG view object

var make_svg_clickable = function(svg_view){

    svg_view.mode = "select";

    svg_view.selected = undefined;


    svg_view.el.onmousedown = function(event){
	switch(svg_view.mode){
	case "select":
	    select_listener(event);
	    break;
	}
    };



    // if mousedown in select mode, drag any draggable elements

    var select_listener = function(event){

	// recursively see which if any child views have been selected

	var search_children = function(view){
	    if(event.target === view.el){
		return view;
	    }
	    else{
		for(var child_id in view.child_views){
		    var child_view = view.child_views[child_id];
		    var result = search_children(child_view);
		    if(result !== undefined){
			return result;
		    }
		}
		return undefined;
	    }
	}

	svg_view.selected = search_children(svg_view);

	// if the selected item is draggable, let it be dragged

	if(svg_view.selected !== undefined && svg_view.selected.draggable){
	    svg_view.previousX = event.pageX;
	    svg_view.previousY = event.pageY;

	    //if the object has been translated, get its current translation coords

	    var coords = false;

	    if(svg_view.selected.el.hasAttribute("transform")){
		var transform_string = svg_view.selected.el.getAttribute("transform");
		var coords = parse_translate(transform_string);
		if(coords){
		    svg_view.translateX = coords[0];
		    svg_view.translateY = coords[1];
		}
	    }
	    
	    if(!coords){
		svg_view.translateX = 0.0;
		svg_view.translateY = 0.0;
	    }



	    // now define the behaviour on mousemove and mouseup
	    // NB: mouseout doesn't work on SVG in Chrome

	    svg_view.el.onmousemove = function(event){

		svg_view.translateX += event.pageX - svg_view.previousX;
		svg_view.translateY += event.pageY - svg_view.previousY;
		svg_view.previousX = event.pageX;
		svg_view.previousY = event.pageY;

		var transform = "translate(" + svg_view.translateX + "," + svg_view.translateY + ")";
		svg_view.selected.el.setAttribute("transform",transform);
	    }

	    svg_view.el.onmouseup = function(event){

		// send the final result to the model
		var transform = svg_view.selected.el.getAttribute("transform");
		svg_view.selected.model.set("transform",transform);
		svg_view.selected.touch();

		// turn listeners off again
		svg_view.selected = undefined;
		svg_view.el.onmousemove = null;
		svg_view.el.onmouseup = null;
	    }
	}
    }
}





// parse a string to look for translate coordinates,
// e.g. "translate(2.3,4.5)" will return [2.3,4.5]; if the string is
// nonsense, returns false

var parse_translate = function(a_string){

    var index = a_string.indexOf("translate(")
    if(index < 0){
        return false;
    }
    
    a_string = a_string.slice(index+10);
    
    index = a_string.indexOf(")");
    if(index < 0){
        return false;
    }
    
    a_string = a_string.slice(0,index);
    
    var coords = a_string.split(",");
    if(coords.length !== 2){
        return false;
    }
    
    for(var i=0;i<2;i++){
        coords[i] = parseFloat(coords[i]);
        if(coords[i] === NaN){
            return false;
        }
    }
    
    return coords;
}
