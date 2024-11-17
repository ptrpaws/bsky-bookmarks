const BOOKMARK_ICON_PATH = "M6 2h12a2 2 0 0 1 2 2v16l-7-3-7 3V4a2 2 0 0 1 2-2Z";
const COLOR_EXISTS = "rgb(92, 239, 170)";
const COLOR_NOT_EXISTS = "rgb(120, 142, 165)";

async function processDiv(div, testId) {
  // console.log(`Test ID: ${testId}`);
  // console.log("Element:", div);

  let postUrl = await getPostUrl(div);
  // console.log(postUrl);

  let lastButton = getLastButton(div);
  if (lastButton) {
    let cloneDiv = cloneAndInsertDiv(lastButton);
    processButton(cloneDiv.querySelector("button"), postUrl, div);
  }
}

function getPostUrl(div) {
  return new Promise((resolve) => {
    let aElement = div.querySelector('a[dir="auto"]');

    if (aElement) {
      let parentDiv = aElement.parentElement;
      let count = 0;

      while (parentDiv) {
        if (
          parentDiv.getAttribute("aria-label") &&
          parentDiv.getAttribute("aria-label").startsWith("Post by ")
        ) {
          // console.log(`'Post by' found ${count} parent(s) up`); // should be 2 parents up

          setTimeout(() => {
            resolve(window.location.href);
          }, 100);
          return;
        }
        parentDiv = parentDiv.parentElement;
        count++;
      }
      resolve(window.location.origin + aElement.getAttribute("href"));
    } else {
      setTimeout(() => {
        resolve(window.location.href);
      }, 100);
    }
  });
}

function getLastButton(div) {
  let buttonElements = div.querySelectorAll("button");
  return buttonElements[buttonElements.length - 1];
}

function cloneAndInsertDiv(lastButton) {
  let parentDiv = lastButton.parentElement;
  for (let i = 0; i < 2; i++) {
    parentDiv = parentDiv.parentElement;
  }
  let lastDiv = parentDiv.lastElementChild;
  let cloneDiv = lastDiv.cloneNode(true);
  parentDiv.insertBefore(cloneDiv, lastDiv);

  let svgPath = cloneDiv.querySelector("svg path");
  if (svgPath) {
    svgPath.setAttribute("d", BOOKMARK_ICON_PATH);
  }

  return cloneDiv;
}

function processButton(button, postUrl, div) {
  let svgPath = button.querySelector("svg path");
  let fullUrl = postUrl;

  chrome.runtime.sendMessage({ action: "check", url: fullUrl }, (response) => {
    svgPath.style.fill = response.exists ? COLOR_EXISTS : COLOR_NOT_EXISTS;
  });

  button.addEventListener("click", function (event) {
    event.stopPropagation();
    let titleDiv = div.querySelector('div[data-word-wrap="1"]');
    let title = titleDiv ? titleDiv.textContent : document.title;
    chrome.runtime.sendMessage(
      {
        action: "toggle",
        url: fullUrl,
        title: title,
      },
      (response) => {
        svgPath.style.fill = response.created ? COLOR_EXISTS : COLOR_NOT_EXISTS;
      },
    );
  });
}

const observer = new MutationObserver((mutationsList) => {
  for (let mutation of mutationsList) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          let divs = node.querySelectorAll("div[data-testid]");
          divs.forEach((div) => {
            let testId = div.getAttribute("data-testid");
            if (
              testId.startsWith("feedItem-by-") ||
              testId.startsWith("postThreadItem-by-")
            ) {
              processDiv(div, testId);
            }
          });
        }
      });
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
