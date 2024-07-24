document.addEventListener("DOMContentLoaded", () => {
  const resultElem = document.querySelector(".result");
  const getCgpaBtn = document.querySelector("#get-cgpa");

  chrome.storage.sync.get(["cgpa"], (storage) => {
    if (storage.cgpa) {
      resultElem.innerHTML = value;
    }
  });

  getCgpaBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getCgpa" }, (response) => {
        console.log(response);

        chrome.storage.sync.set({ cgpa: response.cgpa }, () => {
          resultElem.innerHTML = response.cgpa;
          resultElem.classList.add("result--active");
        });
      });
    });
  });
});
