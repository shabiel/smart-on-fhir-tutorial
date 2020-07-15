const ICN_URN = 'urn:oid:2.16.840.1.113883.4.349';
const ICN_REGEX = /^\d{9,12}V\d{6}$/
const STA_REGEX = /^\d{3}$/

function createMHALink(station, ICN)
{

  //station number validate
  if (!STA_REGEX.test(station)) {
    station = 999;
    document.getElementById('finalStation').style.color = "red";
  }

  //ICN validate
  if (!ICN_REGEX.test(ICN)) {
    ICN = "5000000347V502052";
    document.getElementById('finalICN').style.color = "red";
  }

  //window.location.href = '/app/home/?station=964&poi=100850';
  var link = '/app/home/?station=' + station +'&poi=' + ICN;

  document.getElementById('finalStation').innerText = station;
  document.getElementById('finalICN').innerText = ICN;
  document.getElementById('mhalink').href = link;
  document.getElementById('linkPanel').style.display = "block";
}


FHIR.oauth2.ready().then(function(client) {
  var myICN;
  var orgRef;
  var myOrganization;
  var myLocation;
  var stationNumber;

  // Render the current patient (or any error)
  client.patient.read().then(function(pt) {
    //debug
    console.log(pt);
    //debug

    // Get all ids with specific type that is the ICN
    var icnids = pt.identifier.filter(function(item) { 
      return item.system === ICN_URN;
    });

    if (icnids && icnids.length) {
      myICN = icnids[0].value;
    }
    else {
      myICN = '';
    }

    var gender = pt.gender;
    var birthdate = pt.birthDate;

    var fname = '';
    var lname = '';

    if (typeof pt.name[0] !== 'undefined') {
      fname = pt.name[0].given.join(' ');
      lname = pt.name[0].family;
    }

    document.getElementById('holder').style.display = "block";
    document.getElementById('loading').style.display = "none";
    document.getElementById('fname').innerText = fname;
    document.getElementById('lname').innerText = lname;
    document.getElementById('gender').innerText = gender;
    document.getElementById('birthdate').innerText = birthdate;
    document.getElementById('ICN').innerText = myICN;

    // Put identifiers in table
    var table = document.getElementById('ptIdentifiers');
    pt.identifier.forEach(function(item) {
      var row = table.insertRow();
      var cell = row.insertCell();
      cell.appendChild(document.createTextNode(item.id));
      var cell = row.insertCell();
      cell.appendChild(document.createTextNode(item.system));
      var cell = row.insertCell();
      cell.appendChild(document.createTextNode(item.value));
      var cell = row.insertCell();
      cell.appendChild(document.createTextNode(item.system === ICN_URN));
    });
  },
  function(error)  {
    document.getElementById('errors').innerHTML += '<p>' + error.message + '</p>';
  }
  )
  .then( function() {
    // Render the current encounter
    client.encounter.read().then(
      function(enc) {
        //debug
        console.log(enc);
        //debug
        var myLocation;
        if (enc.location && enc.location.length)
        {
          myLocation = enc.location[0].location.display;
        }
        else
        {
          myLocation = '';
        }
        stationNumber = myLocation.substring(0,3);
        document.getElementById('locName').innerText = myLocation;
        document.getElementById('sta').innerText = stationNumber;
        if (enc.serviceProvider && enc.serviceProvider.reference) {
          orgRef = enc.serviceProvider.reference;
        }
        createMHALink(stationNumber, myICN);
      },
      function(error) {
        document.getElementById('errors').innerHTML += '<p>' + error.message + '</p>';
      }
    )
    .then( function() {
      if (!orgRef) {
        return;
      }
      // Get organization data
      client.request(orgRef).then(
        function(org) {
          //debug
          console.log(org);
          //debug
          myOrganization = org.name;
          document.getElementById('orgName').innerText = myOrganization;

          var table = document.getElementById('orgIdentifiers');
          org.identifier.forEach(function(item) {
            var row = table.insertRow();
            var cell = row.insertCell();
            cell.appendChild(document.createTextNode(item.system));
            var cell = row.insertCell();
            cell.appendChild(document.createTextNode(item.value));
            var cell = row.insertCell();
            cell.appendChild(document.createTextNode(STA_REGEX.test(item.value)));
          });

          // Timer to jump
          var time = 10;
          var interval = setInterval(function() {
            time--;
            document.getElementById('redirectTimer').innerText = 'Redirecting to MHA Web in ' + time;
            if (time <= 0) {
              clearInterval(interval);
              //window.location.href = '/app/home/?station=964&poi=100850';
            }
          }, 1000); //setInterval
        },
        function(error) {
          document.getElementById('errors').innerHTML += '<p>' + error.message + '</p>';
        }
      );
    });
  });
});
