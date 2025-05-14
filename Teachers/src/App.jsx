import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./Login/Login"; 
import Register from "./Register/Register";
import Dashboard from "./Pages/Dashboard";
import Sidebar from "./Pages/Sidebar";
import AddStudent from "./Pages/Addstudent";
import AddClass from "./Pages/Addclass";
import ClassFeed from "./Pages/Classfeed";
import CreateTask from "./Pages/Createtask";
import SubjectList from "./Pages/Subjectnav";
import ClassManager from "./Pages/ClassManager";

function App() {
  return (
    <div>
      <Sidebar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="addstudent" element={<AddStudent />} />
         <Route path="addclass" element={<ClassManager />} /> 
        <Route path="classfeed/:id" element={<ClassFeed />} />
        <Route path="createtask" element={<CreateTask />} />
        <Route path="subjectnav" element={<SubjectList />} />
      </Routes>
    </div>
  );
}

export default App;
