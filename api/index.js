const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const FIREBASE_URL = "https://smart-attendace-4d9ff-default-rtdb.firebaseio.com";

  const getTodayIST = () => {
    const istNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const date = new Date(istNow);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const today = getTodayIST();

  try {
    const studentsResp = await fetch(`${FIREBASE_URL}/students.json`);
    const students = await studentsResp.json();

    if (!students) {
      return res.status(200).send("No students found.");
    }

    for (const studentId in students) {
      const studentData = students[studentId];

      const attendanceResp = await fetch(`${FIREBASE_URL}/students/${studentId}/${today}.json`);
      const attendanceToday = await attendanceResp.json();

      if (!attendanceToday) {
        // Get name from latest entry
        const dateKeys = Object.keys(studentData).filter(k =>
          /^\d{4}-\d{2}-\d{2}$/.test(k)
        ).sort();

        let name = "Unknown";
        if (dateKeys.length > 0) {
          const latestDate = dateKeys[dateKeys.length - 1];
          if (studentData[latestDate]?.name) {
            name = studentData[latestDate].name;
          }
        }

        const absentData = {
          date: today,
          status: "absent",
          name: name,
          rollNumber: studentId
        };

        await fetch(`${FIREBASE_URL}/students/${studentId}/${today}.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(absentData)
        });
      }
    }

    res.status(200).send("✅ Absent marking done.");
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error occurred.");
  }
};
