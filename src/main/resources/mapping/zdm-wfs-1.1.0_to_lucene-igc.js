/**
 * ZDM WFS to Lucene Document mapping
 * Copyright (c) 2013 wemove digital solutions. All rights reserved.
 * 
 * The following global variable are passed from the application:
 * 
 * @param wfsRecord
 *            A WFSFeature instance, that defines the input
 * @param document
 *            A lucene Document instance, that defines the output
 * @param xPathUtils
 * 			  A de.ingrid.utils.xpath.XPathUtils instance
 * @param log
 *            A Log instance
 */
importPackage(Packages.org.apache.lucene.document);
importPackage(Packages.de.ingrid.iplug.wfs.dsc.tools);

if (log.isDebugEnabled()) {
	log.debug("Mapping wfs record "+wfsRecord.getId()+" to lucene document");
}

// get the xml content of the record
var recordNode = wfsRecord.getOriginalResponse();

// add id field
addToDoc(document, "t01_object.obj_id", wfsRecord.getId(), true);

//add the title
mapTitle(recordNode);

//add the summary
mapSummary(recordNode);

//add the bounding box
mapBoundingBox(recordNode);

//add the map preview
mapPreview(recordNode);

// add details (content of all child nodes)
var detailNodes = recordNode.getChildNodes();
for (var i=0, count=detailNodes.length; i<count; i++) {
	var detailNode = detailNodes.item(i);
	var nodeName = detailNode.getLocalName();
	if (hasValue(nodeName)) {
		addToDoc(document, nodeName.toLowerCase(), detailNode.getTextContent(), true);
	}
}

function mapTitle(recordNode) {
	var title = xPathUtils.getString(recordNode, "/*/@gml:id");
	addToDoc(document, "title", title, true);
}

function mapSummary(recordNode) {
    var result = "";
    var gmlEnvelope = xPathUtils.getNode(recordNode, "//gml:boundedBy/gml:Envelope");
    if (hasValue(gmlEnvelope)) {
    	var srsName = xPathUtils.getString(gmlEnvelope, "@srsName");
        if (hasValue(srsName)) {
        	result = result + srsName + ": ";
        }
        var lowerCoords = xPathUtils.getString(gmlEnvelope, "gml:lowerCorner").split(" ");
        var upperCoords = xPathUtils.getString(gmlEnvelope, "gml:upperCorner").split(" ");
        result = result + lowerCoords[0] + ", " + lowerCoords[1] + " / " + upperCoords[0] + ", " + upperCoords[1];
    }
	addToDoc(document, "summary", result, true);
}

function mapBoundingBox(recordNode) {
	var gmlEnvelope = xPathUtils.getNode(recordNode, "//gml:boundedBy/gml:Envelope");
	if (hasValue(gmlEnvelope)) {
		var lowerCoords = xPathUtils.getString(gmlEnvelope, "gml:lowerCorner").split(" ");
		var upperCoords = xPathUtils.getString(gmlEnvelope, "gml:upperCorner").split(" ");
		addNumericToDoc(document, "x1", lowerCoords[0], false); // west
		addNumericToDoc(document, "x2", upperCoords[0], false); // east
		addNumericToDoc(document, "y1", lowerCoords[1], false); // south
		addNumericToDoc(document, "y2", upperCoords[1], false); // north
	}
}

function mapPreview(recordNode) {
    var gmlEnvelope = xPathUtils.getNode(recordNode, "//gml:boundedBy/gml:Envelope");
    if (hasValue(gmlEnvelope)) {
    	// BBOX
        var lowerCoords = xPathUtils.getString(gmlEnvelope, "gml:lowerCorner").split(" ");
        var upperCoords = xPathUtils.getString(gmlEnvelope, "gml:upperCorner").split(" ");
        var W = Number(lowerCoords[0]); // WEST
        var N = Number(upperCoords[1]); // NORTH
        var BBOX = "" + (N - 0.048) + "," + (W - 0.012) + "," + (N + 0.048) + "," + (W + 0.012);

        //  Fields for link
//        var BWSTR = xPathUtils.getString(recordNode, "//ms:BWSTR");
//        var KM_ANF_D = xPathUtils.getString(recordNode, "//ms:KM_ANF_D");

        var addHtml = "" + 
//            "<a href=\"http://wsvmapserv.wsv.bvbs.bund.de/ol_bwastr/index.html?bwastr=" + BWSTR + "&kmwert=" + KM_ANF_D + "&abstand=0&zoom=15\" target=\"_blank\" style=\"padding: 0 0 0 0;\">" +
            "<div style=\"background-image: url(http://wsvmapserv.ilmenau.baw.de/cgi-bin/wmstk?VERSION=1.1.1&amp;REQUEST=GetMap&amp;SRS=EPSG:4326&amp;BBOX=" + BBOX +
            "&amp;LAYERS=TK1000,TK500,TK200,TK100,TK50,TK25&amp;FORMAT=image/png&amp;STYLES=&amp;WIDTH=480&amp;HEIGHT=120); left: 0px; top: 0px; width: 480px; height: 120px; margin: 10px 0 0 0;\">" +
            "<div style=\"background-image: url(http://wsvmapserv.wsv.bund.de/ienc?VERSION=1.1.1&amp;REQUEST=GetMap&amp;SRS=EPSG:4326&amp;Transparent=True&amp;BBOX=" + BBOX +
            "&amp;Layers=Harbour&amp;FORMAT=image/png&amp;STYLES=&amp;WIDTH=480&amp;HEIGHT=120); left: 0px; top: 0px; width: 480px; height: 120px;\">" +
            "<img src=\"/ingrid-portal-apps/images/map_punkt.png\" alt=\"\">" +
            "</div></div>";
//            + "</a>";

        if (log.isDebugEnabled()) {
            log.debug("Mapping field \"additional_html_1\": " + addHtml);
        }

        addToDoc(document, "additional_html_1", addHtml, false);
    }
}
