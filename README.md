

# SVG Widgets for the iPython notebook


This is a library of Scalar Vector Graphic (SVG) Widgets for the
iPython notebook (only versions 2.0 onwards have support for
Widgets). Widgets allow easy synchronisation of data between the
Python backend and Javascript frontend. This library implements this
functionality for SVG elements.

Currently it is only a demonstration of the functionality; more useful
features will be added soon.


## Example code

The notebook svgwidgets_notebook.ipynb provides a basic example of the
code in operation. For the simplest example, execute the following in
an iPython notebook cell:

     import svgwidgets

     svg = svgwidgets.SVGWidget()
     rect = svgwidgets.RectWidget()
     svg.children = [rect]
     svg



## Licence (GPL3)


Copyright 2014 Tom Brown (tombrown@nworbmot.org)

This program is free software: you can redistribute it and/or
modify it under the terms of the GNU General Public License as
published by the Free Software Foundation; either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
