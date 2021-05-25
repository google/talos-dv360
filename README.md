_**Disclaimer**: This is not an official Google Product._

# Talos - Campaign creation automation.

## Overview
Talos is a sheets addon that allows you to quickly replicate an existing Trueview campaign setup in DV360 for other campaigns.

## Installation
  1. Create a new Spreadsheet and open the Script Editor by going to `Tools > Script editor`.
  1. Copy each of the files into the new project created. You may need to create each file individually and copy the contents over.
  1. Go to `console.cloud.google.com` and create a new Google Cloud project.
  1. In the cloud project, go to home page and copy the `Project number`.
  1. In the Sheets script editor, go to `Resources > Cloud platform project ...`.
  1. Under the section `Change Project`, paste the project number there.
  1. Back in the cloud project, go to `Menu > APIs & Services > Dashboard` and search and enable the API for `DoubleClick Bid Manager API`.


## Usage
  1. Create your template campaign in DV360 with placeholder video ids for the trueview lineitems.
  2. In the Google sheet where the addon is installed, go to `Talos > Download SDF` and follow the instructions on the screen.
# talos-dv360
