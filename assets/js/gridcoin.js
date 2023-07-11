const allPlatforms = ["win64", "win32", "macos_arm", "macos"];
var platformsMissed = [...allPlatforms];

function show(element) {
  element.style.display = "";
}

function onScroll() {
    if ($(document).scrollTop() > 50) {
        $(".navbar").addClass("navbar-scroll");
    } else {
        $(".navbar").removeClass("navbar-scroll");
    }
}

/**
 * Add listeners to the tabs
 * Switch tab contnent upon click
 * Scroll to the tab posibion
 */
function initTabs() {
  $('.nav-tabs a').click(function () {
    if (window.location.hash !== this.hash) {
      window.location.hash = this.hash;
    }
  });
}

/**
 * Check current hash
 * Act: try to find the tab
 * Change tab content, scroll to the tab
 */
function handleTabSwitch() {
  var hash = window.location.hash;
  if (hash) {
    var tab = $('.nav-tabs a[href="' + hash + '"]');
    if (tab.length) {
      tab.tab('show');
      // Timeout is crusual to neglate tab switch effect time
      setTimeout(() => scrollToTheTab(tab), 100);
    }
  }
}

function scrollToTheTab(target) {
  var targetPosition = target.offset().top - 130;
  $('html, body').animate({
    'scrollTop': targetPosition
  }, 50, 'swing');
}

// $(document).ready(function () {
//     onScroll();
//     $(document).on("scroll", onScroll);

//     initTabs();
//     handleTabSwitch();
//     $(window).bind('hashchange', handleTabSwitch);
// });

//Enable bootstrap tooltips.
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})

function doOtherPlatformsMatch(targetPlatform, name) {

  for (let comparePlatform of allPlatforms) {

    if (comparePlatform.length >= targetPlatform.length // don't match macos for macos_arm but do the other way around 
      && comparePlatform !== targetPlatform
      && name.includes(targetPlatform)
      && name.includes(comparePlatform)
    ) {
      return true;
    }

  }

  return false;
}

function updateDownloads(data, platforms = allPlatforms, previousVersion = false) {

  if (!previousVersion) {
    document.getElementById("wallet-version").textContent = 'Current Wallet Version: ' + data.name;
  }

  let hotfixes = [];

  for (let assetFile of data.assets) {

    const name = assetFile.name;
    const downloadURL = assetFile.browser_download_url;

    if (name.includes(".SHA256")) {
      continue;
    }

    for (let platform of platforms) {
      if (name.includes(platform) && !doOtherPlatformsMatch(platform, name)) {

        if (name.includes("hotfix")) {
          hotfixes.push(platform);
        } else if (hotfixes.includes(platform)) {
          break; //if a hotfix already exists, don't update the file
        }

        const platformButton = document.getElementById(platform);
        platformButton.href = downloadURL;
        show(platformButton);

        if (name.includes("min")) {
          const startOfMinVersion = name.indexOf("min-") + 4;
          const endOfFilename = name.lastIndexOf(".");
          const minVersion = name.slice(startOfMinVersion, endOfFilename);

          platformButton.textContent += " (min OS: " + minVersion + ")";
        }

        if (previousVersion) {
          const versionWarn = document.getElementById(platform + "-version-warn");
          versionWarn.textContent += data.name;
          show(versionWarn);
        }

        platformsMissed = platformsMissed.filter(value => value !== platform); //remove platform from missed list

        break;
      }
    }
  }
}

function fillInMissing() {
  if (platformsMissed.length > 0) {
    fetch("https://api.github.com/repos/gridcoin-community/Gridcoin-Research/releases")
      .then(releases => releases.json())
      .then(releases => {
        for (let release of releases) {
          updateDownloads(release, platformsMissed, true);
          if (platformsMissed.length === 0) {
            break;
          }
        }
      })
  }
}

if (document.getElementById("wallet-version")) { //only get version data on pages where version number and download links are needed
  fetch("https://api.github.com/repos/gridcoin-community/Gridcoin-Research/releases/latest")
    .then(response => response.json())
    .then(updateDownloads)
    .then(fillInMissing)
}