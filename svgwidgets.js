

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
		
		// make element draggable if required
                if(this.draggable){
		    this.selected = false;
		    this.translateX = 0.0;
		    this.translateY = 0.0;
		    this.make_draggable();
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
                    this.el.setAttribute(name,value);
                }    
            
		// update the content if required
		if(this.has_content){
		    this.el.innerHTML = this.model.get("content");
		}


                this.constructor.__super__.update.apply(this);
            },

	    make_draggable: function(){

		var that = this;

		this.$el.on('mousedown', function(event){
		    that.selected = true;
		    that.startX = event.pageX;
		    that.startY = event.pageY;
		    that.newX = that.translateX;
		    that.newY = that.translateY;
		}).on('mousemove', function(event){
		    if(that.selected){
			that.newX = that.translateX + event.pageX - that.startX;
			that.newY = that.translateY + event.pageY - that.startY;
			var transform = "translate(" + that.newX + "," + that.newY + ")";
			that.model.set("transform",transform);
			that.touch();
		    }}).on('mouseup',function(event){
			if(that.selected){
			    that.translateX = that.newX;
			    that.translateY = that.newY;
			    that.selected = false;
			}
		    }).on('mouseout',function(event){
			if(that.selected){
			    that.translateX = that.newX;
			    that.translateY = that.newY;
			    that.selected = false;
			}
		    });

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
