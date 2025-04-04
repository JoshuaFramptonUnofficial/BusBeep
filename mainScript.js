// I have documented the following code to help whoever is reading this understand my thought process

let marker;           
let userLocationMarker;  
let circle;              
let map;                
let watchId = null;     
let selectedPlace = null;

// Global favorites list (array of favorite objects)
let favoritesList = [];

// The location rows in the table
let location1;
let location2;
let location3;
let location4;
let location5;
let coords1;
let coords2;
let coords3;
let coords4;
let coords5;

//simple mathematical conversion to radians from degrees
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function calculateDistance(latitude1, longitude1, latitude2, longitude2) { 
    const earthRadius = 6371000; // Earth's radius in meters
    const phi1 = toRadians(latitude1);
    const phi2 = toRadians(latitude2);
    const changePhi = toRadians(latitude2 - latitude1);
    const changeLambda = toRadians(longitude2 - longitude1);

    const a = Math.sin(changePhi / 2) * Math.sin(changePhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(changeLambda / 2) * Math.sin(changeLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c; // Distance in meters
    if (distance > 6371000) {
        console.log("Error present with location converter");
    }
    return distance;
}

function triggerAlert() {
    let alertSound = new Audio('audio.mp3');
    alertSound.play();
}

function getLocation() { 
    // Check if the browser supports geolocation
    if (navigator.geolocation) {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId); // Clear any existing watch
        }
        watchId = navigator.geolocation.watchPosition(showPosition, showError, {
            enableHighAccuracy: true, 
            maximumAge: 2000, 
            timeout: 5000 // Balance between accuracy and performance
        });
    } else {
        document.getElementById("setLocation").innerHTML = 
          "Your browser doesn't support location tracking, please use a location-enabled browser";
    }
}

function showPosition(position) {
    const radiusInput = document.getElementById("radius-input");
    const alertRadius = parseInt(radiusInput.value);
    const currentCoords = { 
        lat: position.coords.latitude, 
        lng: position.coords.longitude
    };

    // Create or update user location marker
    if (!userLocationMarker) {
        userLocationMarker = createMarker(currentCoords, 'FORWARD_CLOSED_ARROW', 'blue', 4);
    } else { 
        userLocationMarker.setPosition(currentCoords);
    }
    
    console.log("User location updated to:", currentCoords);

    if (selectedPlace) {
        const distance = calculateDistance(currentCoords.lat, currentCoords.lng, selectedPlace.lat, selectedPlace.lng);
        console.log("Distance to location:", distance, "meters");
        if (distance <= alertRadius) {
            triggerAlert();
        }
    }
}

function createMarker(coords, symbol, color, size) {
    return new google.maps.Marker({
        map: map.innerMap,
        position: coords,
        icon: {
            path: google.maps.SymbolPath[symbol],
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
            scale: size
        }
    });
}

function showError(error) {
    let errorMessage = " ";
    switch (error.code) {
        case error.PERMISSION_DENIED: 
            errorMessage = "Location access denied.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = "Your location is unavailable.";
            break;
        case error.TIMEOUT: 
            errorMessage = "Location request timed out.";
            break;
        default:
            errorMessage = "Error getting location.";
    }
    document.getElementById("setLocation").innerHTML = errorMessage;
}

async function startup() {
    await customElements.whenDefined('gmp-map'); // Ensure map element is defined
    map = document.querySelector("gmp-map");
    const placePicker = document.getElementById("place-picker");
    infoWindow = new google.maps.InfoWindow();

    // Update the location table cell references
    coords1 = document.getElementById("coords1");
    coords2 = document.getElementById("coords2");
    coords3 = document.getElementById("coords3");
    coords4 = document.getElementById("coords4");
    coords5 = document.getElementById("coords5");

    location1 = document.getElementById("location1");
    location2 = document.getElementById("location2");
    location3 = document.getElementById("location3");
    location4 = document.getElementById("location4");
    location5 = document.getElementById("location5");

    // Button references – renamed for clarity:
    const addFavouriteBtn = document.getElementById("favourite");           // Add favourite to table
    const exportFavoritesBtn = document.getElementById("download");        // Export favorites (download JSON)
    const importFavoritesBtn = document.getElementById("import");           // Import favorites (upload JSON)
    const setLocationBtn = document.getElementById("setLocation");

    const selectBtn1 = document.getElementById("selected1");
    const selectBtn2 = document.getElementById("selected2");
    const selectBtn3 = document.getElementById("selected3");
    const selectBtn4 = document.getElementById("selected4");
    const selectBtn5 = document.getElementById("selected5");

    // Place Picker Event Listener (search for a location)
    placePicker.addEventListener('gmpx-placechange', function () {
        const place = placePicker.value;
        console.log("Selected place object:", place);
        if (!place || !place.location) {
            window.alert("No details available for input:" + place.name);
            infoWindow.close();
            if (marker) marker.setPosition(null);
            if (circle) circle.setMap(null);
            return;
        }

        map.center = place.location;
        if (marker == null || marker == undefined) {
            marker = createMarker(place.location, 'CIRCLE', 'red', 7);
        } else {
            marker.setPosition(place.location);
        }
        
        const addressParts = place.formattedAddress.split(', ');
        const shortAddress = addressParts.length > 2 ? `${addressParts[1]}, ${addressParts[2]}` : place.formattedAddress;
        map.innerMap.setZoom(20);

        selectedPlace = {
            name: place.displayName,
            address: place.formattedAddress,
            lat: place.location.lat(),
            lng: place.location.lng(),
        };

        const radiusInput = document.getElementById("radius-input");
        const radiusValue = parseInt(radiusInput.value);
        console.log("Radius input:", radiusInput.value, "Parsed radius:", radiusValue);

        // Prepare a circle (do not display it yet)
        if (circle) {
            circle.setMap(null);
        }
        circle = new google.maps.Circle({
            map: null,
            radius: radiusValue,
            fillColor: '#32CD32',
            fillOpacity: 0.25,
            strokeColor: '#FFFFFF',
            strokeOpacity: 0.6,
            strokeWeight: 4,
            center: place.location
        });
    });

    // "Add Favourite" button: adds the currently selected location to the favorites table and list.
    addFavouriteBtn.addEventListener("click", () => {
        if (!selectedPlace) {
            alert("No location selected to add as favourite.");
            return;
        }
        if (location1.innerText.trim() === "") {
            location1.innerText = selectedPlace.name;
            coords1.innerText = selectedPlace.lat + "," + selectedPlace.lng;
            favoritesList[0] = selectedPlace;
            console.log("Added favourite at slot 1:", selectedPlace.name);
        } else if (location2.innerText.trim() === "") {
            location2.innerText = selectedPlace.name;
            coords2.innerText = selectedPlace.lat + "," + selectedPlace.lng;
            favoritesList[1] = selectedPlace;
            console.log("Added favourite at slot 2:", selectedPlace.name);
        } else if (location3.innerText.trim() === "") {
            location3.innerText = selectedPlace.name;
            coords3.innerText = selectedPlace.lat + "," + selectedPlace.lng;
            favoritesList[2] = selectedPlace;
            console.log("Added favourite at slot 3:", selectedPlace.name);
        } else if (location4.innerText.trim() === "") {
            location4.innerText = selectedPlace.name;
            coords4.innerText = selectedPlace.lat + "," + selectedPlace.lng;
            favoritesList[3] = selectedPlace;
            console.log("Added favourite at slot 4:", selectedPlace.name);
        } else if (location5.innerText.trim() === "") {
            location5.innerText = selectedPlace.name;
            coords5.innerText = selectedPlace.lat + "," + selectedPlace.lng;
            favoritesList[4] = selectedPlace;
            console.log("Added favourite at slot 5:", selectedPlace.name);
        } else {
            alert("Favourite slots are full! Please remove one before adding a new favourite.");
        }
    });

    // "Export Favorites" button: triggered by the "upload favourites" button (as per new mapping)
    exportFavoritesBtn.addEventListener("click", exportFavorites);

    // "Import Favorites" button: triggered by the "save favourites" button
    importFavoritesBtn.addEventListener("click", importFavorites);

    // "Toggle Tracking" (Set Location) button: creates a circle around the currently selected location.
    setLocationBtn.addEventListener('click', () => {
        if (watchId !== null) { // If location tracking is active, stop it
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
            if (circle) {
                circle.setMap(null);
            }
        } else { // Create a circle based on the selected location
            if (selectedPlace) {
                const radiusInput = document.getElementById("radius-input");
                const radiusValue = parseInt(radiusInput.value);
                const newRadius = isNaN(radiusValue) ? 100 : radiusValue;
                
                if (circle) {
                    circle.setMap(null);
                }
                circle = new google.maps.Circle({
                    map: map.innerMap,
                    radius: newRadius,
                    fillColor: '#FF0000',
                    fillOpacity: 0.35,
                    strokeColor: '#FFFFFF',
                    strokeOpacity: 0.6,
                    strokeWeight: 2,
                    center: { lat: selectedPlace.lat, lng: selectedPlace.lng }
                });
                console.log("Created circle with radius:", newRadius);
                alert(`Your location has been set to '${selectedPlace.name}'.`);
            }
            getLocation();
        }
    });

    // Favorite selection handler: common functionality for all "Select" buttons.
    function handleFavoriteSelection(favName, coordsField) {
        const coordsValue = coordsField.textContent.trim();
        const [lat, lng] = coordsValue.split(",").map(Number);
        if (isNaN(lat) || isNaN(lng)) {
            console.error("Invalid coordinates in", coordsField.id);
            return;
        }
        const latLng = new google.maps.LatLng(lat, lng);

        // Close any open info window
        if (infoWindow) {
            infoWindow.close();
        }

        // Remove existing circle and marker
        if (circle) {
            circle.setMap(null);
            circle = null;
        }
        if (marker) {
            marker.setMap(null);
            marker = null;
        }

        // Place a red marker at the favorite location and center the map there
        marker = createMarker(latLng, 'CIRCLE', 'red', 7);
        map.innerMap.setCenter(latLng);

        // Update the selectedPlace object
        selectedPlace = {
            name: favName,
            lat: lat,
            lng: lng
        };
    }

    // Assign the same handler to all "Select" buttons
    selectBtn1.addEventListener("click", () => { handleFavoriteSelection("Favourite 1", coords1); });
    selectBtn2.addEventListener("click", () => { handleFavoriteSelection("Favourite 2", coords2); });
    selectBtn3.addEventListener("click", () => { handleFavoriteSelection("Favourite 3", coords3); });
    selectBtn4.addEventListener("click", () => { handleFavoriteSelection("Favourite 4", coords4); });
    selectBtn5.addEventListener("click", () => { handleFavoriteSelection("Favourite 5", coords5); });
}

// ------------------ Export and Import Functions ------------------

function exportFavorites() {
    // Create an export object with a comment and the current favorites list.
    const exportData = {
        comment: "DO NOT MODIFY THIS FILE MANUALLY UNLESS YOU KNOW WHAT YOU ARE DOING",
        favorites: favoritesList
    };
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    // Ask the user for a filename (default to "favorites.json")
    const filename = prompt("Enter filename for export", "favorites.json") || "favorites.json";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importFavorites() {
    // Create a hidden file input element
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const json = JSON.parse(e.target.result);
                if (!json.favorites || !Array.isArray(json.favorites)) {
                    alert("Invalid favorites file format.");
                    return;
                }
                // Replace the current favorites list with the imported data
                favoritesList = json.favorites;
                // Update the favorites table based on the new favorites list
                updateFavoritesTable();
            } catch (err) {
                alert("Error parsing file: " + err.message);
            }
        };
        reader.readAsText(file);
    });
    fileInput.click();
}

function updateFavoritesTable() {
    // Update the table cells from the global favoritesList.
    const locations = [location1, location2, location3, location4, location5];
    const coords = [coords1, coords2, coords3, coords4, coords5];
    for (let i = 0; i < locations.length; i++) {
         if (favoritesList[i]) {
             locations[i].innerText = favoritesList[i].name;
             coords[i].innerText = favoritesList[i].lat + "," + favoritesList[i].lng;
         } else {
             locations[i].innerText = "";
             coords[i].innerText = "";
         }
    }
}

document.addEventListener('DOMContentLoaded', startup);
