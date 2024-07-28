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
  // "N/A": "N/A" // FIXME
};

const getSemesters = () => {
  const semesters = [];
  const rows = document.querySelectorAll("tr");
  let semesterNum = 0;

  rows.forEach((row) => {
    if (row.children[0].tagName === "TD" && row.children.length === 1) {
      const gpaSpan = document.createElement("span");
      gpaSpan.innerHTML = row.children[0].childNodes[2].textContent;
      const parent = row.children[0];
      parent.insertBefore(gpaSpan, parent.childNodes[2]);
      parent.removeChild(parent.childNodes[3]);

      const cgpaSpan = document.createElement("span");
      cgpaSpan.innerHTML = row.children[0].childNodes[4].textContent;
      parent.insertBefore(cgpaSpan, parent.childNodes[4]);
      parent.removeChild(parent.childNodes[5]);

      semesters[semesterNum]["gpa"] = parent.children[1];
      semesters[semesterNum++]["cgpa"] = parent.children[3];
    } else if (row.children[0].tagName === "TD") {
      row.setAttribute("data-semester", semesterNum);
      semesters[semesterNum] ??= {};
      semesters[semesterNum]["courses"] ??= [];
      semesters[semesterNum]["courses"].push(row);
    }
  });

  return semesters;
};

const calculateGpaHelper = (courses) => {
  let totalCreditHours = 0;
  let totalProduct = 0;

  courses.forEach((course) => {
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
        distinctCourses[title] = course;
      });
    });

    return Object.values(distinctCourses);
  };

  const courses = getDistinctCourses();
  const cgpa = calculateGpaHelper(courses);

  return cgpa;
};

const semesters = getSemesters();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action == "getCgpa") {
    sendResponse({ cgpa: calculateCgpa() });
  } else if (request.action == "customCgpa") {
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
          const gradePoint = parseFloat(course.children[6].textContent);
          const option = document.createElement("option");
          option.innerHTML = value;
          option.value = value;
          selectGradePoint.appendChild(option);

          if (gradePoint === value) {
            selectGradePoint.value = gradePoint;
            break;
          }
        }

        selectGrade.addEventListener("click", (e) => {
          const course = e.target.parentElement.parentElement;
          const creditHours = parseInt(course.children[4].textContent);
          const gradePoint = course.children[6].children[0];
          const newGrade = course.children[5].children[0].value;
          const newGradePoints = grades[newGrade];
          const product = course.children[7];
          const semesterNum = parseInt(course.getAttribute("data-semester"));
          const gpa = semesters[semesterNum]["gpa"];
          const cgpa = semesters[semesters.length - 1]["cgpa"];

          gradePoint.value = newGradePoints;
          product.innerHTML = creditHours * newGradePoints;
          gpa.innerHTML = ` ${calculateGpa(semesterNum)}, `;
          cgpa.innerHTML = `${calculateCgpa()} `;
        });

        selectGradePoint.addEventListener("click", (e) => {
          const course = e.target.parentElement.parentElement;
          const creditHours = parseInt(course.children[4].textContent);
          const grade = course.children[5].children[0];
          const newGradePoints = parseFloat(
            course.children[6].children[0].value,
          );
          const newGrade = Object.keys(grades).find(
            (key) => grades[key] === newGradePoints,
          );
          const product = course.children[7];
          const semesterNum = parseInt(course.getAttribute("data-semester"));
          const gpa = semesters[semesterNum]["gpa"];
          const cgpa = semesters[semesters.length - 1]["cgpa"];

          grade.value = newGrade;
          product.innerHTML = creditHours * newGradePoints;
          gpa.innerHTML = ` ${calculateGpa(semesterNum)}, `;
          cgpa.innerHTML = `${calculateCgpa()} `;
        });

        course.children[5].innerHTML = "";
        course.children[5].appendChild(selectGrade);
        course.children[6].innerHTML = "";
        course.children[6].appendChild(selectGradePoint);
      });
    });
  }
});
