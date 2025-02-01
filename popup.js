document.addEventListener("DOMContentLoaded", () => {
  const result = document.querySelector(".result");
  const resultContent = document.querySelector(".result__content");
  const resultCloseBtn = document.querySelector(".result__close");
  const getCgpaBtn = document.querySelector("#get-cgpa");
  const customCgpaBtn = document.querySelector("#custom-cgpa");
  const getSessionCookieBtn = document.querySelector("#get-session-cookie");

  const examUrl = "https://cms.bahria.edu.pk/Sys/Student/Exams/ExamResult.aspx";
  const lmsUrl = "https://lms.bahria.edu.pk";

  resultCloseBtn.addEventListener("click", () => {
    result.classList.remove("result--active");
  });

  const showResult = (content) => {
    resultContent.innerHTML = content;
    result.classList.add("result--active");
  };

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    let url = tabs[0].url;

    if (url.startsWith(lmsUrl)) {
      return;
    }

    if (!url.startsWith("https://cms.bahria.edu.pk")) {
      showResult("Open <b>CMS</b> first");
      resultCloseBtn.style.display = "none";
      result.classList.add("result--active");
    }
  });

  getCgpaBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let url = tabs[0].url;

      if (url !== examUrl) {
        showResult("Go to <b>Provisional Result</b> page first");
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: "getCgpa" }, (response) => {
        showResult(response.msg);
      });
    });
  });

  customCgpaBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let url = tabs[0].url;

      if (url !== examUrl) {
        showResult("Go to <b>Provisional Result</b> page first");
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "customCgpa" },
        (response) => {
          if (!response) {
            window.close();
          }

          showResult(response.msg);
        },
      );
    });
  });

  getSessionCookieBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let url = tabs[0].url;

      if (!url.startsWith(lmsUrl)) {
        showResult("Go to <b>LMS</b> first");
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "getSessionCookie" },
        (response) => {
          navigator.clipboard.writeText(response.msg);
          showResult("Copied to clipboard!");
        },
      );
    });
  });
});
