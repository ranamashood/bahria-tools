chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getCgpa") {
    const rows = document.querySelectorAll("tr");
    const courses = {};

    rows.forEach((row) => {
      if (
        row.children[0].tagName !== "TH" &&
        row.children.length === 8 &&
        row.children[7].textContent !== "N/A"
      ) {
        const code = row.children[2].textContent;
        const creditHours = row.children[4].textContent;
        const product = row.children[7].textContent;

        courses[code] = {};
        courses[code]["creditHours"] = parseInt(creditHours);
        courses[code]["product"] = parseFloat(product);
      }
    });

    let totalProduct = 0;
    let totalCreditHours = 0;
    const coursesValues = Object.values(courses);

    coursesValues.forEach((courseValues) => {
      totalProduct += courseValues["product"];
      totalCreditHours += courseValues["creditHours"];
    });

    const cgpa = totalProduct / totalCreditHours;
    const cgpaRounded = Math.round((cgpa + Number.EPSILON) * 100) / 100;

    sendResponse({ cgpa: cgpaRounded });
    return true;
  }
});
