
## Copyright 2014 Tom Brown (tombrown@nworbmot.org)

## This program is free software; you can redistribute it and/or
## modify it under the terms of the GNU General Public License as
## published by the Free Software Foundation; either version 3 of the
## License, or (at your option) any later version.

## This program is distributed in the hope that it will be useful,
## but WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
## GNU General Public License for more details.

## You should have received a copy of the GNU General Public License
## along with this program.  If not, see <http://www.gnu.org/licenses/>.

"""SVG iPython Widgets

A library to manipulate Scalar Vector Graphics in the iPython notebook
using Widgets, which synchronise between the Python backend and the
Javascript frontend.

Usage from the iPython notebook to start an SVG drawing GUI:

import svgwidgets

builder = svgwidgets.SVGBuilderWidget()
builder

"""

# make the code as Python 3 compatible as possible
from __future__ import print_function, division




__version__ = "0.4.1"
__author__ = "Tom Brown"
__copyright__ = "Copyright 2014 Tom Brown, GNU GPL 3"


# get basic Widget definitions
from IPython.html import widgets 

# get infrastructure for displaying in iPython notebook
from IPython.display import display, Javascript

# the traitlets take care of communication between frontend and backend
from IPython.utils import traitlets

# use json to send data to the frontend
import json, sys



class GeneralSVGWidget(object):
    """GeneralSVGWidget defines the most basic SVG element properties,
    including the XML tag name and a list of attributes with default
    values. Later in this module, the attributes and _view_name are
    promoted to traitlets, to avoid lots of boilerplate.

    """

    tag_name = ""
    attributes = {}

    # message the GUI to get element.outerHTML
    def get_html(self):
        self.send({"message_type" : "get_html"})



class FertileSVGWidget(widgets.ContainerWidget,GeneralSVGWidget):
    """FertileSVGWidgets can have child elements (like the svg and g
    elements) and therefore inherit from widgets.ContainerWidget.

    """

    def __init__(self, **kwargs):
        widgets.ContainerWidget.__init__(self,**kwargs)
        self.on_msg(self._handle_message)

    # deal with messages as they come in from the GUI
    def _handle_message(self,item,content):
        if content["message_type"] == "html":
            print(content["html"])

        elif content["message_type"] == "new":
            class_name = content["class_name"]
            klass = svg_class_dict[class_name]
            
            child = klass()

            for attribute in content["attributes"]:
                value = content["attributes"][attribute]

                #cast any string floats to floats
                if type(getattr(child,attribute)) == float:
                    value = float(value)

                setattr(child,attribute,value)

            self.children = self.children + (child,)



class InfertileSVGWidget(widgets.DOMWidget,GeneralSVGWidget):
    """InfertileSVGWidgets cannot have child elements (like the rect and
    circle elements) and therefore inherit from widgets.DOMWidget.

    """

    def __init__(self, **kwargs):
        widgets.DOMWidget.__init__(self,**kwargs)
        self.on_msg(self._handle_message)

    # deal with messages as they come in from the GUI
    def _handle_message(self,item,content):
        if content["message_type"] == "html":
            print(content["html"])


# now come the basic SVG elements

class SVGWidget(FertileSVGWidget):
    tag_name = "svg"
    attributes = {"width" : 600, "height" : 400}

    # the SVG element has various traitlets for the drawing GUI
    gui_controls = {"mode": "select", "fill": "blue", "fill_opacity": 0.5, "stroke": "red", "stroke_width": 3}


class GroupWidget(FertileSVGWidget):
    tag_name = "g"
    attributes = {"transform": ""}


class RectWidget(InfertileSVGWidget):
    tag_name = "rect"
    attributes = {"x" : 10,"y" : 10, "width" : 100,"height" : 50, "fill" : "blue", "fill_opacity" : 0.5, "stroke" : "red", "stroke_width" : 3, "transform" : ""}


class CircleWidget(InfertileSVGWidget):
    tag_name = "circle"
    attributes = {"cx" : 50,"cy" : 110, "r" : 20, "fill" : "red", "fill_opacity" : 0.5, "stroke" : "green", "stroke_width" : 3, "transform": ""}


class EllipseWidget(InfertileSVGWidget):
    tag_name = "ellipse"
    attributes = {"cx" : 250,"cy" : 110, "rx" : 20, "ry" : 10, "fill" : "magenta", "fill_opacity" : 0.5, "stroke" : "cyan", "stroke_width" : 3, "transform": ""}


class LineWidget(InfertileSVGWidget):
    tag_name = "line"
    attributes = {"x1" : 10,"y1" : 200,"x2" : 100,"y2" : 150,  "stroke" : "orange", "stroke_width" : 3, "transform": ""}


class PathWidget(InfertileSVGWidget):
    tag_name = "path"
    attributes = {"d" : "M 10,250 C70,150 200,150 200,250", "stroke" : "black", "stroke_width" : 3, "fill" : "cyan", "fill_opacity" : 0.5, "transform": ""}


class TextWidget(InfertileSVGWidget):
    tag_name = "text"
    attributes = {"x" : 100, "y" : 100,  "fill" : "black"}
    content = "Hello World!"





class SVGBuilderWidget(widgets.ContainerWidget):
    """SVGBuilderWidget is a wrapper for an SVG drawing GUI."""

    def __init__(self, **kwargs):
        super(self.__class__, self).__init__(**kwargs)

        colours = ["black","red","orange","yellow","green","blue","magenta","cyan"]
        
        # allow toggling of SVG draw mode                                                                             
        draw_toggle_values = ["select","rect","circle","ellipse","line","path"]
        self.draw_toggle = widgets.ToggleButtonsWidget(values = draw_toggle_values,description="Choose drawing tool:")

        # set up the stroke controls
        self.stroke_picker = widgets.DropdownWidget(values = colours,description="Stroke colour:")
        self.stroke_width_slider = widgets.FloatSliderWidget(min=0,max=20,value=3,description="Stroke width:")
        
        self.stroke_container = widgets.ContainerWidget()
        self.stroke_container.remove_class("vbox")
        self.stroke_container.add_class("hbox")
        self.stroke_container.children = [self.stroke_picker,self.stroke_width_slider]
        
        # set up the fill controls
        self.fill_picker = widgets.DropdownWidget(values = ["none"] + colours,description="Fill colour:")
        self.fill_opacity_slider = widgets.FloatSliderWidget(min=0,max=1,value=0.5,description="Fill opacity:")
        
        self.fill_container = widgets.ContainerWidget()
        self.fill_container.remove_class("vbox")
        self.fill_container.add_class("hbox")
        self.fill_container.children = [self.fill_picker,self.fill_opacity_slider]
        
        # the main SVG
        self.svg = SVGWidget()
        
        # border the SVG
        self.svg.set_css('border', '1px solid black') 


        # link the control widgets to the SVG control variables                                                                       
        self.mode_link = traitlets.link((self.draw_toggle, 'value'), (self.svg, 'mode'))
        self.stroke_link = traitlets.link((self.stroke_picker, 'value'), (self.svg, 'stroke'))
        self.stroke_width_link = traitlets.link((self.stroke_width_slider, 'value'), (self.svg, 'stroke_width'))
        self.fill_link = traitlets.link((self.fill_picker, 'value'), (self.svg, 'fill'))
        self.fill_opacity_link = traitlets.link((self.fill_opacity_slider, 'value'), (self.svg, 'fill_opacity'))
        
        # define the main container's children
        self.children = [self.draw_toggle,self.stroke_container,self.fill_container,self.svg]




#
# get all SVG element Widget classes, store them in svg_class_dict,
# and make all attributes and _view_name into traitlets
#

svg_class_dict = {}

for class_name in filter(lambda name: name.endswith("Widget"), locals()):

    this_module = sys.modules[__name__]
    klass = getattr(this_module,class_name)
    
    # classify whether the class can have children based on parent class
    base_class = klass.__bases__[0]
    if base_class.__name__ == "InfertileSVGWidget":
        klass.fertile = False
        klass.draggable = True
    elif base_class.__name__ == "FertileSVGWidget":
        klass.fertile = True
        klass.draggable = False
    else:
        continue

    svg_class_dict[class_name] = klass


    # store the class attributes to be promoted to traitlets along
    # with their default values
    traitlets_dict = klass.attributes.copy()


    # add the view name for Javascript as a traitlet
    traitlets_dict.update({"_view_name" : class_name.replace("Widget","View")})



    # the GUI controls for the SVGWidget must also be trailets
    if class_name == "SVGWidget":
        traitlets_dict.update(klass.gui_controls)

    # the content for the TextWidget must also be a traitlet
    elif class_name == "TextWidget":
        traitlets_dict.update({"content" : klass.content})



    # now define the trailets with the correct traitlet.Type
    for name,default in traitlets_dict.iteritems():

        try:
            default = float(default)
            attribute_type = "float"
        except:
            attribute_type = "string"

        if attribute_type == "float":
            setattr(klass,name,traitlets.Float(default, sync=True))
        elif attribute_type == "string":
            setattr(klass,name,traitlets.Unicode(default, sync=True))
 
        traitlet = getattr(klass,name)

        # normally set by metaclass IPython.utils.traitlets.MetaHasTraits.__new__
        traitlet.name = name

        # normally set by metaclass IPython.utils.traitlets.MetaHasTraits.__init__
        traitlet.this_class = klass



# prepare data to send to Javascript

widget_properties = { class_name : {"tag_name" : klass.tag_name,
                                    "fertile" : klass.fertile,
                                    "view_name" : class_name.replace("Widget","View"),
                                    "attributes" : klass.attributes,
                                    "draggable" : klass.draggable} for class_name,klass in svg_class_dict.iteritems() }


# set data in global scope

display(Javascript("window.widget_properties = " + json.dumps(widget_properties)))





# execute code to set up Javascript View classes

display(Javascript("svgwidgets.js"))
