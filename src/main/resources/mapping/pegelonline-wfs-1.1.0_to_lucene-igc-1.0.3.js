/**
 * PEGELONLINE Web Feature Service Aktuell (WFS Aktuell) to Lucene Document mapping according to
 * mapping IGC 1.0.3 
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
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
addToDoc("t01_object.obj_id", wfsRecord.getId(), true);

// additional mappings
/**
 * each entry consists off the following possible values:
 * 
 * indexField: The name of the field in the index the data will be put into.
 * xpath: The xpath expression for the data in the XML input file. Multiple
 * xpath results will be put in the same index field. transform: The
 * 		transformation to be executed on the value 
 * funct: The transformation function to use. 
 * params: The parameters for the transformation function additional to
 * 		the value from the xpath expression that is always the first parameter.
 * execute: The function to be executed. No xpath value is obtained. Instead the
 * 		recordNode of the source XML is put as default parameter to the function. All
 * 		other parameters are ignored. 
 * tokenized: If set to false no tokenizing will take place before the value is 
 * 		put into the index.
 */
var transformationDescriptions = [
  	// title
	{	"execute":{
			"funct":mapTitle,
			"params":[recordNode]
		}
	},
  	// summary
	{	"execute":{
			"funct":mapSummary,
			"params":[recordNode]
		}
	},
	// bounding box
	{	"execute":{
			"funct":mapBoundingBox,
			"params":[recordNode]
		}
	},
	// details
	{	"indexField":"water",
		"xpath":"/gk:waterlevels/gk:water"
	},	
	{	"indexField":"station",
		"xpath":"/gk:waterlevels/gk:station"
	},	
	{	"indexField":"station_id",
		"xpath":"/gk:waterlevels/gk:station_id"
	},	
	{	"indexField":"kilometer",
		"xpath":"/gk:waterlevels/gk:kilometer"
	},	
	{	"indexField":"date",
		"xpath":"/gk:waterlevels/gk:date",
		"transform":{
			"funct":DateUtil.formatDate
		}
	},	
	{	"indexField":"value",
		"xpath":"/gk:waterlevels/gk:value"
	},	
	{	"indexField":"unit",
		"xpath":"/gk:waterlevels/gk:unit"
	},	
	{	"indexField":"chart_url",
		"xpath":"/gk:waterlevels/gk:chart_url"
	},	
	{	"indexField":"trend",
		"xpath":"/gk:waterlevels/gk:trend"
	},	
	{	"indexField":"status",
		"xpath":"/gk:waterlevels/gk:status"
	},	
	{	"indexField":"comment",
		"xpath":"/gk:waterlevels/gk:comment"
	}	
];

document.add(new Field("datatype", "default", Field.Store.NO, Field.Index.ANALYZED));

// iterate over all transformation descriptions
var value;
for (var i in transformationDescriptions) {
	var t = transformationDescriptions[i];
	
	// check for execution (special function)
	if (hasValue(t.execute)) {
		if (log.isDebugEnabled()) {
			log.debug("Execute function: " + t.execute.funct.name)
		}
		call_f(t.execute.funct, t.execute.params)
	} else {
		if (log.isDebugEnabled()) {
			log.debug("Working on " + t.indexField)
		}
		var tokenized = true;
		// iterate over all xpath results
		var nodeList = xPathUtils.getNodeList(recordNode, t.xpath);
		if (nodeList && nodeList.getLength() > 0) {
			for (j=0; j<nodeList.getLength(); j++ ) {
				value = nodeList.item(j).getTextContent()
				// check for transformation
				if (hasValue(t.transform)) {
					var args = new Array(value);
					if (hasValue(t.transform.params)) {
						args = args.concat(t.transform.params);
					}
					value = call_f(t.transform.funct,args);
				}
				// check for NOT tokenized
				if (hasValue(t.tokenized)) {
					if (!t.tokenized) {
						tokenized = false;
					}
				}
				if (hasValue(value)) {
					addToDoc(t.indexField, value, tokenized);
				}
			}
		} else {
			// no node found for this xpath
			if (t.defaultValue) {
				value = t.defaultValue;
				// check for transformation
				if (hasValue(t.transform)) {
					var args = new Array(value);
					if (hasValue(t.transform.params)) {
						args = args.concat(t.transform.params);
					}
					value = call_f(t.transform.funct,args);
				}
				// check for NOT tokenized
				if (hasValue(t.tokenized)) {
					if (!t.tokenized) {
						tokenized = false;
					}
				}
				if (hasValue(value)) {
					addToDoc(t.indexField, value, tokenized);
				}
			}
		}
	}
}

function mapTitle(recordNode) {
	var part1 = xPathUtils.getString(recordNode, "/gk:waterlevels/gk:water");
	var part2 = xPathUtils.getString(recordNode, "/gk:waterlevels/gk:station");
	var part3 = xPathUtils.getString(recordNode, "/gk:waterlevels/gk:kilometer");
	addToDoc("title", part1+" "+part2+" (km "+part3+")", true);
}

function mapSummary(recordNode) {
	var part1 = xPathUtils.getString(recordNode, "/gk:waterlevels/gk:date");
	var part2 = xPathUtils.getString(recordNode, "/gk:waterlevels/gk:value");
	var part3 = xPathUtils.getString(recordNode, "/gk:waterlevels/gk:unit");
	addToDoc("summary", DateUtil.formatDate(part1)+": "+part2+""+part3, true);
}

function mapBoundingBox(recordNode) {
	var gmlEnvelope = xPathUtils.getNode(recordNode, "/gk:waterlevels/gml:boundedBy/gml:Envelope");
	if (hasValue(gmlEnvelope)) {
		var lowerCoords = xPathUtils.getString(gmlEnvelope, "gml:lowerCorner").split(" ");
		var upperCoords = xPathUtils.getString(gmlEnvelope, "gml:upperCorner").split(" ");
		addNumericToDoc("x1", lowerCoords[0], false); // west
		addNumericToDoc("x2", upperCoords[0], false); // east
		addNumericToDoc("y1", lowerCoords[1], false); // south
		addNumericToDoc("y2", lowerCoords[1], false); // north
	}
}

function addToDoc(field, content, tokenized) {
	if (typeof content != "undefined" && content != null) {
		if (log.isDebugEnabled()) {
			log.debug("Add '" + field + "'='" + content + "' to lucene index");
		}
		var analyzed = Field.Index.ANALYZED;
		if (!tokenized) analyzed = Field.Index.NOT_ANALYZED;
		document.add(new Field(field, content, Field.Store.YES, analyzed));
		document.add(new Field("content", content, Field.Store.NO, analyzed));
		document.add(new Field("content", LuceneTools.filterTerm(content), Field.Store.NO, Field.Index.ANALYZED));
	}
}

function addNumericToDoc(field, content) {
	if (typeof content != "undefined" && content != null) {
        try {
    		if (log.isDebugEnabled()) {
    			log.debug("Add numeric '" + field + "'='" + content + "' to lucene index.");
    		}
            document.add(new NumericField(field, Field.Store.YES, true).setDoubleValue(content));
        } catch (e) {
            if (log.isDebugEnabled()) {
                log.debug("Value '" + content + "' is not a number. Ignoring field '" + field + "'.");
            }
        }
	}
}

function hasValue(val) {
	if (typeof val == "undefined") {
		return false; 
	} else if (val == null) {
		return false; 
	} else if (typeof val == "string" && val == "") {
		return false;
	} else {
	  return true;
	}
}

function call_f(f,args) {
  f.call_self = function(ars) {
	  var callstr = "";
	  if (hasValue(ars)) {
		  for(var i = 0; i < ars.length; i++) {
			  callstr += "ars["+i+"]";
			  if(i < ars.length - 1) {
				  callstr += ',';
			  }
		  }
	  }
	  return eval("this("+callstr+")");
  };
  return f.call_self(args);
}


