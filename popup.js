document.addEventListener("DOMContentLoaded", () => {
  const cgpaElem = document.querySelector("#cgpa");
  const btn = document.querySelector("button");

  chrome.storage.sync.get(["cgpa"], (result) => {
    if (result.cgpa) {
      cgpaElem.innerHTML = result.cgpa;
    }
  });

  btn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getCgpa" }, (response) => {
        console.log(response);

        chrome.storage.sync.set({ cgpa: response.cgpa }, () => {
          cgpaElem.innerHTML = response.cgpa;
        });
        cgpaElem.innerHTML = response.cgpa;
      });
    });
  });
});
