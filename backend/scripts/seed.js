import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/employee-attendance");
    console.log("Connected to MongoDB");

    await User.deleteMany({});
    await Attendance.deleteMany({});
    console.log("Cleared existing data");

    // Manager - Use plain password, User model will hash it automatically
    const manager = new User({
      name: "John Manager",
      email: "manager@company.com",
      password: "manager123", // Plain password - will be hashed by User model pre-save hook
      role: "manager",
      employeeId: "MGR001",
      department: "Management",
    });

    await manager.save();
    console.log("Created manager:", manager.email);

    // Employees - Use plain passwords, User model will hash them automatically
    const employees = [
      {
        name: "Alice Johnson",
        email: "alice@company.com",
        password: "employee123", // Plain password - will be hashed by User model
        employeeId: "EMP001",
        department: "Engineering",
      },
      {
        name: "Bob Smith",
        email: "bob@company.com",
        password: "employee123",
        employeeId: "EMP002",
        department: "Engineering",
      },
      {
        name: "Carol Williams",
        email: "carol@company.com",
        password: "employee123",
        employeeId: "EMP003",
        department: "Sales",
      },
      {
        name: "David Brown",
        email: "david@company.com",
        password: "employee123",
        employeeId: "EMP004",
        department: "Sales",
      },
      {
        name: "Eva Davis",
        email: "eva@company.com",
        password: "employee123",
        employeeId: "EMP005",
        department: "HR",
      },
    ];

    for (const emp of employees) {
      const employee = new User(emp);
      await employee.save();
      console.log("Created employee:", employee.email);
    }

    console.log("Seed Completed Successfully");
    process.exit(0);

  } catch (err) {
    console.error("Seed Error:", err);
    process.exit(1);
  }
};

seedData();
