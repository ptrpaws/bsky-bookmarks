chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "check") {
    chrome.bookmarks.search({ url: request.url }, (results) => {
      sendResponse({ exists: results.length > 0 });
    });
    return true;
  } else if (request.action === "toggle") {
    chrome.bookmarks.getTree(async (bookmarkTree) => {
      let bookmarkBar = bookmarkTree[0].children[0];
      let bskyFolder = bookmarkBar.children.find(
        (child) => child.title === "bsky",
      );

      if (!bskyFolder) {
        bskyFolder = await chrome.bookmarks.create({
          parentId: bookmarkBar.id,
          title: "bsky",
        });
      }

      chrome.bookmarks.search({ url: request.url }, (results) => {
        if (results.length > 0) {
          chrome.bookmarks.remove(results[0].id, () => {
            sendResponse({ created: false });
          });
        } else {
          chrome.bookmarks.create(
            {
              parentId: bskyFolder.id,
              title: request.title,
              url: request.url,
            },
            () => {
              sendResponse({ created: true });
            },
          );
        }
      });
    });
    return true;
  }
});
