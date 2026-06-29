import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Login/Dashboard/Dashboard";
import ParkIn from "./pages/ParkIn/ParkIn";
import ParkOut from "./pages/ParkOut/ParkOut";
import Invoice from "./pages/Invoice/Invoice";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/parkin" element={<ParkIn />} />
      <Route path="/parkout" element={<ParkOut />} /> 
      <Route path="/invoice" element={<Invoice/>}/>
    </Routes>
  );
}

export default App;