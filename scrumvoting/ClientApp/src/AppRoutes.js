import Voting from "./components/Voting";
import { FetchData } from "./components/FetchData";
import Home from "./components/Home";

const AppRoutes = [
  {
    index: true,
    element: <Home />
  },
  {
    path: '/voting',
    element: <Voting />
  }
];

export default AppRoutes;
