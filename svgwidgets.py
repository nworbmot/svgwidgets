
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

Usage from the iPython notebook:

import svgwidgets

svg = svgwidgets.SVGWidget()
rect = svgwidgets.RectWidget()
svg.children = [rect]
svg


"""

# make the code as Python 3 compatible as possible
from __future__ import print_function, division




__version__ = "0.2"
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


# the class definitions all follow the general outline for SVG tagName:

# class TagNameWidget:
#     tag_name = "tagName"
#     attributes = {"x" : 40}
#     draggable = False

# the SVG attributes are listed with their default values

# the attributes and _view_name are then promoted later to traitlets
# to avoid lots of boilerplate


# the classes inherit from widgets.ContainerWidget if they can have
# children (like svg and g; later indicated by klass.fertile = True)
# or inherit from widgets.DOMWidget if the cannot have children (like
# rect and path;  later indicated by klass.fertile = False)



class SVGWidget(widgets.ContainerWidget):
    tag_name = "svg"
    attributes = {"width" : 400, "height" : 300}
    draggable = False


class GroupWidget(widgets.ContainerWidget):
    tag_name = "g"
    attributes = {"transform": ""}
    draggable = False


class RectWidget(widgets.DOMWidget):
    tag_name = "rect"
    attributes = {"x" : 10,"y" : 10, "width" : 100,"height" : 50, "fill" : "blue", "fill-opacity" : 0.5, "stroke" : "red", "stroke-width" : "3", "transform" : ""}
    draggable = True


class CircleWidget(widgets.DOMWidget):
    tag_name = "circle"
    attributes = {"cx" : 50,"cy" : 110, "r" : 20, "fill" : "red", "fill-opacity" : 0.5, "stroke" : "green", "stroke-width" : "3" ,"transform": ""}
    draggable = True


class EllipseWidget(widgets.DOMWidget):
    tag_name = "ellipse"
    attributes = {"cx" : 250,"cy" : 110, "rx" : 20, "ry" : 10, "fill" : "magenta", "fill-opacity" : 0.5, "stroke" : "cyan", "stroke-width" : "3" ,"transform": ""}
    draggable = True


class LineWidget(widgets.DOMWidget):
    tag_name = "line"
    attributes = {"x1" : 10,"y1" : 200,"x2" : 100,"y2" : 150,  "stroke" : "orange", "stroke-width" : "3","transform": ""}
    draggable = True


class PathWidget(widgets.DOMWidget):
    tag_name = "path"
    attributes = {"d" : "M 10,250 C70,150 200,150 200,250", "stroke" : "black", "stroke-width" : "3", "fill" : "cyan", "fill-opacity" : 0.5, "transform": ""}
    draggable = True


class TextWidget(widgets.DOMWidget):
    tag_name = "text"
    attributes = {"x" : 100, "y" : 100,  "fill" : "black"}
    draggable = True
    content = "Hello World!"


#
# methods to append to all classes
#


# message the GUI to get element.outerHTML
def get_html(self):

    self.send({"message_type" : "get_html"})


# deal with messages as they come in from the GUI
def _handle_message(item,content):

    if(content["message_type"] == "html"):
        print(content["html"])


# initialise element instance
def _init(self, **kwargs):
    super(self.__class__, self).__init__(**kwargs)
    self.on_msg(_handle_message)



#
# get all Widget classes
#

class_names = filter(lambda name: name.endswith("Widget"), locals())

this_module = sys.modules[__name__]

class_dict = { class_name : getattr(this_module,class_name) for class_name in class_names}


#
# make all attributes and _view_name into traitlets
#

for class_name, klass in class_dict.iteritems():

    
    # classify whether the class can have children based on parent class
    base_class = klass.__bases__[0]
    if base_class.__name__ == "DOMWidget":
        klass.fertile = False
    elif base_class.__name__ == "ContainerWidget":
        klass.fertile = True



    # checked whether the class has internal content (like TextWidget)
    klass.has_content = hasattr(klass,"content")


    # add the view name for Javascript as a traitlet
    traitlets_dict = klass.attributes.copy()
    traitlets_dict.update({"_view_name" : class_name.replace("Widget","View")})

    # the content must also be traitlet
    if klass.has_content:
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

        
        # I don't understand where traitlet.name and
        # traitlet.this_class get set in the official code, but the
        # following sets them:

        # class Rect(DOMWidget):
        #     thingie = traitlets.Float(11.5, sync=True)

        # while this doesn't:

        # Rect.thingie = traitlets.Float(11.5, sync=True)
                
        traitlet.name = name
        traitlet.this_class = klass


    #finally set the universal methods

    klass.get_html = get_html

    klass.__init__ = _init



# prepare data to send to Javascript

widget_properties = { class_name : {"tag_name" : klass.tag_name,
                                    "fertile" : klass.fertile,
                                    "view_name" : class_name.replace("Widget","View"),
                                    "attributes" : klass.attributes.keys(),
                                    "has_content" : klass.has_content,
                                    "draggable" : klass.draggable} for class_name,klass in class_dict.iteritems() }


# set data in global scope

display(Javascript("window.widget_properties = " + json.dumps(widget_properties)))


# execute code to set up Javascript View classes

display(Javascript("svgwidgets.js"))
