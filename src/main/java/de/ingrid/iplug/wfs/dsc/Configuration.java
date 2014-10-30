package de.ingrid.iplug.wfs.dsc;

import java.util.Properties;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.tngtech.configbuilder.annotation.propertyloaderconfiguration.PropertiesFiles;
import com.tngtech.configbuilder.annotation.propertyloaderconfiguration.PropertyLocations;
import com.tngtech.configbuilder.annotation.valueextractor.DefaultValue;
import com.tngtech.configbuilder.annotation.valueextractor.PropertyValue;

import de.ingrid.admin.IConfig;
import de.ingrid.admin.command.PlugdescriptionCommandObject;

@PropertiesFiles( {"config"} )
@PropertyLocations(directories = {"conf"}, fromClassLoader = true)
public class Configuration implements IConfig {
    
    private static Log log = LogFactory.getLog(Configuration.class);
    
    @PropertyValue("plugdescription.fields")
    public String fields;
    
    @PropertyValue("plugdescription.serviceUrl")
    @DefaultValue("")
    public String serviceUrl;
   
    @Override
    public void initialize() {
    }

    @Override
    public void addPlugdescriptionValues( PlugdescriptionCommandObject pdObject ) {
        pdObject.put( "iPlugClass", "de.ingrid.iplug.wfs.dsc.WfsDscSearchPlug");
        
    	if(pdObject.getFields().length == 0){
        	if(fields != null){
        		String[] fieldsList = fields.split(",");
        		for(String field : fieldsList){
        			pdObject.addField(field);
        		}
        	}
    	}
        
        pdObject.put("serviceUrl", serviceUrl);
    }

    @Override
    public void setPropertiesFromPlugdescription( Properties props, PlugdescriptionCommandObject pd ) {
    	if(pd.get("serviceUrl") != null){
        	props.setProperty("plugdescription.serviceUrl", (String) pd.get("serviceUrl"));
    	}
    }
}
