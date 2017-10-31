# Diachronic'Explorer
###### Visualizing diachronic results

## Presentation
Diachronic'Explorer is a project which aims to deal with documents corpora such as the [ISTEX](http://www.istex.fr/) one. This module is used for Visualization of diachronic analysis. Results of the diachony should be produced by another module of Diachronic'Explorer which is a [Java driven library for diachronic analysis, feature selection and cluster labeling](https://github.com/nicolasdugue/istex). 

This Visualization tool is a webapp which is designed with NodeJS and D3.

## Demo 

A demo could be found at http://diachronic-explorer.dpi.inist.fr/

## INSTALL

### Install NodeJs 4 

Instructions were taken from here: https://github.com/nodesource/distributions

    wget -qO- https://deb.nodesource.com/setup_4.x | sudo bash -

and then:

    sudo apt-get install --yes nodejs

### Install and run the app

Download the archive and run :

        npm install
to install all nodeJs packages required.

Afterwards, run 

        node serveur.js at the root of the folder
to launch the web app !
To connect to the app, use the port 3000 (ex : http://localhost:3000/)
