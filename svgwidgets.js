

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






require(["widgets/js/widget"], function(WidgetManager){
    
    for(var class_name in widget_properties){
        
        var fertile = widget_properties[class_name]["fertile"];
        
        var view_name = widget_properties[class_name]["view_name"];

        // choose the base class to inherit from, depending on whether
        // the class can have children
        if(fertile === "yes"){
            var BaseClass = IPython.WidgetManager._view_types.ContainerView;
        }
        else{
            var BaseClass = IPython.DOMWidgetView;
        }

        
	// the class definition of the Backbone.js view
        var NewView = BaseClass.extend({
            
            // store the properties we need for each class
            
            fertile: fertile,
            
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
                if(this.fertile === "yes"){
		    NewView.__super__.render.apply(this);
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
            
                NewView.__super__.update.apply(this);  
            }
            
            
        });

        
        // register the View with the widget manager
        WidgetManager.register_widget_view(view_name, NewView);
        
        
    }

});
