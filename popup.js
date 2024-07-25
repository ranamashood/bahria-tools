document.addEventListener("DOMContentLoaded", () => {
  const result = document.querySelector(".result");
  const resultContent = document.querySelector(".result__content");
  const resultCloseBtn = document.querySelector(".result__close");
  const getCgpaBtn = document.querySelector("#get-cgpa");

  chrome.storage.sync.get(["cgpa"], (storage) => {
    if (storage.cgpa) {
      resultContent.innerHTML = storage.cgpa;
    }
  });

  resultCloseBtn.addEventListener("click", () => {
    result.classList.remove("result--active");
  });

  getCgpaBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getCgpa" }, (response) => {
        console.log(response);

        chrome.storage.sync.set({ cgpa: response.cgpa }, () => {
          resultContent.innerHTML = response.cgpa;
          result.classList.add("result--active");
        });
      });
    });
  });
});
