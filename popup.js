document.addEventListener("DOMContentLoaded", () => {
  const result = document.querySelector(".result");
  const resultContent = document.querySelector(".result__content");
  const resultCloseBtn = document.querySelector(".result__close");
  const getCgpaBtn = document.querySelector("#get-cgpa");
  const customCgpaBtn = document.querySelector("#custom-cgpa");

  chrome.storage.sync.get(["cgpa"], (storage) => {
    if (storage.cgpa) {
      resultContent.innerHTML = storage.cgpa;
    }
  });

  resultCloseBtn.addEventListener("click", () => {
    result.classList.remove("result--active");
  });

  const showResult = (content) => {
    resultContent.innerHTML = content;
    result.classList.add("result--active");
  };

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    let url = tabs[0].url;

    if (!url.startsWith("https://cms.bahria.edu.pk")) {
      showResult("Open <strong>CMS</strong> first");
      resultCloseBtn.style.display = "none";
      result.classList.add("result--active");
    }
  });

  getCgpaBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getCgpa" }, (response) => {
        chrome.storage.sync.set({ cgpa: response.msg }, () => {
          showResult(response.msg);
        });
      });
    });
  });

  customCgpaBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "customCgpa" },
        (response) => {
          showResult(response.msg);
        },
      );
    });
  });
});
