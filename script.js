$(document).ready(function() {
   
   $("#searchButton").click(function() {
        var keyword = $("#searchField").val();
        
        var sparqlQuery = 'prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>  \
        prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> \
        prefix foaf: <http://xmlns.com/foaf/0.1/> \
        prefix db:<http://dbpedia.org/ontology/> \
        prefix tisc:<http://observedchange.com/tisc/ns#> \
        SELECT DISTINCT ?name ?label ?address ?lat ?long WHERE{ \
            ?person a foaf:Person; \
                foaf:name ?name; \
                foaf:firstName ?firstName; \
                foaf:familyName ?familyName . \
            {?person foaf:name ?name FILTER regex(?name, "'+keyword+'", "i")} \
            UNION {?person foaf:firstName ?firstName FILTER regex(?firstName, "'+keyword+'", "i")} \
            UNION {?person foaf:familyName ?familyName FILTER regex(?familyName, "'+keyword+'", "i")}. \
            ?peopleorganization foaf:member ?person . \
            ?peopleorganization rdfs:label ?label . \
            ?buildingorg rdfs:label ?label2 . \
            FILTER(str(?label)=str(?label2)) \
            ?buildingorg tisc:locatedAt ?building . \
            ?building db:address ?address . \
            ?building geo:lat ?lat . \
            ?building geo:long ?long . \
        } \
        GROUP BY ?name ?label ?address ?lat ?long';
    
    var encodedQuery = encodeURIComponent(sparqlQuery);
        
        $.ajax({ url: "http://data.aalto.fi/sparql?query="+encodedQuery+"&output=json",
               cache: false,
               dataType: 'jsonp',
               success: function(data){
                // node = jQuery.parseJSON(data);
                // var table = $
                console.log(data);
                }
        });    
    });
    
    
      var queryUrl = "http://publishmydata.com/sparql.json?q=PREFIX+rdfs%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0D%0A%0D%0ASELECT+%3Fname+%3Fnorthing+%3Feasting+WHERE+%7B%0D%0A%0D%0A++%3Fschool+%3Chttp%3A%2F%2Feducation.data.gov.uk%2Fdef%2Fschool%2FdistrictAdministrative%3E+%3Chttp%3A%2F%2Fstatistics.data.gov.uk%2Fid%2Flocal-authority-district%2F00BN%3E+.+%0D%0A%0D%0A++%3Fschool+rdfs%3Alabel+%3Fname+.%0D%0A%0D%0A++%3Fschool+%3Chttp%3A%2F%2Feducation.data.gov.uk%2Fdef%2Fschool%2FphaseOfEducation%3E+%3Chttp%3A%2F%2Feducation.data.gov.uk%2Fdef%2Fschool%2FPhaseOfEducation_Secondary%3E+.%0D%0A%0D%0A++%3Fschool+%3Chttp%3A%2F%2Fdata.ordnancesurvey.co.uk%2Fontology%2Fspatialrelations%2Fnorthing%3E+%3Fnorthing+.%0D%0A%0D%0A++%3Fschool+%3Chttp%3A%2F%2Fdata.ordnancesurvey.co.uk%2Fontology%2Fspatialrelations%2Feasting%3E+%3Feasting+.%0D%0A%7D";
    
    
});