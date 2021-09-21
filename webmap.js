var attr_col='None'
var map = L.map('map').setView([15.632, -61.45], 15);
map.dragging.disable();
map.scrollWheelZoom.disable();
L.esri.tiledMapLayer({
    maxZoom:20,
    minZoom: 14,
  url: 'https://tiles.arcgis.com/tiles/fpPKDlJ3n8eBtEzb/arcgis/rest/services/RiskChanges_Basemap_v2/MapServer'
}).addTo(map);

var info = L.control();

info.onAdd = function (map) {
this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
this.update();
return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function () {
this._div.innerHTML = '<h4>Risk Information</h4>';
};

info.addTo(map);

// get color depending on population density value
function getColor(d) {
    return  d>100000? '#892813' ://dark red
            d > 10000 ? '#d93c1a' : //red
            d > 5000  ? '#e88312' ://orange
            d > 1000  ? '#e8d112' ://yellow
            d > 0  ? '#1eab07' ://green
                        '#FFEDA0';
}

function style(feature,attribute) {
    
    return {
        weight: 0.8,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.4,
        fillColor: getColor(feature.properties[attr_col])
    };
}
function loaddata(){
    //attr_col= #add name here

    

    var Alternative = document.getElementById('Alternative');
    var Scenario =document.getElementById('Scenario');
    var Frequency = document.getElementById('Frequency');
    var Hazard =document.getElementById('Hazard');
    var Year = document.getElementById('Year');
    
    attr_col=Hazard.value+'_'+Frequency.value+'_'+Year.value+'_'+Alternative.value+'_'+Scenario.value+'_PH' //LS_50_2020_A2_S0_PH
    console.info(attr_col)
    map.eachLayer(function(layer) {
if (!!layer.toGeoJSON) {
map.removeLayer(layer);
}
});
    var geojson = L.geoJson(hazardData, {
    style: style,
}).addTo(map);
info._div.innerHTML = '<h4>Risk Information:</h4><br>'+'<b>Hazard Type: </b>'+Hazard.options[Hazard.selectedIndex].text+'<br>'
                        +'<b>Alternative: </b>'+Alternative.options[Alternative.selectedIndex].text+'<br>'
                        +'<b>Scenario: </b>'+Scenario.options[Scenario.selectedIndex].text+'<br>'
                        +'<b>Frequency: </b>'+Frequency.options[Frequency.selectedIndex].text+'<br>'
                        +'<b>Computation Year: </b>'+Year.options[Year.selectedIndex].text+'<br>';

}

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

var div = L.DomUtil.create('div', 'info legend'),
    grades = [0, 1000, 5000, 10000, 100000],
    labels = ['Low','Medium','High','Very High','Extreme'];

// loop through our density intervals and generate a label with a colored square for each interval
for (var i = 0; i < grades.length; i++) {
    div.innerHTML +=
        '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
        labels[i]+'<br>';
}

return div;
};

legend.addTo(map);