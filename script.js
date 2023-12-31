console.clear();
//Metropolitan Museum API
const apiUrlObj =
  "https://collectionapi.metmuseum.org/public/collection/v1/objects";

const apiUrl = "https://collectionapi.metmuseum.org/public/collection/v1/";

const apiUrlSearch =
  "https://collectionapi.metmuseum.org/public/collection/v1/search?title=true&hasImages=true";

let MaxnumDisplayed = 24; //36 //48

let shuffledObjectIDs,
  defaultShuffle = 1,
  lastShuffleValue = "",
  artworksCount = 0;

let departmentKey = "",
  searchKey = "";

//Total number of artworks found
const totalElement = document.createElement("p");
document.getElementById("total").appendChild(totalElement);

//show loading screen
function showLoadingScreen(load) {
  if (load) {
    //make user wait for full load
    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.style.display = "flex";
    document.body.style.overflowY = "hidden";
  } else {
    //replace fetch more atworks button with loading text
    const loadingText = document.getElementById("show-more");
    loadingText.innerHTML = "Loading...";
    loadingText.style.color = "white";
    loadingText.style.fontSize = "1.3em";
    loadingText.style.margin = "20px";
    //MaxnumDisplayed = 12;
  }

  //disable buttons while adding more artworks
  const nodeList = document.querySelectorAll("button");
  for (let i = 0; i < nodeList.length; i++) {
    nodeList[i].setAttribute("disabled", "disabled");
  }
}

//hide loading screen
function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  loadingScreen.style.display = "none";
  document.body.style.overflowY = "visible";

  //remove disabled attribute from buttons
  const nodeList = document.querySelectorAll("button");
  for (let i = 0; i < nodeList.length; i++) {
    nodeList[i].removeAttribute("disabled");
  }
  //re-add fetch more atworks button
  const loadingText = document.getElementById("show-more");
  loadingText.innerHTML =
    '<button onclick="fetchArtworks()">Show more</button>';
}

async function fetchArtworks(departmentFilter = "", load, search = "") {
  showLoadingScreen(load);
  return new Promise(async (resolve, reject) => {
    let response = null;
    try {
      const artwork = document.getElementById("artworks");
      //department and search filter if provided
      if (departmentFilter && search) {
        artwork.innerHTML = "";
        response = await fetch(
          `${apiUrl}search?departmentId=${departmentFilter}&title=true&hasImages=true&q=${search}`
        );
        //department filter if provided
      } else if (departmentFilter) {
        artwork.innerHTML = "";
        if (departmentFilter != "All") {
          response = await fetch(
            `${apiUrlObj}?departmentIds=${departmentFilter}`
          );
        } else {
          response = await fetch(apiUrlObj);
        }
        //search filter if provided
      } else if (search) {
        console.log(search);
        artwork.innerHTML = "";
        response = await fetch(`${apiUrlSearch}&q=${search}`);

        //no filter
      } else {
        response = await fetch(apiUrlObj);
      }

      const data = await response.json();

      //shows total number of artworks found with the especifications
      if (load) {
        totalElement.innerHTML = `Total artworks found: ${data.total}`;
      }
      await displayArtworks(data, load); //finish before moving on
      attachArtworkClickListeners(); //attach popup to each artwork
      sortArtworks(); //sort after fetching more artworks
      hideLoadingScreen();
      resolve();
    } catch (error) {
      console.error("Error fetching data:", error);
      hideLoadingScreen();
      reject(error);
    }
  });
}

//display artworks on the page
async function displayArtworks(data, load) {
  const artworksContainer = document.getElementById("artworks");

  // check if the response contains data
  if (data && data.objectIDs) {
    let displayedArtworksCount = 0;

    //randomize artwork order at load
    if (load) {
      shuffledObjectIDs = shuffleArray(data.objectIDs);
      artworksCount = 0;
    } else {
      //remove already shown results from the array
      shuffledObjectIDs = shuffledObjectIDs.slice(artworksCount);
    }

    for (const artworkID of shuffledObjectIDs) {
      if (displayedArtworksCount >= MaxnumDisplayed) {
        break;
      }

      try {
        //fetch each artwork info
        const response = await fetch(`${apiUrlObj}/${artworkID}`);
        const artworkData = await response.json();

        artworksCount++;
        //only show artworks with images
        if (artworkData.primaryImage || artworkData.primaryImageSmall) {
          const artworkElement = createArtworkElement(artworkData);

          //defines default sorting arrangement
          defaultShuffle += 10;
          artworkElement.setAttribute("number", defaultShuffle);
          
          artworksContainer.appendChild(artworkElement);

          displayedArtworksCount++;
        }
      } catch (error) {
        console.error("Error fetching artwork details:", error);
      }
    }
  } else {
    artworksContainer.innerHTML = "No artworks found.";
  }
}

//shuffle an array using the Fisher-Yates algorithm (makes sure there are no repeats)
function shuffleArray(array) {
  const shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

//sort artworks
function sortArtworks(check) {
  let selectedOption;
  if (check == "filter") {
    //sort existing artwork
    const sortSelect = document.getElementById("sort-select");
    selectedOption = sortSelect.value;
    lastShuffleValue = selectedOption;
  } else {
    //sort added artwork acording to sorting already in use
    selectedOption = lastShuffleValue;
  }

  const artworksContainer = document.getElementById("artworks");
  const artworks = Array.from(artworksContainer.children);

  //compare and sort artworks
  //date strings are not reliable enough for int sorting (counting)
  artworks.sort((a, b) => {
    const keyA = getSortKey(a, selectedOption);
    const keyB = getSortKey(b, selectedOption);

    if (selectedOption.includes("reverse")) {
      if (keyA < keyB) {
        return 1;
      } else if (keyA > keyB) {
        return -1;
      } else {
        return 0;
      }
    } else {
      if (keyA < keyB) {
        return -1;
      } else if (keyA > keyB) {
        return 1;
      } else {
        return 0;
      }
    }
  });

  //clear artworks and append the new sorted ones
  artworksContainer.innerHTML = "";
  artworks.forEach((artwork) => artworksContainer.appendChild(artwork));
}
//get the sorting key based on the selected option
function getSortKey(artwork, selectedOption) {
  switch (selectedOption) {
    case "no":
      return artwork.getAttribute("number");
    case "title":
      return artwork.querySelector(".title").textContent.toLowerCase();
    case "title-reverse":
      return artwork.querySelector(".title").textContent.toLowerCase();
    case "date":
      return artwork.getAttribute("data-date").toLowerCase();
    case "date-reverse":
      return artwork.getAttribute("data-date").toLowerCase();
    default:
      return "";
  }
}

//create HTML elements for an artwork
function createArtworkElement(artworkData) {
  const artworkElement = document.createElement("div");
  artworkElement.classList.add("artwork");

  //check if object tag isn't empty and create element
  function addInfo(label, value) {
    if (value) {
      let infoElement;
      infoElement = document.createElement("p");
      if (label === "Date") {
        infoElement.classList.add("date");
      } else if (label === "Title") {
        infoElement.classList.add("title");
      }
      infoElement.innerHTML = `<strong>${label}:</strong> <span class="${label.toLowerCase()}">${value}</span>`;
      artworkElement.appendChild(infoElement);
    }
  }

  const imageElement = document.createElement("img");
  imageElement.src = artworkData.primaryImage || artworkData.primaryImageSmall;
  imageElement.alt = artworkData.title;
  imageElement.onerror = () => {
    imageElement.src = "placeholder.png";
    imageElement.alt = "Image not available";
  };
  imageElement.classList.add("masonry-content");
  artworkElement.appendChild(imageElement);

  addInfo("Title", artworkData.title);
  //addInfo("Artist", artworkData.artistDisplayName);
  //addInfo("Date", artworkData.objectDate);
  //addInfo("ID", artworkData.objectID);

  //set artwork info for popup
  artworkElement.setAttribute("data-title", artworkData.title);
  artworkElement.setAttribute("data-image", artworkData.primaryImage);
  artworkElement.setAttribute(
    "data-artist",
    artworkData.artistDisplayName || "Unknown"
  );
  artworkElement.setAttribute("data-date", artworkData.objectDate || "Unknown");
  artworkElement.setAttribute(
    "data-department",
    artworkData.department || "Unknown"
  );
  artworkElement.setAttribute("data-medium", artworkData.medium || "Undefined");
  artworkElement.setAttribute(
    "data-culture",
    artworkData.culture || "Undefined"
  );
  artworkElement.setAttribute(
    "data-country",
    artworkData.country || "Undefined"
  );
  artworkElement.setAttribute("data-id", artworkData.objectID);

  return artworkElement;
}

//popup with artwork information
function openPopup(artworkData) {
  const popup = document.getElementById("popup");
  const popupTitle = document.getElementById("popup-title");
  const popupImage = document.getElementById("popup-image");
  const popupArtist = document.getElementById("popup-artist");
  const popupDate = document.getElementById("popup-date");
  const popupDepartment = document.getElementById("popup-department");
  const popupMedium = document.getElementById("popup-medium");
  const popupCulture = document.getElementById("popup-culture");
  const popupCountry = document.getElementById("popup-country");

  //artwork information
  popupTitle.innerHTML = artworkData.title;
  popupImage.textContent = artworkData.primaryImage;
  popupImage.onerror = () => {
    popupImage.src = "placeholder.png";
    popupImage.alt = "Image not available";
  };
  popupArtist.textContent = `Artist: ${artworkData.artist || "Unknown"}`;
  popupDate.textContent = `Date: ${artworkData.date || "Unknown"}`;
  popupDepartment.textContent = `Department: ${
    artworkData.department || "Unknown"
  }`;
  popupMedium.textContent = `Medium: ${artworkData.medium || "Unknown"}`;
  popupCulture.textContent = `Culture: ${artworkData.culture || "Unknown"}`;
  popupCountry.textContent = `Country: ${artworkData.country || "Unspecified"}`;

  //create and set the image
  const imageElement = document.createElement("img");
  imageElement.src = artworkData.image || "placeholder.png";
  imageElement.style.maxWidth = "100%";
  popupImage.innerHTML = "";
  popupImage.appendChild(imageElement);

  popup.style.display = "flex";
}

//close the popup
function closePopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";
}

//attach click event listeners to artworks
function attachArtworkClickListeners() {
  const artworksContainer = document.getElementById("artworks");
  const artworks = Array.from(artworksContainer.children);

  artworks.forEach((artwork) => {
    artwork.addEventListener("click", () => {
      const artworkData = {
        title: artwork.getAttribute("data-title"),
        artist: artwork.getAttribute("data-artist"),
        date: artwork.getAttribute("data-date"),
        image: artwork.getAttribute("data-image"),
        department: artwork.getAttribute("data-department"),
        medium: artwork.getAttribute("data-medium"),
        culture: artwork.getAttribute("data-culture"),
        country: artwork.getAttribute("data-country"),
        id: artwork.getAttribute("data-id"),
      };
      openPopup(artworkData);
    });
  });
}

//fetch, display and eventListeners while loading
fetchArtworks("", true);

//update department filter
function filterArtworks() {
  const filterSelect = document.getElementById("filter-department");
  const selectedDepartment = filterSelect.value;
  departmentKey = selectedDepartment; //save value for future uses
  fetchArtworks(selectedDepartment, true, searchKey)
    //.then(() => attachArtworkClickListeners())
    .catch((error) => console.error("Error filtering artworks:", error));
}

//update search filter
function searchArtworks() {
  const searchSelect = document.getElementById("searchbarId").value;
  searchKey = searchSelect; //save value for future uses
  fetchArtworks(departmentKey, true, searchSelect)
    //.then(() => attachArtworkClickListeners())
    .catch((error) => console.error("Error searching artworks:", error));
}