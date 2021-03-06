***************
Release History
***************

.. Changelog entries should follow this format:

   version (release date)
   ======================

   **section**

   - One-line description of change (link to Github issue/PR)

.. Changes should be organized in one of several sections:

   - API changes
   - Improvements
   - Behavioural changes
   - Bugfixes
   - Documentation

0.2.0 (unreleased)
==================

0.1.5 (November 3, 2015)
========================

- Added a set of tutorials to the built-in examples.
- Added cross-hairs when hovering over plots.
- Added several new types of plots, including a firing pattern plot,
  a similarity plot for SPA networks, and a plot for ``Compare`` networks.
- Added the ability to implement custom HTML plots.
  See the built-in example ``basics/html.py``.
- Extended SPA override capabilities to all SPA networks.
- ``nengo_gui.Viz`` has been renamed to ``nengo_gui.GUI``.
- Major refactoring of back-end code.
- Many bug fixes and look-and-feel improvements.

0.1.4 (June 16, 2015)
=====================

- Spike rasters are now much faster.
- Added a reset button that restarts a simulation.
- Code editor now has a border, making it easier to resize.
- Can now search in the code editor (with Ctrl+f).
- When an error occurs in a model, a console will display with error details.
  Printed values also show up in this console, for easier debugging.
- Can now import from other files in the same directory as a Nengo model.
- Readonly files are handled safely, instead of crashing.
- Several minor aestheic improvements and bug fixes.

0.1.3 (June 10, 2015)
=====================

- Fixed another Python 3 compatibility issue with autolayouts.
- Fixed a bug that could cause a crash when reloading config files.

0.1.2 (June 9, 2015)
====================

- Fixed a Python 3 compatibility issue with semantic pointer graphs.

0.1.1 (June 8, 2015)
====================

- A large number of stability and user experience fixes.
  The first release was a bit buggy, but this should be pretty stable.
- Includes many more examples out of the box.

0.1.0 (June 5, 2015)
====================

Initial release of Nengo GUI!
Thanks to all of the contributors for making this possible!
