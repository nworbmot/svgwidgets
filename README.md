

# SVG widgets for the iPython notebook


This is a library of Scalar Vector Graphic (SVG) widgets for the
iPython notebook (widgets are available in iPython version 2.0
onwards). Widgets allow easy synchronisation of objects between the
Python backend and Javascript/DOM frontend. This library implements
this functionality for SVG elements.

Currently it is only a demonstration of the functionality; more useful
features will be added soon.


## Example code

The notebook svgwidgets_notebook.ipynb provides a basic example of the
code in operation. For the simplest example, execute the following in
an iPython notebook cell to start an SVG drawing GUI:

    import svgwidgets

    builder = svgwidgets.SVGBuilderWidget()
    builder



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
