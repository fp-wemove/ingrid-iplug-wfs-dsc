/*
 * Copyright (c) 2013 wemove digital solutions. All rights reserved.
 */

package de.ingrid.iplug.wfs.dsc.cache.impl;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.w3c.dom.Document;

import de.ingrid.iplug.wfs.dsc.cache.ExecutionContext;
import de.ingrid.iplug.wfs.dsc.wfsclient.WFSCapabilities;
import de.ingrid.iplug.wfs.dsc.wfsclient.WFSClient;
import de.ingrid.iplug.wfs.dsc.wfsclient.WFSFactory;

/**
 * This UpdateStrategy fetches each feature type via a paging mechanism and NOT in one call !
 * This avoids memory problems !
 */
public class PagingUpdateStrategy extends AbstractUpdateStrategy {

	final protected static Log log = LogFactory.getLog(PagingUpdateStrategy.class);

	/**	The maximum number of features to fetch in one call. */
	int maxFeatures = 1000;

	protected ExecutionContext context = null;

	@Override
	public List<String> execute(ExecutionContext context) throws Exception {

		this.context = context;
		WFSFactory factory = context.getFactory();

		// prepare the filter set
		Set<Document> filterSet = new HashSet<Document>();
		for (String filterStr : context.getFilterStrSet()) {
			Document filterDoc = this.createFilterDocument(filterStr);
			filterSet.add(filterDoc);
		}

		// set up client
		WFSClient client = factory.createClient();

		// get all feature types from the capabilities document
		WFSCapabilities capabilities = client.getCapabilities();
		String[] typeNames = capabilities.getFeatureTypeNames();

		List<String> allRecordIds = new ArrayList<String>();

//		int numFeatureTypesFetched=0;
		for (String typeName : typeNames) {
			if (log.isInfoEnabled()) {
				log.info("Fetching features of type "+typeName+"...");
			}

			// fetch total number of features of the current type
			int totalNumRecords = 0;
			try {
				totalNumRecords = this.fetchTotalNumRecords(client, typeName);
				if (log.isInfoEnabled()) {
					log.info("Fetched total number of features of type '" + typeName + "' -> " + totalNumRecords);
				}

			} catch (Exception ex) {
				log.error("Problems fetching total number of features of type '" + typeName + "', we skip these ones !", ex);
				continue;
			}

			// fetch all features PAGED !

			int numRequests = (totalNumRecords / maxFeatures);
			if (totalNumRecords % maxFeatures > 0) {
				numRequests++;
			}

			for (int i=0; i<numRequests; i++) {
				int startIndex = i * maxFeatures;
				if (log.isInfoEnabled()) {
					log.info("Fetching features of type "+typeName+", maxFeatures=" +
						maxFeatures + ", startIndex=" + startIndex + " ...");
				}
				try {
					List<String> fetchedIds = fetchRecordsPaged(client, typeName, filterSet, true, maxFeatures, startIndex);
					allRecordIds.addAll(fetchedIds);

				} catch (Exception ex) {
					log.error("Problems fetching features of type '" + typeName +", maxFeatures=" +
						maxFeatures + ", startIndex=" + startIndex + ", we skip these ones !", ex);
				}
			}

			// activate this for local testing of restricted number of feature types !
/*
			numFeatureTypesFetched++;
			if (numFeatureTypesFetched > 5) {
				break;
			}
*/
		}
		return allRecordIds;
	}

	/**
	 * Set the maximum number of features to fetch in one call to the WFS server.
	 */
	public void setMaxFeatures(int maxFeatures) {
		this.maxFeatures = maxFeatures;
	}

	@Override
	public ExecutionContext getExecutionContext() {
		return this.context;
	}

	@Override
	public Log getLog() {
		return log;
	}
}
