/*
Unfortunately, the 2d version doesn't put the order ID (y code) anywhere on the page
I may be able to extract it if I can find the correct time to grab data from the scan field,
but I'd need some special logic depending on which version is runninng. 

For now, I've made it so that if the y code is '' it just skips commiting the barcode.
Maybe I can make it check for duplicates differently? Or I need to figure out how to 
grab the y code from the scan.  

Maybe just focus on 1d for now? IDK
*/

const VALIDATE_PARENT_DIV = "#Snippet3";
const UPDATE_ADDRESS_BUTTON = "#select-alternative-address";
// Validate button is always ID:validate. Class can be class="validate" class="validate valid" class="validate invalid"
const VALIDATE_BUTTON = "#validate";
const VALIDATE_BUTTON_VALID = "#validate.valid";
const VALIDATE_BUTTON_INVALID = "#validate.invalid";
const VALIDATE_BUTTON_VALIDATE = "#validate.validate";

// Print Button. can be either class: "btn-success widget-el  disabled" or class: "btn-success widget-el  "
const PRINT_BUTTON_PARENT_DIV = "#Container3";
const PRINT_BUTTON_TAG = "#ShipButton";
const PRINT_BUTTON_READY = "#ShipButton.btn-success.widget-el";
const PRINT_BUTTON_NOT_READY = "#ShipButton.btn-success.widget-el.disabled";

// Weight Button
const WEIGH_BUTTON_ID = "#weight-button";

// Error Selectors
const ERROR_CONTAINER_SELECTOR = ".messenger-body.cf.messenger-error";
const ERROR_CONTENT_SELECTOR = ".messenger-content";

// 2d Scan field
const SCAN_TEXT_AREA_ID = "#ShipTo-textArea";

// zip code field
const ZIP_CODE_ID = "#ship-to-zip";
const ORDER_ID = "#search-for-order-input"; // will need adjustment for 2d

// name
const SHIP_TO_NAME_ID = "#ship-to-company";

// constant buttons and parents
const print_button_parent = document.querySelector(PRINT_BUTTON_PARENT_DIV);
const validate_parent = document.querySelector(VALIDATE_PARENT_DIV);
const weigh_button = document.querySelector(WEIGH_BUTTON_ID);
const scan_text_area = document.querySelector(SCAN_TEXT_AREA_ID);
const zip_text = document.querySelector(ZIP_CODE_ID);
const order_id = document.querySelector(ORDER_ID);
const nameField = document.querySelector(SHIP_TO_NAME_ID);

const processed_y_codes = new Set();
const processed_names = new Array();

let ValidateButtonActive = false;
let has_clicked_print_already = false;

let last_y_code = "";
let last_processed_name = "";

// disable animations
//jQuery.fx.off = true;

const detectDuplicates = () => {
  if (processed_y_codes.has(last_y_code)) {
    alert(
      "This Y code has been shipped already! Please stop and figure out why this barcode has been entered twice!",
    );
    return 1;
  }
  return 0;
};

/**
 * Standardizes the patient name for consistent comparison
 */
const getFormattedName = () => {
  // Normalize: Remove extra spaces and convert to lowercase
  return nameField.value.trim().toLowerCase();
};

const getNames = () => {
  processed_names.sort();
  for (const name of processed_names) {
    console.log(name);
  }
}

// take part 0 (first name)
// add all the other parts together if needed
// all other parts go in front, followed by [, ] then part 0  
const commitName = () => {
  name_array = last_processed_name.split(" ");
  let first_name = name_array[0]
  let last_name = name_array[1]
  let size = name_array.length
  if (size > 2) {
    let i = 2;
    while (i < size) {
      last_name = last_name.concat(" ", name_array[i++])
    }
  }
  
  let last_name_first = last_name + ", " + first_name
  processed_names.push(last_name_first);
}

const commitOrderId = () => {
  if (last_y_code == '') {
    return
  }
  processed_y_codes.add(last_y_code);
  console.log(
    `Order ID (y code) added to history. Total count: ${processed_y_codes.size}`,
  );
};

// --- Visual Indicator Logic ---
const createStatusIndicator = () => {
  let indicator = document.getElementById("automation-status-dot");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = "automation-status-dot";
    // Basic styling to keep it floating in the top-left
    Object.assign(indicator.style, {
      position: "fixed",
      top: "20px",
      left: "20px",
      width: "15px",
      height: "15px",
      borderRadius: "50%",
      zIndex: "9999",
      border: "2px solid white",
      boxShadow: "0 0 5px rgba(0,0,0,0.5)",
      transition: "background-color 0.3s ease",
    });
    document.body.appendChild(indicator);
  }
  updateIndicator();
};

/**
 * Ultra-Reliable Value Injection
 * Simulates a full user interaction sequence
 */
const ultraInject = (selector, newValue) => {
  const el = document.querySelector(selector);
  if (!el) return;

  // 1. Focus the element
  el.focus();

  // 2. Set the value
  el.value = newValue;

  // 3. Dispatch the core events
  const eventOptions = { bubbles: true, cancelable: true };

  // Standard change/input events
  el.dispatchEvent(new Event("input", eventOptions));
  el.dispatchEvent(new Event("change", eventOptions));

  // Keyboard simulation (sometimes needed for validation)
  el.dispatchEvent(
    new KeyboardEvent("keydown", { ...eventOptions, key: "Enter" }),
  );
  el.dispatchEvent(
    new KeyboardEvent("keyup", { ...eventOptions, key: "Enter" }),
  );

  // 4. Blur (unfocus) to tell the app you're "done"
  el.dispatchEvent(new Event("blur", eventOptions));

  console.log(`[Automation] Value ${newValue} injected into ${selector}`);
};

const updateIndicator = () => {
  chrome.storage.local.get(["enabled"], (result) => {
    const indicator = document.getElementById("automation-status-dot");
    if (indicator) {
      indicator.style.backgroundColor = result.enabled ? "#4CAF50" : "#f44336";
      indicator.title = `Automation is ${result.enabled ? "ON" : "OFF"}`;
    }
  });
};

/**
 * Error Logic
 * This function scans for error messages and performs actions based on text.
 */
const handleErrors = () => {
  const errors = document.querySelectorAll(ERROR_CONTAINER_SELECTOR);

  if (!errors) {
    return
  }

  //errors.forEach((errorElement) => {
  for (const errorElement of errors) {
    const errorText = errorElement.innerText.trim();

    // Standard Overnight not supported, switch to priority
    if (errorText.includes("STANDARD_OVERNIGHT")) {
      ultraInject("select.service-dd", 371);
      // Destory the object
      errorElement.remove();
      if (has_clicked_print_already) {
        console.log("❌ Swiched to Overnight, reset print.");
        has_clicked_print_already = false;
      }
    }
    // Remove scale could not be read, not useful
    else if (errorText.includes("The USB Scale could not be read.")) {
      errorElement.remove();
    } 
    else if (errorText.includes("Error message from PB Shipping API")) {
      errorElement.remove();
    }
    // agent not connected, user needs to fix it. return an error
    else if (errorText.includes("Peripheral Agent")) {
      return 1;
    }

    // Catch-all for unexpected errors so you can see them in console
    else {
      console.warn("Unrecognized error detected:", errorText);
    }
  }
  return 0;
};

/**
 * Main State Controller
 */
const checkState = () => {
  // Run the error handler first
  let error_report = handleErrors();
  if (error_report == 1) {
    console.log("found error, return early");
    return;
  }

  // Find print button, and reset if needed
  let print_button = print_button_parent.querySelector(PRINT_BUTTON_TAG);

  if (
    print_button.classList.contains("disabled") &&
    has_clicked_print_already
  ) {
    console.log("❌ Ship Button disabled. Resetting latch.");
    has_clicked_print_already = false;
    commitOrderId();
    commitName();
    //scan_text_area.focus()
  }

  // Validate address if the box is open and the button is visibile
  if (validate_parent) {
    const update_button = validate_parent.querySelector(UPDATE_ADDRESS_BUTTON);
    const validate_button_visible =
      update_button &&
      update_button.offsetWidth > 0 &&
      update_button.offsetHeight > 0;

    if (validate_button_visible) {
      console.log("Button detected! Clicking...");
      update_button.click();
      return;
    }
  }

  //console.log("checking validate stauts")

  // Check validate button status
  const validate_button_valid_only = validate_parent.querySelector(
    VALIDATE_BUTTON_VALID,
  );
  // console.log("valid button? ", validate_button_valid_only)
  if (validate_button_valid_only != null) {
    //console.log("Found Valid status")
    if (print_button == null) {
      console.log("Couldn't find print_button");
      return; // if we add other button logic below this needs to be removed
    }
    // console.log("checking ready to ship status");
    const isReadyToShip =
      print_button.classList.contains("btn-success") &&
      !print_button.classList.contains("disabled");
    console.log(
      "ready to ship status was: ",
      isReadyToShip,
      "has clicked print already is: ",
      has_clicked_print_already,
    );

    if (isReadyToShip && !has_clicked_print_already) {
      console.log("✅ Ship Button is Green and Active! Clicking...");
      has_clicked_print_already = true;
      // Check for duplicates
      last_y_code = order_id.value.trim();
      last_processed_name = getFormattedName();
      if (!detectDuplicates()) {
        print_button.click();
      } else {
        console.log("Duplicate Detected, will not click print!");
        return;
      }
    } else if (!isReadyToShip && !has_clicked_print_already) {
      //console.log("Check if app is busy!");
      if (!isAppBusy()) {
        console.log("not busy!");
        weigh_button.click();
        return;
      }
    }
  }
};

/**
 * Observer Setup
 */
const checkEnabledAndRun = () => {
  chrome.storage.local.get(["enabled"], (result) => {
    if (result.enabled) {
      checkState();
    }
  });
};

const observer = new MutationObserver(() => {
  chrome.storage.local.get(["enabled"], (result) => {
    if (result.enabled) {
      checkState();
    }
  });
});

// Listen for the storage changing (so it stops/starts instantly)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    updateIndicator();
    if (changes.enabled.newValue) {
      checkState();
    }
  }
});

const SPINNER_SELECTOR = ".spinner-overlay";

const isAppBusy = () => {
  const spinner = document.querySelector(SPINNER_SELECTOR);
  if (!spinner) return false;

  // Check if it's actually visible to the user
  const isVisible =
    spinner.style.display === "block" ||
    getComputedStyle(spinner).display !== "none";

  return isVisible;
};

createStatusIndicator();

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
});
