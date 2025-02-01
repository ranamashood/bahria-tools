// prettier-ignore
const grades = {
  "A" : 4,
  "A-": 3.67,
  "B+": 3.33,
  "B" : 3,
  "B-": 2.67,
  "C+": 2.33,
  "C" : 2,
  "C-": 1.67,
  "D+": 1.33,
  "D" : 1,
  "F" : 0,
  "N/A": "N/A"
};

const getSemesters = () => {
  const semesters = [];
  const rows = document.querySelectorAll("tr");
  let semesterNum = 0;

  rows.forEach((row) => {
    if (row.children[0].tagName === "TD" && row.children.length === 1) {
      semesters[semesterNum]["oldGpa"] = parseFloat(
        row.children[0].childNodes[2].textContent,
      );
      semesters[semesterNum]["oldCgpa"] = parseFloat(
        row.children[0].childNodes[4].textContent,
      );

      const tbodys = document.getElementsByTagName("tbody");
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td colspan="8" class="text-right">
          <strong>New GPA: </strong>
          <span>
            ${
              isNaN(semesters[semesterNum]["oldGpa"])
                ? "N/A"
                : semesters[semesterNum]["oldGpa"]
            }
          </span>
          <span class="gpa-improved">+0</span>
          <strong>New CGPA: </strong>
          <span>
            ${
              isNaN(semesters[semesterNum]["oldCgpa"])
                ? semesters[semesterNum - 1]["oldCgpa"]
                : semesters[semesterNum]["oldCgpa"]
            }
          </span>
          <span class="cgpa-improved">+0</span>
        </td>
      `;

      semesters[semesterNum]["newGpa"] = tr.children[0].children[1];
      semesters[semesterNum]["increasedGpa"] = tr.children[0].children[2];
      semesters[semesterNum]["newCgpa"] = tr.children[0].children[4];
      semesters[semesterNum]["increasedCgpa"] = tr.children[0].children[5];

      tbodys[++semesterNum].appendChild(tr);
    } else if (row.children[0].tagName === "TD") {
      row.setAttribute("data-semester", semesterNum);
      semesters[semesterNum] ??= {};
      semesters[semesterNum]["courses"] ??= [];
      semesters[semesterNum]["courses"].push(row);
    }
  });

  return semesters;
};

const ignoredCourses = [
  "Fundamentals of Mathematics - I",
  "Fundamentals of Mathematics - II",
];

const calculateGpaHelper = (courses) => {
  let totalCreditHours = 0;
  let totalProduct = 0;

  courses.forEach((course) => {
    const title = course.children[2].textContent;
    if (ignoredCourses.includes(title)) {
      return;
    }

    const creditHours = course.children[4].textContent;
    const product = course.children[7].textContent;

    if (product !== "N/A") {
      totalCreditHours += parseInt(creditHours);
      totalProduct += parseFloat(product);
    }
  });

  const gpa = totalProduct / totalCreditHours;
  const gpaRounded = Math.round((gpa + Number.EPSILON) * 100) / 100;

  return gpaRounded;
};

const calculateGpa = (semesterNum) => {
  const courses = semesters[semesterNum]["courses"];
  const gpa = calculateGpaHelper(courses);

  return gpa;
};

const calculateCgpa = () => {
  const getDistinctCourses = () => {
    const distinctCourses = {};

    semesters.forEach((semester) => {
      semester["courses"].forEach((course) => {
        const title = course.children[2].textContent;
        const product = course.children[7].textContent;
        const isImproved =
          distinctCourses[title] &&
          parseFloat(distinctCourses[title].children[7].textContent) >
            parseFloat(product);

        if (
          product !== "N/A" &&
          !ignoredCourses.includes(title) &&
          !isImproved
        ) {
          distinctCourses[title] = course;
        }
      });
    });

    return Object.values(distinctCourses);
  };

  const courses = getDistinctCourses();
  const cgpa = calculateGpaHelper(courses);

  return cgpa;
};

const getSessionCookie = () => {
  const sessionCookie = document.cookie.split("=")[1];

  return sessionCookie;
};

const semesters = getSemesters();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action == "getCgpa") {
    sendResponse({ msg: calculateCgpa() });
  } else if (request.action == "customCgpa") {
    if (document.getElementsByTagName("select").length !== 0) {
      return;
    }

    semesters.forEach((semester) => {
      semester["courses"].forEach((course) => {
        const selectGrade = document.createElement("select");
        const selectGradePoint = document.createElement("select");

        for (let key of Object.keys(grades)) {
          const grade = course.children[5].textContent;
          const option = document.createElement("option");
          option.innerHTML = key;
          option.value = key;
          selectGrade.appendChild(option);

          if (grade === key) {
            selectGrade.value = grade;
            break;
          }
        }

        for (let value of Object.values(grades)) {
          const gradePoint =
            course.children[6].textContent === "N/A"
              ? "N/A"
              : parseFloat(course.children[6].textContent);
          const option = document.createElement("option");
          option.innerHTML = value;
          option.value = value;
          selectGradePoint.appendChild(option);

          if (gradePoint === value) {
            selectGradePoint.value = gradePoint;
            break;
          }
        }

        selectGrade.addEventListener("change", (e) => {
          const course = e.target.parentElement.parentElement;
          const creditHours = parseInt(course.children[4].textContent);
          const gradePoint = course.children[6].children[0];
          const newGrade = course.children[5].children[0].value;
          const newGradePoints = grades[newGrade];
          const product = course.children[7];
          const semesterNum = parseInt(course.getAttribute("data-semester"));
          const gpa = semesters[semesterNum]["newGpa"];

          gradePoint.value = newGradePoints;
          product.innerHTML =
            newGradePoints === "N/A" ? "N/A" : creditHours * newGradePoints;
          gpa.innerHTML = calculateGpa(semesterNum);
          gpa.innerHTML = gpa.innerHTML === "NaN" ? "N/A" : gpa.innerHTML;

          const newGpa = calculateGpa(semesterNum);
          const increasedGpa = newGpa - semesters[semesterNum]["oldGpa"];
          semesters[semesterNum]["increasedGpa"].innerHTML = isNaN(increasedGpa)
            ? "+0"
            : `+${Math.round((increasedGpa + Number.EPSILON) * 100) / 100}`;

          const newCgpa = calculateCgpa();
          let increasedCgpa =
            newCgpa - semesters[semesters.length - 1]["oldCgpa"];

          if (isNaN(increasedCgpa)) {
            increasedCgpa =
              newCgpa - semesters[semesters.length - 2]["oldCgpa"];
          }

          semesters.forEach((semester) => {
            const cgpa = semester["newCgpa"];
            cgpa.innerHTML = `${newCgpa}`;
            semester["increasedCgpa"].innerHTML = `+${
              Math.round((increasedCgpa + Number.EPSILON) * 100) / 100
            }`;
          });
        });

        selectGradePoint.addEventListener("change", (e) => {
          const course = e.target.parentElement.parentElement;
          const creditHours = parseInt(course.children[4].textContent);
          const grade = course.children[5].children[0];
          const newGradePoints =
            course.children[6].children[0].value === "N/A"
              ? "N/A"
              : parseFloat(course.children[6].children[0].value);
          const newGrade = Object.keys(grades).find(
            (key) => grades[key] === newGradePoints,
          );
          const product = course.children[7];
          const semesterNum = parseInt(course.getAttribute("data-semester"));
          const gpa = semesters[semesterNum]["newGpa"];

          grade.value = newGrade;
          product.innerHTML =
            newGradePoints === "N/A" ? "N/A" : creditHours * newGradePoints;
          gpa.innerHTML = calculateGpa(semesterNum);
          gpa.innerHTML = gpa.innerHTML === "NaN" ? "N/A" : gpa.innerHTML;

          const newGpa = calculateGpa(semesterNum);
          const increasedGpa = newGpa - semesters[semesterNum]["oldGpa"];
          semesters[semesterNum]["increasedGpa"].innerHTML = isNaN(increasedGpa)
            ? "+0"
            : `+${Math.round((increasedGpa + Number.EPSILON) * 100) / 100}`;

          const newCgpa = calculateCgpa();
          let increasedCgpa =
            newCgpa - semesters[semesters.length - 1]["oldCgpa"];

          if (isNaN(increasedCgpa)) {
            increasedCgpa =
              newCgpa - semesters[semesters.length - 2]["oldCgpa"];
          }

          semesters.forEach((semester) => {
            const cgpa = semester["newCgpa"];
            cgpa.innerHTML = `${newCgpa}`;
            semester["increasedCgpa"].innerHTML = `+${
              Math.round((increasedCgpa + Number.EPSILON) * 100) / 100
            }`;
          });
        });

        course.children[5].innerHTML = "";
        course.children[5].appendChild(selectGrade);
        course.children[6].innerHTML = "";
        course.children[6].appendChild(selectGradePoint);
      });
    });
  } else if (request.action == "getSessionCookie") {
    sendResponse({ msg: getSessionCookie() });
  }
});
