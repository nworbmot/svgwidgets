

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




// code to define our new Backbone.js View objects

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
            
	    // note that this.attributes is reserved by Backbone.js
            svg_attributes: Object.keys(widget_properties[class_name]["attributes"]),
        
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

		// set the initial mode for the SVG
		if(this.tag_name === "svg"){
		    this.mode = null;
		}

		// make sure all attributes, etc., are up-to-date
                this.update();
            },
        
            update: function(){
		// called when something is changed

		// update all the SVG attributes
                for(var i=0, length = this.svg_attributes.length; i<length; i++){
		    var name = this.svg_attributes[i];
                    var value = this.model.get(name);
                    this.el.setAttribute(name.replace("_","-"),value);
                }    
            
		// update the content for TextWidget
		if(this.tag_name === "text"){
		    this.el.innerHTML = this.model.get("content");
		}

		// update the SVG drawing mode
		if(this.tag_name === "svg"){
		    var mode = this.model.get("mode");
		    if(mode !== this.mode){
			set_svg_mode(this,mode);
		    }
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



// attach all the event listeners to the SVG view object, depending on
// the mode

var set_svg_mode = function(svg_view,mode){

    svg_view.mode = mode;

    // define useful variables for the drawing modes

    if(mode !== "select"){
	var class_name = mode.charAt(0).toUpperCase() + mode.slice(1) + "Widget";
	var properties = widget_properties[class_name];
	var tag_name = properties["tag_name"];
	var attributes = properties["attributes"];
	var gui_controls = ["fill","fill_opacity","stroke","stroke_width"];
    }


    // svg_view.el.onmousedown is set to listeners[mode] at the end

    var listeners = {};


    // if mousedown in select mode, drag any draggable elements

    listeners.select = function(event){

	// SVG View which has been selected
	var selected;

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

	selected = search_children(svg_view);


	// if the selected item is draggable, let it be dragged

	if(selected !== undefined && selected.draggable){
	    svg_view.previousX = event.pageX;
	    svg_view.previousY = event.pageY;

	    //if the object has been translated, get its current translation coords

	    var coords = false;

	    if(selected.el.hasAttribute("transform")){
		var transform_string = selected.el.getAttribute("transform");
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
		selected.el.setAttribute("transform",transform);
	    }

	    svg_view.el.onmouseup = function(event){

		// send the final result to the model
		var transform = selected.el.getAttribute("transform");
		selected.model.set("transform",transform);
		selected.touch();

		// turn listeners off again
		selected = undefined;
		svg_view.el.onmousemove = null;
		svg_view.el.onmouseup = null;
	    }
	}
    }

    // some universal functions for the drawing of elements

    var set_style_attributes = function(child){

	for(var i=0, length=gui_controls.length; i<length; i++){
	    var attribute = gui_controls[i];
	    if(attribute in attributes){
		child.setAttribute(attribute.replace("_","-"),svg_view.model.get(attribute));
	    }
	}

	child.setAttribute("transform","");
    }


    var onmouseup = function(child){

	svg_view.el.removeChild(child);

	var child_attributes = {};

	for(var attribute in attributes){
	    child_attributes[attribute] = child.getAttribute(attribute.replace("_","-"));
	}

	var message = {"message_type": "new", "class_name": class_name, "attributes": child_attributes};

        svg_view.send(message);

	// turn listeners off again
	svg_view.el.onmousemove = null;
	svg_view.el.onmouseup = null;
    }


    // now for each element type, define the mouse behaviour on the
    // geometry

    listeners.rect = function(event){

	set_svg_ref_coords(svg_view.el);
	var coords = get_svg_coords(event,svg_view.el);
	var startX = coords.x;
	var startY = coords.y;
	var x = startX;
	var y = startY;
	var width = 10;
	var height = 10;

        var child = document.createElementNS("http://www.w3.org/2000/svg",tag_name);

	set_style_attributes(child);

	child.setAttribute("x",x);
	child.setAttribute("y",y);

	child.setAttribute("width",width);
	child.setAttribute("height",height);

	svg_view.el.appendChild(child);

	// now define the behaviour on mousemove and mouseup
	// NB: mouseout doesn't work on SVG in Chrome

	svg_view.el.onmousemove = function(event){

	    var coords = get_svg_coords(event,svg_view.el);

	    x = Math.min(coords.x,startX);
	    y = Math.min(coords.y,startY);

	    width = Math.abs(coords.x - startX);
	    height = Math.abs(coords.y - startY);

	    child.setAttribute("x",x);
	    child.setAttribute("y",y);
	    child.setAttribute("width",width);
	    child.setAttribute("height",height);

	}

	svg_view.el.onmouseup = function(event){
	    onmouseup(child);
	}
    }



    // if mousedown in circle mode, draw a circle

    listeners.circle = function(event){

	set_svg_ref_coords(svg_view.el);
	var coords = get_svg_coords(event,svg_view.el);

	var cx = coords.x;
	var cy = coords.y;
	var r = 5;

        var child = document.createElementNS("http://www.w3.org/2000/svg",tag_name);

	set_style_attributes(child);

	child.setAttribute("cx",cx);
	child.setAttribute("cy",cy);
	child.setAttribute("r",r);

	svg_view.el.appendChild(child);

	// now define the behaviour on mousemove and mouseup
	// NB: mouseout doesn't work on SVG in Chrome

	svg_view.el.onmousemove = function(event){

	    var coords = get_svg_coords(event,svg_view.el);

	    r = Math.abs(coords.x - cx);

	    child.setAttribute("r",r);
	}

	svg_view.el.onmouseup = function(event){
	    onmouseup(child);
	}
    }



    listeners.ellipse = function(event){

	set_svg_ref_coords(svg_view.el);
	var coords = get_svg_coords(event,svg_view.el);

	var cx = coords.x;
	var cy = coords.y;
	var rx = 5;
	var ry = 5;

        var child = document.createElementNS("http://www.w3.org/2000/svg",tag_name);

	set_style_attributes(child);

	child.setAttribute("cx",cx);
	child.setAttribute("cy",cy);
	child.setAttribute("rx",rx);
	child.setAttribute("ry",ry);

	svg_view.el.appendChild(child);

	// now define the behaviour on mousemove and mouseup
	// NB: mouseout doesn't work on SVG in Chrome

	svg_view.el.onmousemove = function(event){

	    var coords = get_svg_coords(event,svg_view.el);


	    rx = Math.abs(coords.x - cx);
	    ry = Math.abs(coords.y - cy);

	    child.setAttribute("rx",rx);
	    child.setAttribute("ry",ry);
	}

	svg_view.el.onmouseup = function(event){
	    onmouseup(child);
	}
    }



    listeners.line = function(event){

	set_svg_ref_coords(svg_view.el);
	var coords = get_svg_coords(event,svg_view.el);

	var x1 = coords.x;
	var y1 = coords.y;
	var x2 = x1 + 5;
	var y2 = y1;

        var child = document.createElementNS("http://www.w3.org/2000/svg",tag_name);

	set_style_attributes(child);

	child.setAttribute("x1",x1);
	child.setAttribute("y1",y1);
	child.setAttribute("x2",x2);
	child.setAttribute("y2",y2);

	svg_view.el.appendChild(child);

	// now define the behaviour on mousemove and mouseup
	// NB: mouseout doesn't work on SVG in Chrome

	svg_view.el.onmousemove = function(event){

	    var coords = get_svg_coords(event,svg_view.el);

	    x2 = coords.x;
	    y2 = coords.y;

	    child.setAttribute("x2",x2);
	    child.setAttribute("y2",y2);
	}

	svg_view.el.onmouseup = function(event){
	    onmouseup(child);
	}
    }





    listeners.path = function(event){

	set_svg_ref_coords(svg_view.el);
	var coords = get_svg_coords(event,svg_view.el);

	var d =  "M" + String(coords.x) + "," + String(coords.y);

        var child = document.createElementNS("http://www.w3.org/2000/svg",tag_name);

	set_style_attributes(child);

	child.setAttribute("d",d);

	svg_view.el.appendChild(child);

	// now define the behaviour on mousemove and mouseup
	// NB: mouseout doesn't work on SVG in Chrome

	svg_view.el.onmousemove = function(event){

	    var coords = get_svg_coords(event,svg_view.el);

	    d += " " + String(coords.x) + "," + String(coords.y);

	    child.setAttribute("d",d);
	}

	svg_view.el.onmouseup = function(event){
	    onmouseup(child);
	}
    }



    svg_view.el.onmousedown = listeners[mode];

}




// a hopefully browser-independent way of getting the SVG offsets
// inspired by http://stackoverflow.com/questions/20957627/how-do-you-transform-event-coordinates-to-svg-coordinates-despite-bogus-getbound

// called only on mousedown, to avoid excessive calling during
// mousemove - this has side-effect that scrolling while drawing an
// element will disrupt the positioning

var set_svg_ref_coords = function(svg){
    svg.reference = svg.getScreenCTM();
}


// get the coordinates of the event in the SVG's frame of reference

var get_svg_coords = function(event,svg){
    return {x: event.clientX - svg.reference["e"],
	    y: event.clientY - svg.reference["f"]}
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
